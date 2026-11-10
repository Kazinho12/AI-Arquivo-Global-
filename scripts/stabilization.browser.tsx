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
  flushLocal,
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

const reloadProbe = sessionStorage.getItem("ag-reload-probe");
if (reloadProbe) {
  const probe = JSON.parse(reloadProbe);
  results.push(...probe.results);
  sessionStorage.removeItem("ag-reload-probe");
  await run(
    "AG-02/05/06/08: recarregamento real restaura texto, biblioteca e bytes de imagem",
    async () => {
      selectScope("user:browser-a");
      check(
        studioStore.getWork(work.id)?.title === work.title,
        "Rascunho perdido ao recarregar",
      );
      selectScope("user:browser-reader-manga");
      check(
        libraryStore.getEntry("ag-outra-margem")?.lastReadChapterId === "cap-1",
        "Histórico perdido ao recarregar",
      );
      selectScope("user:browser-image-copy");
      const image = await loadImage(probe.reference);
      check(image?.size === probe.size, "Imagem perdida ao recarregar");
      selectScope("user:browser-b");
      check(!studioStore.getWork(work.id), "Conta B viu A após recarregamento");
    },
  );
} else {
  for (const [path, Page, key, dataA, dataB] of [
    [
      "comentarios",
      CommentsPage,
      "ag_comments_",
      [
        {
          id: "a",
          authorName: "A",
          authorUsername: "a",
          createdAt: "Hoje",
          text: "Só comentário A",
          likes: 0,
        },
      ],
      [
        {
          id: "b",
          authorName: "B",
          authorUsername: "b",
          createdAt: "Hoje",
          text: "Só comentário B",
          likes: 0,
        },
      ],
    ],
    [
      "avaliacoes",
      ReviewsPage,
      "ag_reviews_",
      [
        {
          id: "a",
          reviewerName: "A",
          reviewerHandle: "a",
          createdAt: "Hoje",
          headline: "Só avaliação A",
          body: "Corpo A",
          facets: [],
          recommend: true,
        },
      ],
      [
        {
          id: "b",
          reviewerName: "B",
          reviewerHandle: "b",
          createdAt: "Hoje",
          headline: "Só avaliação B",
          body: "Corpo B",
          facets: [],
          recommend: false,
        },
      ],
    ],
  ] as const)
    await run(`AG-01: ${path} A → B → A sem recarregar`, async () => {
      localStorage.setItem(key + "ag-carta-abertura", JSON.stringify(dataA));
      localStorage.setItem(key + "ag-primeiras-linhas", JSON.stringify(dataB));
      const router = createMemoryRouter(
        [{ path: `/obras/:id/${path}`, element: <Page /> }],
        { initialEntries: [`/obras/ag-carta-abertura/${path}`] },
      );
      await render(<RouterProvider router={router} />);
      await act(async () => {
        await router.navigate(`/obras/ag-primeiras-linhas/${path}`);
      });
      check(
        document.body.textContent?.includes(
          path === "comentarios" ? "Só comentário B" : "Só avaliação B",
        ),
        "Não carregou B",
      );
      check(
        localStorage.getItem(key + "ag-primeiras-linhas") ===
          JSON.stringify(dataB),
        "B foi sobrescrita",
      );
      await act(async () => {
        await router.navigate(`/obras/ag-carta-abertura/${path}`);
      });
      check(
        localStorage.getItem(key + "ag-carta-abertura") ===
          JSON.stringify(dataA),
        "A foi sobrescrita",
      );
    });
  await run(
    "AG-06: AuthProvider troca A → B → logout e remonta área local",
    async () => {
      let callback:
        | ((event: AuthChangeEvent, session: Session | null) => void)
        | undefined;
      const session = (id: string) =>
        ({
          user: { id },
          access_token: "test",
          refresh_token: "test",
          expires_in: 3600,
          token_type: "bearer",
        }) as Session;
      const a = session("browser-a"),
        b = session("browser-b");
      const auth = {
        onAuthStateChange(listener: typeof callback) {
          callback = listener;
          return { data: { subscription: { unsubscribe() {} } } };
        },
        initialize: async () => ({ error: null }),
        signInWithPassword: async () => ({
          data: { session: null, user: null },
          error: { code: "invalid_credentials" },
        }),
        getSession: async () => ({ data: { session: a }, error: null }),
        getUser: async () => ({ data: { user: a.user }, error: null }),
      } as unknown as AuthPort;
      const controller = new AuthController(auth, {
        origin: location.origin,
        href: location.origin,
        replaceUrl() {},
        now: Date.now,
      });
      await controller.start();
      function Probe() {
        const { works } = useStudio();
        return (
          <div data-probe>{works.map((item) => item.title).join("|")}</div>
        );
      }
      await render(
        <AuthProvider controller={controller}>
          <LocalDataBoundary>
            <Probe />
          </LocalDataBoundary>
        </AuthProvider>,
      );
      await act(async () => {
        studioStore.createWork(work);
      });
      check(
        document.querySelector("[data-probe]")?.textContent === work.title,
        "A não foi atualizada",
      );
      await act(async () => {
        callback?.("SIGNED_IN", b);
      });
      check(
        currentScope() === "user:browser-b" &&
          document.querySelector("[data-probe]")?.textContent === "",
        "B viu A",
      );
      await act(async () => {
        callback?.("SIGNED_OUT", null);
      });
      check(
        currentScope() === "guest" &&
          !document
            .querySelector("[data-probe]")
            ?.textContent?.includes(work.title),
        "Visitante viu A",
      );
      await act(async () => {
        callback?.("SIGNED_IN", a);
      });
      check(
        document.querySelector("[data-probe]")?.textContent === work.title,
        "A perdeu o rascunho",
      );
      await act(async () => {
        callback?.("SIGNED_OUT", null);
      });
      await act(async () => {
        await controller.signIn("teste@example.test", "Password1");
      });
      check(
        controller.getSnapshot().status === "operational-error" &&
          document.querySelector("[data-probe]"),
        "Erro Auth ocultou a aplicação e impediu nova tentativa",
      );
      check(
        currentScope() === "guest",
        "Erro Auth recuperou dados de outra conta",
      );
      controller.stop();
    },
  );
  for (const fault of ["QuotaExceededError", "SecurityError"])
    await run(`AG-02: ${fault}, aviso, edição e exportação`, async () => {
      selectScope(`user:browser-${fault}`);
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = () => {
        throw new DOMException("blocked", fault);
      };
      try {
        studioStore.createWork(work);
        studioStore.updateChapter(work.id, "cap-1", {
          content: "Texto não persistido",
        });
        flushLocal();
        await render(<LocalDataTools />);
        check(
          document
            .querySelector('[role="alert"]')
            ?.textContent?.includes("memória"),
          "Aviso ausente",
        );
        check(
          JSON.stringify(exportLocal()).includes("Texto não persistido"),
          "Exportação perdeu texto",
        );
        check(localWarnings().length > 0, "Falha foi ocultada");
      } finally {
        Storage.prototype.setItem = original;
      }
    });
  await run(
    "AG-06: confirmação explícita recupera legado sem o apagar",
    async () => {
      selectScope("user:browser-recovery");
      localStorage.setItem(
        "ag_studio_works_v1",
        JSON.stringify([
          { ...work, createdAt: "2026-01-01", updatedAt: "Hoje" },
        ]),
      );
      const before = legacySnapshot();
      await render(
        <MemoryRouter>
          <LocalDataTools />
        </MemoryRouter>,
      );
      const button = [...document.querySelectorAll("button")].find(
        (item) => item.textContent === "Recuperar dados antigos",
      )!;
      await act(async () => {
        button.click();
      });
      const confirm = [...document.querySelectorAll("button")].find(
        (item) => item.textContent === "Importar neste espaço",
      )!;
      check(
        confirm.disabled && !studioStore.getWork(work.id),
        "Importação automática",
      );
      await act(async () => {
        (
          document.querySelector(
            'dialog input[type="checkbox"]',
          ) as HTMLInputElement
        ).click();
      });
      await act(async () => {
        confirm.click();
        await pause(50);
      });
      check(studioStore.getWork(work.id), "Não recuperou rascunho");
      check(
        JSON.stringify(before) === JSON.stringify(legacySnapshot()),
        "Legado alterado",
      );
    },
  );
  for (const [id, segment, Page, mode] of [
    ["ag-carta-abertura", "capitulos", LiteraryReaderPage, "prose"],
    ["ag-primeiras-linhas", "capitulos", LiteraryReaderPage, "poetry"],
    ["ag-tres-gestos", "paginas", VisualReaderPage, "comic"],
    ["ag-outra-margem", "paginas", VisualReaderPage, "manga"],
  ] as const)
    await run(
      `AG-05: leitor ${mode}, histórico, conclusão e retoma`,
      async () => {
        selectScope(`user:browser-reader-${mode}`);
        const router = createMemoryRouter(
          [{ path: `/obras/:id/${segment}/:capituloId`, element: <Page /> }],
          { initialEntries: [`/obras/${id}/${segment}/cap-1`] },
        );
        await render(<RouterProvider router={router} />);
        check(
          libraryStore.getEntry(id)?.status === "reading",
          "Leitura não registada",
        );
        if (segment === "paginas") {
          const next = document.querySelector(
            '[aria-label="Próxima página"]',
          ) as HTMLButtonElement;
          if (next && !next.disabled)
            await act(async () => {
              next.click();
            });
        }
        const complete = [...document.querySelectorAll("button")].find(
          (button) => button.textContent?.startsWith("Marcar "),
        )!;
        await act(async () => {
          complete.click();
        });
        check(
          (libraryStore.getEntry(id)?.progress ?? 0) > 0,
          "Conclusão da unidade não registada",
        );
        const storedRaw = JSON.parse(
          localStorage.getItem(scopedKey("ag_library_entries_v1"))!,
        );
        check(
          (storedRaw.data ?? storedRaw).length === 1 &&
            (storedRaw.data ?? storedRaw)[0].lastReadChapterId === "cap-1",
          "Histórico duplicado/posição perdida",
        );
      },
    );
  await run(
    "AG-08: IndexedDB persistente, bytes, isolamento e object URL",
    async () => {
      selectScope("user:browser-image");
      const png = await (await fetch("/favicon.png")).blob();
      const saved = await storeImage(png);
      check(
        saved.persisted && saved.reference.startsWith("local-image:"),
        "Imagem não persistida",
      );
      const exported = await exportImages();
      const id = saved.reference.slice("local-image:".length);
      sessionStorage.setItem(
        "ag-image-probe",
        JSON.stringify({ reference: saved.reference, size: png.size }),
      );
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("arquivo-global-local-v2", 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const record = await new Promise<{ blob: Blob }>((resolve, reject) => {
        const request = database
          .transaction("images")
          .objectStore("images")
          .get(`user:browser-image/${id}`);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      database.close();
      check(record.blob.size === png.size, "Bytes ausentes no IndexedDB");
      selectScope("user:browser-image-copy");
      check(
        !(await loadImage(saved.reference)),
        "Conta diferente viu a imagem",
      );
      await importImages(exported, currentScope());
      await render(
        <LocalImage src={saved.reference} alt="Imagem persistente" />,
      );
      await act(async () => {
        await pause(100);
      });
      const img = document.querySelector("#fixture img") as HTMLImageElement;
      check(
        img?.src.startsWith("blob:"),
        "Não resolveu referência persistente",
      );
      const url = img.src;
      await act(async () => root.unmount());
      root = createRoot(document.getElementById("fixture")!);
      let revoked = false;
      try {
        await fetch(url);
      } catch {
        revoked = true;
      }
      check(revoked, "URL não revogado");
    },
  );
  await run(
    "AG-08: quota IndexedDB conserva imagem exportável sem referência blob durável",
    async () => {
      selectScope("user:browser-image-quota");
      const png = await (await fetch("/favicon.png")).blob();
      const original = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = () => {
        throw new DOMException("Quota", "QuotaExceededError");
      };
      try {
        const saved = await storeImage(png);
        check(!saved.persisted, "Falha de quota não foi detetada");
        check(
          (await loadImage(saved.reference))?.size === png.size,
          "Imagem em memória perdida",
        );
        check(
          (await exportImages()).length === 1,
          "Imagem não incluída na exportação",
        );
        studioStore.addMediaItem({
          name: "quota.png",
          type: "illustration",
          url: saved.reference,
          size: "1 KB",
          dimensions: "Teste",
        });
        check(
          !localStorage
            .getItem(scopedKey("ag_studio_media_v1"))
            ?.includes("blob:"),
          "Blob URL persistido",
        );
      } finally {
        IDBObjectStore.prototype.put = original;
      }
    },
  );
  await run("AG-07: privacidade descreve limites locais", async () => {
    await render(<SettingsPrivacyPage />);
    check(
      document.body.textContent?.includes(
        "Não são sincronizados entre dispositivos",
      ),
      "Limite de sincronização ausente",
    );
    check(
      !document.body.textContent?.includes("estritamente privados"),
      "Garantia antiga presente",
    );
  });
  const imageProbe = JSON.parse(
    sessionStorage.getItem("ag-image-probe") ?? "{}",
  );
  sessionStorage.setItem(
    "ag-reload-probe",
    JSON.stringify({ ...imageProbe, results }),
  );
  flushLocal();
  location.reload();
  await new Promise(() => {});
}
await act(async () => root.unmount());
document.getElementById("results")!.textContent = JSON.stringify(results);
document.documentElement.dataset.tests = results.every((result) => result.ok)
  ? "passed"
  : "failed";
