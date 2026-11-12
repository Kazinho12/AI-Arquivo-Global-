import test from "node:test";
import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { matchRoutes } from "react-router-dom";
import { ApplicationRoutes } from "../src/foundation/app/App";
import { productRoutes } from "../src/foundation/app/routes";
import { inauguralWorks as works } from "./fixtures/editorial-fixture";
import {
  editorialSelections,
  selectEditorialWorks,
} from "../src/foundation/data/editorial";
import { filterWorks } from "../src/foundation/lib/worksRepository";
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
export function renderRoute(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const out = new PassThrough();
    let html = "";
    out.on("data", (part) => (html += part));
    out.on("end", () => resolve(html));
    const stream = renderToPipeableStream(
      <StaticRouter location={url}>
        <ApplicationRoutes />
      </StaticRouter>,
      {
        onAllReady() {
          stream.pipe(out);
        },
        onError: reject,
      },
    );
  });
}
for (const [path, title] of [
  ["/", "Onde as histórias"],
  ["/explorar", "Há mais de um caminho."],
  ["/catalogo", "Um mundo de histórias."],
  ["/pesquisa", "Pesquisa avançada."],
  ["/tags", "Todas as histórias têm pistas."],
  ["/tags/memoria", "memoria"],
  ["/categorias", "Muitas formas. Infinitos mundos."],
  ["/tendencias", "O que nos move a imaginar."],
  ["/obras/ag-carta-abertura", "404"],
])
  test(`discovery: actual route ${path} has semantic content and canonical anchors`, async () => {
    const html = await renderRoute(path);
    assert.ok(html.includes(title));
    assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1);
    for (const [, href] of html.matchAll(/<a[^>]*href="([^"]+)"/g))
      if (href.startsWith("/") && !href.startsWith("/dev/"))
        assert.ok(
          matchRoutes(productRoutes, href.replaceAll("&amp;", "&")),
          href,
        );
  });
test("advanced filters compose title, format, genre and AND tags", () => {
  const filters = readFilters(
    new URLSearchParams(
      "q=carta&campo=titulo&formato=Conto&genero=Institucional&tag=arquivo&tag=criacao",
    ),
  );
  assert.deepEqual(
    filterWorks(works, filters).map((w) => w.id),
    ["ag-carta-abertura"],
  );
  assert.equal(
    filterWorks(works, { ...base, tags: ["memoria", "arquivo"] }).length,
    0,
  );
});
test("scope-aware accent-insensitive search and unknown values", () => {
  assert.equal(
    filterWorks(works, { ...base, query: "POEMAS", scope: "sinopse" })[0]?.id,
    "ag-primeiras-linhas",
  );
  assert.equal(
    filterWorks(works, { ...base, query: "equipa", scope: "autor" }).length,
    4,
  );
  assert.equal(
    filterWorks(works, { ...base, query: "equipa", scope: "titulo" }).length,
    0,
  );
  assert.equal(filterWorks(works, { ...base, genre: "missing" }).length, 0);
  assert.equal(filterWorks(works, { ...base, tags: ["missing"] }).length, 0);
});
test("tags, category and genre totals reflect precisely the canonical catalog", () => {
  const tags = getTags(works);
  assert.equal(new Set(tags.map((t) => t.slug)).size, tags.length);
  for (const tag of tags)
    assert.equal(
      tag.count,
      works.filter((w) => w.tags.some((t) => slugify(t) === tag.slug)).length,
    );
  assert.equal(
    getGenres(works).reduce((n, g) => n + g.count, 0),
    4,
  );
  assert.equal(
    getFormatCounts(works).reduce((n, f) => n + f.count, 0),
    4,
  );
  assert.equal(getCategoryWorks(works, "", "visual").length, 2);
  assert.equal(getCategoryWorks(works, "", "literaria").length, 2);
  assert.equal(
    getFormatCounts(works).find((f) => f.name === "Fanfiction")?.count,
    0,
  );
});
test("pagination covers all records, clamps invalid pages, avoids overlaps and supports empty lists", () => {
  const first = paginate(works, 1, 2),
    second = paginate(works, 2, 2);
  assert.deepEqual([...first.items, ...second.items], works);
  for (const n of [0, -1, NaN, Infinity, 1.5])
    assert.equal(paginate(works, n).page, 1);
  assert.equal(paginate(works, 99, 2).page, 2);
  assert.equal(paginate([], 1).total, 0);
  assert.equal(paginate(works, 1, 0).items.length, 4);
});
test("shared filter URLs normalize invalid enums and duplicate accents", () => {
  assert.equal(
    catalogUrl({ q: "", formato: "Poesia" }),
    "/catalogo?formato=Poesia",
  );
  assert.deepEqual(
    readFilters(new URLSearchParams("tag=Memória&tag=memoria&ordem=bad")).tags,
    ["memoria"],
  );
  assert.equal(readFilters(new URLSearchParams("ordem=bad")).sort, "recentes");
});
test("editorial selections reference real catalog entries exactly once", () => {
  for (const selection of editorialSelections) {
    assert.equal(
      selectEditorialWorks(works, selection).length,
      selection.workIds.length,
    );
    assert.equal(new Set(selection.workIds).size, selection.workIds.length);
  }
});
test("related works share content without mutation or popularity ranking", () => {
  const original = JSON.stringify(works);
  const related = relatedWorks(works, works[0]);
  assert.ok(related.every((w) => w.id !== works[0].id));
  assert.equal(JSON.stringify(works), original);
  assert.equal(relatedWorks(works, works[0], 0).length, 0);
});
test("unknown work and tags offer recovery without bundled results", async () => {
  assert.ok((await renderRoute("/obras/missing")).includes("404"));
  for (const url of ["/tags/unknown", "/tags/memoria?formato=Mang%C3%A1"]) {
    const html = await renderRoute(url);
    assert.ok(html.includes("Tag desconhecida"));
    assert.ok(!html.includes("Carta de abertura"));
  }
});
test("unpopulated formats show empty results without invented works", async () => {
  const html = await renderRoute("/catalogo?formato=Fanfiction");
  assert.ok(html.includes("Nenhuma história encontrada"));
  assert.ok(!html.includes("Autor fictício"));
});
test("retired selection URLs show an empty state without bundled works", async () => {
  const html = await renderRoute("/tendencias?selecao=ag-colecao-comecar");
  assert.ok(html.includes("Ainda não há tendências disponíveis"));
  assert.ok(!html.includes("Carta de abertura"));
});
