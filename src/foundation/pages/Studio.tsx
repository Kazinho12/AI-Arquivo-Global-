import { PublicationControls } from "../features/studio/PublicationControls";
import {
  RemoteEntryEditor,
  entryPath,
  entryLabel,
} from "../features/studio/RemoteEntryEditor";
import { WorkMetadataForm } from "../features/studio/WorkMetadataForm";
import { Modal } from "../components/ui";
import { storeImage, LocalImage } from "../features/local/images";
import { currentScope } from "../features/local/persistence";
import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  PenLine,
  BookOpen,
  Plus,
  Eye,
  Edit3,
  Copy,
  Trash2,
  Archive,
  Search,
  LayoutGrid,
  List as ListIcon,
  Feather,
  Layers,
  ArrowRight,
  Info,
  Check,
  AlertTriangle,
  Upload,
  BarChart3,
  FolderKanban,
  Clock,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthProvider";
import { useStudio } from "../features/studio/store";
import type {
  StudioWork,
  WorkFormat,
  AgeRating,
  WorkStatus,
} from "../features/studio/types";
import { HybridProseEditor } from "../features/studio/HybridProseEditor";
import { PoetryEditor } from "../features/studio/PoetryEditor";
import { VisualSequencer } from "../features/studio/VisualSequencer";
import { Button, Badge } from "../components/ui";
import { NotFound } from "./States";
import { LanguageCombobox } from "../components/LanguageCombobox";
import { WorkCover } from "../components/WorkCover";
import {
  EDITORIAL_COVER_PALETTE,
  COVER_STYLES,
  coverStyleDefinitions,
  type CoverStyle,
  isValidHexColor,
  normalizeHexColor,
  getCoverContrastTheme,
} from "../data/covers";
import { getGenresForFormat } from "../data/genres";

const isArchived = (work: StudioWork) =>
  Boolean(work.archivedAt) || work.status === "archived";
const statusLabel = (work: StudioWork) =>
  isArchived(work)
    ? "Arquivada"
    : work.status === "published"
      ? "Publicada"
      : work.withdrawnAt
        ? "Retirada"
        : "Rascunho";

const statusClass = (work: StudioWork) =>
  isArchived(work)
    ? "status-archived"
    : work.status === "published"
      ? "status-published"
      : "status-draft";

function usePageActive() {
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  return active;
}

function StudioPersistenceNotice() {
  const { remote, works } = useStudio();
  const localCount = works.filter(
    (work) => work.persistence !== "supabase",
  ).length;
  return (
    <div className="studio-demo-banner" style={{ display: "block" }}>
      <p>
        <strong>Estúdio do Autor</strong> ·{" "}
        {remote.enabled
          ? "A edição e os rascunhos são guardados na conta. Só a publicação confirmada torna uma edição acessível aos leitores."
          : "Inicia sessão para criar e recuperar rascunhos guardados na tua conta."}
      </p>
      {localCount > 0 && (
        <p>
          {localCount} obra(s) apenas neste navegador, identificadas como
          locais. Não foram enviadas nem migradas automaticamente.
        </p>
      )}
      <p>
        As obras antigas deste navegador continuam locais e não foram
        importadas. As imagens ainda não têm armazenamento remoto.
      </p>
      {remote.loading && <p role="status">A carregar as tuas obras…</p>}
      {remote.saving && <p role="status">A guardar…</p>}
      {remote.error && <p role="alert">{remote.error}</p>}
      {remote.enabled && (
        <Button
          variant="ghost"
          disabled={remote.saving || remote.loading}
          onClick={() => void remote.controller?.load()}
        >
          Atualizar obras
        </Button>
      )}
      {!remote.enabled && (
        <Link to="/entrar" className="text-link">
          Iniciar sessão
        </Link>
      )}
    </div>
  );
}

// ============================================================================
// 1. Studio Dashboard: /estudio
// ============================================================================
export function StudioDashboardPage() {
  const { state: authState } = useAuth();
  const { works, activeWorks, activities, stats, remote } = useStudio();
  const navigate = useNavigate();

  const authorName =
    authState.user?.user_metadata?.display_name ||
    authState.user?.user_metadata?.name ||
    "Autor(a)";

  const recentWorks = useMemo(() => {
    return [
      ...(remote.enabled
        ? activeWorks
        : works.filter((work) => !isArchived(work))),
    ]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 4);
  }, [works, activeWorks, remote.enabled]);

  return (
    <div className="container studio-page">
      {/* Notice Banner */}
      <StudioPersistenceNotice />

      {/* Header with Greeting */}
      <header className="studio-header">
        <div>
          <span className="eyebrow">ESPAÇO DE CRIAÇÃO</span>
          <h1>Olá, {authorName}.</h1>
          <p className="studio-subtitle">
            Gere as tuas publicações, escreve novos capítulos e organiza a tua
            produção literária e artística.
          </p>
        </div>

        <div className="studio-header-actions">
          <Link to="/estudio/obras/nova" className="button primary">
            <Plus size={16} /> Criar nova obra
          </Link>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="studio-stats-row" aria-label="Resumo do estúdio">
        <div className="studio-stat-card">
          <span className="stat-label">Total de Obras</span>
          <span className="stat-value font-mono">{stats.totalWorks}</span>
          <span className="stat-hint">
            {stats.draftsCount}{" "}
            {stats.draftsCount === 1
              ? "rascunho privado ativo"
              : "rascunhos privados ativos"}{" "}
            na conta · {stats.publishedCount} publicadas
          </span>
        </div>

        <div className="studio-stat-card">
          <span className="stat-label">Capítulos, Poemas & Atos</span>
          <span className="stat-value font-mono">{stats.totalChapters}</span>
          <span className="stat-hint">Em todas as obras ativas</span>
        </div>

        <div className="studio-stat-card">
          <span className="stat-label">Volume de Palavras</span>
          <span className="stat-value font-mono">
            {stats.totalWords.toLocaleString("pt-PT")}
          </span>
          <span className="stat-hint">
            ~{stats.avgReadTimeMinutes} min de leitura total
          </span>
        </div>

        <div className="studio-stat-card">
          <span className="stat-label">Audiência</span>
          <span className="stat-value font-mono">—</span>
          <span className="stat-hint">Sem dados de audiência</span>
        </div>
      </section>

      {/* Recently Edited Works */}
      <section className="studio-section" aria-label="Continuar a escrever">
        <div className="section-header-row">
          <h2>Continuar a Escrever</h2>
          <Link to="/estudio/publicacoes" className="text-link text-sm">
            Ver todas as obras ({works.length}) →
          </Link>
        </div>

        {recentWorks.length === 0 ? (
          <div className="studio-empty-state">
            <BookOpen size={40} className="empty-icon" />
            <h3>Ainda não tens obras no teu estúdio</h3>
            <p>
              Começa por criar o teu primeiro romance, conto, poesia ou mangá.
            </p>
            <Link to="/estudio/obras/nova" className="button primary mt-3">
              Criar primeira obra
            </Link>
          </div>
        ) : (
          <div className="studio-works-grid">
            {recentWorks.map((work) => {
              const firstChapterId = work.chapters[0]?.id || "cap-1";
              const editLink =
                work.persistence === "supabase"
                  ? work.chapters[0]
                    ? entryPath(work, work.chapters[0])
                    : `/estudio/obras/${work.id}`
                  : work.mode === "comic" || work.mode === "manga"
                    ? `/estudio/obras/${work.id}/paginas/${firstChapterId}/editar`
                    : `/estudio/obras/${work.id}/capitulos/${firstChapterId}/editar`;

              return (
                <article key={work.id} className="studio-work-card">
                  <header className="work-card-top">
                    <span className="work-format-tag">
                      {work.format} ·{" "}
                      {work.persistence === "supabase"
                        ? "Guardada na conta"
                        : "Local"}
                    </span>
                    <span
                      className={`status-indicator ${
                        isArchived(work) ? "status-archived" : statusClass(work)
                      }`}
                    >
                      {statusLabel(work)}
                    </span>
                  </header>

                  <h3 className="work-title">
                    <Link to={`/estudio/obras/${work.id}`}>{work.title}</Link>
                  </h3>
                  <p className="work-synopsis-snippet">{work.synopsis}</p>

                  <div className="work-card-meta">
                    <span>
                      {work.chapters.length}{" "}
                      {work.mode === "poetry"
                        ? work.chapters.length === 1
                          ? "poema"
                          : "poemas"
                        : work.mode === "comic" || work.mode === "manga"
                          ? work.chapters.length === 1
                            ? "ato"
                            : "atos"
                          : work.chapters.length === 1
                            ? "capítulo"
                            : "capítulos"}
                    </span>
                    <span className="separator" aria-hidden="true">
                      ·
                    </span>
                    <span>{work.updatedAt}</span>
                  </div>

                  <footer className="work-card-footer">
                    <Link
                      to={editLink}
                      className="button primary w-full text-center"
                    >
                      <Edit3 size={14} className="inline mr-1" /> Escrever /
                      Editar
                    </Link>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Editorial Activity Log */}
      <section
        className="studio-section mt-5"
        aria-label="Atividade editorial recente"
      >
        <div className="section-header-row">
          <h2>Atividade Editorial Recente</h2>
        </div>

        {activities.length === 0 ? (
          <p className="text-muted text-sm">
            Nenhuma atividade registada ainda.
          </p>
        ) : (
          <div className="activity-timeline">
            {activities.slice(0, 5).map((act) => (
              <div key={act.id} className="activity-item">
                <span className="activity-dot" aria-hidden="true" />
                <div className="activity-content">
                  <span className="activity-work">{act.workTitle}</span>
                  <span className="separator" aria-hidden="true">
                    ·
                  </span>
                  <span className="activity-desc">{act.description}</span>
                  <time className="activity-time">{act.timestamp}</time>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ============================================================================
// 2. Multi-step Creation Wizard: /estudio/obras/nova
// ============================================================================
export function NewWorkWizardPage() {
  const active = usePageActive();
  const { remote } = useStudio();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State
  const [format, setFormat] = useState<WorkFormat>("Romance");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [genre, setGenre] = useState("Ficção geral");
  const [language, setLanguage] = useState("Português");
  const [tagsInput, setTagsInput] = useState("");
  const [ageRating, setAgeRating] = useState<AgeRating>("Livre");
  const [contentWarnings, setContentWarnings] = useState<string[]>([]);
  const [coverAccentColor, setCoverAccentColor] = useState("#14243B");
  const [coverStyle, setCoverStyle] = useState<CoverStyle>("geometric");
  const [customHex, setCustomHex] = useState("#14243B");

  const formatGenres = useMemo(() => getGenresForFormat(format), [format]);
  const mode =
    format === "Poesia"
      ? "poetry"
      : format === "HQ / Comic"
        ? "comic"
        : format === "Mangá"
          ? "manga"
          : "prose";

  const handleFormatSelect = (value: WorkFormat) => setFormat(value);

  const handleCreate = async () => {
    if (!title.trim() || !remote.controller || remote.saving) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const created = await remote.controller.create({
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      synopsis: synopsis.trim() || "Sem sinopse definida.",
      format,
      genre,
      language,
      tags: tags.length > 0 ? tags : ["ficção"],
      ageRating,
      contentWarnings,
      coverAccentColor,
    });

    if (created && active.current) navigate(`/estudio/obras/${created.id}`);
  };

  return (
    <div className="container studio-page">
      <StudioPersistenceNotice />
      <nav className="studio-breadcrumb">
        <Link to="/estudio" className="text-link">
          ← Voltar ao painel do Estúdio
        </Link>
      </nav>

      <fieldset
        disabled={remote.saving}
        style={{ border: 0, padding: 0, minWidth: 0 }}
      >
        <header className="wizard-header">
          <span className="eyebrow">NOVA CRIAÇÃO</span>
          <h1>Criar uma Nova Obra</h1>
          <p className="studio-subtitle">
            Define o formato, identidade e estrutura inicial da tua história ou
            poema.
          </p>

          {/* Stepper Progress */}
          <div className="wizard-stepper">
            {[
              [1, "Formato"],
              [2, "Identidade"],
              [3, "Estrutura"],
              [4, "Pré-visualização"],
              [5, "Confirmação"],
            ].map(([num, label]) => (
              <button
                key={num}
                type="button"
                className={`stepper-step ${step === num ? "active" : step > (num as number) ? "completed" : ""}`}
                onClick={() => setStep(num as any)}
              >
                <span className="step-num">{num}</span>
                <span className="step-label">{label}</span>
              </button>
            ))}
          </div>
        </header>

        {/* Step 1: Formato */}
        {step === 1 && (
          <section className="wizard-card-step">
            <h2>Etapa 1 — Escolhe o formato da tua obra</h2>
            <p className="step-description">
              O formato define as ferramentas do editor e a experiência de
              leitura apresentada ao público.
            </p>

            <div className="format-selection-grid">
              {(
                [
                  [
                    "Romance",
                    "Romance, novela ou narrativa longa com múltiplos capítulos.",
                    "prose",
                  ],
                  [
                    "Conto",
                    "História curta ou antologia de episódios breves.",
                    "prose",
                  ],
                  [
                    "Poesia",
                    "Versos livres ou rimados com preservação rígida de estrofes.",
                    "poetry",
                  ],
                  [
                    "HQ / Comic",
                    "História em quadrinhos ocidental (da esquerda para a direita).",
                    "comic",
                  ],
                  [
                    "Mangá",
                    "Banda desenhada oriental com leitura tradicional RTL (da direita para a esquerda).",
                    "manga",
                  ],
                ] as const
              ).map(([fmt, desc]) => (
                <article
                  key={fmt}
                  className={`format-card ${format === fmt ? "selected" : ""}`}
                  onClick={() => handleFormatSelect(fmt as WorkFormat)}
                >
                  <div className="format-card-radio">
                    <input
                      type="radio"
                      name="work-format"
                      checked={format === fmt}
                      onChange={() => handleFormatSelect(fmt as WorkFormat)}
                      aria-label={fmt}
                    />
                  </div>
                  <div>
                    <h3 className="format-title">{fmt}</h3>
                    <p className="format-desc">{desc}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="wizard-nav-actions">
              <span />
              <Button variant="primary" onClick={() => setStep(2)}>
                Continuar: Identidade da Obra →
              </Button>
            </div>
          </section>
        )}

        {/* Step 2: Identidade */}
        {step === 2 && (
          <section className="wizard-card-step">
            <h2>Etapa 2 — Identidade e Metadados</h2>
            <p className="step-description">
              Informações essenciais para apresentar a história aos leitores e
              no catálogo.
            </p>

            <div className="wizard-form-grid">
              <div className="form-group col-span-2">
                <label htmlFor="w-title" className="field-label">
                  Título da Obra *
                </label>
                <input
                  id="w-title"
                  type="text"
                  placeholder="Ex.: O Som do Salitre"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group col-span-2">
                <label htmlFor="w-subtitle" className="field-label">
                  Subtítulo (opcional)
                </label>
                <input
                  id="w-subtitle"
                  type="text"
                  placeholder="Ex.: Crónicas de um Verão na Costa"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="form-group col-span-2">
                <label htmlFor="w-synopsis" className="field-label">
                  Sinopse *
                </label>
                <textarea
                  id="w-synopsis"
                  rows={4}
                  placeholder="Apresenta a premissa da tua história ou a respiração do teu livro de poemas..."
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  className="comment-textarea"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="w-genre" className="field-label">
                  Género Literário
                </label>
                <select
                  id="w-genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="filter-select w-full"
                >
                  <optgroup label={`Sugeridos para ${format}`}>
                    {formatGenres.recommended.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Todos os Géneros">
                    {formatGenres.all
                      .filter((g) => !formatGenres.recommended.includes(g))
                      .map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              <div className="form-group col-span-2">
                <LanguageCombobox
                  id="w-lang"
                  value={language}
                  onChange={(val) => setLanguage(val)}
                  label="Idioma Principal *"
                  required
                />
              </div>

              <div className="form-group col-span-2">
                <label htmlFor="w-tags" className="field-label">
                  Tags (separadas por vírgulas)
                </label>
                <input
                  id="w-tags"
                  type="text"
                  placeholder="mar, memória, costa, cartografia"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label htmlFor="w-rating" className="field-label">
                  Classificação Etária
                </label>
                <select
                  id="w-rating"
                  value={ageRating}
                  onChange={(e) => setAgeRating(e.target.value as AgeRating)}
                  className="filter-select w-full"
                >
                  <option value="Livre">Livre (para todas as idades)</option>
                  <option value="+12">+12 anos</option>
                  <option value="+14">+14 anos</option>
                  <option value="+16">+16 anos</option>
                  <option value="+18">+18 anos</option>
                </select>
              </div>

              {/* Seletor Ampliado de Cores da Capa (28 Cores + Custom HEX) */}
              <div className="form-group col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="field-label">
                    Paleta Editorial de Cores (28 Cores ou Personalizada)
                  </label>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {getCoverContrastTheme(coverAccentColor) === "light"
                      ? "Contraste Claro (Texto Escuro)"
                      : "Contraste Escuro (Texto Claro)"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
                  {EDITORIAL_COVER_PALETTE.map((col) => {
                    const isSelected =
                      coverAccentColor.toUpperCase() === col.hex.toUpperCase();
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
                          setCoverAccentColor(col.hex);
                          setCustomHex(col.hex);
                        }}
                        aria-label={`Cor ${col.name} ${col.hex}`}
                      />
                    );
                  })}
                </div>

                {/* Seletor HEX personalizado */}
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="color"
                    value={
                      isValidHexColor(coverAccentColor)
                        ? coverAccentColor
                        : "#14243B"
                    }
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setCoverAccentColor(val);
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
                        setCoverAccentColor(val);
                      }
                    }}
                    className="w-28 font-mono text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 uppercase"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Insere qualquer código HEX válido (#RRGGBB)
                  </span>
                </div>
              </div>

              {/* Experimentador de Estilos Gráficos */}
              <div className="form-group col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="field-label">Estilo Gráfico da Capa</label>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                    Persistência de estilo na próxima fase
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {COVER_STYLES.map((st) => {
                    const isSelected = coverStyle === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setCoverStyle(st)}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-colors ${
                          isSelected
                            ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-sm"
                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                        }`}
                      >
                        <div className="font-semibold truncate">
                          {coverStyleDefinitions[st]?.label.split(" ")[0]}
                        </div>
                        <div className="text-[10px] opacity-75 truncate">
                          {st}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  A cor selecionada é gravada de imediato na tua conta. A persistência dos estilos gráficos personalizados será ativada na próxima migração da base de dados.
                </p>
              </div>

              {/* Pré-visualização Viva da Capa no Passo 2 */}
              <div className="col-span-2 mt-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-[160px] flex-shrink-0">
                    <WorkCover
                      title={title || "Título da Obra"}
                      author="Autor do Arquivo"
                      subtitle={subtitle}
                      color={coverAccentColor}
                      style={coverStyle}
                      format={format}
                      size="responsive"
                    />
                  </div>
                  <div className="flex-1 space-y-2 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Pré-visualização Viva da Capa
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {coverStyleDefinitions[coverStyle]?.label}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {title || "Sem título definido"}
                    </h3>
                    {subtitle && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                        {subtitle}
                      </p>
                    )}
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Formato: <strong>{format}</strong> · Género: <strong>{genre}</strong> · Idioma: <strong>{language}</strong>
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      ✓ Contraste tipográfico acessível calculado automaticamente segundo as normas WCAG AA.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="wizard-nav-actions">
              <Button variant="ghost" onClick={() => setStep(1)}>
                ← Voltar ao Formato
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep(3)}
                disabled={!title.trim() || !remote.enabled || remote.saving}
              >
                Continuar: Estrutura Inicial →
              </Button>
            </div>
          </section>
        )}

        {/* Step 3: Estrutura Inicial */}
        {step === 3 && (
          <section className="wizard-card-step">
            <h2>Etapa 3 — Estrutura</h2>
            <p>
              Este rascunho guarda os metadados da obra. Podes adicionar
              capítulos, poemas ou atos depois de criares a obra.
            </p>
            <div className="wizard-nav-actions">
              <Button variant="ghost" onClick={() => setStep(2)}>
                ← Voltar à Identidade
              </Button>
              <Button onClick={() => setStep(4)}>
                Continuar: Pré-visualização →
              </Button>
            </div>
          </section>
        )}

        {/* Step 4: Pré-visualização */}
        {step === 4 && (
          <section className="wizard-card-step">
            <h2>Etapa 4 — Pré-visualização do Rascunho</h2>
            <p className="step-description">
              Pré-visualização privada dos metadados. A obra não será publicada.
            </p>

            <article className="work-preview-simulation">
              <aside className="preview-cover-sim flex justify-center p-2 bg-transparent">
                <WorkCover
                  title={title || "Título da Obra"}
                  author="Autor da Obra"
                  subtitle={subtitle}
                  color={coverAccentColor}
                  style={coverStyle}
                  format={format}
                  size="md"
                />
              </aside>

              <div className="preview-meta-sim">
                <div className="sim-badge-row">
                  <Badge>{format}</Badge>
                  <Badge>{genre}</Badge>
                  <Badge>{ageRating}</Badge>
                </div>

                <h1>{title || "Sem título definido"}</h1>
                {subtitle && (
                  <p className="text-muted font-medium">{subtitle}</p>
                )}

                <p className="sim-synopsis">
                  {synopsis ||
                    "Ainda não escreveste uma sinopse para esta obra."}
                </p>

                <div className="sim-structure-preview">
                  <strong>Estrutura:</strong> capítulos disponíveis numa próxima
                  etapa.
                </div>
              </div>
            </article>

            <div className="wizard-nav-actions">
              <Button variant="ghost" onClick={() => setStep(3)}>
                ← Voltar à Estrutura
              </Button>
              <Button variant="primary" onClick={() => setStep(5)}>
                Continuar: Preparação Editorial →
              </Button>
            </div>
          </section>
        )}

        {/* Step 5: Preparação Editorial */}
        {step === 5 && (
          <section className="wizard-card-step">
            <h2>Etapa 5 — Preparação Editorial e Criação</h2>
            <p className="step-description">
              Revê a validação da tua obra antes de abrir o espaço de escrita no
              Estúdio.
            </p>

            <div className="editorial-checklist-card">
              <ul className="checklist-items">
                <li className="checklist-item">
                  <Check size={16} className="text-emerald-500" />
                  <span>
                    Formato selecionado: <strong>{format}</strong> ({mode})
                  </span>
                </li>
                <li className="checklist-item">
                  <Check size={16} className="text-emerald-500" />
                  <span>
                    Título e metadados validados: <strong>{title}</strong>
                  </span>
                </li>
                <li className="checklist-item">
                  <Check size={16} className="text-emerald-500" />
                  <span>Sinopse registada ({synopsis.length} caracteres)</span>
                </li>
                <li className="checklist-item">
                  <Check size={16} className="text-emerald-500" />
                  <span>
                    Rascunho sem capítulos; metadados guardados na conta
                  </span>
                </li>
                <li className="checklist-item">
                  <Check size={16} className="text-emerald-500" />
                  <span>
                    Classificação etária: {ageRating} · Idioma: {language}
                  </span>
                </li>
              </ul>

              <div className="editorial-notice mt-4">
                <Info size={16} />
                <span>
                  Esta obra será guardada na tua conta como{" "}
                  <strong>Rascunho privado</strong>. Não será publicada.
                </span>
              </div>
            </div>

            <div className="wizard-nav-actions">
              <Button variant="ghost" onClick={() => setStep(4)}>
                ← Voltar à Pré-visualização
              </Button>
              <Button
                variant="primary"
                onClick={handleCreate}
                disabled={!title.trim() || !remote.enabled || remote.saving}
              >
                <Sparkles size={16} className="inline mr-1" />{" "}
                {remote.saving ? "A guardar…" : "Criar obra e abrir no Estúdio"}
              </Button>
            </div>
          </section>
        )}
      </fieldset>
    </div>
  );
}

// ============================================================================
// 3. Work Management: /estudio/obras/:id
// ============================================================================
export function WorkManagePage() {
  const active = usePageActive();
  const { id } = useParams<{ id: string }>();
  const { works, store, remote } = useStudio();
  const navigate = useNavigate();

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [metadataDirty, setMetadataDirty] = useState(false);

  const work = works.find((w) => w.id === id);

  if (!work) {
    if (remote.loading || remote.error)
      return (
        <div className="container studio-page">
          <StudioPersistenceNotice />
        </div>
      );
    return <NotFound />;
  }
  const isRemote = work.persistence === "supabase";

  const isVisual = work.mode === "comic" || work.mode === "manga";

  const handleAddChapter = async () => {
    if (isRemote) {
      const result = await remote.controller?.editorial(work, "add_entry");
      const added = result?.work?.chapters.find(
        (entry) => !work.chapters.some((old) => old.id === entry.id),
      );
      if (added && result?.work && active.current)
        navigate(entryPath(result.work, added));
      return;
    }
    const chap = store.addChapter(work.id);
    if (chap) navigate(entryPath(work, chap));
  };
  const handleDuplicate = async () => {
    const copy = isRemote
      ? (await remote.controller?.editorial(work, "duplicate_work"))?.work
      : store.duplicateWork(work.id);
    if (copy && active.current) navigate(`/estudio/obras/${copy.id}`);
  };
  const handleDelete = async () => {
    setDeleteError("");
    try {
      const removed = isRemote
        ? await remote.controller?.remove(work)
        : store.deleteWork(work.id);
      if (!active.current) return;
      if (removed) navigate("/estudio", { replace: true });
      else
        setDeleteError(
          remote.controller?.getSnapshot().error ||
            "Não foi possível eliminar a obra. Atualiza a lista e tenta novamente.",
        );
    } catch {
      if (active.current)
        setDeleteError(
          "Não foi possível eliminar a obra. Verifica a ligação e tenta novamente.",
        );
    }
  };

  return (
    <div className="container studio-page">
      <StudioPersistenceNotice />
      <nav className="studio-breadcrumb">
        <Link to="/estudio/publicacoes" className="text-link">
          ← Voltar às publicações do Estúdio
        </Link>
      </nav>

      {/* Header */}
      <header className="work-manage-header">
        <div className="work-manage-meta">
          <div className="flex items-center gap-2 mb-2">
            <Badge>{work.format}</Badge>
            <Badge>
              {work.persistence === "supabase"
                ? "Guardada na conta · Privada"
                : "Apenas neste navegador"}
            </Badge>
            <Badge>{work.genre}</Badge>
            <span className={`status-indicator ${statusClass(work)}`}>
              {statusLabel(work)}
            </span>
          </div>
          <h1>{work.title}</h1>
          {work.subtitle && (
            <p className="text-muted font-medium">{work.subtitle}</p>
          )}
        </div>

        <div className="work-manage-actions">
          {isRemote && !work.chapters.length && (
            <Button
              disabled={remote.saving || metadataDirty || isArchived(work)}
              onClick={handleAddChapter}
            >
              <Edit3 size={15} /> Escrever / Editar
            </Button>
          )}
          {(!isRemote || work.chapters.length > 0) && (
            <Link
              to={
                isVisual
                  ? `/estudio/obras/${work.id}/paginas/${work.chapters[0]?.id || "cap-1"}/editar`
                  : `/estudio/obras/${work.id}/capitulos/${work.chapters[0]?.id || "cap-1"}/editar`
              }
              className="button primary"
            >
              <Edit3 size={15} /> Escrever / Editar
            </Link>
          )}

          <Button
            variant="secondary"
            disabled={remote.saving || metadataDirty}
            onClick={handleDuplicate}
            title="Duplicar obra"
            aria-label="Duplicar obra"
          >
            <Copy size={15} /> Duplicar
          </Button>

          <Button
            variant="ghost"
            disabled={
              remote.saving ||
              metadataDirty ||
              (isRemote && work.status === "published")
            }
            onClick={() =>
              isRemote
                ? void remote.controller?.editorial(
                    work,
                    isArchived(work) ? "restore" : "archive",
                  )
                : store.archiveWork(work.id)
            }
            title={
              isRemote && work.status === "published"
                ? "Retira a publicação antes de arquivar"
                : "Arquivar ou desarquivar obra"
            }
            aria-label="Arquivar ou desarquivar obra"
          >
            <Archive size={15} />{" "}
            {isArchived(work) ? "Desarquivar" : "Arquivar"}
          </Button>

          <Button
            variant="ghost"
            className="text-rose-500 hover:text-rose-600"
            disabled={remote.saving}
            onClick={() => {
              setDeleteError("");
              setDeleteConfirm(true);
            }}
            title="Eliminar obra"
            aria-label="Eliminar obra"
          >
            <Trash2 size={15} /> Eliminar
          </Button>
        </div>
      </header>

      {deleteError && !deleteConfirm && <p role="alert">{deleteError}</p>}
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <Modal
          open
          onClose={() => {
            if (!remote.saving) setDeleteConfirm(false);
          }}
          title={`Eliminar a obra "${work.title}"?`}
        >
          <p className="mt-2 text-sm text-muted">
            {isRemote
              ? "Esta ação elimina permanentemente a obra, os seus conteúdos e a edição pública, quando existe. Alterações não guardadas serão descartadas."
              : "Esta ação elimina a cópia local e os seus capítulos/páginas deste navegador."}
          </p>
          {deleteError && <p role="alert">{deleteError}</p>}
          {remote.saving && <p role="status">A eliminar a obra…</p>}
          <div className="modal-actions mt-4">
            <Button
              variant="ghost"
              disabled={remote.saving}
              onClick={() => setDeleteConfirm(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="bg-rose-600 hover:bg-rose-700"
              disabled={remote.saving}
              onClick={handleDelete}
            >
              Sim, eliminar obra
            </Button>
          </div>
        </Modal>
      )}

      {isRemote && <PublicationControls work={work} dirty={metadataDirty} />}
      {isRemote && (
        <WorkMetadataForm
          key={work.id}
          work={work}
          onDirtyChange={setMetadataDirty}
        />
      )}
      {isRemote && (
        <p className="editorial-notice">
          {isArchived(work)
            ? "Obra arquivada. Desarquiva para editar."
            : work.status === "published"
              ? "As alterações em edição só chegam aos leitores após atualizar a publicação."
              : "Obra privada. A publicação exige confirmação explícita."}
        </p>
      )}
      {/* Chapters / Structure Section */}
      <section
        className="studio-section mt-5"
        aria-label="Estrutura de capítulos"
      >
        <div className="section-header-row">
          <h2>
            {work.mode === "poetry"
              ? "Poemas"
              : isVisual
                ? "Atos"
                : "Capítulos e Atos"}{" "}
            ({work.chapters.length})
          </h2>
          <Button
            variant="primary"
            disabled={
              remote.saving || metadataDirty || (isRemote && isArchived(work))
            }
            onClick={handleAddChapter}
          >
            <Plus size={15} /> Adicionar {entryLabel(work)}
          </Button>
        </div>

        <div className="chapters-manage-list">
          {work.chapters.map((chap) => {
            const editUrl = isVisual
              ? `/estudio/obras/${work.id}/paginas/${chap.id}/editar`
              : `/estudio/obras/${work.id}/capitulos/${chap.id}/editar`;

            const wordCount = chap.content
              ? chap.content.trim().split(/\s+/).filter(Boolean).length
              : 0;
            const verseCount = chap.stanzas
              ? chap.stanzas.reduce(
                  (acc, st) => acc + st.filter((verse) => verse.trim()).length,
                  0,
                )
              : 0;

            return (
              <article key={chap.id} className="chapter-manage-item">
                <div className="chapter-manage-left">
                  <span className="font-mono text-sm text-muted">
                    {chap.number}.
                  </span>
                  <div>
                    <h3 className="chapter-manage-title">
                      <Link to={editUrl}>{chap.title}</Link>
                    </h3>
                    <div className="chapter-manage-submeta font-mono text-xs text-muted">
                      {work.mode === "poetry" ? (
                        <span>{verseCount} versos</span>
                      ) : isVisual ? (
                        <span>
                          {isRemote
                            ? `${wordCount} palavras de guião`
                            : `${chap.pages?.length || 0} pranchas`}
                        </span>
                      ) : (
                        <span>{wordCount} palavras</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="chapter-manage-right">
                  <Link to={editUrl} className="button secondary">
                    <Edit3 size={14} className="inline mr-1" /> Editar
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Metadata Overview Card */}
      <section
        className="studio-section mt-5"
        aria-label="Ficha técnica da obra"
      >
        <h2>Ficha Técnica e Definições</h2>
        <dl className="work-facts mt-3">
          <div>
            <dt>Formato</dt>
            <dd>{work.format}</dd>
          </div>
          <div>
            <dt>Género</dt>
            <dd>{work.genre}</dd>
          </div>
          <div>
            <dt>Classificação etária</dt>
            <dd>{work.ageRating}</dd>
          </div>
          <div>
            <dt>Idioma</dt>
            <dd>{work.language}</dd>
          </div>
          <div>
            <dt>Data de criação</dt>
            <dd>{work.createdAt}</dd>
          </div>
          <div>
            <dt>Última alteração</dt>
            <dd>{work.updatedAt}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

// ============================================================================
// 4. Chapter Edit Page: /estudio/obras/:id/capitulos/:capituloId/editar
// ============================================================================
export function ChapterEditPage() {
  const { id, capituloId } = useParams<{ id: string; capituloId: string }>();
  const { works, store, remote } = useStudio();
  const navigate = useNavigate();

  const work = works.find((w) => w.id === id);
  if (!work && (remote.loading || remote.error))
    return (
      <div className="container studio-page">
        <StudioPersistenceNotice />
      </div>
    );
  if (work?.persistence === "supabase") {
    const entry = work.chapters.find((item) => item.id === capituloId);
    if (!entry) return <NotFound />;
    return <RemoteEntryEditor key={entry.id} work={work} entry={entry} />;
  }
  if (!work || !["prose", "poetry"].includes(work.mode)) return <NotFound />;

  const currentChapter = work.chapters.find((c) => c.id === capituloId);
  if (!currentChapter) return <NotFound />;

  const handleUpdate = (chapId: string, partial: any) => {
    store.updateChapter(work.id, chapId, partial);
  };

  const handleAdd = () => {
    const newChap = store.addChapter(work.id);
    if (newChap) {
      navigate(`/estudio/obras/${work.id}/capitulos/${newChap.id}/editar`);
    }
  };

  const handleDuplicate = (chapId: string) => {
    const copy = store.duplicateChapter(work.id, chapId);
    if (copy) {
      navigate(`/estudio/obras/${work.id}/capitulos/${copy.id}/editar`);
    }
  };

  const handleDelete = (chapId: string) => {
    store.deleteChapter(work.id, chapId);
    const remaining = work.chapters.filter((c) => c.id !== chapId);
    if (remaining.length > 0) {
      navigate(`/estudio/obras/${work.id}/capitulos/${remaining[0].id}/editar`);
    } else {
      navigate(`/estudio/obras/${work.id}`);
    }
  };

  const handleReorder = (newIds: string[]) => {
    store.reorderChapters(work.id, newIds);
  };

  const handleSelect = (targetChapId: string) => {
    navigate(`/estudio/obras/${work.id}/capitulos/${targetChapId}/editar`);
  };

  if (work.mode === "poetry") {
    return (
      <PoetryEditor
        work={work}
        currentChapter={currentChapter}
        onUpdateChapter={handleUpdate}
        onAddChapter={handleAdd}
        onDuplicateChapter={handleDuplicate}
        onDeleteChapter={handleDelete}
        onReorderChapters={handleReorder}
        onSelectChapter={handleSelect}
      />
    );
  }

  return (
    <HybridProseEditor
      work={work}
      currentChapter={currentChapter}
      onUpdateChapter={handleUpdate}
      onAddChapter={handleAdd}
      onDuplicateChapter={handleDuplicate}
      onDeleteChapter={handleDelete}
      onReorderChapters={handleReorder}
      onSelectChapter={handleSelect}
    />
  );
}

// ============================================================================
// 5. Visual Pages Edit Page: /estudio/obras/:id/paginas/:capituloId/editar
// ============================================================================
export function PagesEditPage() {
  const { id, capituloId } = useParams<{ id: string; capituloId: string }>();
  const { works, store, remote } = useStudio();
  const navigate = useNavigate();

  const work = works.find((w) => w.id === id);
  if (!work && (remote.loading || remote.error))
    return (
      <div className="container studio-page">
        <StudioPersistenceNotice />
      </div>
    );
  if (work?.persistence === "supabase") {
    const entry = work.chapters.find((item) => item.id === capituloId);
    if (!entry) return <NotFound />;
    return <RemoteEntryEditor key={entry.id} work={work} entry={entry} />;
  }
  if (!work || !["comic", "manga"].includes(work.mode)) return <NotFound />;

  const currentChapter = work.chapters.find((c) => c.id === capituloId);
  if (!currentChapter) return <NotFound />;

  const handleAddPage = (pageData?: any) => {
    store.addPage(work.id, currentChapter.id, pageData);
  };

  const handleUpdatePage = (pageId: string, partial: any) => {
    store.updatePage(work.id, currentChapter.id, pageId, partial);
  };

  const handleReorderPages = (newOrderIds: string[]) => {
    store.reorderPages(work.id, currentChapter.id, newOrderIds);
  };

  const handleDeletePage = (pageId: string) => {
    store.deletePage(work.id, currentChapter.id, pageId);
  };

  const handleSelectChapter = (chapId: string) => {
    navigate(`/estudio/obras/${work.id}/paginas/${chapId}/editar`);
  };

  return (
    <VisualSequencer
      work={work}
      currentChapter={currentChapter}
      onAddPage={handleAddPage}
      onUpdatePage={handleUpdatePage}
      onReorderPages={handleReorderPages}
      onDeletePage={handleDeletePage}
      onSelectChapter={handleSelectChapter}
    />
  );
}

// ============================================================================
// 6. Publications Inventory: /estudio/publicacoes
// ============================================================================
export function PublicationsPage() {
  const { works, store, remote } = useStudio();
  const navigate = useNavigate();
  const active = usePageActive();

  const [search, setSearch] = useState("");
  const [filterFormat, setFilterFormat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("active");
  const [origin, setOrigin] = useState(remote.enabled ? "account" : "local");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const filtered = useMemo(() => {
    return works.filter((w) => {
      if (filterFormat !== "all" && w.format !== filterFormat) return false;
      if (
        origin === "account"
          ? w.persistence !== "supabase"
          : w.persistence === "supabase"
      )
        return false;
      if (filterStatus === "active" && isArchived(w)) return false;
      if (filterStatus === "archived" && !isArchived(w)) return false;
      if (filterStatus === "draft" && (isArchived(w) || w.status !== "draft"))
        return false;
      if (
        filterStatus === "withdrawn" &&
        !(w.withdrawnAt && w.status === "draft")
      )
        return false;
      if (filterStatus === "published" && w.status !== "published")
        return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          w.title.toLowerCase().includes(q) ||
          w.synopsis.toLowerCase().includes(q) ||
          w.genre.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [works, filterFormat, filterStatus, search, origin]);

  return (
    <div className="container studio-page">
      <StudioPersistenceNotice />
      <header className="studio-header">
        <div>
          <span className="eyebrow">CATÁLOGO DO AUTOR</span>
          <h1>Publicações e Rascunhos</h1>
          <p className="studio-subtitle">
            Gere todas as tuas obras, organiza os teus rascunhos em
            desenvolvimento e consulta estados.
          </p>
        </div>

        <Link to="/estudio/obras/nova" className="button primary">
          <Plus size={16} /> Nova obra
        </Link>
      </header>

      {/* Toolbar Strip */}
      <div className="library-toolbar-strip">
        <div className="library-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="search"
            placeholder="Pesquisar obras por título, género ou palavra-chave..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="library-search-input"
            aria-label="Pesquisar publicações"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="filter-select"
            aria-label="Origem das obras"
          >
            <option value="account">Obras da conta</option>
            <option value="local">Apenas neste navegador</option>
          </select>
          <select
            value={filterFormat}
            onChange={(e) => setFilterFormat(e.target.value)}
            className="filter-select"
            aria-label="Filtrar por formato"
          >
            <option value="all">Todos os formatos</option>
            <option value="Romance">Romance</option>
            <option value="Conto">Conto</option>
            <option value="Poesia">Poesia</option>
            <option value="HQ / Comic">HQ / Comic</option>
            <option value="Mangá">Mangá</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
            aria-label="Filtrar por estado"
          >
            <option value="all">Todos os estados</option>
            <option value="active">Ativas</option>
            <option value="draft">Rascunhos</option>
            <option value="published">Publicadas</option>
            <option value="withdrawn">Retiradas</option>
            <option value="archived">Arquivadas</option>
          </select>

          <div className="view-mode-toggle">
            <button
              type="button"
              className={viewMode === "grid" ? "active" : ""}
              onClick={() => setViewMode("grid")}
              title="Grelha"
              aria-label="Grelha"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              className={viewMode === "table" ? "active" : ""}
              onClick={() => setViewMode("table")}
              title="Tabela"
              aria-label="Tabela"
            >
              <ListIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {deleteError && !deleteId && <p role="alert">{deleteError}</p>}
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <Modal
          open
          onClose={() => {
            if (!remote.saving) setDeleteId(null);
          }}
          title="Eliminar esta obra?"
        >
          <p className="mt-2 text-sm text-muted">
            Esta ação elimina a obra da conta, os conteúdos e a edição pública,
            quando existe. Nas obras locais, elimina apenas a cópia deste
            navegador.
          </p>
          {deleteError && <p role="alert">{deleteError}</p>}
          {remote.saving && <p role="status">A eliminar a obra…</p>}
          <div className="modal-actions mt-4">
            <Button
              variant="ghost"
              disabled={remote.saving}
              onClick={() => setDeleteId(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="bg-rose-600 hover:bg-rose-700"
              disabled={remote.saving}
              onClick={async () => {
                setDeleteError("");
                const work = works.find((item) => item.id === deleteId);
                if (!work) {
                  setDeleteError(
                    "A obra já não está na lista. Cancela e atualiza as obras.",
                  );
                  return;
                }
                try {
                  const removed =
                    work.persistence === "supabase"
                      ? await remote.controller?.remove(work)
                      : store.deleteWork(work.id);
                  if (!active.current) return;
                  if (removed) navigate("/estudio", { replace: true });
                  else
                    setDeleteError(
                      remote.controller?.getSnapshot().error ||
                        "Não foi possível eliminar a obra. Cancela e atualiza a lista.",
                    );
                } catch {
                  if (active.current)
                    setDeleteError(
                      "Não foi possível eliminar a obra. Verifica a ligação e tenta novamente.",
                    );
                }
              }}
            >
              Sim, eliminar
            </Button>
          </div>
        </Modal>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="studio-empty-state">
          <BookOpen size={40} className="empty-icon" />
          <h3>Nenhuma obra encontrada</h3>
          <p>
            {search
              ? `Não foram encontrados resultados para "${search}".`
              : "Não tens obras com estes filtros."}
          </p>
          <Link to="/estudio/obras/nova" className="button primary mt-3">
            Criar nova obra
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        <div className="studio-works-grid">
          {filtered.map((work) => {
            const firstChapterId = work.chapters[0]?.id || "cap-1";
            const editUrl =
              work.persistence === "supabase"
                ? work.chapters[0]
                  ? entryPath(work, work.chapters[0])
                  : `/estudio/obras/${work.id}`
                : work.mode === "comic" || work.mode === "manga"
                  ? `/estudio/obras/${work.id}/paginas/${firstChapterId}/editar`
                  : `/estudio/obras/${work.id}/capitulos/${firstChapterId}/editar`;

            return (
              <article key={work.id} className="studio-work-card">
                <header className="work-card-top">
                  <span className="work-format-tag">
                    {work.format} ·{" "}
                    {work.persistence === "supabase"
                      ? "Guardada na conta"
                      : "Local"}
                  </span>
                  <span className={`status-indicator ${statusClass(work)}`}>
                    {statusLabel(work)}
                  </span>
                </header>

                <h3 className="work-title">
                  <Link to={`/estudio/obras/${work.id}`}>{work.title}</Link>
                </h3>
                <p className="work-synopsis-snippet">{work.synopsis}</p>

                <div className="work-card-meta">
                  <span>
                    {work.chapters.length}{" "}
                    {work.mode === "poetry"
                      ? "poemas"
                      : work.mode === "prose"
                        ? "capítulos"
                        : "atos"}
                  </span>
                  <span className="separator" aria-hidden="true">
                    ·
                  </span>
                  <span>{work.updatedAt}</span>
                </div>

                <footer className="work-card-footer flex items-center gap-2">
                  <Link
                    to={editUrl}
                    className="button primary flex-1 text-center"
                  >
                    <Edit3 size={14} className="inline mr-1" /> Editar
                  </Link>
                  <Button
                    variant="ghost"
                    disabled={
                      remote.saving ||
                      (work.persistence === "supabase" &&
                        work.status === "published")
                    }
                    title={
                      work.status === "published"
                        ? "Retira a publicação antes de arquivar"
                        : undefined
                    }
                    onClick={() =>
                      work.persistence === "supabase"
                        ? void remote.controller?.editorial(
                            work,
                            isArchived(work) ? "restore" : "archive",
                          )
                        : store.archiveWork(work.id)
                    }
                  >
                    {isArchived(work) ? "Desarquivar" : "Arquivar"}
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={remote.saving}
                    onClick={() =>
                      work.persistence === "supabase"
                        ? void remote.controller?.editorial(
                            work,
                            "duplicate_work",
                          )
                        : store.duplicateWork(work.id)
                    }
                    title="Duplicar"
                    aria-label="Duplicar"
                  >
                    <Copy size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-rose-500"
                    disabled={remote.saving}
                    onClick={() => {
                      setDeleteError("");
                      setDeleteId(work.id);
                    }}
                    title="Eliminar"
                    aria-label="Eliminar"
                  >
                    <Trash2 size={14} />
                  </Button>
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="studio-table-container">
          <table className="studio-data-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Formato</th>
                <th>Estado</th>
                <th>Entradas</th>
                <th>Última alteração</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((work) => {
                const firstChapterId = work.chapters[0]?.id || "cap-1";
                const editUrl =
                  work.persistence === "supabase"
                    ? work.chapters[0]
                      ? entryPath(work, work.chapters[0])
                      : `/estudio/obras/${work.id}`
                    : work.mode === "comic" || work.mode === "manga"
                      ? `/estudio/obras/${work.id}/paginas/${firstChapterId}/editar`
                      : `/estudio/obras/${work.id}/capitulos/${firstChapterId}/editar`;

                return (
                  <tr key={work.id}>
                    <td>
                      <Link
                        to={`/estudio/obras/${work.id}`}
                        className="font-medium text-text"
                      >
                        {work.title}
                      </Link>
                    </td>
                    <td>
                      {work.format} ·{" "}
                      {work.persistence === "supabase"
                        ? "Guardada na conta"
                        : "Local"}
                    </td>
                    <td>
                      <span className={`status-indicator ${statusClass(work)}`}>
                        {statusLabel(work)}
                      </span>
                    </td>
                    <td className="font-mono text-sm">
                      {work.chapters.length}
                    </td>
                    <td className="text-muted text-sm">{work.updatedAt}</td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          to={editUrl}
                          className="button secondary text-xs py-1 px-2"
                        >
                          Editar
                        </Link>
                        <Button
                          variant="ghost"
                          disabled={
                            remote.saving ||
                            (work.persistence === "supabase" &&
                              work.status === "published")
                          }
                          title={
                            work.status === "published"
                              ? "Retira a publicação antes de arquivar"
                              : undefined
                          }
                          onClick={() =>
                            work.persistence === "supabase"
                              ? void remote.controller?.editorial(
                                  work,
                                  isArchived(work) ? "restore" : "archive",
                                )
                              : store.archiveWork(work.id)
                          }
                        >
                          {isArchived(work) ? "Desarquivar" : "Arquivar"}
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={remote.saving}
                          onClick={() =>
                            work.persistence === "supabase"
                              ? void remote.controller?.editorial(
                                  work,
                                  "duplicate_work",
                                )
                              : store.duplicateWork(work.id)
                          }
                          title="Duplicar"
                          aria-label="Duplicar"
                        >
                          <Copy size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-rose-500"
                          disabled={remote.saving}
                          onClick={() => {
                            setDeleteError("");
                            setDeleteId(work.id);
                          }}
                          title="Eliminar"
                          aria-label="Eliminar"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 7. Author Statistics: /estudio/estatisticas
// ============================================================================
export function StudioStatsPage() {
  const { stats, activeWorks: works } = useStudio();

  return (
    <div className="container studio-page">
      <StudioPersistenceNotice />
      <header className="studio-header">
        <div>
          <span className="eyebrow">PLANEAMENTO EDITORIAL</span>
          <h1>Estatísticas do Autor</h1>
          <p className="studio-subtitle">
            Contagens das obras ativas da conta, sem dados de audiência.
          </p>
        </div>
      </header>

      <div className="form-info-callout mb-4">
        <Info size={16} />
        <span>
          Estas contagens usam apenas obras ativas guardadas na conta. O
          catálogo editorial, o arquivo e os rascunhos locais não entram nestas
          estatísticas.
        </span>
      </div>

      <section className="studio-stats-row">
        <div className="studio-stat-card">
          <span className="stat-label">Total de Palavras</span>
          <span className="stat-value font-mono">
            {stats.totalWords.toLocaleString("pt-PT")}
          </span>
          <span className="stat-hint">Cadência de produção textual</span>
        </div>

        <div className="studio-stat-card">
          <span className="stat-label">Entradas Produzidas</span>
          <span className="stat-value font-mono">{stats.totalChapters}</span>
          <span className="stat-hint">
            Distribuídos por {stats.totalWorks} obras
          </span>
        </div>

        <div className="studio-stat-card">
          <span className="stat-label">Média de Leitura</span>
          <span className="stat-value font-mono">
            ~{stats.avgReadTimeMinutes} min
          </span>
          <span className="stat-hint">
            Estimativa de duração do texto a 200 palavras/min
          </span>
        </div>

        <div className="studio-stat-card">
          <span className="stat-label">Conclusão por leitores</span>
          <span className="stat-value font-mono">—</span>
          <span className="stat-hint">Métrica indisponível</span>
        </div>
      </section>

      {/* Breakdown by Work */}
      <section className="studio-section mt-5">
        <h2>Detalhamento por Obra</h2>
        <div className="studio-table-container mt-3">
          <table className="studio-data-table">
            <thead>
              <tr>
                <th>Obra</th>
                <th>Formato</th>
                <th>Entradas</th>
                <th>Palavras</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {works.map((w) => {
                const wWords = w.chapters.reduce(
                  (total, c) =>
                    total +
                    (c.content || c.stanzas?.flat().join(" ") || "")
                      .trim()
                      .split(/\s+/)
                      .filter(Boolean).length,
                  0,
                );

                return (
                  <tr key={w.id}>
                    <td className="font-medium">{w.title}</td>
                    <td>{w.format}</td>
                    <td className="font-mono">{w.chapters.length}</td>
                    <td className="font-mono">
                      {wWords.toLocaleString("pt-PT")}
                    </td>
                    <td>
                      <span className="status-indicator status-published">
                        {w.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// 8. Media Library: /estudio/media
// ============================================================================
export function MediaLibraryPage() {
  const { media, store } = useStudio();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadError, setUploadError] = useState("");
  const handleUploadLocal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const owner = currentScope();
    try {
      const image = await storeImage(file, owner);
      if (owner !== currentScope()) return;
      store.addMediaItem({
        name: file.name,
        type: "illustration",
        url: image.reference,
        size: `${Math.round(file.size / 1024)} KB`,
        dimensions: "Personalizada",
      });
      setUploadError(
        image.persisted
          ? ""
          : "Imagem apenas em memória. Exporta uma cópia antes de sair.",
      );
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Falha ao guardar imagem.",
      );
    }
  };

  return (
    <div className="container studio-page">
      <header className="studio-header">
        <div>
          <span className="eyebrow">RECURSOS VISUAIS</span>
          <h1>Biblioteca de Media</h1>
          <p className="studio-subtitle">
            Gere as capas, pranchas e elementos ilustrados associados às tuas
            histórias.
          </p>
        </div>

        <div className="studio-header-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUploadLocal}
            className="hidden"
            aria-label="Carregar imagem para a biblioteca"
          />
          <Button
            variant="primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={15} /> Carregar imagem local
          </Button>
        </div>
      </header>

      <div className="form-info-callout mb-4">
        <Info size={16} />
        <span>
          As imagens são guardadas neste dispositivo através de IndexedDB. Não
          há sincronização remota. Exporta uma cópia de segurança; se a gravação
          falhar, a imagem ficará apenas em memória.
        </span>
      </div>

      {uploadError && <p role="alert">{uploadError}</p>}
      {media.length === 0 ? (
        <div className="studio-empty-state">
          <Upload size={40} className="empty-icon" />
          <h3>Ainda não tens ficheiros de media</h3>
          <p>Carrega imagens locais para utilizar nas tuas capas e pranchas.</p>
        </div>
      ) : (
        <div className="media-assets-grid">
          {media.map((item) => (
            <article key={item.id} className="media-card">
              <div className="media-preview-box">
                {item.url.startsWith("local-image:") ||
                item.isLocalObjectUrl ? (
                  <LocalImage
                    src={item.url}
                    alt={item.name}
                    className="media-thumb-img"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="media-placeholder-visual">
                    <span className="font-mono text-xs text-muted">
                      {item.type.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="media-card-info">
                <span className="media-filename truncate" title={item.name}>
                  {item.name}
                </span>
                <div className="media-specs font-mono text-xs text-muted">
                  <span>{item.size}</span>
                  <span className="separator" aria-hidden="true">
                    ·
                  </span>
                  <span>{item.dimensions}</span>
                </div>
                {item.workTitle && (
                  <span className="media-work-ref text-xs text-muted truncate">
                    Obra: {item.workTitle}
                  </span>
                )}
              </div>

              <footer className="media-card-actions">
                <Button
                  variant="ghost"
                  className="text-rose-500 text-xs w-full"
                  onClick={() => store.deleteMediaItem(item.id)}
                >
                  <Trash2 size={13} className="inline mr-1" /> Eliminar
                </Button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
