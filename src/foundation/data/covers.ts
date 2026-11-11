export const COVER_STYLES = [
  "minimalist",
  "geometric",
  "lyric",
  "bold",
  "monolith",
] as const;

export type CoverStyle = (typeof COVER_STYLES)[number] | "legacy";

export interface CoverStyleDefinition {
  id: CoverStyle;
  label: string;
  description: string;
}

export const coverStyleDefinitions: Record<CoverStyle, CoverStyleDefinition> = {
  minimalist: {
    id: "minimalist",
    label: "Minimalista Editorial",
    description: "Tipografia requintada com moldura fina, capitular e respiro editorial.",
  },
  geometric: {
    id: "geometric",
    label: "Geométrico Abstrato",
    description: "Círculos e eixos vetoriais matemáticos sobrepostos em camadas de luz.",
  },
  lyric: {
    id: "lyric",
    label: "Lírico & Orgânico",
    description: "Arcos suaves, ondas fluidas e gradientes etéreos para poesia e narrativa intimista.",
  },
  bold: {
    id: "bold",
    label: "Impacto & Cartaz",
    description: "Blocos de contraste expressivo, tipografia de grande presença e selo moderno.",
  },
  monolith: {
    id: "monolith",
    label: "Monolítico Clássico",
    description: "Tarja central estruturada, divisão áurea e monograma do Arquivo Global.",
  },
  legacy: {
    id: "legacy",
    label: "Composição Clássica AG",
    description: "A composição original com arcos orbitais concêntricos e numeração de acervo.",
  },
};

export interface CoverColorOption {
  id: string;
  name: string;
  hex: string;
  group: "profundezas" | "terras" | "florestas" | "rubis" | "oceanos" | "sol-areia";
  isLight?: boolean;
}

/** Paleta editorial ampliada com 28 cores equilibradas (escuras, médias e claras). */
export const EDITORIAL_COVER_PALETTE: CoverColorOption[] = [
  // Profundezas & Noturnos
  { id: "marinho-profundo", name: "Azul Arquivo", hex: "#14243B", group: "profundezas" },
  { id: "noite-fechada", name: "Noite Fechada", hex: "#0F172A", group: "profundezas" },
  { id: "carvao-fumado", name: "Carvão Fumado", hex: "#1E293B", group: "profundezas" },
  { id: "grafite-puro", name: "Grafite Mineral", hex: "#27272A", group: "profundezas" },
  { id: "asfalto-urbano", name: "Asfalto Urbano", hex: "#334155", group: "profundezas" },

  // Terras, Argilas & Ocres
  { id: "terracota-viva", name: "Terracota Quente", hex: "#9A3412", group: "terras" },
  { id: "argila-seca", name: "Argila Queimada", hex: "#7C2D12", group: "terras" },
  { id: "siena-tostada", name: "Siena Natural", hex: "#854D0E", group: "terras" },
  { id: "ocre-solar", name: "Ocre Dourado", hex: "#A16207", group: "terras" },
  { id: "areia-quente", name: "Areia do Deserto", hex: "#D97706", group: "terras", isLight: true },

  // Florestas & Minerais
  { id: "verde-esmeralda", name: "Esmeralda Noturna", hex: "#064E3B", group: "florestas" },
  { id: "musgo-florestal", name: "Musgo Antigo", hex: "#14532D", group: "florestas" },
  { id: "cipreste-silencioso", name: "Cipreste Fundo", hex: "#065F46", group: "florestas" },
  { id: "oliva-profunda", name: "Oliva Madura", hex: "#3F6212", group: "florestas" },
  { id: "eucalipto-cinza", name: "Eucalipto Cinzento", hex: "#475569", group: "florestas" },

  // Rubis, Vinhos & Púrpuras
  { id: "vinho-tinto", name: "Vinho Tinto", hex: "#581C87", group: "rubis" },
  { id: "borgonha-veludo", name: "Borgonha Veludo", hex: "#701A75", group: "rubis" },
  { id: "rubi-queimado", name: "Rubi Vulcânico", hex: "#831843", group: "rubis" },
  { id: "framboesa-escura", name: "Framboesa Escura", hex: "#9F1239", group: "rubis" },
  { id: "ameixa-mistica", name: "Ameixa Mística", hex: "#4C1D95", group: "rubis" },

  // Oceanos, Céus & Índigos
  { id: "oceano-abissal", name: "Oceano Abissal", hex: "#0E2A47", group: "oceanos" },
  { id: "cobalto-marinho", name: "Cobalto Vivo", hex: "#1D4ED8", group: "oceanos" },
  { id: "anil-antigo", name: "Anil Poético", hex: "#3730A3", group: "oceanos" },
  { id: "petroleo-espesso", name: "Petróleo Suave", hex: "#155E75", group: "oceanos" },
  { id: "turquesa-profunda", name: "Turquesa Nórdica", hex: "#0F766E", group: "oceanos" },

  // Sol, Areias & Tons Claros Editoriais
  { id: "marfim-pergaminho", name: "Marfim Pergaminho", hex: "#F5F2EB", group: "sol-areia", isLight: true },
  { id: "linho-cru", name: "Linho Cru", hex: "#E7E2D5", group: "sol-areia", isLight: true },
  { id: "ambar-suave", name: "Âmbar Claro", hex: "#FBBF24", group: "sol-areia", isLight: true },
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
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Determina se o fundo exige texto claro ou escuro para contraste acessível (WCAG AA).
 * Luminância limiar = 0.38.
 */
export function getCoverContrastTheme(hex: string): "dark" | "light" {
  const lum = getRelativeLuminance(hex);
  return lum >= 0.38 ? "light" : "dark";
}

/**
 * Retorna as cores acessíveis de texto e elementos vetoriais para uma cor de capa.
 */
export function getCoverThemeColors(bgHex: string) {
  const isLightBg = getCoverContrastTheme(bgHex) === "light";
  return {
    isLightBg,
    textPrimary: isLightBg ? "#0F172A" : "#F8FAFC",
    textSecondary: isLightBg ? "#334155" : "#E2E8F0",
    textMuted: isLightBg ? "#64748B" : "#94A3B8",
    accentGlow: isLightBg ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.12)",
    frameBorder: isLightBg ? "rgba(15, 23, 42, 0.2)" : "rgba(255, 255, 255, 0.25)",
    shadowColor: isLightBg ? "rgba(0, 0, 0, 0.15)" : "rgba(0, 0, 0, 0.5)",
  };
}
