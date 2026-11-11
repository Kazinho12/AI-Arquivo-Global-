-- F2.1: private draft metadata only. Apply manually after review; no chapters/publication.
BEGIN;
CREATE TABLE public.works (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE RESTRICT,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  slug text NOT NULL CHECK (char_length(slug) BETWEEN 1 AND 240 AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 10000),
  type text NOT NULL CHECK (type IN ('Romance','Conto','Poesia','HQ / Comic','Mangá')),
  status text NOT NULL DEFAULT 'draft' CHECK (status = 'draft'),
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility = 'private'),
  language text NOT NULL CHECK (char_length(btrim(language)) BETWEEN 1 AND 60),
  subtitle text NOT NULL DEFAULT '' CHECK (char_length(subtitle) <= 200),
  genre text NOT NULL DEFAULT '' CHECK (char_length(genre) <= 100),
  tags text[] NOT NULL DEFAULT '{}' CHECK (cardinality(tags) <= 20 AND array_position(tags, NULL) IS NULL AND char_length(array_to_string(tags, ',')) <= 1000),
  age_rating text NOT NULL DEFAULT 'Livre' CHECK (age_rating IN ('Livre','+12','+14','+16','+18')),
  content_warnings text[] NOT NULL DEFAULT '{}' CHECK (cardinality(content_warnings) <= 20 AND array_position(content_warnings, NULL) IS NULL AND char_length(array_to_string(content_warnings, ',')) <= 1000),
  cover_accent_color text NOT NULL DEFAULT '#14243B' CHECK (cover_accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, slug)
);
CREATE INDEX works_owner_created_id ON public.works(owner_id, created_at, id);
COMMENT ON TABLE public.works IS 'Private draft metadata. Owner is technical ownership, not public authorship or an editorial publisher.';

CREATE FUNCTION public.guard_private_work_update()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Work identity is immutable' USING ERRCODE = '42501';
  END IF;
  NEW.revision := OLD.revision + 1;
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.guard_private_work_update() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_private_work_update BEFORE UPDATE ON public.works
  FOR EACH ROW EXECUTE FUNCTION public.guard_private_work_update();

ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
CREATE POLICY works_select_own ON public.works FOR SELECT TO authenticated
  USING (owner_id = (SELECT auth.uid()));
CREATE POLICY works_insert_own ON public.works FOR INSERT TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()) AND status = 'draft' AND visibility = 'private');
CREATE POLICY works_update_own ON public.works FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()) AND status = 'draft' AND visibility = 'private');
CREATE POLICY works_delete_own ON public.works FOR DELETE TO authenticated
  USING (owner_id = (SELECT auth.uid()));

REVOKE ALL PRIVILEGES ON TABLE public.works FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, DELETE ON TABLE public.works TO authenticated;
GRANT INSERT (title, slug, description, type, language, subtitle, genre, tags,
  age_rating, content_warnings, cover_accent_color) ON public.works TO authenticated;
GRANT UPDATE (title, description, type, language, subtitle, genre, tags,
  age_rating, content_warnings, cover_accent_color) ON public.works TO authenticated;
COMMIT;
