import { matchRoutes } from "react-router-dom";
import { productRoutes } from "../../app/routes";
export function validateEmail(value: string): string | null {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
    ? null
    : "Introduz um endereço de e-mail válido.";
}
export function validatePassword(value: string): string | null {
  return value.length < 8
    ? "Usa pelo menos 8 caracteres."
    : value.length > 128
      ? "Usa até 128 caracteres."
      : !/[a-zA-Z\p{L}]/u.test(value) || !/[0-9]/.test(value)
        ? "Inclui pelo menos uma letra e um número."
        : null;
}
export function validateConfirmation(
  password: string,
  confirmation: string,
): string | null {
  return password === confirmation ? null : "As senhas não coincidem.";
}
export function safeDestination(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || /[\\\u0000-\u001f\u007f]/.test(value))
    return "/catalogo";
  try {
    let decoded = value;
    for (let i = 0; i < 3; i++) {
      decoded = decodeURIComponent(decoded);
      if (
        !decoded.startsWith("/") ||
        decoded.startsWith("//") ||
        /[\\\u0000-\u001f\u007f]/.test(decoded)
      )
        return "/catalogo";
    }
    const url = new URL(value, "https://internal.invalid");
    if (
      url.origin !== "https://internal.invalid" ||
      !matchRoutes(productRoutes, url.pathname) ||
      /^\/(entrar|registar|recuperar-senha|redefinir-senha|confirmar-email|boas-vindas)(\/|$)/.test(
        url.pathname,
      )
    )
      return "/catalogo";
    if (
      ["code", "token", "token_hash", "access_token", "refresh_token"].some(
        (key) => url.searchParams.has(key),
      )
    )
      return "/catalogo";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/catalogo";
  }
}
export function callbackUrl(
  origin: string,
  path: "/confirmar-email" | "/redefinir-senha",
  destination = "/catalogo",
  oauth = false,
): string {
  const url = new URL(path, origin);
  url.searchParams.set("next", safeDestination(destination));
  if (oauth) url.searchParams.set("fluxo", "oauth");
  return url.toString();
}
export type CallbackInput =
  | { kind: "none" }
  | { kind: "error" }
  | {
      kind: "code";
      code: string;
      purpose: "email" | "oauth" | "recovery";
      destination: string;
    }
  | {
      kind: "hash";
      tokenHash: string;
      type: "signup" | "email" | "recovery";
      purpose: "email" | "recovery";
      destination: string;
    };
const sensitiveKeys = [
  "code",
  "token",
  "token_hash",
  "access_token",
  "refresh_token",
  "provider_token",
  "provider_refresh_token",
  "expires_in",
  "expires_at",
  "token_type",
  "type",
  "error",
  "error_code",
  "error_description",
];
export function readCallback(href: string): CallbackInput {
  const url = new URL(href);
  const hash = new URLSearchParams(url.hash.slice(1));
  const query = url.searchParams;
  const hasCallback = sensitiveKeys.some(
    (key) => query.has(key) || hash.has(key),
  );
  if (!hasCallback) return { kind: "none" };
  if (
    !["/confirmar-email", "/redefinir-senha"].includes(url.pathname) ||
    query.has("error") ||
    query.has("error_code") ||
    hash.has("error") ||
    hash.has("access_token") ||
    query.has("access_token")
  )
    return { kind: "error" };
  const purpose =
    url.pathname === "/redefinir-senha"
      ? "recovery"
      : query.get("fluxo") === "oauth"
        ? "oauth"
        : "email";
  const destination = safeDestination(query.get("next"));
  const code = query.get("code");
  if (code && code.length <= 4096)
    return { kind: "code", code, purpose, destination };
  const tokenHash = query.get("token_hash");
  const type = query.get("type");
  if (
    tokenHash &&
    tokenHash.length <= 4096 &&
    (type === "signup" || type === "email" || type === "recovery") &&
    (purpose === "recovery") === (type === "recovery")
  )
    return {
      kind: "hash",
      tokenHash,
      type,
      purpose: type === "recovery" ? "recovery" : "email",
      destination,
    };
  return { kind: "error" };
}
export function scrubCallbackUrl(href: string): string {
  const url = new URL(href);
  for (const key of sensitiveKeys) url.searchParams.delete(key);
  return (
    url.pathname +
    url.search +
    (sensitiveKeys.some((key) =>
      new URLSearchParams(url.hash.slice(1)).has(key),
    )
      ? ""
      : url.hash)
  );
}
export function authErrorMessage(error: unknown): string {
  const e = error as { code?: string; status?: number; name?: string } | null;
  if (
    e?.status === 429 ||
    e?.code === "over_email_send_rate_limit" ||
    e?.code === "over_request_rate_limit"
  )
    return "Foram feitos demasiados pedidos. Aguarda um pouco e tenta novamente.";
  if (e?.code === "invalid_credentials")
    return "Não foi possível entrar. Verifica o e-mail e a senha.";
  if (e?.code === "email_not_confirmed")
    return "Confirma o teu e-mail antes de iniciar sessão.";
  if (e?.code === "weak_password" || e?.code === "same_password")
    return "Escolhe uma senha diferente que cumpra os requisitos de segurança.";
  if (e?.code === "provider_disabled" || e?.code === "provider_not_enabled")
    return "O login Google ainda não está disponível neste projeto. É necessária configuração no Supabase.";
  if (
    e?.code === "otp_expired" ||
    e?.code === "flow_state_expired" ||
    e?.code === "flow_state_not_found"
  )
    return "Este link é inválido ou expirou. Solicita um novo link e abre-o no mesmo navegador.";
  if (
    e?.status === 401 ||
    e?.code === "refresh_token_not_found" ||
    e?.code === "refresh_token_already_used" ||
    e?.code === "session_not_found" ||
    e?.code === "user_not_found"
  )
    return "A sessão expirou ou foi revogada. Inicia sessão novamente.";
  if (e?.name === "AuthRetryableFetchError" || e?.name === "TypeError")
    return "Não foi possível comunicar com o serviço. Verifica a ligação e tenta novamente.";
  return "Não foi possível concluir o pedido. Tenta novamente ou solicita um novo link.";
}
export function isInvalidSession(error: unknown): boolean {
  const e = error as { status?: number; code?: string } | null;
  return (
    e?.status === 401 ||
    [
      "refresh_token_not_found",
      "refresh_token_already_used",
      "session_not_found",
      "user_not_found",
    ].includes(e?.code ?? "")
  );
}
