import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ArrowLeftRight,
  Layers,
  ScrollText,
  MessageSquare,
} from "lucide-react";
import type { Chapter, VisualReaderPreferences } from "./types";
import { Button } from "../../components/ui";

interface MangaReaderProps {
  workId: string;
  workTitle: string;
  author: string;
  chapters: Chapter[];
  currentChapter: Chapter;
}

export function MangaReader({
  workId,
  workTitle,
  author,
  chapters,
  currentChapter,
}: MangaReaderProps) {
  const pages = currentChapter.pages || [];

  const [prefs, setPrefs] = useState<VisualReaderPreferences>(() => {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return {
        fitMode: "height",
        direction: "rtl", // Default for Manga
        viewMode: "single",
        zoom: 100,
      };
    }
    try {
      const saved = localStorage.getItem("ag_reader_manga_prefs");
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      fitMode: "height",
      direction: "rtl",
      viewMode: "single",
      zoom: 100,
    };
  });

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [distractionFree, setDistractionFree] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof localStorage === "undefined")
      return;
    try {
      localStorage.setItem("ag_reader_manga_prefs", JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }, [prefs]);

  // Handle navigation in RTL mode vs LTR mode
  // In RTL mode:
  // "Next" (advancing forward in story) corresponds to moving to the LEFT (ArrowLeft) or clicking Next button
  // "Prev" (moving backward) corresponds to moving to the RIGHT (ArrowRight)
  const advancePage = () => {
    setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1));
  };

  const retreatPage = () => {
    setCurrentPageIndex((prev) => Math.max(0, prev - 1));
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (prefs.viewMode === "single") {
        if (prefs.direction === "rtl") {
          if (e.key === "ArrowLeft") {
            advancePage();
          } else if (e.key === "ArrowRight") {
            retreatPage();
          }
        } else {
          if (e.key === "ArrowRight") {
            advancePage();
          } else if (e.key === "ArrowLeft") {
            retreatPage();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pages.length, prefs.viewMode, prefs.direction]);

  const currentPage = pages[currentPageIndex] || pages[0];

  return (
    <div
      className={`manga-reader-container ${
        distractionFree ? "distraction-free" : ""
      }`}
      dir={prefs.direction}
    >
      {!distractionFree && (
        <header className="reader-toolbar">
          <div className="reader-toolbar-meta" dir="ltr">
            <Link to={`/obras/${workId}`} className="reader-work-title">
              {workTitle}
            </Link>
            <span className="separator" aria-hidden="true">
              ·
            </span>
            <span className="reader-author">{author}</span>
            <span className="separator" aria-hidden="true">
              ·
            </span>
            <span className="reader-chapter-title">{currentChapter.title}</span>
            <span className="separator" aria-hidden="true">
              ·
            </span>
            <span className="manga-direction-pill">
              {prefs.direction === "rtl"
                ? "RTL (Direita ➔ Esquerda)"
                : "LTR (Esquerda ➔ Direita)"}
            </span>
          </div>

          <div className="reader-toolbar-actions" dir="ltr">
            {/* Direction Toggle */}
            <Button
              variant="ghost"
              onClick={() =>
                setPrefs({
                  ...prefs,
                  direction: prefs.direction === "rtl" ? "ltr" : "rtl",
                })
              }
              title={`Mudar orientação (${prefs.direction === "rtl" ? "atualmente RTL" : "atualmente LTR"})`}
              aria-label="Alternar direção de leitura"
            >
              <ArrowLeftRight size={15} className="mr-1" />
              <span className="hidden sm:inline">
                {prefs.direction === "rtl" ? "RTL" : "LTR"}
              </span>
            </Button>

            {/* View Mode Toggle: Single page vs Vertical */}
            <div
              className="segmented-control"
              role="group"
              aria-label="Modo de visualização"
            >
              <button
                type="button"
                className={prefs.viewMode === "single" ? "active" : ""}
                onClick={() => setPrefs({ ...prefs, viewMode: "single" })}
                title="Página a página"
              >
                <Layers size={14} className="inline mr-1" />
                Página
              </button>
              <button
                type="button"
                className={prefs.viewMode === "vertical" ? "active" : ""}
                onClick={() => setPrefs({ ...prefs, viewMode: "vertical" })}
                title="Rolagem vertical"
              >
                <ScrollText size={14} className="inline mr-1" />
                Vertical
              </button>
            </div>

            <Button
              variant="ghost"
              onClick={() => setDistractionFree(!distractionFree)}
              aria-label="Ecrã completo"
              title="Ecrã completo"
            >
              <Maximize2 size={18} />
            </Button>
          </div>
        </header>
      )}

      {distractionFree && (
        <button
          type="button"
          className="exit-distraction-button"
          onClick={() => setDistractionFree(false)}
          title="Sair do ecrã completo"
          aria-label="Sair do ecrã completo"
        >
          <Minimize2 size={16} /> Sair
        </button>
      )}

      {/* Main Manga Viewer */}
      {prefs.viewMode === "single" ? (
        <div className="manga-single-viewport">
          <div className="manga-page-wrapper">
            {currentPage ? (
              <div
                className="manga-illustrated-plate"
                style={{ backgroundColor: currentPage.accentColor }}
                tabIndex={0}
                aria-label={`Página ${currentPage.number}: ${currentPage.title}`}
              >
                <div className="manga-plate-header" dir="ltr">
                  <span className="manga-plate-number">
                    【頁 {currentPage.number} / {pages.length}】
                  </span>
                  <span className="manga-plate-title">{currentPage.title}</span>
                </div>

                <div className="manga-illustration-art">
                  {currentPage.imageUrl ? (
                    <img
                      src={currentPage.imageUrl}
                      alt={currentPage.title}
                      className="manga-plate-img max-h-[500px] object-contain w-full rounded"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="manga-screentone-box">
                      <p className="manga-scene-description">
                        {currentPage.description}
                      </p>
                    </div>
                  )}
                </div>

                {currentPage.caption && (
                  <div className="manga-plate-caption" dir="ltr">
                    <p>{currentPage.caption}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="notice">Página não encontrada.</div>
            )}
          </div>

          {/* RTL / LTR Aware Navigation Controls */}
          <div className="manga-page-controls" dir="ltr">
            {prefs.direction === "rtl" ? (
              <>
                <Button
                  variant="secondary"
                  disabled={currentPageIndex >= pages.length - 1}
                  onClick={advancePage}
                  aria-label="Avançar página (para a esquerda)"
                >
                  <ChevronLeft size={16} /> Avançar (←)
                </Button>

                <span className="manga-page-counter">
                  【頁 <strong>{currentPageIndex + 1}</strong> / {pages.length}
                  】
                </span>

                <Button
                  variant="secondary"
                  disabled={currentPageIndex <= 0}
                  onClick={retreatPage}
                  aria-label="Recuar página (para a direita)"
                >
                  Recuar (→) <ChevronRight size={16} />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  disabled={currentPageIndex <= 0}
                  onClick={retreatPage}
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={16} /> Anterior
                </Button>

                <span className="manga-page-counter">
                  Página <strong>{currentPageIndex + 1}</strong> de{" "}
                  {pages.length}
                </span>

                <Button
                  variant="secondary"
                  disabled={currentPageIndex >= pages.length - 1}
                  onClick={advancePage}
                  aria-label="Próxima página"
                >
                  Próxima <ChevronRight size={16} />
                </Button>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Vertical Continuous Stream */
        <div className="manga-vertical-viewport">
          <div className="manga-vertical-stream">
            {pages.map((p) => (
              <article
                key={p.id}
                className="manga-illustrated-plate vertical-item"
                style={{ backgroundColor: p.accentColor }}
                aria-label={`Página ${p.number}: ${p.title}`}
              >
                <div className="manga-plate-header" dir="ltr">
                  <span className="manga-plate-number">【頁 {p.number}】</span>
                  <span className="manga-plate-title">{p.title}</span>
                </div>

                <div className="manga-illustration-art">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="manga-plate-img max-h-[500px] object-contain w-full rounded"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="manga-screentone-box">
                      <p className="manga-scene-description">{p.description}</p>
                    </div>
                  )}
                </div>

                {p.caption && (
                  <div className="manga-plate-caption" dir="ltr">
                    <p>{p.caption}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Reader Footer */}
      <footer className="manga-reader-footer" dir="ltr">
        <Link to={`/obras/${workId}`} className="text-link">
          ← Voltar à página da obra
        </Link>
        <span className="separator" aria-hidden="true">
          ·
        </span>
        <Link to={`/obras/${workId}/comentarios`} className="text-link">
          <MessageSquare size={14} className="inline mr-1" />
          Comentários
        </Link>
      </footer>
    </div>
  );
}
