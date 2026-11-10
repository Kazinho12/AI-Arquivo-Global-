import { seedLibraryForTest } from "./fixtures/user-content";
import test from "node:test";
import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { ApplicationRoutes } from "../src/foundation/app/App";
import { libraryStore } from "../src/foundation/features/library/store";

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

test("library: new workspace is empty; lists and progress require user action", () => {
  assert.deepEqual(libraryStore.getEntries(), []);
  assert.deepEqual(libraryStore.getLists(), []);
  seedLibraryForTest();
});

test("library: store toggleFavorite inverts favorite status", () => {
  const entry = libraryStore.getEntry("ag-tres-gestos");
  const initialFav = entry?.isFavorite ?? false;

  const newFav = libraryStore.toggleFavorite("ag-tres-gestos");
  assert.equal(newFav, !initialFav);

  // Restore
  libraryStore.toggleFavorite("ag-tres-gestos");
});

test("library: route /biblioteca renders overview with tabs and search", async () => {
  const html = await renderRoute("/biblioteca");
  assert.ok(html.includes("Biblioteca Pessoal"));
  assert.ok(html.includes("A TUA COLEÇÃO"));
  assert.ok(html.includes("A ler"));
  assert.ok(html.includes("Concluídas"));
  assert.ok(html.includes("Carta de abertura"));
  assert.ok(html.includes("Continuar leitura"));
});

test("library: route /biblioteca/favoritos renders favorite works", async () => {
  const html = await renderRoute("/biblioteca/favoritos");
  assert.ok(html.includes("Obras Favoritas"));
  assert.ok(html.includes("Carta de abertura"));
});

test("library: route /biblioteca/historico renders reading history", async () => {
  const html = await renderRoute("/biblioteca/historico");
  assert.ok(html.includes("Histórico de Leitura"));
  assert.ok(html.includes("HISTÓRICO DE SESSÕES"));
  assert.ok(html.includes("lido"));
});

test("library: route /biblioteca/listas renders reading lists overview", async () => {
  const html = await renderRoute("/biblioteca/listas");
  assert.ok(html.includes("Listas de Leitura"));
  assert.ok(html.includes("Ficção e Narrativas Especulativas"));
  assert.ok(html.includes("Nova lista"));
});

test("library: route /biblioteca/listas/:id renders list detail and contained works", async () => {
  const html = await renderRoute("/biblioteca/listas/lista-ficcao");
  assert.ok(html.includes("Ficção e Narrativas Especulativas"));
  assert.ok(html.includes("Carta de abertura"));
  assert.ok(html.includes("Eliminar lista"));
});
