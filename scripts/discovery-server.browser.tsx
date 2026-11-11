import {
  discoveryQuery,
  localDiscovery,
} from "../src/foundation/features/catalog/discovery";
import { mapPublishedWork } from "../src/foundation/features/catalog/repository";
import { slugify, normalizeText } from "../src/foundation/lib/discovery";
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
  tags: [] as string[],
  content_warnings: [] as string[],
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
for (let i = 0; i < 27; i++)
  originals.push({
    ...originals[0],
    id: `60000000-0000-0000-0000-${String(i).padStart(12, "0")}`,
    title: `História ${String(i).padStart(2, "0")}`,
    entries: [],
  });
originals[0].title = "Coração das estrelas";
originals[0].subtitle = "Subtítulo das marés";
originals[0].tags = ["Ficção científica", "東京 文学"];
originals[0].genre = "Fantasia";
originals[0].content_warnings = ["Violência"];
originals[0].age_rating = "+12";
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
      if (url.pathname.endsWith("/rpc/search_public_works")) {
        const q = JSON.parse(String(init?.body)).p_filters;
        await pause(q.query === "lenta" ? 700 : 10);
        const visible = withdrawn ? [] : rows.map(mapPublishedWork);
        const matches = localDiscovery(visible, q);
        const pages = Math.max(1, Math.ceil(matches.length / q.size));
        const page = Math.min(pages, q.page);
        return Response.json({
          items: matches
            .slice((page - 1) * q.size, page * q.size)
            .map((work) => rows.find((row) => row.id === work.id)),
          total: matches.length,
          page,
          size: q.size,
        });
      }
      if (url.pathname.endsWith("/rpc/public_discovery_facets")) {
        const q = JSON.parse(String(init?.body)).p_query;
        return Response.json({
          genres: ["Fantasia", "Ficção"],
          languages: ["pt"],
          warnings: ["Violência"],
          tags: withdrawn
            ? []
            : rows[0].tags
                .filter(
                  (tag) =>
                    normalizeText(tag).includes(normalizeText(q)) ||
                    slugify(tag).includes(slugify(q)),
                )
                .map((tag) => ({ key: slugify(tag), name: tag, count: 1 })),
        });
      }
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

async function field(label: string, value: string) {
  const target = [...fixture.querySelectorAll("label")].find(
    (el) => el.textContent?.trim() === label,
  );
  const input = target
    ? (document.getElementById(target.htmlFor) as HTMLInputElement)
    : null;
  check(input, "Campo ausente: " + label);
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function filter(label: string, value: string) {
  const select = [...fixture.querySelectorAll("select")].find((el) =>
    el.closest("label")?.textContent?.startsWith(label),
  );
  check(select, "Filtro ausente: " + label);
  await act(async () => {
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
await run(
  "F3.3: anonymous shared URL, Unicode/accent search, author and combined filters",
  async () => {
    await mount(
      "/pesquisa?q=coracao&tag=Ficção+científica&genero=Fantasia&idioma=pt&idade=%2B12&aviso=Violência",
    );
    await waitFor(
      () =>
        fixture
          .querySelector('[aria-label="Resultados de publicações"]')
          ?.textContent?.includes("1 publicação encontrada"),
      "Filtros combinados falharam",
    );
    check(
      fixture.textContent?.includes("Coração das estrelas"),
      "Título ausente",
    );
    await field("Pesquisar publicações", "autora");
    await waitFor(
      () =>
        fixture
          .querySelector('[aria-label="Resultados de publicações"]')
          ?.textContent?.includes("1 publicação encontrada"),
      "Pesquisa de autor falhou",
    );
    await mount("/tags/東京-文学");
    await waitFor(
      () => fixture.textContent?.includes("Coração das estrelas"),
      "Tag Unicode falhou",
    );
  },
);
await run(
  "F3.3: server pagination, order, filters and clear keep URL",
  async () => {
    const router = await mount("/catalogo");
    await waitFor(
      () =>
        fixture
          .querySelector('[aria-label="Resultados de publicações"]')
          ?.textContent?.includes("29 publicações"),
      "Total incorreto",
    );
    check(
      fixture.querySelectorAll(
        '[aria-label="Resultados de publicações"] .work-card',
      ).length === 12,
      "Página sem limite",
    );
    await click("Seguinte");
    await waitFor(
      () => router.state.location.search.includes("pagina=2"),
      "Paginação sem URL",
    );
    await waitFor(
      () =>
        fixture
          .querySelector('[aria-label="Resultados de publicações"]')
          ?.textContent?.includes("página 2"),
      "Página não mudou",
    );
    await filter("Ordenação", "titulo");
    await waitFor(
      () => router.state.location.search.includes("ordem=titulo"),
      "Ordem sem URL",
    );
    await filter("Formato", "Poesia");
    await waitFor(
      () =>
        fixture
          .querySelector('[aria-label="Resultados de publicações"]')
          ?.textContent?.includes("1 publicação encontrada"),
      "Formato não filtrou",
    );
    await click("Limpar filtros");
    await waitFor(
      () => router.state.location.search === "",
      "Filtros não limpos",
    );
  },
);
await run(
  "F3.3: stale responses, empty search and network failures remain safe",
  async () => {
    await mount("/pesquisa");
    await field("Pesquisar publicações", "lenta");
    await act(async () => pause(360));
    await field("Pesquisar publicações", "coracao");
    await waitFor(
      () =>
        fixture
          .querySelector('[aria-label="Resultados de publicações"]')
          ?.textContent?.includes("1 publicação encontrada"),
      "Pesquisa nova falhou",
    );
    await act(async () => pause(800));
    check(
      fixture
        .querySelector('[aria-label="Resultados de publicações"]')
        ?.textContent?.includes("Coração das estrelas"),
      "Resposta obsoleta substituiu resultado",
    );
    await field("Pesquisar publicações", "inexistente");
    await waitFor(
      () =>
        fixture
          .querySelector('[aria-label="Resultados de publicações"]')
          ?.textContent?.includes("0 publicações"),
      "Vazio não tratado",
    );
    offline = true;
    await field("Pesquisar publicações", "erro");
    await waitFor(
      () => fixture.querySelector('[role="alert"]'),
      "Erro invisível",
    );
    offline = false;
    await click("Tentar novamente");
    await waitFor(
      () => !fixture.querySelector('[aria-busy="true"]'),
      "Repetição falhou",
    );
  },
);
await run(
  "F3.3: authenticated browsing, withdrawal and global search modal",
  async () => {
    await mount("/catalogo?q=coracao", true);
    await waitFor(
      () => fixture.textContent?.includes("Coração das estrelas"),
      "Leitura autenticada falhou",
    );
    withdrawn = true;
    await act(async () => window.dispatchEvent(new Event("focus")));
    await waitFor(
      () =>
        !fixture
          .querySelector('[aria-label="Resultados de publicações"]')
          ?.textContent?.includes("Coração das estrelas"),
      "Retirada persistiu",
    );
    withdrawn = false;
    await click("Abrir pesquisa global");
    check(fixture.querySelector("dialog[open]"), "Modal ausente");
    await field("Pesquisa global de obras", "coracao");
    await waitFor(
      () =>
        fixture
          .querySelector("dialog[open]")
          ?.textContent?.includes("Coração das estrelas"),
      "Modal sem resultados",
    );
    await act(async () => drive({ kind: "key", key: "Escape" }));
    await waitFor(
      () => !fixture.querySelector("dialog[open]"),
      "Escape falhou",
    );
  },
);
await run(
  "F3.3: tag directory, clickable cards, mobile and keyboard",
  async () => {
    await mount("/tags?q=cientifica");
    await waitFor(
      () => fixture.textContent?.includes("Ficção científica"),
      "Diretório não pesquisou",
    );
    await click("Ficção científica");
    await waitFor(
      () =>
        fixture
          .querySelector('[aria-label="Resultados de publicações"]')
          ?.textContent?.includes("Coração das estrelas"),
      "Tag não navegou",
    );
    await act(async () => drive({ kind: "viewport", width: 375 }));
    await act(async () => pause(50));
    check(
      document.documentElement.scrollWidth <=
        document.documentElement.clientWidth + 1,
      "Overflow móvel: " +
        JSON.stringify(
          [...fixture.querySelectorAll("*")]
            .filter(
              (el) =>
                el.getBoundingClientRect().right >
                document.documentElement.clientWidth + 1,
            )
            .slice(0, 8)
            .map((el) => el.tagName + "." + el.className),
        ),
    );

    check(
      fixture.querySelectorAll('a[href*="/tags/"]').length > 0,
      "Cartões sem tags clicáveis",
    );
    await drive({ kind: "screenshot", label: "f33-discovery-mobile" });
  },
);
await act(async () => root.unmount());
document.getElementById("results")!.textContent = JSON.stringify(results);
document.documentElement.dataset.tests = results.every((r) => r.ok)
  ? "passed"
  : "failed";
