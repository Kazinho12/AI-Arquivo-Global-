export const SITE_ORIGIN = "https://arquivoglobal.vercel.app";
export const STATIC_PAGES = [
  "/",
  "/ajuda",
  "/regras",
  "/privacidade",
  "/contacto",
] as const;
export const DISCOVERY_PAGES = [
  "/catalogo",
  "/explorar",
  "/categorias",
  "/tags",
] as const;
export const DEFAULT_DESCRIPTION =
  "Arquivo Global: uma plataforma aberta e gratuita para publicar, ler e descobrir histórias.";
export const PUBLIC_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export function canonicalUrl(path: string): string | null {
  if (!path.startsWith("/") || path.startsWith("//") || /[\\?#\s]/.test(path))
    return null;
  const url = new URL(path, SITE_ORIGIN);
  return url.origin === SITE_ORIGIN ? url.href : null;
}
export function indexableRoute(path: string, search = "") {
  if (search) return false;
  return (
    (STATIC_PAGES as readonly string[]).includes(path) ||
    (DISCOVERY_PAGES as readonly string[]).includes(path) ||
    (path.startsWith("/obras/") && PUBLIC_ID.test(path.slice(7)))
  );
}
