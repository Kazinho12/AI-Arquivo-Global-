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
} from "./fixtures/editorial-fixture";
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
test("public catalog contains no bundled works, profiles or collections", async () => {
  assert.deepEqual(worksRepository.list(), []);
  assert.equal(getWorkReadingData("ag-carta-abertura"), undefined);
  assert.equal(resolveDemoProfile("equipa-editorial"), null);
  assert.deepEqual(findAuthorWorks("ag-editorial-team"), []);
  const collections = await completionService.read("collections", {
    demo: true,
    viewerId: null,
  });
  assert.ok(collections.status === "ready" && collections.data.length === 0);
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
