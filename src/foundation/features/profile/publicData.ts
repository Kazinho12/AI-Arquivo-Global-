import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicClient, mapPublishedWork } from "../catalog/repository";
export async function fetchProfileWorks(
  id: string,
  offset = 0,
  client: SupabaseClient | null = getPublicClient(),
) {
  if (!client)
    throw Error("O catálogo público não está disponível neste ambiente.");
  const { data, error } = await client.rpc("profile_published_works", {
    p_author_id: id,
    p_offset: offset,
    p_limit: 24,
  });
  if (error)
    throw Error(
      "Não foi possível carregar as obras publicadas deste autor. Tenta novamente.",
    );
  if (
    !data ||
    !Array.isArray(data.items) ||
    !Number.isSafeInteger(data.total) ||
    data.total < 0
  )
    throw Error("Resposta inválida do catálogo do autor.");
  return {
    works: data.items.map(mapPublishedWork),
    total: data.total as number,
  };
}
export async function fetchFollowerCount(
  id: string,
  client: SupabaseClient | null = getPublicClient(),
) {
  if (!client) throw Error("Contagem de seguidores indisponível.");
  const { count, error } = await client
    .from("profile_follows")
    .select("follower_id", { count: "exact", head: true })
    .eq("followed_id", id);
  if (error || count === null)
    throw Error("Contagem de seguidores indisponível. Tenta novamente.");
  return count;
}
