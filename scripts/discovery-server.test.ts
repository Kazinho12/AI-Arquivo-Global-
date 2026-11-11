import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import {
  discoveryQuery,
  localDiscovery,
} from "../src/foundation/features/catalog/discovery";
import { createPublicWorksRepository } from "../src/foundation/features/catalog/repository";
import { slugify } from "../src/foundation/lib/discovery";
const row = {
  id: "30000000-0000-0000-0000-000000000001",
  title: "Coração",
  subtitle: "Marés",
  author_name: "Ágata",
  author_username: "agata",
  type: "Romance",
  genre: "Fantasia",
  language: "pt",
  age_rating: "+12",
  tags: ["Ficção científica", "東京 文学"],
  description: "Estrelas",
  content_warnings: ["Violência"],
  first_published_at: "2026-11-10T10:00:00Z",
  last_published_at: "2026-11-11T10:00:00Z",
};
test("F3.3 URL validation, Unicode tags and combined filters", () => {
  const q = discoveryQuery(
    new URLSearchParams(
      "q=CORAÇÃO&formato=Romance&genero=Fantasia&idioma=pt&idade=%2B12&tag=Ficção+científica&aviso=Violência&pagina=2",
    ),
  );
  assert.equal(q.page, 2);
  assert.deepEqual(q.tags, ["ficcao-cientifica"]);
  assert.equal(slugify("東京 文学"), "東京-文学");
  assert.equal(slugify("✨"), "✨");
  const bad = discoveryQuery(
    new URLSearchParams({
      pagina: "Infinity",
      formato: "not-a-format",
      idade: "bad",
      ordem: "DROP TABLE",
      q: "x".repeat(300),
    }),
  );
  assert.equal(bad.page, 1);
  assert.equal(bad.query.length, 200);
  assert.equal(bad.format, "");
  assert.equal(bad.sort, "recentes");
  const unicode = discoveryQuery(
    new URLSearchParams({ q: "a" + "😀".repeat(200) }),
  ).query;
  assert.equal(Array.from(unicode).length, 200);
  assert.doesNotThrow(() => encodeURIComponent(unicode));
});
test("F3.3 public SDK calls bounded preview and invoker RPCs with an explicit query", async () => {
  const requests: URL[] = [];
  let fail = false;
  const client = createClient("https://fixture.invalid", "public-key", {
    accessToken: async () => null,
    global: {
      fetch: async (input, init) => {
        if (fail) throw Error("offline");
        const url = new URL(String(input));
        requests.push(url);
        assert.equal(
          new Headers(init?.headers).get("Authorization"),
          "Bearer public-key",
        );
        if (url.pathname.endsWith("search_public_works")) {
          const f = JSON.parse(String(init?.body)).p_filters;
          assert.equal(f.query, "agata");
          assert.equal(f.size, 12);
          return Response.json({ items: [row], total: 1, page: 1, size: 12 });
        }
        if (url.pathname.endsWith("public_discovery_facets"))
          return Response.json({
            genres: ["Fantasia"],
            languages: ["pt"],
            warnings: ["Violência"],
            tags: [
              { key: "ficcao-cientifica", name: "Ficção científica", count: 1 },
            ],
          });
        assert.equal(url.searchParams.get("limit"), "12");
        return Response.json([row]);
      },
    },
  });
  const repo = createPublicWorksRepository(client);
  assert.equal((await repo.list()).length, 1);
  const result = await repo.search!(
    discoveryQuery(new URLSearchParams({ q: "agata" })),
  );
  assert.equal(result.items[0].subtitle, "Marés");
  assert.equal((await repo.facets!()).tags[0].name, "Ficção científica");
  assert.ok(
    requests.every(
      (url) =>
        !url.pathname.endsWith("/works") && !url.pathname.includes("private"),
    ),
  );
  fail = true;
  await assert.rejects(
    repo.search!(discoveryQuery(new URLSearchParams())),
    /Não foi possível/,
  );
});
test("F3.3 inaugural filtering does not invent classification or language", () => {
  const w = {
    id: "local",
    title: "Carta",
    subtitle: "Abertura",
    author: "Equipa",
    authorId: "editorial",
    format: "Conto" as const,
    genre: "Literatura",
    tags: ["東京 文学"],
    synopsis: "Texto",
    createdAt: "2026-11-10",
    cover: 1,
  };
  assert.equal(
    localDiscovery([w], discoveryQuery(new URLSearchParams({ q: "Abertura" })))
      .length,
    1,
  );
  assert.equal(
    localDiscovery([w], discoveryQuery(new URLSearchParams({ idade: "Livre" })))
      .length,
    0,
  );
  assert.equal(
    localDiscovery(
      [w],
      discoveryQuery(new URLSearchParams({ tag: "東京 文学" })),
    ).length,
    1,
  );
});
