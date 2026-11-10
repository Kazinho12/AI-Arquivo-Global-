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

// ============================================================================
// 1. Studio Dashboard: /estudio
// ============================================================================
export function StudioDashboardPage() {
  const { state: authState } = useAuth();
  const { works, activities, stats, store } = useStudio();
  const navigate = useNavigate();

  const authorName =
    authState.user?.user_metadata?.display_name ||
    authState.user?.user_metadata?.name ||
    "Autor(a)";

  const recentWorks = useMemo(() => {
    return [...works]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 4);
  }, [works]);

  return (
    <div className="container studio-page">
      {/* Notice Banner */}
      <div className="studio-demo-banner">
        <Info size={16} />
        <span>
          <strong>Estúdio do Autor</strong> · Os rascunhos e alterações são
          guardados localmente no teu navegador durante esta sessão de trabalho.
        </span>
      </div>

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
            {stats.publishedCount} publicadas · {stats.draftsCount} rascunhos
          </span>
        </div>

        <div className="studio-stat-card">
          <span className="stat-label">Capítulos & Poemas</span>
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
          <span className="stat-label">Leituras Estimadas</span>
          <span className="stat-value font-mono">
            {stats.estimatedReads.toLocaleString("pt-PT")}
          </span>
          <span className="stat-hint">Amostra demonstrativa</span>
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
                work.mode === "comic" || work.mode === "manga"
                  ? `/estudio/obras/${work.id}/paginas/${firstChapterId}/editar`
                  : `/estudio/obras/${work.id}/capitulos/${firstChapterId}/editar`;

              return (
                <article key={work.id} className="studio-work-card">
                  <header className="work-card-top">
                    <span className="work-format-tag">{work.format}</span>
                    <span
                      className={`status-indicator ${
                        work.status === "published"
                          ? "status-published"
                          : work.status === "draft"
                            ? "status-draft"
                            : "status-archived"
                      }`}
                    >
                      {work.status === "published"
                        ? "Publicada"
                        : work.status === "draft"
                          ? "Rascunho"
                          : "Arquivada"}
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
  const { store } = useStudio();
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
  const [initialChapters, setInitialChapters] = useState<string[]>([
    "Capítulo 1: O Início",
    "Capítulo 2: O Desenvolvimento",
  ]);

  const mode =
    format === "Poesia"
      ? "poetry"
      : format === "HQ / Comic"
        ? "comic"
        : format === "Mangá"
          ? "manga"
          : "prose";

  // Adjust default chapter names on format switch
  const handleFormatSelect = (f: WorkFormat) => {
    setFormat(f);
    if (f === "Poesia") {
      setInitialChapters(["Primeiro Poema", "Segundo Poema"]);
    } else if (f === "HQ / Comic" || f === "Mangá") {
      setInitialChapters(["Ato I: Prólogo", "Ato II: O Encontro"]);
    } else {
      setInitialChapters([
        "Capítulo 1: O Início",
        "Capítulo 2: O Desenvolvimento",
      ]);
    }
  };

  const handleCreate = () => {
    if (!title.trim()) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const chapters = initialChapters.map((chapTitle, idx) => ({
      id: `cap-${idx + 1}`,
      number: idx + 1,
      title: chapTitle,
      content:
        mode === "prose"
          ? `Começa aqui a escrever o texto do capítulo "${chapTitle}"...`
          : undefined,
      stanzas:
        mode === "poetry"
          ? [
              [
                "Escreve aqui o primeiro verso deste poema,",
                "e a estrofe que o inaugura.",
              ],
            ]
          : undefined,
      pages:
        mode === "comic" || mode === "manga"
          ? [
              {
                id: `p-${idx + 1}-1`,
                number: 1,
                title: "Prancha Inicial",
                description:
                  "Composição de abertura para este capítulo visual.",
                aspectRatio: "3/4",
                accentColor: coverAccentColor,
              },
            ]
          : undefined,
    }));

    const created = store.createWork({
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      synopsis: synopsis.trim() || "Sem sinopse definida.",
      format,
      mode,
      genre,
      language,
      tags: tags.length > 0 ? tags : ["ficção"],
      ageRating,
      contentWarnings,
      status: "draft",
      coverAccentColor,
      chapters,
    });

    navigate(`/estudio/obras/${created.id}`);
  };

  return (
    <div className="container studio-page">
      <nav className="studio-breadcrumb">
        <Link to="/estudio" className="text-link">
          ← Voltar ao painel do Estúdio
        </Link>
      </nav>

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
            O formato define as ferramentas do editor e a experiência de leitura
            apresentada ao público.
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
            Informações essenciais para apresentar a história aos leitores e no
            catálogo.
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
                <option value="Ficção especulativa">Ficção especulativa</option>
                <option value="Ficção urbana">Ficção urbana</option>
                <option value="Poesia contemporânea">
                  Poesia contemporânea
                </option>
                <option value="Fantasia">Fantasia</option>
                <option value="Ficção científica">Ficção científica</option>
                <option value="Mistério / Enigma">Mistério / Enigma</option>
                <option value="Realismo mágico">Realismo mágico</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="w-lang" className="field-label">
                Idioma Principal
              </label>
              <select
                id="w-lang"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="filter-select w-full"
              >
                <option value="Português">Português</option>
                <option value="Galego">Galego</option>
                <option value="Espanhol">Espanhol</option>
                <option value="Inglês">Inglês</option>
              </select>
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

            <div className="form-group">
              <label className="field-label">Cor da Capa Gráfica</label>
              <div className="flex items-center gap-2 mt-2">
                {["#14243B", "#1E2A38", "#2C3E50", "#2A3F5E", "#0E2A47"].map(
                  (col) => (
                    <button
                      key={col}
                      type="button"
                      className={`w-7 h-7 rounded-full border-2 ${
                        coverAccentColor === col
                          ? "border-accent scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: col }}
                      onClick={() => setCoverAccentColor(col)}
                      aria-label={`Cor ${col}`}
                    />
                  ),
                )}
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
              disabled={!title.trim()}
            >
              Continuar: Estrutura Inicial →
            </Button>
          </div>
        </section>
      )}

      {/* Step 3: Estrutura Inicial */}
      {step === 3 && (
        <section className="wizard-card-step">
          <h2>Etapa 3 — Estrutura Inicial da Obra</h2>
          <p className="step-description">
            Organiza os primeiros capítulos, poemas ou atos. Poderás adicionar e
            editar mais mais tarde no Estúdio.
          </p>

          <div className="initial-chapters-list">
            {initialChapters.map((chapName, idx) => (
              <div key={idx} className="initial-chapter-row">
                <span className="font-mono text-sm text-muted">{idx + 1}.</span>
                <input
                  type="text"
                  value={chapName}
                  onChange={(e) => {
                    const copy = [...initialChapters];
                    copy[idx] = e.target.value;
                    setInitialChapters(copy);
                  }}
                  className="input-field flex-1"
                  placeholder="Nome do capítulo..."
                />
                {initialChapters.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setInitialChapters(
                        initialChapters.filter((_, i) => i !== idx),
                      );
                    }}
                    className="text-danger p-2"
                    title="Remover capítulo"
                    aria-label="Remover capítulo"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}

            <Button
              variant="secondary"
              onClick={() => {
                const nextNum = initialChapters.length + 1;
                const nextLabel =
                  mode === "poetry"
                    ? `Poema ${nextNum}`
                    : mode === "comic" || mode === "manga"
                      ? `Ato ${nextNum}`
                      : `Capítulo ${nextNum}`;
                setInitialChapters([...initialChapters, nextLabel]);
              }}
              className="mt-2"
            >
              <Plus size={15} /> Adicionar outro item
            </Button>
          </div>

          <div className="wizard-nav-actions">
            <Button variant="ghost" onClick={() => setStep(2)}>
              ← Voltar à Identidade
            </Button>
            <Button variant="primary" onClick={() => setStep(4)}>
              Continuar: Pré-visualização →
            </Button>
          </div>
        </section>
      )}

      {/* Step 4: Pré-visualização */}
      {step === 4 && (
        <section className="wizard-card-step">
          <h2>Etapa 4 — Pré-visualização Pública</h2>
          <p className="step-description">
            É assim que a apresentação da tua obra surgirá no Arquivo Global
            para os leitores.
          </p>

          <article className="work-preview-simulation">
            <aside
              className="preview-cover-sim"
              style={{ backgroundColor: coverAccentColor }}
            >
              <span className="sim-format-label">{format}</span>
              <h3 className="sim-title-label">{title || "Título da Obra"}</h3>
              {subtitle && <p className="sim-sub-label">{subtitle}</p>}
            </aside>

            <div className="preview-meta-sim">
              <div className="sim-badge-row">
                <Badge>{format}</Badge>
                <Badge>{genre}</Badge>
                <Badge>{ageRating}</Badge>
              </div>

              <h1>{title || "Sem título definido"}</h1>
              {subtitle && <p className="text-muted font-medium">{subtitle}</p>}

              <p className="sim-synopsis">
                {synopsis || "Ainda não escreveste uma sinopse para esta obra."}
              </p>

              <div className="sim-structure-preview">
                <strong>Estrutura inicial:</strong> {initialChapters.length}{" "}
                {mode === "poetry" ? "poemas" : "capítulos"} preparados.
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
                  {initialChapters.length} capítulos/poemas iniciais
                  configurados
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
                Esta obra será registada no teu Estúdio local com o estado{" "}
                <strong>Rascunho</strong>. Não haverá publicação pública ou
                remota nesta fase.
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
              disabled={!title.trim()}
            >
              <Sparkles size={16} className="inline mr-1" /> Criar obra e abrir
              no Estúdio
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

// ============================================================================
// 3. Work Management: /estudio/obras/:id
// ============================================================================
export function WorkManagePage() {
  const { id } = useParams<{ id: string }>();
  const { works, store } = useStudio();
  const navigate = useNavigate();

  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const work = works.find((w) => w.id === id);

  if (!work) {
    return <NotFound />;
  }

  const isVisual = work.mode === "comic" || work.mode === "manga";

  const handleAddChapter = () => {
    const chap = store.addChapter(work.id);
    if (chap) {
      if (isVisual) {
        navigate(`/estudio/obras/${work.id}/paginas/${chap.id}/editar`);
      } else {
        navigate(`/estudio/obras/${work.id}/capitulos/${chap.id}/editar`);
      }
    }
  };

  const handleDuplicate = () => {
    const copy = store.duplicateWork(work.id);
    if (copy) {
      navigate(`/estudio/obras/${copy.id}`);
    }
  };

  const handleDelete = () => {
    store.deleteWork(work.id);
    navigate("/estudio/publicacoes");
  };

  return (
    <div className="container studio-page">
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
            <Badge>{work.genre}</Badge>
            <span
              className={`status-indicator ${
                work.status === "published"
                  ? "status-published"
                  : work.status === "draft"
                    ? "status-draft"
                    : "status-archived"
              }`}
            >
              {work.status === "published"
                ? "Publicada"
                : work.status === "draft"
                  ? "Rascunho"
                  : "Arquivada"}
            </span>
          </div>
          <h1>{work.title}</h1>
          {work.subtitle && (
            <p className="text-muted font-medium">{work.subtitle}</p>
          )}
        </div>

        <div className="work-manage-actions">
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

          <Button
            variant="secondary"
            onClick={handleDuplicate}
            title="Duplicar obra"
            aria-label="Duplicar obra"
          >
            <Copy size={15} /> Duplicar
          </Button>

          <Button
            variant="ghost"
            onClick={() => store.archiveWork(work.id)}
            title="Arquivar ou desarquivar obra"
            aria-label="Arquivar ou desarquivar obra"
          >
            <Archive size={15} />{" "}
            {work.status === "archived" ? "Desarquivar" : "Arquivar"}
          </Button>

          <Button
            variant="ghost"
            className="text-rose-500 hover:text-rose-600"
            onClick={() => setDeleteConfirm(true)}
            title="Eliminar obra"
            aria-label="Eliminar obra"
          >
            <Trash2 size={15} /> Eliminar
          </Button>
        </div>
      </header>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <Modal
          open
          onClose={() => setDeleteConfirm(false)}
          title={`Eliminar a obra "${work.title}"?`}
        >
          <p className="mt-2 text-sm text-muted">
            Esta ação removerá a obra e todos os seus capítulos/páginas durante
            a sessão.
          </p>
          <div className="modal-actions mt-4">
            <Button variant="ghost" onClick={() => setDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="bg-rose-600 hover:bg-rose-700"
              onClick={handleDelete}
            >
              Sim, eliminar obra
            </Button>
          </div>
        </Modal>
      )}

      {/* Chapters / Structure Section */}
      <section
        className="studio-section mt-5"
        aria-label="Estrutura de capítulos"
      >
        <div className="section-header-row">
          <h2>
            {work.mode === "poetry" ? "Poemas" : "Capítulos e Atos"} (
            {work.chapters.length})
          </h2>
          <Button variant="primary" onClick={handleAddChapter}>
            <Plus size={15} /> Adicionar{" "}
            {work.mode === "poetry" ? "poema" : "capítulo"}
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
              ? chap.stanzas.reduce((acc, st) => acc + st.length, 0)
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
                        <span>{chap.pages?.length || 1} pranchas</span>
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
  const { works, store } = useStudio();
  const navigate = useNavigate();

  const work = works.find((w) => w.id === id);
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
  const { works, store } = useStudio();
  const navigate = useNavigate();

  const work = works.find((w) => w.id === id);
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
  const { works, store } = useStudio();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [filterFormat, setFilterFormat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return works.filter((w) => {
      if (filterFormat !== "all" && w.format !== filterFormat) return false;
      if (filterStatus !== "all" && w.status !== filterStatus) return false;
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
  }, [works, filterFormat, filterStatus, search]);

  return (
    <div className="container studio-page">
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
            <option value="draft">Rascunhos</option>
            <option value="published">Publicadas</option>
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

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <Modal
          open
          onClose={() => setDeleteId(null)}
          title="Eliminar esta obra?"
        >
          <p className="mt-2 text-sm text-muted">
            Esta ação removerá a obra do teu Estúdio durante esta sessão de
            trabalho.
          </p>
          <div className="modal-actions mt-4">
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => {
                store.deleteWork(deleteId);
                setDeleteId(null);
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
              work.mode === "comic" || work.mode === "manga"
                ? `/estudio/obras/${work.id}/paginas/${firstChapterId}/editar`
                : `/estudio/obras/${work.id}/capitulos/${firstChapterId}/editar`;

            return (
              <article key={work.id} className="studio-work-card">
                <header className="work-card-top">
                  <span className="work-format-tag">{work.format}</span>
                  <span
                    className={`status-indicator ${
                      work.status === "published"
                        ? "status-published"
                        : work.status === "draft"
                          ? "status-draft"
                          : "status-archived"
                    }`}
                  >
                    {work.status === "published"
                      ? "Publicada"
                      : work.status === "draft"
                        ? "Rascunho"
                        : "Arquivada"}
                  </span>
                </header>

                <h3 className="work-title">
                  <Link to={`/estudio/obras/${work.id}`}>{work.title}</Link>
                </h3>
                <p className="work-synopsis-snippet">{work.synopsis}</p>

                <div className="work-card-meta">
                  <span>{work.chapters.length} capítulos</span>
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
                    onClick={() => store.duplicateWork(work.id)}
                    title="Duplicar"
                    aria-label="Duplicar"
                  >
                    <Copy size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-rose-500"
                    onClick={() => setDeleteId(work.id)}
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
                <th>Capítulos</th>
                <th>Última alteração</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((work) => {
                const firstChapterId = work.chapters[0]?.id || "cap-1";
                const editUrl =
                  work.mode === "comic" || work.mode === "manga"
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
                    <td>{work.format}</td>
                    <td>
                      <span
                        className={`status-indicator ${
                          work.status === "published"
                            ? "status-published"
                            : work.status === "draft"
                              ? "status-draft"
                              : "status-archived"
                        }`}
                      >
                        {work.status === "published"
                          ? "Publicada"
                          : work.status === "draft"
                            ? "Rascunho"
                            : "Arquivada"}
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
                          onClick={() => store.duplicateWork(work.id)}
                          title="Duplicar"
                          aria-label="Duplicar"
                        >
                          <Copy size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-rose-500"
                          onClick={() => setDeleteId(work.id)}
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
  const { stats, works } = useStudio();

  return (
    <div className="container studio-page">
      <header className="studio-header">
        <div>
          <span className="eyebrow">PLANEAMENTO EDITORIAL</span>
          <h1>Estatísticas do Autor</h1>
          <p className="studio-subtitle">
            Métricas de produção literária, estimativa de retenção e
            distribuição de formatos.
          </p>
        </div>
      </header>

      <div className="form-info-callout mb-4">
        <Info size={16} />
        <span>
          Estas estatísticas baseiam-se na tua biblioteca local de rascunhos e
          em dados demonstrativos preparados para avaliar o alcance e ritmo das
          tuas publicações.
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
          <span className="stat-label">Capítulos Produzidos</span>
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
          <span className="stat-hint">Por sessão estimada</span>
        </div>

        <div className="studio-stat-card">
          <span className="stat-label">Taxa de Conclusão Estimada</span>
          <span className="stat-value font-mono">78%</span>
          <span className="stat-hint">Baseada na extensão dos capítulos</span>
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
                <th>Capítulos</th>
                <th>Palavras Estimadas</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {works.map((w) => {
                let wWords = 0;
                w.chapters.forEach((c) => {
                  if (c.content) {
                    wWords += c.content
                      .trim()
                      .split(/\s+/)
                      .filter(Boolean).length;
                  }
                });

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
