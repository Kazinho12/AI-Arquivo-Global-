import { getAuthClient } from "../auth/client";
import { demoWorks, type Work } from "../../data/works";
import { normalizeText, slugify } from "../../lib/discovery";
import {
  validateBio,
  validateDisplayName,
  validateUsername,
  type UserProfile,
} from "./types";

const demoAuthorBios: Record<string, string> = {
  "lia-mavume":
    "Cartógrafa e escritora fascinada por marés, ilhas desabitadas e memórias que resistem ao esquecimento.",
  "tomas-nilo":
    "Ilustrador e criador de histórias em quadrinhos focado em futuros urbanos, arquitetura e tecnologia.",
  "iris-vale":
    "Poeta contemporânea. Escreve sobre distâncias cósmicas, silêncios compartilhados e pequenos encontros cotidianos.",
  "ren-aoki":
    "Mangaká e contista. Apaixonado por folclore, botânica fantástica e viagens noturnas.",
  "eduardo-moraes":
    "Ficcionista e ensaísta explorando mundos sonhados e ruínas da imaginação.",
  "sofia-luz":
    "Escritora de ficção científica especulativa e inteligência sintética.",
  "clara-bastos":
    "Autora independente de romances de formação e narrativas costeiras.",
};

export interface FetchProfileResult {
  profile: UserProfile | null;
  error?: string;
  tableMissing?: boolean;
  unconfigured?: boolean;
}

export interface SaveProfileResult {
  ok: boolean;
  profile?: UserProfile;
  message?: string;
}

export function findAuthorWorks(authorQuery: string): Work[] {
  const normQuery = normalizeText(authorQuery);
  const slugQuery = slugify(authorQuery);
  return demoWorks.filter((work) => {
    const normAuthor = normalizeText(work.author);
    const slugAuthor = slugify(work.author);
    return (
      normAuthor === normQuery ||
      slugAuthor === slugQuery ||
      normAuthor.includes(normQuery)
    );
  });
}

export async function fetchUserProfile(
  username: string,
): Promise<FetchProfileResult> {
  const clean = username.trim().toLowerCase();
  const client = getAuthClient();

  if (client) {
    try {
      const { data, error } = await client
        .from("profiles")
        .select("id, username, display_name, bio, avatar_url, created_at, updated_at")
        .ilike("username", clean)
        .maybeSingle();

      if (error) {
        // PostgREST 42P01: relation does not exist
        if (
          error.code === "42P01" ||
          error.message?.includes("does not exist") ||
          error.code === "PGRST204" ||
          error.code === "PGRST200"
        ) {
          // Table not yet migrated in Supabase
          const fallback = resolveDemoProfile(clean);
          return {
            profile: fallback,
            tableMissing: true,
            error: "A tabela de perfis ainda não foi criada no Supabase.",
          };
        }
        return {
          profile: null,
          error: `Erro ao aceder ao Supabase: ${error.message}`,
        };
      }

      if (data) {
        return {
          profile: {
            id: data.id,
            username: data.username,
            displayName: data.display_name,
            bio: data.bio || "",
            avatarUrl: data.avatar_url || null,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          },
        };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { profile: null, error: message };
    }
  }

  // Fallback to match demo authors from repository
  const demoProfile = resolveDemoProfile(clean);
  if (demoProfile) {
    return { profile: demoProfile };
  }

  return {
    profile: null,
    unconfigured: !client,
  };
}

export async function fetchProfileById(
  userId: string,
): Promise<FetchProfileResult> {
  const client = getAuthClient();
  if (!client) {
    return { profile: null, unconfigured: true };
  }

  try {
    const { data, error } = await client
      .from("profiles")
      .select("id, username, display_name, bio, avatar_url, created_at, updated_at")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      if (
        error.code === "42P01" ||
        error.message?.includes("does not exist") ||
        error.code === "PGRST204" ||
        error.code === "PGRST200"
      ) {
        return {
          profile: null,
          tableMissing: true,
          error: "A tabela 'profiles' ainda não foi criada no Supabase.",
        };
      }
      return { profile: null, error: error.message };
    }

    if (!data) {
      return { profile: null };
    }

    return {
      profile: {
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        bio: data.bio || "",
        avatarUrl: data.avatar_url || null,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (err: unknown) {
    return {
      profile: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function saveUserProfile(
  userId: string,
  payload: { username: string; displayName: string; bio: string },
): Promise<SaveProfileResult> {
  const userErr = validateUsername(payload.username);
  if (userErr) return { ok: false, message: userErr };

  const nameErr = validateDisplayName(payload.displayName);
  if (nameErr) return { ok: false, message: nameErr };

  const bioErr = validateBio(payload.bio);
  if (bioErr) return { ok: false, message: bioErr };

  const client = getAuthClient();
  if (!client) {
    return {
      ok: false,
      message:
        "A base de dados Supabase não está configurada neste ambiente. Define as variáveis de ambiente para gravar alterações reais.",
    };
  }

  const cleanUsername = payload.username.trim().toLowerCase();
  const cleanDisplayName = payload.displayName.trim();
  const cleanBio = payload.bio.trim();

  try {
    const { data, error } = await client
      .from("profiles")
      .upsert(
        {
          id: userId,
          username: cleanUsername,
          display_name: cleanDisplayName,
          bio: cleanBio,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      )
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return {
          ok: false,
          message:
            "Este username já está a ser utilizado por outro autor. Escolhe um diferente.",
        };
      }
      if (
        error.code === "42P01" ||
        error.message?.includes("does not exist")
      ) {
        return {
          ok: false,
          message:
            "A tabela 'profiles' ainda não existe no Supabase. Executa a migração SQL fornecida no painel do Supabase.",
        };
      }
      return { ok: false, message: error.message };
    }

    return {
      ok: true,
      profile: {
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        bio: data.bio || "",
        avatarUrl: data.avatar_url || null,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (err: unknown) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "Ocorreu um erro inesperado ao gravar o perfil.",
    };
  }
}

export function resolveDemoProfile(cleanUsername: string): UserProfile | null {
  const matchedAuthor = demoWorks.find((work) => {
    return (
      slugify(work.author) === cleanUsername ||
      normalizeText(work.author).replace(/\s+/g, "") === cleanUsername
    );
  });

  if (!matchedAuthor) {
    // Check direct slug in demoAuthorBios
    const directBio = demoAuthorBios[cleanUsername];
    if (!directBio) return null;
    const displayName = cleanUsername
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    return {
      id: `demo-${cleanUsername}`,
      username: cleanUsername,
      displayName,
      bio: directBio,
      avatarUrl: null,
      createdAt: "2026-01-01T00:00:00Z",
    };
  }

  const slug = slugify(matchedAuthor.author);
  return {
    id: `demo-${slug}`,
    username: slug,
    displayName: matchedAuthor.author,
    bio:
      demoAuthorBios[slug] ||
      `Autor(a) de histórias publicadas no catálogo aberto do Arquivo Global.`,
    avatarUrl: null,
    createdAt: matchedAuthor.createdAt + "T10:00:00Z",
  };
}
