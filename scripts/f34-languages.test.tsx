import test from "node:test";
import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import React from "react";

import {
  LANGUAGE_CATALOG,
  LEGACY_LANGUAGES,
  getAllLanguageNames,
  getPopularLanguages,
  searchLanguages,
  findLanguage,
  normalizeLanguageName,
  isRtlLanguage,
} from "../src/foundation/data/languages";

import { LanguageCombobox } from "../src/foundation/components/LanguageCombobox";

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

test("languages: catalog contains over 130 standardized contemporary and world languages", () => {
  assert.ok(
    LANGUAGE_CATALOG.length >= 130,
    `Catalog contains ${LANGUAGE_CATALOG.length} languages, expected >= 130`,
  );

  // Check code uniqueness (no duplicates)
  const seenCodes = new Set<string>();
  for (const lang of LANGUAGE_CATALOG) {
    const codeLower = lang.code.toLowerCase();
    assert.ok(
      !seenCodes.has(codeLower),
      `Duplicate ISO/BCP-47 code detected: ${lang.code}`,
    );
    seenCodes.add(codeLower);

    assert.ok(
      lang.name.trim().length > 0,
      "Language must have a Portuguese name",
    );
    assert.ok(
      lang.name.length <= 60,
      `Language name "${lang.name}" exceeds 60 characters database limit`,
    );
    assert.ok(
      lang.code.length >= 2 && lang.code.length <= 8,
      "Code must be valid BCP-47 / ISO",
    );
    assert.ok(
      [
        "África",
        "Américas",
        "Ásia",
        "Europa",
        "Oceânia",
        "Global",
        "Especial",
      ].includes(lang.region),
      `Invalid region for ${lang.name}: ${lang.region}`,
    );
  }
});

test("languages: strictly preserves all 4 legacy languages", () => {
  const allNames = getAllLanguageNames();
  for (const legacy of LEGACY_LANGUAGES) {
    assert.ok(
      allNames.includes(legacy),
      `Legacy language missing from catalog: ${legacy}`,
    );
    const found = findLanguage(legacy);
    assert.ok(found !== undefined, `findLanguage failed for legacy: ${legacy}`);
    assert.equal(found?.name, legacy);
  }
});

test("languages: comprehensive African languages representation", () => {
  // Mozambique
  const mozambiqueCodes = [
    "tsc",
    "vmw",
    "seh",
    "ndc",
    "ts",
    "cce",
    "bto",
    "ngl",
    "rng",
    "nyu",
    "chw",
    "yao",
    "xsm",
  ];
  for (const code of mozambiqueCodes) {
    const lang = findLanguage(code);
    assert.ok(lang, `Mozambican language missing: ${code}`);
    assert.equal(lang.region, "África");
  }

  // Angola & CPLP Africa
  const angolaAndCplpCodes = [
    "kmb",
    "umb",
    "kg",
    "cjk",
    "kua",
    "kea",
    "pov",
    "cri",
    "aoa",
    "pre",
  ];
  for (const code of angolaAndCplpCodes) {
    const lang = findLanguage(code);
    assert.ok(lang, `Angola/CPLP language missing: ${code}`);
    assert.equal(lang.region, "África");
  }

  // Continental Africa
  const continentalCodes = [
    "sw",
    "yo",
    "ha",
    "ig",
    "am",
    "om",
    "so",
    "ln",
    "zu",
    "xh",
    "rw",
    "rn",
    "wo",
    "ff",
  ];
  for (const code of continentalCodes) {
    const lang = findLanguage(code);
    assert.ok(lang, `Continental African language missing: ${code}`);
    assert.equal(lang.region, "África");
  }
});

test("languages: indigenous Americas, Asia, Europe, Oceania and special codes are covered", () => {
  // Indigenous Americas
  const americas = ["gn", "qu", "ay", "yrl", "arn", "nah", "yua", "ht", "pap"];
  for (const code of americas) {
    assert.ok(findLanguage(code), `Americas language missing: ${code}`);
  }

  // Asia & Oceania
  const asiaOceania = [
    "zh",
    "ja",
    "ko",
    "vi",
    "hi",
    "bn",
    "ta",
    "mi",
    "haw",
    "tet",
  ];
  for (const code of asiaOceania) {
    assert.ok(findLanguage(code), `Asia/Oceania language missing: ${code}`);
  }

  // Special codes
  const special = ["mul", "zxx", "eo", "la", "sa"];
  for (const code of special) {
    assert.ok(findLanguage(code), `Special language/code missing: ${code}`);
  }
});

test("languages: RTL (right-to-left) direction detection", () => {
  const rtlCodes = [
    "ar",
    "fa",
    "ur",
    "he",
    "ckb",
    "ps",
    "ug",
    "yi",
    "sd",
    "dv",
  ];
  for (const code of rtlCodes) {
    const lang = findLanguage(code);
    assert.ok(lang, `RTL language missing: ${code}`);
    assert.equal(lang.direction, "rtl", `Expected RTL for code: ${code}`);
    assert.equal(
      isRtlLanguage(code),
      true,
      `isRtlLanguage should be true for ${code}`,
    );
    assert.equal(
      isRtlLanguage(lang.name),
      true,
      `isRtlLanguage should be true for name ${lang.name}`,
    );
  }

  // LTR languages must return false
  assert.equal(isRtlLanguage("pt"), false);
  assert.equal(isRtlLanguage("Português"), false);
  assert.equal(isRtlLanguage("en"), false);
  assert.equal(isRtlLanguage("ja"), false);
});

test("languages: searchLanguages handles accent-insensitive, native and code matches", () => {
  // Accent tolerance: "arabe" matches "Árabe"
  const arabeResults = searchLanguages("arabe");
  assert.ok(arabeResults.some((l) => l.name === "Árabe"));

  // Accent tolerance: "ioruba" matches "Iorubá"
  const iorubaResults = searchLanguages("ioruba");
  assert.ok(iorubaResults.some((l) => l.name.includes("Iorubá")));

  // Code priority search: "pt" returns Português first
  const ptResults = searchLanguages("pt");
  assert.equal(ptResults[0].code, "pt");

  // Code search: "tsc" finds Changana
  const tscResults = searchLanguages("tsc");
  assert.ok(tscResults.some((l) => l.code === "tsc"));

  // Native name search: "nihongo" finds Japonês
  const nihongoResults = searchLanguages("nihongo");
  assert.ok(nihongoResults.some((l) => l.code === "ja"));

  // Native name search: "deutsch" finds Alemão
  const deutschResults = searchLanguages("deutsch");
  assert.ok(deutschResults.some((l) => l.code === "de"));
});

test("languages: getPopularLanguages and normalizeLanguageName", () => {
  const popular = getPopularLanguages();
  assert.ok(popular.length >= 10, "Should have at least 10 popular languages");
  assert.ok(popular.some((l) => l.code === "pt"));
  assert.ok(popular.some((l) => l.code === "es"));
  assert.ok(popular.some((l) => l.code === "en"));
  assert.ok(popular.some((l) => l.code === "tsc"));

  // Normalization
  assert.equal(normalizeLanguageName("Português"), "Português");
  assert.equal(normalizeLanguageName("pt"), "Português");
  assert.equal(normalizeLanguageName("ar"), "Árabe");
  assert.equal(normalizeLanguageName("ja"), "Japonês");
  assert.equal(normalizeLanguageName(""), "Português");
});

test("LanguageCombobox: renders accessible combobox and controls", async () => {
  const html = await renderComponent(
    <LanguageCombobox
      value="Português"
      onChange={() => {}}
      label="Idioma Principal"
      helperText="Selecione o idioma original em que a obra foi redigida."
    />,
  );

  assert.ok(html.includes('role="combobox"'), "Must have combobox role");
  assert.ok(html.includes("Idioma Principal"), "Must display custom label");
  assert.ok(html.includes("Português"), "Must reflect current value");
  assert.ok(html.includes('aria-expanded="false"'), "Must start closed");
  assert.ok(
    html.includes("Selecione o idioma original"),
    "Must display helper text",
  );
});

test("LanguageCombobox: displays RTL badge when selected language is RTL", async () => {
  const html = await renderComponent(
    <LanguageCombobox value="Árabe" onChange={() => {}} label="Idioma" />,
  );

  assert.ok(
    html.includes("Escrita RTL ⇄"),
    "Must indicate RTL writing direction",
  );
});
