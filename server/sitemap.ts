import {
  SITE_ORIGIN,
  STATIC_PAGES,
  PUBLIC_ID,
} from "../src/foundation/features/seo/config.js";

// Small shards also stay below Vercel's response-size and Supabase's row limits.
export const SHARD_SIZE = 500;
const MAX_SITEMAPS = 20_000;
const XML_NS = "http://www.sitemaps.org/schemas/sitemap/0.9";
type Environment = Record<string, string | undefined>;
type Fetcher = typeof fetch;
export interface SitemapEntry {
  path: string;
  lastmod?: string;
}
interface Snapshot {
  id: string;
  last_published_at: string;
}
export function escapeXml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[char]!,
  );
}
export function renderXml(entries: SitemapEntry[], index = false) {
  const unique = new Map(entries.map((entry) => [entry.path, entry]));
  if (!unique.size || unique.size > 50_000) throw Error("Invalid sitemap size");
  const root = index ? "sitemapindex" : "urlset";
  const tag = index ? "sitemap" : "url";
  const rows = [...unique.values()].map((entry) => {
    const url = new URL(entry.path, SITE_ORIGIN);
    if (
      !entry.path.startsWith("/") ||
      entry.path.startsWith("//") ||
      url.origin !== SITE_ORIGIN ||
      url.search ||
      url.hash
    )
      throw Error("Invalid sitemap URL");
    return `  <${tag}><loc>${escapeXml(url.href)}</loc>${entry.lastmod ? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>` : ""}</${tag}>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<${root} xmlns="${XML_NS}">\n${rows.join("\n")}\n</${root}>\n`;
}
function publicConfig(env: Environment) {
  const url = new URL(env.SUPABASE_URL || env.VITE_SUPABASE_URL || "");
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw Error("Invalid public configuration");
  const key =
    env.SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
  let legacyAnon = false;
  if (key.startsWith("eyJ")) {
    try {
      legacyAnon =
        JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString())
          .role === "anon";
    } catch {
      /* reject */
    }
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key) && !legacyAnon)
    throw Error("Only public keys allowed");
  return { url, key, legacyAnon };
}
export class PublicSitemapSource {
  private config;
  constructor(
    env: Environment,
    private fetcher: Fetcher = fetch,
  ) {
    this.config = publicConfig(env);
  }
  private async request(
    path: string,
    query: URLSearchParams,
    extra: Record<string, string> = {},
  ) {
    const url = new URL(`/rest/v1/${path}`, this.config.url);
    url.search = query.toString();
    const response = await this.fetcher(url, {
      method: "GET",
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
      headers: {
        apikey: this.config.key,
        ...(this.config.legacyAnon
          ? { Authorization: `Bearer ${this.config.key}` }
          : {}),
        ...extra,
      },
    });
    if (!response.ok) throw Error("Public catalogue unavailable");
    return response;
  }
  async count(): Promise<number> {
    const response = await this.request(
      "published_works",
      new URLSearchParams({
        select: "id",
        is_public: "eq.true",
        order: "id.asc",
        limit: "1",
      }),
      { Prefer: "count=exact" },
    );
    const range = response.headers.get("content-range")?.match(/\/(\d+)$/);
    if (!range) throw Error("Missing catalogue count");
    const count = Number(range[1]);
    if (
      !Number.isSafeInteger(count) ||
      count < 0 ||
      Math.ceil(count / SHARD_SIZE) > MAX_SITEMAPS
    )
      throw Error("Catalogue exceeds sitemap limits");
    return count;
  }
  async hasTags(): Promise<boolean> {
    const response = await this.request(
      "rpc/public_discovery_facets",
      new URLSearchParams(),
    );
    const body = await response.json();
    if (!body || !Array.isArray(body.tags))
      throw Error("Invalid public facets");
    return body.tags.some(
      (tag: { count?: number }) =>
        Number.isSafeInteger(tag?.count) && tag.count! > 0,
    );
  }
  async works(page: number): Promise<SitemapEntry[]> {
    // Cursor pagination is not necessary within a fixed shard. Stable public UUID order
    // avoids changes caused by edits/republishing; withdrawals can shrink the next crawl.
    const response = await this.request(
      "published_works",
      new URLSearchParams({
        select: "id,last_published_at",
        is_public: "eq.true",
        order: "id.asc",
        offset: String((page - 1) * SHARD_SIZE),
        limit: String(SHARD_SIZE),
      }),
    );
    const rows: unknown = await response.json();
    if (!Array.isArray(rows) || rows.length > SHARD_SIZE)
      throw Error("Invalid catalogue response");
    // Fail rather than silently publish a truncated shard when PostgREST has a
    // lower server-side max_rows setting. Content-Range must cover the whole shard.
    const range = response.headers
      .get("content-range")
      ?.match(/^(\d+)-(\d+)\/(\d+|\*)$/);
    if (
      rows.length &&
      (!range ||
        Number(range[1]) !== (page - 1) * SHARD_SIZE ||
        Number(range[2]) - Number(range[1]) + 1 !== rows.length)
    )
      throw Error("Invalid catalogue range");
    if (new Set(rows.map((row) => row?.id)).size !== rows.length)
      throw Error("Duplicate public snapshots");
    return rows.map((row: Snapshot) => {
      if (
        !row ||
        !PUBLIC_ID.test(row.id) ||
        typeof row.last_published_at !== "string" ||
        !/^\d{4}-\d{2}-\d{2}T/.test(row.last_published_at) ||
        !Number.isFinite(Date.parse(row.last_published_at))
      )
        throw Error("Invalid public snapshot");
      return {
        path: `/obras/${row.id}`,
        lastmod: new Date(row.last_published_at).toISOString(),
      };
    });
  }
}
export function createSitemapHandler(
  env: Environment,
  fetcher: Fetcher = fetch,
) {
  return async (request: Request): Promise<Response> => {
    const headers = {
      "Cache-Control": "no-store",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    };
    const reply = (body: string, status: number, xml = false, extra = {}) =>
      new Response(request.method === "HEAD" ? null : body, {
        status,
        headers: {
          ...headers,
          "Content-Type": xml
            ? "application/xml; charset=utf-8"
            : "text/plain; charset=utf-8",
          ...extra,
        },
      });
    if (!["GET", "HEAD"].includes(request.method))
      return reply("Method not allowed", 405, false, { Allow: "GET, HEAD" });
    const url = new URL(request.url);
    // Vercel's rewrite passes the child filename as ?file=...; public paths also
    // work directly in tests and local HTTP verification.
    const file = url.pathname.startsWith("/sitemaps/")
      ? url.pathname.slice(10)
      : url.searchParams.get("file");
    if (file && !/^(?:pages|works-[1-9]\d{0,4})\.xml$/.test(file))
      return reply("Not found", 404);
    try {
      const source = new PublicSitemapSource(env, fetcher);
      const count = await source.count();
      if (!file) {
        const entries = [{ path: "/sitemaps/pages.xml" }];
        for (let page = 1; page <= Math.ceil(count / SHARD_SIZE); page++)
          entries.push({ path: `/sitemaps/works-${page}.xml` });
        return reply(renderXml(entries, true), 200, true);
      }
      if (file === "pages.xml") {
        const entries: SitemapEntry[] = STATIC_PAGES.map((path) => ({ path }));
        if (count) {
          entries.push(
            ...["/catalogo", "/explorar", "/categorias"].map((path) => ({
              path,
            })),
          );
          if (await source.hasTags()) entries.push({ path: "/tags" });
        }
        return reply(renderXml(entries), 200, true);
      }
      const page = Number(file.slice(6, -4));
      if (page > Math.ceil(count / SHARD_SIZE)) return reply("Not found", 404);
      const entries = await source.works(page);
      if (!entries.length) return reply("Not found", 404);
      const expected = Math.min(SHARD_SIZE, count - (page - 1) * SHARD_SIZE);
      if (entries.length !== expected)
        return reply("Catalogue changed; retry", 503, false, {
          "Retry-After": "30",
        });
      return reply(renderXml(entries), 200, true);
    } catch {
      // Never leak provider bodies, keys or private data, or return a successful
      // but incomplete replacement sitemap during an upstream outage.
      return reply("Sitemap temporarily unavailable", 503, false, {
        "Retry-After": "60",
      });
    }
  };
}
