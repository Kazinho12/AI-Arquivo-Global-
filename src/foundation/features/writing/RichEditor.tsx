import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Button, Field, Modal } from "../../components/ui";
import {
  decodeRich,
  encodeRich,
  legacyDocument,
  plainDocument,
  safeLink,
  maxEntryBytes,
  richPrefix,
} from "./document";
import { sanitizePastedHtml } from "./paste";
export function RichEditor({
  value,
  onChange,
  label,
  disabled = false,
  poetry = false,
  alignment = "left",
}: {
  value: string;
  onChange: (content: string) => void;
  label: string;
  disabled?: boolean;
  poetry?: boolean;
  alignment?: "left" | "center";
}) {
  const [notice, setNotice] = useState(""),
    [linkOpen, setLinkOpen] = useState(false),
    [href, setHref] = useState("");
  const plainNextPaste = useRef(0);
  const plainPaste = useRef(false),
    current = useRef(onChange);
  current.current = onChange;
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        code: false,
        codeBlock: false,
        trailingNode: false,
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          autolink: false,
          isAllowedUri: (url) => Boolean(safeLink(url)),
        },
      }),
      TextAlign.configure({ types: ["paragraph", "heading"] }),
    ],
    immediatelyRender: false,
    content: decodeRich(value) ?? legacyDocument(value, poetry),
    editable: !disabled,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-label": label,
        "aria-multiline": "true",
        "aria-readonly": disabled ? "true" : "false",
        class: "writing-surface",
      },
      transformPastedHTML: (html) => sanitizePastedHtml(html),
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData("text/plain") ?? "";
        if (text.length > maxEntryBytes) {
          event.preventDefault();
          setNotice(
            "A colagem excede o limite de 1 MB. Divide o conteúdo em partes.",
          );
          return true;
        }
        if (plainPaste.current || Date.now() < plainNextPaste.current) {
          plainNextPaste.current = 0;
          event.preventDefault();
          editor
            ?.chain()
            .focus()
            .unsetAllMarks()
            .insertContent(plainDocument(text).content ?? [])
            .run();
          return true;
        }
        return false;
      },
      handleKeyDown: (_view, event) => {
        if (
          (event.ctrlKey || event.metaKey) &&
          event.shiftKey &&
          event.key.toLowerCase() === "v"
        )
          plainNextPaste.current = Date.now() + 1500;
        if (
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === "k"
        ) {
          event.preventDefault();
          setHref(editor?.getAttributes("link").href ?? "");
          setLinkOpen(true);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      try {
        const stored = encodeRich(editor.getJSON());
        current.current(stored);
        setNotice(
          new TextEncoder().encode(stored).length > maxEntryBytes
            ? "O conteúdo excede 1 MB e ainda não pode ser guardado. Reduz o texto; as alterações permanecem neste separador."
            : "",
        );
      } catch {
        current.current(richPrefix + JSON.stringify(editor.getJSON()));
        setNotice(
          "O documento é demasiado complexo. Simplifica a estrutura antes de guardar. O texto permanece neste separador.",
        );
      }
    },
  });
  const active = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            bold: editor.isActive("bold"),
            italic: editor.isActive("italic"),
            underline: editor.isActive("underline"),
            strike: editor.isActive("strike"),
            h1: editor.isActive("heading", { level: 1 }),
            h2: editor.isActive("heading", { level: 2 }),
            h3: editor.isActive("heading", { level: 3 }),
            bullet: editor.isActive("bulletList"),
            ordered: editor.isActive("orderedList"),
            quote: editor.isActive("blockquote"),
            link: editor.isActive("link"),
            left: editor.isActive({ textAlign: "left" }),
            center: editor.isActive({ textAlign: "center" }),
            right: editor.isActive({ textAlign: "right" }),
            justify: editor.isActive({ textAlign: "justify" }),
            undo: editor.can().undo(),
            redo: editor.can().redo(),
          }
        : null,
  });
  useEffect(() => {
    if (editor) editor.setEditable(!disabled, false);
  }, [editor, disabled]);
  useEffect(() => {
    if (!editor) return;
    let snapshot: string;
    try {
      snapshot = encodeRich(editor.getJSON());
    } catch {
      snapshot = richPrefix + JSON.stringify(editor.getJSON());
    }
    if (value !== snapshot)
      editor.commands.setContent(
        decodeRich(value) ?? legacyDocument(value, poetry),
        { emitUpdate: false },
      );
  }, [value, editor, poetry]);
  function tool(
    label: string,
    text: string,
    run: () => unknown,
    pressed?: boolean,
    inactive = false,
  ) {
    return (
      <button
        type="button"
        title={label}
        aria-label={label}
        aria-pressed={pressed}
        disabled={disabled || inactive || !editor}
        onMouseDown={(e) => e.preventDefault()}
        onClick={run}
      >
        {text}
      </button>
    );
  }
  return (
    <div className="rich-editor">
      <div
        className="writing-toolbar"
        role="toolbar"
        aria-label="Formatação do texto"
        onKeyDown={(event) => {
          if (
            !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) ||
            !(event.target instanceof HTMLButtonElement)
          )
            return;
          const buttons = [
            ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
              "button:not(:disabled)",
            ),
          ];
          const index = buttons.indexOf(event.target);
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? buttons.length - 1
                : (index +
                    (event.key === "ArrowRight" ? 1 : -1) +
                    buttons.length) %
                  buttons.length;
          event.preventDefault();
          buttons[next]?.focus();
        }}
      >
        <div role="group" aria-label="Ênfase">
          {tool(
            "Negrito (Ctrl+B)",
            "B",
            () => editor?.chain().focus().toggleBold().run(),
            active?.bold,
          )}
          {tool(
            "Itálico (Ctrl+I)",
            "I",
            () => editor?.chain().focus().toggleItalic().run(),
            active?.italic,
          )}
          {tool(
            "Sublinhado (Ctrl+U)",
            "U",
            () => editor?.chain().focus().toggleUnderline().run(),
            active?.underline,
          )}
          {tool(
            "Riscado",
            "S̶",
            () => editor?.chain().focus().toggleStrike().run(),
            active?.strike,
          )}
        </div>
        <div role="group" aria-label="Estrutura">
          {([1, 2, 3] as const).map((level) => (
            <span key={level}>
              {tool(
                `Título H${level}`,
                `H${level}`,
                () => editor?.chain().focus().toggleHeading({ level }).run(),
                active?.[`h${level}`],
              )}
            </span>
          ))}
          {tool(
            "Lista não numerada",
            "• Lista",
            () => editor?.chain().focus().toggleBulletList().run(),
            active?.bullet,
          )}
          {tool(
            "Lista numerada",
            "1. Lista",
            () => editor?.chain().focus().toggleOrderedList().run(),
            active?.ordered,
          )}
          {tool(
            "Citação",
            "❝",
            () => editor?.chain().focus().toggleBlockquote().run(),
            active?.quote,
          )}
          {tool("Separador", "―", () =>
            editor?.chain().focus().setHorizontalRule().run(),
          )}
          {tool(
            "Inserir ou editar link (Ctrl+K)",
            "Link",
            () => {
              setHref(editor?.getAttributes("link").href ?? "");
              setLinkOpen(true);
            },
            active?.link,
          )}
        </div>
        <div role="group" aria-label="Alinhamento">
          {(
            [
              ["left", "À esquerda"],
              ["center", "Centrar"],
              ["right", "À direita"],
              ["justify", "Justificar"],
            ] as const
          ).map(([alignment, label]) => (
            <span key={alignment}>
              {tool(
                label,
                label,
                () => editor?.chain().focus().setTextAlign(alignment).run(),
                active?.[alignment],
              )}
            </span>
          ))}
        </div>
        <div role="group" aria-label="Histórico">
          {tool(
            "Desfazer (Ctrl+Z)",
            "↶",
            () => editor?.chain().focus().undo().run(),
            undefined,
            !active?.undo,
          )}
          {tool(
            "Refazer (Ctrl+Shift+Z)",
            "↷",
            () => editor?.chain().focus().redo().run(),
            undefined,
            !active?.redo,
          )}
        </div>
      </div>
      <div className="writing-paste-controls">
        <label>
          <input
            type="checkbox"
            onChange={(e) => {
              plainPaste.current = e.target.checked;
            }}
          />{" "}
          Colar sempre sem formatação
        </label>
        <button
          type="button"
          className="text-link"
          disabled={disabled}
          onClick={async () => {
            try {
              const text = await navigator.clipboard.readText();
              if (text.length > maxEntryBytes) throw Error();
              editor
                ?.chain()
                .focus()
                .insertContent(plainDocument(text).content ?? [])
                .run();
            } catch {
              setNotice(
                "Não foi possível ler a área de transferência. Usa Ctrl+Shift+V ou ativa a colagem sem formatação.",
              );
            }
          }}
        >
          Colar sem formatação
        </button>
      </div>
      {!editor && <p role="status">A preparar o editor…</p>}
      <EditorContent editor={editor} style={{ textAlign: alignment }} />
      {notice && <p role="alert">{notice}</p>}
      <Modal
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        title="Link no texto"
      >
        <Field
          label="URL do link"
          value={href}
          onChange={(e) => setHref(e.target.value)}
          placeholder="https://…"
        />
        <Button
          type="button"
          onClick={() => {
            const safe = safeLink(href);
            if (!safe) {
              setNotice(
                "Usa um link http, https, mailto ou um caminho interno válido.",
              );
              setLinkOpen(false);
              return;
            }
            const chain = editor?.chain().focus();
            if (editor?.state.selection.empty && !editor.isActive("link"))
              chain
                ?.insertContent({
                  type: "text",
                  text: safe,
                  marks: [{ type: "link", attrs: { href: safe } }],
                })
                .run();
            else chain?.extendMarkRange("link").setLink({ href: safe }).run();
            setLinkOpen(false);
          }}
        >
          Aplicar link
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            editor?.chain().focus().unsetLink().run();
            setLinkOpen(false);
          }}
        >
          Remover link
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setLinkOpen(false)}
        >
          Cancelar
        </Button>
      </Modal>
    </div>
  );
}
