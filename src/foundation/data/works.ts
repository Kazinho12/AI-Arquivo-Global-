export const formats = [
  "Romance",
  "Conto",
  "Poesia",
  "Série literária",
  "HQ / Comic",
  "Mangá",
  "Obra ilustrada",
  "Fanfiction",
] as const;
export type WorkFormat = (typeof formats)[number];
export interface Work {
  id: string;
  title: string;
  author: string;
  authorId: string;
  format: WorkFormat;
  genre: string;
  tags: string[];
  synopsis: string;
  createdAt: string;
  cover: number;
  /** Legacy consumers may still hold demo records; the inaugural catalog does not use this flag. */
  demo?: true;
}
// Compatibility aliases for callers/tests of the previous read-only repository.
// The only active catalog is defined in inaugural.ts; these are not independent fixtures.
export {
  inauguralWorks as demoWorks,
  editorialAuthors as demoAuthors,
} from "./inaugural";
