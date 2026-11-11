import React, { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient, type User } from "@supabase/supabase-js";
import { AuthProvider } from "../src/foundation/features/auth/AuthProvider";
import {
  initialAuthState,
  type AuthController,
  type AuthState,
} from "../src/foundation/features/auth/controller";
import { AvatarEditor } from "../src/foundation/features/profile/AvatarEditor";
import { avatarApiBase } from "../src/foundation/features/profile/avatar";
import { fetchProfileById } from "../src/foundation/features/profile/service";
import type { UserProfile } from "../src/foundation/features/profile/types";
import "../src/foundation/styles/global.css";
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const id = "10000000-0000-0000-0000-000000000001",
  other = "10000000-0000-0000-0000-000000000002";
let auth: AuthState = {
  ...initialAuthState,
  status: "authenticated",
  user: { id } as User,
};
const listeners = new Set<() => void>();
const controller = {
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => auth,
  start: async () => {},
  stop: () => {},
} as unknown as AuthController;
const switchUser = (userId: string | null) => {
  auth = {
    ...initialAuthState,
    status: userId ? "authenticated" : "unauthenticated",
    user: userId ? ({ id: userId } as User) : null,
  };
  listeners.forEach((l) => l());
};
const initial: UserProfile = {
  id,
  username: "autora",
  displayName: "Autora Teste",
  bio: "Bio",
  avatarUrl: null,
  createdAt: "2026-11-11",
};
let stored: UserProfile = { ...initial },
  rejectUpload = false,
  rejectMetadata = false,
  rejectRead = false,
  nextId = 0,
  posts = 0,
  patches = 0;
const files = new Map<string, Blob>(),
  calls: { url: string; method: string }[] = [];
function check(value: unknown, message: string): asserts value {
  if (!value) throw Error(message);
}
const client = createClient("https://fixture.invalid", "public-test-key", {
  auth: { persistSession: false, autoRefreshToken: false },
  global: {
    fetch: async (input, init) => {
      const url = new URL(String(input));
      if (init?.method === "PATCH") {
        patches++;
        check(auth.user?.id === id, "Metadados sem dono");
        check(
          new Headers(init.headers).get("Authorization") ===
            "Bearer avatar-test-token",
          "Metadados sem token atual",
        );
        if (rejectMetadata)
          return Response.json(
            { code: "42501", message: "denied" },
            { status: 403 },
          );
        const old = url.searchParams.get("avatar_url");
        if (old)
          check(
            old === (stored.avatarUrl ? "eq." + stored.avatarUrl : "is.null"),
            "Substituição sem verificar referência anterior",
          );
        stored = {
          ...stored,
          avatarUrl: JSON.parse(String(init.body)).avatar_url,
        };
      }
      return Response.json({
        id,
        username: stored.username,
        display_name: stored.displayName,
        bio: stored.bio,
        avatar_url: stored.avatarUrl,
        created_at: stored.createdAt,
      });
    },
  },
});
client.auth.getSession = async () => ({
  data: {
    session: auth.user
      ? ({ access_token: "avatar-test-token", user: auth.user } as any)
      : null,
  },
  error: null,
});
client.auth.getUser = async () => ({ data: { user: auth.user! }, error: null });
const nativeFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  if (!String(input).startsWith(avatarApiBase)) return nativeFetch(input, init);
  const url = new URL(String(input));
  calls.push({ url: String(input), method: init.method ?? "GET" });
  check(
    new Headers(init.headers).get("Authorization") ===
      "Bearer avatar-test-token",
    "Worker sem token",
  );
  check(!url.search, "Token no URL");
  if (init.method === "POST") {
    posts++;
    if (rejectUpload)
      return Response.json({ error: "Permission denied" }, { status: 403 });
    check(
      init.body instanceof Blob && !(init.body instanceof FormData),
      "Upload não enviou bytes diretos",
    );
    check(
      new Headers(init.headers).get("Content-Type") === "image/png",
      "MIME errado",
    );
    const key = `avatars/${id}/photo-${++nextId}.png`;
    files.set(key, init.body);
    return Response.json({ key });
  }
  check(init.method !== "DELETE", "Apagou ficheiro antigo");
  const key = url.pathname.replace(/^\/media\/avatar\//, "avatars/");
  return rejectRead
    ? Response.json({ error: "Unavailable" }, { status: 503 })
    : files.has(key)
      ? new Response(files.get(key), {
          headers: { "Content-Type": "image/png" },
        })
      : Response.json({ error: "Not found" }, { status: 404 });
};
const fixture = document.getElementById("fixture")!,
  root = createRoot(fixture);
const pause = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(test: () => unknown, message: string) {
  for (let i = 0; i < 500; i++) {
    if (test()) return;
    await act(async () => pause());
  }
  throw Error(message + ": " + fixture.textContent?.slice(0, 400));
}
function Harness({ profile }: { profile: UserProfile }) {
  const [current, setCurrent] = useState(profile);
  return (
    <AvatarEditor profile={current} onChange={setCurrent} client={client} />
  );
}
async function mount() {
  await act(async () => root.render(null));
  const res = await fetchProfileById(id, client);
  check(res.profile, "Perfil não carregou");
  await act(async () => {
    root.render(
      <React.StrictMode>
        <AuthProvider controller={controller}>
          <Harness profile={res.profile!} />
        </AuthProvider>
      </React.StrictMode>,
    );
    await pause();
  });
}
async function click(label: string) {
  const scope = fixture.querySelector("dialog[open]") ?? fixture;
  const button = [...scope.querySelectorAll<HTMLButtonElement>("button")].find(
    (el) => el.textContent?.trim() === label,
  );
  check(button, "Botão ausente: " + label);
  await act(async () => {
    button.click();
    await pause();
  });
}
async function select() {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#28465a";
  ctx.fillRect(0, 0, 16, 16);
  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((blob) => resolve(blob!), "image/png"),
  );
  const transfer = new DataTransfer();
  transfer.items.add(new File([blob], "avatar.png", { type: "image/png" }));
  const input = fixture.querySelector<HTMLInputElement>('input[type="file"]')!;
  await act(async () => {
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await pause();
  });
  await waitFor(
    () => fixture.querySelector('img[alt^="Pré-visualização"]'),
    "Sem pré-visualização",
  );
}
const results: { name: string; ok: boolean; error?: string }[] = [];
async function run(name: string, task: () => Promise<void>) {
  try {
    await task();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error: String(error) });
  } finally {
    rejectUpload = false;
    rejectMetadata = false;
    rejectRead = false;
    await act(async () => root.render(null));
  }
}
await run(
  "Avatar: select enables save; raw Worker POST + private GET + profile persistence survive reload",
  async () => {
    await mount();
    check(
      fixture.querySelector<HTMLButtonElement>(".actions button")?.disabled,
      "Guardar ativado sem imagem",
    );
    await select();
    check(posts === 0, "Seleção fez upload automático");
    await click("Guardar fotografia");
    await waitFor(
      () => fixture.textContent?.includes("Fotografia guardada na tua conta."),
      "Sem confirmação real",
    );
    check(stored.avatarUrl?.startsWith("avatars/"), "Não guardou chave");
    await mount();
    await waitFor(
      () =>
        fixture
          .querySelector('img[alt^="Fotografia"]')
          ?.getAttribute("src")
          ?.startsWith("blob:"),
      "Recarga não recuperou imagem privada",
    );
    check(
      !fixture.querySelector('img[src^="https://arquivo-global-api"]'),
      "Usou URL privada como imagem pública",
    );
  },
);
await run(
  "Avatar: Worker/metadata failures keep previous reference and replacement never deletes the old object",
  async () => {
    const old = stored.avatarUrl!;
    await mount();
    await select();
    rejectUpload = true;
    await click("Guardar fotografia");
    await waitFor(
      () =>
        fixture.querySelector('[role="alert"]')?.textContent?.includes("403"),
      "Erro Worker invisível",
    );
    check(stored.avatarUrl === old, "Falha trocou referência");
    rejectUpload = false;
    rejectMetadata = true;
    await click("Guardar fotografia");
    await waitFor(
      () =>
        fixture
          .querySelector('[role="alert"]')
          ?.textContent?.includes("metadados"),
      "Erro de gravação invisível",
    );
    check(stored.avatarUrl === old, "Metadados falhados trocaram referência");
    rejectMetadata = false;
    await click("Guardar fotografia");
    await waitFor(() => stored.avatarUrl !== old, "Não substituiu");
    check(files.has(old), "Imagem antiga apagada");
    check(!calls.some((c) => c.method === "DELETE"), "DELETE inesperado");
  },
);
await run(
  "Avatar: logout and another account remove the Blob image and do not fetch the owner's photo",
  async () => {
    await mount();
    await waitFor(
      () => fixture.querySelector('img[src^="blob:"]'),
      "Sem fotografia",
    );
    const count = calls.length;
    await act(async () => {
      switchUser(null);
      await pause();
    });
    check(!fixture.querySelector("img"), "Logout manteve imagem");
    await act(async () => {
      switchUser(other);
      await pause();
    });
    check(!fixture.querySelector("img"), "Outra conta viu fotografia");
    check(calls.length === count, "Outra conta pediu imagem alheia");
    await act(async () => switchUser(id));
  },
);
await run(
  "Avatar: failed private GET shows an error with initials; removal needs explicit confirmation",
  async () => {
    rejectRead = true;
    await mount();
    await waitFor(
      () =>
        fixture.querySelector('[role="alert"]')?.textContent?.includes("503"),
      "Erro GET invisível",
    );
    check(fixture.querySelector(".profile-avatar-monogram"), "Sem fallback");
    rejectRead = false;
    await mount();
    const before = patches;
    await click("Remover fotografia");
    await click("Cancelar");
    check(patches === before, "Cancelar removeu fotografia");
    await click("Remover fotografia");
    await click("Confirmar remoção");
    await waitFor(() => stored.avatarUrl === null, "Remoção não persistiu");
    check(
      fixture.querySelector(".profile-avatar-monogram"),
      "Remoção sem iniciais",
    );
  },
);
window.fetch = nativeFetch;
document.getElementById("results")!.textContent = JSON.stringify(results);
document.documentElement.dataset.tests = results.every((r) => r.ok)
  ? "passed"
  : "failed";
