import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { ApplicationRoutes } from "../src/foundation/app/App";
import { RemoteWorksProvider } from "../src/foundation/features/studio/RemoteWorksProvider";
import { WorksController } from "../src/foundation/features/studio/worksController";
import type { WorksRepository } from "../src/foundation/features/studio/worksRepository";
import type { StudioWork } from "../src/foundation/features/studio/types";
import { PublicCatalogProvider } from "../src/foundation/features/catalog/PublicCatalog";
import type {
  PublishedWork,
  PublicWorksRepository,
} from "../src/foundation/features/catalog/repository";
import {
  coverStylePersistenceEnabled,
  coverStudioV2Enabled,
} from "../src/foundation/features/covers/config";
import {
  coverStyleDefinitions,
  type CoverStyle,
} from "../src/foundation/data/covers";
import { selectScope } from "../src/foundation/features/local/persistence";
import "../src/foundation/styles/global.css";
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const fixture = document.getElementById("fixture")!,
  root = createRoot(fixture),
  owner = "cover-author",
  rows = new Map<string, StudioWork>(),
  editions = new Map<string, PublishedWork>();
let offline = false;
const checkNetwork = () => {
  if (offline) throw Error("Rede indisponível; alterações preservadas.");
};
const repo: WorksRepository = {
  list: async () => {
    checkNetwork();
    return [...rows.values()];
  },
  find: async (id) => {
    checkNetwork();
    return rows.get(id) ?? null;
  },
  create: async (input) => {
    checkNetwork();
    const now = new Date().toISOString();
    const w: StudioWork = {
      ...input,
      id: crypto.randomUUID(),
      publicId: crypto.randomUUID(),
      ownerId: owner,
      persistence: "supabase",
      mode: "prose",
      revision: 1,
      status: "draft",
      visibility: "private",
      coverStyle: input.coverStyle ?? "legacy",
      chapters: [],
      createdAt: now,
      updatedAt: now,
    };
    rows.set(w.id, w);
    return w;
  },
  update: async (w, input) => {
    checkNetwork();
    if (rows.get(w.id)?.revision !== w.revision)
      throw Error("Conflito de revisão");
    const next = { ...w, ...input, revision: w.revision! + 1 };
    rows.set(w.id, next);
    return next;
  },
  remove: async (w) => {
    rows.delete(w.id);
    editions.delete(w.publicId!);
  },
  editorial: async (w, action) => {
    checkNetwork();
    if (rows.get(w.id)?.revision !== w.revision)
      throw Error("Conflito de revisão");
    const next = { ...w, revision: w.revision! + 1 };
    const now = new Date().toISOString();
    if (action === "publish") {
      next.status = "published";
      next.visibility = "public";
      next.firstPublishedAt ??= now;
      next.lastPublishedAt = now;
      next.withdrawnAt = null;
      next.publishedRevision = next.revision;
      editions.set(w.publicId!, {
        id: w.publicId!,
        title: w.title,
        subtitle: w.subtitle,
        author: "Autora pública",
        authorId: "autora",
        authorUsername: "autora",
        format: w.format,
        genre: w.genre,
        tags: w.tags,
        synopsis: w.synopsis,
        createdAt: now,
        cover: 1,
        coverAccentColor: w.coverAccentColor,
        coverStyle: w.coverStyle ?? "legacy",
        coverSeed: w.coverSeed ?? 0,
        origin: "user-publication",
        language: w.language,
        ageRating: w.ageRating,
        contentWarnings: w.contentWarnings,
        firstPublishedAt: next.firstPublishedAt,
        lastPublishedAt: now,
        chapters: structuredClone(w.chapters),
      });
    } else if (action === "withdraw") {
      next.status = "draft";
      next.visibility = "private";
      next.withdrawnAt = now;
      editions.delete(w.publicId!);
    } else throw Error("Unsupported fixture operation");
    rows.set(w.id, next);
    return { work: next };
  },
};
const publicRepo: PublicWorksRepository = {
  list: async () => [...editions.values()],
  find: async (id) => editions.get(id) ?? null,
};
const pause = (ms = 0) => new Promise((r) => setTimeout(r, ms));
function check(v: unknown, message: string): asserts v {
  if (!v) throw Error(message);
}
async function waitFor(test: () => unknown, message: string) {
  for (let i = 0; i < 700; i++) {
    if (test()) return;
    await act(async () => pause(20));
  }
  throw Error(message + ": " + fixture.textContent?.slice(0, 300));
}
async function mount(path: string) {
  await act(async () => root.render(null));
  selectScope("user:" + owner);
  const controller = new WorksController(repo);
  const router = createMemoryRouter(
    [
      {
        path: "*",
        element: (
          <RemoteWorksProvider controller={controller}>
            <PublicCatalogProvider repository={publicRepo}>
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
    await pause(30);
  });
  await waitFor(() => fixture.querySelector("h1"), "Página não carregou");
  return router;
}
async function click(label: string) {
  const scope = fixture.querySelector("dialog[open]") ?? fixture;
  const button = [...scope.querySelectorAll<HTMLElement>("button,a")].find(
    (el) =>
      el.getAttribute("aria-label") === label ||
      el.textContent?.trim() === label ||
      el.textContent?.trim().startsWith(label),
  );
  check(button, "Controlo ausente: " + label);
  await act(async () => {
    button.focus();
    button.click();
  });
}
async function field(label: string, value: string) {
  const target = [...fixture.querySelectorAll("label")].find(
      (el) => el.textContent?.trim() === label,
    ),
    el = target ? document.getElementById(target.htmlFor) : null;
  check(
    el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement,
    "Campo ausente " + label,
  );
  await act(async () => {
    el.focus();
    Object.getOwnPropertyDescriptor(
      el instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype,
      "value",
    )!.set!.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
const style = (value: CoverStyle) =>
  "Estilo de capa " + coverStyleDefinitions[value].label;
const results: { name: string; ok: boolean; error?: string }[] = [];
async function run(name: string, action: () => Promise<void>) {
  try {
    await action();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error: String(error) });
  } finally {
    offline = false;
    await act(async () => root.render(null));
  }
}
if (!coverStylePersistenceEnabled) {
  await run(
    "cover styles rollout disabled: old schema stays usable and previews do not claim persistence",
    async () => {
      await mount("/estudio/obras/nova");
      await click("2");
      await field("Título da Obra *", "Sem nova coluna");
      await click(style("bold"));
      check(
        fixture.textContent?.includes("apenas uma pré-visualização"),
        "Aviso de compatibilidade ausente",
      );
      await click("5");
      await click("Criar obra e abrir");
      await waitFor(
        () => fixture.textContent?.includes("Editar metadados"),
        "Criação antiga falhou",
      );
      check(
        [...rows.values()][0].coverStyle === "legacy",
        "Estilo foi enviado com flag desligada",
      );
    },
  );
} else {
  let id = "",
    publicId = "";
  await run(
    "cover styles: wizard saves the selected style and reload restores the server value",
    async () => {
      await mount("/estudio/obras/nova");
      await click("2");
      await field("Título da Obra *", "Capa persistente");
      await field("Sinopse *", "Sinopse válida para a publicação");
      await click(style("bold"));
      await click("5");
      await click("Criar obra e abrir");
      await waitFor(
        () => fixture.textContent?.includes("Editar metadados"),
        "Gestão não abriu",
      );
      const work = [...rows.values()][0];
      id = work.id;
      publicId = work.publicId!;
      check(work.coverStyle === "bold", "Wizard não guardou estilo");
      await mount(`/estudio/obras/${id}`);
      check(
        fixture
          .querySelector(`[aria-label="${style("bold")}"]`)
          ?.getAttribute("aria-pressed") === "true",
        "Recarregar perdeu estilo",
      );
      check(
        fixture.querySelector('[data-cover-style="bold"]'),
        "Pré-visualização não recuperou estilo",
      );
    },
  );
  await run(
    "cover styles: failed save preserves the draft; server recovery restores the persisted style",
    async () => {
      await mount(`/estudio/obras/${id}`);
      await click(style("lyric"));
      check(
        !fixture.textContent?.includes("Alterações guardadas na tua conta."),
        "Gravação anunciada antes do servidor",
      );
      offline = true;
      await click("Guardar alterações");
      await waitFor(
        () => fixture.querySelector('[role="alert"]'),
        "Falha invisível",
      );
      check(rows.get(id)?.coverStyle === "bold", "Falha alterou dados");
      offline = false;
      await click("Repor metadados persistidos");
      await click("Confirmar reposição");
      check(
        fixture
          .querySelector(`[aria-label="${style("bold")}"]`)
          ?.getAttribute("aria-pressed") === "true",
        "Recuperação falhou",
      );
      await click(style("minimalist"));
      await click("Guardar alterações");
      await waitFor(
        () => rows.get(id)?.coverStyle === "minimalist",
        "Edição não guardou estilo",
      );
      await mount(`/estudio/obras/${id}`);
      check(
        fixture.querySelector('[data-cover-style="minimalist"]'),
        "Recarregar edição perdeu estilo",
      );
    },
  );
  await run(
    "cover styles: explicit publication freezes the snapshot until public update and republication",
    async () => {
      const w = rows.get(id)!;
      rows.set(id, {
        ...w,
        chapters: [
          {
            id: crypto.randomUUID(),
            number: 1,
            title: "Capítulo",
            content: "Texto válido",
            entryType: "chapter",
            revision: 1,
          },
        ],
      });
      await mount(`/estudio/obras/${id}`);
      await click("Publicar");
      await click("Confirmar publicação");
      await waitFor(() => editions.has(publicId), "Não publicou");
      check(
        editions.get(publicId)?.coverStyle === "minimalist",
        "Snapshot não copiou estilo",
      );
      await mount(`/obras/${publicId}`);
      await waitFor(
        () => fixture.querySelector('[data-cover-style="minimalist"]'),
        "Página pública não mostra estilo",
      );
      await mount(`/estudio/obras/${id}`);
      await click(style("monolith"));
      await click("Guardar alterações");
      await waitFor(
        () => rows.get(id)?.coverStyle === "monolith",
        "Privado não guardou",
      );
      check(
        editions.get(publicId)?.coverStyle === "minimalist",
        "Edição privada alterou snapshot",
      );
      await mount("/catalogo");
      await waitFor(
        () => fixture.querySelector('[data-cover-style="minimalist"]'),
        "Catálogo não usa snapshot",
      );
      await mount(`/estudio/obras/${id}`);
      await click("Atualizar publicação");
      await click("Confirmar publicação");
      await waitFor(
        () => editions.get(publicId)?.coverStyle === "monolith",
        "Atualização não publicou estilo",
      );
      await click("Retirar publicação");
      await click("Confirmar retirada");
      await waitFor(() => !editions.has(publicId), "Não retirou");
      await click("Republicar");
      await click("Confirmar publicação");
      await waitFor(
        () => editions.get(publicId)?.coverStyle === "monolith",
        "Republicação perdeu estilo",
      );
      await mount(`/obras/${publicId}`);
      await waitFor(
        () => fixture.querySelector('[data-cover-style="monolith"]'),
        "Republicação não renderiza estilo",
      );
    },
  );
}

if (coverStudioV2Enabled)
  await run(
    "Cover Studio V2: 33 thumbnails, no autosave, variations persist on ACK and public snapshot stays frozen",
    async () => {
      const w = [...rows.values()][0];
      check(w, "Sem obra de teste");
      await mount(`/estudio/obras/${w.id}`);
      check(
        fixture.querySelectorAll(".cover-style-option").length === 33,
        "Galeria incompleta",
      );
      await click(style("arcane"));
      await click("Gerar outra variação");
      check(
        rows.get(w.id)?.coverStyle !== "arcane",
        "Selecionar guardou automaticamente",
      );
      check(
        (rows.get(w.id)?.coverSeed ?? 0) === 0,
        "Gerar guardou automaticamente",
      );
      await click("Guardar alterações");
      await waitFor(
        () => rows.get(w.id)?.coverSeed === 1,
        "Seed não persistida",
      );
      await mount(`/estudio/obras/${w.id}`);
      check(
        fixture.querySelector(
          '.cover-style-option[aria-pressed="true"] [data-cover-style="arcane"][data-cover-seed="1"]',
        ),
        "Recarga perdeu composição",
      );
      const oldEdition = editions.get(w.publicId!);
      check(
        oldEdition?.coverStyle !== "arcane",
        "Edição privada alterou snapshot",
      );
      await click("Atualizar publicação");
      await click("Confirmar publicação");
      await waitFor(
        () => editions.get(w.publicId!)?.coverSeed === 1,
        "Seed pública ausente",
      );
      await mount(`/obras/${w.publicId}`);
      await waitFor(
        () =>
          fixture.querySelector(
            '[data-cover-style="arcane"][data-cover-seed="1"]',
          ),
        "Capa pública não usa seed",
      );
      await mount(`/estudio/obras/${w.id}`);
      await click("Gerar outra variação");
      await click("Guardar alterações");
      await waitFor(
        () => rows.get(w.id)?.coverSeed === 2,
        "Segunda variação privada não persistiu",
      );
      check(
        editions.get(w.publicId!)?.coverSeed === 1,
        "Segunda edição privada alterou a seed pública",
      );
      await mount(`/estudio/obras/${w.id}`);
      check(
        fixture.querySelector(
          '.cover-style-option[aria-pressed="true"] [data-cover-seed="2"]',
        ),
        "Recarga perdeu segunda variação privada",
      );
      await mount(`/obras/${w.publicId}`);
      await waitFor(
        () =>
          fixture.querySelector(
            '[data-cover-style="arcane"][data-cover-seed="1"]',
          ),
        "Leitura pública recebeu variação não publicada",
      );
    },
  );

await act(async () => root.unmount());
document.getElementById("results")!.textContent = JSON.stringify(results);
document.documentElement.dataset.tests = results.every((r) => r.ok)
  ? "passed"
  : "failed";
