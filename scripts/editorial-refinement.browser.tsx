import { productRoutes } from "../src/foundation/app/routes";
import {
  inauguralWorks,
  inauguralReading,
  editorialIdentity,
} from "./fixtures/editorial-fixture";
import { studioStore } from "../src/foundation/features/studio/store";
import { libraryStore } from "../src/foundation/features/library/store";
import {
  selectScope,
  flushLocal,
  exportLocal,
} from "../src/foundation/features/local/persistence";
import { CommentsPage } from "../src/foundation/pages/Reader";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import {
  createMemoryRouter,
  RouterProvider,
  MemoryRouter,
} from "react-router-dom";
import { ApplicationRoutes } from "../src/foundation/app/App";

import {
  CompletionContext,
  ResourceState,
  useResource,
} from "../src/foundation/features/completion/ui";
import {
  completionService,
  type CompletionService,
  type ReadResult,
  type ResourceMap,
  type Person,
} from "../src/foundation/features/completion/data";
import "../src/foundation/styles/global.css";
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const fixture = document.getElementById("fixture")!;
let root = createRoot(fixture);
const results: { name: string; ok: boolean; error?: string }[] = [];
const pause = (ms = 0) => new Promise((r) => setTimeout(r, ms));
function check(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
let driverId = 0;
function drive(input: object) {
  return new Promise<void>((resolve) => {
    const id = ++driverId;
    const done = (event: Event) => {
      if ((event as CustomEvent).detail === id) {
        window.removeEventListener("test-driver-done", done);
        resolve();
      }
    };
    window.addEventListener("test-driver-done", done);
    window.testDriver(JSON.stringify({ ...input, id }));
  });
}
async function run(name: string, action: () => Promise<void>) {
  try {
    await action();
    results.push({ name, ok: true });
  } catch (e) {
    results.push({ name, ok: false, error: String(e) });
  } finally {
    await act(async () => root.unmount());
    root = createRoot(fixture);
  }
}
async function waitFor(checker: () => unknown, message: string) {
  for (let i = 0; i < 100; i++) {
    if (checker()) return;
    await act(async () => pause(20));
  }
  throw new Error(message);
}
async function mount(path: string) {
  await act(async () => root.unmount());
  root = createRoot(fixture);
  const router = createMemoryRouter(
    [{ path: "*", element: <ApplicationRoutes /> }],
    { initialEntries: [path], future: { v7_relativeSplatPath: true } },
  );
  await act(async () => {
    root.render(
      <RouterProvider router={router} future={{ v7_startTransition: true }} />,
    );
    await pause();
  });
  await waitFor(
    () =>
      fixture.querySelector("main") && !fixture.querySelector(".loading-page"),
    "Tela não abriu: " + path,
  );
  await act(async () => pause(10));
  return router;
}
const buttons = () => [
  ...fixture.querySelectorAll<HTMLButtonElement>("button"),
];
async function click(text: string) {
  const button = buttons().find((b) => b.textContent?.includes(text));
  check(button && !button.disabled, "Botão indisponível: " + text);
  await act(async () => {
    button.click();
    await pause();
  });
}
async function input(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) {
  await act(async () => {
    const proto =
      element instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    await pause();
  });
}
async function select(label: string, value: string) {
  const field = [...fixture.querySelectorAll("label")]
    .find((l) => l.textContent?.includes(label))
    ?.querySelector("select");
  check(field, "Select ausente: " + label);
  await act(async () => {
    field.value = value;
    field.dispatchEvent(new Event("change", { bubbles: true }));
    await pause();
  });
}

selectScope("user:phase-e-browser");
const drafts = inauguralWorks.map((w) =>
  studioStore.createWork({
    title: "Rascunho de teste " + w.title,
    synopsis: w.synopsis,
    format: w.format as "Conto" | "Poesia" | "HQ / Comic" | "Mangá",
    mode: w.readingMode,
    genre: w.genre,
    language: "Português",
    tags: [],
    ageRating: "Livre",
    contentWarnings: [],
    status: "draft",
    coverAccentColor: "#14243b",
    chapters: structuredClone(inauguralReading[w.id].chapters),
  }),
);
const list = libraryStore.createList(
  "Lista de teste de navegação",
  "Criada pela suite, não é uma seed da aplicação.",
);
function routePath(path: string) {
  let workId = path.startsWith("/estudio")
    ? path.includes("/paginas/")
      ? drafts[2].id
      : drafts[0].id
    : path.includes("/paginas/")
      ? inauguralWorks[2].id
      : inauguralWorks[0].id;
  if (path.startsWith("/biblioteca/listas/")) workId = list.id;
  if (path.startsWith("/sistema/logs/")) workId = "unknown";
  return path
    .replace(":id", workId)
    .replace(":capituloId", "cap-1")
    .replace(":username", editorialIdentity.username)
    .replace(":slug", "memoria");
}
await run(
  "E: 57 rotas, cinco larguras e dois temas; sem overflow e com hierarquia de títulos",
  async () => {
    const problems: string[] = [];
    for (const route of productRoutes.filter(
      (r) =>
        !location.search.includes("debug") ||
        ["/", "/biblioteca", "/obras/:id/paginas/:capituloId"].includes(r.path),
    )) {
      const path = routePath(route.path);
      await mount(path);
      if (fixture.querySelectorAll("h1").length !== 1)
        problems.push("h1 " + path);
      for (const field of fixture.querySelectorAll<HTMLInputElement>(
        "input, select, textarea",
      )) {
        if (
          field.type !== "hidden" &&
          field.getClientRects().length &&
          !(
            field.labels?.length ||
            field.getAttribute("aria-label") ||
            field.getAttribute("aria-labelledby") ||
            field.title
          )
        )
          problems.push("Label " + path + " " + field.outerHTML.slice(0, 140));
      }
      for (const theme of ["dark", "light"])
        for (const width of [320, 375, 768, 1024, 1440]) {
          document.documentElement.dataset.theme = theme;
          await drive({ kind: "viewport", width });
          if (document.documentElement.scrollWidth > width + 1)
            problems.push(
              `Overflow ${path} ${width} ${theme}: ${document.documentElement.scrollWidth}; ` +
                [...fixture.querySelectorAll<HTMLElement>("*")]
                  .filter(
                    (el) =>
                      el.getBoundingClientRect().right > width + 1 &&
                      el.children.length === 0,
                  )
                  .slice(0, 8)
                  .map(
                    (el) =>
                      el.tagName +
                      "." +
                      el.className +
                      "=" +
                      Math.round(el.getBoundingClientRect().right) +
                      ":" +
                      el.parentElement?.className +
                      ":" +
                      el.textContent?.slice(0, 30),
                  )
                  .join(","),
            );
        }
    }
    check(!problems.length, problems.join("; "));
  },
);
await run("Public discovery has no bundled works or author", async () => {
  for (const url of [
    "/",
    "/catalogo",
    "/pesquisa",
    "/tendencias",
    "/utilizadores/equipa-editorial",
  ]) {
    await mount(url);
    check(
      !fixture.textContent?.includes("Carta de abertura"),
      "Obra fictícia exposta",
    );
    check(
      !fixture.textContent?.includes("Arquivo Global — Equipa Editorial"),
      "Perfil fictício exposto",
    );
  }
});
await run("Removed readers never serve bundled chapters", async () => {
  for (const work of inauguralWorks) {
    const data = inauguralReading[work.id];
    const segment = ["comic", "manga"].includes(data.mode)
      ? "paginas"
      : "capitulos";
    await mount(`/obras/${work.id}/${segment}/cap-1`);
    check(
      !fixture.textContent?.includes(data.chapters[0].title),
      "Texto fictício exposto",
    );
    check(
      !fixture.querySelector('img[src^="/editorial/"]'),
      "Imagem retirada exposta",
    );
  }
});
await run("Removed work has no local notes screen", async () => {
  await mount("/obras/ag-carta-abertura/comentarios");
  check(
    fixture.textContent?.includes("404"),
    "Obra local retirada ainda existe",
  );
});
await run(
  "E: coleções editoriais coerentes e lista privada persistida sem exposição pública",
  async () => {
    await mount("/colecoes");
    check(
      fixture.querySelectorAll(".completion-grid article").length === 0,
      "Coleções fictícias expostas",
    );
    await click("Criar lista privada");
    await input(
      fixture.querySelector<HTMLInputElement>("dialog input")!,
      "Lista privada criada por mim",
    );
    await click("Criar lista neste navegador");
    flushLocal();
    check(
      fixture.textContent?.includes("Lista privada criada por mim"),
      "Lista privada ausente",
    );
    await select("Visibilidade", "editorial");
    check(
      !fixture.textContent?.includes("Lista privada criada por mim"),
      "Lista privada exposta",
    );
    await mount("/biblioteca/listas");
    check(
      fixture.textContent?.includes("Lista privada criada por mim"),
      "Integração biblioteca ausente",
    );
  },
);
await run(
  "E: ausência de interações/métricas fabricadas e preservação dos dados anteriores",
  async () => {
    for (const path of [
      "/notificacoes",
      "/utilizadores/equipa-editorial/seguidores",
      "/moderacao/denuncias",
      "/sistema/monitorizacao",
      "/estudio/estatisticas",
    ]) {
      await mount(path);
      check(
        !fixture.textContent?.includes("78%") &&
          !fixture.textContent?.includes("120 ms"),
        "Métrica fabricada",
      );
      check(
        !buttons().some((b) =>
          b.textContent?.includes("Explorar demonstração"),
        ),
        "Demo social ativa",
      );
    }
    const previous = {
      workId: "atlas-das-mares",
      title: "Título anterior preservado",
      author: "Assinatura anterior",
      format: "Romance",
    };
    await act(async () => {
      libraryStore.addOrUpdate(previous);
      flushLocal();
      await pause();
    });
    await mount("/biblioteca");
    check(
      fixture.textContent?.includes(previous.title),
      "Dados antigos apagados",
    );
    check(
      !inauguralWorks.some((w) => w.id === previous.workId),
      "ID antigo reatribuído",
    );
  },
);
await run("E: capturas de revisão editorial", async () => {
  await mount("/catalogo");
  document.documentElement.dataset.theme = "light";
  await drive({ kind: "viewport", width: 1440 });
  await drive({ kind: "screenshot", label: "editorial-catalog-desktop" });
  await mount("/obras/ag-carta-abertura");
  document.documentElement.dataset.theme = "dark";
  await drive({ kind: "viewport", width: 375 });
  await drive({ kind: "screenshot", label: "editorial-work-mobile" });
  await mount("/obras/ag-tres-gestos/paginas/cap-1");
  await drive({ kind: "viewport", width: 768 });
  await drive({ kind: "screenshot", label: "editorial-reader-tablet" });
});
await act(async () => root.unmount());
document.getElementById("results")!.textContent = JSON.stringify(results);
document.documentElement.dataset.tests = results.every((r) => r.ok)
  ? "passed"
  : "failed";
