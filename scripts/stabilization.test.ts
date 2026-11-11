import { webcrypto } from "node:crypto";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { libraryStore } from "../src/foundation/features/library/store";
import { studioStore } from "../src/foundation/features/studio/store";
import {
  bindScope,
  currentScope,
  exportLocal,
  importLocal,
  inScope,
  legacySnapshot,
  localWarnings,
  retryLocal,
  parseLegacy,
  scopedKey,
  selectScope,
} from "../src/foundation/features/local/persistence";
import {
  recordReading,
  savedPosition,
} from "../src/foundation/features/reader/progress";
import { demoReadingLibrary } from "../src/foundation/features/reader/data";
import {
  MAX_IMAGE_BYTES,
  storeImage,
  loadImage,
  exportImages,
  validateImage,
} from "../src/foundation/features/local/images";

Object.defineProperty(globalThis, "crypto", {
  configurable: true,
  value: webcrypto,
});
const storage = new Map<string, string>();
let failure = "";
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem(key: string) {
      if (failure === "read") throw new Error("blocked");
      return storage.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      if (failure)
        throw new DOMException(
          "blocked",
          failure === "quota" ? "QuotaExceededError" : "SecurityError",
        );
      storage.set(key, value);
    },
  },
});
const work = {
  title: "Rascunho privado",
  synopsis: "Texto",
  format: "Romance" as const,
  mode: "prose" as const,
  genre: "Geral",
  language: "Português",
  tags: [],
  ageRating: "Livre" as const,
  contentWarnings: [],
  status: "draft" as const,
  coverAccentColor: "#112233",
  chapters: [
    { id: "cap-1", title: "Capítulo", number: 1, content: "Original" },
  ],
};

test("AG-06: guest, two users and stale actions remain isolated; legacy is not adopted", () => {
  storage.set(
    "ag_studio_works_v1",
    JSON.stringify([
      { ...work, id: "old", createdAt: "2026-01-01", updatedAt: "today" },
    ]),
  );
  selectScope("user:a");
  assert.deepEqual(studioStore.getWorks(), []);
  const a = studioStore.createWork({ ...work, id: "private-a" });
  const stale = bindScope(studioStore, currentScope());
  selectScope("user:b");
  assert.deepEqual(studioStore.getWorks(), []);
  stale.updateWork(a.id, { title: "Still A" });
  assert.deepEqual(studioStore.getWorks(), []);
  studioStore.createWork({ ...work, id: "private-b" });
  selectScope("guest");
  assert.ok(!studioStore.getWork("private-a"));
  assert.ok(!studioStore.getWork("private-b"));
  selectScope("user:a");
  assert.equal(studioStore.getWork(a.id)?.title, "Still A");
  assert.ok(!studioStore.getWork("old"));
  assert.ok(storage.has("ag_studio_works_v1"));
});
for (const fault of ["read", "quota", "write"])
  test(`AG-02: ${fault} failures retain the latest content in memory and export`, () => {
    selectScope(`user:fault-${fault}`);
    failure = fault;
    const created = studioStore.createWork({ ...work, id: `fault-${fault}` });
    studioStore.updateChapter(created.id, "cap-1", {
      content: "Edição recuperável",
    });
    assert.equal(
      studioStore.getWork(created.id)?.chapters[0].content,
      "Edição recuperável",
    );
    assert.ok(localWarnings().length);
    assert.ok(JSON.stringify(exportLocal()).includes("Edição recuperável"));
    failure = "";
    studioStore.updateChapter(created.id, "cap-1", { content: "Persistido" });
    assert.ok(
      storage.get(scopedKey("ag_studio_works_v1"))?.includes("Persistido"),
    );
    retryLocal();
    assert.equal(localWarnings().length, 0);
  });
test("AG-06: explicit legacy recovery preserves originals and conflicting destination drafts", () => {
  selectScope("user:recovery");
  const snapshot = legacySnapshot();
  const data = parseLegacy(snapshot);
  assert.throws(() => importLocal(data, false, currentScope()));
  studioStore.createWork({ ...work, id: "old", title: "Destino" });
  assert.equal(importLocal(data, true, currentScope()), 1);
  assert.equal(studioStore.getWork("old")?.title, "Destino");
  assert.ok(
    studioStore
      .getWorks()
      .some((item) => item.id.startsWith("old-recuperado-")),
  );
  assert.deepEqual(legacySnapshot(), snapshot);
  assert.throws(() => importLocal(data, true, "user:another"));
  assert.throws(() =>
    importLocal({ ag_studio_works_v1: [{}] }, true, currentScope()),
  );
});
test("AG-02: malformed saved JSON is retained and is not overwritten by edits", () => {
  selectScope("user:damaged");
  const key = scopedKey("ag_studio_works_v1");
  storage.set(key, "{broken");
  studioStore.createWork({ ...work, id: "memory-only" });
  assert.equal(storage.get(key), "{broken");
  assert.equal(exportLocal().originals.ag_studio_works_v1, "{broken");
  assert.ok(studioStore.getWork("memory-only"));
});
for (const data of Object.values(demoReadingLibrary))
  test(`AG-05: ${data.mode} records unique history, position, completion and isolated progress`, () => {
    selectScope(`user:reader-${data.mode}`);
    const input = {
      ...data,
      workTitle: data.title,
      currentChapter: data.chapters[0],
      position: 0,
    };
    recordReading(input);
    assert.equal(libraryStore.getEntry(data.workId)?.status, "reading");
    recordReading({ ...input, position: 0.5 });
    assert.equal(savedPosition(data.workId, input.currentChapter.id), 0.5);
    assert.ok(libraryStore.getEntry(data.workId)?.lastReadAtIso);
    recordReading({
      ...input,
      currentChapter: data.chapters.at(-1)!,
      position: 1,
    });
    assert.equal(libraryStore.getEntry(data.workId)?.status, "completed");
    assert.equal(libraryStore.getEntries().length, 1);
    const savedRaw = JSON.parse(
      storage.get(scopedKey("ag_library_entries_v1"))!,
    );
    const saved = savedRaw.data ?? savedRaw;
    assert.equal(saved[0].progress, 100);
    inScope("user:other-reader", () =>
      assert.deepEqual(libraryStore.getEntries(), []),
    );
  });
const png = () =>
  new Blob([Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10)], {
    type: "image/png",
  });
test("AG-08: invalid type, signature, empty and oversized images are rejected", async () => {
  for (const blob of [
    new Blob(["<svg/>"], { type: "image/svg+xml" }),
    new Blob(["fake"], { type: "image/png" }),
    new Blob([], { type: "image/png" }),
    new Blob([new Uint8Array(MAX_IMAGE_BYTES + 1)], { type: "image/png" }),
  ])
    await assert.rejects(validateImage(blob));
});
test("AG-08: unavailable IndexedDB retains bytes in memory for export and isolates accounts", async () => {
  selectScope("user:image-a");
  const result = await storeImage(png());
  assert.equal(result.persisted, false);
  assert.ok(!result.reference.startsWith("blob:"));
  assert.deepEqual(
    await (await loadImage(result.reference))?.arrayBuffer(),
    await png().arrayBuffer(),
  );
  assert.equal((await exportImages()).length, 1);
  selectScope("user:image-b");
  await assert.rejects(loadImage(result.reference));
});
test("AG-03/04: both migration paths include hardened provisioning and isolated non-destructive backfill", () => {
  for (const name of [
    "20261109000000_create_profiles_table.sql",
    "20261110000000_harden_profile_provisioning.sql",
  ]) {
    const sql = readFileSync(`supabase/migrations/${name}`, "utf8");
    assert.ok(sql.includes("SET search_path = ''"));
    assert.ok(sql.includes("FOR attempt IN 0..63"));
    assert.ok(sql.includes("ON CONFLICT DO NOTHING"));
    assert.ok(sql.includes("WHERE p.id IS NULL"));
    assert.ok(sql.includes("EXCEPTION WHEN OTHERS"));
    assert.match(
      sql,
      /REVOKE (?:ALL|EXECUTE) ON FUNCTION public\.ensure_user_profile\([^;]+\) FROM PUBLIC, anon, authenticated;/,
    );
    assert.ok(!/DELETE FROM|TRUNCATE/i.test(sql));
  }
});
