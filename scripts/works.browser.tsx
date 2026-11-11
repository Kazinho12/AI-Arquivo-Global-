import { PublicCatalogProvider } from "../src/foundation/features/catalog/PublicCatalog";
import type {
  PublishedWork,
  PublicWorksRepository,
} from "../src/foundation/features/catalog/repository";
import { AuthProvider } from "../src/foundation/features/auth/AuthProvider";
import {
  initialAuthState,
  type AuthState,
  type AuthController,
} from "../src/foundation/features/auth/controller";
import type { User } from "@supabase/supabase-js";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { ApplicationRoutes } from "../src/foundation/app/App";
import {
  RemoteWorksProvider,
  useRemoteWorks,
} from "../src/foundation/features/studio/RemoteWorksProvider";
import { WorksController } from "../src/foundation/features/studio/worksController";
import type {
  WorksRepository,
  DraftMetadata,
} from "../src/foundation/features/studio/worksRepository";
import { modeForFormat } from "../src/foundation/features/studio/worksRepository";
import type { StudioWork } from "../src/foundation/features/studio/types";
import {
  studioStore,
  getStoredWorks,
} from "../src/foundation/features/studio/store";
import { selectScope } from "../src/foundation/features/local/persistence";
import "../src/foundation/styles/global.css";
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const fixture = document.getElementById("fixture")!;
const root = createRoot(fixture);
const rows = new Map<string, StudioWork>();
let networkError = false;
const editions = new Map<string, PublishedWork>();
const publicRepository: PublicWorksRepository = {
  async list() {
    if (networkError) throw Error("Catálogo indisponível");
    return [...editions.values()];
  },
  async find(id) {
    if (networkError) throw Error("Catálogo indisponível");
    return editions.get(id) ?? null;
  },
};
const metadata: DraftMetadata = {
  title: "Rascunho local anterior",
  synopsis: "Preservar",
  format: "Romance",
  genre: "Ficção",
  language: "Português",
  tags: [],
  ageRating: "Livre",
  contentWarnings: [],
  coverAccentColor: "#14243B",
};
function repository(ownerId: string): WorksRepository {
  const check = () => {
    if (networkError)
      throw new Error("Falha de rede de teste; formulário preservado.");
  };
  return {
    async list() {
      check();
      return [...rows.values()].filter((row) => row.ownerId === ownerId);
    },
    async find(id) {
      check();
      return rows.get(id)?.ownerId === ownerId ? rows.get(id)! : null;
    },
    async create(input) {
      check();
      const now = new Date().toISOString();
      const work: StudioWork = {
        ...input,
        id: crypto.randomUUID(),
        ownerId,
        publicId: crypto.randomUUID(),
        slug: "obra-privada",
        mode: modeForFormat(input.format),
        status: "draft",
        persistence: "supabase",
        revision: 1,
        chapters: [],
        createdAt: now,
        updatedAt: now,
      };
      rows.set(work.id, work);
      return work;
    },
    async update(work, input) {
      check();
      if (work.ownerId !== ownerId) throw new Error("Sem permissão");
      if (rows.get(work.id)?.revision !== work.revision)
        throw new Error("Conflito de revisão: recupera a última versão.");
      const saved = { ...work, ...input, revision: work.revision! + 1 };
      rows.set(work.id, saved);
      return saved;
    },
    async editorial(work, action, payload = {}) {
      check();
      const current = rows.get(work.id);
      if (!current || current.ownerId !== ownerId)
        throw new Error("Sem permissão");
      if (current.revision !== work.revision)
        throw new Error("Conflito de revisão: recupera a última versão.");
      let saved = structuredClone(current);
      if (action === "delete_work") {
        rows.delete(work.id);
        editions.delete(work.publicId!);
        return { deletedId: work.id };
      }
      if (action === "duplicate_work") {
        saved = {
          ...saved,
          id: crypto.randomUUID(),
          title: saved.title + " (Cópia)",
          archivedAt: null,
          revision: 1,
          chapters: saved.chapters.map((entry) => ({
            ...entry,
            id: crypto.randomUUID(),
            revision: 1,
          })),
        };
      } else {
        saved.revision!++;
        if (action === "publish") {
          if (!saved.chapters.some((e) => e.content?.trim()))
            throw Error("Conteúdo obrigatório");
          const now = new Date().toISOString();
          saved.status = "published";
          saved.visibility = "public";
          saved.firstPublishedAt ??= now;
          saved.lastPublishedAt = now;
          saved.withdrawnAt = null;
          saved.publishedRevision = saved.revision;
          editions.set(saved.publicId!, {
            id: saved.publicId!,
            title: saved.title,
            author: "Autora pública",
            authorId: "autora",
            authorUsername: "autora",
            format: saved.format,
            genre: saved.genre,
            tags: saved.tags,
            synopsis: saved.synopsis,
            createdAt: now,
            cover: 1,
            origin: "user-publication",
            language: saved.language,
            ageRating: saved.ageRating,
            contentWarnings: saved.contentWarnings,
            firstPublishedAt: saved.firstPublishedAt,
            lastPublishedAt: now,
            chapters: structuredClone(saved.chapters),
          });
        }
        if (action === "withdraw") {
          saved.status = "draft";
          saved.visibility = "private";
          saved.withdrawnAt = new Date().toISOString();
          editions.delete(saved.publicId!);
        }
        if (action === "archive") saved.archivedAt = new Date().toISOString();
        if (action === "restore") saved.archivedAt = null;
        if (action === "add_entry")
          saved.chapters.push({
            id: crypto.randomUUID(),
            number: saved.chapters.length + 1,
            title:
              saved.mode === "poetry"
                ? "Poema " + (saved.chapters.length + 1)
                : "Capítulo " + (saved.chapters.length + 1),
            content: "",
            entryType:
              saved.mode === "poetry"
                ? "poem"
                : saved.mode === "prose"
                  ? "chapter"
                  : "visual",
            revision: 1,
          });
        if (action === "save_entry")
          saved.chapters = saved.chapters.map((entry) =>
            entry.id === payload.entry_id
              ? {
                  ...entry,
                  title: String(payload.title),
                  content: String(payload.content),
                  alignment: payload.alignment as "left" | "center",
                  revision: entry.revision! + 1,
                }
              : entry,
          );
        if (action === "duplicate_entry") {
          const source = saved.chapters.find(
            (entry) => entry.id === payload.entry_id,
          )!;
          saved.chapters.push({
            ...source,
            id: crypto.randomUUID(),
            title: source.title + " (Cópia)",
            number: saved.chapters.length + 1,
            revision: 1,
          });
        }
        if (action === "delete_entry")
          saved.chapters = saved.chapters
            .filter((entry) => entry.id !== payload.entry_id)
            .map((entry, index) => ({ ...entry, number: index + 1 }));
        if (action === "reorder_entries")
          saved.chapters = (payload.ids as string[]).map((id, index) => ({
            ...saved.chapters.find((entry) => entry.id === id)!,
            number: index + 1,
          }));
      }
      rows.set(saved.id, saved);
      return { work: saved };
    },
    async remove(work) {
      const result = await this.editorial!(work, "delete_work");
      if (result.deletedId !== work.id)
        throw new Error("Eliminação não confirmada");
    },
  };
}
let controller: WorksController;
async function mount(path: string, owner = "author-a") {
  await act(async () => {
    root.render(null);
  });
  selectScope("user:" + owner);
  controller = new WorksController(repository(owner));
  const router = createMemoryRouter(
    [
      {
        path: "*",
        element: (
          <RemoteWorksProvider controller={controller}>
            <PublicCatalogProvider repository={publicRepository}>
              <ApplicationRoutes />
            </PublicCatalogProvider>
          </RemoteWorksProvider>
        ),
      },
    ],
    { initialEntries: [path], future: { v7_relativeSplatPath: true } },
  );
  await act(async () => {
    root.render(
      <React.StrictMode>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </React.StrictMode>,
    );
    await new Promise((done) => setTimeout(done, 10));
  });
  await waitFor(() => fixture.querySelector("h1"), "Tela não abriu");
  return router;
}
function check(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
async function waitFor(checker: () => unknown, message: string) {
  for (let i = 0; i < 600; i++) {
    if (checker()) return;
    await act(async () => {
      await new Promise((done) => setTimeout(done, 25));
    });
  }
  throw new Error(message + ": " + fixture.textContent);
}
async function click(text: string) {
  const scope = fixture.querySelector("dialog:modal") ?? fixture;
  const button = [...scope.querySelectorAll("button")].find(
    (item) =>
      item.textContent?.includes(text) ||
      item.getAttribute("aria-label") === text,
  );
  check(button && !button.disabled, "Botão indisponível: " + text);
  await act(async () => {
    button.focus();
    button.click();
    await new Promise((done) => setTimeout(done, 5));
  });
}
async function field(label: string, value: string) {
  const labelElement = [...fixture.querySelectorAll("label")].find(
    (item) =>
      (item.querySelector("span")?.textContent?.trim() ??
        item.textContent?.trim()) === label,
  );
  const el = (labelElement?.querySelector("input,textarea") ??
    document.getElementById(labelElement?.htmlFor ?? "")) as
    | HTMLInputElement
    | HTMLTextAreaElement
    | null;
  check(el, "Campo em falta: " + label);
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
async function select(label: string, value: string) {
  const element = fixture.querySelector<HTMLSelectElement>(
    `select[aria-label="${label}"]`,
  );
  check(element, "Filtro em falta: " + label);
  await act(async () => {
    element.value = value;
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
const results: { name: string; ok: boolean; error?: string }[] = [];
async function run(name: string, action: () => Promise<void>) {
  try {
    await action();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error: String(error) });
  } finally {
    networkError = false;
    await act(async () => root.render(null));
  }
}
function visibleDialog() {
  const dialog = fixture.querySelector<HTMLDialogElement>("dialog[open]");
  check(
    dialog?.open &&
      dialog.matches(":modal") &&
      dialog.getBoundingClientRect().width > 0,
    "Confirmação não está visível na top layer",
  );
  check(dialog.contains(document.activeElement), "Foco fora da confirmação");
  check(
    Boolean(dialog.getAttribute("aria-labelledby")),
    "Confirmação sem nome acessível",
  );
  return dialog;
}
await run(
  "Eliminar: StrictMode keeps the confirmation visible after its effect replay",
  async () => {
    const work = await repository("author-a").create({
      ...metadata,
      title: "Teste de confirmação",
    });
    try {
      await mount(`/estudio/obras/${work.id}`);
      await click("Eliminar");
      await act(async () => new Promise((done) => setTimeout(done, 50)));
      visibleDialog();
      check(rows.has(work.id), "Eliminou ao primeiro clique");
      await click("Cancelar");
      check(rows.has(work.id), "Cancelar eliminou dados");
    } finally {
      rows.delete(work.id);
    }
  },
);
let id = "";
await run(
  "F2.1: wizard creates only private remote metadata and opens management",
  async () => {
    selectScope("user:author-a");
    studioStore.createWork({
      ...metadata,
      mode: "prose",
      status: "draft",
      chapters: [],
    });
    await mount("/estudio/obras/nova");
    await click("2");
    await field("Título da Obra *", "Obra entre dispositivos");
    await click("5");
    await click("Criar obra e abrir");
    check(rows.size === 1, "Obra não persistida");
    id = [...rows.keys()][0];
    await waitFor(
      () => fixture.textContent?.includes("Editar metadados"),
      "Gestão não abriu após criação",
    );
    check(
      fixture.textContent?.includes("Editar metadados"),
      "Não abriu gestão",
    );
    check(
      fixture.textContent?.includes("Guardada na conta"),
      "Sem origem remota",
    );
    check(getStoredWorks().length === 1, "Dados locais alterados");
    check(
      ![...fixture.querySelectorAll("a")].some((link) =>
        link.href.includes("/capitulos/"),
      ),
      "Editor remoto indevido",
    );
  },
);
await run(
  "F2.1: fresh session restores draft; metadata save and network failure preserve form",
  async () => {
    await mount(`/estudio/obras/${id}`);
    check(
      fixture.textContent?.includes("Obra entre dispositivos"),
      "Não recuperou obra",
    );
    await field("Título", "Título atualizado");
    await click("Guardar alterações");
    check(rows.get(id)?.title === "Título atualizado", "Título não guardado");
    check(
      fixture.textContent?.includes("Alterações guardadas"),
      "Sem confirmação",
    );
    networkError = true;
    await field("Sinopse", "Não perder esta sinopse");
    await click("Guardar alterações");
    check(fixture.querySelector("[role=alert]"), "Sem erro de rede");
    check(
      (fixture.querySelector("textarea") as HTMLTextAreaElement).value ===
        "Não perder esta sinopse",
      "Formulário perdido",
    );
    networkError = false;
  },
);
await run(
  "F2.1: account switch hides other drafts; local archive is isolated",
  async () => {
    await mount("/estudio/publicacoes", "author-b");
    check(
      !fixture.textContent?.includes("Título atualizado"),
      "Obra de A visível em B",
    );
    check(getStoredWorks().length === 0, "Local de A misturado com B");
    await mount("/estudio/publicacoes", "author-a");
    await select("Origem das obras", "local");
    check(
      fixture.textContent?.includes("Rascunho local anterior"),
      "Legado perdido",
    );
    check(
      fixture.textContent?.includes("Local"),
      "Origem local não identificada",
    );
  },
);
await run(
  "F2.1: delete requires confirmation and removes only selected remote draft",
  async () => {
    const router = await mount(`/estudio/obras/${id}`);
    await click("Eliminar");
    visibleDialog();
    check(rows.has(id), "Eliminou antes da confirmação");
    await click("Cancelar");
    check(
      !fixture.querySelector("dialog[open]"),
      "Cancelar não fechou confirmação",
    );
    check(rows.has(id), "Cancelar eliminou obra");
    await click("Eliminar");
    visibleDialog();
    await click("Sim, eliminar obra");
    await waitFor(
      () => router.state.location.pathname === "/estudio",
      "Não redirecionou para o Studio",
    );
    check(!rows.has(id), "Não eliminou");
    check(
      (await repository("author-a").find(id)) === null,
      "Eliminação não persistiu",
    );
    await mount("/estudio/publicacoes");
    check(
      !fixture.textContent?.includes("Título atualizado"),
      "Obra eliminada reapareceu na lista",
    );
    check(getStoredWorks().length === 1, "Eliminou dados locais");
  },
);
await run("F2.1: guest cannot create remote drafts", async () => {
  await act(async () => root.render(null));
  const router = createMemoryRouter(
    [{ path: "*", element: <ApplicationRoutes /> }],
    { initialEntries: ["/estudio/obras/nova"] },
  );
  await act(async () => root.render(<RouterProvider router={router} />));
  await waitFor(() => fixture.querySelector("h1"), "Wizard não abriu");
  await click("5");
  const button = [...fixture.querySelectorAll("button")].find((item) =>
    item.textContent?.includes("Criar obra e abrir"),
  );
  check(button?.disabled, "Criação sem sessão permitida");
  check(
    fixture.textContent?.includes("Inicia sessão"),
    "Sem instruções de sessão",
  );
});
let editorialId = "";
await run(
  "F2.2: entries save manually, survive reload, preserve unsaved text on network error and recover persisted version",
  async () => {
    const book = await repository("author-a").create({
      ...metadata,
      title: "Livro persistente",
    });
    editorialId = book.id;
    await mount(`/estudio/obras/${book.id}`);
    await click("Adicionar capítulo");
    await waitFor(
      () => fixture.querySelector(".editor-workspace-body textarea"),
      "Editor não abriu",
    );
    await field("Texto do capítulo", "Três palavras reais");
    check(
      fixture.textContent?.includes("Alterações não guardadas"),
      "Sem indicação de alterações",
    );
    check(
      rows.get(book.id)?.chapters[0].content === "",
      "Gravou sem pedido manual",
    );
    await click("Guardar alterações");
    check(
      fixture.textContent?.includes("Guardado na conta"),
      "Sem confirmação remota",
    );
    const entry = rows.get(book.id)!.chapters[0];
    await mount(`/estudio/obras/${book.id}/capitulos/${entry.id}/editar`);
    check(
      (fixture.querySelector("textarea") as HTMLTextAreaElement).value ===
        "Três palavras reais",
      "Conteúdo não recuperado",
    );
    networkError = true;
    await field("Texto do capítulo", "Texto que não se pode perder");
    await click("Guardar alterações");
    check(fixture.querySelector("[role=alert]"), "Erro não apresentado");
    check(
      (fixture.querySelector("textarea") as HTMLTextAreaElement).value.includes(
        "não se pode perder",
      ),
      "Texto perdido",
    );
    networkError = false;
    await click("Recuperar última versão persistida");
    await click("Confirmar recuperação");
    check(
      (fixture.querySelector("textarea") as HTMLTextAreaElement).value ===
        "Três palavras reais",
      "Recuperação não substituiu pela versão persistida",
    );
  },
);
await run(
  "F2.2: duplicate, reorder, navigate and confirm entry deletion",
  async () => {
    let book = rows.get(editorialId)!;
    await mount(
      `/estudio/obras/${book.id}/capitulos/${book.chapters[0].id}/editar`,
    );
    await click("Duplicar capítulo");
    await waitFor(
      () => fixture.querySelectorAll("ol li").length === 2,
      "Não duplicou entrada",
    );
    book = rows.get(book.id)!;
    check(
      book.chapters[1].content === book.chapters[0].content,
      "Cópia perdeu texto",
    );
    const down = fixture.querySelector<HTMLButtonElement>(
      `[aria-label="Descer ${book.chapters[0].title}"]`,
    );
    check(down && !down.disabled, "Sem reordenação");
    await act(async () => {
      down.click();
      await new Promise((done) => setTimeout(done, 10));
    });
    check(
      rows.get(book.id)!.chapters[0].id === book.chapters[1].id,
      "Não reordenou",
    );
    await click("Eliminar capítulo");
    check(rows.get(book.id)!.chapters.length === 2, "Eliminou sem confirmação");
    await click("Confirmar eliminação");
    check(rows.get(book.id)!.chapters.length === 1, "Não eliminou entrada");
  },
);
await run(
  "F2.2: work duplication, archive filters and restoration are persistent",
  async () => {
    await mount(`/estudio/obras/${editorialId}`);
    await click("Duplicar");
    await waitFor(
      () => fixture.querySelector("h1")?.textContent?.includes("(Cópia)"),
      "Não abriu cópia",
    );
    const copy = [...rows.values()].find(
      (item) =>
        item.id !== editorialId && item.title === "Livro persistente (Cópia)",
    )!;
    check(copy && copy.chapters.length === 1, "Duplicação incompleta");
    await click("Arquivar");
    check(rows.get(copy.id)?.archivedAt, "Não arquivou");
    check(rows.get(copy.id)?.status === "draft", "Alterou estado editorial");
    await mount("/estudio/publicacoes");
    check(
      !fixture.textContent?.includes(copy.title),
      "Arquivo aparece nas ativas",
    );
    await select("Filtrar por estado", "archived");
    check(
      fixture.textContent?.includes(copy.title),
      "Arquivo não recuperável pelo filtro",
    );
    await click("Desarquivar");
    check(!rows.get(copy.id)?.archivedAt, "Não desarquivou");
  },
);
await run(
  "F2.2: account statistics exclude local/editorial content and use saved words",
  async () => {
    await mount("/estudio");
    const counts = [...rows.values()].filter(
      (work) => work.ownerId === "author-a" && !work.archivedAt,
    );
    const cards = [...fixture.querySelectorAll(".studio-stat-card")];
    check(
      cards[0]?.querySelector(".stat-value")?.textContent ===
        String(counts.length),
      "Total misturou dados locais",
    );
    check(
      !fixture.textContent?.includes("com estado local publicado"),
      "Texto antigo mantido",
    );
    const expected = counts.reduce(
      (sum, work) =>
        sum +
        work.chapters.reduce(
          (total, entry) =>
            total +
            (entry.content ?? "").trim().split(/\s+/).filter(Boolean).length,
          0,
        ),
      0,
    );
    check(
      cards[2]?.querySelector(".stat-value")?.textContent === String(expected),
      "Palavras não correspondem ao conteúdo guardado",
    );
  },
);
await run(
  "F2.2: poetry and visual entries use correct terminology without upload simulation",
  async () => {
    for (const format of ["Poesia", "HQ / Comic"] as const) {
      const book = await repository("author-a").create({
        ...metadata,
        title: format,
        format,
      });
      await mount(`/estudio/obras/${book.id}`);
      await click(format === "Poesia" ? "Adicionar poema" : "Adicionar ato");
      await waitFor(
        () => fixture.querySelector(".editor-workspace-body textarea"),
        "Editor não abriu",
      );
      check(
        fixture.textContent?.includes(
          format === "Poesia"
            ? "Texto do poema"
            : "Guião e descrição editorial",
        ),
        "Terminologia errada",
      );
      check(
        !fixture.querySelector('.editor-workspace-body input[type="file"]'),
        "Upload simulado",
      );
    }
  },
);
await run(
  "F2.2: refreshing metadata cannot silently overwrite another device",
  async () => {
    await mount(`/estudio/obras/${editorialId}`);
    await field("Título", "Alteração ainda não guardada");
    const original = rows.get(editorialId)!;
    rows.set(editorialId, {
      ...original,
      title: "Versão de outro dispositivo",
      revision: original.revision! + 1,
    });
    await click("Atualizar obras");
    await click("Guardar alterações");
    check(fixture.querySelector("[role=alert]"), "Sobrescreveu sem conflito");
    const title = fixture.querySelector<HTMLInputElement>(
      '[aria-label="Editar metadados"] label input',
    );
    check(
      title?.value === "Alteração ainda não guardada",
      "Perdeu o formulário",
    );
    await click("Repor metadados persistidos");
    await click("Confirmar reposição");
    check(
      fixture.querySelector<HTMLInputElement>(
        '[aria-label="Editar metadados"] label input',
      )?.value === "Versão de outro dispositivo",
      "Não recuperou metadados",
    );
  },
);
await run(
  "F2.2: unsaved editor text blocks accidental links and survives in-tab back navigation",
  async () => {
    const book = rows.get(editorialId)!;
    const path = `/estudio/obras/${book.id}/capitulos/${book.chapters[0].id}/editar`;
    const router = await mount(path);
    await field("Texto do capítulo", "Rascunho ainda não guardado");
    const before = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(before);
    check(before.defaultPrevented, "Sem proteção ao recarregar");
    const originalConfirm = window.confirm;
    window.confirm = () => false;
    try {
      const back =
        fixture.querySelector<HTMLAnchorElement>(".editor-back-link")!;
      await act(async () => back.click());
      check(router.state.location.pathname === path, "Saiu sem confirmação");
    } finally {
      window.confirm = originalConfirm;
    }
    await act(async () => {
      await router.navigate(`/estudio/obras/${book.id}`);
    });
    await act(async () => {
      await router.navigate(path);
    });
    await waitFor(
      () => fixture.querySelector(".editor-workspace-body textarea"),
      "Editor não reabriu",
    );
    check(
      (
        fixture.querySelector(
          ".editor-workspace-body textarea",
        ) as HTMLTextAreaElement
      ).value === "Rascunho ainda não guardado",
      "Navegação perdeu o rascunho em memória",
    );
  },
);
await run(
  "Eliminar: network and stale revision errors stay visible inside the work confirmation",
  async () => {
    const work = await repository("author-a").create({
      ...metadata,
      title: "Erro de eliminação",
    });
    const router = await mount(`/estudio/obras/${work.id}`);
    await click("Eliminar");
    visibleDialog();
    networkError = true;
    await click("Sim, eliminar obra");
    check(
      visibleDialog().querySelector('[role="alert"]'),
      "Erro de rede fora do modal",
    );
    check(
      rows.has(work.id) && router.state.location.pathname.includes(work.id),
      "Falha eliminou ou redirecionou",
    );
    networkError = false;
    rows.set(work.id, { ...rows.get(work.id)!, revision: work.revision! + 1 });
    await click("Sim, eliminar obra");
    check(
      visibleDialog()
        .querySelector('[role="alert"]')
        ?.textContent?.includes("revisão"),
      "Conflito não visível",
    );
    check(rows.has(work.id), "Conflito eliminou obra");
    await click("Cancelar");
    await click("Atualizar obras");
    await click("Eliminar");
    await click("Sim, eliminar obra");
    await waitFor(
      () => router.state.location.pathname === "/estudio",
      "Não redirecionou após recuperar revisão",
    );
    check(!rows.has(work.id), "Não eliminou com revisão atual");
  },
);
await run(
  "Eliminar: inventory grid and table require a visible confirmation",
  async () => {
    for (const view of ["grid", "table"]) {
      const work = await repository("author-a").create({
        ...metadata,
        title: "Inventário " + view,
      });
      const router = await mount("/estudio/publicacoes");
      if (view === "table") await click("Tabela");
      const row = [
        ...fixture.querySelectorAll(view === "grid" ? "article" : "tbody tr"),
      ].find((item) => item.textContent?.includes(work.title));
      const button = row?.querySelector<HTMLButtonElement>(
        'button[aria-label="Eliminar"]',
      );
      check(button, "Eliminar em falta");
      await act(async () => {
        button.click();
        await new Promise((done) => setTimeout(done, 20));
      });
      visibleDialog();
      check(rows.has(work.id), "Eliminou antes de confirmar");
      await click("Cancelar");
      check(rows.has(work.id), "Cancelar eliminou inventário");
      await act(async () => {
        button.click();
        await new Promise((done) => setTimeout(done, 20));
      });
      await click("Sim, eliminar");
      await waitFor(
        () => router.state.location.pathname === "/estudio",
        "Sem retorno ao Studio",
      );
      check(!rows.has(work.id), "Inventário não eliminou");
    }
  },
);
await run(
  "Eliminar: chapters and poems cancel, fail visibly, then delete and persist",
  async () => {
    for (const format of ["Romance", "Poesia"] as const) {
      const repo = repository("author-a");
      let work = await repo.create({
        ...metadata,
        title: "Entrada a eliminar",
        format,
      });
      work = (await repo.editorial!(work, "add_entry")).work!;
      const entry = work.chapters[0];
      const router = await mount(
        `/estudio/obras/${work.id}/capitulos/${entry.id}/editar`,
      );
      const label = format === "Poesia" ? "poema" : "capítulo";
      await click("Eliminar " + label);
      visibleDialog();
      await click("Cancelar");
      check(
        rows.get(work.id)?.chapters.length === 1,
        "Cancelamento apagou entrada",
      );
      await click("Eliminar " + label);
      networkError = true;
      await click("Confirmar eliminação");
      check(
        visibleDialog().querySelector('[role="alert"]'),
        "Erro da entrada invisível",
      );
      networkError = false;
      rows.set(work.id, {
        ...rows.get(work.id)!,
        revision: work.revision! + 1,
      });
      await click("Confirmar eliminação");
      check(
        visibleDialog()
          .querySelector('[role="alert"]')
          ?.textContent?.includes("revisão"),
        "Conflito da entrada invisível",
      );
      check(
        rows.get(work.id)?.chapters.length === 1,
        "Conflito apagou entrada",
      );
      await click("Cancelar");
      await click("Recuperar última versão persistida");
      await click("Confirmar recuperação");
      await click("Eliminar " + label);
      visibleDialog();
      await click("Confirmar eliminação");
      await waitFor(
        () => router.state.location.pathname === `/estudio/obras/${work.id}`,
        "Não saiu da entrada eliminada",
      );
      check(
        (await repo.find(work.id))?.chapters.length === 0,
        "Entrada eliminada reapareceu",
      );
    }
  },
);
await run(
  "F2.2: transient Auth errors preserve account buffers; logout clears them",
  async () => {
    await act(async () => root.render(null));
    let state: AuthState = {
      ...initialAuthState,
      status: "authenticated",
      user: { id: "author-a" } as User,
    };
    const listeners = new Set<() => void>();
    const authController = {
      getSnapshot: () => state,
      subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      start: async () => {},
      stop: () => {},
    } as unknown as AuthController;
    let observed: ReturnType<typeof useRemoteWorks> | undefined;
    function Probe() {
      observed = useRemoteWorks();
      return <p>Probe</p>;
    }
    await act(async () => {
      root.render(
        <AuthProvider controller={authController}>
          <RemoteWorksProvider>
            <Probe />
          </RemoteWorksProvider>
        </AuthProvider>,
      );
    });
    const original = observed?.controller;
    check(original, "Controller ausente");
    const work = rows.get(editorialId)!;
    original.editorBuffers.set("pending", {
      work,
      title: "Pendente",
      content: "Preservar",
      alignment: "left",
    });
    await act(async () => {
      state = {
        ...state,
        status: "operational-error",
        error: "Rede indisponível",
      };
      listeners.forEach((listener) => listener());
    });
    check(
      observed?.controller === original &&
        original.editorBuffers.has("pending"),
      "Erro transitório descartou conteúdo",
    );
    await act(async () => {
      state = {
        ...state,
        status: "unauthenticated",
        user: null,
        session: null,
      };
      listeners.forEach((listener) => listener());
    });
    check(
      !observed?.controller && original.editorBuffers.size === 0,
      "Logout não limpou os dados da conta",
    );
  },
);
await run(
  "F3.1: explicit confirmation, cancel, public catalogue/reader, private edits, withdraw and republish",
  async () => {
    const repo = repository("author-a");
    let book = await repo.create({
      ...metadata,
      title: "Publicação real de teste",
    });
    book = (await repo.editorial!(book, "add_entry")).work!;
    book = (
      await repo.editorial!(book, "save_entry", {
        entry_id: book.chapters[0].id,
        title: "Entrada pública",
        content: "Conteúdo público confirmado",
        alignment: "left",
      })
    ).work!;
    const router = await mount(`/estudio/obras/${book.id}`);
    await click("Publicar");
    visibleDialog();
    check(!editions.has(book.publicId!), "Publicou antes de confirmar");
    await click("Cancelar");
    check(!editions.has(book.publicId!), "Cancelar publicou");
    await click("Publicar");
    await click("Confirmar publicação");
    await waitFor(() => editions.has(book.publicId!), "Não publicou");
    await act(async () => {
      await router.navigate("/catalogo");
    });
    await waitFor(
      () => fixture.textContent?.includes("Publicação real de teste"),
      "Catálogo não atualizou",
    );
    await act(async () => {
      await router.navigate(`/obras/${book.publicId}`);
    });
    await waitFor(
      () => fixture.textContent?.includes("Entrada pública"),
      "Detalhes não carregaram",
    );
    await act(async () => {
      await router.navigate(
        `/obras/${book.publicId}/capitulos/${book.chapters[0].id}`,
      );
    });
    await waitFor(
      () => fixture.textContent?.includes("Conteúdo público confirmado"),
      "Leitura não abriu",
    );
    book = rows.get(book.id)!;
    book = (
      await repo.editorial!(book, "save_entry", {
        entry_id: book.chapters[0].id,
        title: "Entrada pública",
        content: "Alteração privada",
        alignment: "left",
      })
    ).work!;
    check(
      editions.get(book.publicId!)!.chapters[0].content ===
        "Conteúdo público confirmado",
      "Edição privada vazou",
    );
    await mount(`/estudio/obras/${book.id}`);
    await click("Retirar publicação");
    visibleDialog();
    await click("Confirmar retirada");
    await waitFor(() => !editions.has(book.publicId!), "Não retirou");
    await mount(`/obras/${book.publicId}`);
    await waitFor(
      () => fixture.textContent?.toLowerCase().includes("não encontrada"),
      "Página retirada continua pública",
    );
    await mount(`/estudio/obras/${book.id}`);
    await click("Republicar");
    await click("Confirmar publicação");
    await waitFor(
      () =>
        editions.get(book.publicId!)?.chapters[0].content ===
        "Alteração privada",
      "Não republicou mesma obra",
    );
  },
);
await run(
  "F3.1: publication network error and revision conflict stay visible in confirmation",
  async () => {
    const repo = repository("author-a");
    let book = await repo.create({ ...metadata, title: "Falha de publicação" });
    book = (await repo.editorial!(book, "add_entry")).work!;
    book = (
      await repo.editorial!(book, "save_entry", {
        entry_id: book.chapters[0].id,
        title: "Entrada",
        content: "Texto",
        alignment: "left",
      })
    ).work!;
    await mount(`/estudio/obras/${book.id}`);
    await click("Publicar");
    networkError = true;
    await click("Confirmar publicação");
    await waitFor(
      () => visibleDialog().querySelector('[role="alert"]'),
      "Falha invisível",
    );
    check(!editions.has(book.publicId!), "Publicou com erro");
    networkError = false;
    rows.set(book.id, { ...book, revision: book.revision! + 1 });
    await click("Confirmar publicação");
    await waitFor(
      () => visibleDialog().textContent?.includes("Conflito de revisão"),
      "Conflito invisível",
    );
    await click("Cancelar");
  },
);
await act(async () => root.unmount());
document.getElementById("results")!.textContent = JSON.stringify(results);
document.documentElement.dataset.tests = results.every((result) => result.ok)
  ? "passed"
  : "failed";
