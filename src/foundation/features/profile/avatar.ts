import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthClient } from "../auth/client";
import { publishProfile } from "./cache";
import type { UserProfile } from "./types";
export const avatarMaxBytes = 2 * 1024 * 1024;
export function avatarInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length > 1
    ? (parts[0][0] + parts.at(-1)![0]).toUpperCase()
    : parts[0]?.slice(0, 2).toUpperCase() || "AG";
}
export function safeAvatarUrl(url: string | null) {
  try {
    const parsed = new URL(url ?? "");
    return parsed.protocol === "https:" && parsed.origin !== avatarApiBase
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}
export async function validateAvatar(
  file: Pick<File, "type" | "size" | "arrayBuffer">,
) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw Error("Escolhe uma imagem JPEG, PNG ou WebP. SVG não é permitido.");
  if (file.size <= 0 || file.size > avatarMaxBytes)
    throw Error("A imagem deve ter no máximo 2 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const png =
    bytes[0] === 137 &&
    bytes[1] === 80 &&
    bytes[2] === 78 &&
    bytes[3] === 71 &&
    bytes[4] === 13 &&
    bytes[5] === 10 &&
    bytes[6] === 26 &&
    bytes[7] === 10;
  const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp =
    new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  if (
    !(file.type === "image/png" ? png : file.type === "image/jpeg" ? jpg : webp)
  )
    throw Error("O conteúdo do ficheiro não corresponde ao formato da imagem.");
}
export async function removeAvatar(
  profile: UserProfile,
  client: SupabaseClient | null = getAuthClient(),
): Promise<UserProfile> {
  if (!client) throw Error("O serviço de perfis não está configurado.");
  const { data: identity, error: authError } = await client.auth.getUser();
  if (authError || identity.user?.id !== profile.id)
    throw Error("Só podes alterar a fotografia do teu próprio perfil.");
  const { data, error } = await client
    .from("profiles")
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq("id", profile.id)
    .select("id,username,display_name,bio,avatar_url,created_at,updated_at")
    .single();
  if (error || !data || data.id !== profile.id || data.avatar_url !== null)
    throw Error("Não foi possível remover a fotografia. Tenta novamente.");
  const next: UserProfile = {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    bio: data.bio || "",
    avatarUrl: null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
  publishProfile(next);
  return next;
}

export const avatarApiBase =
  "https://arquivo-global-api.killiandesigner.workers.dev";
export interface AvatarLocation {
  owner: string;
  file: string;
  path: string;
}
/** Worker references must never be used as public img URLs or carry query tokens. */
export function avatarLocation(
  reference: string | null,
): AvatarLocation | null {
  if (!reference) return null;
  let path = reference;
  if (reference.startsWith("https://")) {
    let url: URL;
    try {
      url = new URL(reference);
    } catch {
      return null;
    }
    if (url.origin !== avatarApiBase || url.search || url.hash) return null;
    path = url.pathname;
  }
  const match = path.match(
    /^(?:\/?media\/avatar\/|avatars?\/)?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/([a-z0-9_-]{1,160}\.(?:jpe?g|png|webp))$/i,
  );
  return match
    ? {
        owner: match[1],
        file: match[2],
        path: `/media/avatar/${match[1]}/${match[2]}`,
      }
    : null;
}
/** Public delivery is authorized by the Worker against the current public profile. */
export function publicAvatarUrl(reference: string | null): string | null {
  const location = avatarLocation(reference);
  return location
    ? `${avatarApiBase}/media/avatar/public/${location.owner}/${location.file}`
    : null;
}
function readableError(error: unknown) {
  return (typeof error === "string" ? error : "Resposta inesperada do serviço.")
    .replace(/Bearer\s+\S+/gi, "Bearer [oculto]")
    .replace(
      /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
      "[token oculto]",
    )
    .replace(/[\x00-\x1f]/g, " ")
    .slice(0, 300);
}
async function workerResponse(response: Response) {
  if (response.ok) return;
  const data = await response.json().catch(() => null);
  throw Error(
    `Serviço de fotografias (HTTP ${response.status}): ${readableError(data?.error?.message ?? data?.error ?? data?.message ?? response.statusText)}`,
  );
}
async function sessionForAvatar(client: SupabaseClient | null, owner: string) {
  if (!client) throw Error("O serviço de perfis não está configurado.");
  const { data, error } = await client.auth.getSession();
  if (error || !data.session?.access_token || data.session.user?.id !== owner)
    throw Error(
      "Inicia sessão na conta proprietária para gerir esta fotografia.",
    );
  return data.session.access_token;
}
async function mediaRequest(
  path: string,
  init: RequestInit,
  fetcher: typeof fetch,
) {
  try {
    return await fetcher(avatarApiBase + path, {
      ...init,
      credentials: "omit",
      redirect: "error",
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw Error(
      "Falha de rede ou CORS ao contactar o serviço de fotografias. A fotografia guardada foi preservada.",
    );
  }
}
export async function readPrivateAvatar(
  reference: string,
  client: SupabaseClient | null = getAuthClient(),
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<Blob> {
  const location = avatarLocation(reference);
  if (!location) throw Error("Referência de fotografia inválida.");
  const token = await sessionForAvatar(client, location.owner);
  const response = await mediaRequest(
    location.path,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "image/jpeg,image/png,image/webp",
      },
      signal,
    },
    fetcher,
  );
  await workerResponse(response);
  if (Number(response.headers.get("content-length")) > avatarMaxBytes)
    throw Error("A fotografia recebida excede 2 MB.");
  const blob = await response.blob();
  await validateAvatar(blob);
  return blob;
}
export async function uploadAvatar(
  profile: UserProfile,
  file: File,
  client: SupabaseClient | null = getAuthClient(),
  fetcher: typeof fetch = fetch,
): Promise<UserProfile> {
  await validateAvatar(file);
  const token = await sessionForAvatar(client, profile.id);
  const response = await mediaRequest(
    "/media/avatar",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": file.type,
        Accept: "application/json",
      },
      body: file,
    },
    fetcher,
  );
  await workerResponse(response);
  const result = await response.json().catch(() => null);
  const key = typeof result?.key === "string" ? result.key : null;
  const location = avatarLocation(key);
  if (
    !key ||
    !location ||
    location.owner.toLowerCase() !== profile.id.toLowerCase() ||
    key.startsWith("https://")
  )
    throw Error(
      "O serviço não devolveu uma chave de avatar válida para esta conta. A fotografia anterior foi preservada.",
    );
  // Verify private retrieval before switching the canonical reference. Never DELETE the old file.
  await readPrivateAvatar(key, client, fetcher);
  const currentToken = await sessionForAvatar(client, profile.id);
  let query = client!
    .from("profiles")
    .update({ avatar_url: key, updated_at: new Date().toISOString() })
    .eq("id", profile.id);
  query =
    profile.avatarUrl === null
      ? query.is("avatar_url", null)
      : query.eq("avatar_url", profile.avatarUrl);
  const { data, error } = await query
    .select("id,username,display_name,bio,avatar_url,created_at,updated_at")
    .single()
    .setHeader("Authorization", `Bearer ${currentToken}`);
  if (error || !data || data.id !== profile.id || data.avatar_url !== key)
    throw Error(
      `A fotografia foi enviada, mas não foi possível confirmar os metadados do perfil${error?.code ? ` (${error.code})` : ""}. O ficheiro anterior não foi apagado; atualiza o perfil para confirmar o estado antes de tentar novamente.`,
    );
  const next: UserProfile = {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    bio: data.bio || "",
    avatarUrl: data.avatar_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
  publishProfile(next);
  return next;
}
