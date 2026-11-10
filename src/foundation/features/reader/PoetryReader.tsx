import { useState, useEffect } from "react";
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
import type { Chapter, ReadingPreferences } from "./types";
import { Button } from "../../components/ui";

interface PoetryReaderProps {
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
}: PoetryReaderProps) {
  const [prefs, setPrefs] = useState<ReadingPreferences>(() => {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return {
        fontSize: "medium",
        lineHeight: "relaxed",
        measure: "comfortable",
        fontFamily: "literary",
        distractionFree: false,
        theme: "dark",
      };
    }
    try {
      const saved = localStorage.getItem("ag_reader_poetry_prefs");
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      fontSize: "medium",
      lineHeight: "relaxed",
      measure: "comfortable",
      fontFamily: "literary",
      distractionFree: false,
      theme: "dark",
    };
  });

  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof localStorage === "undefined")
      return;
    try {
      localStorage.setItem("ag_reader_poetry_prefs", JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }, [prefs]);

  const currentIndex = chapters.findIndex((c) => c.id === currentChapter.id);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  // Stanzas: array of string[] representing lines of verse
  const stanzas: string[][] = currentChapter.stanzas || [
    (currentChapter.content || "")
      .split("\n\n")
      .map((s) => s.split("\n"))
      .flat(),
  ];

  const fontSizeClass =
    prefs.fontSize === "small"
      ? "text-base"
      : prefs.fontSize === "medium"
        ? "text-xl"
        : prefs.fontSize === "large"
          ? "text-2xl"
          : "text-lg";

  const lineHeightClass =
    prefs.lineHeight === "compact"
      ? "leading-relaxed"
      : prefs.lineHeight === "relaxed"
        ? "leading-loose"
        : "leading-normal";

  const themeStyle =
    prefs.theme === "sepia"
      ? "reader-theme-sepia"
      : prefs.theme === "light"
        ? "reader-theme-light"
        : "reader-theme-dark";

  return (
    <div
      className={`poetry-reader-container ${themeStyle} ${
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
                title="Tipografia"
              >
                <Type size={18} />
                <span className="hidden sm:inline">Tipografia</span>
              </Button>

              {showSettings && (
                <div
                  className="reader-settings-dropdown"
                  role="dialog"
                  aria-label="Definições de leitura de poesia"
                >
                  <div className="reader-settings-group">
                    <span className="reader-settings-label">
                      Corpo dos versos
                    </span>
                    <div className="segmented-control">
                      {(
                        [
                          ["small", "A-"],
                          ["normal", "Padrão"],
                          ["medium", "A+"],
                          ["large", "A++"],
                        ] as const
                      ).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          className={prefs.fontSize === key ? "active" : ""}
                          onClick={() => setPrefs({ ...prefs, fontSize: key })}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="reader-settings-group">
                    <span className="reader-settings-label">
                      Ambiente de fundo
                    </span>
                    <div className="segmented-control">
                      {(
                        [
                          ["dark", "Escuro"],
                          ["sepia", "Sépia"],
                          ["light", "Claro"],
                        ] as const
                      ).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          className={prefs.theme === key ? "active" : ""}
                          onClick={() => setPrefs({ ...prefs, theme: key })}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
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

      {/* Main Poetry Canvas */}
      <article className="poetry-canvas">
        <header className="poetry-header">
          <span className="poetry-eyebrow">Poesia</span>
          <h1 className="poetry-title">{currentChapter.title}</h1>
        </header>

        <div
          className={`poetry-stanzas-container ${fontSizeClass} ${lineHeightClass}`}
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
                  {verse || "\u00A0"}
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

          <div className="reader-footer-links">
            <Link
              to={`/obras/${workId}/comentarios`}
              className="reader-aux-link"
            >
              <MessageSquare size={15} /> Ver comentários e impressões
            </Link>
          </div>
        </footer>
      </article>
    </div>
  );
}
