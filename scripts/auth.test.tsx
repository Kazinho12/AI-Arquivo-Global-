import test from "node:test";
import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { ApplicationRoutes } from "../src/foundation/app/App";
import {
  AuthController,
  type AuthPort,
  type AuthEnvironment,
} from "../src/foundation/features/auth/controller";
import { AuthProvider } from "../src/foundation/features/auth/AuthProvider";
import { authClientOptions } from "../src/foundation/features/auth/client";
import { readAuthConfig } from "../src/foundation/features/auth/config";
import {
  authErrorMessage,
  callbackUrl,
  readCallback,
  safeDestination,
  scrubCallbackUrl,
  validateConfirmation,
  validateEmail,
  validatePassword,
} from "../src/foundation/features/auth/security";
const user: User = {
  id: "mock-user",
  aud: "authenticated",
  email: "reader@example.test",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-01-01T00:00:00Z",
  email_confirmed_at: "2026-01-01T00:00:00Z",
};
const session: Session = {
  access_token: "mock-access",
  refresh_token: "mock-refresh",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user,
};
function fixture(
  href = "http://localhost:3000/entrar",
  initial: Session | null = null,
) {
  let persisted = initial;
  const listeners = new Set<
    (event: AuthChangeEvent, session: Session | null) => void
  >();
  const urls: string[] = [];
  let time = 100000;
  const emit = (event: AuthChangeEvent, next: Session | null) => {
    persisted = next;
    for (const fn of listeners) fn(event, next);
  };
  const counts = {
    login: 0,
    signup: 0,
    exchange: 0,
    verify: 0,
    recover: 0,
    update: 0,
    resend: 0,
  };
  const auth = {
    initialize: async () => ({ error: null }),
    getSession: async () => ({ data: { session: persisted }, error: null }),
    getUser: async () => ({
      data: { user: persisted?.user ?? null },
      error: null,
    }),
    onAuthStateChange: (
      fn: (event: AuthChangeEvent, s: Session | null) => void,
    ) => {
      listeners.add(fn);
      return {
        data: { subscription: { unsubscribe: () => listeners.delete(fn) } },
      };
    },
    signInWithPassword: async () => {
      counts.login++;
      emit("SIGNED_IN", session);
      return { data: { session, user }, error: null };
    },
    signUp: async () => {
      counts.signup++;
      return { data: { user, session: null }, error: null };
    },
    signOut: async () => {
      emit("SIGNED_OUT", null);
      return { error: null };
    },
    signInWithOAuth: async () => ({
      data: {
        url: "https://example.supabase.co/auth/v1/authorize?provider=google",
      },
      error: null,
    }),
    resetPasswordForEmail: async () => {
      counts.recover++;
      return { data: {}, error: null };
    },
    updateUser: async () => {
      counts.update++;
      emit("USER_UPDATED", session);
      return { data: { user }, error: null };
    },
    resend: async () => {
      counts.resend++;
      return { data: {}, error: null };
    },
    exchangeCodeForSession: async () => {
      counts.exchange++;
      emit("SIGNED_IN", session);
      return { data: { user, session }, error: null };
    },
    verifyOtp: async () => {
      counts.verify++;
      emit("PASSWORD_RECOVERY", session);
      return { data: { user, session }, error: null };
    },
  };
  const env: AuthEnvironment = {
    origin: "http://localhost:3000",
    href,
    replaceUrl: (path) => urls.push(path),
    now: () => time,
  };
  const controller = new AuthController(auth as unknown as AuthPort, env);
  return {
    auth,
    env,
    controller,
    emit,
    counts,
    urls,
    listeners,
    tick: () => {
      time += 61000;
    },
    newController: () => new AuthController(auth as unknown as AuthPort, env),
  };
}
function render(url: string, controller?: AuthController): Promise<string> {
  return new Promise((resolve, reject) => {
    const output = new PassThrough();
    let html = "";
    output.on("data", (chunk) => (html += chunk.toString()));
    output.on("end", () => resolve(html));
    const content = (
      <StaticRouter location={url}>
        <ApplicationRoutes />
      </StaticRouter>
    );
    const stream = renderToPipeableStream(
      controller ? (
        <AuthProvider controller={controller}>{content}</AuthProvider>
      ) : (
        content
      ),
      {
        onAllReady() {
          stream.pipe(output);
        },
        onError: reject,
      },
    );
  });
}
test("email/password/confirmation validation rejects malformed input without changing passwords", () => {
  assert.equal(validateEmail(" reader@example.test "), null);
  for (const email of [
    "",
    "a@",
    "a b@example.test",
    "a@example",
    "a".repeat(255) + "@x.test",
  ])
    assert.ok(validateEmail(email));
  assert.equal(validatePassword("SenhaSegura123"), null);
  for (const password of ["short", "abcdefgh", "12345678", "a".repeat(129)])
    assert.ok(validatePassword(password));
  assert.equal(
    validateConfirmation("secret1", "secret2"),
    "As senhas não coincidem.",
  );
  assert.equal(validateConfirmation("secret1", "secret1"), null);
});
test("public configuration accepts publishable or explicitly documented anon and rejects secrets", () => {
  assert.equal(readAuthConfig({}).ready, false);
  const env = {
    VITE_SUPABASE_URL: "https://project.supabase.co",
    VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_abcdefghijklmnopqrstuvwxyz",
  };
  assert.equal(readAuthConfig(env).ready, true);
  for (const url of [
    "javascript:alert(1)",
    "https://u:p@project.supabase.co",
    "http://untrusted.test",
    "https://project.supabase.co/path",
  ])
    assert.equal(
      readAuthConfig({ ...env, VITE_SUPABASE_URL: url }).ready,
      false,
    );
  for (const key of ["sb_secret_example", "service-role-secret", ""])
    assert.equal(
      readAuthConfig({ ...env, VITE_SUPABASE_PUBLISHABLE_KEY: key }).ready,
      false,
    );
  const jwt = (role: string) =>
    `header.${btoa(JSON.stringify({ role }))}.signature`;
  assert.equal(
    readAuthConfig({
      ...env,
      VITE_SUPABASE_PUBLISHABLE_KEY: jwt("service_role"),
    }).ready,
    false,
  );
  const anon = readAuthConfig({
    ...env,
    VITE_SUPABASE_PUBLISHABLE_KEY: jwt("anon"),
  });
  assert.ok(anon.ready && anon.legacyAnon);
});
test("redirect destinations reject external, encoded, unknown and auth loop destinations", () => {
  assert.equal(
    safeDestination("/catalogo?q=historia%20de%20mar"),
    "/catalogo?q=historia%20de%20mar",
  );
  for (const target of [
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/%2fevil.test",
    "/%252fevil.test",
    "/entrar",
    "/boas-vindas",
    "/confirmar-email?next=/entrar",
    "/missing",
    "/catalogo\n",
    "/catalogo?code=secret",
  ])
    assert.equal(safeDestination(target), "/catalogo", target);
  assert.equal(
    safeDestination("/obras/atlas-das-mares"),
    "/obras/atlas-das-mares",
  );
  assert.equal(
    safeDestination("/catalogo?genero=Fantasia"),
    "/catalogo?genero=Fantasia",
  );
  assert.equal(
    new URL(
      callbackUrl(
        "https://ag.example",
        "/confirmar-email",
        "//evil.test",
        true,
      ),
    ).searchParams.get("next"),
    "/catalogo",
  );
});
test("callbacks reject errors, implicit bearer URLs and unsupported types; scrub all credentials", () => {
  assert.equal(
    readCallback("http://localhost:3000/confirmar-email?code=demo").kind,
    "code",
  );
  assert.equal(
    readCallback(
      "http://localhost:3000/redefinir-senha?token_hash=demo&type=recovery",
    ).kind,
    "hash",
  );
  for (const suffix of [
    "/confirmar-email?error=access_denied&error_description=secret",
    "/confirmar-email#access_token=secret&refresh_token=secret",
    "/catalogo?code=demo",
    "/confirmar-email?token_hash=demo&type=invite",
    "/redefinir-senha?token_hash=demo&type=signup",
  ])
    assert.equal(readCallback("http://localhost:3000" + suffix).kind, "error");
  assert.equal(
    scrubCallbackUrl(
      "http://localhost:3000/confirmar-email?code=private&next=%2Fexplorar#access_token=private",
    ),
    "/confirmar-email?next=%2Fexplorar",
  );
  assert.ok(
    !authErrorMessage({ message: "private-token" }).includes("private-token"),
  );
});
test("missing config is explicit, no operation reports success", async () => {
  const c = new AuthController(null, fixture().env);
  await c.start();
  assert.equal(c.getSnapshot().status, "configuration-error");
  assert.equal((await c.signIn("a@example.test", "test")).ok, false);
  assert.equal((await c.google("/catalogo")).ok, false);
});
test("existing SDK session restores, validates user, persists through provider reconstruction", async () => {
  const f = fixture(undefined, session);
  assert.equal(f.controller.getSnapshot().status, "initializing");
  await f.controller.start();
  assert.equal(f.controller.getSnapshot().status, "authenticated");
  assert.equal(f.controller.getSnapshot().user?.id, user.id);
  f.controller.stop();
  const reloaded = f.newController();
  await reloaded.start();
  assert.equal(reloaded.getSnapshot().user?.id, user.id);
  reloaded.stop();
  assert.equal(f.listeners.size, 0);
});
test("single listener, idempotent startup and StrictMode reconnect never re-exchange code", async () => {
  const f = fixture("http://localhost:3000/confirmar-email?code=mock-code");
  await Promise.all([f.controller.start(), f.controller.start()]);
  assert.equal(f.listeners.size, 1);
  assert.equal(f.counts.exchange, 1);
  f.controller.stop();
  await f.controller.start();
  assert.equal(f.counts.exchange, 1);
  assert.equal(f.listeners.size, 1);
  f.controller.stop();
});
test("login, token refresh and logout synchronize subscribers without manual storage", async () => {
  const f = fixture();
  await f.controller.start();
  let updates = 0;
  const off = f.controller.subscribe(() => updates++);
  assert.equal(
    (await f.controller.signIn("reader@example.test", "existing-password")).ok,
    true,
  );
  assert.equal(f.controller.getSnapshot().status, "authenticated");
  f.emit("TOKEN_REFRESHED", { ...session, access_token: "rotated-mock" });
  assert.equal(
    f.controller.getSnapshot().session?.access_token,
    "rotated-mock",
  );
  assert.equal((await f.controller.signOut()).ok, true);
  assert.equal(f.controller.getSnapshot().status, "unauthenticated");
  assert.equal(f.controller.getSnapshot().user, null);
  assert.ok(updates > 0);
  off();
  f.controller.stop();
});
test("duplicate submissions are blocked synchronously", async () => {
  const f = fixture();
  await f.controller.start();
  let release!: () => void;
  const pending = new Promise<void>((r) => (release = r));
  f.auth.signInWithPassword = async () => {
    f.counts.login++;
    await pending;
    return { data: { session, user }, error: null };
  };
  const first = f.controller.signIn("reader@example.test", "pw");
  assert.equal(f.controller.getSnapshot().busy, true);
  assert.equal(
    (await f.controller.signIn("reader@example.test", "pw")).ok,
    false,
  );
  release();
  assert.equal((await first).ok, true);
  assert.equal(f.counts.login, 1);
  f.controller.stop();
});
test("revoked sessions clear UI and network errors remain distinct", async () => {
  const f = fixture(undefined, session);
  f.auth.getUser = async () =>
    ({ data: { user: null }, error: { status: 401 } }) as never;
  await f.controller.start();
  assert.equal(f.controller.getSnapshot().status, "unauthenticated");
  assert.equal(f.controller.getSnapshot().session, null);
  f.controller.stop();
  const network = fixture(undefined, session);
  network.auth.getUser = async () => {
    throw new TypeError("sensitive network details");
  };
  await network.controller.start();
  assert.equal(network.controller.getSnapshot().status, "operational-error");
  assert.ok(!network.controller.getSnapshot().error?.includes("sensitive"));
  network.controller.stop();
});
test("late startup snapshot cannot resurrect a newer logout event", async () => {
  const f = fixture(undefined, session);
  let resolve!: (v: unknown) => void;
  f.auth.getSession = () =>
    new Promise((r) => {
      resolve = r;
    }) as never;
  const startup = f.controller.start();
  await Promise.resolve();
  f.emit("SIGNED_OUT", null);
  resolve({ data: { session }, error: null });
  await startup;
  assert.equal(f.controller.getSnapshot().user, null);
  assert.equal(f.controller.getSnapshot().status, "unauthenticated");
  f.controller.stop();
});
test("registration only reports pending after service response, never creates a fake session", async () => {
  const f = fixture();
  await f.controller.start();
  assert.equal(
    (
      await f.controller.signUp(
        "reader@example.test",
        "validPass1",
        "mismatch",
        "/explorar",
      )
    ).ok,
    false,
  );
  assert.equal(f.counts.signup, 0);
  const result = await f.controller.signUp(
    "reader@example.test",
    "validPass1",
    "validPass1",
    "/explorar",
  );
  assert.deepEqual(result, { ok: true, kind: "pending" });
  assert.equal(f.controller.getSnapshot().session, null);
  assert.ok(f.controller.getSnapshot().resendAt > f.env.now());
  f.controller.stop();
});
test("recovery and resend use service, enforce cooldown and return safe account-neutral feedback", async () => {
  const f = fixture();
  await f.controller.start();
  assert.equal((await f.controller.recover("reader@example.test")).ok, true);
  assert.equal((await f.controller.recover("reader@example.test")).ok, false);
  assert.equal(f.counts.recover, 1);
  f.tick();
  assert.equal((await f.controller.resend("reader@example.test")).ok, true);
  assert.equal(f.counts.resend, 1);
  assert.equal((await f.controller.resend("reader@example.test")).ok, false);
  f.controller.stop();
});
test("PKCE confirmation removes URL code and marks success only after server validation", async () => {
  const f = fixture(
    "http://localhost:3000/confirmar-email?code=mock-code&next=%2Fexplorar",
  );
  await f.controller.start();
  assert.equal(f.controller.getSnapshot().callback, "confirmed");
  assert.equal(f.controller.getSnapshot().destination, "/explorar");
  assert.equal(f.urls[0], "/confirmar-email?next=%2Fexplorar");
  assert.equal(f.counts.exchange, 1);
  f.controller.stop();
});
test("recovery hash is verified with SDK before password update", async () => {
  const f = fixture(
    "http://localhost:3000/redefinir-senha?token_hash=mock-hash&type=recovery",
  );
  await f.controller.start();
  assert.equal(f.counts.verify, 1);
  assert.equal(f.controller.getSnapshot().callback, "recovery");
  assert.equal(
    (await f.controller.updatePassword("NewPassword1", "wrong")).ok,
    false,
  );
  assert.equal(f.counts.update, 0);
  assert.equal(
    (await f.controller.updatePassword("NewPassword1", "NewPassword1")).ok,
    true,
  );
  assert.equal(f.counts.update, 1);
  f.controller.stop();
});
test("expired or invalid callback never reports confirmation or allows reset", async () => {
  const f = fixture(
    "http://localhost:3000/confirmar-email?error=access_denied&error_description=secret",
  );
  await f.controller.start();
  assert.equal(f.controller.getSnapshot().callback, "error");
  assert.equal(f.controller.getSnapshot().status, "operational-error");
  assert.ok(!f.controller.getSnapshot().error?.includes("secret"));
  assert.equal(
    (await f.controller.updatePassword("Password1", "Password1")).ok,
    false,
  );
  assert.equal(f.counts.exchange, 0);
  f.controller.stop();
});
test("valid session permits password update after page reload; unauthenticated update denied", async () => {
  const f = fixture("http://localhost:3000/redefinir-senha", session);
  await f.controller.start();
  assert.equal(
    (await f.controller.updatePassword("NewPassword1", "NewPassword1")).ok,
    true,
  );
  await f.controller.signOut();
  assert.equal(
    (await f.controller.updatePassword("NewPassword1", "NewPassword1")).ok,
    false,
  );
  f.controller.stop();
});
test("Google delegates PKCE redirect construction to Supabase and exposes provider configuration failure safely", async () => {
  const f = fixture();
  await f.controller.start();
  let redirect = "";
  f.auth.signInWithOAuth = async (...args: unknown[]) => {
    redirect = (args[0] as { options: { redirectTo: string } }).options
      .redirectTo;
    return { data: { url: "" }, error: { code: "provider_disabled" } } as never;
  };
  const result = await f.controller.google("//evil.test");
  assert.equal(result.ok, false);
  assert.equal(new URL(redirect).searchParams.get("next"), "/catalogo");
  assert.equal(new URL(redirect).pathname, "/confirmar-email");
  assert.ok(f.controller.getSnapshot().error?.includes("Google"));
  f.controller.stop();
});
for (const [path, title] of [
  ["/entrar", "É bom ter-te por aqui."],
  ["/registar", "Um lugar para a tua imaginação."],
  ["/recuperar-senha", "Recuperar acesso."],
  ["/redefinir-senha", "Define uma nova senha."],
  ["/confirmar-email", "Mais um passo para entrar."],
  ["/boas-vindas", "O teu próximo capítulo começa aqui."],
])
  test(`auth route renders ${path} with explicit unavailable configuration`, async () => {
    const html = await render(path);
    assert.ok(html.includes(title));
    assert.ok(html.includes("Autenticação indisponível"));
    assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1);
    assert.ok(
      !html.includes("Esta área está preparada para uma próxima etapa."),
    );
  });
test("rendered UI distinguishes pending initialization, authenticated account and signed out user", async () => {
  const f = fixture(undefined, session);
  const initializing = await render("/entrar", f.controller);
  assert.ok(initializing.includes("A recuperar sessão"));
  assert.ok(!initializing.includes("A tua sessão está ativa."));
  await f.controller.start();
  const logged = await render("/entrar", f.controller);
  assert.ok(logged.includes("A tua sessão está ativa."));
  assert.ok(logged.includes("Terminar sessão"));
  await f.controller.signOut();
  const guest = await render("/entrar", f.controller);
  assert.ok(!guest.includes("A tua sessão está ativa."));
  assert.ok(guest.includes("Continuar com Google"));
  f.controller.stop();
});
test("SDK configuration explicitly persists and refreshes session using PKCE", () => {
  assert.equal(authClientOptions.auth.persistSession, true);
  assert.equal(authClientOptions.auth.autoRefreshToken, true);
  assert.equal(authClientOptions.auth.flowType, "pkce");
  assert.equal(authClientOptions.auth.detectSessionInUrl, false);
});
test("actual SDK persists, restores and renews session with mocked storage and HTTP, then removes it on logout", async () => {
  const storage = new Map<string, string>();
  const adapter = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
  };
  const token = `${btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${btoa(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 }))}.mock-signature`;
  let refreshes = 0;
  const mockFetch = async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/token")) {
      refreshes++;
      return new Response(
        JSON.stringify({
          access_token: token,
          refresh_token: "mock-rotated",
          token_type: "bearer",
          expires_in: 3600,
          user,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.includes("/user"))
      return new Response(JSON.stringify(user), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    if (url.includes("/logout"))
      return new Response("{}", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    throw Error("Unexpected mocked SDK endpoint");
  };
  const options = {
    ...authClientOptions,
    auth: {
      ...authClientOptions.auth,
      storage: adapter,
      storageKey: "ag-auth-unit-test",
    },
    global: { fetch: mockFetch as typeof fetch },
  };
  const first = createClient(
    "http://127.0.0.1:54321",
    "mock-public-key",
    options,
  );
  const result = await first.auth.setSession({
    access_token: token,
    refresh_token: "mock-refresh",
  });
  assert.equal(result.error, null);
  assert.ok(storage.has("ag-auth-unit-test"));
  first.auth.stopAutoRefresh();
  const second = createClient(
    "http://127.0.0.1:54321",
    "mock-public-key",
    options,
  );
  try {
    assert.equal(
      (await second.auth.getSession()).data.session?.user.id,
      user.id,
    );
    assert.equal((await second.auth.refreshSession()).error, null);
    assert.ok(refreshes > 0);
    assert.equal((await second.auth.signOut({ scope: "local" })).error, null);
    assert.equal((await second.auth.getSession()).data.session, null);
    assert.equal(storage.has("ag-auth-unit-test"), false);
  } finally {
    first.auth.stopAutoRefresh();
    second.auth.stopAutoRefresh();
  }
});

test("a successful email request recovers from an earlier operational error", async () => {
  const f = fixture();
  await f.controller.start();
  f.auth.resetPasswordForEmail = async () =>
    ({ data: {}, error: { status: 503 } }) as never;
  assert.equal((await f.controller.recover("reader@example.test")).ok, false);
  assert.equal(f.controller.getSnapshot().status, "operational-error");
  f.auth.resetPasswordForEmail = async () => ({ data: {}, error: null });
  assert.equal((await f.controller.recover("reader@example.test")).ok, true);
  assert.equal(f.controller.getSnapshot().status, "unauthenticated");
  f.controller.stop();
});
test("recovery never reveals an unknown email even when the service returns user_not_found", async () => {
  const f = fixture();
  await f.controller.start();
  f.auth.resetPasswordForEmail = async () =>
    ({ data: {}, error: { code: "user_not_found" } }) as never;
  assert.equal((await f.controller.recover("missing@example.test")).ok, true);
  assert.equal(f.controller.getSnapshot().error, null);
  f.controller.stop();
});
test("password success cannot resurrect a session ended during the service request", async () => {
  const f = fixture(undefined, session);
  await f.controller.start();
  f.auth.updateUser = async () => {
    f.emit("SIGNED_OUT", null);
    return { data: { user }, error: null };
  };
  assert.equal(
    (await f.controller.updatePassword("Password123", "Password123")).ok,
    true,
  );
  assert.equal(f.controller.getSnapshot().session, null);
  assert.equal(f.controller.getSnapshot().status, "unauthenticated");
  f.controller.stop();
});
