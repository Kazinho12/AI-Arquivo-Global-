import { Modal } from "../../components/ui";
import {
  localWarnings,
  localPending,
  useLocalRevision,
} from "../local/persistence";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Feather,
  Eye,
  Edit3,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  Check,
  AlignLeft,
  AlignCenter,
} from "lucide-react";
import type { StudioWork } from "./types";
import type { Chapter } from "../reader/types";
import { PoetryReader } from "../reader/PoetryReader";
import { Button } from "../../components/ui";

interface PoetryEditorProps {
  work: StudioWork;
  currentChapter: Chapter;
  onUpdateChapter: (chapterId: string, partial: Partial<Chapter>) => void;
  onAddChapter: () => void;
  onDuplicateChapter: (chapterId: string) => void;
  onDeleteChapter: (chapterId: string) => void;
  onReorderChapters: (newOrderIds: string[]) => void;
  onSelectChapter: (chapterId: string) => void;
}

export function PoetryEditor({
  work,
  currentChapter,
  onUpdateChapter,
  onAddChapter,
  onDuplicateChapter,
  onDeleteChapter,
  onReorderChapters,
  onSelectChapter,
}: PoetryEditorProps) {
  useLocalRevision();
  const unsaved = localWarnings().length > 0;
  // Convert stanzas (string[][]) into text separated by double newlines for editing while preserving lines
  const initialText = currentChapter.stanzas
    ? currentChapter.stanzas.map((stanza) => stanza.join("\n")).join("\n\n")
    : currentChapter.content || "";

  const [text, setText] = useState(initialText);
  const [poemTitle, setPoemTitle] = useState(currentChapter.title);
  const [previewMode, setPreviewMode] = useState(false);
  const [distractionFree, setDistractionFree] = useState(false);
  const alignCenter = currentChapter.alignment === "center";
  const setAlignCenter = (value: boolean) =>
    onUpdateChapter(currentChapter.id, {
      alignment: value ? "center" : "left",
    });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const raw = currentChapter.stanzas
      ? currentChapter.stanzas.map((stanza) => stanza.join("\n")).join("\n\n")
      : currentChapter.content || "";
    setText(raw);
    setPoemTitle(currentChapter.title);
  }, [currentChapter.id]);

  // Parse text into stanzas: double newline separates stanzas, single newline separates verses
  const parseStanzas = (rawText: string): string[][] => {
    return rawText
      .split(/\n\s*\n/)
      .map((stanzaStr) => stanzaStr.split("\n"))
      .filter((st) => st.length > 0 && st.some((v) => v.trim().length > 0));
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
    const parsed = parseStanzas(newText);
    onUpdateChapter(currentChapter.id, {
      stanzas: parsed,
      content: newText,
    });
  };

  const handleTitleBlur = () => {
    if (poemTitle.trim() && poemTitle !== currentChapter.title) {
      onUpdateChapter(currentChapter.id, { title: poemTitle.trim() });
    }
  };

  // Metrics
  const stanzas = parseStanzas(text);
  const totalVerses = stanzas.reduce(
    (acc, st) => acc + st.filter((v) => v.trim().length > 0).length,
    0,
  );
  const totalWords = text.trim().split(/\s+/).filter(Boolean).length;

  const currentIdx = work.chapters.findIndex((c) => c.id === currentChapter.id);
  const prevChapter = currentIdx > 0 ? work.chapters[currentIdx - 1] : null;
  const nextChapter =
    currentIdx < work.chapters.length - 1
      ? work.chapters[currentIdx + 1]
      : null;

  const moveChapter = (direction: "up" | "down", index: number) => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= work.chapters.length) return;

    const ids = work.chapters.map((c) => c.id);
    const temp = ids[index];
    ids[index] = ids[newIdx];
    ids[newIdx] = temp;
    onReorderChapters(ids);
  };

  return (
    <div
      className={`poetry-editor-root ${distractionFree ? "editor-focus-mode" : ""}`}
    >
      {/* Top Header */}
      <header className="editor-top-bar">
        <div className="editor-top-left">
          <Link to={`/estudio/obras/${work.id}`} className="editor-back-link">
            ← {work.title}
          </Link>
          <span className="separator" aria-hidden="true">
            ·
          </span>
          <span className="editor-tag font-mono text-xs">
            <Feather size={12} className="inline mr-1 text-accent" />
            Poesia · {currentIdx + 1} de {work.chapters.length}
          </span>
        </div>

        <div className="editor-top-right">
          <div className="editor-metrics-strip font-mono text-xs">
            <span>{totalVerses} versos</span>
            <span className="separator" aria-hidden="true">
              ·
            </span>
            <span>{stanzas.length} estrofes</span>
            <span className="separator" aria-hidden="true">
              ·
            </span>
            <span>{totalWords} palavras</span>
          </div>

          <Button
            variant={previewMode ? "primary" : "secondary"}
            onClick={() => setPreviewMode(!previewMode)}
            title="Pré-visualizar com o PoetryReader"
          >
            {previewMode ? (
              <>
                <Edit3 size={15} /> Voltar à composição
              </>
            ) : (
              <>
                <Eye size={15} /> Pré-visualizar poema
              </>
            )}
          </Button>

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

      {/* Main Body */}
      <div className="editor-workspace-body">
        {/* Poems Drawer */}
        {!distractionFree && !previewMode && (
          <aside
            className="editor-chapters-drawer"
            aria-label="Navegação de poemas"
          >
            <div className="drawer-header">
              <span className="drawer-title">
                Poemas ({work.chapters.length})
              </span>
              <button
                type="button"
                className="drawer-add-btn"
                onClick={onAddChapter}
                title="Adicionar novo poema"
                aria-label="Novo poema"
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
                    <span className="chapter-num font-mono">{idx + 1}.</span>
                    <span className="chapter-label truncate">{chap.title}</span>
                  </button>

                  <div className="drawer-chapter-actions">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveChapter("up", idx)}
                      title="Mover para cima"
                      aria-label="Mover para cima"
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === work.chapters.length - 1}
                      onClick={() => moveChapter("down", idx)}
                      title="Mover para baixo"
                      aria-label="Mover para baixo"
                    >
                      <ChevronDown size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicateChapter(chap.id)}
                      title="Duplicar poema"
                      aria-label="Duplicar poema"
                    >
                      <Copy size={13} />
                    </button>
                    {work.chapters.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(chap.id)}
                        className="text-danger"
                        title="Eliminar poema"
                        aria-label="Eliminar poema"
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
            title="Eliminar poema?"
          >
            <p className="mt-2 text-sm text-muted">
              Esta ação removerá o poema durante esta sessão de edição.
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

        {/* Poetry Composition Pane */}
        <section aria-label="Área de edição" className="editor-main-canvas">
          {previewMode ? (
            <div className="editor-live-preview-box">
              <div className="preview-indicator-bar">
                <span>Pré-visualização no PoetryReader</span>
                <small>
                  Preservação exata de versos, estrofes e respiração poética.
                </small>
              </div>
              <PoetryReader
                workId={work.id}
                workTitle={work.title}
                author="Tu (Autor)"
                chapters={work.chapters.map((c) =>
                  c.id === currentChapter.id
                    ? { ...c, stanzas, content: text, title: poemTitle }
                    : c,
                )}
                currentChapter={{
                  ...currentChapter,
                  stanzas,
                  content: text,
                  title: poemTitle,
                }}
              />
            </div>
          ) : (
            <div className="poetry-composition-pane">
              {/* Poetry Bar */}
              <div
                className="editor-toolbar-strip"
                role="toolbar"
                aria-label="Opções de poesia"
              >
                <div className="toolbar-group">
                  <button
                    type="button"
                    className={!alignCenter ? "active" : ""}
                    onClick={() => setAlignCenter(false)}
                    title="Alinhamento à esquerda"
                    aria-label="Alinhar à esquerda"
                  >
                    <AlignLeft size={15} />
                  </button>
                  <button
                    type="button"
                    className={alignCenter ? "active" : ""}
                    onClick={() => setAlignCenter(true)}
                    title="Alinhamento centralizado"
                    aria-label="Alinhar ao centro"
                  >
                    <AlignCenter size={15} />
                  </button>
                </div>

                <div className="toolbar-divider" />

                <span className="text-xs text-muted">
                  Uma linha em branco separa estrofes · O leitor preserva os
                  versos intactos
                </span>

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

              {/* Title */}
              <div className="poetry-title-container">
                <input
                  type="text"
                  value={poemTitle}
                  onChange={(e) => setPoemTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  placeholder="Título do poema..."
                  className={`poetry-title-input ${alignCenter ? "text-center" : ""}`}
                  aria-label="Título do poema"
                />
              </div>

              {/* Poetry Textarea */}
              <div className="poetry-textarea-wrapper">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Escreve os teus versos aqui...&#10;Cada quebra de linha corresponde a um verso.&#10;&#10;Duas quebras de linha abrem uma nova estrofe."
                  className={`poetry-main-textarea ${alignCenter ? "text-center" : ""}`}
                  aria-label="Versos e estrofes do poema"
                />
              </div>

              {/* Footer Nav */}
              <footer className="editor-bottom-nav">
                {prevChapter ? (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => onSelectChapter(prevChapter.id)}
                  >
                    ← Poema: {prevChapter.title}
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
                    Poema: {nextChapter.title} →
                  </button>
                ) : (
                  <Button variant="secondary" onClick={onAddChapter}>
                    <Plus size={14} className="inline mr-1" /> Criar próximo
                    poema
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
