import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import {
  createSitemapHandler,
  SHARD_SIZE,
  escapeXml,
  renderXml,
} from "../server/sitemap";
import {
  SITE_ORIGIN,
  canonicalUrl,
  indexableRoute,
} from "../src/foundation/features/seo/config";
import { applySeo, routeSeo } from "../src/foundation/features/seo/metadata";
import api from "../api/sitemap";
const env = {
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_only",
};
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const snapshot = (n: number) => ({
  id: id(n),
  last_published_at: "2026-11-14T12:00:00+00:00",
});
function fixture(count = 2, withTags = true) {
  const requests: URL[] = [];
  const state = {
    count,
    withTags,
    fail: false,
    publishedAt: "2026-11-14T12:00:00+00:00",
  };
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    requests.push(url);
    assert.equal(url.origin, env.SUPABASE_URL);
    assert.equal(init?.method, "GET");
    assert.equal(init?.cache, "no-store");
    assert.equal(init?.redirect, "error");
    assert.equal(
      new Headers(init?.headers).get("apikey"),
      env.SUPABASE_PUBLISHABLE_KEY,
    );
    assert.equal(new Headers(init?.headers).has("authorization"), false);
    assert.ok(init?.signal);
    if (state.fail)
      return new Response("private provider error and credential", {
        status: 500,
      });
    if (url.pathname.endsWith("public_discovery_facets"))
      return Response.json({
        tags: state.withTags
          ? [{ key: "memoria", name: "Memória", count: 1 }]
          : [],
      });
    assert.equal(url.pathname, "/rest/v1/published_works");
    assert.equal(url.searchParams.get("is_public"), "eq.true");
    assert.equal(url.searchParams.get("order"), "id.asc");
    if (url.searchParams.get("select") === "id") {
      assert.equal(new Headers(init?.headers).get("prefer"), "count=exact");
      return Response.json([], {
        headers: { "content-range": `0-0/${state.count}` },
      });
    }
    assert.equal(url.searchParams.get("select"), "id,last_published_at");
    const offset = Number(url.searchParams.get("offset"));
    assert.equal(url.searchParams.get("limit"), String(SHARD_SIZE));
    const size = Math.max(0, Math.min(SHARD_SIZE, state.count - offset));
    const rows = Array.from({ length: size }, (_, i) => ({
      ...snapshot(offset + i + 1),
      last_published_at: state.publishedAt,
    }));
    return Response.json(rows, {
      headers: {
        "content-range": size ? `${offset}-${offset + size - 1}/*` : "*/*",
      },
    });
  };
  const handler = createSitemapHandler(env, fetcher);
  return {
    state,
    requests,
    handler,
    get: (path = "/sitemap.xml", method = "GET") =>
      handler(new Request(SITE_ORIGIN + path, { method })),
  };
}
function validateXml(xml: string, root = "urlset") {
  const result = spawnSync(
    "python3",
    [
      "-c",
      `import sys,xml.etree.ElementTree as E,urllib.parse as U
r=E.fromstring(sys.stdin.read());ns='{http://www.sitemaps.org/schemas/sitemap/0.9}'
assert r.tag==ns+sys.argv[1]
assert 0<len(r)<=50000
seen=set()
for row in r:
 assert row.tag==ns+('sitemap' if sys.argv[1]=='sitemapindex' else 'url')
 loc=row.find(ns+'loc').text;u=U.urlsplit(loc)
 assert u.scheme=='https' and u.netloc=='arquivoglobal.vercel.app' and not u.query and not u.fragment
 assert loc not in seen;seen.add(loc)
`,
      root,
    ],
    { input: xml, encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
}
test("sitemap index partitions all publications beyond frontend limits and keeps a fixed canonical host", async () => {
  const f = fixture(SHARD_SIZE * 2 + 1);
  const response = await f.handler(
    new Request("https://preview-attacker.example/sitemap.xml"),
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type")!, /application\/xml/);
  const xml = await response.text();
  validateXml(xml, "sitemapindex");
  assert.equal((xml.match(/<sitemap>/g) || []).length, 4);
  assert.ok(xml.includes("/sitemaps/works-3.xml"));
  assert.ok(!xml.includes("preview-attacker"));
  const seen = new Set<string>();
  for (let page = 1; page <= 3; page++) {
    const result = await f.get(`/sitemaps/works-${page}.xml`);
    assert.equal(result.status, 200);
    const body = await result.text();
    validateXml(body);
    for (const match of body.matchAll(/<loc>(.*?)<\/loc>/g)) {
      assert.ok(!seen.has(match[1]));
      seen.add(match[1]);
    }
    assert.ok(body.includes("<lastmod>2026-11-14T12:00:00.000Z</lastmod>"));
    assert.ok(!body.includes("owner_id") && !body.includes("work_id"));
  }
  assert.equal(seen.size, SHARD_SIZE * 2 + 1);
});
test("empty catalogue includes institutional pages only; populated directories require public data", async () => {
  const empty = fixture(0);
  const index = await (await empty.get()).text();
  assert.ok(!index.includes("works-"));
  const pages = await (await empty.get("/sitemaps/pages.xml")).text();
  validateXml(pages);
  assert.equal((pages.match(/<url>/g) || []).length, 5);
  assert.ok(pages.includes("/privacidade"));
  for (const path of [
    "/catalogo",
    "/explorar",
    "/tags",
    "/categorias",
    "/entrar",
    "/estudio",
    "/utilizadores",
    "/tendencias",
    "/pesquisa",
  ])
    assert.ok(!pages.includes(`<loc>${SITE_ORIGIN}${path}</loc>`));
  const populated = fixture();
  const body = await (await populated.get("/sitemaps/pages.xml")).text();
  validateXml(body);
  assert.ok(
    body.includes("/catalogo") &&
      body.includes("/categorias") &&
      body.includes("/tags"),
  );
  const noTags = fixture(1, false);
  assert.ok(
    !(await (await noTags.get("/sitemaps/pages.xml")).text()).includes(
      `${SITE_ORIGIN}/tags`,
    ),
  );
});
test("publication, update and withdrawal are visible without rebuilds, webhooks or stale caches", async () => {
  const f = fixture(0);
  assert.equal((await f.get("/sitemaps/works-1.xml")).status, 404);
  f.state.count = 1;
  const published = await f.get("/sitemaps/works-1.xml");
  assert.equal(published.status, 200);
  assert.ok((await published.text()).includes(`/obras/${id(1)}`));
  for (const header of [
    "cache-control",
    "cdn-cache-control",
    "vercel-cdn-cache-control",
  ])
    assert.equal(published.headers.get(header), "no-store");
  f.state.publishedAt = "2026-11-15T12:00:00+00:00";
  assert.ok(
    (await (await f.get("/sitemaps/works-1.xml")).text()).includes(
      "2026-11-15T12:00:00.000Z",
    ),
  );
  f.state.count = 0;
  assert.equal((await f.get("/sitemaps/works-1.xml")).status, 404);
});
test("upstream errors fail closed as 503 and never return partial XML or secrets", async () => {
  const f = fixture();
  f.state.fail = true;
  for (const path of [
    "/sitemap.xml",
    "/sitemaps/pages.xml",
    "/sitemaps/works-1.xml",
  ]) {
    const response = await f.get(path);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("retry-after"), "60");
    assert.equal(await response.text(), "Sitemap temporarily unavailable");
  }
});
test("missing configuration and privileged keys are rejected before any network request", async () => {
  const jwt = (role: string) =>
    `eyJheader.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.signature`;
  for (const config of [
    {},
    { ...env, SUPABASE_PUBLISHABLE_KEY: "sb_secret_never" },
    { ...env, SUPABASE_PUBLISHABLE_KEY: jwt("service_role") },
    { ...env, SUPABASE_URL: "http://project.supabase.co" },
  ]) {
    const response = await createSitemapHandler(config, async () => {
      assert.fail("Unexpected network");
    })(new Request(SITE_ORIGIN + "/sitemap.xml"));
    assert.equal(response.status, 503);
    assert.ok(!(await response.text()).includes("sb_secret"));
  }
});
test("legacy anon key and VITE public configuration work without a service role", async () => {
  const key = `eyJheader.${Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url")}.signature`;
  const handler = createSitemapHandler(
    { VITE_SUPABASE_URL: env.SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY: key },
    async (_input, init) => {
      assert.equal(
        new Headers(init?.headers).get("authorization"),
        `Bearer ${key}`,
      );
      return Response.json([], { headers: { "content-range": "*/0" } });
    },
  );
  assert.equal(
    (await handler(new Request(SITE_ORIGIN + "/sitemap.xml"))).status,
    200,
  );
});
test("methods, invalid shard paths and rewrite query are handled without SPA fallthrough", async () => {
  const f = fixture();
  const head = await f.get("/sitemap.xml", "HEAD");
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  const post = await f.get("/sitemap.xml", "POST");
  assert.equal(post.status, 405);
  assert.equal(post.headers.get("allow"), "GET, HEAD");
  for (const file of [
    "works-0.xml",
    "works-01.xml",
    "works-99999.xml",
    "works-1.html",
    "secret.xml",
  ])
    assert.equal((await f.get(`/api/sitemap?file=${file}`)).status, 404);
  const query = await f.get("/api/sitemap?file=works-1.xml");
  assert.equal(query.status, 200);
  validateXml(await query.text());
});
test("invalid counts, snapshots, duplicates and truncated responses cannot masquerade as a complete sitemap", async () => {
  const count = (header: string | null) =>
    Response.json([], { headers: header ? { "content-range": header } : {} });
  for (const header of [null, "0-0/*", "0-0/10000001"]) {
    assert.equal(
      (
        await createSitemapHandler(env, async () => count(header))(
          new Request(SITE_ORIGIN + "/sitemap.xml"),
        )
      ).status,
      503,
    );
  }
  for (const rows of [
    [{ ...snapshot(1), id: "../estudio" }],
    [{ ...snapshot(1), last_published_at: "bad" }],
    [snapshot(1), snapshot(1)],
    [snapshot(1)],
  ]) {
    const handler = createSitemapHandler(env, async (input) => {
      const url = new URL(String(input));
      return url.searchParams.get("select") === "id"
        ? count("0-0/2")
        : Response.json(rows, {
            headers: { "content-range": `0-${rows.length - 1}/*` },
          });
    });
    assert.equal(
      (await handler(new Request(SITE_ORIGIN + "/sitemaps/works-1.xml")))
        .status,
      503,
    );
  }
});
test("XML escapes reserved characters, deduplicates URLs and rejects external URLs", () => {
  assert.equal(escapeXml(`<>&"'`), "&lt;&gt;&amp;&quot;&apos;");
  const xml = renderXml([{ path: "/a&b" }, { path: "/a&b" }]);
  validateXml(xml);
  assert.ok(xml.includes("a&amp;b"));
  assert.equal((xml.match(/<url>/g) || []).length, 1);
  assert.throws(() => renderXml([{ path: "https://other.example/" }]));
  assert.throws(() => renderXml([{ path: "//other.example/" }]));
  assert.throws(() => renderXml([{ path: "/catalogo?q=private" }]));
});
test("canonical URLs and route indexing exclude private, unknown, alias and parameter pages", () => {
  assert.equal(canonicalUrl("/catalogo"), SITE_ORIGIN + "/catalogo");
  for (const bad of [
    "//evil.example",
    "/path?token=private",
    "/path#x",
    "/\\evil.example",
  ])
    assert.equal(canonicalUrl(bad), null);
  for (const path of [
    "/estudio",
    "/biblioteca",
    "/entrar",
    "/auth/callback",
    "/utilizadores/test",
    "/tags/memoria",
    "/tendencias",
    "/obras/missing",
    "/sistema",
    "/unknown",
  ])
    assert.equal(indexableRoute(path), false, path);
  assert.equal(indexableRoute(`/obras/${id(1)}`), true);
  assert.equal(indexableRoute("/catalogo", "?q=example"), false);
});
test("SPA metadata has one absolute canonical, updates descriptions and marks unavailable routes noindex", () => {
  const nodes: any[] = [];
  const doc = {
    title: "",
    createElement: () => ({
      remove() {
        nodes.splice(nodes.indexOf(this), 1);
      },
    }),
    head: {
      querySelector(selector: string) {
        return (
          nodes.find((n) =>
            selector.includes("canonical")
              ? n.rel === "canonical"
              : selector.includes(`"${n.name}"`),
          ) || null
        );
      },
      appendChild(node: any) {
        nodes.push(node);
      },
    },
  } as unknown as Document;
  applySeo(routeSeo("/catalogo", "", "Catálogo"), doc);
  applySeo(
    {
      path: `/obras/${id(1)}`,
      title: "Título público",
      description: "Sinopse pública",
      index: true,
    },
    doc,
  );
  assert.equal(nodes.filter((n) => n.rel === "canonical").length, 1);
  assert.equal(
    nodes.find((n) => n.rel === "canonical").href,
    SITE_ORIGIN + `/obras/${id(1)}`,
  );
  assert.equal(
    nodes.find((n) => n.name === "description").content,
    "Sinopse pública",
  );
  applySeo(routeSeo("/estudio"), doc);
  assert.equal(
    nodes.find((n) => n.name === "robots").content,
    "noindex, follow",
  );
});
test("Vercel and robots route XML/text ahead of the SPA; no obsolete static sitemap remains", () => {
  const config = JSON.parse(readFileSync("vercel.json", "utf8"));
  assert.equal(config.rewrites[0].source, "/sitemap.xml");
  assert.equal(config.rewrites[0].destination, "/api/sitemap");
  assert.equal(config.rewrites[1].source, "/sitemaps/:file");
  const fallback = new RegExp("^" + config.rewrites.at(-1).source + "$");
  for (const path of [
    "/sitemap.xml",
    "/robots.txt",
    "/api/sitemap",
    "/sitemaps/pages.xml",
    "/assets/app.js",
    "/googlef3a17f7e72070b54.html",
  ])
    assert.equal(fallback.test(path), false, path);
  assert.equal(fallback.test(`/obras/${id(1)}`), true);
  const robots = readFileSync("public/robots.txt", "utf8");
  assert.ok(robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`));
  assert.ok(!robots.includes("Disallow: /assets"));
  assert.equal(existsSync("public/sitemap.xml"), false);
  assert.equal(typeof api.fetch, "function");
});
