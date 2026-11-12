import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import {
  decodeRich,
  encodeRich,
  entryText,
  entryWords,
  legacyDocument,
  normalizeDocument,
  plainDocument,
  richPrefix,
  safeLink,
} from "../src/foundation/features/writing/document";
import { ProseContent } from "../src/foundation/features/reader/content";
const rich = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2, textAlign: "center", style: "color:red" },
      content: [{ type: "text", text: "Título", marks: [{ type: "bold" }] }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Uma história real",
          marks: [
            { type: "italic" },
            { type: "underline" },
            { type: "strike" },
            {
              type: "link",
              attrs: { href: "https://example.com", onclick: "evil()" },
            },
          ],
        },
      ],
    },
  ],
};
test("writing: versioned JSON roundtrip and plain counts exclude serialization", () => {
  const stored = encodeRich(rich);
  assert.ok(stored.startsWith(richPrefix));
  assert.deepEqual(decodeRich(stored), normalizeDocument(rich));
  assert.equal(entryWords(stored), 4);
  assert.equal(entryText(stored), "Título\n\nUma história real");
  assert.equal(stored.includes("onclick"), false);
  assert.equal(stored.includes("color:red"), false);
  assert.equal(encodeRich(plainDocument("")), "");
  assert.equal(decodeRich("legacy text"), null);
  assert.equal(entryText("  linha\nverso"), "  linha\nverso");
});
test("writing: old text and AG markup import without losing line breaks or literal unknown HTML", () => {
  const text =
    "# Cabeçalho\n\n**Forte** e *suave* <u>sublinhado</u>\nlinha\n\n> Citação\n\n- Uma\n- Duas\n\n---\n\n<script>literal</script>";
  const stored = encodeRich(legacyDocument(text));
  const html = renderToStaticMarkup(<ProseContent text={stored} />);
  for (const marker of [
    "<h2",
    "<strong>",
    "<em>",
    "<u>",
    "<blockquote>",
    "<ul>",
    "<hr",
    "&lt;script&gt;literal",
  ])
    assert.ok(html.includes(marker), marker);
  assert.equal(html.includes("<script>"), false);
  assert.ok(entryText(stored).includes("\nlinha"));
});
test("writing: public rendering permits only supported nodes/marks and safe URLs", () => {
  const hostile = encodeRich({
    type: "doc",
    content: [
      {
        type: "paragraph",
        attrs: { textAlign: "expression(evil())", onclick: "evil()" },
        content: [
          {
            type: "text",
            text: "<img src=x onerror=evil()>",
            marks: [
              { type: "link", attrs: { href: "javascript:evil()" } },
              { type: "bold" },
            ],
          },
        ],
      },
    ],
  });
  const html = renderToStaticMarkup(<ProseContent text={hostile} />);
  assert.ok(html.includes("&lt;img"));
  assert.ok(!html.includes("href="));
  assert.ok(!html.includes("onclick="));
  assert.ok(!html.includes("expression("));
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,x",
    "//evil.test",
    "https://site/\nx",
    "javascript%3Aalert(1)",
  ])
    assert.equal(safeLink(value), null);
  for (const value of [
    "https://example.com/a",
    "mailto:reader@example.com",
    "/catalogo",
    "#chapter",
  ])
    assert.equal(safeLink(value), value);
  assert.equal(
    decodeRich(
      richPrefix +
        JSON.stringify({
          type: "doc",
          content: [{ type: "image", attrs: { src: "evil" } }],
        }),
    ),
    null,
  );
});
test("writing: old published content stays escaped and no HTML parser is required in readers", () => {
  const html = renderToStaticMarkup(
    <ProseContent
      text={"Texto antigo\n\n<img src=x onerror=evil()>\n<u>permitido</u>"}
    />,
  );
  assert.ok(html.includes("Texto antigo"));
  assert.ok(html.includes("&lt;img"));
  assert.ok(html.includes("<u>permitido</u>"));
  const bad = richPrefix + "not-json";
  assert.ok(
    renderToStaticMarkup(<ProseContent text={bad} />).includes("AGRT/1"),
  );
});
test("writing: poetry import preserves indentation, blank stanzas and verse breaks", () => {
  const stored = encodeRich(
    legacyDocument("  Um verso\noutro verso\n\n\nEstrofe final", true),
  );
  assert.equal(entryText(stored), "  Um verso\noutro verso\n\n\nEstrofe final");
  assert.equal(decodeRich(stored)?.content?.length, 2);
});
