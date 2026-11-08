import test from "node:test";
import assert from "node:assert/strict";
import { matchRoutes } from "react-router-dom";
import { productRoutes } from "../src/foundation/app/routes";
import { demoWorks, formats } from "../src/foundation/data/works";
import {
  filterWorks,
  worksRepository,
} from "../src/foundation/lib/worksRepository";
const expected = [
  "/",
  "/explorar",
  "/catalogo",
  "/pesquisa",
  "/tags",
  "/tags/:slug",
  "/categorias",
  "/tendencias",
  "/obras/:id",
  "/entrar",
  "/registar",
  "/recuperar-senha",
  "/redefinir-senha",
  "/confirmar-email",
  "/boas-vindas",
  "/obras/:id/capitulos/:capituloId",
  "/obras/:id/paginas/:capituloId",
  "/obras/:id/comentarios",
  "/obras/:id/avaliacoes",
  "/biblioteca",
  "/biblioteca/favoritos",
  "/biblioteca/historico",
  "/biblioteca/listas",
  "/biblioteca/listas/:id",
  "/estudio",
  "/estudio/obras/nova",
  "/estudio/obras/:id",
  "/estudio/obras/:id/capitulos/:capituloId/editar",
  "/estudio/obras/:id/paginas/:capituloId/editar",
  "/estudio/publicacoes",
  "/estudio/estatisticas",
  "/estudio/media",
  "/utilizadores/:username",
  "/perfil/editar",
  "/utilizadores/:username/seguidores",
  "/notificacoes",
  "/atividade",
  "/colecoes",
  "/definicoes",
  "/definicoes/aparencia",
  "/definicoes/leitura",
  "/definicoes/seguranca",
  "/definicoes/privacidade",
  "/definicoes/acessibilidade",
  "/denunciar",
  "/ajuda",
  "/regras",
  "/privacidade",
  "/moderacao",
  "/moderacao/denuncias",
  "/sistema",
  "/sistema/logs",
  "/sistema/logs/:id",
  "/sistema/servicos",
  "/sistema/monitorizacao",
  "/sistema/informacoes",
  "/sistema/testes",
];
test("all 57 requested product routes exist, without duplicates", () => {
  assert.equal(productRoutes.length, 57);
  assert.equal(new Set(productRoutes.map((r) => r.path)).size, 57);
  assert.deepEqual(productRoutes.map((r) => r.path).sort(), expected.sort());
});
for (const path of expected)
  test(`React Router resolves ${path}`, () => {
    const url = path
      .replace(/:slug/g, "oceano")
      .replace(/:username/g, "autor-demo")
      .replace(/:capituloId/g, "cap-1")
      .replace(/:id/g, "atlas-das-mares");
    const matched = matchRoutes(
      productRoutes.map((r) => ({ path: r.path })),
      url,
    );
    assert.ok(matched);
    assert.equal(matched.at(-1)?.route.path, path);
  });
test("unknown URL has no product match", () =>
  assert.equal(matchRoutes(productRoutes, "/nao-existe"), null));
test("all seven layouts exist; administrative routes remain restricted", () => {
  assert.equal(new Set(productRoutes.map((r) => r.layout)).size, 7);
  for (const r of productRoutes) {
    if (r.path.startsWith("/sistema")) assert.equal(r.layout, "system");
    if (r.path.startsWith("/moderacao")) assert.equal(r.layout, "moderation");
  }
});
const base = { query: "", format: "", genre: "", sort: "recentes" };
test("search handles diacritics, tags, authors and empty results", () => {
  assert.equal(
    filterWorks(demoWorks, { ...base, query: "silencio" })[0]?.id,
    "silencio-orbita",
  );
  assert.equal(
    filterWorks(demoWorks, { ...base, query: "Lia Mavume" })[0]?.id,
    "atlas-das-mares",
  );
  assert.ok(filterWorks(demoWorks, { ...base, query: "Memória" }).length >= 2);
  assert.equal(filterWorks(demoWorks, { ...base, query: "zzzzzz" }).length, 0);
});
test("format and genre filters compose", () => {
  const result = filterWorks(demoWorks, {
    ...base,
    format: "Mangá",
    genre: "Fantasia",
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "jardim-lua");
  assert.equal(
    filterWorks(demoWorks, { ...base, format: "Mangá", genre: "Mistério" })
      .length,
    0,
  );
});
test("sorting is deterministic and never mutates repository data", () => {
  const original = demoWorks.map((w) => w.id);
  const sorted = filterWorks(demoWorks, { ...base, sort: "titulo" });
  assert.deepEqual(
    sorted.map((w) => w.title),
    demoWorks.map((w) => w.title).sort((a, b) => a.localeCompare(b, "pt")),
  );
  assert.deepEqual(
    demoWorks.map((w) => w.id),
    original,
  );
  assert.equal(filterWorks(demoWorks, base)[0].id, "atlas-das-mares");
});
test("demo data covers all formats and has no fabricated engagement metrics", () => {
  assert.deepEqual(
    [...new Set(demoWorks.map((w) => w.format))].sort(),
    [...formats].sort(),
  );
  for (const work of demoWorks) {
    assert.equal(work.demo, true);
    assert.ok(work.tags.length);
    assert.ok(work.synopsis);
    assert.equal("viewsCount" in work, false);
    assert.equal("rating" in work, false);
  }
  assert.equal(worksRepository.find("missing"), undefined);
});
