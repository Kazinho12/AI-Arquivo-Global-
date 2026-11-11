import {
  ReaderSettings,
  ReaderIndex,
  useReaderAppearance,
} from "./ReaderSettings";
import { ProseContent } from "./content";
import { Modal } from "../../components/ui";
import { useReadingPreferences } from "../preferences/store";
import { useReadingProgress } from "./progress";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Type,
  BookOpen,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import type { Chapter } from "./types";
import { Button } from "../../components/ui";

interface ProseReaderProps {
  trackProgress?: boolean;
  showCommunityLinks?: boolean;
  workId: string;
  workTitle: string;
  author: string;
  chapters: Chapter[];
  currentChapter: Chapter;
  onSelectChapter?: (chapterId: string) => void;
}

export function ProseReader({
  workId,
  workTitle,
  author,
  chapters,
  currentChapter,
  trackProgress = false,
  showCommunityLinks = true,
  onSelectChapter,
}: ProseReaderProps) {
  const TitleHeading = trackProgress ? "h1" : "h2";
  const reading = useReadingProgress({
    workId,
    workTitle,
    author,
    chapters,
    currentChapter,
    mode: "prose",
    enabled: trackProgress,
  });
  const [prefs, setPrefs] = useReadingPreferences("prose");

  const [showSettings, setShowSettings] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) {
        setScrollProgress(
          Math.min(100, Math.max(0, (window.scrollY / total) * 100)),
        );
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const currentIndex = chapters.findIndex((c) => c.id === currentChapter.id);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  const paragraphs = (currentChapter.content || "")
    .split("\n\n")
    .filter(Boolean);

  // Approximate word count and read time
  const wordCount = (currentChapter.content || "").trim().split(/\s+/).length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const appearance = useReaderAppearance(prefs);

  return (
    <div
      ref={reading.root}
      className={`prose-reader-container ${appearance.themeClass} ${
        prefs.distractionFree ? "distraction-free" : ""
      }`}
    >
      {/* Reading Progress Indicator */}
      <div
        className="reading-progress-track"
        aria-hidden="true"
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="reading-progress-fill"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Reader Control Header */}
      {!prefs.distractionFree && (
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
            <span className="reader-time">
              ~{readTimeMinutes} min de leitura
            </span>
          </div>

          <div className="reader-toolbar-actions">
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setShowSettings(!showSettings)}
                aria-label="Ajustar tipografia e leitura"
                aria-haspopup="dialog"
                aria-expanded={showSettings}
                title="Tipografia e leitura"
              >
                <Type size={18} />
                <span className="hidden sm:inline">Tipografia</span>
              </Button>

              {showSettings && (
                <Modal
                  open
                  onClose={() => setShowSettings(false)}
                  title="Definições de leitura"
                >
                  <ReaderSettings
                    prefs={prefs}
                    onChange={(value) => setPrefs({ ...prefs, ...value })}
                  />
                </Modal>
              )}
            </div>

            <Button
              variant="ghost"
              onClick={() =>
                setPrefs({ ...prefs, distractionFree: !prefs.distractionFree })
              }
              aria-label="Ativar modo foco"
              title="Modo foco (sem distrações)"
            >
              <Maximize2 size={18} />
              <span className="hidden sm:inline">Modo foco</span>
            </Button>
          </div>
        </header>
      )}

      {/* Exit Distraction-Free Floating Button */}
      {prefs.distractionFree && (
        <button
          type="button"
          className="exit-distraction-button"
          onClick={() => setPrefs({ ...prefs, distractionFree: false })}
          title="Sair do modo foco"
          aria-label="Sair do modo foco"
        >
          <Minimize2 size={16} /> Sair do modo foco
        </button>
      )}

      {trackProgress && (
        <Button variant="secondary" onClick={reading.complete}>
          Marcar capítulo como lido
        </Button>
      )}
      {/* Main Reading Canvas */}
      <article style={appearance.style} className="prose-canvas">
        <header className="chapter-header">
          <span className="chapter-number">
            {`Capítulo ${currentChapter.number}`}
          </span>
          <TitleHeading className="chapter-title">
            {currentChapter.title}
          </TitleHeading>
        </header>

        <div className="chapter-body reader-preferred-text">
          <ProseContent text={currentChapter.content ?? ""} />
        </div>

        {/* Chapter Navigation Footer */}
        <footer className="chapter-navigation">
          <div className="chapter-nav-buttons">
            {prevChapter ? (
              <Link
                to={`/obras/${workId}/capitulos/${prevChapter.id}`}
                className="button secondary"
              >
                <ChevronLeft size={16} /> Capítulo anterior
              </Link>
            ) : (
              <span />
            )}

            <ReaderIndex
              workId={workId}
              chapters={chapters}
              currentChapter={currentChapter}
              onSelect={onSelectChapter}
            />

            {nextChapter ? (
              <Link
                to={`/obras/${workId}/capitulos/${nextChapter.id}`}
                className="button primary"
              >
                Próximo capítulo <ChevronRight size={16} />
              </Link>
            ) : (
              <Link to={`/obras/${workId}`} className="button secondary">
                Voltar à obra
              </Link>
            )}
          </div>

          <Link to={`/obras/${workId}`} className="reader-details-link">
            Voltar aos detalhes da obra
          </Link>
          {showCommunityLinks && (
            <div className="reader-footer-links">
              <Link
                to={`/obras/${workId}/comentarios`}
                className="reader-aux-link"
              >
                <MessageSquare size={15} /> Ver comentários deste capítulo
              </Link>
              <Link
                to={`/obras/${workId}/avaliacoes`}
                className="reader-aux-link"
              >
                <Sparkles size={15} /> Ver avaliações da obra
              </Link>
            </div>
          )}
        </footer>
      </article>
    </div>
  );
}
