import type { CoverImage } from "../features/media/covers";
import type { CoverStyle } from "./covers";
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
  origin?: "user-publication" | "original-created-for-project";
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  authorId: string;
  format: WorkFormat;
  genre: string;
  tags: string[];
  synopsis: string;
  createdAt: string;
  cover: number;
  coverAccentColor?: string;
  coverStyle?: CoverStyle;
  coverSeed?: number;
  coverImage?: CoverImage | null;
  /** Compatibility marker for local-only records, never a public publication. */
  demo?: true;
}
// Legacy local-only consumers have no bundled publications.
export const demoWorks: Work[] = [];
export const demoAuthors: {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  createdAt: string;
}[] = [];
