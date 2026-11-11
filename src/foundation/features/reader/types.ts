export type ReaderMode = "prose" | "poetry" | "comic" | "manga";

export interface Chapter {
  revision?: number;
  entryType?: "chapter" | "poem" | "visual";
  createdAt?: string;
  updatedAt?: string;
  id: string;
  number: number;
  title: string;
  alignment?: "left" | "center";
  content?: string; // Text for prose/poetry
  stanzas?: string[][]; // Preserved stanzas for poetry
  pages?: {
    id: string;
    number: number;
    title: string;
    description: string;
    aspectRatio: string;
    accentColor: string;
    caption?: string;
    imageUrl?: string;
  }[]; // Illustrated pages for comics/manga
}

export interface WorkReadingData {
  workId: string;
  title: string;
  author: string;
  format: string;
  mode: ReaderMode;
  chapters: Chapter[];
}

export interface ReadingPreferences {
  fontSize: "small" | "normal" | "medium" | "large" | "xlarge";
  lineHeight: "compact" | "normal" | "relaxed";
  measure: "compact" | "comfortable" | "wide";
  fontFamily: "serif" | "sans" | "literary";
  distractionFree: boolean;
  theme?: "dark" | "light" | "sepia";
}

export interface VisualReaderPreferences {
  fitMode: "width" | "height" | "original";
  direction: "rtl" | "ltr"; // For manga
  viewMode: "single" | "vertical"; // Single page vs webtoon vertical scroll
  zoom: number;
}
