import { useEffect, useState, useMemo, type FormEvent } from "react";
import { Button, Field, Select, Modal } from "../../components/ui";
import type { StudioWork, WorkFormat, AgeRating } from "./types";
import { useRemoteWorks } from "./RemoteWorksProvider";
import { LanguageCombobox } from "../../components/LanguageCombobox";
import { WorkCover } from "../../components/WorkCover";
import {
  EDITORIAL_COVER_PALETTE,
  COVER_STYLES,
  coverStyleDefinitions,
  type CoverStyle,
  isValidHexColor,
  normalizeHexColor,
  getCoverContrastTheme,
} from "../../data/covers";
import { getGenresForFormat } from "../../data/genres";

export function WorkMetadataForm({
  work,
  onDirtyChange,
}: {
  work: StudioWork;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const remote = useRemoteWorks();
  const [baseline, setBaseline] = useState(work);
  const [recoverConfirm, setRecoverConfirm] = useState(false);
  const [title, setTitle] = useState(work.title);
  const [subtitle, setSubtitle] = useState(work.subtitle ?? "");
  const [synopsis, setSynopsis] = useState(work.synopsis);
  const [format, setFormat] = useState(work.format);
  const [language, setLanguage] = useState(work.language);
  const [genre, setGenre] = useState(work.genre);
  const [tags, setTags] = useState(work.tags.join(", "));
  const [ageRating, setAgeRating] = useState(work.ageRating);
  const [warnings, setWarnings] = useState(work.contentWarnings.join(", "));
  const [color, setColor] = useState(work.coverAccentColor);
  const [customHex, setCustomHex] = useState(work.coverAccentColor);
  const [coverStyle, setCoverStyle] = useState<CoverStyle>("geometric");
  const [saved, setSaved] = useState(false);

  const formatGenres = useMemo(() => getGenresForFormat(format), [format]);

  const split = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaved(false);
    const result = await remote.controller?.update(baseline, {
      title,
      subtitle,
      synopsis,
      format,
      language,
      genre,
      tags: split(tags),
      ageRating,
      contentWarnings: split(warnings),
      coverAccentColor: color,
    });
    if (result) {
      apply(result);
      setSaved(true);
    }
  }

  const dirty =
    title !== baseline.title ||
    subtitle !== (baseline.subtitle ?? "") ||
    synopsis !== baseline.synopsis ||
    format !== baseline.format ||
    language !== baseline.language ||
    genre !== baseline.genre ||
    tags !== baseline.tags.join(", ") ||
    ageRating !== baseline.ageRating ||
    warnings !== baseline.contentWarnings.join(", ") ||
    color !== baseline.coverAccentColor;

  function apply(latest: StudioWork) {
    setBaseline(latest);
    setTitle(latest.title);
    setSubtitle(latest.subtitle ?? "");
    setSynopsis(latest.synopsis);
    setFormat(latest.format);
    setLanguage(latest.language);
    setGenre(latest.genre);
    setTags(latest.tags.join(", "));
    setAgeRating(latest.ageRating);
    setWarnings(latest.contentWarnings.join(", "));
    setColor(latest.coverAccentColor);
    setCustomHex(latest.coverAccentColor);
  }

  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;
    const before = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const links = (event: MouseEvent) => {
      if (
        (event.target as Element)?.closest?.("a[href]") &&
        !window.confirm(
          "Existem metadados não guardados. Queres sair e descartá-los?",
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", before);
    document.addEventListener("click", links, true);
    return () => {
      window.removeEventListener("beforeunload", before);
      document.removeEventListener("click", links, true);
    };
  }, [dirty]);

  return (
    <section className="studio-section mt-5" aria-label="Editar metadados">
      <h2>Editar metadados</h2>
      {dirty && <p role="status">Metadados não guardados</p>}
      <form onSubmit={submit} onChange={() => setSaved(false)}>
        <fieldset disabled={remote.saving || Boolean(work.archivedAt)}>
          <Field
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
          />
          <Field
            label="Subtítulo"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            maxLength={200}
          />
          <label className="field">
            <span>Sinopse</span>
            <textarea
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              maxLength={10000}
            />
          </label>
          <Select
            label="Formato"
            value={format}
            disabled={work.chapters.length > 0}
            title={
              work.chapters.length
                ? "O formato fica protegido enquanto existirem entradas."
                : undefined
            }
            onChange={(e) => setFormat(e.target.value as WorkFormat)}
          >
            {["Romance", "Conto", "Poesia", "HQ / Comic", "Mangá"].map(
              (value) => (
                <option key={value}>{value}</option>
              ),
            )}
          </Select>

          {/* Seletor Acessível de Idiomas */}
          <div className="mb-4">
            <LanguageCombobox
              value={language}
              onChange={(val) => setLanguage(val)}
              label="Idioma"
              required
            />
          </div>

          {/* Género Literário Contextualizado */}
          <Select
            label="Género"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          >
            {!formatGenres.all.includes(genre) && (
              <option value={genre}>{genre}</option>
            )}
            <optgroup label={`Sugeridos para ${format}`}>
              {formatGenres.recommended.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </optgroup>
            <optgroup label="Todos os géneros">
              {formatGenres.all
                .filter((value) => !formatGenres.recommended.includes(value))
                .map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
            </optgroup>
          </Select>

          <Field
            label="Tags (separadas por vírgulas)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            maxLength={1000}
          />
          <Select
            label="Classificação etária"
            value={ageRating}
            onChange={(e) => setAgeRating(e.target.value as AgeRating)}
          >
            {["Livre", "+12", "+14", "+16", "+18"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </Select>
          <Field
            label="Avisos de conteúdo (separados por vírgulas)"
            value={warnings}
            onChange={(e) => setWarnings(e.target.value)}
            maxLength={1000}
          />

          {/* Paleta Editorial Ampliada de 28 Cores */}
          <div className="mb-4 text-left">
            <div className="flex items-center justify-between mb-1.5">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Cor da Capa (28 Cores ou Personalizada)
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {getCoverContrastTheme(color) === "light"
                  ? "Fundo Claro (Texto Escuro)"
                  : "Fundo Escuro (Texto Claro)"}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              {EDITORIAL_COVER_PALETTE.map((col) => {
                const isSelected =
                  color.toUpperCase() === col.hex.toUpperCase();
                return (
                  <button
                    key={col.id}
                    type="button"
                    title={`${col.name} (${col.hex})`}
                    className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                      isSelected
                        ? "border-slate-900 dark:border-white scale-125 z-10 shadow-sm"
                        : "border-transparent hover:scale-110"
                    }`}
                    style={{ backgroundColor: col.hex }}
                    onClick={() => {
                      setColor(col.hex);
                      setCustomHex(col.hex);
                    }}
                    aria-label={`Cor ${col.name} ${col.hex}`}
                  />
                );
              })}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input
                type="color"
                value={isValidHexColor(color) ? color : "#14243B"}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setColor(val);
                  setCustomHex(val);
                }}
                className="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent"
                title="Seletor visual de cor HEX"
              />
              <input
                type="text"
                value={customHex}
                placeholder="#14243B"
                maxLength={7}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setCustomHex(val);
                  if (isValidHexColor(val)) {
                    setColor(val);
                  }
                }}
                className="w-28 font-mono text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 uppercase"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Código HEX (#RRGGBB)
              </span>
            </div>
          </div>

          {/* Experimentação de Estilos de Capa e Pré-visualização Viva */}
          <div className="mb-5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Experimentar Estilos Gráficos de Capa
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                Persistência de estilo na próxima fase
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 mb-4">
              {COVER_STYLES.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setCoverStyle(st)}
                  className={`px-2 py-1.5 text-xs font-medium rounded-lg border text-left transition-colors ${
                    coverStyle === st
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                  }`}
                >
                  <div className="font-semibold truncate">
                    {coverStyleDefinitions[st]?.label.split(" ")[0]}
                  </div>
                  <div className="text-[10px] opacity-75 truncate">{st}</div>
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="w-[150px] flex-shrink-0">
                <WorkCover
                  title={title || "Título da Obra"}
                  author="Autor do Arquivo"
                  subtitle={subtitle}
                  color={color}
                  style={coverStyle}
                  format={format}
                  size="responsive"
                />
              </div>
              <div className="flex-1 space-y-1.5 text-left text-xs">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Pré-visualização Viva da Edição
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  Estilo selecionado: <strong>{coverStyleDefinitions[coverStyle]?.label}</strong>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  * O estilo da capa pode ser experimentado livremente em pré-visualização. A persistência do estilo gráfico será ativada na próxima etapa de migração da base de dados; a cor personalizada e todos os demais metadados são gravados de imediato na tua conta.
                </p>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={remote.saving || !remote.enabled}>
            {remote.saving ? "A guardar…" : "Guardar alterações"}
          </Button>
        </fieldset>
        {saved && <p role="status">Alterações guardadas na tua conta.</p>}
        <p className="text-muted">
          Rascunho privado. A propriedade técnica não define autoria pública nem
          publicação editorial.
        </p>
      </form>
      <Button
        variant="ghost"
        disabled={remote.saving}
        onClick={() => setRecoverConfirm(true)}
      >
        Repor metadados persistidos
      </Button>
      {recoverConfirm && (
        <Modal
          open
          title="Repor metadados?"
          onClose={() => setRecoverConfirm(false)}
        >
          <p>
            As alterações deste formulário serão substituídas pelos dados do
            servidor.
          </p>
          <Button variant="ghost" onClick={() => setRecoverConfirm(false)}>
            Cancelar
          </Button>
          <Button
            disabled={remote.saving}
            onClick={async () => {
              const latest = await remote.controller?.recover(work.id);
              if (latest) {
                apply(latest);
                setSaved(false);
                setRecoverConfirm(false);
              }
            }}
          >
            Confirmar reposição
          </Button>
        </Modal>
      )}
    </section>
  );
}
