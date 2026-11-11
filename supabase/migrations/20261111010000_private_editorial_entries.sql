-- F2.2 additive upgrade. Manual installation only, after F2.1 has been verified.
BEGIN;
ALTER TABLE public.works ADD COLUMN archived_at timestamptz;
CREATE INDEX works_owner_archive ON public.works(owner_id, archived_at);
CREATE TABLE public.work_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id uuid NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  content text NOT NULL DEFAULT '' CHECK (octet_length(content) <= 1048576),
  entry_type text NOT NULL CHECK (entry_type IN ('chapter','poem','visual')),
  position integer NOT NULL CHECK (position > 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status = 'draft'),
  alignment text NOT NULL DEFAULT 'left' CHECK (alignment IN ('left','center')),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT work_entries_position_unique UNIQUE(work_id,position) DEFERRABLE INITIALLY DEFERRED
);
ALTER TABLE public.work_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY work_entries_select_own ON public.work_entries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.works w WHERE w.id = work_id AND w.owner_id = (SELECT auth.uid())));
REVOKE ALL PRIVILEGES ON TABLE public.work_entries FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.work_entries TO authenticated;

-- Minimal receipts: no content snapshots, no FK to deleted works, no client access.
-- Retained to make retries of a confirmed deletion/duplication safe.
CREATE TABLE public.work_operation_receipts (
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_id uuid NOT NULL,
  fingerprint text NOT NULL,
  result_work_id uuid NOT NULL,
  deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(owner_id,operation_id)
);
ALTER TABLE public.work_operation_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.work_operation_receipts FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.guard_private_work_update()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Work identity is immutable' USING ERRCODE = '42501';
  END IF;
  IF OLD.archived_at IS NOT NULL AND NEW.archived_at IS NOT NULL THEN
    RAISE EXCEPTION 'Restore the archived work before editing' USING ERRCODE = '55000';
  END IF;
  IF NEW.type IS DISTINCT FROM OLD.type AND EXISTS (SELECT 1 FROM public.work_entries WHERE work_id = OLD.id)
    AND (CASE NEW.type WHEN 'Poesia' THEN 'poem' WHEN 'HQ / Comic' THEN 'visual' WHEN 'Mangá' THEN 'visual' ELSE 'chapter' END)
      <> (CASE OLD.type WHEN 'Poesia' THEN 'poem' WHEN 'HQ / Comic' THEN 'visual' WHEN 'Mangá' THEN 'visual' ELSE 'chapter' END) THEN
    RAISE EXCEPTION 'Existing entries are incompatible with the new format' USING ERRCODE = '23514';
  END IF;
  NEW.revision := OLD.revision + 1;
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.guard_private_work_update() FROM PUBLIC, anon, authenticated;
-- F2.1 already binds this function; replace the same trigger (never add a second
-- revision trigger). Also restores the binding if absent or disabled locally.
DROP TRIGGER IF EXISTS guard_private_work_update ON public.works;
CREATE TRIGGER guard_private_work_update BEFORE UPDATE ON public.works
  FOR EACH ROW EXECUTE FUNCTION public.guard_private_work_update();

-- One SQL statement gives a consistent work/entries snapshot, without nested API row truncation.
CREATE FUNCTION public.read_private_work(p_work_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT pg_catalog.to_jsonb(w) || pg_catalog.jsonb_build_object('entries',
    COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(e) ORDER BY e.position)
      FROM public.work_entries e WHERE e.work_id = w.id), '[]'::jsonb))
  FROM public.works w WHERE w.id = p_work_id AND w.owner_id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.read_private_work(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.read_private_work(uuid) TO authenticated;

-- Definer is necessary because entry writes/archival are not granted directly.
-- Actor is derived only from Auth; no client owner/role is trusted. No dynamic SQL.
CREATE FUNCTION public.mutate_private_work(
  p_work_id uuid, p_revision integer, p_action text, p_payload jsonb, p_operation_id uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  actor uuid := auth.uid();
  source public.works%ROWTYPE;
  target public.works%ROWTYPE;
  entry public.work_entries%ROWTYPE;
  receipt public.work_operation_receipts%ROWTYPE;
  fingerprint text;
  result_id uuid;
  entry_id uuid;
  next_position integer;
  entry_kind text;
  ordered_ids uuid[];
  current_ids uuid[];
  is_deleted boolean := false;
  response jsonb;
BEGIN
  IF actor IS NULL OR p_operation_id IS NULL OR p_work_id IS NULL OR p_revision IS NULL
    OR p_action IS NULL OR p_payload IS NULL OR pg_catalog.jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'Authenticated operation required' USING ERRCODE = '42501';
  END IF;
  fingerprint := pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    p_work_id::text || ':' || p_revision::text || ':' || p_action || ':' || p_payload::text, 'UTF8')), 'hex');
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text || ':' || p_operation_id::text,0));
  SELECT * INTO receipt FROM public.work_operation_receipts
    WHERE owner_id = actor AND operation_id = p_operation_id;
  IF FOUND THEN
    IF receipt.fingerprint <> fingerprint THEN
      RAISE EXCEPTION 'Operation key reused with a different request' USING ERRCODE = '22023';
    END IF;
    IF receipt.deleted THEN RETURN pg_catalog.jsonb_build_object('deleted_id',receipt.result_work_id); END IF;
    -- Return the latest state, never an obsolete content snapshot.
    RETURN pg_catalog.jsonb_build_object('work',public.read_private_work(receipt.result_work_id), 'already_applied',true);
  END IF;
  SELECT * INTO source FROM public.works WHERE id = p_work_id AND owner_id = actor FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Work unavailable' USING ERRCODE = '42501'; END IF;
  IF source.revision <> p_revision THEN RAISE EXCEPTION 'Revision conflict' USING ERRCODE = '40001'; END IF;
  IF source.archived_at IS NOT NULL AND p_action NOT IN ('restore','duplicate_work','delete_work','archive') THEN
    RAISE EXCEPTION 'Restore the archived work before editing' USING ERRCODE = '55000';
  END IF;
  result_id := source.id;
  entry_kind := CASE source.type WHEN 'Poesia' THEN 'poem' WHEN 'HQ / Comic' THEN 'visual' WHEN 'Mangá' THEN 'visual' ELSE 'chapter' END;

  IF p_action = 'duplicate_work' THEN
    INSERT INTO public.works(owner_id,title,slug,description,type,language,subtitle,genre,tags,age_rating,content_warnings,cover_accent_color)
      VALUES(actor,pg_catalog.left(source.title,190) || ' (Cópia)', 'copia-' || pg_catalog.gen_random_uuid()::text,
        source.description,source.type,source.language,source.subtitle,source.genre,source.tags,source.age_rating,
        source.content_warnings,source.cover_accent_color) RETURNING * INTO target;
    result_id := target.id;
    INSERT INTO public.work_entries(work_id,title,content,entry_type,position,alignment)
      SELECT target.id,title,content,entry_type,position,alignment FROM public.work_entries WHERE work_id = source.id;
  ELSIF p_action = 'archive' THEN
    IF source.archived_at IS NULL THEN UPDATE public.works SET archived_at = pg_catalog.now() WHERE id = source.id; END IF;
  ELSIF p_action = 'restore' THEN
    IF source.archived_at IS NOT NULL THEN UPDATE public.works SET archived_at = NULL WHERE id = source.id; END IF;
  ELSIF p_action = 'delete_work' THEN
    DELETE FROM public.works WHERE id = source.id;
    is_deleted := true;
  ELSIF p_action = 'add_entry' THEN
    SELECT COALESCE(pg_catalog.max(position),0)+1 INTO next_position FROM public.work_entries WHERE work_id = source.id;
    IF next_position > 1000 THEN RAISE EXCEPTION 'Entry limit reached' USING ERRCODE = '23514'; END IF;
    INSERT INTO public.work_entries(work_id,title,content,entry_type,position)
      VALUES(source.id,COALESCE(NULLIF(pg_catalog.btrim(p_payload->>'title'),''),
        CASE entry_kind WHEN 'poem' THEN 'Poema ' WHEN 'visual' THEN 'Ato ' ELSE 'Capítulo ' END || next_position::text),
        '',entry_kind,next_position);
    UPDATE public.works SET title = title WHERE id = source.id;
  ELSIF p_action IN ('save_entry','duplicate_entry','delete_entry') THEN
    entry_id := (p_payload->>'entry_id')::uuid;
    SELECT * INTO entry FROM public.work_entries WHERE id = entry_id AND work_id = source.id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Entry unavailable' USING ERRCODE = '42501'; END IF;
    IF entry.revision IS DISTINCT FROM (p_payload->>'entry_revision')::integer THEN
      RAISE EXCEPTION 'Entry revision conflict' USING ERRCODE = '40001';
    END IF;
    IF p_action = 'save_entry' THEN
      UPDATE public.work_entries SET title = p_payload->>'title', content = p_payload->>'content',
        alignment = COALESCE(p_payload->>'alignment','left'), revision = revision+1, updated_at = pg_catalog.now()
        WHERE id = entry.id;
    ELSIF p_action = 'duplicate_entry' THEN
      SELECT COALESCE(pg_catalog.max(position),0)+1 INTO next_position FROM public.work_entries WHERE work_id = source.id;
      IF next_position > 1000 THEN RAISE EXCEPTION 'Entry limit reached' USING ERRCODE = '23514'; END IF;
      INSERT INTO public.work_entries(work_id,title,content,entry_type,position,alignment)
        VALUES(source.id,pg_catalog.left(entry.title,190) || ' (Cópia)',entry.content,entry.entry_type,next_position,entry.alignment);
    ELSE
      DELETE FROM public.work_entries WHERE id = entry.id;
      UPDATE public.work_entries SET position = position-1, revision = revision+1, updated_at = pg_catalog.now()
        WHERE work_id = source.id AND position > entry.position;
    END IF;
    UPDATE public.works SET title = title WHERE id = source.id;
  ELSIF p_action = 'reorder_entries' THEN
    IF pg_catalog.jsonb_typeof(p_payload->'ids') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Order must be an array' USING ERRCODE = '22023';
    END IF;
    SELECT COALESCE(pg_catalog.array_agg(value::uuid ORDER BY ordinal),'{}'::uuid[]) INTO ordered_ids
      FROM pg_catalog.jsonb_array_elements_text(p_payload->'ids') WITH ORDINALITY AS items(value,ordinal);
    SELECT COALESCE(pg_catalog.array_agg(id ORDER BY id),'{}'::uuid[]) INTO current_ids FROM public.work_entries WHERE work_id = source.id;
    IF pg_catalog.cardinality(ordered_ids) <> pg_catalog.cardinality(current_ids)
      OR (SELECT COALESCE(pg_catalog.array_agg(id ORDER BY id),'{}'::uuid[]) FROM (SELECT DISTINCT pg_catalog.unnest(ordered_ids) AS id) ids) <> current_ids
      OR pg_catalog.array_position(ordered_ids,NULL) IS NOT NULL THEN
      RAISE EXCEPTION 'Order must include every entry exactly once' USING ERRCODE = '22023';
    END IF;
    UPDATE public.work_entries e SET position = ordering.ordinal::integer,
      revision = e.revision+1, updated_at = pg_catalog.now()
      FROM pg_catalog.unnest(ordered_ids) WITH ORDINALITY AS ordering(id,ordinal)
      WHERE e.id = ordering.id AND e.work_id = source.id;
    UPDATE public.works SET title = title WHERE id = source.id;
  ELSE
    RAISE EXCEPTION 'Unsupported editorial operation' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.work_operation_receipts(owner_id,operation_id,fingerprint,result_work_id,deleted)
    VALUES(actor,p_operation_id,fingerprint,result_id,is_deleted);
  IF is_deleted THEN response := pg_catalog.jsonb_build_object('deleted_id',result_id);
  ELSE response := pg_catalog.jsonb_build_object('work',public.read_private_work(result_id)); END IF;
  RETURN response;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.mutate_private_work(uuid,integer,text,jsonb,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mutate_private_work(uuid,integer,text,jsonb,uuid) TO authenticated;
COMMIT;
