import { getAuthClient } from "../auth/client";
import type { Work } from "../../data/works";
import { publishProfile, profileVersion, cachedProfile } from "./cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  normalizeUsername,
  validateBio,
  validateDisplayName,
  validateUsername,
  type UserProfile,
} from "./types";

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

export function findAuthorWorks(authorId: string): Work[] {
  return [];
}
export async function fetchUserProfile(
  username: string,
  client: SupabaseClient | null = getAuthClient(),
): Promise<FetchProfileResult> {
  const clean = normalizeUsername(username);
  if (validateUsername(clean)) return { profile: null };

  if (client) {
    try {
      const { data, error } = await client
        .from("profiles")
        .select(
          "id, username, display_name, bio, avatar_url, created_at, updated_at",
        )
        .eq("username", clean)
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
          return {
            profile: null,
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

  return {
    profile: null,
    unconfigured: !client,
  };
}

export async function fetchProfileById(
  userId: string,
  client: SupabaseClient | null = getAuthClient(),
): Promise<FetchProfileResult> {
  if (!client) {
    return { profile: null, unconfigured: true };
  }

  const startedVersion = profileVersion(userId);
  try {
    const { data, error } = await client
      .from("profiles")
      .select(
        "id, username, display_name, bio, avatar_url, created_at, updated_at",
      )
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

    const profile: UserProfile = {
      id: data.id,
      username: data.username,
      displayName: data.display_name,
      bio: data.bio || "",
      avatarUrl: data.avatar_url || null,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
    const latest = cachedProfile(userId);
    if (latest && profileVersion(userId) !== startedVersion)
      return { profile: latest };
    publishProfile(profile);
    return { profile };
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
  client: SupabaseClient | null = getAuthClient(),
): Promise<SaveProfileResult> {
  const userErr = validateUsername(payload.username);
  if (userErr) return { ok: false, message: userErr };

  const nameErr = validateDisplayName(payload.displayName);
  if (nameErr) return { ok: false, message: nameErr };

  const bioErr = validateBio(payload.bio);
  if (bioErr) return { ok: false, message: bioErr };

  if (!client) {
    return {
      ok: false,
      message:
        "A base de dados Supabase não está configurada neste ambiente. Define as variáveis de ambiente para gravar alterações reais.",
    };
  }

  const cleanUsername = normalizeUsername(payload.username);
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
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return {
          ok: false,
          message:
            "A tabela 'profiles' ainda não existe no Supabase. Executa a migração SQL fornecida no painel do Supabase.",
        };
      }
      return { ok: false, message: error.message };
    }

    const profile: UserProfile = {
      id: data.id,
      username: data.username,
      displayName: data.display_name,
      bio: data.bio || "",
      avatarUrl: data.avatar_url || null,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
    publishProfile(profile);
    return { ok: true, profile };
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

/** Compatibility helper: profiles are never synthesized locally. */
export function resolveDemoProfile(_username: string): UserProfile | null {
  return null;
}
