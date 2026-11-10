import {
  flushLocal,
  persistenceMetrics,
  handleLocalStorageChange,
  hasLocalConflict,
  acceptRemoteLocal,
  recoverLocalCopy,
  writeLocal,
} from "../src/foundation/features/local/persistence";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { Providers } from "../src/foundation/app/providers";
import { InlineContent } from "../src/foundation/features/reader/content";
import { SettingsOverviewPage } from "../src/foundation/pages/Settings";
import { publishProfile } from "../src/foundation/features/profile/cache";
import { saveUserProfile } from "../src/foundation/features/profile/service";
import type { SupabaseClient } from "@supabase/supabase-js";
import "../src/foundation/styles/global.css";
import {
  PreferenceEffects,
  preferenceKey,
  initializePreferences,
  updateReadingPreferences,
  updateAccessibility,
  usePreferences,
  preferenceSnapshot,
} from "../src/foundation/features/preferences/store";
import {
  SettingsReadingPage,
  SettingsAccessibilityPage,
} from "../src/foundation/pages/Settings";
import { ProseReader } from "../src/foundation/features/reader/ProseReader";
import { PoetryReader } from "../src/foundation/features/reader/PoetryReader";
import { ComicReader } from "../src/foundation/features/reader/ComicReader";
import { MangaReader } from "../src/foundation/features/reader/MangaReader";
import { demoReadingLibrary } from "../src/foundation/features/reader/data";
import { ListsPage } from "../src/foundation/pages/Library";
import { VisualSequencer } from "../src/foundation/features/studio/VisualSequencer";
declare global {
  interface Window {
    peerResult: unknown;
    testDriver: (payload: string) => void;
  }
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
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import {
  createMemoryRouter,
  RouterProvider,
  MemoryRouter,
} from "react-router-dom";
import {
  CommentsPage,
  ReviewsPage,
  LiteraryReaderPage,
  VisualReaderPage,
} from "../src/foundation/pages/Reader";
import { AuthProvider } from "../src/foundation/features/auth/AuthProvider";
import {
  AuthController,
  type AuthPort,
} from "../src/foundation/features/auth/controller";
import { LocalDataBoundary } from "../src/foundation/features/local/LocalDataBoundary";
import {
  currentScope,
  selectScope,
  scopedKey,
  exportLocal,
  localWarnings,
  importLocal,
  legacySnapshot,
} from "../src/foundation/features/local/persistence";
import {
  studioStore,
  useStudio,
} from "../src/foundation/features/studio/store";
import { libraryStore } from "../src/foundation/features/library/store";
import {
  storeImage,
  loadImage,
  exportImages,
  importImages,
  LocalImage,
} from "../src/foundation/features/local/images";
import { SettingsPrivacyPage } from "../src/foundation/pages/Settings";
import { LocalDataTools } from "../src/foundation/features/local/LocalDataTools";
import { HybridProseEditor } from "../src/foundation/features/studio/HybridProseEditor";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const results: { name: string; ok: boolean; error?: string }[] = [];
let root = createRoot(document.getElementById("fixture")!);
const check = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};
const pause = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));
async function run(name: string, action: () => Promise<void>) {
  try {
    await action();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error: String(error) });
  } finally {
    await act(async () => {
      root.unmount();
    });
    root = createRoot(document.getElementById("fixture")!);
  }
}
const render = async (node: React.ReactNode) => {
  await act(async () => {
    root.render(node);
    await pause();
  });
};
const work = {
  id: "browser-draft",
  title: "Rascunho A",
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
  chapters: [
    { id: "cap-1", title: "Capítulo", number: 1, content: "Original" },
  ],
};

await run(
  "AG-09: migra legado, sincroniza definições e quatro leitores",
  async () => {
    localStorage.setItem("ag_reading_font_size", "medium");
    localStorage.setItem(
      "ag_reader_prose_prefs",
      JSON.stringify({ fontSize: "large" }),
    );
    initializePreferences();
    const data = Object.values(demoReadingLibrary);
    await render(
      <MemoryRouter>
        <SettingsReadingPage />
        {[ProseReader, PoetryReader, ComicReader, MangaReader].map(
          (Reader, index) => (
            <Reader
              key={index}
              workId={data[index].workId}
              workTitle={data[index].title}
              author={data[index].author}
              chapters={data[index].chapters}
              currentChapter={data[index].chapters[0]}
            />
          ),
        )}
      </MemoryRouter>,
    );
    const large = [...document.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("Grande"),
    )!;
    await act(async () => large.click());
    check(
      document.querySelector(".chapter-body")?.className.includes("text-xl"),
      "Prosa não sincronizou",
    );
    check(
      document
        .querySelector(".poetry-stanzas-container")
        ?.className.includes("text-2xl"),
      "Poesia não sincronizou",
    );
    check(
      document.querySelectorAll('[data-reading-size="large"]').length === 2,
      "Leitores visuais não sincronizaram",
    );
    check(
      localStorage.getItem("ag_reading_font_size") === "medium",
      "Legado foi alterado",
    );
    await act(async () =>
      updateReadingPreferences({ fontSize: "small" }, "prose"),
    );
    check(
      document.querySelector(".chapter-body")?.className.includes("text-sm"),
      "Override não aplicado",
    );
  },
);
await run(
  "AG-10: contraste claro/escuro, movimento e preferência do sistema",
  async () => {
    await render(
      <>
        <PreferenceEffects />
        <SettingsAccessibilityPage />
        <button className="button">Teste</button>
      </>,
    );
    await act(async () =>
      updateAccessibility({ highContrast: true, reducedMotion: true }),
    );
    check(
      document.documentElement.classList.contains("high-contrast"),
      "Classe de contraste ausente",
    );
    document.documentElement.dataset.theme = "light";
    check(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--bg")
        .trim() === "#fff",
      "Contraste claro sem regra",
    );
    document.documentElement.dataset.theme = "dark";
    check(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--bg")
        .trim() === "#000",
      "Contraste escuro sem regra",
    );
    check(
      getComputedStyle(document.querySelector("button")!)
        .transitionDuration.split(",")
        .every((value) => parseFloat(value) <= 0.00001),
      "Transições continuam ativas",
    );
    await act(async () => {
      updateAccessibility({ reducedMotion: null });
      await drive({
        kind: "media",
        features: [{ name: "prefers-reduced-motion", value: "reduce" }],
      });
      await pause(30);
    });
    check(
      document.documentElement.classList.contains("prefers-reduced-motion"),
      "Sistema não respeitado",
    );
  },
);
await run(
  "AG-17: diálogo nativo contém Tab, fecha com Escape e devolve foco",
  async () => {
    selectScope("user:b-dialog");
    await render(
      <MemoryRouter>
        <ListsPage />
      </MemoryRouter>,
    );
    const opener = [...document.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("Nova lista"),
    )!;
    opener.focus();
    await act(async () => {
      await drive({ kind: "key", key: "Enter" });
      await pause();
    });
    const dialog = document.querySelector("dialog[open]")!;
    check(
      dialog && dialog.contains(document.activeElement),
      "Foco não entrou no diálogo",
    );
    for (let index = 0; index < 8; index++) {
      await act(async () => drive({ kind: "key", key: "Tab" }));
      check(dialog.contains(document.activeElement), "Tab escapou do diálogo");
    }
    await act(async () => {
      await drive({ kind: "key", key: "Escape" });
      await pause();
    });
    check(
      !document.querySelector("dialog[open]") &&
        document.activeElement === opener,
      "Escape/retorno de foco falhou",
    );
  },
);
await run("AG-17: miniatura do sequenciador responde ao teclado", async () => {
  selectScope("guest");
  const visual = studioStore.getWork("cidade-entre-linhas")!;
  await render(
    <MemoryRouter>
      <VisualSequencer
        work={visual}
        currentChapter={visual.chapters[0]}
        onAddPage={() => {}}
        onUpdatePage={() => {}}
        onReorderPages={() => {}}
        onDeletePage={() => {}}
        onSelectChapter={() => {}}
      />
    </MemoryRouter>,
  );
  const buttons = document.querySelectorAll<HTMLButtonElement>(
    '[aria-label^="Selecionar prancha"]',
  );
  check(buttons.length > 1, "Sem miniaturas");
  buttons[1].focus();
  await act(async () => drive({ kind: "key", key: "Enter" }));
  check(
    buttons[1].getAttribute("aria-pressed") === "true",
    "Enter não selecionou a prancha",
  );
  check(document.querySelectorAll("main main").length === 0, "Main aninhado");
});
await run(
  "AG-13: definições seguem perfil atualizado sem alterar sessão Auth",
  async () => {
    const user = {
      id: "profile-canonical",
      email: "demo@example.test",
      user_metadata: { username: "metadata_antiga" },
    };
    const session = {
      user,
      access_token: "test",
      refresh_token: "test",
      expires_in: 3600,
      token_type: "bearer",
    } as unknown as Session;
    const auth = {
      initialize: async () => ({ error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe() {} } },
      }),
      getSession: async () => ({ data: { session }, error: null }),
      getUser: async () => ({ data: { user }, error: null }),
    } as unknown as AuthPort;
    const controller = new AuthController(auth, {
      origin: location.origin,
      href: location.origin,
      replaceUrl() {},
      now: Date.now,
    });
    await controller.start();
    publishProfile({
      id: user.id,
      username: "perfil_antigo",
      displayName: "Nome canónico",
      bio: "",
      avatarUrl: null,
      createdAt: "2026-01-01",
    });
    await render(
      <MemoryRouter>
        <AuthProvider controller={controller}>
          <SettingsOverviewPage />
        </AuthProvider>
      </MemoryRouter>,
    );
    const client = {
      from() {
        return {
          upsert() {
            return {
              select() {
                return {
                  single: async () => ({
                    data: {
                      id: user.id,
                      username: "perfil_novo",
                      display_name: "Nome novo",
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
    await act(async () => {
      await saveUserProfile(
        user.id,
        { username: "PERFIL_NOVO", displayName: "Nome novo", bio: "" },
        client,
      );
    });
    check(
      document.querySelector('a[href="/utilizadores/perfil_novo"]'),
      "Link ficou na metadata antiga",
    );
    check(
      document.body.textContent?.includes("Nome novo"),
      "Nome canónico não atualizou",
    );
    check(controller.getSnapshot().user?.id === user.id, "Sessão alterada");
    controller.stop();
  },
);
await run(
  "AG-15: navegação rejeita obra, capítulo e leitor incompatíveis",
  async () => {
    selectScope("user:b-invalid-routes");
    const router = createMemoryRouter(
      [
        {
          path: "/obras/:id/capitulos/:capituloId",
          element: <LiteraryReaderPage />,
        },
        {
          path: "/obras/:id/paginas/:capituloId",
          element: <VisualReaderPage />,
        },
      ],
      { initialEntries: ["/obras/unknown/capitulos/cap-1"] },
    );
    await render(<RouterProvider router={router} />);
    for (const path of [
      "/obras/unknown/capitulos/cap-1",
      "/obras/atlas-das-mares/capitulos/missing",
      "/obras/cidade-entre-linhas/capitulos/cap-1",
      "/obras/atlas-das-mares/paginas/cap-1",
    ]) {
      await act(async () => {
        await router.navigate(path);
      });
      check(
        document.body.textContent?.includes("404"),
        "Rota inválida abriu conteúdo: " + path,
      );
    }
    check(
      libraryStore.getEntries().length === 0,
      "Leitor inválido escreveu no histórico",
    );
    await act(async () => {
      await router.navigate("/obras/atlas-das-mares/capitulos/cap-1");
    });
    check(
      document.querySelector(".chapter-title"),
      "Rota válida deixou de funcionar",
    );
  },
);
await run(
  "AG-16: edição e pré-visualização interpretam marcação sem executar HTML",
  async () => {
    selectScope("user:b-content");
    const created = studioStore.createWork({ ...work, id: "b-content" });
    studioStore.updateChapter(created.id, "cap-1", {
      content:
        '**Seguro** e *itálico* e <u>linha</u>\n\n<img src=x onerror="window.bad=1">',
    });
    const edited = studioStore.getWork(created.id)!;
    await render(
      <MemoryRouter>
        <ProseReader
          workId={edited.id}
          workTitle={edited.title}
          author="Autor"
          chapters={edited.chapters}
          currentChapter={edited.chapters[0]}
        />
      </MemoryRouter>,
    );
    check(
      document.querySelector(".chapter-body strong")?.textContent === "Seguro",
      "Marcação literal",
    );
    check(
      !document.querySelector(".chapter-body img"),
      "HTML arbitrário inserido",
    );
    check(
      document.querySelector(".chapter-body u")?.textContent === "linha",
      "Sublinhado ausente",
    );
  },
);
await run("AG-19: SSR e hidratação dos providers sem divergência", async () => {
  const container = document.createElement("div");
  document.body.append(container);
  container.innerHTML = renderToString(
    <Providers>
      <p>Conteúdo hidratado</p>
    </Providers>,
  );
  const errors: unknown[] = [];
  let hydrated: ReturnType<typeof hydrateRoot>;
  await act(async () => {
    hydrated = hydrateRoot(
      container,
      <Providers>
        <p>Conteúdo hidratado</p>
      </Providers>,
      { onRecoverableError: (error) => errors.push(error) },
    );
    await pause(50);
  });
  check(errors.length === 0, "Hidratação divergente");
  check(
    container.textContent?.includes("Conteúdo hidratado"),
    "Provider não recuperou após hidratação",
  );
  await act(async () => hydrated!.unmount());
  container.remove();
});
await run(
  "AG-20: dados inválidos e versões futuras são preservados",
  async () => {
    selectScope("user:b-future-schema");
    const key = scopedKey("ag_studio_works_v1");
    const original = JSON.stringify({ version: 999, data: [{ id: "future" }] });
    localStorage.setItem(key, original);
    await render(<LocalDataTools />);
    await act(async () => {
      studioStore.createWork({ ...work, id: "memory" });
      flushLocal();
    });
    check(
      localStorage.getItem(key) === original &&
        JSON.stringify(exportLocal()).includes("memory"),
      "Corrupção sobrescrita ou edição perdida",
    );
    check(document.querySelector('[role="alert"]'), "Sem aviso de corrupção");
  },
);
await run(
  "AG-21: edições agrupadas e snapshots sem recálculo global",
  async () => {
    selectScope("user:b-batch");
    studioStore.createWork({ ...work, id: "batch" });
    flushLocal();
    const before = persistenceMetrics.serializations;
    for (let index = 0; index < 20; index++)
      studioStore.updateChapter("batch", "cap-1", {
        content: `Edição ${index}`,
      });
    check(persistenceMetrics.serializations === before, "Serializou por tecla");
    const stats = studioStore.getStats();
    libraryStore.createList("Outra coleção", "");
    check(
      studioStore.getStats() === stats,
      "Recalculou estatísticas sem alteração de obras",
    );
    flushLocal();
    check(
      persistenceMetrics.serializations === before + 2,
      "Não agrupou edições (obras + lista)",
    );
    check(
      JSON.parse(localStorage.getItem(scopedKey("ag_studio_works_v1"))!).data[0]
        .chapters[0].content === "Edição 19",
      "Última edição perdida",
    );
  },
);
await run(
  "AG-21: duas abas reais sincronizam e conservam conflitos por conta",
  async () => {
    selectScope("user:b-two-tabs");
    studioStore.createWork({ ...work, id: "shared", title: "A1" });
    flushLocal();
    await drive({
      kind: "peer",
      payload: { scope: "user:b-two-tabs", action: "read" },
    });
    check(
      (window.peerResult as { works: { title: string }[] }).works[0].title ===
        "A1",
      "Outra aba não leu os dados",
    );
    studioStore.updateWork("shared", { title: "A2" });
    flushLocal();
    for (let attempt = 0; attempt < 30; attempt++) {
      await drive({
        kind: "peer",
        payload: { scope: "user:b-two-tabs", action: "read" },
      });
      if (
        (window.peerResult as { works: { title: string }[] }).works[0]
          ?.title === "A2"
      )
        break;
      await pause(100);
    }
    check(
      (
        window.peerResult as {
          works: { title: string }[];
          storageEvents: number;
        }
      ).works[0].title === "A2" &&
        (window.peerResult as { storageEvents: number }).storageEvents > 0,
      "Storage event não sincronizou aba sem edições: " +
        JSON.stringify(window.peerResult),
    );
    await drive({
      kind: "peer",
      payload: {
        scope: "user:b-two-tabs",
        action: "edit",
        id: "shared",
        title: "B1",
      },
    });
    await pause(100);
    await render(<LocalDataTools />);
    check(
      hasLocalConflict() && studioStore.getWork("shared")?.title === "A2",
      "Conflito sobrescreveu a edição local",
    );
    const copies = exportLocal().alternatives;
    check(
      Object.values(copies).some((raw) => raw.includes("A2")),
      "Versão local não foi conservada",
    );
    await act(async () => acceptRemoteLocal());
    check(
      studioStore.getWork("shared")?.title === "B1",
      "Aceitação explícita não carregou outra aba",
    );
    await drive({
      kind: "peer",
      payload: { scope: "user:b-different-account", action: "read" },
    });
    check(
      (window.peerResult as { works: unknown[] }).works.length === 0,
      "Outra conta viu o rascunho",
    );
  },
);
await run(
  "AG-09/20: preferências de versão futura conservadas sem sobrescrita",
  async () => {
    const original = localStorage.getItem(preferenceKey)!;
    const future = JSON.stringify({
      version: 999,
      global: { fontSize: "wrong" },
    });
    await act(async () => {
      localStorage.setItem(preferenceKey, future);
      window.dispatchEvent(new StorageEvent("storage", { key: preferenceKey }));
    });
    await render(<SettingsReadingPage />);
    await act(async () => updateReadingPreferences({ fontSize: "large" }));
    check(
      localStorage.getItem(preferenceKey) === future,
      "Versão futura foi sobrescrita",
    );
    check(
      document.querySelector('[role="alert"]'),
      "Sem aviso de preferências inválidas",
    );
    await act(async () => {
      localStorage.setItem(preferenceKey, original);
      window.dispatchEvent(new StorageEvent("storage", { key: preferenceKey }));
    });
  },
);
// ADDITIONAL_BLOCKS
await act(async () => root.unmount());
document.getElementById("results")!.textContent = JSON.stringify(results);
document.documentElement.dataset.tests = results.every((result) => result.ok)
  ? "passed"
  : "failed";
