-- F4.1 local preparation. Requires profiles + publication_catalog; no R2 credentials.
BEGIN;
CREATE TABLE public.profile_follows (
 follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 followed_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (follower_id,followed_id),
 CONSTRAINT profile_follows_no_self CHECK (follower_id <> followed_id)
);
CREATE INDEX profile_follows_followed ON public.profile_follows(followed_id);
ALTER TABLE public.profile_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY profile_follows_read ON public.profile_follows FOR SELECT TO anon,authenticated USING (true);
CREATE POLICY profile_follows_insert_own ON public.profile_follows FOR INSERT TO authenticated
 WITH CHECK (follower_id=(SELECT auth.uid()) AND follower_id<>followed_id);
CREATE POLICY profile_follows_delete_own ON public.profile_follows FOR DELETE TO authenticated
 USING (follower_id=(SELECT auth.uid()));
REVOKE ALL ON public.profile_follows FROM PUBLIC,anon,authenticated;
GRANT SELECT(follower_id,followed_id) ON public.profile_follows TO anon,authenticated;
GRANT INSERT(follower_id,followed_id),DELETE ON public.profile_follows TO authenticated;
-- Snapshot usernames are historical. Join privately by stable ownership and
-- expose only the same public snapshot allowlist, never private work fields.
CREATE FUNCTION public.profile_published_works(p_author_id uuid,p_offset integer DEFAULT 0,p_limit integer DEFAULT 24)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 WITH eligible AS (
 SELECT p.id,p.slug,p.title,p.subtitle,p.description,p.type,p.genre,p.language,p.age_rating,p.tags,p.content_warnings,
 p.cover_accent_color,COALESCE(pg_catalog.to_jsonb(p)->>'cover_style','legacy') AS cover_style,
 COALESCE((pg_catalog.to_jsonb(p)->>'cover_seed')::integer,0) AS cover_seed,
 p.author_name,p.author_username,p.first_published_at,p.last_published_at
 FROM public.published_works p JOIN public.works w ON w.id=p.work_id
 WHERE w.owner_id=p_author_id AND p.is_public AND w.status='published' AND w.visibility='public' AND w.archived_at IS NULL
 AND EXISTS(SELECT 1 FROM public.profiles pr WHERE pr.id=p_author_id)
 ), page AS (
 SELECT * FROM eligible ORDER BY first_published_at DESC,id
 LIMIT GREATEST(1,LEAST(COALESCE(p_limit,24),50)) OFFSET GREATEST(0,COALESCE(p_offset,0))
 ) SELECT pg_catalog.jsonb_build_object('items',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(page) ORDER BY first_published_at DESC,id) FROM page),'[]'::jsonb),'total',(SELECT count(*) FROM eligible));
$$;
REVOKE EXECUTE ON FUNCTION public.profile_published_works(uuid,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.profile_published_works(uuid,integer,integer) TO anon,authenticated;
COMMIT;
