import { useEffect, useState, useId, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import type { Chapter, ReadingPreferences } from "./types";

export function ReaderSettings({
  prefs,
  onChange,
}: {
  prefs: ReadingPreferences;
  onChange: (value: ReadingPreferences) => void;
}) {
  const groups = [
    [
      "fontSize",
      "Tamanho da fonte",
      [
        ["small", "Pequena"],
        ["normal", "Normal"],
        ["medium", "Média"],
        ["large", "Grande"],
        ["xlarge", "Muito grande"],
      ],
    ],
    [
      "fontFamily",
      "Família tipográfica",
      [
        ["serif", "Serifada"],
        ["sans", "Sem serifa"],
        ["literary", "Editorial"],
      ],
    ],
    [
      "lineHeight",
      "Espaçamento entre linhas",
      [
        ["compact", "Compacto"],
        ["normal", "Normal"],
        ["relaxed", "Amplo"],
      ],
    ],
    [
      "measure",
      "Largura da coluna",
      [
        ["compact", "Estreita"],
        ["comfortable", "Confortável"],
        ["wide", "Larga"],
      ],
    ],
    [
      "theme",
      "Tema do leitor",
      [
        ["system", "Sistema"],
        ["light", "Claro"],
        ["dark", "Escuro"],
        ["sepia", "Sépia"],
      ],
    ],
  ] as const;
  return (
    <div className="reader-settings-panel">
      {groups.map(([field, label, choices]) => (
        <fieldset className="reader-settings-group" key={field}>
          <legend className="reader-settings-label">{label}</legend>
          <div className="segmented-control">
            {choices.map(([value, name]) => (
              <button
                type="button"
                key={value}
                aria-pressed={prefs[field] === value}
                className={prefs[field] === value ? "active" : ""}
                onClick={() => onChange({ ...prefs, [field]: value })}
              >
                {name}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
export function useReaderAppearance(prefs: ReadingPreferences) {
  const [light, setLight] = useState(false);
  useEffect(() => {
    const query = window.matchMedia?.("(prefers-color-scheme: light)");
    const update = () => setLight(query?.matches ?? false);
    update();
    query?.addEventListener("change", update);
    return () => query?.removeEventListener("change", update);
  }, []);
  const theme =
    prefs.theme === "system"
      ? light
        ? "light"
        : "dark"
      : (prefs.theme ?? "dark");
  const style: CSSProperties = {
    fontFamily:
      prefs.fontFamily === "sans"
        ? "Arial, Helvetica, sans-serif"
        : prefs.fontFamily === "literary"
          ? 'Palatino, "Palatino Linotype", Georgia, serif'
          : "Georgia, Cambria, serif",
    fontSize: {
      small: "1rem",
      normal: "1.125rem",
      medium: "1.25rem",
      large: "1.5rem",
      xlarge: "1.75rem",
    }[prefs.fontSize],
    lineHeight: { compact: 1.5, normal: 1.75, relaxed: 2 }[prefs.lineHeight],
    maxWidth: { compact: "32rem", comfortable: "42rem", wide: "56rem" }[
      prefs.measure
    ],
  };
  return { themeClass: `reader-theme-${theme}`, style };
}
export function ReaderIndex({
  workId,
  chapters,
  currentChapter,
  poetry = false,
  onSelect,
}: {
  workId: string;
  chapters: Chapter[];
  currentChapter: Chapter;
  poetry?: boolean;
  onSelect?: (id: string) => void;
}) {
  const navigate = useNavigate();
  const id = useId();
  return (
    <nav
      className="chapter-select-wrapper"
      aria-label={poetry ? "Índice de poemas" : "Índice de capítulos"}
    >
      <label htmlFor={id}>
        {poetry ? "Escolher poema" : "Mudar de capítulo"}
      </label>
      <select
        id={id}
        className="chapter-dropdown-select"
        value={currentChapter.id}
        onChange={(e) =>
          onSelect
            ? onSelect(e.target.value)
            : navigate(`/obras/${workId}/capitulos/${e.target.value}`)
        }
      >
        {chapters.map((entry, index) => (
          <option key={entry.id} value={entry.id}>
            {index + 1}. {entry.title}
          </option>
        ))}
      </select>
    </nav>
  );
}
export function poetryStanzas(content: string): string[][] {
  return content
    .replace(/\r\n?/g, "\n")
    .split(/\n[\t ]*\n/)
    .map((stanza) => stanza.split("\n"));
}
