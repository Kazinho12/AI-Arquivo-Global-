import type { Work } from "../../data/works";
import { discoveryFormats, discoveryQuery } from "../catalog/discovery";
import type { PublicWorksRepository } from "../catalog/repository";

// Automatic selection only. A future editorial source can return this same
// contract; public snapshot access and eligibility must remain mandatory.
export interface HomeSelection {
  hero: Work | null;
  recent: Work[];
}
export const homeAges = ["Livre", "+12", "+14", "+16"] as const;
export function eligibleForHome(work: Work): boolean {
  const metadata = work as Work & {
    ageRating?: string;
    contentWarnings?: string[];
    firstPublishedAt?: string;
  };
  return (
    work.origin === "user-publication" &&
    discoveryFormats.includes(work.format) &&
    homeAges.some((age) => age === metadata.ageRating) &&
    Array.isArray(metadata.contentWarnings) &&
    metadata.contentWarnings.length === 0 &&
    Number.isFinite(Date.parse(metadata.firstPublishedAt ?? ""))
  );
}
export function selectHomeWorks(works: Work[]): HomeSelection {
  const unique = new Map<string, Work>();
  for (const work of works) {
    if (eligibleForHome(work)) unique.set(work.id, work);
  }
  const ordered = [...unique.values()].sort((a, b) => {
    const first = (work: Work) =>
      Date.parse(
        (work as Work & { firstPublishedAt: string }).firstPublishedAt,
      );
    return first(b) - first(a) || a.id.localeCompare(b.id);
  });
  return { hero: ordered[0] ?? null, recent: ordered.slice(1, 7) };
}
export async function loadHomeSelection(
  repository: PublicWorksRepository | null,
): Promise<HomeSelection> {
  if (!repository?.search)
    throw Error("As publicações não estão disponíveis neste ambiente.");
  // Positive age filters keep +18 out of each automatic discovery request.
  // Bounded recent pool: at most 12 snapshots per classification, no private data.
  const query = discoveryQuery(new URLSearchParams());
  const pages = await Promise.all(
    homeAges.map((age) => repository.search!({ ...query, age, size: 12 })),
  );
  return selectHomeWorks(pages.flatMap((page) => page.items));
}
export function summarizeSynopsis(value: string, max = 240) {
  const text = value.replace(/\s+/g, " ").trim();
  const chars = Array.from(text);
  return chars.length <= max
    ? text
    : chars
        .slice(0, max - 1)
        .join("")
        .trimEnd() + "…";
}
