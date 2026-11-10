import type { Work } from "../data/works";
import { inauguralWorks } from "../data/inaugural";
import { normalizeText, slugify, type SearchScope } from "./discovery";
/** Read-only boundary. A future Supabase adapter can implement this contract. No network or credentials. */
export interface WorksRepository {
  list(): readonly Work[];
  find(id: string): Work | undefined;
}
export const worksRepository: WorksRepository = {
  list: () => inauguralWorks,
  find: (id) => inauguralWorks.find((work) => work.id === id),
};
export interface CatalogFilters {
  query: string;
  format: string;
  genre: string;
  sort: string;
  scope?: SearchScope;
  tags?: readonly string[];
}
export function filterWorks(
  works: readonly Work[],
  filters: CatalogFilters,
): Work[] {
  const query = normalizeText(filters.query);
  const terms = query.split(/\s+/).filter(Boolean);
  const searchable = (work: Work): string => {
    const value =
      filters.scope === "titulo"
        ? work.title
        : filters.scope === "autor"
          ? work.author
          : filters.scope === "sinopse"
            ? work.synopsis
            : [work.title, work.author, work.synopsis, ...work.tags].join(" ");
    return normalizeText(value);
  };
  return works
    .filter(
      (w) =>
        terms.every((term) => searchable(w).includes(term)) &&
        (!filters.format || w.format === filters.format) &&
        (!filters.genre || w.genre === filters.genre) &&
        (filters.tags ?? []).every((tag) =>
          w.tags.some((name) => slugify(name) === slugify(tag)),
        ),
    )
    .sort((a, b) =>
      filters.sort === "titulo"
        ? a.title.localeCompare(b.title, "pt")
        : filters.sort === "autor"
          ? a.author.localeCompare(b.author, "pt")
          : filters.sort === "antigas"
            ? a.createdAt.localeCompare(b.createdAt)
            : b.createdAt.localeCompare(a.createdAt),
    );
}
