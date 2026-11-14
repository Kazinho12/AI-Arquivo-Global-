import { getAuthClient } from "../auth/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { COVER_MAX_BYTES } from "./covers";
const API = "https://arquivo-global-api.killiandesigner.workers.dev";
export async function validateCover(file: Blob) {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size < 1 ||
    file.size > COVER_MAX_BYTES
  )
    throw Error("Escolhe uma imagem JPEG, PNG ou WebP até 5 MB.");
  const b = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const actual =
    b[0] === 255 && b[1] === 216
      ? "image/jpeg"
      : b[0] === 137 && b[1] === 80 && b[2] === 78 && b[3] === 71
        ? "image/png"
        : String.fromCharCode(...b.slice(0, 4)) === "RIFF" &&
            String.fromCharCode(...b.slice(8, 12)) === "WEBP"
          ? "image/webp"
          : null;
  if (actual !== file.type)
    throw Error("O conteúdo não corresponde ao formato da imagem.");
}
export async function coverRequest(
  path: string,
  init: RequestInit,
  ownerId: string,
  client: SupabaseClient | null = getAuthClient(),
  fetcher: typeof fetch = fetch,
) {
  if (!client) throw Error("Serviço de conta indisponível.");
  const { data, error } = await client.auth.getSession();
  if (error || data.session?.user.id !== ownerId || !data.session.access_token)
    throw Error("Inicia sessão na conta proprietária.");
  let response: Response;
  try {
    response = await fetcher(API + path, {
      ...init,
      credentials: "omit",
      redirect: "error",
      cache: "no-store",
      headers: {
        ...init.headers,
        Authorization: `Bearer ${data.session.access_token}`,
      },
    });
  } catch {
    throw Error(
      "Falha de rede no serviço de capas. A capa anterior foi preservada.",
    );
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw Error(
      `Serviço de capas (HTTP ${response.status}): ${typeof body?.message === "string" && body.message.length < 200 ? body.message : "Operação indisponível. A capa anterior foi preservada."}`,
    );
  }
  // Do not attach an image if the account changed while uploading.
  const current = await client.auth.getSession();
  if (current.data.session?.user.id !== ownerId)
    throw Error("A conta mudou. O upload não foi associado à obra.");
  return response;
}
export async function uploadCover(
  workId: string,
  ownerId: string,
  file: File,
  client?: SupabaseClient | null,
  fetcher?: typeof fetch,
) {
  await validateCover(file);
  const response = await coverRequest(
    `/media/cover/works/${workId}`,
    { method: "POST", body: file, headers: { "Content-Type": file.type } },
    ownerId,
    client,
    fetcher,
  );
  const result = await response.json();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      result?.assetId,
    )
  )
    throw Error(
      "O serviço não confirmou uma referência válida. A capa anterior foi preservada.",
    );
  return result.assetId as string;
}
