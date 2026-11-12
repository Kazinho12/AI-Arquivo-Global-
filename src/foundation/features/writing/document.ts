export const richPrefix = "AGRT/1\n";
export const maxEntryBytes = 1048576;
export interface RichMark {
  type: string;
  attrs?: Record<string, unknown>;
}
export interface RichNode {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: RichMark[];
  content?: RichNode[];
}
const blocks = [
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "blockquote",
  "horizontalRule",
];
const marks = ["bold", "italic", "underline", "strike", "link"];
export function safeLink(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const url = value.trim();
  if (!url || /[\u0000-\u0020\u007f\\]/.test(url)) return null;
  if ((url.startsWith("/") && !url.startsWith("//")) || url.startsWith("#"))
    return url;
  try {
    return ["http:", "https:", "mailto:"].includes(new URL(url).protocol)
      ? url
      : null;
  } catch {
    return null;
  }
}
export function normalizeDocument(input: unknown): RichNode {
  let count = 0;
  function visit(value: any, depth: number, parent: string): RichNode {
    if (!value || typeof value !== "object" || ++count > 2000000 || depth > 32)
      throw Error("Documento inválido ou demasiado complexo.");
    const type = value.type;
    const allowed =
      parent === "root"
        ? ["doc"]
        : parent === "paragraph" || parent === "heading"
          ? ["text", "hardBreak"]
          : parent === "bulletList" || parent === "orderedList"
            ? ["listItem"]
            : blocks;
    if (!allowed.includes(type))
      throw Error("Estrutura de texto não suportada.");
    const node: RichNode = { type };
    if (type === "text") {
      if (typeof value.text !== "string" || !value.text)
        throw Error("Texto inválido.");
      node.text = value.text;
      const clean: RichMark[] = [];
      for (const mark of Array.isArray(value.marks) ? value.marks : []) {
        if (!marks.includes(mark?.type)) continue;
        if (mark.type === "link") {
          const href = safeLink(mark.attrs?.href);
          if (href) clean.push({ type: "link", attrs: { href } });
        } else clean.push({ type: mark.type });
      }
      if (clean.length) node.marks = clean;
    } else if (!["hardBreak", "horizontalRule"].includes(type)) {
      node.content = (Array.isArray(value.content) ? value.content : []).map(
        (child: unknown) => visit(child, depth + 1, type),
      );
    }
    if (type === "paragraph" || type === "heading") {
      const align = value.attrs?.textAlign;
      if (["left", "center", "right", "justify"].includes(align))
        node.attrs = { textAlign: align };
      if (type === "heading")
        node.attrs = {
          ...node.attrs,
          level: [1, 2, 3].includes(value.attrs?.level) ? value.attrs.level : 1,
        };
    }
    if (
      type === "orderedList" &&
      Number.isInteger(value.attrs?.start) &&
      value.attrs.start > 0 &&
      value.attrs.start <= 1000000
    )
      node.attrs = { start: value.attrs.start };
    return node;
  }
  return visit(input, 0, "root");
}
export function decodeRich(value: string): RichNode | null {
  if (
    !value.startsWith(richPrefix) ||
    new TextEncoder().encode(value).length > maxEntryBytes
  )
    return null;
  try {
    return normalizeDocument(JSON.parse(value.slice(richPrefix.length)));
  } catch {
    return null;
  }
}
function nodeText(node: RichNode): string {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return "\n";
  return (node.content ?? [])
    .map(nodeText)
    .join(["paragraph", "heading"].includes(node.type) ? "" : "\n\n");
}
export function entryText(value: string): string {
  const doc = decodeRich(value);
  return doc ? nodeText(doc) : value;
}
export function entryWords(value: string): number {
  return entryText(value).trim().split(/\s+/).filter(Boolean).length;
}
export function encodeRich(value: unknown): string {
  const doc = normalizeDocument(value);
  return nodeText(doc).trim() ? richPrefix + JSON.stringify(doc) : "";
}
export function plainDocument(value: string): RichNode {
  return {
    type: "doc",
    content: value
      .replace(/\r\n?/g, "\n")
      .split("\n\n")
      .map((block) => ({
        type: "paragraph",
        content: block
          .split("\n")
          .flatMap((line, i) => [
            ...(i ? [{ type: "hardBreak" }] : []),
            ...(line ? [{ type: "text", text: line }] : []),
          ]),
      })),
  };
}
// Import the markup already supported by AG readers, keeping unknown HTML literal.
function inline(text: string, depth = 0): RichNode[] {
  if (depth > 16) return [{ type: "text", text }];
  const pattern = /\*\*([^]+?)\*\*|<u>([^]+?)<\/u>|\*([^*\n]+?)\*/g;
  const nodes: RichNode[] = [];
  let last = 0;
  for (const m of text.matchAll(pattern)) {
    if (m.index! > last)
      nodes.push({ type: "text", text: text.slice(last, m.index) });
    const mark = {
      type:
        m[1] !== undefined
          ? "bold"
          : m[2] !== undefined
            ? "underline"
            : "italic",
    };
    nodes.push(
      ...inline(m[1] ?? m[2] ?? m[3], depth + 1).map((n) => ({
        ...n,
        marks: [...(n.marks ?? []), mark],
      })),
    );
    last = m.index! + m[0].length;
  }
  if (last < text.length) nodes.push({ type: "text", text: text.slice(last) });
  return nodes;
}
export function legacyDocument(value: string, poetry = false): RichNode {
  const plain = plainDocument(value);
  if (poetry || !/^(#{1,3}\s|>\s?|[-*]\s|\d+\.\s|---\s*$)/m.test(value))
    return {
      ...plain,
      content: plain.content!.map((p) => ({
        ...p,
        content: p.content!.flatMap((n) =>
          n.type === "text" ? inline(n.text!) : [n],
        ),
      })),
    };
  const lines = value.replace(/\r\n?/g, "\n").split("\n"),
    content: RichNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const h = /^(#{1,3})\s+(.+)$/.exec(line);
    if (h) {
      content.push({
        type: "heading",
        attrs: { level: h[1].length },
        content: inline(h[2]),
      });
      i++;
      continue;
    }
    if (/^(---|\* \* \*)\s*$/.test(line)) {
      content.push({ type: "horizontalRule" });
      i++;
      continue;
    }
    const ordered = /^\d+\.\s/.test(line),
      unordered = /^[-*]\s/.test(line);
    if (ordered || unordered) {
      const items: RichNode[] = [];
      const regex = ordered ? /^\d+\.\s+/ : /^[-*]\s+/;
      while (i < lines.length && regex.test(lines[i]))
        items.push({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: inline(lines[i++].replace(regex, "")),
            },
          ],
        });
      content.push({
        type: ordered ? "orderedList" : "bulletList",
        content: items,
      });
      continue;
    }
    if (/^>/.test(line)) {
      const quote: RichNode[] = [];
      while (i < lines.length && /^>/.test(lines[i])) {
        if (quote.length) quote.push({ type: "hardBreak" });
        quote.push(...inline(lines[i++].replace(/^>\s?/, "")));
      }
      content.push({
        type: "blockquote",
        content: [{ type: "paragraph", content: quote }],
      });
      continue;
    }
    const paragraph: RichNode[] = [];
    do {
      if (paragraph.length) paragraph.push({ type: "hardBreak" });
      paragraph.push(...inline(lines[i++]));
    } while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,3}\s|>\s?|[-*]\s|\d+\.\s|---\s*$)/.test(lines[i])
    );
    content.push({ type: "paragraph", content: paragraph });
  }
  return {
    type: "doc",
    content: content.length ? content : [{ type: "paragraph" }],
  };
}
