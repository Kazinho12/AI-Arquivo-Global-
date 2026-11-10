import { Modal } from "../../components/ui";
import { storeImage, LocalImage } from "../local/images";
import { currentScope } from "../local/persistence";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Upload,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit3,
  Layers,
  ArrowLeftRight,
  ScrollText,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import type { StudioWork } from "./types";
import type { Chapter } from "../reader/types";
import { ComicReader } from "../reader/ComicReader";
import { MangaReader } from "../reader/MangaReader";
import { Button } from "../../components/ui";

interface VisualSequencerProps {
  work: StudioWork;
  currentChapter: Chapter;
  onAddPage: (pageData?: any) => void;
  onUpdatePage: (pageId: string, partial: any) => void;
  onReorderPages: (newOrderIds: string[]) => void;
  onDeletePage: (pageId: string) => void;
  onSelectChapter: (chapterId: string) => void;
}

export function VisualSequencer({
  work,
  currentChapter,
  onAddPage,
  onUpdatePage,
  onReorderPages,
  onDeletePage,
}: VisualSequencerProps) {
  const pages = currentChapter.pages || [];
  const [selectedPageId, setSelectedPageId] = useState<string>(
    pages[0]?.id || "",
  );
  const [previewMode, setPreviewMode] = useState(false);
  const [direction, setDirection] = useState<"rtl" | "ltr">(
    work.mode === "manga" ? "rtl" : "ltr",
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // File input ref for local image selection
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (pages.length > 0 && !pages.some((p) => p.id === selectedPageId)) {
      setSelectedPageId(pages[0].id);
    }
  }, [pages, selectedPageId]);

  const selectedPage = pages.find((p) => p.id === selectedPageId) || pages[0];

  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedPage) return;
    const owner = currentScope();
    const targetId = selectedPage.id;
    try {
      const image = await storeImage(file, owner);
      if (owner !== currentScope()) return;
      onUpdatePage(targetId, {
        imageUrl: image.reference,
        title: file.name.replace(/\.[^/.]+$/, ""),
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

  const movePage = (dir: "left" | "right", index: number) => {
    const newIdx = dir === "left" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= pages.length) return;

    const ids = pages.map((p) => p.id);
    const temp = ids[index];
    ids[index] = ids[newIdx];
    ids[newIdx] = temp;
    onReorderPages(ids);
  };

  const isManga = work.mode === "manga";

  return (
    <div className="visual-sequencer-root">
      <h1 className="sr-only">
        Editar páginas de {work.title} — {currentChapter.title}
      </h1>
      {uploadError && <p role="alert">{uploadError}</p>}
      {/* Top Bar */}
      <header className="editor-top-bar">
        <div className="editor-top-left">
          <Link to={`/estudio/obras/${work.id}`} className="editor-back-link">
            ← {work.title}
          </Link>
          <span className="separator" aria-hidden="true">
            ·
          </span>
          <span className="editor-tag font-mono text-xs">
            {isManga ? "Mangá" : "HQ / Comic"} · {pages.length}{" "}
            {pages.length === 1 ? "página" : "páginas"}
          </span>
        </div>

        <div className="editor-top-right">
          {/* Direction toggle */}
          <Button
            variant="ghost"
            onClick={() => setDirection(direction === "rtl" ? "ltr" : "rtl")}
            title="Alternar sentido de leitura"
            aria-label="Sentido de leitura"
          >
            <ArrowLeftRight size={14} className="mr-1" />
            <span className="hidden sm:inline">
              {direction === "rtl"
                ? "RTL (Direita ➔ Esquerda)"
                : "LTR (Esquerda ➔ Direita)"}
            </span>
          </Button>

          {/* Live Preview Toggle */}
          <Button
            variant={previewMode ? "primary" : "secondary"}
            onClick={() => setPreviewMode(!previewMode)}
            title="Pré-visualizar no leitor visual"
          >
            {previewMode ? (
              <>
                <Edit3 size={15} /> Voltar à organização
              </>
            ) : (
              <>
                <Eye size={15} /> Pré-visualizar no leitor
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      {previewMode ? (
        <div className="editor-live-preview-box p-4">
          <div className="preview-indicator-bar mb-4">
            <span>
              Pré-visualização no Leitor {isManga ? "Mangá" : "Comic"}
            </span>
            <small>Orientação ativa: {direction.toUpperCase()}</small>
          </div>
          {isManga ? (
            <MangaReader
              workId={work.id}
              workTitle={work.title}
              author="Tu (Autor)"
              chapters={[currentChapter]}
              currentChapter={currentChapter}
            />
          ) : (
            <ComicReader
              workId={work.id}
              workTitle={work.title}
              author="Tu (Autor)"
              chapters={[currentChapter]}
              currentChapter={currentChapter}
            />
          )}
        </div>
      ) : (
        <div className="visual-sequencer-body">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageFileChange}
            className="hidden"
            aria-label="Carregar imagem local para a prancha"
          />

          {/* Pages Thumbstrip / Grid */}
          <section
            className="sequencer-strip-section"
            aria-label="Sequência de páginas"
          >
            <div className="sequencer-strip-header">
              <h2>Sequência de Pranchas</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  onClick={() => onAddPage()}
                  aria-label="Adicionar página"
                >
                  <Plus size={15} /> Nova página
                </Button>
              </div>
            </div>

            <div className="sequencer-thumbnails-grid" dir={direction}>
              {pages.map((p, idx) => (
                <article
                  key={p.id}
                  className={`sequencer-thumb-card ${
                    p.id === selectedPage?.id ? "selected" : ""
                  }`}
                  dir="ltr"
                >
                  <button
                    type="button"
                    className="thumb-select"
                    aria-label={`Selecionar prancha ${p.number}: ${p.title}`}
                    aria-pressed={p.id === selectedPage?.id}
                    onClick={() => setSelectedPageId(p.id)}
                  >
                    <div
                      className="thumb-visual-frame"
                      style={{ backgroundColor: p.accentColor }}
                    >
                      {p.imageUrl ? (
                        <LocalImage
                          src={p.imageUrl}
                          alt={p.title}
                          className="thumb-image"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="thumb-placeholder-text">
                          <ImageIcon size={24} className="opacity-40 mb-1" />
                          <span className="text-xs opacity-75">
                            Prancha gráfica
                          </span>
                        </div>
                      )}
                      <span className="thumb-index-badge font-mono">
                        {isManga ? `【頁 ${idx + 1}】` : `Pág. ${idx + 1}`}
                      </span>
                    </div>
                  </button>
                  <div className="thumb-card-body">
                    <span className="thumb-card-title truncate">{p.title}</span>
                    <div className="thumb-card-controls">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          movePage("left", idx);
                        }}
                        title="Mover para a esquerda"
                        aria-label="Mover prancha para a esquerda"
                      >
                        <ChevronLeft size={13} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === pages.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          movePage("right", idx);
                        }}
                        title="Mover para a direita"
                        aria-label="Mover prancha para a direita"
                      >
                        <ChevronRight size={13} />
                      </button>
                      {pages.length > 1 && (
                        <button
                          type="button"
                          className="text-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(p.id);
                          }}
                          title="Eliminar página"
                          aria-label="Eliminar prancha"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Delete Page Modal */}
          {deleteConfirmId && (
            <Modal
              open
              onClose={() => setDeleteConfirmId(null)}
              title="Eliminar esta prancha?"
            >
              <p className="mt-2 text-sm text-muted">
                A página será removida da sequência deste capítulo durante esta
                sessão.
              </p>
              <div className="modal-actions mt-4">
                <Button
                  variant="ghost"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  className="bg-rose-600 hover:bg-rose-700"
                  onClick={() => {
                    onDeletePage(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }}
                >
                  Sim, eliminar
                </Button>
              </div>
            </Modal>
          )}

          {/* Selected Page Editor Panel */}
          {selectedPage && (
            <section
              className="sequencer-detail-panel"
              aria-label="Detalhes da página selecionada"
            >
              <header className="detail-panel-header">
                <div>
                  <span className="eyebrow">EDIÇÃO DA PRANCHA</span>
                  <h2>
                    {isManga
                      ? `【頁 ${selectedPage.number}】`
                      : `Página ${selectedPage.number}`}
                    : {selectedPage.title}
                  </h2>
                </div>

                <div className="detail-panel-actions">
                  <Button
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    title="Carregar imagem do teu dispositivo para pré-visualização local"
                    aria-label="Carregar imagem do teu dispositivo para pré-visualização local"
                  >
                    <Upload size={14} className="inline mr-1" /> Carregar imagem
                    local
                  </Button>
                </div>
              </header>

              <div className="detail-panel-grid">
                <div className="detail-form-col">
                  <div className="form-group">
                    <label htmlFor="page-title" className="field-label">
                      Título ou Identificador da Cena
                    </label>
                    <input
                      id="page-title"
                      type="text"
                      value={selectedPage.title}
                      onChange={(e) =>
                        onUpdatePage(selectedPage.id, { title: e.target.value })
                      }
                      className="input-field"
                    />
                  </div>

                  <div className="form-group mt-3">
                    <label htmlFor="page-desc" className="field-label">
                      Descrição da Composição e Enquadramento
                    </label>
                    <textarea
                      id="page-desc"
                      rows={3}
                      value={selectedPage.description}
                      onChange={(e) =>
                        onUpdatePage(selectedPage.id, {
                          description: e.target.value,
                        })
                      }
                      className="comment-textarea"
                      placeholder="Detalha o plano visual, iluminação, linhas de ação e ângulos..."
                    />
                  </div>

                  <div className="form-group mt-3">
                    <label htmlFor="page-caption" className="field-label">
                      Legenda ou Diálogo Principal
                    </label>
                    <input
                      id="page-caption"
                      type="text"
                      value={selectedPage.caption || ""}
                      onChange={(e) =>
                        onUpdatePage(selectedPage.id, {
                          caption: e.target.value,
                        })
                      }
                      placeholder="Ex.: 'Naquela noite fria de inverno, a cidade permaneceu em silêncio...'"
                      className="input-field"
                    />
                  </div>

                  <div className="form-group mt-3">
                    <label className="field-label">
                      Cor de Fundo da Prancha
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      {[
                        "#14243B",
                        "#171F2C",
                        "#1E2A38",
                        "#2A3F5E",
                        "#0B1524",
                      ].map((col) => (
                        <button
                          key={col}
                          type="button"
                          className={`w-7 h-7 rounded-full border-2 ${
                            selectedPage.accentColor === col
                              ? "border-accent scale-110"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: col }}
                          onClick={() =>
                            onUpdatePage(selectedPage.id, { accentColor: col })
                          }
                          aria-label={`Cor ${col}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview Frame */}
                <div className="detail-preview-col">
                  <div
                    className="detail-preview-canvas"
                    style={{ backgroundColor: selectedPage.accentColor }}
                  >
                    {selectedPage.imageUrl ? (
                      <LocalImage
                        src={selectedPage.imageUrl}
                        alt={selectedPage.title}
                        className="detail-preview-img"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="detail-canvas-inner">
                        <span className="detail-canvas-tag font-mono">
                          {isManga
                            ? `【頁 ${selectedPage.number}】`
                            : `Página ${selectedPage.number}`}
                        </span>
                        <h3>{selectedPage.title}</h3>
                        <p className="detail-canvas-desc">
                          {selectedPage.description}
                        </p>
                        {selectedPage.caption && (
                          <p className="detail-canvas-caption">
                            "{selectedPage.caption}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <small className="text-muted block text-center mt-2 text-xs">
                    As imagens são guardadas neste dispositivo. Exporta uma
                    cópia para as recuperar noutro dispositivo.
                  </small>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
