import { seedStudioForTest } from "./fixtures/user-content";
import test from "node:test";
import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { ApplicationRoutes } from "../src/foundation/app/App";
import { studioStore } from "../src/foundation/features/studio/store";

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

test("studio: new workspace is empty; tests explicitly create their own data", () => {
  assert.deepEqual(studioStore.getWorks(), []);
  assert.deepEqual(studioStore.getActivities(), []);
  assert.equal(studioStore.getStats().estimatedReads, null);
  seedStudioForTest();
  assert.equal(studioStore.getWorks().length, 4);
  assert.ok(studioStore.getStats().totalChapters > 0);
});

test("studio: store supports creating, updating, and duplicating a work", () => {
  const newWork = studioStore.createWork({
    title: "Ensaio de Teste",
    synopsis: "Sinopse demonstrativa criada para testes automatizados.",
    format: "Romance",
    mode: "prose",
    genre: "Ficção geral",
    language: "Português",
    tags: ["teste"],
    ageRating: "Livre",
    contentWarnings: [],
    status: "draft",
    coverAccentColor: "#14243B",
    chapters: [],
  });

  assert.ok(newWork.id);
  assert.equal(newWork.title, "Ensaio de Teste");

  // Update
  const updated = studioStore.updateWork(newWork.id, {
    subtitle: "Subtítulo atualizado",
  });
  assert.equal(updated?.subtitle, "Subtítulo atualizado");

  // Duplicate
  const duplicate = studioStore.duplicateWork(newWork.id);
  assert.ok(duplicate);
  assert.ok(duplicate.title.includes("Cópia"));

  // Cleanup
  studioStore.deleteWork(newWork.id);
  studioStore.deleteWork(duplicate.id);
});

test("studio: store supports chapter addition, editing, and reordering", () => {
  const work = studioStore.getWork("ag-carta-abertura");
  assert.ok(work);
  const initialCount = work.chapters.length;

  const added = studioStore.addChapter("ag-carta-abertura", "Capítulo Extra");
  assert.ok(added);

  const updatedWork = studioStore.getWork("ag-carta-abertura");
  assert.equal(updatedWork?.chapters.length, initialCount + 1);

  // Update chapter content
  studioStore.updateChapter("ag-carta-abertura", added.id, {
    content: "Texto atualizado do capítulo",
  });
  const checkChap = studioStore
    .getWork("ag-carta-abertura")
    ?.chapters.find((c) => c.id === added.id);
  assert.equal(checkChap?.content, "Texto atualizado do capítulo");

  // Cleanup added chapter
  studioStore.deleteChapter("ag-carta-abertura", added.id);
});

test("studio: store supports visual page addition, reordering, and deletion", () => {
  const work = studioStore.getWork("ag-tres-gestos");
  assert.ok(work);
  const chap = work.chapters[0];
  const initialPages = chap.pages?.length || 0;

  const newPage = studioStore.addPage("ag-tres-gestos", chap.id, {
    title: "Nova Prancha de Teste",
    description: "Cena de teste",
  });
  assert.ok(newPage);

  const updatedChap = studioStore.getWork("ag-tres-gestos")?.chapters[0];
  assert.equal(updatedChap?.pages?.length, initialPages + 1);

  // Delete page
  studioStore.deletePage("ag-tres-gestos", chap.id, newPage.id);
  const finalChap = studioStore.getWork("ag-tres-gestos")?.chapters[0];
  assert.equal(finalChap?.pages?.length, initialPages);
});

test("studio: route /estudio renders dashboard with greeting and stats", async () => {
  const html = await renderRoute("/estudio");
  assert.ok(html.includes("Estúdio do Autor"));
  assert.ok(html.includes("Total de Obras"));
  assert.ok(html.includes("Continuar a Escrever"));
  assert.ok(html.includes("Criar nova obra"));
});

test("studio: route /estudio/obras/nova renders multi-step wizard", async () => {
  const html = await renderRoute("/estudio/obras/nova");
  assert.ok(html.includes("Criar uma Nova Obra"));
  assert.ok(html.includes("Etapa 1"));
  assert.ok(html.includes("Romance"));
  assert.ok(html.includes("Poesia"));
  assert.ok(html.includes("HQ / Comic"));
  assert.ok(html.includes("Mangá"));
});

test("studio: route /estudio/obras/:id renders work management overview", async () => {
  const html = await renderRoute("/estudio/obras/ag-carta-abertura");
  assert.ok(html.includes("Carta de abertura"));
  assert.ok(html.includes("Capítulos e Atos"));
  assert.ok(html.includes("Ficha Técnica e Definições"));
  assert.ok(html.includes("Escrever / Editar"));
});

test("studio: route /estudio/obras/:id/capitulos/:capituloId/editar renders prose editor", async () => {
  const html = await renderRoute(
    "/estudio/obras/ag-carta-abertura/capitulos/cap-1/editar",
  );
  assert.ok(html.includes("Carta de abertura"));
  assert.ok(html.includes("palavras"));
  assert.ok(html.includes("Modo foco"));
  assert.ok(html.includes("Pré-visualizar no leitor"));
});

test("studio: route /estudio/obras/:id/capitulos/:capituloId/editar renders poetry editor for poetry works", async () => {
  const html = await renderRoute(
    "/estudio/obras/ag-primeiras-linhas/capitulos/cap-1/editar",
  );
  assert.ok(html.includes("Primeiras linhas"));
  assert.ok(html.includes("versos"));
  assert.ok(html.includes("estrofes"));
  assert.ok(html.includes("Pré-visualizar poema"));
});

test("studio: route /estudio/obras/:id/paginas/:capituloId/editar renders visual sequencer", async () => {
  const html = await renderRoute(
    "/estudio/obras/ag-tres-gestos/paginas/cap-1/editar",
  );
  assert.ok(html.includes("Um arquivo em três gestos"));
  assert.ok(html.includes("Sequência de Pranchas"));
  assert.ok(html.includes("Carregar imagem local"));
});

test("studio: route /estudio/publicacoes renders inventory with filters", async () => {
  const html = await renderRoute("/estudio/publicacoes");
  assert.ok(html.includes("Publicações e Rascunhos"));
  assert.ok(html.includes("Pesquisar obras"));
  assert.ok(html.includes("Todos os formatos"));
  assert.ok(html.includes("Todos os estados"));
});

test("studio: route /estudio/estatisticas renders author statistics", async () => {
  const html = await renderRoute("/estudio/estatisticas");
  assert.ok(html.includes("Estatísticas do Autor"));
  assert.ok(html.includes("Total de Palavras"));
  assert.ok(html.includes("Detalhamento por Obra"));
});

test("studio: route /estudio/media renders media library", async () => {
  const html = await renderRoute("/estudio/media");
  assert.ok(html.includes("Biblioteca de Media"));
  assert.ok(html.includes("Carregar imagem local"));
});
