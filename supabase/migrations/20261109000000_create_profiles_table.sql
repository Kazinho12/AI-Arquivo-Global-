-- Arquivo Global 2.0 — Migração de Perfis de Utilizador
-- Versão: 20261109000000_create_profiles_table.sql
-- Descrição: Cria a tabela de perfis de utilizador associada ao auth.users, com validações, triggers de auditoria e políticas RLS.

-- 1. Criação da tabela de perfis públicos
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

-- 3. Função e trigger para manter updated_at atualizado automaticamente
CREATE OR REPLACE FUNCTION public.handle_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_updated_at();

-- 4. Função e trigger para criar perfil automático no registo (auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  desired_username TEXT;
  clean_username TEXT;
  desired_name TEXT;
BEGIN
  desired_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  clean_username := regexp_replace(desired_username, '[^a-zA-Z0-9_]', '', 'g');
  IF char_length(clean_username) < 3 THEN
    clean_username := 'autor_' || substr(NEW.id::text, 1, 8);
  END IF;

  desired_name := COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', clean_username);

  INSERT INTO public.profiles (id, username, display_name, bio, created_at, updated_at)
  VALUES (
    NEW.id,
    clean_username,
    desired_name,
    '',
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    INSERT INTO public.profiles (id, username, display_name, bio, created_at, updated_at)
    VALUES (
      NEW.id,
      clean_username || '_' || substr(NEW.id::text, 1, 4),
      desired_name,
      '',
      timezone('utc'::text, now()),
      timezone('utc'::text, now())
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Configuração de Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política 1: Leitura pública de perfis
CREATE POLICY "Perfis públicos são visíveis por todos"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Política 2: O próprio utilizador autenticado pode inserir o seu perfil
CREATE POLICY "Utilizador pode criar o seu próprio perfil"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Política 3: O próprio utilizador autenticado pode atualizar o seu perfil
CREATE POLICY "Utilizador pode atualizar o seu próprio perfil"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 6. Povoamento retroativo para contas já existentes em auth.users
INSERT INTO public.profiles (id, username, display_name, bio, created_at, updated_at)
SELECT
  u.id,
  CASE
    WHEN char_length(regexp_replace(COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)), '[^a-zA-Z0-9_]', '', 'g')) >= 3
    THEN regexp_replace(COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)), '[^a-zA-Z0-9_]', '', 'g')
    ELSE 'autor_' || substr(u.id::text, 1, 8)
  END AS username,
  COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)) AS display_name,
  '',
  COALESCE(u.created_at, timezone('utc'::text, now())),
  timezone('utc'::text, now())
FROM auth.users u
ON CONFLICT (id) DO NOTHING;
