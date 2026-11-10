import {
  inauguralWorks,
  inauguralReading,
} from "../../src/foundation/data/inaugural";
import {
  saveStoredWorks,
  saveStoredActivities,
} from "../../src/foundation/features/studio/store";
import {
  libraryStore,
  saveStoredLists,
} from "../../src/foundation/features/library/store";
export function seedStudioForTest() {
  saveStoredWorks(
    inauguralWorks.map((w) => ({
      id: w.id,
      title: w.title,
      synopsis: w.synopsis,
      format: w.format as "Conto" | "Poesia" | "HQ / Comic" | "Mangá",
      mode: w.readingMode,
      genre: w.genre,
      language: "Português",
      tags: w.tags,
      ageRating: "Livre",
      contentWarnings: [],
      status: "draft",
      coverAccentColor: "#14243B",
      createdAt: w.createdAt,
      updatedAt: w.createdAt,
      chapters: structuredClone(inauguralReading[w.id].chapters),
    })),
  );
  saveStoredActivities([]);
}
export function seedLibraryForTest() {
  for (const work of inauguralWorks)
    libraryStore.addOrUpdate({
      workId: work.id,
      title: work.title,
      author: work.author,
      format: work.format,
      genre: work.genre,
      synopsis: work.synopsis,
      progress: 25,
      isFavorite: true,
      lastReadAtIso: "2026-11-10T10:00:00Z",
      lastReadChapterId: "cap-1",
      lastReadChapterTitle: "Primeira unidade",
      readingListIds: ["lista-ficcao"],
    });
  saveStoredLists([
    {
      id: "lista-ficcao",
      title: "Ficção e Narrativas Especulativas",
      description: "Lista criada explicitamente pelo teste",
      createdAt: "2026-11-10",
      updatedAt: "2026-11-10",
      workIds: [inauguralWorks[0].id],
    },
  ]);
}
