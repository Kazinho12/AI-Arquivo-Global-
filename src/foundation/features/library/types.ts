export type ReadingStatus = "reading" | "completed" | "plan_to_read";

export interface LibraryEntry {
  workId: string;
  title: string;
  author: string;
  format: string;
  genre: string;
  synopsis: string;
  progress: number; // 0 to 100
  lastReadChapterId: string;
  lastReadChapterTitle: string;
  lastReadAt: string;
  status: ReadingStatus;
  isFavorite: boolean;
  readingListIds: string[];
}

export interface ReadingList {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  workIds: string[];
}

export type LibraryTab = "all" | "reading" | "completed" | "plan_to_read";
export type ViewMode = "grid" | "list";
export type SortOption = "recent" | "title" | "progress";
