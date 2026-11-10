-- Arquivo Global — perfis seguros, instalação nova. Não executar remotamente nesta etapa.
-- Local only. This file and the follow-up are safe for fresh/existing profiles tables.
BEGIN;
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  
  -- Restrições de integridade
  CONSTRAINT username_length_check CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT username_format_check CHECK (username ~ '^[a-zA-Z0-9_]+$'),
  CONSTRAINT display_name_length_check CHECK (char_length(display_name) >= 1 AND char_length(display_name) <= 60),
  CONSTRAINT bio_length_check CHECK (char_length(bio) <= 500)
);

-- Comentários descritivos
COMMENT ON TABLE public.profiles IS 'Perfis públicos de leitores e criadores do Arquivo Global';
COMMENT ON COLUMN public.profiles.id IS 'Identificador do utilizador, sincronizado com auth.users.id';
COMMENT ON COLUMN public.profiles.username IS 'Nome de utilizador único para URL (/utilizadores/:username)';
COMMENT ON COLUMN public.profiles.display_name IS 'Nome de apresentação público do utilizador';
COMMENT ON COLUMN public.profiles.bio IS 'Pequena biografia do perfil (máx. 500 caracteres)';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL ou referência segura para o avatar do utilizador';

-- 2. Índices de pesquisa rápida
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles (lower(username));


CREATE OR REPLACE FUNCTION public.handle_profile_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Provision only missing profiles. Existing IDs and profile values are preserved.
CREATE OR REPLACE FUNCTION public.ensure_user_profile(
  p_id uuid, p_email text, p_metadata jsonb, p_created_at timestamptz
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  base_username text;
  candidate text;
  display_label text;
  suffix text;
  attempt integer;
  inserted_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_id) THEN RETURN true; END IF;
  base_username := pg_catalog.left(pg_catalog.lower(pg_catalog.regexp_replace(
    COALESCE(NULLIF(pg_catalog.btrim(p_metadata->>'username'), ''),
      NULLIF(pg_catalog.split_part(p_email, '@', 1), ''), 'autor'),
    '[^a-zA-Z0-9_]', '', 'g')), 30);
  IF pg_catalog.char_length(base_username) < 3 THEN base_username := 'autor'; END IF;
  display_label := pg_catalog.left(COALESCE(
    NULLIF(pg_catalog.btrim(p_metadata->>'display_name'), ''),
    NULLIF(pg_catalog.btrim(p_metadata->>'name'), ''), base_username), 60);

  FOR attempt IN 0..63 LOOP
    IF attempt = 0 THEN candidate := base_username;
    ELSE
      suffix := '_' || pg_catalog.substr(pg_catalog.md5(p_id::text || ':' || attempt::text), 1, 20);
      candidate := pg_catalog.left(base_username, 30 - pg_catalog.char_length(suffix)) || suffix;
    END IF;
    -- Serializes competing generated names, including differently cased legacy names.
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('ag-profile:' || candidate, 0));
    IF EXISTS (SELECT 1 FROM public.profiles WHERE pg_catalog.lower(username) = candidate) THEN CONTINUE; END IF;
    INSERT INTO public.profiles (id, username, display_name, bio, created_at, updated_at)
      VALUES (p_id, candidate, display_label, '', COALESCE(p_created_at, now()), now())
      ON CONFLICT DO NOTHING RETURNING id INTO inserted_id;
    IF inserted_id IS NOT NULL OR EXISTS (SELECT 1 FROM public.profiles WHERE id = p_id) THEN RETURN true; END IF;
  END LOOP;
  RAISE WARNING 'Profile provisioning deferred for user %: name allocation exhausted', p_id;
  RETURN false;
EXCEPTION WHEN OTHERS THEN
  -- No user metadata or SQL error text is emitted. Registration must remain available.
  RAISE WARNING 'Profile provisioning deferred for user % (SQLSTATE %)', p_id, SQLSTATE;
  RETURN false;
END;
$$;
REVOKE ALL ON FUNCTION public.ensure_user_profile(uuid, text, jsonb, timestamptz) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.ensure_user_profile(NEW.id, NEW.email, NEW.raw_user_meta_data, NEW.created_at);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Profile provisioning deferred for user % (SQLSTATE %)', NEW.id, SQLSTATE;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_updated_at();
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Perfis públicos são visíveis por todos" ON public.profiles;
CREATE POLICY "Perfis públicos são visíveis por todos" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Utilizador pode criar o seu próprio perfil" ON public.profiles;
CREATE POLICY "Utilizador pode criar o seu próprio perfil" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Utilizador pode atualizar o seu próprio perfil" ON public.profiles;
CREATE POLICY "Utilizador pode atualizar o seu próprio perfil" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Isolated per account: one rejected row does not roll back the remaining backfill.
DO $$
DECLARE account record;
BEGIN
  FOR account IN SELECT u.id, u.email, u.raw_user_meta_data, u.created_at
    FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id
    WHERE p.id IS NULL ORDER BY u.id
  LOOP
    BEGIN
      PERFORM public.ensure_user_profile(account.id, account.email, account.raw_user_meta_data, account.created_at);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Backfill deferred for user % (SQLSTATE %)', account.id, SQLSTATE;
    END;
  END LOOP;
END;
$$;
COMMIT;
