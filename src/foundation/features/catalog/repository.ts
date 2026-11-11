import type {
  DiscoveryQuery,
  DiscoveryPage,
  DiscoveryFacets,
} from "./discovery";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { authConfig } from "../auth/client";
import type { Work } from "../../data/works";
import type { Chapter } from "../reader/types";
export interface PublishedWork extends Work {
  origin: "user-publication";
  language: string;
  ageRating: string;
  contentWarnings: string[];
  authorUsername: string | null;
  firstPublishedAt: string;
  lastPublishedAt: string;
  chapters: Chapter[];
}
export interface PublicWorksRepository {
  list(): Promise<Work[]>;
  search?(query: DiscoveryQuery): Promise<DiscoveryPage>;
  facets?(query?: string): Promise<DiscoveryFacets>;
  check?(publicId: string): Promise<{ lastPublishedAt: string } | null>;
  find(publicId: string): Promise<PublishedWork | null>;
}
export const publicColumns =
  "id,slug,title,subtitle,description,type,genre,language,age_rating,tags,content_warnings,cover_accent_color,author_name,author_username,first_published_at,last_published_at";
let anonymous: SupabaseClient | null = null;
export function getPublicClient() {
  if (!authConfig.ready || typeof window === "undefined") return null;
  return (anonymous ??= createClient(authConfig.url, authConfig.key, {
    accessToken: async () => null,
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  }));
}
export function mapPublishedWork(row: Record<string, any>): PublishedWork {
  if (
    !row.id ||
    !row.title ||
    !row.first_published_at ||
    !row.last_published_at ||
    !Array.isArray(row.tags)
  )
    throw new Error("Resposta inválida do catálogo público.");
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    author: row.author_name || "Autor não identificado",
    authorId: row.author_username ?? "",
    authorUsername: row.author_username ?? null,
    format: row.type,
    genre: row.genre,
    tags: row.tags,
    synopsis: row.description,
    createdAt: row.last_published_at,
    cover: 1,
    coverAccentColor: row.cover_accent_color || undefined,
    origin: "user-publication",
    language: row.language,
    ageRating: row.age_rating,
    contentWarnings: row.content_warnings,
    firstPublishedAt: row.first_published_at,
    lastPublishedAt: row.last_published_at,
    chapters: (row.entries ?? []).map((entry: Record<string, any>) => ({
      id: entry.id,
      title: entry.title,
      number: entry.position,
      content: entry.content,
      entryType: entry.entry_type,
      alignment: entry.alignment,
      ...(entry.entry_type === "poem"
        ? {
            stanzas: entry.content
              .split(/\n\s*\n/)
              .map((stanza: string) => stanza.split("\n")),
          }
        : {}),
    })),
  };
}
export function createPublicWorksRepository(
  client: SupabaseClient | null,
): PublicWorksRepository {
  const db = () => {
    if (!client)
      throw new Error(
        "O catálogo de autores não está configurado neste ambiente.",
      );
    return client;
  };
  async function request<T>(query: PromiseLike<{ data: T; error: unknown }>) {
    try {
      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch {
      throw new Error(
        "Não foi possível carregar as publicações. Verifica a ligação e a instalação das migrations públicas necessárias.",
      );
    }
  }
  return {
    async list() {
      const client = db();
      const rows = await request(
        client
          .from("published_works")
          .select(publicColumns)
          .order("last_published_at", { ascending: false })
          .order("id")
          .limit(12),
      );
      return (rows ?? []).map(mapPublishedWork);
    },
    async search(query) {
      const result = await request(
        db().rpc("search_public_works", { p_filters: query }),
      );
      if (
        !result ||
        !Array.isArray(result.items) ||
        !Number.isInteger(result.total)
      )
        throw Error("Resposta inválida da pesquisa pública.");
      return {
        ...result,
        items: result.items.map(mapPublishedWork),
      } as DiscoveryPage;
    },
    async facets(query = "") {
      const result = await request(
        db().rpc("public_discovery_facets", {
          p_query: Array.from(query).slice(0, 100).join(""),
        }),
      );
      if (!result || !Array.isArray(result.tags))
        throw Error("Resposta inválida dos filtros públicos.");
      return result as DiscoveryFacets;
    },
    async check(publicId) {
      const row = await request(
        db()
          .from("published_works")
          .select("id,last_published_at")
          .eq("id", publicId)
          .maybeSingle(),
      );
      return row ? { lastPublishedAt: row.last_published_at } : null;
    },
    async find(publicId) {
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          publicId,
        )
      )
        return null;
      const row = await request(
        db().rpc("read_public_work", { p_public_id: publicId }),
      );
      return row ? mapPublishedWork(row) : null;
    },
  };
}
