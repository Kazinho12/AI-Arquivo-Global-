export type AuthConfig =
  | { ready: true; url: string; key: string; legacyAnon: boolean }
  | { ready: false; message: string };
export function readAuthConfig(env: Record<string, unknown>): AuthConfig {
  const url =
    typeof env.VITE_SUPABASE_URL === "string"
      ? env.VITE_SUPABASE_URL.trim()
      : "";
  const key =
    typeof env.VITE_SUPABASE_PUBLISHABLE_KEY === "string"
      ? env.VITE_SUPABASE_PUBLISHABLE_KEY.trim()
      : "";
  if (
    !url ||
    !key ||
    url.includes("your-project") ||
    key.includes("example") ||
    key.includes("your-")
  )
    return {
      ready: false,
      message:
        "A autenticação ainda não está configurada. Faltam as variáveis públicas do Supabase neste ambiente.",
    };
  try {
    const parsed = new URL(url);
    if (
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      !["", "/"].includes(parsed.pathname) ||
      !(
        parsed.protocol === "https:" ||
        (parsed.protocol === "http:" &&
          ["localhost", "127.0.0.1"].includes(parsed.hostname))
      )
    )
      throw Error();
  } catch {
    return {
      ready: false,
      message:
        "A configuração pública de autenticação é inválida. Verifica o URL do Supabase.",
    };
  }
  if (
    key.startsWith("sb_publishable_") &&
    /^[A-Za-z0-9_-]+$/.test(key) &&
    key.length > 24
  )
    return { ready: true, url, key, legacyAnon: false };
  // Only a legacy public anon JWT is accepted in the explicitly named publishable variable.
  try {
    const parts = key.split(".");
    if (parts.length !== 3) throw Error();
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    if (payload.role === "anon")
      return { ready: true, url, key, legacyAnon: true };
  } catch {}
  return {
    ready: false,
    message:
      "A chave configurada não é uma chave pública publishable ou anon reconhecida. Não uses chaves privadas no frontend.",
  };
}
