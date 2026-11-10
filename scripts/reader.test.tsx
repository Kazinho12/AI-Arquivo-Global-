import test from "node:test";
import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { ApplicationRoutes } from "../src/foundation/app/App";
import {
  getWorkReadingData,
  demoReadingLibrary,
} from "../src/foundation/features/reader/data";
import { ProseReader } from "../src/foundation/features/reader/ProseReader";
import { PoetryReader } from "../src/foundation/features/reader/PoetryReader";
import { ComicReader } from "../src/foundation/features/reader/ComicReader";
import { MangaReader } from "../src/foundation/features/reader/MangaReader";

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

function renderComponent(node: React.ReactNode): Promise<string> {
  return new Promise((resolve, reject) => {
    const output = new PassThrough();
    let html = "";
    output.on("data", (chunk) => {
      html += chunk.toString();
    });
    output.on("end", () => resolve(html));
    output.on("error", reject);
    const stream = renderToPipeableStream(
      <StaticRouter location="/">{node}</StaticRouter>,
      {
        onAllReady() {
          stream.pipe(output);
        },
        onError: reject,
      },
    );
  });
}

test("reader: getWorkReadingData returns correct mode and chapters for known works", () => {
  const atlas = getWorkReadingData("ag-carta-abertura")!;
  assert.equal(atlas.mode, "prose");
  assert.equal(atlas.chapters.length, 2);
  assert.equal(atlas.chapters[0].title, "Uma porta entreaberta");

  const silencio = getWorkReadingData("ag-primeiras-linhas")!;
  assert.equal(silencio.mode, "poetry");
  assert.ok(silencio.chapters[0].stanzas);

  const cidade = getWorkReadingData("ag-tres-gestos")!;
  assert.equal(cidade.mode, "comic");
  assert.ok(cidade.chapters[0].pages);

  const jardim = getWorkReadingData("ag-outra-margem")!;
  assert.equal(jardim.mode, "manga");
  assert.ok(jardim.chapters[0].pages);
});

test("reader: ProseReader renders chapter heading, text, and typography affordances", async () => {
  const data = demoReadingLibrary["ag-carta-abertura"];
  const html = await renderComponent(
    <ProseReader
      workId={data.workId}
      workTitle={data.title}
      author={data.author}
      chapters={data.chapters}
      currentChapter={data.chapters[0]}
    />,
  );
  assert.ok(html.includes("Uma porta entreaberta"));
  assert.ok(html.includes("Arquivo Global — Equipa Editorial"));
  assert.ok(html.includes("Capítulo 1"));
  assert.ok(html.includes("Tipografia"));
  assert.ok(html.includes("Modo foco"));
  assert.ok(html.includes("Próximo capítulo"));
});

test("reader: PoetryReader strictly preserves stanzas and verses", async () => {
  const data = demoReadingLibrary["ag-primeiras-linhas"];
  const html = await renderComponent(
    <PoetryReader
      workId={data.workId}
      workTitle={data.title}
      author={data.author}
      chapters={data.chapters}
      currentChapter={data.chapters[0]}
    />,
  );
  assert.ok(html.includes("Página"));
  assert.ok(html.includes("A página não pede pressa,"));
  assert.ok(html.includes("poetry-stanza"));
  assert.ok(html.includes("poetry-verse"));
  assert.ok(html.includes("Poema 1 de 3"));
});

test("reader: ComicReader renders illustrated plates with zoom controls", async () => {
  const data = demoReadingLibrary["ag-tres-gestos"];
  const html = await renderComponent(
    <ComicReader
      workId={data.workId}
      workTitle={data.title}
      author={data.author}
      chapters={data.chapters}
      currentChapter={data.chapters[0]}
    />,
  );
  assert.ok(html.includes("Encontrar e abrir"));
  assert.ok(html.includes("comic-reader-container"));
  assert.ok(html.includes("Vertical"));
  assert.ok(html.includes("Página"));
});

test("reader: MangaReader displays RTL directional cues and Japanese page count", async () => {
  const data = demoReadingLibrary["ag-outra-margem"];
  const html = await renderComponent(
    <MangaReader
      workId={data.workId}
      workTitle={data.title}
      author={data.author}
      chapters={data.chapters}
      currentChapter={data.chapters[0]}
    />,
  );
  assert.ok(html.includes("Um começo à direita"));
  assert.ok(html.includes("RTL (Direita ➔ Esquerda)"));
  assert.ok(html.includes("manga-reader-container"));
});

test("reader: route /obras/:id/capitulos/:capituloId renders via SSR", async () => {
  const html = await renderRoute("/obras/ag-carta-abertura/capitulos/cap-1");
  assert.ok(html.includes("Uma porta entreaberta"));
  assert.ok(html.includes("Carta de abertura"));
});

test("reader: route /obras/:id/paginas/:capituloId renders via SSR", async () => {
  const html = await renderRoute("/obras/ag-tres-gestos/paginas/cap-1");
  assert.ok(html.includes("Um arquivo em três gestos"));
  assert.ok(html.includes("comic-reader-container"));
});

test("reader: route /obras/:id/comentarios renders comments feed", async () => {
  const html = await renderRoute("/obras/ag-carta-abertura/comentarios");
  assert.ok(html.includes("Comentários sobre Carta de abertura"));
  assert.ok(html.includes("Guardar nota local"));
});

test("reader: route /obras/:id/avaliacoes renders qualitative reviews", async () => {
  const html = await renderRoute("/obras/ag-carta-abertura/avaliacoes");
  assert.ok(html.includes("Avaliações e impressões críticas"));
  assert.ok(html.includes("Escrever uma avaliação"));
  assert.ok(!html.includes("Cartografia lírica e precisão atmosférica"));
  assert.ok(html.includes("Ainda não há avaliações locais"));
});
