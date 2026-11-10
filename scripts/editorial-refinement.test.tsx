import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import {
  inauguralCatalog,
  inauguralWorks,
  inauguralReading,
  inauguralCollections,
  editorialIdentity,
  editorialDate,
} from "../src/foundation/data/inaugural";
import {
  worksRepository,
  filterWorks,
} from "../src/foundation/lib/worksRepository";
import { getWorkReadingData } from "../src/foundation/features/reader/data";
import {
  findAuthorWorks,
  resolveDemoProfile,
} from "../src/foundation/features/profile/service";
import { ProseReader } from "../src/foundation/features/reader/ProseReader";
import { PoetryReader } from "../src/foundation/features/reader/PoetryReader";
import { ComicReader } from "../src/foundation/features/reader/ComicReader";
import { MangaReader } from "../src/foundation/features/reader/MangaReader";
import { studioStore } from "../src/foundation/features/studio/store";
import { libraryStore } from "../src/foundation/features/library/store";
import { selectScope } from "../src/foundation/features/local/persistence";
import { completionService } from "../src/foundation/features/completion/data";
test("E: canonical catalog has unique stable IDs and serializable import metadata", () => {
  assert.equal(inauguralWorks.length, 4);
  assert.equal(new Set(inauguralWorks.map((w) => w.id)).size, 4);
  assert.deepEqual(worksRepository.list(), inauguralCatalog.works);
  assert.equal(inauguralCatalog.schemaVersion, 1);
  assert.deepEqual(
    JSON.parse(JSON.stringify(inauguralCatalog)).works,
    inauguralWorks,
  );
  for (const w of inauguralWorks) {
    assert.ok(w.id.startsWith("ag-"));
    assert.equal(w.originalAuthorId, editorialIdentity.id);
    assert.equal(w.authorId, editorialIdentity.id);
    assert.equal(w.publisherId, inauguralCatalog.publishers[0].id);
    assert.notEqual(w.ownerId, w.authorId);
    assert.equal(w.origin, "original-created-for-project");
    assert.equal(w.publicationStatus, "prepared-local");
    assert.equal(w.publishedAt, null);
    assert.equal(w.preparedAt, editorialDate);
    assert.ok(existsSync("public" + w.coverAsset));
    assert.ok(!w.demo);
  }
});
test("E: every chapter is explicit, ordered and tied to a compatible work; missing content never falls back", () => {
  for (const work of inauguralWorks) {
    const data = getWorkReadingData(work.id)!;
    assert.equal(data.title, work.title);
    assert.equal(data.author, work.author);
    assert.equal(data.mode, work.readingMode);
    assert.ok(data.chapters.length >= 2);
    assert.equal(
      new Set(data.chapters.map((c) => c.id)).size,
      data.chapters.length,
    );
    data.chapters.forEach((chapter, i) => {
      assert.equal(chapter.number, i + 1);
      if (data.mode === "prose") assert.ok(chapter.content && !chapter.pages);
      if (data.mode === "poetry") assert.ok(chapter.stanzas?.length);
      if (["comic", "manga"].includes(data.mode)) {
        assert.ok(chapter.pages?.length);
        chapter.pages?.forEach((page, j) => {
          assert.equal(page.number, j + 1);
          assert.ok(page.description);
          assert.ok(page.imageUrl && existsSync("public" + page.imageUrl));
        });
      }
    });
  }
  for (const id of ["unknown", "atlas-das-mares", "casa-chuva"])
    assert.equal(
      getWorkReadingData(id, "Romance", "Fake", "Fake author"),
      undefined,
    );
});
test("E: collections, taxonomy and all relations reference only canonical editorial data", () => {
  for (const c of inauguralCollections) {
    assert.equal(c.publicationStatus, "prepared-local");
    assert.equal(c.visibility, "public-preview");
    assert.ok(c.workIds.every((id) => worksRepository.find(id)));
    assert.equal(new Set(c.workIds).size, c.workIds.length);
  }
  for (const work of inauguralWorks) {
    assert.ok(inauguralCatalog.taxonomy.genres.includes(work.genre));
    assert.ok(
      work.tags.every((tag) => inauguralCatalog.taxonomy.tags.includes(tag)),
    );
  }
});
test("E: editorial identity is not a real user or privilege; no name-based attribution", () => {
  assert.equal(
    resolveDemoProfile("equipa-editorial")?.id,
    editorialIdentity.id,
  );
  assert.equal(resolveDemoProfile("equipa_editorial"), null);
  assert.deepEqual(findAuthorWorks("a-real-user-id"), []);
  assert.deepEqual(findAuthorWorks(editorialIdentity.displayName), []);
  assert.equal(findAuthorWorks(editorialIdentity.id).length, 4);
  assert.ok(
    !("role" in editorialIdentity) && !("isAdmin" in editorialIdentity),
  );
});
for (const [index, Reader] of [
  ProseReader,
  PoetryReader,
  ComicReader,
  MangaReader,
].entries())
  test(`E: reader ${index} renders prepared content and canonical unit navigation`, () => {
    const work = inauguralWorks[index],
      data = inauguralReading[work.id];
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Reader
          workId={work.id}
          workTitle={work.title}
          author={work.author}
          chapters={data.chapters}
          currentChapter={data.chapters[0]}
        />
      </MemoryRouter>,
    );
    assert.ok(html.includes(data.chapters[0].title));
    assert.ok(html.includes(work.title));
    assert.ok(!html.includes("Capítulo de Amostra"));
    assert.ok(!html.includes("Autor fictício"));
  });
test("E: editorial catalog never seeds a user's private workspace; private drafts never enter discovery", () => {
  selectScope("user:editorial-isolation-test");
  assert.deepEqual(studioStore.getWorks(), []);
  assert.deepEqual(libraryStore.getEntries(), []);
  assert.deepEqual(libraryStore.getLists(), []);
  const work = studioStore.createWork({
    title: "Privado e só meu",
    synopsis: "Texto de teste",
    format: "Conto",
    mode: "prose",
    genre: "Local",
    language: "Português",
    tags: [],
    ageRating: "Livre",
    contentWarnings: [],
    status: "draft",
    coverAccentColor: "#123456",
    chapters: [],
  });
  assert.equal(worksRepository.find(work.id), undefined);
  assert.equal(
    filterWorks(worksRepository.list(), {
      query: work.title,
      format: "",
      genre: "",
      sort: "titulo",
    }).length,
    0,
  );
  assert.equal(studioStore.getStats().estimatedReads, null);
  selectScope("user:another-reader");
  assert.deepEqual(studioStore.getWorks(), []);
  selectScope("user:editorial-isolation-test");
  assert.ok(studioStore.getWork(work.id));
  selectScope("guest");
});
test("E: no request flag or user identity fabricates social or operational data", async () => {
  for (const name of [
    "followers",
    "notifications",
    "reports",
    "logs",
    "monitoring",
    "services",
  ] as const)
    for (const demo of [true, false]) {
      const result = await completionService.read(name, {
        demo,
        viewerId: "admin",
        subject: editorialIdentity.username,
      });
      assert.ok(result.status !== "ready");
      assert.ok(!("data" in result));
    }
  const text = JSON.stringify(inauguralCatalog);
  for (const word of [
    '"likes"',
    '"followers"',
    '"views"',
    '"rating"',
    '"suspensions"',
  ])
    assert.ok(!text.includes(word));
});
test("E: removed audience formulas and original local validation/security protections remain", () => {
  const studio = readFileSync(
      "src/foundation/features/studio/store.ts",
      "utf8",
    ),
    page = readFileSync("src/foundation/pages/Studio.tsx", "utf8");
  assert.ok(!studio.includes("* 480") && !page.includes("78%"));
  assert.ok(
    readFileSync(
      "src/foundation/features/local/persistence.ts",
      "utf8",
    ).includes("backup:v2"),
  );
  const css = readFileSync("src/foundation/styles/global.css", "utf8");
  assert.ok(
    css.includes(":root.high-contrast") &&
      css.includes("prefers-reduced-motion"),
  );
});
