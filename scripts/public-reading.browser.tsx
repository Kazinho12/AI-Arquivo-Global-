import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { createClient, type User } from "@supabase/supabase-js";
import { ApplicationRoutes } from "../src/foundation/app/App";
import { PublicCatalogProvider } from "../src/foundation/features/catalog/PublicCatalog";
import { createPublicWorksRepository } from "../src/foundation/features/catalog/repository";
import { AuthProvider } from "../src/foundation/features/auth/AuthProvider";
import {
  initialAuthState,
  type AuthController,
} from "../src/foundation/features/auth/controller";
import {
  selectScope,
  flushLocal,
  scopedKey,
} from "../src/foundation/features/local/persistence";
import { libraryStore } from "../src/foundation/features/library/store";
import { preferenceKey } from "../src/foundation/features/preferences/store";
import "../src/foundation/styles/global.css";
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const fixture = document.getElementById("fixture")!;
let root = createRoot(fixture);
const bookId = "30000000-0000-0000-0000-000000000001",
  poemId = "30000000-0000-0000-0000-000000000002";
const ch1 = "40000000-0000-0000-0000-000000000001",
  ch2 = "40000000-0000-0000-0000-000000000002";
const p1 = "50000000-0000-0000-0000-000000000001",
  p2 = "50000000-0000-0000-0000-000000000002";
const base = {
  slug: "publica",
  subtitle: "",
  description: "Sinopse pública",
  genre: "Ficção",
  language: "pt",
  age_rating: "Livre",
  tags: [],
  content_warnings: [],
  cover_accent_color: "#14243B",
  author_name: "Autora pública",
  author_username: "autora",
  first_published_at: "2026-11-11T10:00:00Z",
  last_published_at: "2026-11-11T10:00:00Z",
};
const originals = [
  {
    ...base,
    id: bookId,
    title: "Livro público",
    type: "Romance",
    entries: [
      {
        id: ch1,
        position: 1,
        title: "Primeiro capítulo",
        content:
          "Texto público confirmado.\n\n" +
          "Leitura real de teste. ".repeat(500),
        entry_type: "chapter",
        alignment: "left",
      },
      {
        id: ch2,
        position: 3,
        title: "Segundo capítulo",
        content: "Final público. <script>alert('x')</script>",
        entry_type: "chapter",
        alignment: "left",
      },
    ],
  },
  {
    ...base,
    id: poemId,
    title: "Poemas públicos",
    type: "Poesia",
    entries: [
      {
        id: p1,
        position: 1,
        title: "Primeiro poema",
        content: "  Verso com espaços\nOutro verso\n\n\n\nÚltima estrofe",
        entry_type: "poem",
        alignment: "center",
      },
      {
        id: p2,
        position: 2,
        title: "Segundo poema",
        content: "Verso à esquerda\n\nOutra estrofe",
        entry_type: "poem",
        alignment: "left",
      },
    ],
  },
];
let rows = structuredClone(originals),
  offline = false,
  withdrawn = false;
const requests: string[] = [];
const client = createClient("https://fixture.invalid", "public-fixture-key", {
  accessToken: async () => null,
  global: {
    fetch: async (input, init) => {
      const url = new URL(String(input));
      requests.push(url.pathname);
      check(
        !url.pathname.includes("private") &&
          !url.pathname.endsWith("/works") &&
          !url.pathname.includes("auth/v1"),
        "Pedido privado inesperado",
      );
      check(
        new Headers(init?.headers).get("Authorization") ===
          "Bearer public-fixture-key",
        "Sessão privada usada na leitura",
      );
      await pause(10);
      if (offline) throw Error("Rede indisponível");
      if (url.pathname.endsWith("/rpc/read_public_work")) {
        const id = JSON.parse(String(init?.body)).p_public_id;
        return Response.json(
          withdrawn ? null : (rows.find((row) => row.id === id) ?? null),
        );
      }
      check(url.pathname.endsWith("/published_works"), "Endpoint inesperado");
      if (url.searchParams.get("select") === "id,last_published_at") {
        const visible = withdrawn
          ? []
          : rows.filter((row) => "eq." + row.id === url.searchParams.get("id"));
        return Response.json(
          visible.map((row) => ({
            id: row.id,
            last_published_at: row.last_published_at,
          })),
        );
      }
      return Response.json(
        withdrawn || Number(url.searchParams.get("offset")) > 0
          ? []
          : rows.map(({ entries, ...row }) => row),
      );
    },
  },
});
const repository = createPublicWorksRepository(client);
function contrast(foreground: string, background: string) {
  const luminance = (color: string) => {
    const rgb = (color.match(/[\d.]+/g) ?? [])
      .slice(0, 3)
      .map(Number)
      .map((c) => {
        const v = c / 255;
        return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const a = luminance(foreground),
    b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
const results: { name: string; ok: boolean; error?: string }[] = [];
const pause = (ms = 0) => new Promise((r) => setTimeout(r, ms));
function check(value: unknown, message: string): asserts value {
  if (!value) throw Error(message);
}
async function waitFor(checker: () => unknown, message: string) {
  for (let i = 0; i < 300; i++) {
    if (checker()) return;
    await act(async () => pause(10));
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
    window.testDriver(JSON.stringify({ ...input, id }));
  });
}
async function mount(path: string, authenticated = false) {
  await act(async () => root.render(null));
  selectScope(authenticated ? "user:reader-test" : "guest");
  const state = {
    ...initialAuthState,
    status: authenticated ? "authenticated" : "unauthenticated",
    user: authenticated
      ? ({ id: "reader-test", email: "fixture@example.invalid" } as User)
      : null,
  };
  const controller = {
    subscribe: () => () => {},
    getSnapshot: () => state,
    start: async () => {},
    stop: () => {},
  } as unknown as AuthController;
  const router = createMemoryRouter(
    [
      {
        path: "*",
        element: (
          <AuthProvider controller={controller}>
            <PublicCatalogProvider repository={repository}>
              <ApplicationRoutes />
            </PublicCatalogProvider>
          </AuthProvider>
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
  await waitFor(() => fixture.querySelector("h1"), "Página não abriu");
  return router;
}
async function click(name: string) {
  const scope = fixture.querySelector("dialog[open]") ?? fixture;
  const element = [...scope.querySelectorAll<HTMLElement>("button,a")].find(
    (el) =>
      el.getAttribute("aria-label") === name ||
      el.textContent?.trim() === name ||
      el.textContent?.trim().startsWith(name),
  );
  check(element, "Controlo ausente: " + name);
  await act(async () => {
    element.focus();
    element.click();
  });
}
async function choose(label: string, value: string) {
  const el = [...fixture.querySelectorAll("select")].find(
    (el) =>
      document.querySelector(`label[for="${CSS.escape(el.id)}"]`)
        ?.textContent === label,
  );
  check(el, "Índice ausente");
  await act(async () => {
    el.value = value;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
async function run(name: string, action: () => Promise<void>) {
  try {
    await action();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error: String(error) });
  } finally {
    offline = false;
    withdrawn = false;
    rows = structuredClone(originals);
    await act(async () => root.render(null));
  }
}
await run(
  "F3.2: anonymous reader uses public snapshots, editorial order, SPA chapter index and detail return",
  async () => {
    const router = await mount(`/obras/${bookId}/capitulos/${ch1}`);
    check(
      fixture.querySelector("h1")?.textContent === "Primeiro capítulo",
      "Título incorreto",
    );
    check(fixture.textContent?.includes("Autora pública"), "Autoria ausente");
    const select = fixture.querySelector("select")!;
    check(select.options[1].value === ch2, "Ordem editorial perdida");
    await choose("Mudar de capítulo", ch2);
    await waitFor(
      () => fixture.querySelector("h1")?.textContent === "Segundo capítulo",
      "Índice não navegou",
    );
    check(router.state.location.pathname.endsWith(ch2), "URL não mudou");
    check(!fixture.querySelector("script"), "HTML de conteúdo executável");
    await click("Capítulo anterior");
    await waitFor(
      () => fixture.querySelector("h1")?.textContent === "Primeiro capítulo",
      "Anterior falhou",
    );
    await click("Próximo capítulo");
    await waitFor(
      () => fixture.querySelector("h1")?.textContent === "Segundo capítulo",
      "Seguinte falhou",
    );
    await click("Voltar aos detalhes da obra");
    await waitFor(
      () => fixture.querySelector("h1")?.textContent === "Livro público",
      "Retorno falhou",
    );
  },
);
await run(
  "F3.2: authenticated reading keeps anonymous transport and history local",
  async () => {
    await mount(`/obras/${bookId}/capitulos/${ch2}`, true);
    check(
      libraryStore.getEntry(bookId)?.lastReadChapterId === ch2,
      "Visita não guardada na conta local",
    );
    check(
      requests.every(
        (path) => path.includes("published") || path.includes("read_public"),
      ),
      "Histórico enviado ao servidor",
    );
  },
);
await run(
  "F3.2: poetry preserves indent, verses, blank stanzas, alignment and index",
  async () => {
    await mount(`/obras/${poemId}/capitulos/${p1}`);
    const lines = [...fixture.querySelectorAll(".poetry-verse")];
    check(lines[0].textContent === "  Verso com espaços", "Indentação perdida");
    check(
      fixture.querySelectorAll(".poetry-stanza").length === 3,
      "Estrofes vazias perdidas",
    );
    check(
      getComputedStyle(fixture.querySelector(".poetry-stanzas-container")!)
        .textAlign === "center",
      "Alinhamento perdido",
    );
    await choose("Escolher poema", p2);
    await waitFor(
      () => fixture.querySelector("h1")?.textContent === "Segundo poema",
      "Índice de poemas falhou",
    );
    check(
      getComputedStyle(fixture.querySelector(".poetry-stanzas-container")!)
        .textAlign === "left",
      "Esquerda perdida",
    );
    await click("Poema anterior");
    await waitFor(
      () => fixture.querySelector("h1")?.textContent === "Primeiro poema",
      "Anterior poema falhou",
    );
    await click("Próximo poema");
    await waitFor(
      () => fixture.querySelector("h1")?.textContent === "Segundo poema",
      "Seguinte poema falhou",
    );
  },
);
await run(
  "F3.2: accessible preferences persist across reader mounts, system theme stays local",
  async () => {
    const globalTheme = document.documentElement.dataset.theme;
    await mount(`/obras/${poemId}/capitulos/${p1}`);
    await click("Ajustar tipografia poética");
    const dialog = fixture.querySelector<HTMLDialogElement>("dialog[open]")!;
    check(
      dialog.matches(":modal") && dialog.contains(document.activeElement),
      "Modal sem foco",
    );
    check(
      dialog.querySelectorAll("fieldset").length === 5,
      "Painel incompleto",
    );
    await click("Muito grande");
    await click("Sem serifa");
    await click("Amplo");
    await click("Larga");
    await click("Sistema");
    check(
      dialog.querySelector('[aria-pressed="true"]'),
      "Seleção não anunciada",
    );
    await act(async () =>
      drive({
        kind: "media",
        features: [{ name: "prefers-color-scheme", value: "light" }],
      }),
    );
    await waitFor(
      () => fixture.querySelector(".reader-theme-light"),
      "Tema sistema não respondeu",
    );
    const canvas = fixture.querySelector(".poetry-canvas")!;
    check(getComputedStyle(canvas).fontSize === "28px", "Tamanho ignorado");
    check(
      getComputedStyle(canvas).fontFamily.includes("Arial"),
      "Fonte ignorada",
    );
    check(
      getComputedStyle(canvas).lineHeight === "56px",
      "Espaçamento ignorado",
    );
    check(
      document.documentElement.dataset.theme === globalTheme,
      "Tema global alterado",
    );
    await act(async () => drive({ kind: "key", key: "Escape" }));
    await waitFor(
      () => !fixture.querySelector("dialog[open]"),
      "Escape não fechou",
    );
    check(
      document.activeElement?.getAttribute("aria-label") ===
        "Ajustar tipografia poética",
      "Foco não regressou",
    );
    check(
      localStorage.getItem(preferenceKey)?.includes('"theme":"system"'),
      "Preferências não persistidas",
    );
    await mount(`/obras/${poemId}/capitulos/${p2}`);
    check(
      getComputedStyle(fixture.querySelector(".poetry-canvas")!).fontSize ===
        "28px",
      "Preferência perdida",
    );
  },
);
await run(
  "F3.2: local resume survives navigation and missing chapters fall back safely",
  async () => {
    await mount(`/obras/${bookId}/capitulos/${ch2}`);
    flushLocal();
    check(
      localStorage.getItem(scopedKey("ag_library_entries_v1"))?.includes(ch2),
      "Progresso não persistido",
    );
    await mount(`/obras/${bookId}`);
    check(
      fixture
        .querySelector(`a[href="/obras/${bookId}/capitulos/${ch2}"]`)
        ?.textContent?.includes("Retomar leitura"),
      "Sem retoma",
    );
    rows[0].entries = rows[0].entries.filter((e) => e.id !== ch2);
    await mount(`/obras/${bookId}`);
    check(
      fixture.textContent?.includes("já não está nesta edição"),
      "Capítulo removido não tratado",
    );
    await click("Começar leitura");
    await waitFor(
      () => fixture.querySelector("h1")?.textContent === "Primeiro capítulo",
      "Fallback inválido",
    );
  },
);
await run(
  "F3.2: invalid URLs, withdrawal on an open reader and saved links deny content",
  async () => {
    await mount(`/obras/${bookId}/capitulos/inexistente`);
    check(fixture.textContent?.includes("404"), "URL inválida aceita");
    await mount(`/obras/${bookId}/capitulos/${ch1}`);
    withdrawn = true;
    await act(async () =>
      window.dispatchEvent(
        new PageTransitionEvent("pageshow", { persisted: true }),
      ),
    );
    await waitFor(
      () => fixture.textContent?.includes("404"),
      "Retirada não removeu leitura aberta",
    );
    check(
      !fixture.textContent?.includes("Texto público confirmado"),
      "Texto retirado permanece",
    );
    await mount(`/obras/${bookId}/capitulos/${ch1}`);
    check(
      fixture.textContent?.includes("404"),
      "URL guardado revelou retirada",
    );
  },
);
await run(
  "F3.2: live checks are lightweight and a new public edition replaces content",
  async () => {
    await mount(`/obras/${bookId}/capitulos/${ch1}`);
    const full = requests.filter((path) =>
      path.endsWith("read_public_work"),
    ).length;
    await act(async () =>
      window.dispatchEvent(new PageTransitionEvent("pageshow")),
    );
    await act(async () => pause(80));
    check(
      requests.filter((path) => path.endsWith("read_public_work")).length ===
        full,
      "Recarregou texto sem mudar edição",
    );
    rows[0].last_published_at = "2026-11-12T10:00:00Z";
    rows[0].entries[0].content = "Nova edição pública confirmada";
    await act(async () =>
      window.dispatchEvent(new PageTransitionEvent("pageshow")),
    );
    await waitFor(
      () => fixture.textContent?.includes("Nova edição pública confirmada"),
      "Nova edição não carregou",
    );
  },
);
await run(
  "F3.2: visible network error fails closed and retry restores public content",
  async () => {
    await mount(`/obras/${bookId}/capitulos/${ch1}`);
    offline = true;
    await act(async () =>
      window.dispatchEvent(new PageTransitionEvent("pageshow")),
    );
    await waitFor(
      () => fixture.querySelector('[role="alert"]'),
      "Erro invisível",
    );
    check(
      !fixture.querySelector(".chapter-body"),
      "Conteúdo mantido após erro",
    );
    offline = false;
    await click("Tentar novamente");
    await waitFor(
      () => fixture.querySelector(".chapter-body"),
      "Repetição não recuperou",
    );
  },
);
await run(
  "F3.2: 320/375/768px, largest font, keyboard and basic semantics",
  async () => {
    await mount(`/obras/${poemId}/capitulos/${p1}`);
    await click("Ajustar tipografia poética");
    await click("Muito grande");
    for (const width of [320, 375, 768]) {
      await act(async () => drive({ kind: "viewport", width }));
      await pause(30);
      check(
        document.documentElement.scrollWidth <= window.innerWidth + 1,
        `Modal transborda a ${width}`,
      );
    }
    await act(async () => drive({ kind: "key", key: "Escape" }));
    for (const width of [320, 375, 768]) {
      await act(async () => drive({ kind: "viewport", width }));
      check(
        document.documentElement.scrollWidth <= window.innerWidth + 1,
        `Leitor transborda a ${width}`,
      );
    }
    check(fixture.querySelectorAll("h1").length === 1, "Hierarquia de títulos");
    check(
      fixture.querySelector('nav[aria-label="Índice de poemas"]'),
      "Índice sem nome",
    );
    const button = fixture.querySelector<HTMLButtonElement>(
      '[aria-label="Ajustar tipografia poética"]',
    )!;
    await act(async () => button.focus());
    await drive({ kind: "key", key: "Tab" });
    check(fixture.contains(document.activeElement), "Teclado perdeu foco");
    await act(async () => button.focus());
    await act(async () => drive({ kind: "key", key: "Enter" }));
    await waitFor(
      () => fixture.querySelector("dialog[open]"),
      "Teclado não abriu preferências",
    );
    await drive({ kind: "key", key: "Tab" });
    check(
      fixture.querySelector("dialog[open]")?.contains(document.activeElement),
      "Foco escapou do modal",
    );
    for (const label of ["Escuro", "Claro", "Sépia"]) {
      await click(label);
      const reader = fixture.querySelector(".poetry-reader-container")!,
        primary = fixture.querySelector("a.button.primary")!;
      const body = getComputedStyle(reader),
        link = getComputedStyle(primary);
      check(
        contrast(body.color, body.backgroundColor) >= 4.5,
        "Contraste insuficiente: " + label,
      );
      check(
        contrast(link.color, link.backgroundColor) >= 4.5,
        "Contraste da navegação: " + label,
      );
    }
    await act(async () => drive({ kind: "key", key: "Escape" }));
    await act(async () => drive({ kind: "viewport", width: 375 }));
    await drive({ kind: "screenshot", label: "f32-poetry-mobile" });
  },
);
await run("F3.2: inaugural prose and poetry remain readable", async () => {
  await mount("/obras/ag-carta-abertura/capitulos/cap-1");
  check(
    fixture.textContent?.includes("Uma porta entreaberta"),
    "Prosa inaugural perdida",
  );
  await mount("/obras/ag-primeiras-linhas/capitulos/cap-1");
  check(fixture.querySelector(".poetry-verse"), "Poesia inaugural perdida");
});
await act(async () => root.unmount());
document.getElementById("results")!.textContent = JSON.stringify(results);
document.documentElement.dataset.tests = results.every((r) => r.ok)
  ? "passed"
  : "failed";
