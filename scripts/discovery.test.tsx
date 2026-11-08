import test from "node:test";
import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { matchRoutes } from "react-router-dom";
import { ApplicationRoutes } from "../src/foundation/app/App";
import { productRoutes } from "../src/foundation/app/routes";
import { demoWorks } from "../src/foundation/data/works";
import {
  editorialSelections,
  selectEditorialWorks,
} from "../src/foundation/data/editorial";
import {
  filterWorks,
  worksRepository,
} from "../src/foundation/lib/worksRepository";
import {
  catalogUrl,
  getTags,
  getGenres,
  getFormatCounts,
  getCategoryWorks,
  paginate,
  readFilters,
  relatedWorks,
  slugify,
} from "../src/foundation/lib/discovery";
const base = { query: "", format: "", genre: "", sort: "recentes" };
function renderRoute(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const output = new PassThrough();
    let html = "";
    output.on("data", (chunk) => {
      html += chunk.toString();
    });
    output.on("end", () => resolve(html));
    output.on("error", reject);
    const stream = renderToPipeableStream(
      <StaticRouter location={url}>
        <ApplicationRoutes />
      </StaticRouter>,
      {
        onAllReady() {
          stream.pipe(output);
        },
        onError: reject,
      },
    );
  });
}
const pages = [
  ["/", "Onde as histórias"],
  ["/explorar", "Há mais de um caminho."],
  ["/catalogo", "Um mundo de histórias."],
  ["/pesquisa", "Pesquisa avançada."],
  ["/tags", "Todas as histórias têm pistas."],
  ["/tags/memoria", "Memória"],
  ["/categorias", "Muitas formas. Infinitos mundos."],
  ["/tendencias", "O que nos move a imaginar."],
  ["/obras/atlas-das-mares", "Atlas das marés esquecidas"],
];
for (const [url, title] of pages)
  test(`actual router renders ${url} with its own discovery screen`, async () => {
    const html = await renderRoute(url);
    assert.ok(html.includes(title));
    assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1);
    assert.ok(!html.includes("Esta página faz parte da fundação"));
    assert.ok(html.includes('id="conteudo"'));
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const href = match[1].replaceAll("&amp;", "&");
      if (href.startsWith("/") && !href.startsWith("/dev/"))
        assert.ok(
          matchRoutes(
            productRoutes,
            new URL(href, "https://example.test").pathname,
          ),
          `Unregistered link ${href} on ${url}`,
        );
    }
  });
test("combined advanced query filters exactly one work", () => {
  const params = new URLSearchParams(
    "q=cartografa&campo=sinopse&formato=Romance&genero=Fantasia&tag=memoria&tag=oceano",
  );
  assert.deepEqual(
    filterWorks(demoWorks, readFilters(params)).map((w) => w.id),
    ["atlas-das-mares"],
  );
});
test("accent-insensitive search works separately in title, author and synopsis", () => {
  for (const [query, scope, id] of [
    ["SILENCIO", "titulo", "silencio-orbita"],
    ["iris", "autor", "silencio-orbita"],
    ["metropole", "sinopse", "cidade-entre-linhas"],
  ] as const) {
    assert.equal(filterWorks(demoWorks, { ...base, query, scope })[0]?.id, id);
  }
  assert.equal(
    filterWorks(demoWorks, { ...base, query: "Lia", scope: "titulo" }).length,
    0,
  );
  assert.equal(
    filterWorks(demoWorks, {
      ...base,
      query: "atlas esquecidas",
      scope: "titulo",
    })[0]?.id,
    "atlas-das-mares",
  );
});
test("tags compose with AND, never OR; unknown tags and genres yield empty results", () => {
  assert.equal(
    filterWorks(demoWorks, { ...base, tags: ["Memória"] }).length,
    2,
  );
  assert.equal(
    filterWorks(demoWorks, { ...base, tags: ["memoria", "oceano"] }).length,
    1,
  );
  assert.equal(
    filterWorks(demoWorks, { ...base, tags: ["memoria", "cosmos"] }).length,
    0,
  );
  assert.equal(
    filterWorks(demoWorks, { ...base, tags: ["missing"] }).length,
    0,
  );
  assert.equal(filterWorks(demoWorks, { ...base, genre: "missing" }).length, 0);
});
test("all tag slugs are unique and counts match actual works", () => {
  const tags = getTags(demoWorks);
  assert.equal(new Set(tags.map((t) => t.slug)).size, tags.length);
  assert.equal(tags.find((t) => t.slug === "memoria")?.count, 2);
  assert.equal(slugify("Universo Aurora"), "universo-aurora");
  for (const tag of tags) {
    assert.ok(tag.description);
    assert.ok(tag.group);
    assert.equal(
      tag.count,
      demoWorks.filter((w) => w.tags.some((t) => slugify(t) === tag.slug))
        .length,
    );
  }
});
test("category and format counts account for exactly the existing eight works", () => {
  assert.equal(
    getGenres(demoWorks).reduce((n, g) => n + g.count, 0),
    8,
  );
  assert.equal(
    getFormatCounts(demoWorks).reduce((n, f) => n + f.count, 0),
    8,
  );
  assert.equal(getCategoryWorks(demoWorks, "", "literaria").length, 5);
  assert.equal(getCategoryWorks(demoWorks, "", "visual").length, 3);
  assert.deepEqual(
    getCategoryWorks(demoWorks, "Fantasia", "visual").map((w) => w.id),
    ["jardim-lua", "bestias-tinta"],
  );
  assert.equal(getCategoryWorks(demoWorks, "", "unknown").length, 0);
});
test("pagination has no overlaps or missing items and clamps invalid pages", () => {
  const first = paginate(demoWorks, 1);
  const second = paginate(demoWorks, 2);
  assert.deepEqual([...first.items, ...second.items], demoWorks);
  assert.equal(first.start, 1);
  assert.equal(first.end, 4);
  assert.equal(second.start, 5);
  assert.equal(second.end, 8);
  for (const page of [0, -5, NaN, Infinity, 1.5])
    assert.equal(paginate(demoWorks, page).page, 1);
  assert.equal(paginate(demoWorks, 999).page, 2);
  assert.deepEqual(paginate([], 99), {
    items: [],
    page: 1,
    pages: 1,
    total: 0,
    start: 0,
    end: 0,
  });
  assert.equal(paginate(demoWorks, 1, 0).items.length, 4);
});
test("URLs preserve query and filter values, normalize repeated tags and reject unknown order/scope", () => {
  const url = catalogUrl(
    { q: "Íris & mar", tag: "memoria", formato: "HQ / Comic" },
    "/pesquisa",
  );
  const filters = readFilters(
    new URL(url, "https://example.test").searchParams,
  );
  assert.equal(filters.query, "Íris & mar");
  assert.equal(filters.format, "HQ / Comic");
  assert.deepEqual(filters.tags, ["memoria"]);
  assert.deepEqual(
    readFilters(
      new URLSearchParams("tag=Memória&tag=memoria&ordem=bad&campo=bad"),
    ).tags,
    ["memoria"],
  );
  assert.equal(readFilters(new URLSearchParams("ordem=bad")).sort, "recentes");
  assert.equal(readFilters(new URLSearchParams("campo=bad")).scope, "todos");
});
test("dates, unique IDs and editorial references preserve demonstration integrity", () => {
  assert.equal(demoWorks.length, 8);
  assert.equal(new Set(demoWorks.map((w) => w.id)).size, 8);
  for (const work of demoWorks) {
    assert.equal(work.demo, true);
    assert.match(work.createdAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Number.isFinite(Date.parse(work.createdAt)));
    assert.equal(new Set(work.tags.map(slugify)).size, work.tags.length);
  }
  for (const entry of editorialSelections) {
    assert.equal(
      selectEditorialWorks(demoWorks, entry).length,
      entry.workIds.length,
    );
    assert.equal(new Set(entry.workIds).size, entry.workIds.length);
  }
});
test("related works exclude the current work and share content, without mutating data", () => {
  const original = JSON.stringify(demoWorks);
  const current = demoWorks[0];
  const result = relatedWorks(demoWorks, current);
  for (const work of result) {
    assert.notEqual(work.id, current.id);
    assert.ok(
      work.genre === current.genre ||
        work.format === current.format ||
        work.tags.some((t) => current.tags.includes(t)),
    );
  }
  assert.equal(JSON.stringify(demoWorks), original);
  assert.equal(worksRepository.find("not-an-id"), undefined);
});
test("unknown work ID renders 404, without leaking another work", async () => {
  const html = await renderRoute("/obras/not-an-id");
  assert.ok(html.includes("404"));
  assert.ok(!html.includes("Atlas das marés esquecidas"));
});
test("unknown tag renders explicit recovery links", async () => {
  const html = await renderRoute("/tags/not-a-tag");
  assert.ok(html.includes("Tag desconhecida"));
  assert.ok(html.includes("Voltar ao diretório"));
});
test("empty results, scope and selected tag filters are rendered from a shared URL", async () => {
  const html = await renderRoute(
    "/pesquisa?q=not-a-title&campo=titulo&tag=cosmos",
  );
  assert.ok(html.includes("Nenhuma história encontrada"));
  assert.ok(html.includes('value="titulo" selected=""'));
  assert.ok(html.includes('value="not-a-title"'));
  assert.ok(!html.includes("<h3>O silêncio em órbita</h3>"));
});
test("tag page scope cannot be escaped with a format filter", async () => {
  const html = await renderRoute("/tags/memoria?formato=Mang%C3%A1");
  assert.ok(html.includes("Nenhuma história encontrada"));
  assert.ok(!html.includes("<h3>O jardim da última lua</h3>"));
});
test("catalog second page renders remaining records and range", async () => {
  const html = await renderRoute("/catalogo?pagina=2");
  assert.ok(html.includes("5–8 de 8 obras demonstrativas"));
  assert.ok(html.includes("<h3>A casa onde chove dentro</h3>"));
  assert.ok(!html.includes("<h3>Atlas das marés esquecidas</h3>"));
});
test("editorial page is transparent and selected section is shareable", async () => {
  const html = await renderRoute("/tendencias?selecao=entre-silencios");
  assert.ok(html.includes("Ainda não existem métricas reais"));
  assert.ok(html.includes("O silêncio em órbita"));
  assert.ok(!html.includes("<h3>Atlas das marés esquecidas</h3>"));
});
