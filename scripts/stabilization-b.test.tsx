import test from "node:test";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import { readFileSync } from "node:fs";
import { Providers } from "../src/foundation/app/providers";
import {
  cleanPreferences,
  defaults,
  initializePreferences,
  preferenceSnapshot,
  updateReadingPreferences,
  preferenceOriginals,
  updateAccessibility,
} from "../src/foundation/features/preferences/store";

test("AG-19: provider completo renderiza em SSR sem APIs do navegador", () => {
  assert.doesNotThrow(() =>
    renderToString(
      <Providers>
        <p>SSR</p>
      </Providers>,
    ),
  );
});
test("AG-09: migração não destrutiva e precedência global/formato", () => {
  const storage = new Map([
    [
      "ag_reader_prose_prefs",
      JSON.stringify({ fontSize: "large", measure: "wide" }),
    ],
    ["ag_reading_font_size", "medium"],
  ]);
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {},
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  });
  initializePreferences();
  assert.equal(preferenceSnapshot().global.fontSize, "medium");
  assert.equal(preferenceSnapshot().formats.prose?.measure, "wide");
  updateReadingPreferences({ fontSize: "large" }, "poetry");
  assert.equal(preferenceSnapshot().formats.poetry?.fontSize, "large");
  updateReadingPreferences({ fontSize: "normal" });
  assert.equal(preferenceSnapshot().formats.poetry?.fontSize, undefined);
  assert.equal(preferenceOriginals().ag_reading_font_size, "medium");
  assert.deepEqual(
    cleanPreferences({ zoom: Infinity, direction: "bad", fontSize: null }),
    {},
  );
  updateAccessibility({ highContrast: true, reducedMotion: true });
  assert.equal(preferenceSnapshot().accessibility.highContrast, true);
  delete (globalThis as { window?: unknown }).window;
});
test("AG-10: regras CSS de contraste e movimento estão presentes para ambos os temas", () => {
  const css = readFileSync("src/foundation/styles/global.css", "utf8");
  assert.ok(css.includes(':root.high-contrast[data-theme="light"]'));
  assert.ok(css.includes(":root.prefers-reduced-motion"));
  assert.ok(css.includes("@media (prefers-reduced-motion: reduce)"));
});

import {
  fetchUserProfile,
  findAuthorWorks,
} from "../src/foundation/features/profile/service";
import type { Work } from "../src/foundation/data/works";
import type { SupabaseClient } from "@supabase/supabase-js";
test("AG-11/14: lookup exato com underscore e associação apenas por ID estável", async () => {
  let compared = "";
  const client = {
    from() {
      return {
        select() {
          return {
            eq(column: string, value: string) {
              assert.equal(column, "username");
              compared = value;
              return {
                maybeSingle: async () => ({
                  data: {
                    id: "real-author",
                    username: value,
                    display_name: "Arquivo Global — Equipa Editorial",
                    bio: "",
                    avatar_url: null,
                    created_at: "2026-01-01",
                  },
                  error: null,
                }),
              };
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;
  const result = await fetchUserProfile(" Alice_B ", client);
  assert.equal(compared, "alice_b");
  assert.equal(result.profile?.username, "alice_b");

  const isolatedWorks: Work[] = [
    {
      id: "w-isolated-1",
      title: "Obra de Teste Isolada",
      author: "Arquivo Global — Equipa Editorial",
      authorId: "real-author",
      format: "Romance",
      genre: "Ficção",
      tags: ["teste"],
      synopsis: "Sinopse de teste",
      createdAt: "2026-01-01",
      cover: 1,
    },
  ];
  // Associação deve ser estritamente por ID estável (authorId), nunca por display_name
  assert.equal(findAuthorWorks("real-author", isolatedWorks).length, 1);
  assert.equal(findAuthorWorks("real-author", isolatedWorks)[0].id, "w-isolated-1");
  assert.deepEqual(findAuthorWorks("Arquivo Global — Equipa Editorial", isolatedWorks), []);
  assert.deepEqual(findAuthorWorks("outro-autor", isolatedWorks), []);
  // Sem dataset explícito, catálogo de produção não possui obras fictícias
  assert.deepEqual(findAuthorWorks("ag-editorial-team"), []);
});

import {
  ProseContent,
  InlineContent,
} from "../src/foundation/features/reader/content";
import { getWorkReadingData } from "../src/foundation/features/reader/data";
test("AG-15: obras desconhecidas não geram amostras", () =>
  assert.equal(getWorkReadingData("unknown"), undefined));
test("AG-16: toolbar, quebras e HTML seguro partilham contrato", () => {
  const html = renderToString(
    <ProseContent
      text={
        "# Secção\n\n**Forte** e *leve* e <u>sublinhado</u>\nlinha seguinte\n\n> Citação\n\n- item\n- outro\n\n1. primeiro\n\n* * *\n\n<img src=x onerror=alert(1)><script>bad()</script>"
      }
    />,
  );
  for (const tag of [
    "<h2>",
    "<strong>",
    "<em>",
    "<u>",
    "<br/>",
    "<blockquote>",
    "<ul>",
    "<ol>",
    "<hr/>",
  ])
    assert.ok(html.includes(tag), tag);
  assert.ok(!html.includes("<img"));
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(
    renderToString(<InlineContent text="verso **forte**" />).includes(
      "<strong>forte</strong>",
    ),
  );
});

import { studioStore } from "../src/foundation/features/studio/store";
import { libraryStore } from "../src/foundation/features/library/store";
import {
  selectScope,
  scopedKey,
  handleLocalStorageChange,
  hasLocalConflict,
  acceptRemoteLocal,
  exportLocal,
  persistenceMetrics,
  writeLocal,
} from "../src/foundation/features/local/persistence";
import { validCollection } from "../src/foundation/features/local/validation";
const draft = {
  id: "b-draft",
  title: "Original",
  synopsis: "Texto",
  format: "Romance" as const,
  mode: "prose" as const,
  genre: "Geral",
  language: "Português",
  tags: [],
  ageRating: "Livre" as const,
  contentWarnings: [],
  status: "draft" as const,
  coverAccentColor: "#112233",
  chapters: [{ id: "cap-1", title: "Primeiro", number: 1, content: "Texto" }],
};
test("AG-20: schema rejeita tipos, arrays e versões incompatíveis sem sobrescrita", () => {
  for (const [index, raw] of [
    JSON.stringify({ version: 999, data: [] }),
    "[null]",
    '[{"id":"wrong"}]',
  ].entries()) {
    selectScope(`user:b-corrupt-${index}`);
    const key = scopedKey("ag_studio_works_v1");
    localStorage.setItem(key, raw);
    assert.deepEqual(studioStore.getWorks(), []);
    studioStore.createWork(draft);
    assert.equal(localStorage.getItem(key), raw);
    assert.equal(exportLocal().originals.ag_studio_works_v1, raw);
  }
  assert.equal(
    validCollection("works", [
      {
        ...draft,
        createdAt: "today",
        updatedAt: "today",
        chapters: [{ id: "cap", number: -1, title: "Bad" }],
      },
    ]),
    false,
  );
});
test("AG-20: arrays da Etapa A migram com cópia original e IDs preservados", () => {
  selectScope("user:b-array");
  const key = scopedKey("ag_studio_works_v1");
  const original = JSON.stringify([
    { ...draft, createdAt: "2026-01-01", updatedAt: "Hoje" },
  ]);
  localStorage.setItem(key, original);
  assert.equal(studioStore.getWork(draft.id)?.title, "Original");
  studioStore.updateWork(draft.id, { title: "Novo" });
  assert.equal(localStorage.getItem(`${key}:backup:v2`), original);
  assert.equal(JSON.parse(localStorage.getItem(key)!).version, 3);
});
test("AG-21: conflito conserva ambas as versões e requer aceitação explícita", () => {
  selectScope("user:b-conflict");
  const created = studioStore.createWork(draft);
  const key = scopedKey("ag_studio_works_v1");
  const remote = {
    version: 3,
    revision: "other:1",
    data: [{ ...created, title: "Outra aba" }],
  };
  localStorage.setItem(key, JSON.stringify(remote));
  handleLocalStorageChange(key);
  assert.equal(hasLocalConflict(), true);
  assert.equal(studioStore.getWork(created.id)?.title, "Original");
  studioStore.updateWork(created.id, { title: "Minha edição" });
  assert.equal(
    JSON.parse(localStorage.getItem(key)!).data[0].title,
    "Outra aba",
  );
  assert.ok(JSON.stringify(exportLocal()).includes("Minha edição"));
  acceptRemoteLocal();
  assert.equal(studioStore.getWork(created.id)?.title, "Outra aba");
  assert.ok(
    Object.values(exportLocal().alternatives).some((raw) =>
      raw.includes("Minha edição"),
    ),
  );
});
test("AG-21: snapshots/statísticas estáveis e escrita idêntica não serializa", () => {
  selectScope("user:b-performance");
  const created = studioStore.createWork(draft);
  const first = studioStore.getStats();
  libraryStore.createList("Lista", "");
  assert.equal(studioStore.getStats(), first);
  const before = persistenceMetrics.serializations;
  // The low-level write checks identity by value, preserving exported snapshots.
  const snapshot = studioStore.getWorks();
  assert.ok(created.id && snapshot.length === 1);
  writeLocal("ag_studio_works_v1", snapshot);
  assert.equal(persistenceMetrics.serializations, before);
  assert.equal(studioStore.reorderChapters(created.id, []), false);
});

test("AG-18: Vite e script dev limitados ao loopback", () => {
  const config = readFileSync("vite.config.ts", "utf8");
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.ok(!config.includes("allowedHosts: true"));
  assert.ok(!config.includes("0.0.0.0"));
  assert.ok(pkg.scripts.dev.includes("--host 127.0.0.1"));
});

import {
  validComments,
  validReviews,
  useValidatedItems,
} from "../src/foundation/features/local/items";
test("AG-20: comentários/avaliações malformados não são renderizados nem sobrescritos", () => {
  assert.equal(validComments([{ id: "bad", likes: "many" }]), false);
  assert.equal(validReviews([null]), false);
  const key = "ag_comments_corrupted";
  localStorage.setItem(key, "[null]");
  function Probe() {
    const value = useValidatedItems(key, [], validComments);
    return <p>{value.warning}</p>;
  }
  assert.ok(renderToString(<Probe />).includes("preservados sem sobrescrita"));
  assert.equal(localStorage.getItem(key), "[null]");
});

import { fetchProfileById } from "../src/foundation/features/profile/service";
import { publishProfile } from "../src/foundation/features/profile/cache";
test("AG-13: leitura atrasada não repõe o username anterior ao guardar", async () => {
  let resolve!: (value: unknown) => void;
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            new Promise((done) => {
              resolve = done;
            }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
  const pending = fetchProfileById("late-profile", client);
  publishProfile({
    id: "late-profile",
    username: "novo",
    displayName: "Novo",
    bio: "",
    avatarUrl: null,
    createdAt: "2026-01-01",
  });
  resolve({
    data: {
      id: "late-profile",
      username: "antigo",
      display_name: "Antigo",
      bio: "",
      created_at: "2026-01-01",
    },
    error: null,
  });
  assert.equal((await pending).profile?.username, "novo");
});
