-- F3.1: explicit publication snapshots. Install manually after verified F2.1/F2.2.
BEGIN;
ALTER TABLE public.works
  DROP CONSTRAINT works_status_check,
  DROP CONSTRAINT works_visibility_check,
  ADD COLUMN public_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  ADD COLUMN first_published_at timestamptz,
  ADD COLUMN last_published_at timestamptz,
  ADD COLUMN withdrawn_at timestamptz,
  ADD COLUMN published_revision integer,
  ADD CONSTRAINT works_status_visibility_check CHECK (
    (status = 'draft' AND visibility = 'private') OR
    (status = 'published' AND visibility = 'public')),
  ADD CONSTRAINT works_publication_dates_check CHECK (
    (first_published_at IS NULL AND last_published_at IS NULL AND published_revision IS NULL AND withdrawn_at IS NULL)
    OR (first_published_at IS NOT NULL AND last_published_at IS NOT NULL AND published_revision IS NOT NULL
      AND last_published_at >= first_published_at AND published_revision > 0)),
  ADD CONSTRAINT works_published_state_check CHECK (status <> 'published' OR
    (first_published_at IS NOT NULL AND last_published_at IS NOT NULL AND published_revision IS NOT NULL
      AND withdrawn_at IS NULL AND archived_at IS NULL));
-- Metadata stays editable by its owner after publication. Column grants still
-- exclude editorial state, ownership, public IDs and publication timestamps.
ALTER POLICY works_update_own ON public.works
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));
ALTER TABLE public.work_entries ADD COLUMN public_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE;

-- A public projection, not the private editing table. Technical ownership and
-- working-copy revisions are deliberately not granted to public API callers.
CREATE TABLE public.published_works (
  id uuid PRIMARY KEY,
  work_id uuid NOT NULL UNIQUE REFERENCES public.works(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  subtitle text NOT NULL,
  description text NOT NULL,
  type text NOT NULL,
  genre text NOT NULL,
  language text NOT NULL,
  age_rating text NOT NULL,
  tags text[] NOT NULL,
  content_warnings text[] NOT NULL,
  cover_accent_color text NOT NULL,
  author_name text,
  author_username text,
  first_published_at timestamptz NOT NULL,
  last_published_at timestamptz NOT NULL,
  is_public boolean NOT NULL DEFAULT false
);
CREATE INDEX published_works_discovery ON public.published_works(last_published_at DESC,id) WHERE is_public;
CREATE TABLE public.published_work_entries (
  id uuid PRIMARY KEY,
  publication_id uuid NOT NULL REFERENCES public.published_works(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('chapter','poem','visual')),
  position integer NOT NULL CHECK (position > 0),
  alignment text NOT NULL CHECK (alignment IN ('left','center')),
  UNIQUE(publication_id,position)
);
ALTER TABLE public.published_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_work_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY published_works_read ON public.published_works FOR SELECT TO anon, authenticated USING (is_public);
CREATE POLICY published_entries_read ON public.published_work_entries FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.published_works p WHERE p.id = publication_id AND p.is_public));
REVOKE ALL PRIVILEGES ON public.published_works, public.published_work_entries FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT(id,slug,title,subtitle,description,type,genre,language,age_rating,tags,content_warnings,
  cover_accent_color,author_name,author_username,first_published_at,last_published_at,is_public)
  ON public.published_works TO anon, authenticated;
GRANT SELECT(id,publication_id,title,content,entry_type,position,alignment)
  ON public.published_work_entries TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.guard_private_work_update()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
    OR NEW.public_id IS DISTINCT FROM OLD.public_id OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Work identity is immutable' USING ERRCODE = '42501';
  END IF;
  IF NEW.archived_at IS NOT NULL AND NEW.status = 'published' THEN
    RAISE EXCEPTION 'Withdraw publication before archiving' USING ERRCODE = '55000';
  END IF;
  IF OLD.archived_at IS NOT NULL AND NEW.archived_at IS NOT NULL THEN
    RAISE EXCEPTION 'Restore archived work before editing' USING ERRCODE = '55000';
  END IF;
  IF NEW.type IS DISTINCT FROM OLD.type AND EXISTS (SELECT 1 FROM public.work_entries WHERE work_id = OLD.id)
    AND (CASE NEW.type WHEN 'Poesia' THEN 'poem' WHEN 'HQ / Comic' THEN 'visual' WHEN 'Mangá' THEN 'visual' ELSE 'chapter' END)
      <> (CASE OLD.type WHEN 'Poesia' THEN 'poem' WHEN 'HQ / Comic' THEN 'visual' WHEN 'Mangá' THEN 'visual' ELSE 'chapter' END) THEN
    RAISE EXCEPTION 'Existing entries incompatible with format' USING ERRCODE = '23514';
  END IF;
  NEW.revision := OLD.revision + 1;
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.guard_private_work_update() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_private_work_update ON public.works;
CREATE TRIGGER guard_private_work_update BEFORE UPDATE ON public.works
  FOR EACH ROW EXECUTE FUNCTION public.guard_private_work_update();

-- Explicit allowlist: never return work_id, owner_id, receipts or draft data.
CREATE FUNCTION public.read_public_work(p_public_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
 SELECT pg_catalog.jsonb_build_object(
   'id',p.id,'slug',p.slug,'title',p.title,'subtitle',p.subtitle,'description',p.description,
   'type',p.type,'genre',p.genre,'language',p.language,'age_rating',p.age_rating,'tags',p.tags,
   'content_warnings',p.content_warnings,'cover_accent_color',p.cover_accent_color,
   'author_name',p.author_name,'author_username',p.author_username,
   'first_published_at',p.first_published_at,'last_published_at',p.last_published_at,
   'entries',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id',e.id,'publication_id',e.publication_id,
        'title',e.title,'content',e.content,'entry_type',e.entry_type,'position',e.position,'alignment',e.alignment) ORDER BY e.position)
      FROM public.published_work_entries e WHERE e.publication_id = p.id),'[]'::jsonb))
 FROM public.published_works p WHERE p.id = p_public_id AND p.is_public;
$$;
REVOKE EXECUTE ON FUNCTION public.read_public_work(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.read_public_work(uuid) TO anon, authenticated;

-- Protected writes are only available here. Working tables remain owner-only;
-- public reads use snapshots, so saving a chapter never publishes a draft.
CREATE FUNCTION public.publish_private_work(p_work_id uuid,p_revision integer,p_action text,p_operation_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  actor uuid := auth.uid();
  source public.works%ROWTYPE;
  receipt public.work_operation_receipts%ROWTYPE;
  fingerprint text;
  published_time timestamptz := pg_catalog.now();
  expected_kind text;
  display_label text;
  username_label text;
BEGIN
  IF actor IS NULL OR p_work_id IS NULL OR p_revision IS NULL OR p_operation_id IS NULL
    OR p_action IS NULL OR p_action NOT IN ('publish','withdraw') THEN
    RAISE EXCEPTION 'Authenticated publication required' USING ERRCODE = '42501';
  END IF;
  fingerprint := pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    'publication:' || p_work_id::text || ':' || p_revision::text || ':' || p_action,'UTF8')),'hex');
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text || ':' || p_operation_id::text,0));
  SELECT * INTO receipt FROM public.work_operation_receipts WHERE owner_id = actor AND operation_id = p_operation_id;
  IF FOUND THEN
    IF receipt.fingerprint <> fingerprint THEN RAISE EXCEPTION 'Operation key reused' USING ERRCODE = '22023'; END IF;
    RETURN pg_catalog.jsonb_build_object('work',public.read_private_work(receipt.result_work_id),'already_applied',true);
  END IF;
  SELECT * INTO source FROM public.works WHERE id = p_work_id AND owner_id = actor FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Work unavailable' USING ERRCODE = '42501'; END IF;
  IF source.revision <> p_revision THEN RAISE EXCEPTION 'Revision conflict' USING ERRCODE = '40001'; END IF;
  IF p_action = 'publish' THEN
    IF source.archived_at IS NOT NULL THEN RAISE EXCEPTION 'Restore before publication' USING ERRCODE = '55000'; END IF;
    IF source.title !~ '[^[:space:]]' OR source.description !~ '[^[:space:]]'
      OR pg_catalog.lower(pg_catalog.btrim(source.description)) = 'sem sinopse definida.'
      OR source.language !~ '[^[:space:]]' OR source.type NOT IN ('Romance','Conto','Poesia','HQ / Comic','Mangá')
      OR source.age_rating NOT IN ('Livre','+12','+14','+16','+18') THEN
      RAISE EXCEPTION 'Valid title, synopsis, format, language and age rating required' USING ERRCODE = '23514';
    END IF;
    expected_kind := CASE source.type WHEN 'Poesia' THEN 'poem' WHEN 'HQ / Comic' THEN 'visual' WHEN 'Mangá' THEN 'visual' ELSE 'chapter' END;
    IF NOT EXISTS (SELECT 1 FROM public.work_entries WHERE work_id = source.id AND content ~ '[^[:space:]]' AND entry_type = expected_kind)
      OR EXISTS (SELECT 1 FROM public.work_entries WHERE work_id = source.id AND content ~ '[^[:space:]]' AND (entry_type <> expected_kind OR title !~ '[^[:space:]]')) THEN
      RAISE EXCEPTION 'At least one valid entry matching the format is required' USING ERRCODE = '23514';
    END IF;
    -- Only fields already intended for public profiles; no Auth metadata/email fallback.
    IF pg_catalog.to_regclass('public.profiles') IS NOT NULL THEN
      SELECT display_name,username INTO display_label,username_label FROM public.profiles WHERE id = actor;
    END IF;
    UPDATE public.works SET status = 'published',visibility = 'public',
      first_published_at = COALESCE(first_published_at,published_time),last_published_at = published_time,
      withdrawn_at = NULL,published_revision = source.revision+1 WHERE id = source.id;
    INSERT INTO public.published_works(id,work_id,slug,title,subtitle,description,type,genre,language,age_rating,tags,
      content_warnings,cover_accent_color,author_name,author_username,first_published_at,last_published_at,is_public)
      VALUES(source.public_id,source.id,source.slug,source.title,source.subtitle,source.description,source.type,source.genre,
        source.language,source.age_rating,source.tags,source.content_warnings,source.cover_accent_color,display_label,username_label,
        COALESCE(source.first_published_at,published_time),published_time,true)
      ON CONFLICT(id) DO UPDATE SET slug=EXCLUDED.slug,title=EXCLUDED.title,subtitle=EXCLUDED.subtitle,description=EXCLUDED.description,
        type=EXCLUDED.type,genre=EXCLUDED.genre,language=EXCLUDED.language,age_rating=EXCLUDED.age_rating,tags=EXCLUDED.tags,
        content_warnings=EXCLUDED.content_warnings,cover_accent_color=EXCLUDED.cover_accent_color,
        author_name=EXCLUDED.author_name,author_username=EXCLUDED.author_username,last_published_at=EXCLUDED.last_published_at,is_public=true;
    DELETE FROM public.published_work_entries WHERE publication_id = source.public_id;
    INSERT INTO public.published_work_entries(id,publication_id,title,content,entry_type,position,alignment)
      SELECT public_id,source.public_id,title,content,entry_type,position,alignment FROM public.work_entries
      WHERE work_id = source.id AND content ~ '[^[:space:]]' ORDER BY position;
  ELSE
    IF source.status = 'published' THEN
      UPDATE public.published_works SET is_public = false WHERE work_id = source.id;
      UPDATE public.works SET status='draft',visibility='private',withdrawn_at=published_time WHERE id=source.id;
    END IF;
  END IF;
  INSERT INTO public.work_operation_receipts(owner_id,operation_id,fingerprint,result_work_id)
    VALUES(actor,p_operation_id,fingerprint,source.id);
  RETURN pg_catalog.jsonb_build_object('work',public.read_private_work(source.id));
END;
$$;
REVOKE EXECUTE ON FUNCTION public.publish_private_work(uuid,integer,text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_private_work(uuid,integer,text,uuid) TO authenticated;
COMMIT;
