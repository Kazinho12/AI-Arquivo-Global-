import { useReadingPreferences } from "../preferences/store";
import { useReadingProgress, savedPosition } from "./progress";
import { LocalImage } from "../local/images";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Layers,
  ScrollText,
  MessageSquare,
} from "lucide-react";
import type { Chapter, VisualReaderPreferences } from "./types";
import { Button } from "../../components/ui";

interface ComicReaderProps {
  trackProgress?: boolean;
  workId: string;
  workTitle: string;
  author: string;
  chapters: Chapter[];
  currentChapter: Chapter;
}

export function ComicReader({
  workId,
  workTitle,
  author,
  chapters,
  currentChapter,
  trackProgress = false,
}: ComicReaderProps) {
  const pages = currentChapter.pages || [];

  const [prefs, setPrefs] = useReadingPreferences("comic");

  const [currentPageIndex, setCurrentPageIndex] = useState(() =>
    Math.min(
      Math.max(0, pages.length - 1),
      Math.floor(savedPosition(workId, currentChapter.id) * pages.length),
    ),
  );
  const reading = useReadingProgress({
    workId,
    workTitle,
    author,
    chapters,
    currentChapter,
    mode: "comic",
    enabled: trackProgress,
    pageIndex: currentPageIndex,
    vertical: prefs.viewMode === "vertical",
    onVisiblePage: setCurrentPageIndex,
  });
  const distractionFree = prefs.distractionFree;
  const setDistractionFree = (value: boolean) =>
    setPrefs({ ...prefs, distractionFree: value });

  // Keyboard navigation
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (prefs.viewMode === "single") {
        if (e.key === "ArrowRight") {
          setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1));
        } else if (e.key === "ArrowLeft") {
          setCurrentPageIndex((prev) => Math.max(0, prev - 1));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pages.length, prefs.viewMode]);

  const currentPage = pages[currentPageIndex] || pages[0];

  const handleZoom = (delta: number) => {
    setPrefs((prev) => ({
      ...prev,
      zoom: Math.min(175, Math.max(75, prev.zoom + delta)),
    }));
  };

  return (
    <div
      ref={reading.root}
      data-reading-size={prefs.fontSize}
      data-reading-family={prefs.fontFamily}
      data-reading-measure={prefs.measure}
      data-reading-theme={prefs.theme}
      className={`comic-reader-container ${
        distractionFree ? "distraction-free" : ""
      }`}
    >
      {trackProgress && (
        <h1 className="sr-only">
          {workTitle} — {currentChapter.title}
        </h1>
      )}
      {!distractionFree && (
        <header className="reader-toolbar">
          <div className="reader-toolbar-meta">
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
            <span className="reader-chapter-title">
              Capítulo {currentChapter.number}: {currentChapter.title}
            </span>
          </div>

          <div className="reader-toolbar-actions">
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
                title="Rolagem vertical contínua"
              >
                <ScrollText size={14} className="inline mr-1" />
                Vertical
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="zoom-controls">
              <button
                type="button"
                className="zoom-btn"
                onClick={() => handleZoom(-15)}
                disabled={prefs.zoom <= 75}
                aria-label="Diminuir zoom"
              >
                <ZoomOut size={15} />
              </button>
              <span className="zoom-value">{prefs.zoom}%</span>
              <button
                type="button"
                className="zoom-btn"
                onClick={() => handleZoom(15)}
                disabled={prefs.zoom >= 175}
                aria-label="Aumentar zoom"
              >
                <ZoomIn size={15} />
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

      {/* Main Comic Viewer Area */}
      {prefs.viewMode === "single" ? (
        <div className="comic-single-viewport">
          <div
            className="comic-page-wrapper"
            style={{
              transform: `scale(${prefs.zoom / 100})`,
              transformOrigin: "top center",
            }}
          >
            {currentPage ? (
              <div
                className="comic-illustrated-plate"
                style={{ backgroundColor: currentPage.accentColor }}
                tabIndex={0}
                aria-label={`Página ${currentPage.number}: ${currentPage.title}`}
              >
                <div className="comic-plate-header">
                  <span className="comic-plate-badge">
                    Página {currentPage.number} de {pages.length}
                  </span>
                  <span className="comic-plate-title">{currentPage.title}</span>
                </div>

                <div className="comic-plate-illustration-mock">
                  {currentPage.imageUrl ? (
                    <LocalImage
                      src={currentPage.imageUrl}
                      alt={currentPage.title}
                      className="comic-plate-img max-h-[500px] object-contain w-full rounded"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="comic-panel-grid">
                      <div className="comic-subpanel main-panel">
                        <p className="comic-scene-description">
                          {currentPage.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {currentPage.caption && (
                  <div className="comic-plate-caption">
                    <p>{currentPage.caption}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="notice">Página não encontrada.</div>
            )}
          </div>

          {/* Single-Page Navigation Bar */}
          <div className="comic-page-controls">
            <Button
              variant="secondary"
              disabled={currentPageIndex <= 0}
              onClick={() =>
                setCurrentPageIndex((prev) => Math.max(0, prev - 1))
              }
              aria-label="Página anterior"
            >
              <ChevronLeft size={16} /> Anterior
            </Button>

            <span className="comic-pagination-counter">
              Página <strong>{currentPageIndex + 1}</strong> de {pages.length}
            </span>

            <Button
              variant="secondary"
              disabled={currentPageIndex >= pages.length - 1}
              onClick={() =>
                setCurrentPageIndex((prev) =>
                  Math.min(pages.length - 1, prev + 1),
                )
              }
              aria-label="Próxima página"
            >
              Próxima <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      ) : (
        /* Vertical Continuous Scroll Mode */
        <div className="comic-vertical-viewport">
          <div
            className="comic-vertical-stream"
            style={{
              transform: `scale(${prefs.zoom / 100})`,
              transformOrigin: "top center",
            }}
          >
            {pages.map((p) => (
              <article
                data-reader-page
                key={p.id}
                className="comic-illustrated-plate vertical-item"
                style={{ backgroundColor: p.accentColor }}
                aria-label={`Página ${p.number}: ${p.title}`}
              >
                <div className="comic-plate-header">
                  <span className="comic-plate-badge">Página {p.number}</span>
                  <span className="comic-plate-title">{p.title}</span>
                </div>

                <div className="comic-plate-illustration-mock">
                  {p.imageUrl ? (
                    <LocalImage
                      src={p.imageUrl}
                      alt={p.title}
                      className="comic-plate-img max-h-[500px] object-contain w-full rounded"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="comic-subpanel main-panel">
                      <p className="comic-scene-description">{p.description}</p>
                    </div>
                  )}
                </div>

                {p.caption && (
                  <div className="comic-plate-caption">
                    <p>{p.caption}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      {trackProgress && (
        <Button variant="secondary" onClick={reading.complete}>
          Marcar capítulo como lido
        </Button>
      )}
      {/* Reader Footer */}
      <footer className="comic-reader-footer">
        <Link to={`/obras/${workId}`} className="text-link">
          ← Voltar à página da obra
        </Link>
        <span className="separator" aria-hidden="true">
          ·
        </span>
        <Link to={`/obras/${workId}/comentarios`} className="text-link">
          <MessageSquare size={14} className="inline mr-1" />
          Comentários do capítulo
        </Link>
      </footer>
    </div>
  );
}
