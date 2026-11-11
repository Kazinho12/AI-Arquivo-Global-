-- Etapa B, AG-12. Apply AFTER the Etapa A migrations, locally first.
-- Existing ambiguous names require a reviewed resolution; never auto-rename owners.
BEGIN;
LOCK TABLE public.profiles IN SHARE ROW EXCLUSIVE MODE;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles GROUP BY lower(btrim(username)) HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Canonical username collisions exist. Review profiles grouped by lower(btrim(username)); preserve user IDs and resolve names explicitly before retrying.';
  END IF;
END;
$$;
CREATE OR REPLACE FUNCTION public.normalize_profile_username()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.username := pg_catalog.lower(pg_catalog.btrim(NEW.username));
  RETURN NEW;
END;
$$;
-- Trigger-only helper; direct execution is not part of the frontend contract.
REVOKE EXECUTE ON FUNCTION public.normalize_profile_username() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS normalize_profile_username ON public.profiles;
CREATE TRIGGER normalize_profile_username BEFORE INSERT OR UPDATE OF username ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.normalize_profile_username();
-- Case-only normalization changes no ownership, biography or author association.
UPDATE public.profiles SET username = lower(btrim(username)) WHERE username <> lower(btrim(username));
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_canonical_unique ON public.profiles (lower(username));
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_canonical_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_canonical_check CHECK (username = lower(btrim(username)));
-- Existing ownership RLS policies and the safe missing-profile backfill are preserved.
COMMIT;
