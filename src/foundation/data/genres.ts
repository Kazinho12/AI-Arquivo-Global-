import type { WorkFormat } from "./works";

/**
 * Catálogo canónico de géneros literários do Arquivo Global.
 * Distinções fundamentais da plataforma:
 * - Formato: modelo estrutural da obra (ex.: Romance, Conto, Poesia, Mangá).
 * - Género: convenção temática ou estética literária (ex.: Fantasia, Realismo Mágico, Cyberpunk).
 * - Tags: palavras-chave livres e indexadores temáticos (ex.: mar, luto, robôs).
 */

export interface GenreDefinition {
  id: string;
  name: string;
  description?: string;
  category:
    | "ficcao"
    | "poesia"
    | "especulativo"
    | "visual"
    | "drama"
    | "outros";
  recommendedFormats?: WorkFormat[];
}

/** Os 7 géneros originais preservados com integridade textual absoluta. */
export const LEGACY_GENRES = [
  "Ficção especulativa",
  "Ficção urbana",
  "Poesia contemporânea",
  "Fantasia",
  "Ficção científica",
  "Mistério / Enigma",
  "Realismo mágico",
] as const;

export const GENRE_CATALOG: GenreDefinition[] = [
  // 1. Géneros Clássicos e Originais
  {
    id: "ficcao-especulativa",
    name: "Ficção especulativa",
    category: "especulativo",
    description:
      "Narrativas que exploram realidades alternativas, futuros possíveis ou regras não canónicas do mundo.",
    recommendedFormats: ["Romance", "Conto", "Série literária", "HQ / Comic"],
  },
  {
    id: "ficcao-urbana",
    name: "Ficção urbana",
    category: "ficcao",
    description:
      "Histórias ambientadas no pulsar contemporâneo ou marginal das metrópoles.",
    recommendedFormats: ["Romance", "Conto", "HQ / Comic"],
  },
  {
    id: "poesia-contemporanea",
    name: "Poesia contemporânea",
    category: "poesia",
    description:
      "Versos livres, explorações da linguagem, do corpo e da vida contemporânea.",
    recommendedFormats: ["Poesia"],
  },
  {
    id: "fantasia",
    name: "Fantasia",
    category: "especulativo",
    description:
      "Mundos com magia, mitologias ancestrais ou sistemas fantásticos de poder.",
    recommendedFormats: [
      "Romance",
      "Conto",
      "Série literária",
      "HQ / Comic",
      "Mangá",
    ],
  },
  {
    id: "ficcao-cientifica",
    name: "Ficção científica",
    category: "especulativo",
    description:
      "Tecnologia, viagens espaciais, inteligência artificial, distopias e futuros humanos.",
    recommendedFormats: [
      "Romance",
      "Conto",
      "Série literária",
      "HQ / Comic",
      "Mangá",
    ],
  },
  {
    id: "misterio-enigma",
    name: "Mistério / Enigma",
    category: "drama",
    description:
      "Investigações, segredos, crimes insolúveis e quebra-cabeças narrativos.",
    recommendedFormats: ["Romance", "Conto", "HQ / Comic", "Mangá"],
  },
  {
    id: "realismo-magico",
    name: "Realismo mágico",
    category: "especulativo",
    description:
      "O extraordinário e o fantástico entrelaçados com a naturalidade do quotidiano.",
    recommendedFormats: ["Romance", "Conto"],
  },

  // 2. Expansão Literária & Narrativa (Romance, Conto, Séries)
  {
    id: "drama-psicologico",
    name: "Drama psicológico",
    category: "drama",
    description:
      "Foco profundo na psique, conflitos morais e relações humanas complexas.",
    recommendedFormats: ["Romance", "Conto"],
  },
  {
    id: "romance-historico",
    name: "Romance histórico",
    category: "ficcao",
    description:
      "Recriação rigorosa ou imaginada de períodos e contextos históricos.",
    recommendedFormats: ["Romance", "Série literária"],
  },
  {
    id: "terror-horror",
    name: "Terror / Horror",
    category: "especulativo",
    description: "Medo visceral, assombrações, horror psicológico ou cósmico.",
    recommendedFormats: ["Romance", "Conto", "HQ / Comic", "Mangá"],
  },
  {
    id: "suspense-thriller",
    name: "Suspense / Thriller",
    category: "drama",
    description: "Tensão contínua, perseguições e perigo iminente.",
    recommendedFormats: ["Romance", "Conto", "HQ / Comic"],
  },
  {
    id: "cronica",
    name: "Crónica / Fragmentos",
    category: "ficcao",
    description:
      "Impressões do quotidiano, memórias, ensaios breves e vinhetas poéticas.",
    recommendedFormats: ["Conto", "Poesia"],
  },
  {
    id: "afrofuturismo",
    name: "Afrofuturismo & Mitologia Africana",
    category: "especulativo",
    description:
      "Ficção científica e fantasia enraizadas nas cosmologias, memórias e futuros africanos.",
    recommendedFormats: ["Romance", "Conto", "HQ / Comic", "Mangá"],
  },
  {
    id: "distopia-posapocaliptico",
    name: "Distopia / Pós-apocalítico",
    category: "especulativo",
    description:
      "Sociedades opressivas, colapsos ecológicos e sobrevivência pós-catástrofe.",
    recommendedFormats: ["Romance", "HQ / Comic", "Mangá"],
  },

  // 3. Poesia Específica
  {
    id: "poesia-lirica",
    name: "Lírica & Intimista",
    category: "poesia",
    description:
      "Sentimento, afeto, melancolia, confissões e contemplação interior.",
    recommendedFormats: ["Poesia"],
  },
  {
    id: "poesia-epica-filosofica",
    name: "Poesia Épica & Filosófica",
    category: "poesia",
    description: "Grandes odes, reflexões existenciais e cosmogonias em verso.",
    recommendedFormats: ["Poesia"],
  },
  {
    id: "poesia-visual-haiku",
    name: "Haiku & Formas Concisas",
    category: "poesia",
    description:
      "Poemas breves de métrica rigorosa, contemplação da natureza e do instante.",
    recommendedFormats: ["Poesia"],
  },

  // 4. HQ, Banda Desenhada & Mangá
  {
    id: "shonen-acao",
    name: "Ação & Aventura (Shonen)",
    category: "visual",
    description:
      "Jornadas heróicas, superação, batalhas épicas e laços de amizade.",
    recommendedFormats: ["Mangá", "HQ / Comic"],
  },
  {
    id: "seinen-maduro",
    name: "Seinen / Narrativa Madura",
    category: "visual",
    description:
      "Enredos profundos de tom adulto, política, psicologia e temas complexos.",
    recommendedFormats: ["Mangá", "HQ / Comic"],
  },
  {
    id: "sobrenatural-oculto",
    name: "Sobrenatural & Oculto",
    category: "visual",
    description:
      "Espíritos, entidades ancestrais, poderes místicos e ocultismo.",
    recommendedFormats: ["Mangá", "HQ / Comic"],
  },
  {
    id: "slice-of-life",
    name: "Slice of Life / Quotidiano",
    category: "visual",
    description:
      "Narrativas intimistas sobre o dia a dia, trabalho, escola e laços humanos.",
    recommendedFormats: ["Mangá", "HQ / Comic", "Conto"],
  },
  {
    id: "isekai-fantasia-mundos",
    name: "Isekai / Outros Mundos",
    category: "visual",
    description:
      "Transição de personagens para universos fantásticos ou paralelos.",
    recommendedFormats: ["Mangá", "Romance", "Fanfiction"],
  },
  {
    id: "cyberpunk-mecha",
    name: "Cyberpunk & Mecha",
    category: "visual",
    description:
      "Alta tecnologia com baixa qualidade de vida, androides, robôs gigantes e redes neurais.",
    recommendedFormats: ["Mangá", "HQ / Comic", "Ficção científica" as never],
  },
];

/** Retorna a lista unificada de todos os nomes de géneros disponíveis. */
export function getAllGenres(): string[] {
  return GENRE_CATALOG.map((g) => g.name);
}

/**
 * Retorna géneros sugeridos para um formato específico, mantendo a lista geral disponível.
 */
export function getGenresForFormat(format?: string): {
  recommended: string[];
  all: string[];
} {
  const all = getAllGenres();
  if (!format) return { recommended: [...LEGACY_GENRES], all };

  const matches = GENRE_CATALOG.filter((item) =>
    item.recommendedFormats?.some(
      (f) => f.toLowerCase() === format.trim().toLowerCase(),
    ),
  ).map((item) => item.name);

  // Garante que o retorno recomendado não é vazio
  const recommended = matches.length > 0 ? matches : [...LEGACY_GENRES];

  return { recommended, all };
}

/** Valida se um valor de género consta do catálogo ou é legado conhecido. */
export function isKnownGenre(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return GENRE_CATALOG.some((g) => g.name.toLowerCase() === normalized);
}
