import React, { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { LanguageCombobox } from "../src/foundation/components/LanguageCombobox";
import { WorkCover } from "../src/foundation/components/WorkCover";
import {
  COVER_STYLES,
  EDITORIAL_COVER_PALETTE,
} from "../src/foundation/data/covers";
import { LANGUAGE_CATALOG } from "../src/foundation/data/languages";
import { getGenresForFormat } from "../src/foundation/data/genres";
import { WorkMetadataForm } from "../src/foundation/features/studio/WorkMetadataForm";
import { WorksController } from "../src/foundation/features/studio/worksController";
import { RemoteWorksProvider } from "../src/foundation/features/studio/RemoteWorksProvider";
import type {
  WorksRepository,
  DraftMetadata,
} from "../src/foundation/features/studio/worksRepository";
import type { StudioWork } from "../src/foundation/features/studio/types";
import { ApplicationRoutes } from "../src/foundation/app/App";
import "../src/foundation/styles/global.css";
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const fixture = document.getElementById("fixture")!;
let root = createRoot(fixture);
let chosen = "",
  created: DraftMetadata | null = null,
  saved: DraftMetadata | null = null;
const book: StudioWork = {
  id: "fixture-work",
  ownerId: "author-test",
  persistence: "supabase",
  revision: 1,
  title: "Obra de teste",
  subtitle: "Subtítulo",
  synopsis: "Sinopse",
  format: "Romance",
  mode: "prose",
  genre: "Género personalizado anterior",
  language: "Português",
  tags: [],
  ageRating: "Livre",
  contentWarnings: [],
  coverAccentColor: "#D97706",
  status: "draft",
  chapters: [],
  createdAt: "2026-11-11",
  updatedAt: "2026-11-11",
};
const repository: WorksRepository = {
  list: async () => [book],
  find: async () => book,
  create: async (input) => {
    created = input;
    return { ...book, ...input, id: "created-work" };
  },
  update: async (work, input) => {
    saved = input;
    return { ...work, ...input, revision: work.revision! + 1 };
  },
  remove: async () => {},
};
function Samples() {
  const [language, setLanguage] = useState("Português");
  return (
    <main>
      <button
        onClick={() => (document.documentElement.dataset.theme = "light")}
      >
        Tema claro
      </button>
      <button onClick={() => (document.documentElement.dataset.theme = "dark")}>
        Tema escuro
      </button>
      <LanguageCombobox
        value={language}
        onChange={(value) => {
          chosen = value;
          setLanguage(value);
        }}
        label="Idioma de teste"
      />
      <output data-language>{language}</output>
      <WorkMetadataForm work={book} />
      <div
        data-covers
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 12,
        }}
      >
        {[...COVER_STYLES, "legacy"].map((style) => (
          <WorkCover
            key={style}
            style={style as (typeof COVER_STYLES)[number]}
            title="Título de verificação"
            author="Autora"
            subtitle="Texto pequeno"
            color="#D97706"
          />
        ))}
      </div>
    </main>
  );
}
const pause = (ms = 0) => new Promise((r) => setTimeout(r, ms));
function check(value: unknown, message: string): asserts value {
  if (!value) throw Error(message + ": " + fixture.textContent?.slice(0, 500));
}
const results: { name: string; ok: boolean; error?: string }[] = [];
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
async function waitFor(test: () => unknown, message: string) {
  for (let i = 0; i < 600; i++) {
    if (test()) return;
    await act(async () => pause(20));
  }
  throw Error(message + ": " + fixture.textContent?.slice(0, 500));
}
async function mount(wizard = false) {
  await act(async () => root.render(null));
  const controller = new WorksController(repository);
  const router = createMemoryRouter(
    [
      {
        path: "*",
        element: (
          <RemoteWorksProvider controller={controller}>
            {wizard ? <ApplicationRoutes /> : <Samples />}
          </RemoteWorksProvider>
        ),
      },
    ],
    {
      initialEntries: [wizard ? "/estudio/obras/nova" : "/"],
      future: { v7_relativeSplatPath: true },
    },
  );
  await act(async () => {
    root.render(
      <React.StrictMode>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </React.StrictMode>,
    );
    await pause(30);
  });
  await waitFor(
    () => (wizard ? fixture.querySelector("h1") : combo()),
    "Conteúdo não carregou",
  );
  return router;
}
async function click(label: string) {
  const el = [...fixture.querySelectorAll<HTMLElement>("button")].find(
    (el) =>
      el.textContent?.trim() === label ||
      el.textContent?.trim().startsWith(label) ||
      el.getAttribute("aria-label") === label,
  );
  check(el, "Botão ausente: " + label);
  await act(async () => {
    el.focus();
    el.click();
  });
}
async function input(el: HTMLInputElement, value: string) {
  await act(async () => {
    el.focus();
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function run(name: string, action: () => Promise<void>) {
  try {
    await action();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error: String(error) });
  } finally {
    await act(async () => root.render(null));
  }
}
const combo = () =>
  fixture.querySelector<HTMLInputElement>('[role="combobox"]')!;
await run(
  "F3.4: keyboard active descendant remains visible and Enter selects the highlighted language",
  async () => {
    await mount();
    await act(async () => combo().focus());
    await act(async () => drive({ kind: "key", key: "ArrowDown" }));
    for (let i = 0; i < 35; i++)
      await act(async () => drive({ kind: "key", key: "ArrowDown" }));
    const id = combo().getAttribute("aria-activedescendant")!;
    const option = document.getElementById(id)!;
    check(option, "Opção ativa ausente");
    const list = fixture
        .querySelector('[role="listbox"]')!
        .getBoundingClientRect(),
      box = option.getBoundingClientRect();
    check(
      box.top >= list.top - 1 && box.bottom <= list.bottom + 1,
      "Opção ativa fora da área visível",
    );
    const code = option.querySelector("span.font-mono")?.textContent?.trim();
    const expected = LANGUAGE_CATALOG.find((l) => l.code === code)?.name;
    check(expected, "Código da opção ausente");
    await act(async () => drive({ kind: "key", key: "Enter" }));
    check(chosen === expected, "Seleção não corresponde ao destaque");
    check(combo().value === expected, "Valor apresentado divergente");
    check(
      combo().getAttribute("aria-expanded") === "false",
      "Seleção reabriu menu",
    );
    check(
      !combo().hasAttribute("aria-activedescendant"),
      "Referência ARIA obsoleta",
    );
    check(document.activeElement === combo(), "Foco perdido");
  },
);
await run("F3.4: filtering, region, Escape, Tab, clear", async () => {
  await mount();
  await input(combo(), "japon");
  await waitFor(
    () => fixture.querySelector('[role="option"]'),
    "Pesquisa sem resultado",
  );
  const active = document.getElementById(
    combo().getAttribute("aria-activedescendant")!,
  );
  check(active?.textContent?.includes("Japonês"), "ARIA não acompanha filtro");
  await act(async () => drive({ kind: "key", key: "Escape" }));
  check(combo().value === "Português", "Escape alterou seleção");
  await act(async () => drive({ kind: "key", key: "ArrowDown" }));
  await click("África");
  check(document.activeElement === combo(), "Região não devolveu foco");
  await act(async () => drive({ kind: "key", key: "Tab" }));
  check(combo().getAttribute("aria-expanded") === "false", "Tab não fechou");
  await click("Limpar idioma selecionado");
  check(chosen === "", "Limpar não funcionou");
});
await run(
  "F3.4: pointer selection retains input focus and does not reopen the dropdown",
  async () => {
    await mount();
    await input(combo(), "galego");
    await waitFor(
      () => fixture.querySelector('[role="option"]'),
      "Opção ausente",
    );
    const option = fixture.querySelector<HTMLElement>('[role="option"]')!;
    await act(async () => {
      const down = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
      });
      option.dispatchEvent(down);
      check(
        down.defaultPrevented,
        "Pointer pode retirar foco antes de selecionar",
      );
      option.click();
    });
    check(
      combo().value === "Galego" && chosen === "Galego",
      "Seleção por pointer falhou",
    );
    check(
      combo().getAttribute("aria-expanded") === "false",
      "Pointer reabriu menu",
    );
    check(document.activeElement === combo(), "Pointer perdeu foco");
  },
);
await run(
  "F3.4: application theme overrides the OS in combobox and metadata controls",
  async () => {
    await mount();
    await act(async () =>
      drive({
        kind: "media",
        features: [{ name: "prefers-color-scheme", value: "dark" }],
      }),
    );
    await click("Tema claro");
    await act(async () => pause(30));
    check(
      getComputedStyle(combo()).backgroundColor === "rgb(255, 255, 255)",
      "Input segue OS escuro",
    );
    const hex = fixture.querySelector<HTMLInputElement>(
      'input[placeholder="#14243B"]',
    )!;
    check(
      getComputedStyle(hex).backgroundColor === "rgb(255, 255, 255)",
      "Metadados seguem OS escuro",
    );
    await act(async () =>
      drive({
        kind: "media",
        features: [{ name: "prefers-color-scheme", value: "light" }],
      }),
    );
    await click("Tema escuro");
    await act(async () => pause(30));
    check(
      getComputedStyle(combo()).backgroundColor !== "rgb(255, 255, 255)",
      "Input segue OS claro",
    );
    check(
      getComputedStyle(hex).backgroundColor !== "rgb(255, 255, 255)",
      "Metadados seguem OS claro",
    );
  },
);
function ratio(a: string, b: string) {
  const lum = (color: string) => {
    const rgb = (color.match(/[\d.]+/g) ?? [])
      .slice(0, 3)
      .map(Number)
      .map((c) => {
        const v = c / 255;
        return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const x = lum(a),
    y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
await run(
  "F3.4: rendered cover text remains opaque and at least 4.5 in all styles",
  async () => {
    await mount();
    for (const cover of fixture.querySelectorAll(
      "[data-covers] .ag-work-cover",
    )) {
      const background = getComputedStyle(cover).backgroundColor;
      for (const el of cover.querySelectorAll("h3,p,span")) {
        const style = getComputedStyle(el);
        check(
          ratio(style.color, background) >= 4.5,
          "Contraste renderizado insuficiente",
        );
        check(style.opacity === "1", "Opacidade reduz contraste");
      }
    }
    await drive({ kind: "screenshot", label: "f34-stabilized-covers" });
  },
);
await run(
  "F3.4: custom genre survives metadata save; wizard shows exactly the submitted initial genre",
  async () => {
    await mount();
    const genre = [...fixture.querySelectorAll("select")].find((el) =>
      el.closest("label")?.textContent?.startsWith("Género"),
    )!;
    check(genre.value === book.genre, "Género personalizado perdido");
    await click("Guardar alterações");
    check(saved?.genre === book.genre, "Personalizado não guardado");
    await mount(true);
    await click("2");
    const title = [...fixture.querySelectorAll("label")].find(
      (el) => el.textContent?.trim() === "Título da Obra *",
    )!;
    await input(
      document.getElementById(title.htmlFor) as HTMLInputElement,
      "Obra do wizard",
    );
    const wizardGenre = fixture.querySelector<HTMLSelectElement>("#w-genre")!;
    const displayed = wizardGenre.value;
    check(
      getGenresForFormat("Romance").all.includes(displayed),
      "Valor inicial fora do catálogo",
    );
    await click("5");
    await click("Criar obra e abrir");
    check(
      created?.genre === displayed,
      "Género submetido diferente do apresentado",
    );
    await waitFor(
      () => fixture.textContent?.includes("Editar metadados"),
      "Gestão não abriu",
    );
  },
);
await act(async () => root.unmount());
document.getElementById("results")!.textContent = JSON.stringify(results);
document.documentElement.dataset.tests = results.every((r) => r.ok)
  ? "passed"
  : "failed";
