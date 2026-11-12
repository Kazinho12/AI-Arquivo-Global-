import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import type { Editor } from "@tiptap/react";
import { RemoteEntryEditor } from "../src/foundation/features/studio/RemoteEntryEditor";
import {
  RemoteWorksProvider,
  useRemoteWorks,
} from "../src/foundation/features/studio/RemoteWorksProvider";
import { WorksController } from "../src/foundation/features/studio/worksController";
import type { WorksRepository } from "../src/foundation/features/studio/worksRepository";
import type { StudioWork } from "../src/foundation/features/studio/types";
import {
  decodeRich,
  entryText,
  plainDocument,
} from "../src/foundation/features/writing/document";
import { sanitizePastedHtml } from "../src/foundation/features/writing/paste";
import { ProseContent } from "../src/foundation/features/reader/content";
import "../src/foundation/styles/global.css";
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const fixture = document.getElementById("fixture")!,
  root = createRoot(fixture);
const initial: StudioWork = {
  id: "work",
  ownerId: "owner",
  persistence: "supabase",
  revision: 1,
  title: "Uma obra real",
  synopsis: "Sinopse",
  format: "Romance",
  mode: "prose",
  genre: "Ficção",
  language: "pt",
  tags: [],
  ageRating: "Livre",
  contentWarnings: [],
  coverAccentColor: "#14243B",
  status: "draft",
  createdAt: "2026-11-12",
  updatedAt: "2026-11-12",
  chapters: [
    {
      id: "entry",
      revision: 1,
      number: 1,
      title: "Capítulo antigo",
      content: "Primeiro parágrafo.\n\n**Palavras fortes**\nlinha seguinte",
      entryType: "chapter",
    },
  ],
};
let stored = structuredClone(initial),
  offline = false,
  conflict = false,
  readOnly = false,
  delay = 0,
  saves = 0;
const repository: WorksRepository = {
  list: async () => [structuredClone(stored)],
  find: async () => structuredClone(stored),
  create: async () => stored,
  update: async () => stored,
  remove: async () => {},
  editorial: async (w, action, payload = {}) => {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    if (offline) throw Error("Rede indisponível");
    if (conflict || w.revision !== stored.revision)
      throw Error("Conflito de revisão");
    if (action !== "save_entry")
      throw Error("Operação de fixture não suportada");
    check(
      payload.entry_revision === stored.chapters[0].revision,
      "Revisão da entrada errada",
    );
    saves++;
    stored = {
      ...stored,
      revision: stored.revision! + 1,
      chapters: [
        {
          ...stored.chapters[0],
          title: payload.title as string,
          content: payload.content as string,
          alignment: payload.alignment as "left" | "center",
          revision: stored.chapters[0].revision! + 1,
        },
      ],
    };
    return { work: structuredClone(stored) };
  },
};
let controller: WorksController;
function Harness() {
  const state = useRemoteWorks();
  const work = state.works[0];
  return work ? (
    <RemoteEntryEditor
      key={work.chapters[0].id}
      work={work}
      entry={work.chapters[0]}
    />
  ) : (
    <p>A carregar fixture…</p>
  );
}
const pause = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms));
function check(value: unknown, message: string): asserts value {
  if (!value) throw Error(message);
}
async function waitFor(test: () => unknown, message: string) {
  for (let i = 0; i < 600; i++) {
    if (test()) return;
    await act(async () => pause());
  }
  throw Error(message + ": " + fixture.textContent?.slice(0, 300));
}
function editor(): Editor {
  const node = fixture.querySelector<HTMLElement>(
    "[contenteditable]",
  ) as HTMLElement & { editor: Editor };
  check(node?.editor, "Sem instância Tiptap");
  return node.editor;
}
async function mount() {
  await act(async () => root.render(null));
  controller = new WorksController(repository);
  const router = createMemoryRouter(
    [
      {
        path: "*",
        element: (
          <RemoteWorksProvider controller={controller}>
            <Harness />
          </RemoteWorksProvider>
        ),
      },
    ],
    { initialEntries: ["/editor"], future: { v7_relativeSplatPath: true } },
  );
  await act(async () => {
    root.render(
      <React.StrictMode>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </React.StrictMode>,
    );
    await pause();
  });
  await waitFor(
    () => fixture.querySelector("[contenteditable]"),
    "Editor não abriu",
  );
  return router;
}
async function click(label: string) {
  const scope = fixture.querySelector("dialog[open]") ?? fixture;
  const button = [...scope.querySelectorAll<HTMLButtonElement>("button")].find(
    (el) =>
      el.getAttribute("aria-label") === label ||
      el.textContent?.trim() === label,
  );
  check(button, "Botão ausente: " + label);
  await act(async () => {
    button.click();
    await pause();
  });
}
async function text(value: string) {
  await act(async () => {
    editor().commands.setContent(plainDocument(value));
    await pause();
  });
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
    (
      window as typeof window & { testDriver: (message: string) => void }
    ).testDriver(JSON.stringify({ ...input, id }));
  });
}
const results: { name: string; ok: boolean; error?: string }[] = [];
async function run(name: string, task: () => Promise<void>) {
  stored = structuredClone(initial);
  offline = false;
  conflict = false;
  delay = 0;
  saves = 0;
  try {
    await task();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error: String(error) });
  } finally {
    await act(async () => root.render(null));
  }
}
await run(
  "Writing: legacy import is lossless without automatic writes; toolbar formats, active states, links and undo",
  async () => {
    await mount();
    check(
      editor().getText().includes("Primeiro parágrafo."),
      "Perdeu texto antigo",
    );
    check(
      fixture.querySelector(".writing-surface strong"),
      "Perdeu negrito legado",
    );
    await act(async () => pause(1700));
    check(saves === 0, "Converteu capítulo antigo sem edição");
    await act(async () => {
      editor().commands.selectAll();
      await pause();
    });
    await click("Negrito (Ctrl+B)");
    check(editor().isActive("bold"), "Negrito não aplicado");
    check(
      fixture
        .querySelector('[aria-label="Negrito (Ctrl+B)"]')
        ?.getAttribute("aria-pressed") === "true",
      "Sem estado ativo",
    );
    await click("Itálico (Ctrl+I)");
    await click("Sublinhado (Ctrl+U)");
    await click("Riscado");
    await click("Centrar");
    check(
      editor().isActive({ textAlign: "center" }),
      "Alinhamento não aplicado",
    );
    await click("Inserir ou editar link (Ctrl+K)");
    const input = fixture.querySelector<HTMLInputElement>("dialog input")!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!.call(input, "https://example.com");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await click("Aplicar link");
    check(editor().isActive("link"), "Link não aplicado");
    await click("Desfazer (Ctrl+Z)");
    check(!editor().isActive("link"), "Desfazer falhou");
    await click("Refazer (Ctrl+Shift+Z)");
    check(editor().isActive("link"), "Refazer falhou");
    await text("Estrutura editorial");
    await act(async () => {
      editor().commands.selectAll();
    });
    await click("Título H2");
    check(fixture.querySelector(".writing-surface h2"), "H2 indisponível");
    await click("Título H2");
    await click("Título H3");
    check(fixture.querySelector(".writing-surface h3"), "H3 indisponível");
    await click("Título H3");
    await click("Lista numerada");
    check(
      fixture.querySelector(".writing-surface ol li"),
      "Lista numerada indisponível",
    );
    await click("Lista numerada");
    await click("Citação");
    check(
      fixture.querySelector(".writing-surface blockquote"),
      "Citação indisponível",
    );
    await click("Citação");
    await click("Separador");
    check(
      fixture.querySelector(".writing-surface hr"),
      "Separador indisponível",
    );
  },
);
await run(
  "Writing: rich Word/web paste is sanitized, safe structures preserved and plain paste is literal",
  async () => {
    await mount();
    const html =
      '<h1 onclick="evil()">Título</h1><p><span style="font-weight:700;text-decoration:underline;color:red">Forte</span><a href="javascript:evil()"> inseguro</a></p><ul><li>Item</li></ul><blockquote>Citação</blockquote><script>window.evil=true</script><img src=x onerror="evil()">';
    const data = new DataTransfer();
    data.setData("text/html", html);
    data.setData("text/plain", "Texto alternativo");
    await act(async () => {
      editor().commands.selectAll();
      editor().view.dom.dispatchEvent(
        new ClipboardEvent("paste", {
          clipboardData: data,
          bubbles: true,
          cancelable: true,
        }),
      );
      await pause();
    });
    check(
      fixture.querySelector(".writing-surface h1"),
      "Título colado perdido",
    );
    check(
      fixture.querySelector(
        ".writing-surface strong u,.writing-surface u strong",
      ),
      "Estilos Word perdidos",
    );
    check(fixture.querySelector(".writing-surface ul li"), "Lista perdida");
    check(
      !fixture.querySelector(
        '.writing-surface [onclick],.writing-surface script,.writing-surface img,.writing-surface a[href^="javascript"]',
      ),
      "HTML inseguro",
    );
    const clean = sanitizePastedHtml(
      '<p style="position:fixed;background:url(https://evil.invalid);text-align:right">Seguro</p>',
    );
    check(
      !clean.includes("position") &&
        !clean.includes("evil.invalid") &&
        clean.includes("text-align"),
      "Estilos não filtrados",
    );
    await act(async () => {
      fixture
        .querySelector<HTMLInputElement>(".writing-paste-controls input")!
        .click();
      editor().commands.selectAll();
      const data = new DataTransfer();
      data.setData("text/plain", "**Sem formatação**");
      data.setData("text/html", "<b>Formatado</b>");
      editor().view.dom.dispatchEvent(
        new ClipboardEvent("paste", {
          clipboardData: data,
          bubbles: true,
          cancelable: true,
        }),
      );
      await pause();
    });
    check(
      editor().getText().includes("**Sem formatação**"),
      "Colagem simples interpretou markup",
    );
    check(
      !fixture.querySelector(".writing-surface strong"),
      "Colagem simples herdou negrito",
    );
    await act(async () => {
      fixture
        .querySelector<HTMLInputElement>(".writing-paste-controls input")!
        .click();
      editor().commands.selectAll();
      editor().view.dom.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "V",
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
        }),
      );
      const data = new DataTransfer();
      data.setData("text/plain", "**Atalho simples**");
      data.setData("text/html", "<strong>Rico</strong>");
      editor().view.dom.dispatchEvent(
        new ClipboardEvent("paste", {
          clipboardData: data,
          bubbles: true,
          cancelable: true,
        }),
      );
      await pause();
    });
    check(
      editor().getText() === "**Atalho simples**" &&
        !fixture.querySelector(".writing-surface strong"),
      "Ctrl+Shift+V aplicou formatação",
    );
  },
);
await run(
  "Writing: debounce saves once, survives reload, renders public formatting and does not rewrite again",
  async () => {
    await mount();
    await text("Texto persistente");
    await act(async () => {
      editor().commands.selectAll();
      editor().commands.toggleBold();
    });
    await waitFor(() => saves === 1, "Autosave não ocorreu");
    check(
      decodeRich(stored.chapters[0].content!) !== null,
      "Sem formato canónico",
    );
    check(
      entryText(stored.chapters[0].content!) === "Texto persistente",
      "Texto alterado",
    );
    await mount();
    check(editor().getText() === "Texto persistente", "Recarga perdeu texto");
    check(
      fixture.querySelector(".writing-surface strong"),
      "Recarga perdeu formato",
    );
    await act(async () => pause(1700));
    check(saves === 1, "Gravações desnecessárias");
    await click("Pré-visualizar capítulo");
    check(
      fixture.querySelector(".writing-preview strong"),
      "Pré-visualização perdeu formato",
    );
    check(
      !fixture.querySelector("[contenteditable]"),
      "Pré-visualização ainda editável",
    );
    await click("Voltar à edição");
    await click("Modo foco");
    check(fixture.querySelector(".writing-focus"), "Modo foco falhou");
  },
);
await run(
  "Writing: delayed save cannot overwrite text typed during the request",
  async () => {
    await mount();
    delay = 450;
    await text("Primeira edição");
    await act(async () => {
      fixture
        .querySelectorAll<HTMLButtonElement>("button")
        .forEach((button) => {
          if (button.textContent?.trim() === "Guardar alterações")
            button.click();
        });
      await pause(50);
    });
    await text("Segunda edição durante a gravação");
    await waitFor(
      () => stored.chapters[0].content?.includes("Primeira edição"),
      "Primeiro ACK ausente",
    );
    check(
      editor().getText() === "Segunda edição durante a gravação",
      "ACK sobrescreveu edição atual",
    );
    await waitFor(
      () =>
        entryText(stored.chapters[0].content ?? "") ===
        "Segunda edição durante a gravação",
      "Segunda edição não guardou",
    );
    check(saves === 2, "Corrida duplicou gravações");
  },
);
await run(
  "Writing: network/revision failures preserve buffers, pause retries and explicit recovery restores server data",
  async () => {
    await mount();
    offline = true;
    await text("Texto local a preservar");
    await waitFor(
      () => fixture.querySelector('[role="alert"]'),
      "Falha invisível",
    );
    check(
      editor().getText() === "Texto local a preservar",
      "Rede apagou texto",
    );
    check(controller.editorBuffers.has("entry"), "Buffer perdido");
    await act(async () => pause(1800));
    check(saves === 0, "Erro provocou retry automático");
    offline = false;
    conflict = true;
    await click("Guardar alterações");
    check(
      fixture.textContent?.includes("Conflito de revisão"),
      "Conflito invisível",
    );
    check(
      editor().getText() === "Texto local a preservar",
      "Conflito apagou texto",
    );
    conflict = false;
    await click("Recuperar última versão persistida");
    await click("Confirmar recuperação");
    check(
      editor().getText().includes("Primeiro parágrafo"),
      "Recuperação falhou",
    );
    check(
      !controller.editorBuffers.has("entry"),
      "Recuperação manteve buffer obsoleto",
    );
  },
);
await run(
  "Writing: archived entries remain read-only and 320px layout stays within the viewport",
  async () => {
    stored.archivedAt = "2026-11-12";
    await mount();
    check(editor().isEditable === false, "Obra arquivada editável");
    check(saves === 0, "Arquivada foi guardada");
    const toolbar = fixture.querySelector<HTMLElement>(".writing-toolbar")!;
    check(toolbar.getAttribute("role") === "toolbar", "Sem toolbar semântica");
    check(
      editor().view.dom.getAttribute("aria-multiline") === "true",
      "Editor sem acessibilidade",
    );
    for (const theme of ["light", "dark"]) {
      document.documentElement.dataset.theme = theme;
      for (const width of [320, 375, 768]) {
        await act(async () => {
          await drive({ kind: "viewport", width });
          await pause();
        });
        check(
          document.documentElement.scrollWidth <= window.innerWidth + 2,
          "Overflow no editor",
        );
      }
    }
    await act(async () => {
      await drive({ kind: "viewport", width: 1280 });
      await pause();
      await drive({ kind: "screenshot", label: "writing-studio" });
    });
  },
);
await run(
  "Writing: legacy documents ending with headings/lists/quotes never convert on mount",
  async () => {
    for (const original of [
      "# Título final",
      "- Primeiro\n- Segundo",
      "> Última citação",
    ]) {
      stored = {
        ...structuredClone(initial),
        chapters: [{ ...initial.chapters[0], content: original }],
      };
      await mount();
      await act(async () => pause(1700));
      check(
        saves === 0 && stored.chapters[0].content === original,
        "Abertura alterou conteúdo legado",
      );
    }
  },
);
document.getElementById("results")!.textContent = JSON.stringify(results);
document.documentElement.dataset.tests = results.every((r) => r.ok)
  ? "passed"
  : "failed";
