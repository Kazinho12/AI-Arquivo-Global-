import test from "node:test";
import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import React from "react";

import {
  COVER_STYLES,
  EDITORIAL_COVER_PALETTE,
  coverStyleDefinitions,
  isValidHexColor,
  normalizeHexColor,
  getRelativeLuminance,
  getCoverContrastTheme,
  getCoverThemeColors,
} from "../src/foundation/data/covers";

import {
  LEGACY_GENRES,
  GENRE_CATALOG,
  getAllGenres,
  getGenresForFormat,
  isKnownGenre,
} from "../src/foundation/data/genres";

import {
  LEGACY_LANGUAGES,
  LANGUAGE_CATALOG,
  getAllLanguageNames,
  findLanguage,
  normalizeLanguageName,
} from "../src/foundation/data/languages";

import { WorkCover } from "../src/foundation/components/WorkCover";

function renderComponent(element: React.ReactElement): Promise<string> {
  return new Promise((resolve, reject) => {
    let html = "";
    const stream = new PassThrough();
    stream.on("data", (chunk) => {
      html += chunk.toString("utf8");
    });
    stream.on("end", () => resolve(html));
    stream.on("error", reject);

    const { pipe } = renderToPipeableStream(element, {
      onAllReady() {
        pipe(stream);
      },
      onError(err) {
        reject(err);
      },
    });
  });
}

test("covers: palette has at least 24 unique valid colors across diverse tones", () => {
  assert.ok(
    EDITORIAL_COVER_PALETTE.length >= 24,
    `Palette has ${EDITORIAL_COVER_PALETTE.length} colors, expected >= 24`,
  );
  const seenHex = new Set<string>();
  for (const color of EDITORIAL_COVER_PALETTE) {
    assert.ok(
      isValidHexColor(color.hex),
      `Color ${color.name} has invalid hex: ${color.hex}`,
    );
    assert.ok(
      !seenHex.has(color.hex.toUpperCase()),
      `Duplicate hex detected: ${color.hex}`,
    );
    seenHex.add(color.hex.toUpperCase());
    assert.ok(color.name.length > 0, "Color must have a descriptive name");
  }

  // Ensure both dark and light colors are present in the palette
  const lightColors = EDITORIAL_COVER_PALETTE.filter(
    (c) => getCoverContrastTheme(c.hex) === "light",
  );
  const darkColors = EDITORIAL_COVER_PALETTE.filter(
    (c) => getCoverContrastTheme(c.hex) === "dark",
  );
  assert.ok(lightColors.length >= 3, "Palette must include light colors");
  assert.ok(darkColors.length >= 10, "Palette must include dark colors");
});

test("covers: hex color validation and normalization", () => {
  assert.equal(isValidHexColor("#14243B"), true);
  assert.equal(isValidHexColor("#ffffff"), true);
  assert.equal(isValidHexColor("#000000"), true);
  assert.equal(isValidHexColor("#ABCDEF"), true);

  assert.equal(isValidHexColor(""), false);
  assert.equal(isValidHexColor("14243B"), false);
  assert.equal(isValidHexColor("#14243"), false);
  assert.equal(isValidHexColor("#14243B99"), false);
  assert.equal(isValidHexColor("#ZZZZZZ"), false);
  assert.equal(isValidHexColor("rgb(0,0,0)"), false);

  assert.equal(normalizeHexColor(" #14243b "), "#14243B");
  assert.equal(normalizeHexColor("invalid", "#0F172A"), "#0F172A");
});

test("covers: luminance and WCAG AA contrast calculations", () => {
  const whiteLum = getRelativeLuminance("#FFFFFF");
  const blackLum = getRelativeLuminance("#000000");
  assert.ok(whiteLum > 0.95, "White should have luminance ~ 1.0");
  assert.ok(blackLum < 0.05, "Black should have luminance ~ 0.0");

  // Light colors should be classified as light theme (demanding dark text)
  assert.equal(getCoverContrastTheme("#F5F2EB"), "light");
  assert.equal(getCoverContrastTheme("#FFFFFF"), "light");
  assert.equal(getCoverContrastTheme("#FBBF24"), "light");

  // Dark colors should be classified as dark theme (demanding light text)
  assert.equal(getCoverContrastTheme("#14243B"), "dark");
  assert.equal(getCoverContrastTheme("#0F172A"), "dark");
  assert.equal(getCoverContrastTheme("#064E3B"), "dark");

  const lightTheme = getCoverThemeColors("#F5F2EB");
  assert.equal(lightTheme.isLightBg, true);
  assert.equal(lightTheme.textPrimary, "#0F172A");

  const darkTheme = getCoverThemeColors("#14243B");
  assert.equal(darkTheme.isLightBg, false);
  assert.equal(darkTheme.textPrimary, "#F8FAFC");
});

test("covers: all 5 cover styles and definitions are registered", () => {
  const expectedStyles = [
    "minimalist",
    "geometric",
    "lyric",
    "bold",
    "monolith",
  ] as const;

  for (const style of expectedStyles) {
    assert.ok(COVER_STYLES.includes(style), `Missing style: ${style}`);
    assert.ok(
      coverStyleDefinitions[style] !== undefined,
      `Missing definition for ${style}`,
    );
    assert.ok(coverStyleDefinitions[style].label.length > 0);
  }
  assert.ok(coverStyleDefinitions["legacy"] !== undefined);
});

test("genres: preserves all 7 legacy genres with exact names", () => {
  const all = getAllGenres();
  for (const legacy of LEGACY_GENRES) {
    assert.ok(
      all.includes(legacy),
      `Legacy genre missing from catalog: ${legacy}`,
    );
    assert.ok(
      isKnownGenre(legacy),
      `Legacy genre must be recognized: ${legacy}`,
    );
  }
});

test("genres: format-specific recommendations are tailored without losing all options", () => {
  const poetryGenres = getGenresForFormat("Poesia");
  assert.ok(
    poetryGenres.recommended.some((g) => g.toLowerCase().includes("poesia")),
    "Poetry recommendations should include poetic genres",
  );
  assert.ok(
    poetryGenres.all.length >= LEGACY_GENRES.length,
    "All genres must remain available",
  );

  const mangaGenres = getGenresForFormat("Mangá");
  assert.ok(
    mangaGenres.recommended.some((g) =>
      ["shonen", "seinen", "visual", "fantasia", "ação"].some((k) =>
        g.toLowerCase().includes(k),
      ),
    ),
    "Manga recommendations should include visual/manga genres",
  );

  const romanceGenres = getGenresForFormat("Romance");
  assert.ok(romanceGenres.recommended.length > 0);
});

test("languages: preserves all 4 legacy languages and includes African languages", () => {
  const allNames = getAllLanguageNames();
  for (const legacy of LEGACY_LANGUAGES) {
    assert.ok(allNames.includes(legacy), `Legacy language missing: ${legacy}`);
    assert.ok(findLanguage(legacy) !== undefined);
  }

  // African languages presence check
  const africanCodes = [
    "tsc",
    "vmw",
    "seh",
    "kmb",
    "umb",
    "kea",
    "cri",
    "sw",
    "yo",
  ];
  for (const code of africanCodes) {
    const lang = findLanguage(code);
    assert.ok(lang !== undefined, `African language code missing: ${code}`);
    assert.ok(lang.name.length > 0);
    assert.ok(allNames.includes(lang.name));
  }

  // Normalization checks
  assert.equal(normalizeLanguageName("Português"), "Português");
  assert.equal(normalizeLanguageName("pt"), "Português");
  assert.equal(normalizeLanguageName("tsc"), "Changana (Xichangana)");
  assert.equal(normalizeLanguageName("Desconhecido"), "Desconhecido");
});

test("WorkCover: renders correctly for all 5 styles and legacy fallback", async () => {
  const styles = [
    "minimalist",
    "geometric",
    "lyric",
    "bold",
    "monolith",
    "legacy",
  ] as const;

  for (const style of styles) {
    const html = await renderComponent(
      <WorkCover
        title="O Canto das Marés"
        author="Mia Couto"
        subtitle="Crónicas do Índico"
        color="#14243B"
        style={style}
        format="Romance"
      />,
    );

    assert.ok(
      html.includes("O Canto das Marés"),
      `Title missing in style ${style}`,
    );
    assert.ok(html.includes("Mia Couto"), `Author missing in style ${style}`);
    assert.ok(
      html.includes("Crónicas do Índico"),
      `Subtitle missing in style ${style}`,
    );
    assert.ok(html.includes("<svg"), `SVG missing in style ${style}`);
    assert.ok(
      html.includes("AG · Romance"),
      `Format tag missing in style ${style}`,
    );
  }
});

test("WorkCover: handles long titles and accessible light color contrast", async () => {
  const longTitle =
    "Memórias Póstumas e Intermináveis de um Explorador dos Espaços Siderais e das Terras Altas";
  const htmlLight = await renderComponent(
    <WorkCover
      title={longTitle}
      author="Escritor Prolífico"
      color="#F5F2EB" // Light cream
      style="minimalist"
    />,
  );

  assert.ok(htmlLight.includes(longTitle));
  // Background is light, so textPrimary should be dark (#0F172A)
  assert.ok(htmlLight.includes("#0F172A"));

  const htmlDark = await renderComponent(
    <WorkCover
      title="A Sombra"
      author="Autor Misterioso"
      color="#0F172A" // Deep dark
      style="bold"
    />,
  );
  assert.ok(htmlDark.includes("A Sombra"));
  // Background is dark, so textPrimary should be light (#F8FAFC)
  assert.ok(htmlDark.includes("#F8FAFC"));
});
