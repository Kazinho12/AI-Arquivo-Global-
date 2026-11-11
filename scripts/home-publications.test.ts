import test from "node:test";
import assert from "node:assert/strict";
import {
  eligibleForHome,
  loadHomeSelection,
  selectHomeWorks,
  summarizeSynopsis,
} from "../src/foundation/features/home/selection";
import type {
  PublishedWork,
  PublicWorksRepository,
} from "../src/foundation/features/catalog/repository";
import type { DiscoveryQuery } from "../src/foundation/features/catalog/discovery";
const work = (
  id: string,
  patch: Partial<PublishedWork> = {},
): PublishedWork => ({
  id,
  title: "Título",
  author: "Autor",
  authorId: "autor",
  authorUsername: "autor",
  format: "Romance",
  genre: "Fantasia",
  language: "pt",
  ageRating: "Livre",
  contentWarnings: [],
  tags: [],
  synopsis: "Sinopse",
  cover: 1,
  origin: "user-publication",
  chapters: [],
  createdAt: "2026-11-11",
  firstPublishedAt: "2026-11-11T12:00:00Z",
  lastPublishedAt: "2026-11-11T12:00:00Z",
  ...patch,
});
test("Home: automatic selection excludes adult, warnings, unknown ages and non-public origins", () => {
  assert.ok(eligibleForHome(work("ok")));
  for (const patch of [
    { ageRating: "+18" },
    { ageRating: "" },
    { contentWarnings: ["Conteúdo sexual"] },
    { contentWarnings: undefined },
    { firstPublishedAt: "invalid" },
    { format: "Fanfiction" as const },
  ])
    assert.equal(eligibleForHome(work("unsafe", patch)), false);
  assert.equal(
    eligibleForHome({
      ...work("local"),
      origin: "original-created-for-project",
    }),
    false,
  );
  for (const ageRating of ["Livre", "+12", "+14", "+16"])
    assert.ok(eligibleForHome(work("age", { ageRating })));
});
test("Home: first publication order, stable ties, five formats and no duplicate hero/cards", () => {
  const formats = [
    "Romance",
    "Conto",
    "Poesia",
    "HQ / Comic",
    "Mangá",
  ] as const;
  const items = formats.map((format, i) => work(String(i), { format }));
  const newest = work("new", {
    firstPublishedAt: "2026-11-12",
    lastPublishedAt: "2026-11-12",
  });
  const selection = selectHomeWorks([
    ...items,
    newest,
    newest,
    work("updated", {
      firstPublishedAt: "2025-01-01",
      lastPublishedAt: "2027-01-01",
    }),
  ]);
  assert.equal(selection.hero?.id, "new");
  assert.equal(selection.recent.length, 6);
  assert.equal(
    new Set([selection.hero!.id, ...selection.recent.map((w) => w.id)]).size,
    7,
  );
  assert.deepEqual(
    selection.recent.slice(0, 5).map((w) => w.format),
    formats,
  );
  assert.deepEqual(selectHomeWorks([]), { hero: null, recent: [] });
  assert.equal(
    selectHomeWorks(Array.from({ length: 20 }, (_, i) => work(String(i))))
      .recent.length,
    6,
  );
});
test("Home: uses bounded public discovery queries and filters server results defensively", async () => {
  const calls: DiscoveryQuery[] = [];
  const repository: PublicWorksRepository = {
    list: async () => {
      throw Error("Must not select from cached catalogue");
    },
    find: async () => null,
    search: async (query) => {
      calls.push(query);
      return {
        items: [work(query.age), work("adult", { ageRating: "+18" })],
        total: 2,
        page: 1,
        size: 12,
      };
    },
  };
  const result = await loadHomeSelection(repository);
  assert.deepEqual(
    calls.map((q) => q.age),
    ["Livre", "+12", "+14", "+16"],
  );
  assert.ok(
    calls.every(
      (q) =>
        q.sort === "recentes" &&
        q.page === 1 &&
        q.size === 12 &&
        !q.format &&
        !q.query,
    ),
  );
  assert.equal(result.recent.length, 3);
  assert.ok(![result.hero, ...result.recent].some((w) => w?.id === "adult"));
});
test("Home: unavailable discovery and partial network failure reject without inventing fallback works", async () => {
  await assert.rejects(loadHomeSelection(null));
  await assert.rejects(
    loadHomeSelection({ list: async () => [], find: async () => null }),
  );
  await assert.rejects(
    loadHomeSelection({
      list: async () => [],
      find: async () => null,
      search: async () => {
        throw Error("offline");
      },
    }),
  );
});
test("Home: synopsis is bounded, whitespace normalized and Unicode preserved", () => {
  assert.equal(
    summarizeSynopsis(" Uma\n sinopse  breve. "),
    "Uma sinopse breve.",
  );
  assert.equal(summarizeSynopsis("😀".repeat(250)), "😀".repeat(239) + "…");
});
