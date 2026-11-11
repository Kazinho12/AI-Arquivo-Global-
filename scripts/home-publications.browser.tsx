import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { ApplicationRoutes } from "../src/foundation/app/App";
import { PublicCatalogProvider } from "../src/foundation/features/catalog/PublicCatalog";
import type {
  PublishedWork,
  PublicWorksRepository,
} from "../src/foundation/features/catalog/repository";
import type { DiscoveryPage } from "../src/foundation/features/catalog/discovery";
import { publicCatalogEvent } from "../src/foundation/features/catalog/events";
import "../src/foundation/styles/global.css";
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const fixture = document.getElementById("fixture")!;
const root = createRoot(fixture);
const works: PublishedWork[] = [
  "Romance",
  "Conto",
  "Poesia",
  "HQ / Comic",
  "Mangá",
  "Romance",
  "Conto",
].map((format, i) => ({
  id: `30000000-0000-0000-0000-00000000000${i + 1}`,
  title: `Publicação real ${i + 1}`,
  author: `Autora ${i + 1}`,
  authorId: "autora",
  authorUsername: "autora",
  origin: "user-publication",
  format: format as PublishedWork["format"],
  genre: "Fantasia",
  language: "pt",
  ageRating: "Livre",
  contentWarnings: [],
  synopsis: "Sinopse da edição pública. ".repeat(30),
  tags: ["Descoberta"],
  cover: 1,
  coverStyle: "bold",
  coverAccentColor: "#14243B",
  createdAt: `2026-11-${15 - i}`,
  firstPublishedAt: `2026-11-${15 - i}`,
  lastPublishedAt: `2026-11-${15 - i}`,
  chapters: [
    {
      id: `40000000-0000-0000-0000-00000000000${i + 1}`,
      title: "Entrada pública",
      number: 1,
      content: "Texto da edição pública para leitura.",
      entryType: format === "Poesia" ? "poem" : "chapter",
    },
  ],
}));
let items = [...works];
let fail = false;
let gate: Promise<void> | null = null;
let afterSearch: ((result: DiscoveryPage) => Promise<DiscoveryPage>) | null =
  null;
const repository: PublicWorksRepository = {
  list: async () => [],
  find: async (id) => items.find((w) => w.id === id) ?? null,
  search: async (query) => {
    const result = {
      items: [...items],
      total: items.length,
      page: 1,
      size: query.size,
    };
    if (gate) await gate;
    if (fail) throw Error("offline");
    return afterSearch ? afterSearch(result) : result;
  },
};
const pause = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms));
function check(value: unknown, message: string): asserts value {
  if (!value) throw Error(message);
}
async function waitFor(test: () => unknown, message: string) {
  for (let i = 0; i < 600; i++) {
    if (test()) return;
    await act(async () => pause());
  }
  throw Error(message + ": " + fixture.textContent?.slice(0, 400));
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
async function mount() {
  await act(async () => root.render(null));
  const router = createMemoryRouter(
    [
      {
        path: "*",
        element: (
          <PublicCatalogProvider repository={repository}>
            <ApplicationRoutes />
          </PublicCatalogProvider>
        ),
      },
    ],
    { initialEntries: ["/"], future: { v7_relativeSplatPath: true } },
  );
  await act(async () => {
    root.render(
      <React.StrictMode>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </React.StrictMode>,
    );
    await pause();
  });
  await waitFor(() => fixture.querySelector(".hero"), "Home ausente");
  return router;
}
async function click(text: string) {
  const el = [...fixture.querySelectorAll<HTMLElement>("a,button")].find((el) =>
    el.textContent?.trim().startsWith(text),
  );
  check(el, "Ligação ausente " + text);
  await act(async () => {
    el.focus();
    el.click();
    await pause();
  });
}
const results: { name: string; ok: boolean; error?: string }[] = [];
async function run(name: string, action: () => Promise<void>) {
  items = [...works];
  fail = false;
  gate = null;
  afterSearch = null;
  try {
    await action();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error: String(error) });
  } finally {
    await act(async () => root.render(null));
  }
}
await run(
  "Home: loading then editorial empty state without invented or inaugural works",
  async () => {
    let release!: () => void;
    gate = new Promise((resolve) => (release = resolve));
    items = [];
    await mount();
    check(
      fixture.textContent?.includes("A descobrir publicações"),
      "Sem loading",
    );
    check(!fixture.querySelector(".work-card"), "Obras durante loading");
    await act(async () => {
      release();
      await pause();
    });
    await waitFor(
      () => fixture.textContent?.includes("O próximo capítulo"),
      "Sem vazio",
    );
    check(!fixture.querySelector(".work-card"), "Fallback fictício");
    check(
      fixture.querySelectorAll(".hero-book-neutral").length === 5,
      "Faltam capas neutras",
    );
    check(
      !fixture.textContent?.includes("EDIÇÃO INAUGURAL"),
      "Inaugural na Home",
    );
  },
);
await run(
  "Home: visible network error and retry restores real publications",
  async () => {
    fail = true;
    await mount();
    await waitFor(() => fixture.querySelector("[role=alert]"), "Sem erro");
    check(!fixture.querySelector(".hero-book[href]"), "Capa antiga no erro");
    fail = false;
    await click("Tentar novamente");
    await waitFor(
      () => fixture.querySelector(".hero-book-front[href]"),
      "Retry falhou",
    );
  },
);
await run(
  "Home: eligible snapshots, all formats, unique hero and working navigation to reading",
  async () => {
    items.push(
      {
        ...works[0],
        id: "adult",
        title: "NÃO MOSTRAR ADULTO",
        ageRating: "+18",
      },
      {
        ...works[0],
        id: "warning",
        title: "NÃO MOSTRAR EXPLÍCITO",
        contentWarnings: ["Conteúdo sexual"],
      },
    );
    const router = await mount();
    await waitFor(
      () => fixture.querySelector(".hero-book-front[href]"),
      "Sem hero real",
    );
    check(
      fixture.querySelector("h1")?.textContent?.includes("Onde as histórias"),
      "Hero institucional não restaurado",
    );
    check(
      !fixture.querySelector(".hero-copy")?.textContent?.includes("Autora 1"),
      "Autor no lado institucional",
    );
    check(
      fixture.querySelectorAll(".hero-book[href]").length === 5,
      "Faltam capas reais",
    );
    check(
      !fixture.textContent?.includes("NÃO MOSTRAR"),
      "Conteúdo não elegível exposto",
    );
    check(
      fixture.querySelectorAll(".work-card").length === 2,
      "Repetições ou obras em falta",
    );
    check(
      ![...fixture.querySelectorAll(".work-card h3")].some(
        (el) => el.textContent === works[0].title,
      ),
      "Hero duplicado",
    );
    check(
      fixture.querySelector('.hero [data-cover-style="bold"]'),
      "Capa dinâmica ausente",
    );
    for (const work of works)
      check(fixture.textContent?.includes(work.format), "Formato ausente");
    await act(async () => {
      fixture
        .querySelector<HTMLAnchorElement>(".hero-book-front[href]")!
        .click();
      await pause();
    });
    await waitFor(
      () => fixture.querySelector(".work-page"),
      "Detalhes ausentes",
    );
    check(
      router.state.location.pathname === `/obras/${works[0].id}`,
      "ID incorreto",
    );
    await waitFor(
      () => fixture.querySelector(".reader-resume a"),
      "Ligação à leitura ausente",
    );
    await act(async () => {
      fixture.querySelector<HTMLAnchorElement>(".reader-resume a")!.click();
      await pause();
    });
    await waitFor(
      () => router.state.location.pathname.includes("/capitulos/"),
      "Leitura inacessível",
    );
    await waitFor(
      () =>
        fixture.textContent?.includes("Texto da edição pública para leitura."),
      "Sem conteúdo público",
    );
  },
);
await run(
  "Home: withdrawal refresh clears previous automatic highlights",
  async () => {
    await mount();
    await waitFor(() => fixture.querySelector(".hero-book[href]"), "Sem hero");
    items = [];
    await act(async () => {
      window.dispatchEvent(new CustomEvent(publicCatalogEvent));
      await pause();
    });
    await waitFor(
      () => fixture.textContent?.includes("O próximo capítulo"),
      "Retirada não refletida",
    );
    check(
      !fixture.querySelector(".hero-book[href]") &&
        !fixture.querySelector(".work-card"),
      "Publicação retirada visível",
    );
  },
);
await run(
  "Home: stale search cannot overwrite a newer empty selection",
  async () => {
    let release!: () => void;
    const old = new Promise<void>((resolve) => (release = resolve));
    afterSearch = async (result) => {
      await old;
      return result;
    };
    await mount();
    items = [];
    afterSearch = null;
    await act(async () => {
      window.dispatchEvent(new CustomEvent(publicCatalogEvent));
      await pause();
    });
    await waitFor(
      () => fixture.textContent?.includes("O próximo capítulo"),
      "Novo estado ausente",
    );
    await act(async () => {
      release();
      await pause();
    });
    check(
      !fixture.querySelector(".hero-book[href]"),
      "Resposta antiga aplicada",
    );
  },
);
await run(
  "Home: light/dark, narrow layouts, semantic links and accessible search",
  async () => {
    await mount();
    await waitFor(() => fixture.querySelector(".hero-book[href]"), "Sem hero");
    for (const theme of ["light", "dark"]) {
      document.documentElement.dataset.theme = theme;
      for (const width of [320, 375, 768]) {
        await act(async () => {
          await drive({ kind: "viewport", width });
          await pause();
        });
        check(
          document.documentElement.scrollWidth <= window.innerWidth + 2,
          "Deslocamento horizontal da página",
        );
      }
    }
    await act(async () => {
      await drive({ kind: "viewport", width: 1280 });
      await pause();
    });
    const link = fixture.querySelector<HTMLAnchorElement>(
      '.hero a[href^="/obras/"]',
    );
    check(link, "Sem ligação semântica");
    link.focus();
    check(document.activeElement === link, "Sem foco");
    check(
      fixture.querySelector('.hero button[aria-label="Pesquisar"]'),
      "Pesquisa sem nome",
    );
    check(fixture.querySelectorAll("h1").length === 1, "Hierarquia inválida");
  },
);
document.getElementById("results")!.textContent = JSON.stringify(results);
document.documentElement.dataset.tests = results.every((r) => r.ok)
  ? "passed"
  : "failed";
