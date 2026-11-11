-- F3.3: bounded, invoker-only discovery over authorized publication snapshots.
BEGIN;
CREATE FUNCTION public.discovery_text(value text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE SECURITY INVOKER SET search_path='' AS $$
 SELECT pg_catalog.lower(pg_catalog.regexp_replace(normalize(COALESCE(value,''),NFD),U&'[\0300-\036f]','','g'));
$$;
CREATE FUNCTION public.discovery_tag(value text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE SECURITY INVOKER SET search_path='' AS $$
 SELECT COALESCE(NULLIF(pg_catalog.btrim(pg_catalog.regexp_replace(public.discovery_text(value),'[^[:alnum:]]+','-','g'),'-'),''),pg_catalog.btrim(public.discovery_text(value)));
$$;
CREATE INDEX published_works_first_discovery ON public.published_works(first_published_at DESC,id) WHERE is_public;
CREATE INDEX published_works_title_discovery ON public.published_works(public.discovery_text(title),id) WHERE is_public;
CREATE INDEX published_works_format_genre ON public.published_works(type,genre) WHERE is_public;

CREATE FUNCTION public.search_public_works(p_filters jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
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
 p.cover_accent_color,p.author_name,p.author_username,p.first_published_at,p.last_published_at
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

CREATE FUNCTION public.public_discovery_facets(p_query text DEFAULT '') RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT pg_catalog.jsonb_build_object(
 'genres',COALESCE((SELECT pg_catalog.jsonb_agg(v) FROM (SELECT DISTINCT genre v FROM public.published_works WHERE is_public AND genre<>'' ORDER BY genre LIMIT 100) s),'[]'::jsonb),
 'languages',COALESCE((SELECT pg_catalog.jsonb_agg(v) FROM (SELECT DISTINCT language v FROM public.published_works WHERE is_public ORDER BY language LIMIT 100) s),'[]'::jsonb),
 'warnings',COALESCE((SELECT pg_catalog.jsonb_agg(v) FROM (SELECT DISTINCT v FROM public.published_works p CROSS JOIN LATERAL pg_catalog.unnest(p.content_warnings) v WHERE p.is_public ORDER BY v LIMIT 100) s),'[]'::jsonb),
 'tags',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('key',key,'name',name,'count',n)) FROM
 (SELECT public.discovery_tag(v) key,pg_catalog.min(v) name,pg_catalog.count(DISTINCT p.id)::integer n
 FROM public.published_works p CROSS JOIN LATERAL pg_catalog.unnest(p.tags) v WHERE p.is_public
 AND pg_catalog.strpos(public.discovery_tag(v),public.discovery_tag(pg_catalog.left(COALESCE(p_query,''),100)))>0
 GROUP BY public.discovery_tag(v) ORDER BY public.discovery_tag(v) LIMIT 100) s),'[]'::jsonb));
$$;
REVOKE EXECUTE ON FUNCTION public.discovery_text(text),public.discovery_tag(text),public.search_public_works(jsonb),public.public_discovery_facets(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.discovery_text(text),public.discovery_tag(text),public.search_public_works(jsonb),public.public_discovery_facets(text) TO anon,authenticated;
COMMIT;
