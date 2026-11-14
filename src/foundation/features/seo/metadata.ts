import { canonicalUrl, DEFAULT_DESCRIPTION, indexableRoute } from "./config";
export interface PageSeo {
  path: string;
  title: string;
  description?: string;
  index: boolean;
}
export function routeSeo(
  path: string,
  search = "",
  title = "Arquivo Global",
): PageSeo {
  return {
    path,
    title,
    description: DEFAULT_DESCRIPTION,
    index: indexableRoute(path, search),
  };
}
export function applySeo(seo: PageSeo, doc: Document = document) {
  doc.title = seo.title;
  const canonical = canonicalUrl(seo.path);
  let link = doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) {
    if (!link) {
      link = doc.createElement("link");
      link.rel = "canonical";
      doc.head.appendChild(link);
    }
    link.href = canonical;
  } else link?.remove();
  for (const [name, content] of [
    ["description", seo.description || DEFAULT_DESCRIPTION],
    ["robots", seo.index ? "index, follow" : "noindex, follow"],
  ]) {
    let element = doc.head.querySelector<HTMLMetaElement>(
      `meta[name="${name}"]`,
    );
    if (!element) {
      element = doc.createElement("meta");
      element.name = name;
      doc.head.appendChild(element);
    }
    element.content = content;
  }
}
