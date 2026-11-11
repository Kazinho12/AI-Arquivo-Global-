import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import {
  poetryStanzas,
  ReaderSettings,
  ReaderIndex,
} from "../src/foundation/features/reader/ReaderSettings";
import { resumeChapter } from "../src/foundation/features/reader/progress";
import {
  cleanPreferences,
  defaults,
} from "../src/foundation/features/preferences/store";
import { PoetryReader } from "../src/foundation/features/reader/PoetryReader";
const chapters = [
  { id: "public-one", number: 1, title: "Primeiro", content: "Texto" },
  { id: "public-two", number: 3, title: "Segundo", content: "Texto" },
];
test("F3.2: poetry preserves line endings, indentation, blank stanzas and literal HTML", () => {
  const text = "  Verso\r\nOutro\r\n\r\n\r\n\r\nFim <script>alert(1)</script>";
  assert.deepEqual(poetryStanzas(text), [
    ["  Verso", "Outro"],
    [""],
    ["Fim <script>alert(1)</script>"],
  ]);
  const html = renderToStaticMarkup(
    <StaticRouter location="/">
      <PoetryReader
        workId="public-poetry"
        workTitle="Poemas"
        author="Autora"
        chapters={[{ ...chapters[0], content: text, alignment: "center" }]}
        currentChapter={{ ...chapters[0], content: text, alignment: "center" }}
      />
    </StaticRouter>,
  );
  assert.ok(html.includes("text-align:center"));
  assert.ok(html.includes("  Verso"));
  assert.ok(!html.includes("<script>"));
  assert.equal((html.match(/class="poetry-stanza"/g) ?? []).length, 3);
});
test("F3.2: resume only selects a chapter present in the current public snapshot", () => {
  assert.equal(resumeChapter(chapters, "public-two")?.id, "public-two");
  assert.equal(resumeChapter(chapters, "deleted")?.id, "public-one");
  assert.equal(resumeChapter(chapters)?.id, "public-one");
  assert.equal(resumeChapter([], "legacy"), null);
});
test("F3.2: settings expose five labelled groups and pressed states, system preference is validated", () => {
  const html = renderToStaticMarkup(
    <ReaderSettings
      prefs={{ ...defaults, theme: "system" }}
      onChange={() => {}}
    />,
  );
  assert.equal((html.match(/<fieldset/g) ?? []).length, 5);
  assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 5);
  assert.ok(html.includes("Sistema"));
  assert.ok(html.includes("Muito grande"));
  assert.deepEqual(
    cleanPreferences({ theme: "system", fontSize: "xlarge", bad: true }),
    { theme: "system", fontSize: "xlarge" },
  );
  assert.deepEqual(cleanPreferences({ theme: "invalid" }), {});
});
test("F3.2: indices preserve editorial ordering and provide unique labelled selects", () => {
  const html = renderToStaticMarkup(
    <StaticRouter location="/">
      <ReaderIndex
        workId="public-work"
        chapters={chapters}
        currentChapter={chapters[1]}
      />
      <ReaderIndex
        workId="public-poetry"
        chapters={chapters}
        currentChapter={chapters[0]}
        poetry
      />
    </StaticRouter>,
  );
  assert.ok(html.includes("Índice de poemas"));
  assert.ok(html.includes("Índice de capítulos"));
  assert.ok(
    html.indexOf('value="public-one"') < html.indexOf('value="public-two"'),
  );
  const ids = [...html.matchAll(/<select id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, 2);
  for (const id of ids) assert.ok(html.includes(`for="${id}"`));
});
