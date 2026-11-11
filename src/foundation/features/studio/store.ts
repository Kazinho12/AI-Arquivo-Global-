import { useMemo } from "react";
import { useRemoteWorks } from "./RemoteWorksProvider";
import { localId } from "../local/id";
import {
  bindScope,
  localSnapshot,
  useLocalCollection,
  notifyLocal,
  currentScope,
  readLocal,
  registerLocal,
  useLocalRevision,
  writeLocal,
} from "../local/persistence";
import { validCollection } from "../local/validation";
import type {
  StudioWork,
  EditorialActivity,
  StudioStats,
  MediaItem,
  WorkFormat,
} from "./types";
import type { Chapter } from "../reader/types";

const STORAGE_KEY_WORKS = "ag_studio_works_v1";
const STORAGE_KEY_ACTIVITIES = "ag_studio_activities_v1";
const STORAGE_KEY_MEDIA = "ag_studio_media_v1";

const initialSeedWorks: StudioWork[] = [];
const initialSeedActivities: EditorialActivity[] = [];
const initialSeedMedia: MediaItem[] = [];

registerLocal(STORAGE_KEY_WORKS, initialSeedWorks, (value) =>
  validCollection("works", value),
);
export const getStoredWorks = () => readLocal<StudioWork>(STORAGE_KEY_WORKS);
export const saveStoredWorks = (value: StudioWork[]) =>
  writeLocal(STORAGE_KEY_WORKS, value);

registerLocal(STORAGE_KEY_ACTIVITIES, initialSeedActivities, (value) =>
  validCollection("activities", value),
);
export const getStoredActivities = () =>
  readLocal<EditorialActivity>(STORAGE_KEY_ACTIVITIES);
export const saveStoredActivities = (value: EditorialActivity[]) =>
  writeLocal(STORAGE_KEY_ACTIVITIES, value);

registerLocal(STORAGE_KEY_MEDIA, initialSeedMedia, (value) =>
  validCollection("media", value),
);
export const getStoredMedia = () => readLocal<MediaItem>(STORAGE_KEY_MEDIA);
export const saveStoredMedia = (value: MediaItem[]) =>
  writeLocal(STORAGE_KEY_MEDIA, value);

const statsCache = new WeakMap<StudioWork[], StudioStats>();
export const studioStore = {
  getWorks: getStoredWorks,

  getWork(id: string): StudioWork | undefined {
    return getStoredWorks().find((w) => w.id === id);
  },

  createWork(
    workData: Omit<StudioWork, "id" | "createdAt" | "updatedAt"> & {
      id?: string;
    },
  ): StudioWork {
    const works = getStoredWorks();
    const id = workData.id || `obra-${localId()}`;
    const newWork: StudioWork = {
      ...workData,
      id,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: "Agora mesmo",
      chapters: workData.chapters || [
        {
          id: "cap-1",
          number: 1,
          title:
            workData.mode === "poetry"
              ? "Primeiro Poema"
              : workData.mode === "comic" || workData.mode === "manga"
                ? "Ato I"
                : "Capítulo 1",
          content:
            workData.mode === "poetry"
              ? undefined
              : "Começa aqui a escrever o primeiro capítulo da tua história...",
          stanzas:
            workData.mode === "poetry"
              ? [
                  [
                    "Escreve aqui o primeiro verso,",
                    "e a estrofe que inaugura a tua obra.",
                  ],
                ]
              : undefined,
          pages:
            workData.mode === "comic" || workData.mode === "manga"
              ? [
                  {
                    id: "p-1",
                    number: 1,
                    title: "Página de Abertura",
                    description: "Primeira cena da narrativa visual.",
                    aspectRatio: "3/4",
                    accentColor: "#1A2B44",
                    caption: "",
                  },
                ]
              : undefined,
        },
      ],
    };
    works.unshift(newWork);
    saveStoredWorks(works);

    studioStore.addActivity(
      newWork.id,
      newWork.title,
      "draft_created",
      `Obra criada em formato ${newWork.format}.`,
    );

    return newWork;
  },

  updateWork(id: string, partial: Partial<StudioWork>): StudioWork | undefined {
    const works = getStoredWorks();
    const index = works.findIndex((w) => w.id === id);
    if (index < 0) return undefined;

    works[index] = {
      ...works[index],
      ...partial,
      updatedAt: "Agora mesmo",
    };
    saveStoredWorks(works);

    studioStore.addActivity(
      works[index].id,
      works[index].title,
      "metadata_update",
      "Metadados e configuração da obra atualizados.",
    );

    return works[index];
  },

  duplicateWork(id: string): StudioWork | undefined {
    const works = getStoredWorks();
    const source = works.find((w) => w.id === id);
    if (!source) return undefined;

    const copy: StudioWork = {
      ...source,
      id: `${source.id}-copia-${localId()}`,
      title: `${source.title} (Cópia)`,
      status: "draft",
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: "Agora mesmo",
      chapters: JSON.parse(JSON.stringify(source.chapters)),
    };
    works.unshift(copy);
    saveStoredWorks(works);

    studioStore.addActivity(
      copy.id,
      copy.title,
      "draft_created",
      `Cópia criada a partir de ${source.title}.`,
    );

    return copy;
  },

  deleteWork(id: string): boolean {
    const works = getStoredWorks();
    const remaining = works.filter((w) => w.id !== id);
    if (remaining.length === works.length) return false;
    saveStoredWorks(remaining);
    return true;
  },

  archiveWork(id: string): boolean {
    const works = getStoredWorks();
    const work = works.find((w) => w.id === id);
    if (!work) return false;
    work.status = work.status === "archived" ? "draft" : "archived";
    work.updatedAt = "Agora mesmo";
    saveStoredWorks(works);
    return true;
  },

  addChapter(workId: string, title?: string): Chapter | undefined {
    const works = getStoredWorks();
    const work = works.find((w) => w.id === workId);
    if (!work) return undefined;

    const nextNumber = work.chapters.length + 1;
    const newChapter: Chapter = {
      id: `cap-${localId()}`,
      number: nextNumber,
      title:
        title ||
        (work.mode === "poetry"
          ? `Poema ${nextNumber}`
          : `Capítulo ${nextNumber}`),
      content: work.mode === "poetry" ? undefined : "",
      stanzas: work.mode === "poetry" ? [["Novo verso..."]] : undefined,
      pages:
        work.mode === "comic" || work.mode === "manga"
          ? [
              {
                id: `p-${localId()}`,
                number: 1,
                title: "Nova Página",
                description: "Descrição visual da cena.",
                aspectRatio: "3/4",
                accentColor: "#1A2B44",
              },
            ]
          : undefined,
    };

    work.chapters.push(newChapter);
    work.updatedAt = "Agora mesmo";
    saveStoredWorks(works);

    studioStore.addActivity(
      work.id,
      work.title,
      "chapter_added",
      `Adicionado ${newChapter.title}.`,
    );

    return newChapter;
  },

  updateChapter(
    workId: string,
    chapterId: string,
    partial: Partial<Chapter>,
  ): Chapter | undefined {
    const works = getStoredWorks();
    const work = works.find((w) => w.id === workId);
    if (!work) return undefined;

    const chapterIndex = work.chapters.findIndex((c) => c.id === chapterId);
    if (chapterIndex < 0) return undefined;

    work.chapters[chapterIndex] = {
      ...work.chapters[chapterIndex],
      ...partial,
    };
    work.updatedAt = "Agora mesmo";
    saveStoredWorks(works);

    return work.chapters[chapterIndex];
  },

  reorderChapters(workId: string, newOrderChapterIds: string[]): boolean {
    const works = getStoredWorks();
    const work = works.find((w) => w.id === workId);
    if (!work) return false;

    const map = new Map(work.chapters.map((c) => [c.id, c]));
    if (
      newOrderChapterIds.length !== work.chapters.length ||
      new Set(newOrderChapterIds).size !== work.chapters.length ||
      newOrderChapterIds.some((id) => !map.has(id))
    )
      return false;
    const reordered: Chapter[] = [];
    newOrderChapterIds.forEach((id, idx) => {
      const c = map.get(id);
      if (c) {
        reordered.push({ ...c, number: idx + 1 });
      }
    });

    work.chapters = reordered;
    work.updatedAt = "Agora mesmo";
    saveStoredWorks(works);
    return true;
  },

  duplicateChapter(workId: string, chapterId: string): Chapter | undefined {
    const works = getStoredWorks();
    const work = works.find((w) => w.id === workId);
    if (!work) return undefined;

    const source = work.chapters.find((c) => c.id === chapterId);
    if (!source) return undefined;

    const copy: Chapter = {
      ...JSON.parse(JSON.stringify(source)),
      id: `cap-${localId()}`,
      number: work.chapters.length + 1,
      title: `${source.title} (Cópia)`,
    };
    work.chapters.push(copy);
    work.updatedAt = "Agora mesmo";
    saveStoredWorks(works);
    return copy;
  },

  deleteChapter(workId: string, chapterId: string): boolean {
    const works = getStoredWorks();
    const work = works.find((w) => w.id === workId);
    if (!work || work.chapters.length <= 1) return false; // keep at least 1 chapter

    work.chapters = work.chapters
      .filter((c) => c.id !== chapterId)
      .map((c, idx) => ({ ...c, number: idx + 1 }));
    work.updatedAt = "Agora mesmo";
    saveStoredWorks(works);
    return true;
  },

  // Pages for Visual works
  addPage(workId: string, chapterId: string, pageData?: any): any {
    const works = getStoredWorks();
    const work = works.find((w) => w.id === workId);
    if (!work) return undefined;

    const chapter = work.chapters.find((c) => c.id === chapterId);
    if (!chapter) return undefined;

    chapter.pages = chapter.pages || [];
    const newPage = {
      id: `p-${localId()}`,
      number: chapter.pages.length + 1,
      title: pageData?.title || `Página ${chapter.pages.length + 1}`,
      description:
        pageData?.description ||
        "Descrição de cena e composição de enquadramento.",
      aspectRatio: "3/4",
      accentColor: pageData?.accentColor || "#1E2A38",
      caption: pageData?.caption || "",
      imageUrl: pageData?.imageUrl,
    };
    chapter.pages.push(newPage);
    work.updatedAt = "Agora mesmo";
    saveStoredWorks(works);

    studioStore.addActivity(
      work.id,
      work.title,
      "page_added",
      `Adicionada ${newPage.title}.`,
    );

    return newPage;
  },

  updatePage(
    workId: string,
    chapterId: string,
    pageId: string,
    partial: any,
  ): any {
    const works = getStoredWorks();
    const work = works.find((w) => w.id === workId);
    if (!work) return undefined;

    const chapter = work.chapters.find((c) => c.id === chapterId);
    if (!chapter || !chapter.pages) return undefined;

    const pageIndex = chapter.pages.findIndex((p) => p.id === pageId);
    if (pageIndex < 0) return undefined;

    chapter.pages[pageIndex] = {
      ...chapter.pages[pageIndex],
      ...partial,
    };
    work.updatedAt = "Agora mesmo";
    saveStoredWorks(works);

    return chapter.pages[pageIndex];
  },

  reorderPages(
    workId: string,
    chapterId: string,
    newOrderPageIds: string[],
  ): boolean {
    const works = getStoredWorks();
    const work = works.find((w) => w.id === workId);
    if (!work) return false;

    const chapter = work.chapters.find((c) => c.id === chapterId);
    if (!chapter || !chapter.pages) return false;

    const map = new Map(chapter.pages.map((p) => [p.id, p]));
    if (
      newOrderPageIds.length !== chapter.pages.length ||
      new Set(newOrderPageIds).size !== chapter.pages.length ||
      newOrderPageIds.some((id) => !map.has(id))
    )
      return false;
    const reordered: any[] = [];
    newOrderPageIds.forEach((id, idx) => {
      const p = map.get(id);
      if (p) {
        reordered.push({ ...p, number: idx + 1 });
      }
    });

    chapter.pages = reordered;
    work.updatedAt = "Agora mesmo";
    saveStoredWorks(works);
    return true;
  },

  deletePage(workId: string, chapterId: string, pageId: string): boolean {
    const works = getStoredWorks();
    const work = works.find((w) => w.id === workId);
    if (!work) return false;

    const chapter = work.chapters.find((c) => c.id === chapterId);
    if (!chapter || !chapter.pages || chapter.pages.length <= 1) return false;

    chapter.pages = chapter.pages
      .filter((p) => p.id !== pageId)
      .map((p, idx) => ({ ...p, number: idx + 1 }));
    work.updatedAt = "Agora mesmo";
    saveStoredWorks(works);
    return true;
  },

  getActivities: getStoredActivities,

  addActivity(
    workId: string,
    workTitle: string,
    type: EditorialActivity["type"],
    description: string,
  ) {
    const activities = getStoredActivities();
    const newAct: EditorialActivity = {
      id: `act-${localId()}`,
      workId,
      workTitle,
      type,
      description,
      timestamp: "Agora mesmo",
    };
    activities.unshift(newAct);
    if (activities.length > 25) activities.pop();
    saveStoredActivities(activities);
  },

  getMediaItems: getStoredMedia,

  addMediaItem(item: Omit<MediaItem, "id" | "createdAt">): MediaItem {
    const media = getStoredMedia();
    const newItem: MediaItem = {
      ...item,
      id: `med-${localId()}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    media.unshift(newItem);
    saveStoredMedia(media);
    return newItem;
  },

  deleteMediaItem(id: string): boolean {
    const media = getStoredMedia();
    const item = media.find((m) => m.id === id);
    if (
      item &&
      item.isLocalObjectUrl &&
      typeof window !== "undefined" &&
      window.URL
    ) {
      try {
        window.URL.revokeObjectURL(item.url);
      } catch {
        // ignore
      }
    }
    const remaining = media.filter((m) => m.id !== id);
    saveStoredMedia(remaining);
    return true;
  },

  getStats(): StudioStats {
    const works = localSnapshot<StudioWork>(STORAGE_KEY_WORKS);
    const cached = statsCache.get(works);
    if (cached) return cached;
    const totalWorks = works.length;
    const draftsCount = works.filter((w) => w.status === "draft").length;
    const publishedCount = works.filter((w) => w.status === "published").length;

    let totalWords = 0;
    let totalChapters = 0;

    works.forEach((w) => {
      totalChapters += w.chapters.length;
      w.chapters.forEach((c) => {
        if (c.content) {
          totalWords += c.content.trim().split(/\s+/).filter(Boolean).length;
        } else if (c.stanzas) {
          c.stanzas.forEach((stanza) => {
            stanza.forEach((verse) => {
              totalWords += verse.trim().split(/\s+/).filter(Boolean).length;
            });
          });
        }
      });
    });

    const estimatedReads = null;
    const avgReadTimeMinutes = Math.ceil(totalWords / 200);

    const stats = {
      totalWorks,
      draftsCount,
      publishedCount,
      totalWords,
      totalChapters,
      estimatedReads,
      avgReadTimeMinutes,
    };
    statsCache.set(works, stats);
    return stats;
  },
};

export function useStudio() {
  const localWorks = useLocalCollection<StudioWork>(STORAGE_KEY_WORKS);
  const remote = useRemoteWorks();
  const works = useMemo(
    () => [
      ...remote.works,
      ...localWorks.map((work) => ({ ...work, persistence: undefined })),
    ],
    [remote.works, localWorks],
  );
  const accountWorks = remote.works;
  const activeWorks = accountWorks.filter((work) => !work.archivedAt);
  const totalWords = activeWorks.reduce(
    (sum, work) =>
      sum +
      work.chapters.reduce(
        (count, entry) =>
          count +
          (entry.content ?? "").trim().split(/\s+/).filter(Boolean).length,
        0,
      ),
    0,
  );
  const accountStats = {
    totalWorks: activeWorks.length,
    draftsCount: activeWorks.length,
    publishedCount: 0,
    totalChapters: activeWorks.reduce(
      (count, work) => count + work.chapters.length,
      0,
    ),
    totalWords,
    estimatedReads: null,
    avgReadTimeMinutes: Math.ceil(totalWords / 200),
  };
  const activities = useLocalCollection<EditorialActivity>(
    STORAGE_KEY_ACTIVITIES,
  );
  const media = useLocalCollection<MediaItem>(STORAGE_KEY_MEDIA);
  return {
    works,
    activities,
    media,
    remote,
    accountWorks,
    activeWorks,
    stats: accountStats,
    store: bindScope(studioStore, currentScope()),
    refresh: notifyLocal,
  };
}
