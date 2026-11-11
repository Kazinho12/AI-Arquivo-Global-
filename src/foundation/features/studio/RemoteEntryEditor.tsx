import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Field, Modal } from "../../components/ui";
import type { StudioWork } from "./types";
import type { Chapter } from "../reader/types";
import { useRemoteWorks } from "./RemoteWorksProvider";
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
  const original = base.chapters.find((item) => item.id === entry.id)!;
  const dirty =
    title !== original.title ||
    content !== (original.content ?? "") ||
    alignment !== (original.alignment ?? "left");
  const archived = Boolean(work.archivedAt);
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
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
      if (!anchor || event.defaultPrevented) return;
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
  async function save() {
    setSaved(false);
    const result = await remote.controller?.editorial(base, "save_entry", {
      entry_id: entry.id,
      entry_revision: original.revision,
      title,
      content,
      alignment,
    });
    if (result?.work) {
      setBase(result.work);
      setSaved(true);
      clearBuffer();
    }
  }
  async function recover() {
    const latest = await remote.controller?.recover(work.id);
    const fresh = latest?.chapters.find((item) => item.id === entry.id);
    if (latest && fresh) {
      setBase(latest);
      setTitle(fresh.title);
      setContent(fresh.content ?? "");
      setAlignment(fresh.alignment ?? "left");
      setSaved(false);
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
    if (!result?.work) return;
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
    <div className="container studio-page">
      <header className="editor-top-bar">
        <Link to={`/estudio/obras/${work.id}`} className="editor-back-link">
          ← {work.title}
        </Link>
        <span>
          {entryLabel(work)} {entry.number} · {wordCount} palavras
        </span>
      </header>
      <h1>
        Editar {entryLabel(work)} — {entry.title}
      </h1>
      <p role="status">
        {remote.saving
          ? "A guardar…"
          : dirty
            ? "Alterações não guardadas"
            : saved
              ? "Guardado na conta"
              : "Última versão persistida"}
      </p>
      {restoredBuffer && dirty && (
        <p>Alterações não guardadas recuperadas deste separador.</p>
      )}
      {remote.error && (
        <p role="alert">{remote.error} O texto em edição foi preservado.</p>
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
          <fieldset disabled={disabled}>
            <Field
              label={`Título do ${entryLabel(work)}`}
              value={title}
              maxLength={200}
              onChange={(e) => {
                setTitle(e.target.value);
                setSaved(false);
              }}
            />
            <label className="field">
              <span>
                {work.mode === "poetry"
                  ? "Texto do poema"
                  : work.mode === "prose"
                    ? "Texto do capítulo"
                    : "Guião e descrição editorial"}
              </span>
              <textarea
                value={content}
                rows={22}
                maxLength={1048576}
                style={{ width: "100%", textAlign: alignment }}
                onChange={(e) => {
                  setContent(e.target.value);
                  setSaved(false);
                }}
              />
            </label>
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
              onClick={() => void save()}
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
              onClick={() => setConfirmation("delete")}
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
            Gravação manual. Guarda antes de reorganizar. O texto não guardado é
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
          onClose={() => setConfirmation(null)}
        >
          <p>
            {confirmation === "delete"
              ? "A entrada será eliminada da conta. As alterações não guardadas desta entrada serão descartadas."
              : "O texto em edição será substituído pela última versão guardada no servidor. Copia primeiro as alterações que pretendes conservar."}
          </p>
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
