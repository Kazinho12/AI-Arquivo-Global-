export const ORIGINAL_COVER_STYLES = [
  "minimalist",
  "geometric",
  "lyric",
  "bold",
  "monolith",
] as const;
export const COVER_STYLES = [
  "minimalist",
  "geometric",
  "lyric",
  "bold",
  "monolith",
  "classic",
  "cyberpunk",
  "ethereal",
  "noir",
  "collage",
  "botanical",
  "manga",
  "surrealist",
  "gothic",
  "retro",
  "illustrated_romance",
  "painterly",
  "experimental_type",
  "cinematic",
  "conceptual",
  "celestial_luxury",
  "dark_academia",
  "mystic_tarot",
  "arcane",
  "swiss_editorial",
  "holographic",
  "sumi_e",
  "risograph",
  "bl_romance",
  "fairytale",
  "symbolic_romance",
  "webtoon_pop",
] as const;
export type CoverStyle = (typeof COVER_STYLES)[number] | "legacy";
export function isOriginalCoverStyle(value: unknown): boolean {
  return value === "legacy" || ORIGINAL_COVER_STYLES.some((s) => s === value);
}
export function isCoverStyle(value: unknown): value is CoverStyle {
  return value === "legacy" || COVER_STYLES.some((s) => s === value);
}
export function readCoverStyle(value: unknown): CoverStyle {
  return isCoverStyle(value) ? value : "legacy";
}
export function isCoverSeed(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 2147483647
  );
}
export function readCoverSeed(value: unknown): number {
  return isCoverSeed(value) ? value : 0;
}
export function nextCoverSeed(seed: number): number {
  return (readCoverSeed(seed) + 1) % 2147483648;
}
export interface CoverStyleDefinition {
  id: CoverStyle;
  label: string;
  description: string;
}
export const coverStyleDefinitions: Record<CoverStyle, CoverStyleDefinition> = {
  minimalist: {
    id: "minimalist",
    label: "Minimalista",
    description:
      "Composição minimalista com cinco estruturas e arte vetorial própria.",
  },
  geometric: {
    id: "geometric",
    label: "Geométrico",
    description:
      "Composição geométrico com cinco estruturas e arte vetorial própria.",
  },
  lyric: {
    id: "lyric",
    label: "Lírico",
    description:
      "Composição lírico com cinco estruturas e arte vetorial própria.",
  },
  bold: {
    id: "bold",
    label: "Impacto",
    description:
      "Composição impacto com cinco estruturas e arte vetorial própria.",
  },
  monolith: {
    id: "monolith",
    label: "Monolítico",
    description:
      "Composição monolítico com cinco estruturas e arte vetorial própria.",
  },
  classic: {
    id: "classic",
    label: "Clássico",
    description:
      "Composição clássico com cinco estruturas e arte vetorial própria.",
  },
  cyberpunk: {
    id: "cyberpunk",
    label: "Cyberpunk",
    description:
      "Composição cyberpunk com cinco estruturas e arte vetorial própria.",
  },
  ethereal: {
    id: "ethereal",
    label: "Etéreo",
    description:
      "Composição etéreo com cinco estruturas e arte vetorial própria.",
  },
  noir: {
    id: "noir",
    label: "Noir",
    description:
      "Composição noir com cinco estruturas e arte vetorial própria.",
  },
  collage: {
    id: "collage",
    label: "Colagem",
    description:
      "Composição colagem com cinco estruturas e arte vetorial própria.",
  },
  botanical: {
    id: "botanical",
    label: "Botânico",
    description:
      "Composição botânico com cinco estruturas e arte vetorial própria.",
  },
  manga: {
    id: "manga",
    label: "Mangá Gráfico",
    description:
      "Composição mangá gráfico com cinco estruturas e arte vetorial própria.",
  },
  surrealist: {
    id: "surrealist",
    label: "Surrealista",
    description:
      "Composição surrealista com cinco estruturas e arte vetorial própria.",
  },
  gothic: {
    id: "gothic",
    label: "Gótico",
    description:
      "Composição gótico com cinco estruturas e arte vetorial própria.",
  },
  retro: {
    id: "retro",
    label: "Retrô",
    description:
      "Composição retrô com cinco estruturas e arte vetorial própria.",
  },
  illustrated_romance: {
    id: "illustrated_romance",
    label: "Romance Ilustrado",
    description:
      "Composição romance ilustrado com cinco estruturas e arte vetorial própria.",
  },
  painterly: {
    id: "painterly",
    label: "Pictórico",
    description:
      "Composição pictórico com cinco estruturas e arte vetorial própria.",
  },
  experimental_type: {
    id: "experimental_type",
    label: "Tipográfico Experimental",
    description:
      "Composição tipográfico experimental com cinco estruturas e arte vetorial própria.",
  },
  cinematic: {
    id: "cinematic",
    label: "Cinematográfico",
    description:
      "Composição cinematográfico com cinco estruturas e arte vetorial própria.",
  },
  conceptual: {
    id: "conceptual",
    label: "Conceitual",
    description:
      "Composição conceitual com cinco estruturas e arte vetorial própria.",
  },
  celestial_luxury: {
    id: "celestial_luxury",
    label: "Celestial Luxuoso",
    description:
      "Composição celestial luxuoso com cinco estruturas e arte vetorial própria.",
  },
  dark_academia: {
    id: "dark_academia",
    label: "Dark Academia",
    description:
      "Composição dark academia com cinco estruturas e arte vetorial própria.",
  },
  mystic_tarot: {
    id: "mystic_tarot",
    label: "Tarot Místico",
    description:
      "Composição tarot místico com cinco estruturas e arte vetorial própria.",
  },
  arcane: {
    id: "arcane",
    label: "Arcano",
    description:
      "Composição arcano com cinco estruturas e arte vetorial própria.",
  },
  swiss_editorial: {
    id: "swiss_editorial",
    label: "Editorial Suíço",
    description:
      "Composição editorial suíço com cinco estruturas e arte vetorial própria.",
  },
  holographic: {
    id: "holographic",
    label: "Holográfico",
    description:
      "Composição holográfico com cinco estruturas e arte vetorial própria.",
  },
  sumi_e: {
    id: "sumi_e",
    label: "Sumi-e",
    description:
      "Composição sumi-e com cinco estruturas e arte vetorial própria.",
  },
  risograph: {
    id: "risograph",
    label: "Risografia",
    description:
      "Composição risografia com cinco estruturas e arte vetorial própria.",
  },
  bl_romance: {
    id: "bl_romance",
    label: "BL Romântico",
    description:
      "Composição bl romântico com cinco estruturas e arte vetorial própria.",
  },
  fairytale: {
    id: "fairytale",
    label: "Conto de Fadas",
    description:
      "Composição conto de fadas com cinco estruturas e arte vetorial própria.",
  },
  symbolic_romance: {
    id: "symbolic_romance",
    label: "Romance Simbólico",
    description:
      "Composição romance simbólico com cinco estruturas e arte vetorial própria.",
  },
  webtoon_pop: {
    id: "webtoon_pop",
    label: "Webtoon Pop",
    description:
      "Composição webtoon pop com cinco estruturas e arte vetorial própria.",
  },
  legacy: {
    id: "legacy",
    label: "Legado",
    description:
      "Composição original do Arquivo Global, preservada para compatibilidade.",
  },
};

export interface CoverColorOption {
  id: string;
  name: string;
  hex: string;
  group:
    | "profundezas"
    | "terras"
    | "florestas"
    | "rubis"
    | "oceanos"
    | "sol-areia";
  isLight?: boolean;
}

/** Paleta editorial ampliada com 28 cores equilibradas (escuras, médias e claras). */
export const EDITORIAL_COVER_PALETTE: CoverColorOption[] = [
  // Profundezas & Noturnos
  {
    id: "marinho-profundo",
    name: "Azul Arquivo",
    hex: "#14243B",
    group: "profundezas",
  },
  {
    id: "noite-fechada",
    name: "Noite Fechada",
    hex: "#0F172A",
    group: "profundezas",
  },
  {
    id: "carvao-fumado",
    name: "Carvão Fumado",
    hex: "#1E293B",
    group: "profundezas",
  },
  {
    id: "grafite-puro",
    name: "Grafite Mineral",
    hex: "#27272A",
    group: "profundezas",
  },
  {
    id: "asfalto-urbano",
    name: "Asfalto Urbano",
    hex: "#334155",
    group: "profundezas",
  },

  // Terras, Argilas & Ocres
  {
    id: "terracota-viva",
    name: "Terracota Quente",
    hex: "#9A3412",
    group: "terras",
  },
  {
    id: "argila-seca",
    name: "Argila Queimada",
    hex: "#7C2D12",
    group: "terras",
  },
  {
    id: "siena-tostada",
    name: "Siena Natural",
    hex: "#854D0E",
    group: "terras",
  },
  { id: "ocre-solar", name: "Ocre Dourado", hex: "#A16207", group: "terras" },
  {
    id: "areia-quente",
    name: "Areia do Deserto",
    hex: "#D97706",
    group: "terras",
    isLight: true,
  },

  // Florestas & Minerais
  {
    id: "verde-esmeralda",
    name: "Esmeralda Noturna",
    hex: "#064E3B",
    group: "florestas",
  },
  {
    id: "musgo-florestal",
    name: "Musgo Antigo",
    hex: "#14532D",
    group: "florestas",
  },
  {
    id: "cipreste-silencioso",
    name: "Cipreste Fundo",
    hex: "#065F46",
    group: "florestas",
  },
  {
    id: "oliva-profunda",
    name: "Oliva Madura",
    hex: "#3F6212",
    group: "florestas",
  },
  {
    id: "eucalipto-cinza",
    name: "Eucalipto Cinzento",
    hex: "#475569",
    group: "florestas",
  },

  // Rubis, Vinhos & Púrpuras
  { id: "vinho-tinto", name: "Vinho Tinto", hex: "#581C87", group: "rubis" },
  {
    id: "borgonha-veludo",
    name: "Borgonha Veludo",
    hex: "#701A75",
    group: "rubis",
  },
  {
    id: "rubi-queimado",
    name: "Rubi Vulcânico",
    hex: "#831843",
    group: "rubis",
  },
  {
    id: "framboesa-escura",
    name: "Framboesa Escura",
    hex: "#9F1239",
    group: "rubis",
  },
  {
    id: "ameixa-mistica",
    name: "Ameixa Mística",
    hex: "#4C1D95",
    group: "rubis",
  },

  // Oceanos, Céus & Índigos
  {
    id: "oceano-abissal",
    name: "Oceano Abissal",
    hex: "#0E2A47",
    group: "oceanos",
  },
  {
    id: "cobalto-marinho",
    name: "Cobalto Vivo",
    hex: "#1D4ED8",
    group: "oceanos",
  },
  { id: "anil-antigo", name: "Anil Poético", hex: "#3730A3", group: "oceanos" },
  {
    id: "petroleo-espesso",
    name: "Petróleo Suave",
    hex: "#155E75",
    group: "oceanos",
  },
  {
    id: "turquesa-profunda",
    name: "Turquesa Nórdica",
    hex: "#0F766E",
    group: "oceanos",
  },

  // Sol, Areias & Tons Claros Editoriais
  {
    id: "marfim-pergaminho",
    name: "Marfim Pergaminho",
    hex: "#F5F2EB",
    group: "sol-areia",
    isLight: true,
  },
  {
    id: "linho-cru",
    name: "Linho Cru",
    hex: "#E7E2D5",
    group: "sol-areia",
    isLight: true,
  },
  {
    id: "ambar-suave",
    name: "Âmbar Claro",
    hex: "#FBBF24",
    group: "sol-areia",
    isLight: true,
  },
];

/** Valida se a string é uma cor hexadecimal válida de 6 dígitos (#RRGGBB). */
export function isValidHexColor(hex: string): boolean {
  return typeof hex === "string" && /^#[0-9A-Fa-f]{6}$/.test(hex.trim());
}

/** Normaliza um código hexadecimal para letras maiúsculas e remove espaços. */
export function normalizeHexColor(hex: string, fallback = "#14243B"): string {
  if (!isValidHexColor(hex)) return fallback;
  return hex.trim().toUpperCase();
}

/**
 * Calcula a luminância relativa (0 a 1) segundo a especificação WCAG 2.1.
 */
export function getRelativeLuminance(hex: string): number {
  if (!isValidHexColor(hex)) return 0.1;
  const clean = hex.trim().replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** Actual WCAG contrast ratio for two opaque sRGB colours. */
export function getContrastRatio(a: string, b: string): number {
  const first = getRelativeLuminance(normalizeHexColor(a));
  const second = getRelativeLuminance(normalizeHexColor(b));
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
function primaryText(background: string) {
  const candidates = ["#0F172A", "#F8FAFC"];
  const best = candidates.sort(
    (a, b) => getContrastRatio(background, b) - getContrastRatio(background, a),
  )[0];
  if (getContrastRatio(background, best) >= 4.5) return best;
  // Black/white guarantees at least 4.5 for every opaque sRGB background.
  return getContrastRatio(background, "#000000") >=
    getContrastRatio(background, "#FFFFFF")
    ? "#000000"
    : "#FFFFFF";
}
export function getCoverContrastTheme(hex: string): "dark" | "light" {
  const text = primaryText(normalizeHexColor(hex));
  return text === "#0F172A" || text === "#000000" ? "light" : "dark";
}
export function getCoverThemeColors(bgHex: string) {
  const background = normalizeHexColor(bgHex);
  const textPrimary = primaryText(background);
  const isLightBg = getCoverContrastTheme(background) === "light";
  const accessible = (preferred: string) =>
    getContrastRatio(background, preferred) >= 4.5 ? preferred : textPrimary;
  return {
    isLightBg,
    textPrimary,
    textSecondary: accessible(isLightBg ? "#334155" : "#E2E8F0"),
    textMuted: accessible(isLightBg ? "#64748B" : "#94A3B8"),
    accentGlow: isLightBg
      ? "rgba(15, 23, 42, 0.08)"
      : "rgba(255, 255, 255, 0.12)",
    frameBorder: isLightBg
      ? "rgba(15, 23, 42, 0.2)"
      : "rgba(255, 255, 255, 0.25)",
    shadowColor: isLightBg ? "rgba(0, 0, 0, 0.15)" : "rgba(0, 0, 0, 0.5)",
  };
}
