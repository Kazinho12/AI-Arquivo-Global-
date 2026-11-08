import { demoWorks, type Work } from "../data/works";
/** Read-only boundary. A future Supabase adapter can implement this contract. No network or credentials. */
export interface WorksRepository {
  list(): readonly Work[];
  find(id: string): Work | undefined;
}
export const worksRepository: WorksRepository = {
  list: () => demoWorks,
  find: (id) => demoWorks.find((work) => work.id === id),
};
export interface CatalogFilters {
  query: string;
  format: string;
  genre: string;
  sort: string;
}
export function filterWorks(
  works: readonly Work[],
  filters: CatalogFilters,
): Work[] {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase("pt");
  const query = normalize(filters.query.trim());
  return works
    .filter(
      (w) =>
        (!query ||
          normalize(
            [w.title, w.author, w.synopsis, ...w.tags].join(" "),
          ).includes(query)) &&
        (!filters.format || w.format === filters.format) &&
        (!filters.genre || w.genre === filters.genre),
    )
    .sort((a, b) =>
      filters.sort === "titulo"
        ? a.title.localeCompare(b.title, "pt")
        : filters.sort === "autor"
          ? a.author.localeCompare(b.author, "pt")
          : b.createdAt.localeCompare(a.createdAt),
    );
}
