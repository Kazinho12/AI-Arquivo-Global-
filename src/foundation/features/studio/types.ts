import type { Chapter } from "../reader/types";

export type WorkFormat =
  | "Romance"
  | "Conto"
  | "Poesia"
  | "HQ / Comic"
  | "Mangá";
export type WorkStatus = "draft" | "in_review" | "published" | "archived";
export type AgeRating = "Livre" | "+12" | "+14" | "+16" | "+18";

export interface StudioWork {
  persistence?: "supabase";
  archivedAt?: string | null;
  ownerId?: string;
  slug?: string;
  revision?: number;
  id: string;
  title: string;
  subtitle?: string;
  synopsis: string;
  format: WorkFormat;
  mode: "prose" | "poetry" | "comic" | "manga";
  genre: string;
  language: string;
  tags: string[];
  ageRating: AgeRating;
  contentWarnings: string[];
  status: WorkStatus;
  coverAccentColor: string;
  coverStyle?: string;
  createdAt: string;
  updatedAt: string;
  chapters: Chapter[];
}

export interface EditorialActivity {
  id: string;
  workId: string;
  workTitle: string;
  type:
    | "chapter_edit"
    | "metadata_update"
    | "draft_created"
    | "page_added"
    | "chapter_added";
  description: string;
  timestamp: string;
}

export interface StudioStats {
  totalWorks: number;
  draftsCount: number;
  publishedCount: number;
  totalWords: number;
  totalChapters: number;
  estimatedReads: null;
  avgReadTimeMinutes: number;
}

export interface MediaItem {
  id: string;
  name: string;
  type: "cover" | "page" | "illustration";
  url: string;
  size: string;
  dimensions: string;
  workId?: string;
  workTitle?: string;
  createdAt: string;
  isLocalObjectUrl?: boolean;
}
