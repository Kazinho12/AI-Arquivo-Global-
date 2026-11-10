import { useState, useEffect, useCallback } from "react";
import type { LibraryEntry, ReadingList } from "./types";

const STORAGE_KEY_ENTRIES = "ag_library_entries_v1";
const STORAGE_KEY_LISTS = "ag_library_lists_v1";

const initialSeedEntries: LibraryEntry[] = [
  {
    workId: "atlas-das-mares",
    title: "Atlas das marés esquecidas",
    author: "Lia Mavume",
    format: "Romance",
    genre: "Ficção especulativa",
    synopsis:
      "A cada maré-viva trinta anos depois do colapso, uma cidade submersa emerge ao largo de Porto-Vento.",
    progress: 65,
    lastReadChapterId: "cap-2",
    lastReadChapterTitle: "Capítulo 2: O som das pedras submersas",
    lastReadAt: "Hoje, 10:14",
    status: "reading",
    isFavorite: true,
    readingListIds: ["lista-ficcao"],
  },
  {
    workId: "silencio-orbita",
    title: "O silêncio em órbita",
    author: "Íris Vale",
    format: "Poesia",
    genre: "Poesia contemporânea",
    synopsis:
      "Versos sobre distâncias astronómicas, corpos celestes e a lentidão com que a luz viaja.",
    progress: 100,
    lastReadChapterId: "cap-3",
    lastReadChapterTitle: "III. Retorno à atmosfera",
    lastReadAt: "Ontem",
    status: "completed",
    isFavorite: true,
    readingListIds: ["lista-poesia"],
  },
  {
    workId: "cidade-entre-linhas",
    title: "A cidade entre linhas",
    author: "Tomás Nilo",
    format: "HQ / Comic",
    genre: "Ficção urbana",
    synopsis:
      "No Setor 09, um ilustrador descobre um beco que não existe em nenhum mapa digital.",
    progress: 25,
    lastReadChapterId: "cap-1",
    lastReadChapterTitle: "Prólogo: O algoritmo cego",
    lastReadAt: "Há 3 dias",
    status: "reading",
    isFavorite: false,
    readingListIds: ["lista-ficcao"],
  },
  {
    workId: "jardim-lua",
    title: "O jardim da última lua",
    author: "Ren Aoki",
    format: "Mangá",
    genre: "Fantasia",
    synopsis:
      "Na colina dos cem pinheiros onde a noite se tornou eterna, uma jovem tenta proteger a semente primordial.",
    progress: 0,
    lastReadChapterId: "cap-1",
    lastReadChapterTitle: "Ato I: A flor que não adormece",
    lastReadAt: "Há 5 dias",
    status: "plan_to_read",
    isFavorite: false,
    readingListIds: [],
  },
];

const initialSeedLists: ReadingList[] = [
  {
    id: "lista-ficcao",
    title: "Ficção e Narrativas Especulativas",
    description:
      "Narrativas contemporâneas que exploram futuros possíveis, marés e cidades esquecidas.",
    createdAt: "2026-03-01",
    updatedAt: "2026-03-10",
    workIds: ["atlas-das-mares", "cidade-entre-linhas"],
  },
  {
    id: "lista-poesia",
    title: "Poesia em Órbita",
    description: "Versos e métricas sobre física, astronomia e linguagem.",
    createdAt: "2026-03-05",
    updatedAt: "2026-03-09",
    workIds: ["silencio-orbita"],
  },
];

// Helper to notify listeners within the same tab
const listeners: Array<() => void> = [];
function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function getStoredEntries(): LibraryEntry[] {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return initialSeedEntries;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ENTRIES);
    if (!raw) {
      localStorage.setItem(
        STORAGE_KEY_ENTRIES,
        JSON.stringify(initialSeedEntries),
      );
      return initialSeedEntries;
    }
    return JSON.parse(raw);
  } catch {
    return initialSeedEntries;
  }
}

export function saveStoredEntries(entries: LibraryEntry[]) {
  if (typeof window === "undefined" || typeof localStorage === "undefined")
    return;
  try {
    localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
    notifyListeners();
  } catch {
    // ignore
  }
}

export function getStoredLists(): ReadingList[] {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return initialSeedLists;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LISTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_LISTS, JSON.stringify(initialSeedLists));
      return initialSeedLists;
    }
    return JSON.parse(raw);
  } catch {
    return initialSeedLists;
  }
}

export function saveStoredLists(lists: ReadingList[]) {
  if (typeof window === "undefined" || typeof localStorage === "undefined")
    return;
  try {
    localStorage.setItem(STORAGE_KEY_LISTS, JSON.stringify(lists));
    notifyListeners();
  } catch {
    // ignore
  }
}

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
        lastReadAt: "Agora mesmo",
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
        lastReadAt: "Agora mesmo",
        status: entry.status || "reading",
        isFavorite: entry.isFavorite ?? false,
        readingListIds: entry.readingListIds || [],
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
      id: `lista-${Date.now()}`,
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
      status: (e.status === "reading" ? "plan_to_read" : e.status) as any,
    }));
    saveStoredEntries(entries);
  },
};

// React hook for observing changes
export function useLibrary() {
  const [entries, setEntries] = useState<LibraryEntry[]>(getStoredEntries);
  const [lists, setLists] = useState<ReadingList[]>(getStoredLists);

  const refresh = useCallback(() => {
    setEntries(getStoredEntries());
    setLists(getStoredLists());
  }, []);

  useEffect(() => {
    listeners.push(refresh);
    return () => {
      const idx = listeners.indexOf(refresh);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, [refresh]);

  return {
    entries,
    lists,
    store: libraryStore,
    refresh,
  };
}
