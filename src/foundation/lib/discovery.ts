import type { Work, WorkFormat } from "../data/works";
export const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt")
    .trim();
export const slugify = (value: string): string => {
  const normalized = normalizeText(value);
  return (
    normalized.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") ||
    normalized
  );
};
export type SearchScope = "todos" | "titulo" | "autor" | "sinopse";
export type SortOrder = "recentes" | "antigas" | "titulo" | "autor";
export interface DiscoveryFilters {
  query: string;
  format: string;
  genre: string;
  sort: SortOrder;
  scope: SearchScope;
  tags: string[];
}
export function readFilters(params: URLSearchParams): DiscoveryFilters {
  const order = params.get("ordem");
  const scope = params.get("campo");
  return {
    query: params.get("q") ?? "",
    format: params.get("formato") ?? "",
    genre: params.get("genero") ?? "",
    sort: ["recentes", "antigas", "titulo", "autor"].includes(order ?? "")
      ? (order as SortOrder)
      : "recentes",
    scope: ["titulo", "autor", "sinopse"].includes(scope ?? "")
      ? (scope as SearchScope)
      : "todos",
    tags: [...new Set(params.getAll("tag").map(slugify).filter(Boolean))],
  };
}
export interface PageResult<T> {
  items: readonly T[];
  page: number;
  pages: number;
  total: number;
  start: number;
  end: number;
}
export function paginate<T>(
  items: readonly T[],
  requested: number,
  size = 4,
): PageResult<T> {
  const limit = Number.isInteger(size) && size > 0 ? size : 4;
  const pages = Math.max(1, Math.ceil(items.length / limit));
  const page = Number.isSafeInteger(requested)
    ? Math.min(pages, Math.max(1, requested))
    : 1;
  const offset = (page - 1) * limit;
  return {
    items: items.slice(offset, offset + limit),
    page,
    pages,
    total: items.length,
    start: items.length ? offset + 1 : 0,
    end: Math.min(offset + limit, items.length),
  };
}
export function catalogUrl(
  filters: Record<string, string>,
  base = "/catalogo",
): string {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v),
  );
  return params.size ? `${base}?${params}` : base;
}
export type TagGroup = "Mundos" | "Temas" | "Criação";
const tagDetails: Record<string, { description: string; group: TagGroup }> = {};
export interface Tag {
  slug: string;
  name: string;
  description: string;
  group: TagGroup;
  count: number;
}
export function getTags(works: readonly Work[]): Tag[] {
  const tags = new Map<string, Tag>();
  for (const work of works)
    for (const name of new Set(work.tags)) {
      const slug = slugify(name);
      const current = tags.get(slug);
      if (current) current.count++;
      else
        tags.set(slug, {
          slug,
          name,
          count: 1,
          ...(tagDetails[slug] ?? {
            description: `Histórias que exploram ${name.toLocaleLowerCase("pt")}.`,
            group: "Temas" as const,
          }),
        });
    }
  return [...tags.values()].sort((a, b) => a.name.localeCompare(b.name, "pt"));
}
export const formatFamilies: Record<WorkFormat, "literaria" | "visual"> = {
  Romance: "literaria",
  Conto: "literaria",
  Poesia: "literaria",
  "Série literária": "literaria",
  Fanfiction: "literaria",
  "HQ / Comic": "visual",
  Mangá: "visual",
  "Obra ilustrada": "visual",
};
export const genreDescriptions: Record<string, string> = {};
export function getGenres(works: readonly Work[]) {
  return [...new Set(works.map((w) => w.genre))]
    .sort((a, b) => a.localeCompare(b, "pt"))
    .map((name) => ({
      name,
      slug: slugify(name),
      description:
        genreDescriptions[name] ?? "Outra forma de descobrir histórias.",
      count: works.filter((w) => w.genre === name).length,
    }));
}
export function getFormatCounts(works: readonly Work[]) {
  return Object.entries(formatFamilies).map(([name, family]) => ({
    name: name as WorkFormat,
    family,
    count: works.filter((w) => w.format === name).length,
  }));
}
export function getCategoryWorks(
  works: readonly Work[],
  genre: string,
  family: string,
): Work[] {
  return works.filter(
    (work) =>
      (!genre || work.genre === genre) &&
      (!family || formatFamilies[work.format] === family),
  );
}
export function relatedWorks(
  works: readonly Work[],
  current: Work,
  limit = 4,
): Work[] {
  return works
    .filter((work) => work.id !== current.id)
    .map((work) => ({
      work,
      score:
        Number(work.genre === current.genre) * 2 +
        Number(work.format === current.format) +
        work.tags.filter((tag) => current.tags.includes(tag)).length,
    }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.work.title.localeCompare(b.work.title, "pt"),
    )
    .slice(0, Math.max(0, limit))
    .map((entry) => entry.work);
}
export const formatDemoDate = (date: string): string =>
  new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
