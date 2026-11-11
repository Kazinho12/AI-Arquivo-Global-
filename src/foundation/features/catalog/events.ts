export const publicCatalogEvent = "ag:public-catalog-changed";
export function notifyPublicCatalog(removedId?: string) {
  if (typeof window !== "undefined")
    window.dispatchEvent(
      new CustomEvent(publicCatalogEvent, { detail: { removedId } }),
    );
}
