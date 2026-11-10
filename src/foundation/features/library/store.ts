import { localId } from "../local/id";
import {
  bindScope,
  useLocalCollection,
  notifyLocal,
  currentScope,
  readLocal,
  registerLocal,
  useLocalRevision,
  writeLocal,
} from "../local/persistence";
import { validCollection } from "../local/validation";
import type { LibraryEntry, ReadingList } from "./types";

const STORAGE_KEY_ENTRIES = "ag_library_entries_v1";
const STORAGE_KEY_LISTS = "ag_library_lists_v1";

const initialSeedEntries: LibraryEntry[] = [];
const initialSeedLists: ReadingList[] = [];

registerLocal(STORAGE_KEY_ENTRIES, initialSeedEntries, (value) =>
  validCollection("entries", value),
);
export const getStoredEntries = () =>
  readLocal<LibraryEntry>(STORAGE_KEY_ENTRIES);
export const saveStoredEntries = (value: LibraryEntry[]) =>
  writeLocal(STORAGE_KEY_ENTRIES, value);

registerLocal(STORAGE_KEY_LISTS, initialSeedLists, (value) =>
  validCollection("lists", value),
);
export const getStoredLists = () => readLocal<ReadingList>(STORAGE_KEY_LISTS);
export const saveStoredLists = (value: ReadingList[]) =>
  writeLocal(STORAGE_KEY_LISTS, value);

// Store functions
export const libraryStore = {
  getEntries: getStoredEntries,

  getEntry(workId: string): LibraryEntry | undefined {
    return getStoredEntries().find((e) => e.workId === workId);
  },

  addOrUpdate(
    entry: Partial<LibraryEntry> & {
      workId: string;
      title: string;
      author: string;
      format: string;
    },
  ) {
    const entries = getStoredEntries();
    const existingIndex = entries.findIndex((e) => e.workId === entry.workId);

    if (existingIndex >= 0) {
      entries[existingIndex] = {
        ...entries[existingIndex],
        ...entry,
        lastReadAt: new Date().toLocaleString("pt-PT"),
      };
    } else {
      const newEntry: LibraryEntry = {
        workId: entry.workId,
        title: entry.title,
        author: entry.author,
        format: entry.format,
        genre: entry.genre || "Geral",
        synopsis: entry.synopsis || "",
        progress: entry.progress ?? 0,
        lastReadChapterId: entry.lastReadChapterId || "cap-1",
        lastReadChapterTitle: entry.lastReadChapterTitle || "Capítulo 1",
        lastReadAt: new Date().toLocaleString("pt-PT"),
        status: entry.status || "reading",
        isFavorite: entry.isFavorite ?? false,
        readingListIds: entry.readingListIds || [],
        lastReadPosition: entry.lastReadPosition,
        lastReadAtIso: entry.lastReadAtIso,
      };
      entries.unshift(newEntry);
    }
    saveStoredEntries(entries);
  },

  remove(workId: string) {
    const entries = getStoredEntries().filter((e) => e.workId !== workId);
    saveStoredEntries(entries);
  },

  toggleFavorite(workId: string): boolean {
    const entries = getStoredEntries();
    const index = entries.findIndex((e) => e.workId === workId);
    let newState = false;
    if (index >= 0) {
      newState = !entries[index].isFavorite;
      entries[index].isFavorite = newState;
      saveStoredEntries(entries);
    }
    return newState;
  },

  updateProgress(
    workId: string,
    chapterId: string,
    chapterTitle: string,
    progress: number,
  ) {
    const entries = getStoredEntries();
    const index = entries.findIndex((e) => e.workId === workId);
    if (index >= 0) {
      entries[index].lastReadChapterId = chapterId;
      entries[index].lastReadChapterTitle = chapterTitle;
      entries[index].progress = Math.min(100, Math.max(0, progress));
      entries[index].lastReadAt = "Agora mesmo";
      if (progress >= 100) {
        entries[index].status = "completed";
      } else if (entries[index].status === "plan_to_read") {
        entries[index].status = "reading";
      }
      saveStoredEntries(entries);
    }
  },

  getLists: getStoredLists,

  getList(id: string): ReadingList | undefined {
    return getStoredLists().find((l) => l.id === id);
  },

  createList(title: string, description: string): ReadingList {
    const lists = getStoredLists();
    const newList: ReadingList = {
      id: `lista-${localId()}`,
      title: title.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      workIds: [],
    };
    lists.push(newList);
    saveStoredLists(lists);
    return newList;
  },

  deleteList(id: string) {
    const lists = getStoredLists().filter((l) => l.id !== id);
    saveStoredLists(lists);

    // Also remove reference from entries
    const entries = getStoredEntries().map((entry) => ({
      ...entry,
      readingListIds: entry.readingListIds.filter((lid) => lid !== id),
    }));
    saveStoredEntries(entries);
  },

  toggleWorkInList(listId: string, workId: string): boolean {
    const lists = getStoredLists();
    const listIndex = lists.findIndex((l) => l.id === listId);
    if (listIndex < 0) return false;

    const list = lists[listIndex];
    const exists = list.workIds.includes(workId);
    if (exists) {
      list.workIds = list.workIds.filter((id) => id !== workId);
    } else {
      list.workIds.push(workId);
    }
    list.updatedAt = new Date().toISOString().split("T")[0];
    saveStoredLists(lists);

    // Also sync entries
    const entries = getStoredEntries();
    const entryIndex = entries.findIndex((e) => e.workId === workId);
    if (entryIndex >= 0) {
      const entry = entries[entryIndex];
      if (exists) {
        entry.readingListIds = entry.readingListIds.filter(
          (id) => id !== listId,
        );
      } else {
        entry.readingListIds.push(listId);
      }
      saveStoredEntries(entries);
    }
    return !exists;
  },

  clearHistory() {
    const entries = getStoredEntries().map((e) => ({
      ...e,
      progress: 0,
      lastReadAt: "Nunca lido",
      lastReadPosition: 0,
      lastReadAtIso: undefined,
      status: "plan_to_read" as const,
    }));
    saveStoredEntries(entries);
  },
};

// React hook for observing changes
export function useLibrary() {
  const entries = useLocalCollection<LibraryEntry>(STORAGE_KEY_ENTRIES);
  const lists = useLocalCollection<ReadingList>(STORAGE_KEY_LISTS);
  return {
    entries,
    lists,
    store: bindScope(libraryStore, currentScope()),
    refresh: notifyLocal,
  };
}
