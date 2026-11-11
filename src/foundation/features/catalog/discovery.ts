import { normalizeText, slugify } from "../../lib/discovery";
import type { Work } from "../../data/works";
export const discoveryFormats = [
  "Romance",
  "Conto",
  "Poesia",
  "HQ / Comic",
  "Mangá",
];
export const discoveryAges = ["Livre", "+12", "+14", "+16", "+18"];
export interface DiscoveryQuery {
  query: string;
  format: string;
  family: string;
  genre: string;
  language: string;
  age: string;
  tags: string[];
  warnings: string[];
  sort: string;
  scope: string;
  page: number;
  size: number;
}
export interface DiscoveryPage {
  items: Work[];
  total: number;
  page: number;
  size: number;
}
export interface DiscoveryFacets {
  genres: string[];
  languages: string[];
  warnings: string[];
  tags: { key: string; name: string; count: number }[];
}
export const emptyFacets: DiscoveryFacets = {
  genres: [],
  languages: [],
  warnings: [],
  tags: [],
};
export const limitText = (value: string, max: number) =>
  Array.from(value).slice(0, max).join("");
const text = (p: URLSearchParams, key: string, max: number) =>
  limitText((p.get(key) ?? "").trim(), max);
const choice = (v: string, choices: string[], fallback = "") =>
  choices.includes(v) ? v : fallback;
export function discoveryQuery(
  params: URLSearchParams,
  fixedTag?: string,
): DiscoveryQuery {
  const raw = Number(params.get("pagina") ?? 1);
  return {
    query: text(params, "q", 200),
    family: choice(text(params, "familia", 20), ["literaria", "visual"]),
    format: choice(text(params, "formato", 40), discoveryFormats),
    genre: text(params, "genero", 100),
    language: text(params, "idioma", 60),
    age: choice(text(params, "idade", 10), discoveryAges),
    tags: [
      ...new Set(
        [...params.getAll("tag"), ...(fixedTag ? [fixedTag] : [])]
          .map((t) => slugify(limitText(t, 100)))
          .filter(Boolean),
      ),
    ].slice(0, 10),
    warnings: [
      ...new Set(
        params
          .getAll("aviso")
          .map((t) => limitText(t.trim(), 100))
          .filter(Boolean),
      ),
    ].slice(0, 10),
    sort: choice(
      text(params, "ordem", 20),
      ["recentes", "atualizadas", "titulo", "antigas", "autor"],
      "recentes",
    ),
    scope: choice(
      text(params, "campo", 20),
      ["todos", "titulo", "subtitulo", "autor", "sinopse", "tags"],
      "todos",
    ),
    page: Number.isSafeInteger(raw) ? Math.max(1, Math.min(10000, raw)) : 1,
    size: 12,
  };
}
export function localDiscovery(
  works: readonly Work[],
  q: DiscoveryQuery,
): Work[] {
  return works
    .filter((w) => {
      const extra = w as Work & {
        subtitle?: string;
        language?: string;
        ageRating?: string;
        contentWarnings?: string[];
        authorUsername?: string;
      };
      const fields =
        q.scope === "titulo"
          ? w.title
          : q.scope === "subtitulo"
            ? (extra.subtitle ?? "")
            : q.scope === "autor"
              ? w.author + " " + (extra.authorUsername ?? w.authorId)
              : q.scope === "sinopse"
                ? w.synopsis
                : q.scope === "tags"
                  ? w.tags.join(" ")
                  : [
                      w.title,
                      extra.subtitle,
                      w.synopsis,
                      w.author,
                      extra.authorUsername,
                      w.authorId,
                      ...w.tags,
                    ].join(" ");
      return (
        normalizeText(q.query)
          .split(/\s+/)
          .every((term) => normalizeText(fields).includes(term)) &&
        (!q.format || q.format === w.format) &&
        (!q.family ||
          (q.family === "visual") ===
            ["HQ / Comic", "Mangá"].includes(w.format)) &&
        (!q.genre || normalizeText(q.genre) === normalizeText(w.genre)) &&
        (!q.language ||
          normalizeText(q.language) === normalizeText(extra.language ?? "")) &&
        (!q.age || q.age === (extra.ageRating ?? "")) &&
        q.tags.every((t) => w.tags.some((tag) => slugify(tag) === t)) &&
        q.warnings.every((t) =>
          (extra.contentWarnings ?? []).some(
            (v) => normalizeText(v) === normalizeText(t),
          ),
        )
      );
    })
    .sort((a, b) =>
      q.sort === "titulo"
        ? a.title.localeCompare(b.title, "pt")
        : q.sort === "autor"
          ? a.author.localeCompare(b.author, "pt")
          : q.sort === "antigas"
            ? a.createdAt.localeCompare(b.createdAt)
            : b.createdAt.localeCompare(a.createdAt),
    );
}
