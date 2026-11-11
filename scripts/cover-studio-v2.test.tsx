import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import {
  WorkCover,
  coverComposition,
} from "../src/foundation/components/WorkCover";
import { LegacyWorkCover } from "../src/foundation/components/LegacyWorkCover";
import { CoverStudioGallery } from "../src/foundation/components/CoverStudioGallery";
import {
  COVER_STYLES,
  coverStyleDefinitions,
  EDITORIAL_COVER_PALETTE,
  getCoverThemeColors,
  getContrastRatio,
  isCoverSeed,
  nextCoverSeed,
} from "../src/foundation/data/covers";
const render = (style: any, seed = 0, color = "#14243B") =>
  renderToStaticMarkup(
    <WorkCover
      style={style}
      seed={seed}
      color={color}
      title="Uma história de encontros"
      author="Autora"
      subtitle="Subtítulo"
    />,
  );
test("Cover Studio V2: all 32 modern styles and legacy have five structural compositions, deterministic rendering and distinct artwork", () => {
  assert.equal(COVER_STYLES.length, 32);
  const artworks = new Set<string>();
  for (const style of [...COVER_STYLES, "legacy"] as const) {
    const compositions = new Set<string>();
    for (let seed = 0; seed < 5; seed++) {
      const html = render(style, seed);
      assert.equal(html, render(style, seed));
      assert.equal(coverComposition(style, seed).variant, seed);
      // Compare the actual art + typography layout, not data attributes alone.
      compositions.add(html.replace(/data-cover-[^=]+="[^"]*"/g, ""));
      assert.ok(html.includes("Uma história de encontros"));
    }
    assert.equal(compositions.size, 5, style);
    artworks.add(render(style).match(/<svg[\s\S]*?<\/svg>/)![0]);
  }
  assert.equal(artworks.size, 33);
  assert.equal(nextCoverSeed(2147483647), 0);
  for (const value of [-1, 1.5, 2147483648, "5", null, NaN])
    assert.equal(isCoverSeed(value), false);
});
test("Cover Studio V2: opaque AA text on all palette/custom colors, long titles, legacy seed-zero compatibility", () => {
  for (const color of [
    ...EDITORIAL_COVER_PALETTE.map((c) => c.hex),
    "#FFFFFF",
    "#000000",
    "#808080",
  ]) {
    const theme = getCoverThemeColors(color);
    for (const text of [
      theme.textPrimary,
      theme.textSecondary,
      theme.textMuted,
    ])
      assert.ok(getContrastRatio(color, text) >= 4.5);
    for (const style of COVER_STYLES)
      assert.ok(render(style, 0, color).includes(`background-color:${color}`));
  }
  const props = {
    title: "Título ".repeat(30),
    author: "Autora",
    style: "legacy" as const,
  };
  assert.equal(
    renderToStaticMarkup(<WorkCover {...props} seed={0} />),
    renderToStaticMarkup(<LegacyWorkCover {...props} />),
  );
  assert.ok(
    renderToStaticMarkup(
      <WorkCover {...props} style="bold" seed={4} />,
    ).includes(props.title),
  );
});
test("Cover Studio V2: gallery renders current metadata in 33 thumbnails with explicit selection/variation controls", () => {
  const html = renderToStaticMarkup(
    <CoverStudioGallery
      title="A minha obra"
      author="Autora atual"
      color="#14243B"
      format="Conto"
      style="arcane"
      seed={3}
      onStyle={() => {}}
      onSeed={() => {}}
    />,
  );
  assert.equal((html.match(/data-cover-style=/g) ?? []).length, 33);
  assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1);
  assert.ok(html.includes("Gerar outra variação"));
  assert.ok(html.includes("Autora atual"));
  for (const style of [...COVER_STYLES, "legacy"] as const)
    assert.ok(html.includes(coverStyleDefinitions[style].label));
});
test("Cover Studio V2: migration retains full RPC logic and signatures, only adds seed transport", () => {
  const prior = readFileSync(
    "supabase/migrations/20261111040000_persist_cover_styles.sql",
    "utf8",
  );
  const current = readFileSync(
    "supabase/migrations/20261111050000_cover_studio_v2.sql",
    "utf8",
  );
  for (const name of [
    "mutate_private_work",
    "publish_private_work",
    "read_public_work",
    "search_public_works",
  ]) {
    const extract = (source: string) =>
      source.match(
        new RegExp(
          "CREATE OR REPLACE FUNCTION public\\." +
            name +
            "\\([\\s\\S]*?\\n\\$\\$;",
        ),
      )![0];
    const restored = extract(current)
      .replaceAll("cover_seed=EXCLUDED.cover_seed,", "")
      .replaceAll("'cover_seed',p.cover_seed,", "")
      .replaceAll(",source.cover_seed", "")
      .replaceAll(",p.cover_seed", "")
      .replaceAll(",cover_seed", "");
    assert.equal(restored, extract(prior), name);
  }
  assert.ok(current.trim().startsWith("--"));
  assert.ok(current.trim().endsWith("COMMIT;"));
});
