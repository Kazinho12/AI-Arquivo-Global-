export const customCoversEnabled =
  import.meta.env?.VITE_ENABLE_CUSTOM_COVERS === "true";
export const COVER_MAX_BYTES = 5 * 1024 * 1024;
export interface CoverImage {
  assetId: string;
  x: number;
  y: number;
  zoom: number;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function readCoverImage(value: unknown): CoverImage | null {
  if (value == null) return null;
  const v = value as CoverImage;
  if (
    !uuid.test(v.assetId) ||
    !Number.isFinite(v.x) ||
    !Number.isFinite(v.y) ||
    !Number.isFinite(v.zoom) ||
    v.x < 0 ||
    v.x > 100 ||
    v.y < 0 ||
    v.y > 100 ||
    v.zoom < 1 ||
    v.zoom > 3
  )
    throw Error("Referência de capa inválida.");
  return { assetId: v.assetId, x: v.x, y: v.y, zoom: v.zoom };
}
export function publicCoverUrl(publicId: string, assetId: string) {
  if (!uuid.test(publicId) || !uuid.test(assetId))
    throw Error("Referência de capa inválida.");
  return `https://arquivo-global-api.killiandesigner.workers.dev/media/cover/public/${publicId}/${assetId}`;
}
