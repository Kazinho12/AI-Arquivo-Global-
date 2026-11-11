import {
  ReaderSettings,
  ReaderIndex,
  useReaderAppearance,
  poetryStanzas,
} from "./ReaderSettings";
import { InlineContent } from "./content";
import { Modal } from "../../components/ui";
import { useReadingPreferences } from "../preferences/store";
import { useReadingProgress } from "./progress";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Type,
  Feather,
  MessageSquare,
} from "lucide-react";
import type { Chapter } from "./types";
import { Button } from "../../components/ui";

interface PoetryReaderProps {
  trackProgress?: boolean;
  showCommunityLinks?: boolean;
  workId: string;
  workTitle: string;
  author: string;
  chapters: Chapter[];
  currentChapter: Chapter;
}

export function PoetryReader({
  workId,
  workTitle,
  author,
  chapters,
  currentChapter,
  trackProgress = false,
  showCommunityLinks = true,
}: PoetryReaderProps) {
  const TitleHeading = trackProgress ? "h1" : "h2";
  const reading = useReadingProgress({
    workId,
    workTitle,
    author,
    chapters,
    currentChapter,
    mode: "poetry",
    enabled: trackProgress,
  });
  const [prefs, setPrefs] = useReadingPreferences("poetry");

  const [showSettings, setShowSettings] = useState(false);

  const currentIndex = chapters.findIndex((c) => c.id === currentChapter.id);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  // Stanzas: array of string[] representing lines of verse
  const stanzas: string[][] =
    currentChapter.content !== undefined
      ? poetryStanzas(currentChapter.content)
      : (currentChapter.stanzas ?? []);

  const appearance = useReaderAppearance(prefs);

  return (
    <div
      ref={reading.root}
      className={`poetry-reader-container ${appearance.themeClass} ${
        prefs.distractionFree ? "distraction-free" : ""
      }`}
    >
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
            <span className="reader-tag">
              <Feather size={13} className="inline mr-1" />
              {`Poema ${currentChapter.number} de ${chapters.length}`}
            </span>
          </div>

          <div className="reader-toolbar-actions">
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setShowSettings(!showSettings)}
                aria-label="Ajustar tipografia poética"
                aria-haspopup="dialog"
                aria-expanded={showSettings}
                title="Tipografia"
              >
                <Type size={18} />
                <span className="hidden sm:inline">Tipografia</span>
              </Button>

              {showSettings && (
                <Modal
                  open
                  onClose={() => setShowSettings(false)}
                  title="Definições de leitura de poesia"
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
              aria-label="Modo foco de poesia"
              title="Modo foco"
            >
              <Maximize2 size={18} />
              <span className="hidden sm:inline">Modo foco</span>
            </Button>
          </div>
        </header>
      )}

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
          Marcar poema como lido
        </Button>
      )}
      {/* Main Poetry Canvas */}
      <article style={appearance.style} className="poetry-canvas">
        <header className="poetry-header">
          <span className="poetry-eyebrow">Poesia</span>
          <TitleHeading className="poetry-title">
            {currentChapter.title}
          </TitleHeading>
        </header>

        <div
          style={{ textAlign: currentChapter.alignment ?? "left" }}
          className="poetry-stanzas-container reader-preferred-text"
        >
          {stanzas.map((stanza, sIdx) => (
            <div
              key={sIdx}
              className="poetry-stanza"
              role="group"
              aria-label={`Estrofe ${sIdx + 1}`}
            >
              {stanza.map((verse, vIdx) => (
                <div key={vIdx} className="poetry-verse">
                  <InlineContent text={verse || "\u00A0"} />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Quiet Navigation */}
        <footer className="poetry-footer">
          <div className="chapter-nav-buttons">
            {prevChapter ? (
              <Link
                to={`/obras/${workId}/capitulos/${prevChapter.id}`}
                className="button secondary"
              >
                <ChevronLeft size={16} /> Poema anterior
              </Link>
            ) : (
              <span />
            )}

            <ReaderIndex
              workId={workId}
              chapters={chapters}
              currentChapter={currentChapter}
              poetry
            />
            <span className="poetry-counter">
              {currentIndex + 1} de {chapters.length}
            </span>

            {nextChapter ? (
              <Link
                to={`/obras/${workId}/capitulos/${nextChapter.id}`}
                className="button primary"
              >
                Próximo poema <ChevronRight size={16} />
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
                <MessageSquare size={15} /> Ver comentários e impressões
              </Link>
            </div>
          )}
        </footer>
      </article>
    </div>
  );
}
