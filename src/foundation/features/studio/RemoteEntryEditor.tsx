import { RichContent } from "../writing/RichContent";
import {
  entryText,
  maxEntryBytes,
  decodeRich,
  legacyDocument,
  richPrefix,
} from "../writing/document";
import { ProseContent } from "../reader/content";
import {
  useEffect,
  useState,
  useRef,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Field, Modal } from "../../components/ui";
import type { StudioWork } from "./types";
import type { Chapter } from "../reader/types";
import { useRemoteWorks } from "./RemoteWorksProvider";
const RichEditor = lazy(() =>
  import("../writing/RichEditor").then((module) => ({
    default: module.RichEditor,
  })),
);
export const entryLabel = (work: StudioWork) =>
  work.mode === "poetry"
    ? "poema"
    : work.mode === "comic" || work.mode === "manga"
      ? "ato"
      : "capítulo";
export const entryPath = (work: StudioWork, entry: Chapter) =>
  `/estudio/obras/${work.id}/${work.mode === "comic" || work.mode === "manga" ? "paginas" : "capitulos"}/${entry.id}/editar`;
export function RemoteEntryEditor({
  work,
  entry,
}: {
  work: StudioWork;
  entry: Chapter;
}) {
  const remote = useRemoteWorks();
  const navigate = useNavigate();
  const buffer = remote.controller?.editorBuffers.get(entry.id);
  const [restoredBuffer] = useState(Boolean(buffer));
  const [base, setBase] = useState(buffer?.work ?? work);
  const [title, setTitle] = useState(buffer?.title ?? entry.title);
  const [content, setContent] = useState(
    buffer?.content ?? entry.content ?? "",
  );
  const [alignment, setAlignment] = useState<"left" | "center">(
    buffer?.alignment ?? entry.alignment ?? "left",
  );
  const [confirmation, setConfirmation] = useState<"delete" | "recover" | null>(
    null,
  );
  const [saved, setSaved] = useState(false);
  const [focus, setFocus] = useState(false),
    [preview, setPreview] = useState(false),
    [fullscreen, setFullscreen] = useState(false),
    [saveError, setSaveError] = useState("");
  const [modeError, setModeError] = useState("");
  const root = useRef<HTMLDivElement>(null),
    alive = useRef(true),
    saving = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    const update = () =>
      setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  const [deleteError, setDeleteError] = useState("");
  const original = base.chapters.find((item) => item.id === entry.id)!;
  const dirty =
    title !== original.title ||
    content !== (original.content ?? "") ||
    alignment !== (original.alignment ?? "left");
  const archived = Boolean(work.archivedAt);
  const text = entryText(content);
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const clearBuffer = () => remote.controller?.editorBuffers.delete(entry.id);
  useEffect(() => {
    if (dirty)
      remote.controller?.editorBuffers.set(entry.id, {
        work: base,
        title,
        content,
        alignment,
      });
    else clearBuffer();
  }, [dirty, base, title, content, alignment, entry.id, remote.controller]);
  useEffect(() => {
    if (!dirty && !remote.saving) return;
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const links = (event: MouseEvent) => {
      const anchor = (event.target as Element)?.closest?.("a[href]");
      if (
        !anchor ||
        event.defaultPrevented ||
        anchor.closest("[contenteditable=true]")
      )
        return;
      if (
        remote.saving ||
        !window.confirm(
          "Existem alterações não guardadas. Queres sair e descartá-las?",
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      } else clearBuffer();
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", links, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", links, true);
    };
  }, [dirty, remote.saving, entry.id, remote.controller]);
  const save = useCallback(
    async (automatic = false) => {
      const controller = remote.controller;
      if (
        !controller ||
        saving.current ||
        controller.getSnapshot().saving ||
        archived ||
        !dirty ||
        !title.trim()
      )
        return;
      if (new TextEncoder().encode(content).length > maxEntryBytes) {
        setSaveError(
          "O conteúdo excede o limite de 1 MB. Reduz o texto antes de guardar.",
        );
        return;
      }
      if (content.startsWith(richPrefix) && !decodeRich(content)) {
        setSaveError(
          "O documento contém uma estrutura demasiado complexa ou não suportada. Simplifica o texto antes de guardar; o buffer foi preservado.",
        );
        return;
      }
      saving.current = true;
      setSaved(false);
      if (!automatic) setSaveError("");
      const snapshot = { title, content, alignment };
      try {
        const result = await controller.editorial(base, "save_entry", {
          entry_id: entry.id,
          entry_revision: original.revision,
          ...snapshot,
        });
        if (result?.work) {
          const pending = controller.editorBuffers.get(entry.id);
          if (pending && pending.work.revision === base.revision) {
            if (
              pending.title === title &&
              pending.content === content &&
              pending.alignment === alignment
            )
              controller.editorBuffers.delete(entry.id);
            else
              controller.editorBuffers.set(entry.id, {
                ...pending,
                work: result.work,
              });
          }
          if (alive.current) {
            setBase(result.work);
            setSaved(true);
            setSaveError("");
          }
        } else if (alive.current)
          setSaveError(
            controller.getSnapshot().error ||
              "Não foi possível guardar. As alterações foram preservadas; tenta novamente.",
          );
      } finally {
        saving.current = false;
      }
    },
    [
      remote.controller,
      archived,
      dirty,
      title,
      content,
      alignment,
      base,
      original.revision,
      entry.id,
    ],
  );
  useEffect(() => {
    if (!dirty || archived || remote.saving || confirmation || saveError)
      return;
    const timer = window.setTimeout(() => void save(true), 1500);
    return () => window.clearTimeout(timer);
  }, [dirty, archived, remote.saving, confirmation, saveError, save]);
  async function recover() {
    const latest = await remote.controller?.recover(work.id);
    const fresh = latest?.chapters.find((item) => item.id === entry.id);
    if (latest && fresh) {
      setBase(latest);
      setTitle(fresh.title);
      setContent(fresh.content ?? "");
      setAlignment(fresh.alignment ?? "left");
      setSaved(false);
      setSaveError("");
      clearBuffer();
      setConfirmation(null);
    } else if (latest) {
      clearBuffer();
      navigate(`/estudio/obras/${work.id}`);
    }
  }
  async function structure(
    action:
      | "add_entry"
      | "duplicate_entry"
      | "delete_entry"
      | "reorder_entries",
    payload: Record<string, unknown> = {},
  ) {
    const result = await remote.controller?.editorial(work, action, payload);
    if (!result?.work) {
      if (action === "delete_entry")
        setDeleteError(
          remote.controller?.getSnapshot().error ||
            "Não foi possível eliminar a entrada. Cancela e recupera a última versão.",
        );
      return;
    }
    setBase(result.work);
    setConfirmation(null);
    if (action === "delete_entry") {
      clearBuffer();
      const next = result.work.chapters[0];
      navigate(
        next ? entryPath(result.work, next) : `/estudio/obras/${work.id}`,
      );
    }
    if (action === "add_entry" || action === "duplicate_entry") {
      const next = result.work.chapters.find(
        (item) => !work.chapters.some((old) => old.id === item.id),
      );
      if (next) navigate(entryPath(result.work, next));
    }
  }
  function move(id: string, offset: number) {
    const ids = work.chapters.map((item) => item.id);
    const index = ids.indexOf(id);
    const target = index + offset;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    void structure("reorder_entries", { ids });
  }
  const disabled = remote.saving || archived;
  const entryPayload = { entry_id: entry.id, entry_revision: entry.revision };
  return (
    <div
      ref={root}
      className={`container studio-page writing-studio ${focus ? "writing-focus" : ""} ${fullscreen ? "writing-fullscreen" : ""}`}
    >
      <header className="editor-top-bar">
        <Link to={`/estudio/obras/${work.id}`} className="editor-back-link">
          ← {work.title}
        </Link>
        <span>
          {entryLabel(work)} {entry.number} · {wordCount} palavras ·{" "}
          {Array.from(text).length} caracteres
        </span>
      </header>
      <div className="writing-modes" role="group" aria-label="Modo de escrita">
        <Button
          variant="secondary"
          aria-pressed={focus}
          onClick={() => setFocus((value) => !value)}
        >
          {focus ? "Sair do modo foco" : "Modo foco"}
        </Button>
        <Button
          variant="secondary"
          aria-pressed={preview}
          onClick={() => setPreview((value) => !value)}
        >
          {preview ? "Voltar à edição" : "Pré-visualizar capítulo"}
        </Button>
        <Button
          variant="ghost"
          aria-pressed={fullscreen}
          onClick={async () => {
            try {
              if (document.fullscreenElement === root.current)
                await document.exitFullscreen();
              else if (root.current?.requestFullscreen)
                await root.current.requestFullscreen();
              else
                setModeError(
                  "O ecrã inteiro não está disponível neste navegador.",
                );
            } catch {
              setModeError(
                "Não foi possível abrir o ecrã inteiro neste navegador.",
              );
            }
          }}
        >
          {fullscreen ? "Sair do ecrã inteiro" : "Ecrã inteiro"}
        </Button>
      </div>
      <h1>
        Editar {entryLabel(work)} — {entry.title}
      </h1>
      <p role="status">
        {remote.saving
          ? "A guardar…"
          : saveError
            ? "Erro ao guardar"
            : dirty
              ? "Alterações não guardadas"
              : saved
                ? "Guardado na conta"
                : "Última versão persistida"}
      </p>
      {modeError && <p role="alert">{modeError}</p>}
      {restoredBuffer && dirty && (
        <p>Alterações não guardadas recuperadas deste separador.</p>
      )}
      {(saveError || remote.error) && (
        <p role="alert">
          {saveError || remote.error} O texto em edição foi preservado.
        </p>
      )}
      {archived && (
        <p>Obra arquivada: desarquiva-a na gestão para continuar a escrever.</p>
      )}
      {(work.mode === "comic" || work.mode === "manga") && (
        <p className="editorial-notice">
          Estrutura e guião persistentes. Uploads e páginas de imagens ainda não
          estão disponíveis.
        </p>
      )}
      <div className="editor-workspace-body">
        <aside className="editor-chapters-drawer" aria-label="Entradas da obra">
          <h2>
            {work.mode === "poetry"
              ? "Poemas"
              : work.mode === "prose"
                ? "Capítulos"
                : "Atos"}{" "}
            ({work.chapters.length})
          </h2>
          <Button
            disabled={disabled || dirty}
            onClick={() => void structure("add_entry")}
          >
            Adicionar {entryLabel(work)}
          </Button>
          <ol className="drawer-chapter-list">
            {work.chapters.map((item, index) => (
              <li key={item.id} className="drawer-chapter-item">
                <Link
                  to={entryPath(work, item)}
                  aria-current={item.id === entry.id ? "page" : undefined}
                >
                  {item.number}. {item.title}
                </Link>
                <Button
                  variant="ghost"
                  aria-label={`Subir ${item.title}`}
                  disabled={disabled || dirty || index === 0}
                  onClick={() => move(item.id, -1)}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  aria-label={`Descer ${item.title}`}
                  disabled={
                    disabled || dirty || index === work.chapters.length - 1
                  }
                  onClick={() => move(item.id, 1)}
                >
                  ↓
                </Button>
              </li>
            ))}
          </ol>
        </aside>
        <section
          className="wizard-card-step"
          style={{ flex: 1, minWidth: 0 }}
          aria-label="Conteúdo da entrada"
        >
          <fieldset disabled={archived}>
            <Field
              label={`Título do ${entryLabel(work)}`}
              value={title}
              maxLength={200}
              onChange={(e) => {
                setTitle(e.target.value);
                setSaved(false);
              }}
            />
            <div className="field">
              <span id="writing-content-label">
                {work.mode === "poetry"
                  ? "Texto do poema"
                  : work.mode === "prose"
                    ? "Texto do capítulo"
                    : "Guião e descrição editorial"}
              </span>
            </div>
            {preview ? (
              <article
                className="writing-preview"
                aria-label="Pré-visualização do capítulo"
                style={{ textAlign: alignment }}
              >
                <h2>{title}</h2>
                {work.mode === "poetry" ? (
                  <RichContent
                    document={
                      decodeRich(content) ?? legacyDocument(content, true)
                    }
                  />
                ) : (
                  <ProseContent text={content} />
                )}
              </article>
            ) : (
              <Suspense fallback={<p role="status">A preparar o editor…</p>}>
                <RichEditor
                  label={
                    work.mode === "poetry"
                      ? "Texto do poema"
                      : work.mode === "prose"
                        ? "Texto do capítulo"
                        : "Guião e descrição editorial"
                  }
                  value={content}
                  alignment={alignment}
                  onChange={(value) => {
                    setContent(value);
                    setSaved(false);
                  }}
                  disabled={archived}
                  poetry={work.mode === "poetry"}
                />
              </Suspense>
            )}
            {work.mode === "poetry" && (
              <label className="field">
                <span>Alinhamento</span>
                <select
                  value={alignment}
                  onChange={(e) => {
                    setAlignment(e.target.value as "left" | "center");
                    setSaved(false);
                  }}
                >
                  <option value="left">À esquerda</option>
                  <option value="center">Centrado</option>
                </select>
              </label>
            )}
            <Button
              disabled={disabled || !dirty || !title.trim()}
              onClick={() => void save(false)}
            >
              Guardar alterações
            </Button>
            <Button
              variant="secondary"
              disabled={disabled || dirty}
              onClick={() => void structure("duplicate_entry", entryPayload)}
            >
              Duplicar {entryLabel(work)}
            </Button>
            <Button
              variant="ghost"
              disabled={disabled}
              onClick={() => {
                setDeleteError("");
                setConfirmation("delete");
              }}
            >
              Eliminar {entryLabel(work)}
            </Button>
          </fieldset>
          <Button
            variant="secondary"
            disabled={remote.saving}
            onClick={() => setConfirmation("recover")}
          >
            Recuperar última versão persistida
          </Button>
          <p className="text-muted">
            Gravação automática após uma pausa de 1,5 segundos e confirmação do
            servidor. Em caso de erro, usa Guardar alterações para tentar
            novamente. Guarda antes de reorganizar. O texto não guardado é
            conservado em memória neste separador durante a navegação, até
            terminares a sessão.
          </p>
        </section>
      </div>
      {confirmation && (
        <Modal
          open
          title={
            confirmation === "delete"
              ? `Eliminar ${entryLabel(work)}?`
              : "Recuperar última versão?"
          }
          onClose={() => {
            if (!remote.saving) setConfirmation(null);
          }}
        >
          <p>
            {confirmation === "delete"
              ? "A entrada será eliminada da edição privada. As alterações não guardadas serão descartadas. Se existir uma edição pública, atualiza ou retira a publicação para remover também esse conteúdo dos leitores."
              : "O texto em edição será substituído pela última versão guardada no servidor. Copia primeiro as alterações que pretendes conservar."}
          </p>
          {confirmation === "delete" && deleteError && (
            <p role="alert">{deleteError}</p>
          )}
          {remote.saving && <p role="status">A processar…</p>}
          <div className="modal-actions">
            <Button
              variant="ghost"
              disabled={remote.saving}
              onClick={() => setConfirmation(null)}
            >
              Cancelar
            </Button>
            <Button
              disabled={remote.saving}
              onClick={() =>
                confirmation === "delete"
                  ? void structure("delete_entry", entryPayload)
                  : void recover()
              }
            >
              {confirmation === "delete"
                ? "Confirmar eliminação"
                : "Confirmar recuperação"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
