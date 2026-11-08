import type {
  AuthChangeEvent,
  Session,
  SupabaseClient,
  User,
} from "@supabase/supabase-js";
import {
  authErrorMessage,
  callbackUrl,
  isInvalidSession,
  readCallback,
  safeDestination,
  scrubCallbackUrl,
  validateConfirmation,
  validateEmail,
  validatePassword,
  type CallbackInput,
} from "./security";
export type AuthStatus =
  | "initializing"
  | "authenticated"
  | "unauthenticated"
  | "configuration-error"
  | "operational-error";
export interface AuthState {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  error: string | null;
  busy: boolean;
  callback:
    | "none"
    | "processing"
    | "confirmed"
    | "oauth"
    | "recovery"
    | "error";
  destination: string;
  resendAt: number;
}
export type AuthPort = Pick<
  SupabaseClient["auth"],
  | "initialize"
  | "getSession"
  | "getUser"
  | "onAuthStateChange"
  | "signInWithPassword"
  | "signUp"
  | "signInWithOAuth"
  | "signOut"
  | "resetPasswordForEmail"
  | "updateUser"
  | "verifyOtp"
  | "exchangeCodeForSession"
  | "resend"
>;
export interface AuthEnvironment {
  href: string;
  origin: string;
  replaceUrl: (path: string) => void;
  now: () => number;
}
export type AuthResult =
  | { ok: true; kind?: "pending" | "authenticated" }
  | { ok: false; message: string };
const unavailable = "A autenticação ainda não está configurada neste ambiente.";
export const initialAuthState: AuthState = {
  status: "initializing",
  session: null,
  user: null,
  error: null,
  busy: false,
  callback: "none",
  destination: "/catalogo",
  resendAt: 0,
};
export class AuthController {
  private state: AuthState;
  private listeners = new Set<() => void>();
  private unsubscribe: (() => void) | null = null;
  private startup: Promise<void> | null = null;
  private revision = 0;
  private initializing = true;
  private callbackInput: CallbackInput;
  constructor(
    private auth: AuthPort | null,
    private env: AuthEnvironment,
    configurationError = unavailable,
  ) {
    this.callbackInput = readCallback(env.href);
    this.state = {
      ...initialAuthState,
      ...(!auth
        ? { status: "configuration-error" as const, error: configurationError }
        : {}),
      destination:
        this.callbackInput.kind === "code" || this.callbackInput.kind === "hash"
          ? this.callbackInput.destination
          : "/catalogo",
    };
  }
  getSnapshot = (): AuthState => this.state;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  private set(patch: Partial<AuthState>) {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }
  private session(session: Session | null) {
    this.set({
      session,
      user: session?.user ?? null,
      status: this.initializing
        ? "initializing"
        : session
          ? "authenticated"
          : "unauthenticated",
      error: null,
    });
  }
  private onEvent = (event: AuthChangeEvent, session: Session | null) => {
    this.revision++;
    this.session(session);
    if (event === "PASSWORD_RECOVERY") this.set({ callback: "recovery" });
    if (event === "SIGNED_OUT") this.set({ callback: "none" });
  };
  start = (): Promise<void> => {
    if (this.auth && !this.unsubscribe) {
      const { data } = this.auth.onAuthStateChange(this.onEvent);
      this.unsubscribe = () => data.subscription.unsubscribe();
    }
    return (this.startup ??= this.initialize());
  };
  stop = () => {
    this.unsubscribe?.();
    this.unsubscribe = null;
  };
  private async initialize() {
    const input = this.callbackInput;
    if (input.kind !== "none")
      this.env.replaceUrl(scrubCallbackUrl(this.env.href));
    if (!this.auth) return;
    this.set({
      status: "initializing",
      callback: input.kind === "none" ? "none" : "processing",
    });
    try {
      const initialized = await this.auth.initialize();
      if (initialized.error) throw initialized.error;
      if (input.kind === "error") throw { code: "otp_expired" };
      if (input.kind === "code" || input.kind === "hash") {
        const response =
          input.kind === "code"
            ? await this.auth.exchangeCodeForSession(input.code)
            : await this.auth.verifyOtp({
                token_hash: input.tokenHash,
                type: input.type,
              });
        if (response.error) throw response.error;
        if (!response.data.session) throw Error();
        this.session(response.data.session);
      }
      await this.restore();
      if (input.kind === "code" || input.kind === "hash") {
        if (this.state.status !== "authenticated") throw Error();
        if (input.purpose === "email" && !this.state.user?.email_confirmed_at)
          throw { code: "email_not_confirmed" };
        this.set({
          callback: input.purpose === "email" ? "confirmed" : input.purpose,
        });
      }
    } catch (error) {
      this.initializing = false;
      this.set({
        status: isInvalidSession(error)
          ? "unauthenticated"
          : "operational-error",
        error: authErrorMessage(error),
        ...(input.kind !== "none" ? { callback: "error" as const } : {}),
        ...(isInvalidSession(error) ? { session: null, user: null } : {}),
      });
    } finally {
      this.initializing = false;
      if (this.state.status === "initializing")
        this.session(this.state.session);
      this.callbackInput = { kind: "none" };
    }
  }
  private async restore() {
    if (!this.auth) return;
    const revision = this.revision;
    const { data, error } = await this.auth.getSession();
    if (error) throw error;
    const session =
      this.revision === revision ? data.session : this.state.session;
    if (!session) {
      this.initializing = false;
      this.session(null);
      return;
    }
    const current = this.revision;
    const checked = await this.auth.getUser();
    if (this.revision !== current) {
      this.initializing = false;
      this.session(this.state.session);
      return;
    }
    if (checked.error) {
      if (isInvalidSession(checked.error))
        await this.auth.signOut({ scope: "local" });
      throw checked.error;
    }
    if (!checked.data.user) throw { status: 401 };
    this.initializing = false;
    this.session({ ...session, user: checked.data.user });
  }
  retry = async () => {
    if (this.state.busy || !this.auth) return;
    this.set({ busy: true, status: "initializing", error: null });
    try {
      await this.restore();
    } catch (error) {
      this.set({
        status: isInvalidSession(error)
          ? "unauthenticated"
          : "operational-error",
        error: authErrorMessage(error),
        ...(isInvalidSession(error) ? { session: null, user: null } : {}),
      });
    } finally {
      this.set({ busy: false });
    }
  };
  private async run(action: () => Promise<AuthResult>): Promise<AuthResult> {
    if (!this.auth) return { ok: false, message: unavailable };
    if (this.state.busy || this.state.status === "initializing")
      return { ok: false, message: "Aguarda a conclusão do pedido atual." };
    this.set({ busy: true, error: null });
    try {
      const result = await action();
      if (
        result.ok &&
        this.state.status === "operational-error" &&
        !this.state.session
      )
        this.set({ status: "unauthenticated", error: null });
      return result;
    } catch (error) {
      const message = authErrorMessage(error);
      if ((error as { status?: number })?.status === 429)
        this.set({ resendAt: this.env.now() + 60000 });
      this.set({
        error: message,
        status: isInvalidSession(error)
          ? "unauthenticated"
          : "operational-error",
        ...(isInvalidSession(error) ? { session: null, user: null } : {}),
      });
      return { ok: false, message };
    } finally {
      this.set({ busy: false });
    }
  }
  private credentials(
    email: string,
    password?: string,
    confirmation?: string,
  ): string | null {
    return (
      validateEmail(email) ||
      (password !== undefined ? validatePassword(password) : null) ||
      (confirmation !== undefined
        ? validateConfirmation(password ?? "", confirmation)
        : null)
    );
  }
  signIn = (email: string, password: string) => {
    const invalid =
      validateEmail(email) || (!password ? "Introduz a tua senha." : null);
    if (invalid)
      return Promise.resolve({ ok: false, message: invalid } as AuthResult);
    return this.run(async () => {
      const { data, error } = await this.auth!.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      if (!data.session || !data.user) throw Error();
      this.session(data.session);
      return { ok: true, kind: "authenticated" };
    });
  };
  signUp = (
    email: string,
    password: string,
    confirmation: string,
    destination: string,
  ) => {
    const invalid = this.credentials(email, password, confirmation);
    if (invalid)
      return Promise.resolve({ ok: false, message: invalid } as AuthResult);
    return this.run(async () => {
      const { data, error } = await this.auth!.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: callbackUrl(
            this.env.origin,
            "/confirmar-email",
            destination,
          ),
        },
      });
      if (error) throw error;
      if (!data.user) throw Error();
      if (data.session) {
        this.session(data.session);
        return { ok: true, kind: "authenticated" };
      }
      this.set({ resendAt: this.env.now() + 60000 });
      return { ok: true, kind: "pending" };
    });
  };
  google = (destination: string) =>
    this.run(async () => {
      const { data, error } = await this.auth!.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl(
            this.env.origin,
            "/confirmar-email",
            safeDestination(destination),
            true,
          ),
        },
      });
      if (error) throw error;
      if (!data.url) throw { code: "provider_disabled" };
      return { ok: true };
    });
  signOut = () =>
    this.run(async () => {
      const { error } = await this.auth!.signOut({ scope: "local" });
      if (error) throw error;
      this.session(null);
      this.set({ callback: "none" });
      return { ok: true };
    });
  recover = (email: string) => {
    const invalid = validateEmail(email);
    if (invalid)
      return Promise.resolve({ ok: false, message: invalid } as AuthResult);
    if (this.env.now() < this.state.resendAt)
      return Promise.resolve({
        ok: false,
        message: "Aguarda um minuto entre pedidos de e-mail.",
      } as AuthResult);
    return this.run(async () => {
      const { error } = await this.auth!.resetPasswordForEmail(email.trim(), {
        redirectTo: callbackUrl(this.env.origin, "/redefinir-senha"),
      });
      if (
        error &&
        !["user_not_found", "email_not_found"].includes(error.code ?? "")
      )
        throw error;
      this.set({ resendAt: this.env.now() + 60000 });
      return { ok: true };
    });
  };
  updatePassword = (password: string, confirmation: string) => {
    const invalid =
      validatePassword(password) ||
      validateConfirmation(password, confirmation);
    if (invalid)
      return Promise.resolve({ ok: false, message: invalid } as AuthResult);
    if (!this.state.session || this.state.callback === "error")
      return Promise.resolve({
        ok: false,
        message:
          "Abre um link válido de recuperação ou inicia sessão para alterar a senha.",
      } as AuthResult);
    return this.run(async () => {
      const { data, error } = await this.auth!.updateUser({ password });
      if (error) throw error;
      if (!data.user) throw Error();
      if (this.state.session)
        this.session({ ...this.state.session, user: data.user });
      this.set({ callback: "none" });
      return { ok: true };
    });
  };
  resend = (email: string) => {
    const invalid = validateEmail(email);
    if (invalid)
      return Promise.resolve({ ok: false, message: invalid } as AuthResult);
    if (this.env.now() < this.state.resendAt)
      return Promise.resolve({
        ok: false,
        message: "Aguarda um minuto entre pedidos de e-mail.",
      } as AuthResult);
    return this.run(async () => {
      const { error } = await this.auth!.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: callbackUrl(this.env.origin, "/confirmar-email"),
        },
      });
      if (error) throw error;
      this.set({ resendAt: this.env.now() + 60000 });
      return { ok: true };
    });
  };
}
