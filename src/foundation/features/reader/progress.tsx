import { useEffect, useRef } from "react";
import type { Chapter, ReaderMode } from "./types";
import { worksRepository } from "../../lib/worksRepository";
import { libraryStore } from "../library/store";
import { currentScope, inScope } from "../local/persistence";

export function savedPosition(workId: string, chapterId: string) {
  const entry = libraryStore.getEntry(workId);
  return entry?.lastReadChapterId === chapterId
    ? (entry.lastReadPosition ?? 0)
    : 0;
}
export function recordReading(input: {
  workId: string;
  workTitle: string;
  author: string;
  mode: ReaderMode;
  chapters: Chapter[];
  currentChapter: Chapter;
  position: number;
}) {
  const index = input.chapters.findIndex(
    (chapter) => chapter.id === input.currentChapter.id,
  );
  if (index < 0 || !Number.isFinite(input.position)) return;
  const position = Math.min(1, Math.max(0, input.position));
  const existing = libraryStore.getEntry(input.workId);
  const progress = Math.floor(
    ((index + position) / input.chapters.length) * 100,
  );
  const now = new Date().toISOString();
  libraryStore.addOrUpdate({
    workId: input.workId,
    title: input.workTitle,
    author: input.author,
    format:
      existing?.format ??
      worksRepository.find(input.workId)?.format ??
      {
        prose: "Romance",
        poetry: "Poesia",
        comic: "HQ / Comic",
        manga: "Mangá",
      }[input.mode],
    progress: Math.max(existing?.progress ?? 0, progress),
    status:
      Math.max(existing?.progress ?? 0, progress) >= 100
        ? "completed"
        : "reading",
    lastReadChapterId: input.currentChapter.id,
    lastReadChapterTitle: input.currentChapter.title,
    lastReadPosition: position,
    lastReadAtIso: now,
  });
}
export function useReadingProgress(input: {
  workId: string;
  workTitle: string;
  author: string;
  mode: ReaderMode;
  chapters: Chapter[];
  currentChapter: Chapter;
  enabled?: boolean;
  pageIndex?: number;
  vertical?: boolean;
  onVisiblePage?: (index: number) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const latest = useRef(input);
  const positionRef = useRef(0);
  const pendingSave = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  latest.current = input;
  const owner = currentScope();
  const visual = input.mode === "comic" || input.mode === "manga";
  useEffect(() => {
    if (!input.enabled) return;
    const position = savedPosition(input.workId, input.currentChapter.id);
    inScope(owner, () => recordReading({ ...input, position }));
    let frame = 0;
    positionRef.current = position;
    const save = (next: number) => {
      positionRef.current = next;
      if (pendingSave.current) clearTimeout(pendingSave.current);
      pendingSave.current = setTimeout(() => {
        pendingSave.current = undefined;
        inScope(owner, () =>
          recordReading({ ...latest.current, position: next }),
        );
      }, 250);
    };
    const scroll = () => {
      const element = root.current;
      if (!element) return;
      if (visual) {
        if (!latest.current.vertical) return;
        const pages = [
          ...element.querySelectorAll<HTMLElement>("[data-reader-page]"),
        ];
        let index = 0;
        pages.forEach((page, pageIndex) => {
          if (page.getBoundingClientRect().top < window.innerHeight * 0.6)
            index = pageIndex;
        });
        latest.current.onVisiblePage?.(index);
        const bottom = pages.at(-1)?.getBoundingClientRect().bottom;
        save(
          bottom !== undefined && bottom <= window.innerHeight
            ? 1
            : index / Math.max(pages.length, 1),
        );
      } else {
        const box = element.getBoundingClientRect();
        const distance = Math.max(1, element.offsetHeight - window.innerHeight);
        save(Math.min(1, Math.max(0, -box.top / distance)));
      }
    };
    if (!visual && position > 0 && position < 1) {
      frame = requestAnimationFrame(() => {
        const element = root.current;
        if (element)
          window.scrollTo(
            0,
            window.scrollY +
              element.getBoundingClientRect().top +
              position * Math.max(1, element.offsetHeight - window.innerHeight),
          );
      });
    }
    window.addEventListener("scroll", scroll, { passive: true });
    const flush = () =>
      inScope(owner, () =>
        recordReading({ ...latest.current, position: positionRef.current }),
      );
    window.addEventListener("pagehide", flush);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("pagehide", flush);
      if (pendingSave.current) {
        clearTimeout(pendingSave.current);
        pendingSave.current = undefined;
        flush();
      }
    };
  }, [input.workId, input.currentChapter.id, input.enabled, owner, visual]);
  useEffect(() => {
    if (!input.enabled || !visual || !input.vertical) return;
    const frame = requestAnimationFrame(() => {
      const pages =
        root.current?.querySelectorAll<HTMLElement>("[data-reader-page]");
      if (!pages?.length) return;
      const index = Math.min(
        pages.length - 1,
        Math.max(0, latest.current.pageIndex ?? 0),
      );
      if (index > 0) pages[index].scrollIntoView({ block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [input.enabled, input.vertical, input.currentChapter.id, owner, visual]);
  useEffect(() => {
    if (
      !input.enabled ||
      !visual ||
      input.pageIndex === undefined ||
      input.vertical
    )
      return;
    const count = input.currentChapter.pages?.length ?? 0;
    if (count) {
      positionRef.current = input.pageIndex! / count;
      inScope(owner, () =>
        recordReading({ ...input, position: input.pageIndex! / count }),
      );
    }
  }, [
    input.pageIndex,
    input.vertical,
    input.enabled,
    input.currentChapter.id,
    owner,
    visual,
  ]);
  return {
    root,
    complete: () => {
      positionRef.current = 1;
      if (pendingSave.current) {
        clearTimeout(pendingSave.current);
        pendingSave.current = undefined;
      }
      if (input.enabled)
        inScope(owner, () => recordReading({ ...input, position: 1 }));
    },
  };
}
