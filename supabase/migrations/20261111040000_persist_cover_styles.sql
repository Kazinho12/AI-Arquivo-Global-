-- F3.4: private cover styles and explicitly confirmed public snapshots.
-- Apply manually after F3.3, then enable VITE_ENABLE_COVER_STYLE=true.
BEGIN;
ALTER TABLE public.works
 ADD COLUMN cover_style text NOT NULL DEFAULT 'legacy'
 CONSTRAINT works_cover_style_check CHECK (cover_style IN ('legacy','minimalist','geometric','lyric','bold','monolith'));
ALTER TABLE public.published_works
 ADD COLUMN cover_style text NOT NULL DEFAULT 'legacy'
 CONSTRAINT published_works_cover_style_check CHECK (cover_style IN ('legacy','minimalist','geometric','lyric','bold','monolith'));
-- Existing row/table privileges and RLS remain intact. No public writes.
GRANT SELECT(cover_style), INSERT(cover_style), UPDATE(cover_style) ON public.works TO authenticated;
GRANT SELECT(cover_style) ON public.published_works TO anon,authenticated;
-- Exact existing RPC bodies with only cover_style transport added.
CREATE OR REPLACE FUNCTION public.mutate_private_work(
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
    INSERT INTO public.works(owner_id,title,slug,description,type,language,subtitle,genre,tags,age_rating,content_warnings,cover_accent_color,cover_style)
      VALUES(actor,pg_catalog.left(source.title,190) || ' (Cópia)', 'copia-' || pg_catalog.gen_random_uuid()::text,
        source.description,source.type,source.language,source.subtitle,source.genre,source.tags,source.age_rating,
        source.content_warnings,source.cover_accent_color,source.cover_style) RETURNING * INTO target;
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

CREATE OR REPLACE FUNCTION public.publish_private_work(p_work_id uuid,p_revision integer,p_action text,p_operation_id uuid)
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
      content_warnings,cover_accent_color,cover_style,author_name,author_username,first_published_at,last_published_at,is_public)
      VALUES(source.public_id,source.id,source.slug,source.title,source.subtitle,source.description,source.type,source.genre,
        source.language,source.age_rating,source.tags,source.content_warnings,source.cover_accent_color,source.cover_style,display_label,username_label,
        COALESCE(source.first_published_at,published_time),published_time,true)
      ON CONFLICT(id) DO UPDATE SET slug=EXCLUDED.slug,title=EXCLUDED.title,subtitle=EXCLUDED.subtitle,description=EXCLUDED.description,
        type=EXCLUDED.type,genre=EXCLUDED.genre,language=EXCLUDED.language,age_rating=EXCLUDED.age_rating,tags=EXCLUDED.tags,
        content_warnings=EXCLUDED.content_warnings,cover_accent_color=EXCLUDED.cover_accent_color,cover_style=EXCLUDED.cover_style,
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

CREATE OR REPLACE FUNCTION public.read_public_work(p_public_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
 SELECT pg_catalog.jsonb_build_object(
   'id',p.id,'slug',p.slug,'title',p.title,'subtitle',p.subtitle,'description',p.description,
   'type',p.type,'genre',p.genre,'language',p.language,'age_rating',p.age_rating,'tags',p.tags,
   'content_warnings',p.content_warnings,'cover_accent_color',p.cover_accent_color,'cover_style',p.cover_style,
   'author_name',p.author_name,'author_username',p.author_username,
   'first_published_at',p.first_published_at,'last_published_at',p.last_published_at,
   'entries',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id',e.id,'publication_id',e.publication_id,
        'title',e.title,'content',e.content,'entry_type',e.entry_type,'position',e.position,'alignment',e.alignment) ORDER BY e.position)
      FROM public.published_work_entries e WHERE e.publication_id = p.id),'[]'::jsonb))
 FROM public.published_works p WHERE p.id = p_public_id AND p.is_public;
$$;

CREATE OR REPLACE FUNCTION public.search_public_works(p_filters jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE
 q text; family text; kind text; genre_filter text; lang text; age text; sorting text; scope text;
 wanted_tags text[]; wanted_warnings text[]; requested integer; page_size integer; total integer; page integer; result jsonb;
BEGIN
 IF p_filters IS NULL OR pg_catalog.jsonb_typeof(p_filters)<>'object'
   OR pg_catalog.length(COALESCE(p_filters->>'query',''))>200
   OR pg_catalog.length(COALESCE(p_filters->>'genre',''))>100
   OR pg_catalog.length(COALESCE(p_filters->>'language',''))>60 THEN
   RAISE EXCEPTION 'Invalid discovery parameters' USING ERRCODE='22023'; END IF;
 q:=pg_catalog.btrim(public.discovery_text(p_filters->>'query'));
 family:=COALESCE(p_filters->>'family','');
 kind:=COALESCE(p_filters->>'format','');genre_filter:=COALESCE(p_filters->>'genre','');
 lang:=COALESCE(p_filters->>'language','');age:=COALESCE(p_filters->>'age','');
 sorting:=COALESCE(p_filters->>'sort','recentes');scope:=COALESCE(p_filters->>'scope','todos');
 IF family NOT IN ('','literaria','visual') OR kind NOT IN ('','Romance','Conto','Poesia','HQ / Comic','Mangá')
   OR age NOT IN ('','Livre','+12','+14','+16','+18')
   OR sorting NOT IN ('recentes','atualizadas','titulo','antigas','autor')
   OR scope NOT IN ('todos','titulo','subtitulo','autor','sinopse','tags') THEN
   RAISE EXCEPTION 'Invalid discovery filters' USING ERRCODE='22023'; END IF;
 IF COALESCE(p_filters->>'page','1') !~ '^[0-9]{1,5}$'
 OR COALESCE(p_filters->>'size','12') !~ '^[0-9]{1,2}$' THEN
   RAISE EXCEPTION 'Invalid discovery pagination' USING ERRCODE='22023'; END IF;
 requested:=GREATEST(1,LEAST(10000,COALESCE((p_filters->>'page')::integer,1)));
 page_size:=GREATEST(1,LEAST(24,COALESCE((p_filters->>'size')::integer,12)));
 IF pg_catalog.jsonb_typeof(COALESCE(p_filters->'tags','[]'::jsonb))<>'array'
 OR pg_catalog.jsonb_typeof(COALESCE(p_filters->'warnings','[]'::jsonb))<>'array'
 OR pg_catalog.jsonb_array_length(COALESCE(p_filters->'tags','[]'::jsonb))>10
 OR pg_catalog.jsonb_array_length(COALESCE(p_filters->'warnings','[]'::jsonb))>10 THEN
  RAISE EXCEPTION 'Invalid tag filters' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM pg_catalog.jsonb_array_elements(COALESCE(p_filters->'tags','[]'::jsonb)||COALESCE(p_filters->'warnings','[]'::jsonb)) item
 WHERE pg_catalog.jsonb_typeof(item)<>'string' OR pg_catalog.length(item#>>'{}')>100) THEN
  RAISE EXCEPTION 'Invalid tag value' USING ERRCODE='22023'; END IF;
 SELECT COALESCE(pg_catalog.array_agg(public.discovery_tag(value)),ARRAY[]::text[]) INTO wanted_tags
 FROM pg_catalog.jsonb_array_elements_text(COALESCE(p_filters->'tags','[]'::jsonb));
 SELECT COALESCE(pg_catalog.array_agg(public.discovery_text(value)),ARRAY[]::text[]) INTO wanted_warnings
 FROM pg_catalog.jsonb_array_elements_text(COALESCE(p_filters->'warnings','[]'::jsonb));
 -- No dynamic SQL or private-table joins. RLS is applied as the caller.
 WITH matches AS NOT MATERIALIZED (
 SELECT p.id,p.slug,p.title,p.subtitle,p.description,p.type,p.genre,p.language,p.age_rating,p.tags,p.content_warnings,
 p.cover_accent_color,p.cover_style,p.author_name,p.author_username,p.first_published_at,p.last_published_at
 FROM public.published_works p WHERE p.is_public
 AND (family='' OR (family='visual' AND p.type IN ('HQ / Comic','Mangá')) OR (family='literaria' AND p.type NOT IN ('HQ / Comic','Mangá')))
 AND (kind='' OR p.type=kind) AND (genre_filter='' OR public.discovery_text(p.genre)=public.discovery_text(genre_filter))
 AND (lang='' OR public.discovery_text(p.language)=public.discovery_text(lang)) AND (age='' OR p.age_rating=age)
 AND NOT EXISTS(SELECT 1 FROM pg_catalog.unnest(wanted_tags) t WHERE NOT EXISTS(SELECT 1 FROM pg_catalog.unnest(p.tags) v WHERE public.discovery_tag(v)=t))
 AND NOT EXISTS(SELECT 1 FROM pg_catalog.unnest(wanted_warnings) t WHERE NOT EXISTS(SELECT 1 FROM pg_catalog.unnest(p.content_warnings) v WHERE public.discovery_text(v)=t))
 AND NOT EXISTS(SELECT 1 FROM pg_catalog.regexp_split_to_table(q,'\s+') term WHERE term<>'' AND pg_catalog.strpos(public.discovery_text(
 CASE scope WHEN 'titulo' THEN p.title WHEN 'subtitulo' THEN p.subtitle WHEN 'sinopse' THEN p.description
 WHEN 'autor' THEN COALESCE(p.author_name,'')||' '||COALESCE(p.author_username,'') WHEN 'tags' THEN pg_catalog.array_to_string(p.tags,' ')
 ELSE p.title||' '||p.subtitle||' '||p.description||' '||COALESCE(p.author_name,'')||' '||COALESCE(p.author_username,'')||' '||pg_catalog.array_to_string(p.tags,' ') END),term)=0)
 ), counts AS (SELECT count(*)::integer AS n FROM matches), bounds AS (
 SELECT n,LEAST(requested,GREATEST(1,(n+page_size-1)/page_size)) AS current_page FROM counts
 ), selection AS (
 SELECT m.* FROM matches m ORDER BY
 CASE WHEN sorting='titulo' THEN public.discovery_text(m.title) END ASC,
 CASE WHEN sorting='autor' THEN public.discovery_text(m.author_name) END ASC,
 CASE WHEN sorting='recentes' THEN m.first_published_at END DESC,
 CASE WHEN sorting='atualizadas' THEN m.last_published_at END DESC,
 CASE WHEN sorting='antigas' THEN m.first_published_at END ASC,m.id ASC
 LIMIT page_size OFFSET ((SELECT current_page FROM bounds)-1)*page_size
 ) SELECT pg_catalog.jsonb_build_object('items',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(s)) FROM selection s),'[]'::jsonb),
 'total',n,'page',current_page,'size',page_size) INTO result FROM bounds;
 RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.mutate_private_work(uuid,integer,text,jsonb,uuid), public.publish_private_work(uuid,integer,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mutate_private_work(uuid,integer,text,jsonb,uuid), public.publish_private_work(uuid,integer,text,uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.read_public_work(uuid),public.search_public_works(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.read_public_work(uuid),public.search_public_works(jsonb) TO anon,authenticated;
COMMIT;
