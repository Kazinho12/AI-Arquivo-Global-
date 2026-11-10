import { Modal } from "../../components/ui";
import {
  localWarnings,
  localPending,
  useLocalRevision,
} from "../local/persistence";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Minus,
  List,
  ListOrdered,
  Undo,
  Redo,
  Maximize2,
  Minimize2,
  Eye,
  Edit3,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Check,
  BookOpen,
  Layers,
} from "lucide-react";
import type { StudioWork } from "./types";
import type { Chapter } from "../reader/types";
import { ProseReader } from "../reader/ProseReader";
import { Button } from "../../components/ui";

interface HybridProseEditorProps {
  work: StudioWork;
  currentChapter: Chapter;
  onUpdateChapter: (chapterId: string, partial: Partial<Chapter>) => void;
  onAddChapter: () => void;
  onDuplicateChapter: (chapterId: string) => void;
  onDeleteChapter: (chapterId: string) => void;
  onReorderChapters: (newOrderIds: string[]) => void;
  onSelectChapter: (chapterId: string) => void;
}

export function HybridProseEditor({
  work,
  currentChapter,
  onUpdateChapter,
  onAddChapter,
  onDuplicateChapter,
  onDeleteChapter,
  onReorderChapters,
  onSelectChapter,
}: HybridProseEditorProps) {
  useLocalRevision();
  const unsaved = localWarnings().length > 0;
  const [content, setContent] = useState(currentChapter.content || "");
  const [chapterTitle, setChapterTitle] = useState(currentChapter.title);
  const [distractionFree, setDistractionFree] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showDrawer, setShowDrawer] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Undo/Redo history
  const [history, setHistory] = useState<string[]>([
    currentChapter.content || "",
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync when currentChapter changes
  useEffect(() => {
    setContent(currentChapter.content || "");
    setChapterTitle(currentChapter.title);
    setHistory([currentChapter.content || ""]);
    setHistoryIndex(0);
  }, [currentChapter.id]);

  const recordChange = (newContent: string) => {
    setContent(newContent);
    onUpdateChapter(currentChapter.id, { content: newContent });

    const newHist = history.slice(0, historyIndex + 1);
    newHist.push(newContent);
    if (newHist.length > 30) newHist.shift();
    setHistory(newHist);
    setHistoryIndex(newHist.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setContent(prev);
      onUpdateChapter(currentChapter.id, { content: prev });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setContent(next);
      onUpdateChapter(currentChapter.id, { content: next });
    }
  };

  // Insertion helpers maintaining cursor selection
  const insertFormatting = (prefix: string, suffix: string = "") => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.substring(start, end);

    const replacement = prefix + (selected || "texto") + suffix;
    const updated =
      content.substring(0, start) + replacement + content.substring(end);

    recordChange(updated);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected ? selected.length : 5),
      );
    }, 10);
  };

  const insertLinePrefix = (prefix: string) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;
    const updated =
      content.substring(0, lineStart) + prefix + content.substring(lineStart);

    recordChange(updated);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 10);
  };

  // Word & Character count
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const chars = content.length;
  const readTimeMinutes = Math.max(1, Math.ceil(words / 200));

  const handleTitleBlur = () => {
    if (chapterTitle.trim() && chapterTitle !== currentChapter.title) {
      onUpdateChapter(currentChapter.id, { title: chapterTitle.trim() });
    }
  };

  const moveChapter = (direction: "up" | "down", index: number) => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= work.chapters.length) return;

    const ids = work.chapters.map((c) => c.id);
    const temp = ids[index];
    ids[index] = ids[newIdx];
    ids[newIdx] = temp;
    onReorderChapters(ids);
  };

  // Chapter navigation indices
  const currentIdx = work.chapters.findIndex((c) => c.id === currentChapter.id);
  const prevChapter = currentIdx > 0 ? work.chapters[currentIdx - 1] : null;
  const nextChapter =
    currentIdx < work.chapters.length - 1
      ? work.chapters[currentIdx + 1]
      : null;

  return (
    <div
      className={`hybrid-editor-root ${distractionFree ? "editor-focus-mode" : ""}`}
    >
      <h1 className="sr-only">
        Editar {work.title} — {currentChapter.title}
      </h1>
      {/* Top Header Bar */}
      <header className="editor-top-bar">
        <div className="editor-top-left">
          <Link to={`/estudio/obras/${work.id}`} className="editor-back-link">
            ← {work.title}
          </Link>
          <span className="separator" aria-hidden="true">
            ·
          </span>
          <span className="editor-tag font-mono text-xs">
            {work.format} · Cap. {currentChapter.number}
          </span>
        </div>

        <div className="editor-top-right">
          <div className="editor-metrics-strip font-mono text-xs">
            <span>{words} palavras</span>
            <span className="separator" aria-hidden="true">
              ·
            </span>
            <span>{chars} carateres</span>
            <span className="separator" aria-hidden="true">
              ·
            </span>
            <span>~{readTimeMinutes} min de leitura</span>
          </div>

          {/* Preview Toggle */}
          <Button
            variant={previewMode ? "primary" : "secondary"}
            onClick={() => setPreviewMode(!previewMode)}
            title="Alternar entre modo de escrita e pré-visualização no leitor"
          >
            {previewMode ? (
              <>
                <Edit3 size={15} /> Voltar à edição
              </>
            ) : (
              <>
                <Eye size={15} /> Pré-visualizar no leitor
              </>
            )}
          </Button>

          {/* Focus Mode Toggle */}
          <Button
            variant="ghost"
            onClick={() => setDistractionFree(!distractionFree)}
            title="Alternar modo foco"
            aria-label="Modo foco"
          >
            {distractionFree ? (
              <Minimize2 size={16} />
            ) : (
              <Maximize2 size={16} />
            )}
          </Button>
        </div>
      </header>

      {/* Main Split Layout: Drawer + Editor Area */}
      <div className="editor-workspace-body">
        {/* Chapters Drawer */}
        {!distractionFree && !previewMode && showDrawer && (
          <aside
            className="editor-chapters-drawer"
            aria-label="Navegação de capítulos"
          >
            <div className="drawer-header">
              <span className="drawer-title">
                Capítulos ({work.chapters.length})
              </span>
              <button
                type="button"
                className="drawer-add-btn"
                onClick={onAddChapter}
                title="Adicionar novo capítulo"
                aria-label="Novo capítulo"
              >
                <Plus size={15} />
              </button>
            </div>

            <ul className="drawer-chapter-list">
              {work.chapters.map((chap, idx) => (
                <li
                  key={chap.id}
                  className={`drawer-chapter-item ${
                    chap.id === currentChapter.id ? "active" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="drawer-chapter-select"
                    onClick={() => onSelectChapter(chap.id)}
                  >
                    <span className="chapter-num font-mono">
                      {chap.number}.
                    </span>
                    <span className="chapter-label truncate">{chap.title}</span>
                  </button>

                  <div className="drawer-chapter-actions">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveChapter("up", idx)}
                      title="Mover para cima"
                      aria-label="Mover capítulo para cima"
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === work.chapters.length - 1}
                      onClick={() => moveChapter("down", idx)}
                      title="Mover para baixo"
                      aria-label="Mover capítulo para baixo"
                    >
                      <ChevronDown size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicateChapter(chap.id)}
                      title="Duplicar capítulo"
                      aria-label="Duplicar capítulo"
                    >
                      <Copy size={13} />
                    </button>
                    {work.chapters.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(chap.id)}
                        className="text-danger"
                        title="Eliminar capítulo"
                        aria-label="Eliminar capítulo"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <Modal
            open
            onClose={() => setDeleteConfirmId(null)}
            title="Eliminar capítulo?"
          >
            <p className="mt-2 text-sm text-muted">
              Esta ação removerá o capítulo e o seu texto durante esta sessão de
              trabalho.
            </p>
            <div className="modal-actions mt-4">
              <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                className="bg-rose-600 hover:bg-rose-700"
                onClick={() => {
                  onDeleteChapter(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
              >
                Sim, eliminar
              </Button>
            </div>
          </Modal>
        )}

        {/* Main Content Area */}
        <section aria-label="Área de edição" className="editor-main-canvas">
          {previewMode ? (
            /* Live ProseReader Preview */
            <div className="editor-live-preview-box">
              <div className="preview-indicator-bar">
                <span>Modo de Pré-visualização do Leitor</span>
                <small>Assim é como os leitores verão este capítulo.</small>
              </div>
              <ProseReader
                workId={work.id}
                workTitle={work.title}
                author="Tu (Autor)"
                chapters={work.chapters.map((c) =>
                  c.id === currentChapter.id
                    ? { ...c, content, title: chapterTitle }
                    : c,
                )}
                currentChapter={{
                  ...currentChapter,
                  content,
                  title: chapterTitle,
                }}
              />
            </div>
          ) : (
            /* Composition Canvas */
            <div className="editor-composition-pane">
              {/* Formatting Toolbar */}
              <div
                className="editor-toolbar-strip"
                role="toolbar"
                aria-label="Ferramentas de formatação"
              >
                <div className="toolbar-group">
                  <button
                    type="button"
                    onClick={() => insertFormatting("**", "**")}
                    title="Negrito (**texto**)"
                    aria-label="Negrito"
                  >
                    <Bold size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("*", "*")}
                    title="Itálico (*texto*)"
                    aria-label="Itálico"
                  >
                    <Italic size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting("<u>", "</u>")}
                    title="Sublinhado"
                    aria-label="Sublinhado"
                  >
                    <Underline size={15} />
                  </button>
                </div>

                <div className="toolbar-divider" />

                <div className="toolbar-group">
                  <button
                    type="button"
                    onClick={() => insertLinePrefix("# ")}
                    title="Título H1"
                    aria-label="Título H1"
                  >
                    <Heading1 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertLinePrefix("## ")}
                    title="Subtítulo H2"
                    aria-label="Subtítulo H2"
                  >
                    <Heading2 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertLinePrefix("### ")}
                    title="Subtítulo H3"
                    aria-label="Subtítulo H3"
                  >
                    <Heading3 size={15} />
                  </button>
                </div>

                <div className="toolbar-divider" />

                <div className="toolbar-group">
                  <button
                    type="button"
                    onClick={() => insertLinePrefix("> ")}
                    title="Citação em bloco"
                    aria-label="Citação"
                  >
                    <Quote size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertLinePrefix("- ")}
                    title="Lista com marcas"
                    aria-label="Lista com marcas"
                  >
                    <List size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertLinePrefix("1. ")}
                    title="Lista numerada"
                    aria-label="Lista numerada"
                  >
                    <ListOrdered size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => recordChange(content + "\n\n* * *\n\n")}
                    title="Separador de cena (* * *)"
                    aria-label="Separador de cena"
                  >
                    <Minus size={15} />
                  </button>
                </div>

                <div className="toolbar-divider" />

                <div className="toolbar-group">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    title="Desfazer"
                    aria-label="Desfazer"
                  >
                    <Undo size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    title="Refazer"
                    aria-label="Refazer"
                  >
                    <Redo size={15} />
                  </button>
                </div>

                <div className="toolbar-spacer" />

                <div className="saved-indicator font-mono text-xs">
                  <Check size={12} className="inline text-emerald-500 mr-1" />
                  {unsaved
                    ? "Alterações apenas em memória — exporta uma cópia"
                    : localPending()
                      ? "A guardar no dispositivo…"
                      : "Rascunho local"}
                </div>
              </div>

              {/* Title Input */}
              <div className="editor-title-container">
                <input
                  type="text"
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  placeholder="Título do capítulo..."
                  className="editor-chapter-title-input"
                  aria-label="Título do capítulo"
                />
              </div>

              {/* Composition Textarea */}
              <div className="editor-textarea-wrapper">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => recordChange(e.target.value)}
                  placeholder="Começa a escrever o texto do teu capítulo. Podes usar parágrafos livres, diálogos e separadores de cena..."
                  className="editor-main-textarea"
                  aria-label="Conteúdo do capítulo"
                />
              </div>

              {/* Bottom Quick Chapter Navigation */}
              <footer className="editor-bottom-nav">
                {prevChapter ? (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => onSelectChapter(prevChapter.id)}
                  >
                    ← Cap. {prevChapter.number}: {prevChapter.title}
                  </button>
                ) : (
                  <span />
                )}

                {nextChapter ? (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => onSelectChapter(nextChapter.id)}
                  >
                    Cap. {nextChapter.number}: {nextChapter.title} →
                  </button>
                ) : (
                  <Button variant="secondary" onClick={onAddChapter}>
                    <Plus size={14} className="inline mr-1" /> Criar próximo
                    capítulo
                  </Button>
                )}
              </footer>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
