/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WorkFormat = 'romance' | 'conto' | 'poesia' | 'hq' | 'manga';

export type AgeRating = 'L' | '12' | '14' | '16' | '18';

export type WorkStatus = 'ongoing' | 'completed' | 'hiatus';

export interface Work {
  id: string;
  title: string;
  author: string;
  authorId: string;
  authorAvatar?: string;
  format: WorkFormat;
  genres: string[];
  contentWarnings?: string[];
  ageRating: AgeRating;
  status: WorkStatus;
  coverUrl: string;
  isDemoCover?: boolean; // Identificação explícita de demonstração conforme diretrizes
  synopsis: string;
  chaptersCount: number;
  readTime: string;
  publishedAt: string;
  updatedAt: string;
  rating: number;
  viewsCount: number;
  likesCount: number;
  license: string;
  sampleExcerpt?: {
    chapterTitle: string;
    text: string[];
  };
}

export interface Author {
  id: string;
  name: string;
  handle: string;
  bio: string;
  role: string;
  avatarUrl: string;
  location: string;
  worksCount: number;
  followersCount: number;
  isFollowing?: boolean;
  featuredWorkTitle: string;
}

export type ThemeMode = 'dark' | 'light';

export interface FilterOptions {
  search: string;
  format: WorkFormat | 'all';
  genre: string;
  ageRating: AgeRating | 'all';
  status: WorkStatus | 'all';
  sortBy: 'recent' | 'popular' | 'rating' | 'editorial';
}

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

export interface ColorToken {
  name: string;
  namePt: string;
  hex: string;
  role: string;
  textRole: string;
  wcagContrast: string;
}
