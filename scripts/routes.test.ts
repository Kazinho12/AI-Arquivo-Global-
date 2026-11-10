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
      .replace(/:id/g, "ag-carta-abertura");
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
test("canonical search handles diacritics, tags and empty results", () => {
  assert.equal(
    filterWorks(demoWorks, { ...base, query: "poemas" })[0]?.id,
    "ag-primeiras-linhas",
  );
  assert.equal(
    filterWorks(demoWorks, { ...base, query: "Equipa Editorial" }).length,
    4,
  );
  assert.ok(filterWorks(demoWorks, { ...base, query: "Memória" }).length >= 1);
  assert.equal(filterWorks(demoWorks, { ...base, query: "zzzzzz" }).length, 0);
});
test("format and genre filters compose without inventing missing formats", () => {
  const result = filterWorks(demoWorks, {
    ...base,
    format: "Mangá",
    genre: "Ensaio visual",
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "ag-outra-margem");
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
});
test("inaugural data has no fabricated engagement; all declared formats remain filterable", () => {
  assert.equal(formats.length, 8);
  assert.equal(demoWorks.length, 4);
  for (const work of demoWorks) {
    assert.ok(!work.demo);
    assert.ok(!("views" in work));
    assert.ok(!("rating" in work));
  }
});
