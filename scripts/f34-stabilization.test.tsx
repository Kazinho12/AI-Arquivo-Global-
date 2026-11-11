import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import {
  getContrastRatio,
  getCoverThemeColors,
  getCoverContrastTheme,
  getRelativeLuminance,
  EDITORIAL_COVER_PALETTE,
  COVER_STYLES,
} from "../src/foundation/data/covers";
import { WorkCover } from "../src/foundation/components/WorkCover";
import { getGenresForFormat } from "../src/foundation/data/genres";
// Independent WCAG calculation verifies the actual selected sRGB values.
function contrast(first: string, second: string) {
  const luminance = (hex: string) => {
    const components = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return (
      components[0] * 0.2126 + components[1] * 0.7152 + components[2] * 0.0722
    );
  };
  const a = luminance(first),
    b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
test("stabilization: all 28 palette colors and custom backgrounds meet 4.5 for every text tier", () => {
  const colors = [
    ...EDITORIAL_COVER_PALETTE.map((c) => c.hex),
    "#FFFFFF",
    "#000000",
    "#D97706",
    "#777777",
    "#808080",
    "#123ABC",
    "#FEF1A0",
  ];
  for (let v = 0; v < 256; v += 3)
    colors.push("#" + v.toString(16).padStart(2, "0").repeat(3));
  for (const background of colors) {
    const theme = getCoverThemeColors(background);
    for (const text of [
      theme.textPrimary,
      theme.textSecondary,
      theme.textMuted,
    ])
      assert.ok(contrast(background, text) >= 4.5, `${background}/${text}`);
  }
  assert.equal(getContrastRatio("#000000", "#FFFFFF"), 21);
  assert.equal(getRelativeLuminance(" #ffffff "), 1);
  assert.equal(getCoverContrastTheme("#D97706"), "light");
});
test("stabilization: each style keeps accessible opaque text layers for every palette color", () => {
  for (const style of [...COVER_STYLES, "legacy"] as const)
    for (const color of EDITORIAL_COVER_PALETTE) {
      const html = renderToStaticMarkup(
        <WorkCover
          title="Um título longo para verificar o texto normal na composição editorial"
          author="Autora"
          subtitle="Subtítulo"
          color={color.hex}
          style={style}
        />,
      );
      assert.ok(!/opacity-(?:75|80|85|90)\b/.test(html));
      assert.ok(html.includes(`background-color:${color.hex}`));
      const theme = getCoverThemeColors(color.hex);
      for (const value of [
        theme.textPrimary,
        theme.textSecondary,
        theme.textMuted,
      ])
        assert.ok(contrast(color.hex, value) >= 4.5);
    }
});
test("stabilization: initial genre belongs to the same recommended options presented in the wizard", () => {
  const genres = getGenresForFormat("Romance");
  assert.ok(genres.recommended.length);
  assert.ok(genres.all.includes(genres.recommended[0]));
});
