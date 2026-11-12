import DOMPurify from "dompurify";
import { safeLink } from "./document";
export function sanitizePastedHtml(html: string): string {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "div",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "strike",
      "h1",
      "h2",
      "h3",
      "ul",
      "ol",
      "li",
      "blockquote",
      "hr",
      "a",
      "span",
    ],
    ALLOWED_ATTR: ["href", "start", "style"],
    FORBID_TAGS: [
      "script",
      "style",
      "iframe",
      "object",
      "embed",
      "svg",
      "math",
      "img",
      "form",
      "input",
    ],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  });
  const doc = new DOMParser().parseFromString(clean, "text/html");
  for (const el of [...doc.body.querySelectorAll<HTMLElement>("*")]) {
    const bold = /^(bold|[6-9]00)$/.test(el.style.fontWeight),
      italic = el.style.fontStyle === "italic",
      decoration = el.style.textDecorationLine || el.style.textDecoration,
      align = el.style.textAlign;
    el.removeAttribute("style");
    if (el.tagName === "A") {
      const href = safeLink(el.getAttribute("href"));
      if (href) el.setAttribute("href", href);
      else el.removeAttribute("href");
    }
    if (
      ["P", "DIV", "H1", "H2", "H3"].includes(el.tagName) &&
      ["left", "center", "right", "justify"].includes(align)
    )
      el.style.textAlign = align;
    if (
      ![
        "P",
        "DIV",
        "SPAN",
        "A",
        "H1",
        "H2",
        "H3",
        "STRONG",
        "B",
        "EM",
        "I",
        "U",
        "S",
        "STRIKE",
      ].includes(el.tagName)
    )
      continue;
    for (const tag of [
      ...(bold ? ["strong"] : []),
      ...(italic ? ["em"] : []),
      ...(decoration.includes("underline") ? ["u"] : []),
      ...(decoration.includes("line-through") ? ["s"] : []),
    ]) {
      const wrapper = doc.createElement(tag);
      while (el.firstChild) wrapper.appendChild(el.firstChild);
      el.appendChild(wrapper);
    }
  }
  return doc.body.innerHTML;
}
