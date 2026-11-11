/**
 * Catálogo Canónico e Extensível de Idiomas — Arquivo Global.
 *
 * Fontes e Padronização:
 * - IANA Language Subtag Registry (RFC 5646 / BCP-47)
 * - ISO 639-1 (códigos de 2 letras) e ISO 639-3 (códigos de 3 letras)
 * - Unicode CLDR (Common Locale Data Repository) para exónimos em língua portuguesa e endónimos nativos.
 *
 * Princípios:
 * - Não restrito à Europa ou África: abrange idiomas de todos os continentes habitados.
 * - Inclui línguas nacionais, regionais, minoritárias, indígenas, línguas clássicas e códigos especiais (multilíngue, visual).
 * - Identificação explícita de sistemas de escrita da direita para a esquerda (RTL).
 * - Preservação estrita dos 4 idiomas originais ("Português", "Galego", "Espanhol", "Inglês").
 */

export interface LanguageDefinition {
  code: string; // Código BCP-47 / ISO 639-1 ou ISO 639-3
  name: string; // Nome canónico em português (apresentação na UI e gravação na DB)
  nativeName?: string; // Nome nativo / autónimo na própria língua e alfabeto
  region:
    | "África"
    | "Américas"
    | "Ásia"
    | "Europa"
    | "Oceânia"
    | "Global"
    | "Especial";
  direction?: "ltr" | "rtl"; // Direção da escrita (padrão ltr)
  isPopular?: boolean; // Idiomas frequentemente utilizados na plataforma (destaque inicial)
  family?: string; // Família linguística
  notes?: string;
}

/** Os 4 idiomas originalmente suportados, preservados de forma estrita. */
export const LEGACY_LANGUAGES = [
  "Português",
  "Galego",
  "Espanhol",
  "Inglês",
] as const;

export const LANGUAGE_CATALOG: LanguageDefinition[] = [
  // =========================================================================
  // 0. CÓDIGOS ESPECIAIS & INTERNACIONAIS (BCP-47 / ISO 639-2/3)
  // =========================================================================
  {
    code: "mul",
    name: "Multilíngue (Vários Idiomas)",
    nativeName: "Multilingual",
    region: "Especial",
    isPopular: true,
    notes:
      "Obras que utilizam intencionalmente múltiplos idiomas ao longo do texto.",
  },
  {
    code: "zxx",
    name: "Sem conteúdo linguístico (Visual / Arte pura)",
    nativeName: "No linguistic content",
    region: "Especial",
    isPopular: true,
    notes:
      "Para HQs mudas, pranchas gráficas, livros de fotografia ou ilustrações puras.",
  },
  {
    code: "eo",
    name: "Esperanto",
    nativeName: "Esperanto",
    region: "Global",
    family: "Língua Construída Internacional",
  },
  {
    code: "ia",
    name: "Interlíngua",
    nativeName: "Interlingua",
    region: "Global",
    family: "Língua Construída",
  },
  {
    code: "la",
    name: "Latim",
    nativeName: "Latina",
    region: "Europa",
    family: "Itálica / Clássica",
  },
  {
    code: "grc",
    name: "Grego Antigo",
    nativeName: "Ἀρχαία Ἑλληνική",
    region: "Europa",
    family: "Helénica / Clássica",
  },
  {
    code: "sa",
    name: "Sânscrito",
    nativeName: "संस्कृतम्",
    region: "Ásia",
    family: "Indo-Ariana / Clássica",
  },

  // =========================================================================
  // 1. LÍNGUAS FUNDAMENTAIS DA PLATAFORMA (LUSOFONIA & DIÁSPORA)
  // =========================================================================
  {
    code: "pt",
    name: "Português",
    nativeName: "Português",
    region: "Global",
    isPopular: true,
    notes:
      "Moçambique, Angola, Portugal, Brasil, Cabo Verde, São Tomé e Príncipe, Guiné-Bissau, Timor-Leste, Macau.",
  },
  {
    code: "gl",
    name: "Galego",
    nativeName: "Galego",
    region: "Europa",
    isPopular: true,
    notes: "Galiza (espaço galaico-luso).",
  },
  {
    code: "es",
    name: "Espanhol",
    nativeName: "Español",
    region: "Global",
    isPopular: true,
    notes: "América Hispânica, Espanha e Guiné Equatorial.",
  },
  {
    code: "en",
    name: "Inglês",
    nativeName: "English",
    region: "Global",
    isPopular: true,
  },

  // =========================================================================
  // 2. LÍNGUAS AFRICANAS (COM ÊNFASE NA ÁFRICA LUSÓFONA E CONTINENTAL)
  // =========================================================================
  // Moçambique
  {
    code: "tsc",
    name: "Changana (Xichangana)",
    nativeName: "Xichangana",
    region: "África",
    family: "Bantu (Tswa-Ronga)",
    isPopular: true,
  },
  {
    code: "vmw",
    name: "Emakhuwa (Macua)",
    nativeName: "Emakhuwa",
    region: "África",
    family: "Bantu",
    isPopular: true,
  },
  {
    code: "seh",
    name: "Sena (Cisena)",
    nativeName: "Cisena",
    region: "África",
    family: "Bantu",
    isPopular: true,
  },
  {
    code: "ndc",
    name: "Ndau (Cindau)",
    nativeName: "Cindau",
    region: "África",
    family: "Bantu (Shona)",
  },
  {
    code: "ts",
    name: "Tsonga (Xitsonga)",
    nativeName: "Xitsonga",
    region: "África",
    family: "Bantu",
  },
  {
    code: "cce",
    name: "Chope (Cicopi)",
    nativeName: "Cicopi",
    region: "África",
    family: "Bantu",
  },
  {
    code: "bto",
    name: "Bitonga (Gitonga)",
    nativeName: "Gitonga",
    region: "África",
    family: "Bantu",
  },
  {
    code: "ngl",
    name: "Lomwe (Elomwe)",
    nativeName: "Elomwe",
    region: "África",
    family: "Bantu",
  },
  {
    code: "rng",
    name: "Ronga (Xironga)",
    nativeName: "Xironga",
    region: "África",
    family: "Bantu",
  },
  {
    code: "nyu",
    name: "Nyungwe (Cinyungwe)",
    nativeName: "Cinyungwe",
    region: "África",
    family: "Bantu",
  },
  {
    code: "chw",
    name: "Chuwabu (Echuwabo)",
    nativeName: "Echuwabo",
    region: "África",
    family: "Bantu",
  },
  {
    code: "yao",
    name: "Yao (Ciyawo)",
    nativeName: "Ciyawo",
    region: "África",
    family: "Bantu",
  },
  {
    code: "mgh",
    name: "Makhuwa-Meetto",
    nativeName: "Emeetto",
    region: "África",
    family: "Bantu",
  },
  {
    code: "xsm",
    name: "Makonde (Shimakonde)",
    nativeName: "Shimakonde",
    region: "África",
    family: "Bantu",
  },

  // Angola
  {
    code: "kmb",
    name: "Kimbundu (Quimbundo)",
    nativeName: "Kimbundu",
    region: "África",
    family: "Bantu",
    isPopular: true,
  },
  {
    code: "umb",
    name: "Umbundu (Umbundo)",
    nativeName: "Umbundu",
    region: "África",
    family: "Bantu",
    isPopular: true,
  },
  {
    code: "kg",
    name: "Kikongo",
    nativeName: "Kikôngo",
    region: "África",
    family: "Bantu",
    isPopular: true,
  },
  {
    code: "cjk",
    name: "Cokwe (Quioco)",
    nativeName: "Cokwe",
    region: "África",
    family: "Bantu",
  },
  {
    code: "kua",
    name: "Kwanyama (Cuanhama)",
    nativeName: "Oshikwanyama",
    region: "África",
    family: "Bantu",
  },
  {
    code: "lun",
    name: "Lunda",
    nativeName: "Chilunda",
    region: "África",
    family: "Bantu",
  },
  {
    code: "nyn",
    name: "Nhaneca (Olunyaneka)",
    nativeName: "Olunyaneka",
    region: "África",
    family: "Bantu",
  },
  {
    code: "fji",
    name: "Fiote (Ibinda)",
    nativeName: "Ibinda",
    region: "África",
    family: "Bantu (Cabinda)",
  },

  // Cabo Verde, Guiné-Bissau & São Tomé e Príncipe
  {
    code: "kea",
    name: "Crioulo de Cabo Verde (Kabuverdianu)",
    nativeName: "Kabuverdianu",
    region: "África",
    isPopular: true,
  },
  {
    code: "pov",
    name: "Crioulo da Guiné-Bissau (Kriol)",
    nativeName: "Kriol",
    region: "África",
    isPopular: true,
  },
  {
    code: "cri",
    name: "Forro (Crioulo Santomense)",
    nativeName: "Forro",
    region: "África",
    isPopular: true,
  },
  {
    code: "aoa",
    name: "Angolar",
    nativeName: "Ngola",
    region: "África",
  },
  {
    code: "pre",
    name: "Principense (Lungie)",
    nativeName: "Lunguyê",
    region: "África",
  },

  // Grandes Línguas Africanas Continentais
  {
    code: "sw",
    name: "Swahili (Kiswahili)",
    nativeName: "Kiswahili",
    region: "África",
    family: "Bantu",
    isPopular: true,
  },
  {
    code: "yo",
    name: "Iorubá (Yorùbá)",
    nativeName: "Èdè Yorùbá",
    region: "África",
    isPopular: true,
  },
  {
    code: "ha",
    name: "Hausa",
    nativeName: "Harshen Hausa",
    region: "África",
    isPopular: true,
  },
  {
    code: "ig",
    name: "Igbo",
    nativeName: "Asụsụ Igbo",
    region: "África",
  },
  {
    code: "am",
    name: "Amárico",
    nativeName: "አማርኛ",
    region: "África",
    family: "Semítica Etíope",
  },
  {
    code: "om",
    name: "Oromo",
    nativeName: "Afaan Oromoo",
    region: "África",
  },
  {
    code: "so",
    name: "Somali",
    nativeName: "Af Soomaali",
    region: "África",
  },
  {
    code: "ti",
    name: "Tigrínia",
    nativeName: "ትግርኛ",
    region: "África",
  },
  {
    code: "ln",
    name: "Lingala",
    nativeName: "Lingála",
    region: "África",
    isPopular: true,
  },
  {
    code: "zu",
    name: "Zulu (isiZulu)",
    nativeName: "isiZulu",
    region: "África",
    isPopular: true,
  },
  {
    code: "xh",
    name: "Xhosa (isiXhosa)",
    nativeName: "isiXhosa",
    region: "África",
  },
  {
    code: "sn",
    name: "Shona (chiShona)",
    nativeName: "chiShona",
    region: "África",
  },
  {
    code: "rw",
    name: "Kinyarwanda",
    nativeName: "Ikinyarwanda",
    region: "África",
  },
  {
    code: "rn",
    name: "Kirundi",
    nativeName: "Ikirundi",
    region: "África",
  },
  {
    code: "ny",
    name: "Chewa (Chichewa / Nyanja)",
    nativeName: "Chichewa",
    region: "África",
  },
  {
    code: "wo",
    name: "Wolof",
    nativeName: "Wollof",
    region: "África",
  },
  {
    code: "bm",
    name: "Bambara",
    nativeName: "Bamanankan",
    region: "África",
  },
  {
    code: "ff",
    name: "Fula (Pulaar / Fulfulde)",
    nativeName: "Fulfulde",
    region: "África",
  },
  {
    code: "ak",
    name: "Akan (Twi / Fante)",
    nativeName: "Akan",
    region: "África",
  },
  {
    code: "ee",
    name: "Ewe",
    nativeName: "Èʋegbe",
    region: "África",
  },
  {
    code: "fon",
    name: "Fongbe (Fon)",
    nativeName: "Fɔngbe",
    region: "África",
  },
  {
    code: "lg",
    name: "Luganda",
    nativeName: "Oluganda",
    region: "África",
  },
  {
    code: "ki",
    name: "Kikuyu (Gikuyu)",
    nativeName: "Gĩkũyũ",
    region: "África",
  },
  {
    code: "st",
    name: "Sesotho (Soto do Sul)",
    nativeName: "Sesotho",
    region: "África",
  },
  {
    code: "tn",
    name: "Tswana (Setswana)",
    nativeName: "Setswana",
    region: "África",
  },
  {
    code: "af",
    name: "Afrikaans",
    nativeName: "Afrikaans",
    region: "África",
  },
  {
    code: "mg",
    name: "Malgaxe",
    nativeName: "Malagasy",
    region: "África",
  },
  {
    code: "sg",
    name: "Sango",
    nativeName: "Sängö",
    region: "África",
  },
  {
    code: "zgh",
    name: "Tamazight (Berbere Padrão)",
    nativeName: "Tamaziɣt (ⵜⴰⵎⴰⵣⵉⵖⵜ)",
    region: "África",
  },
  {
    code: "kab",
    name: "Kabyle (Cabila)",
    nativeName: "Taqbaylit",
    region: "África",
  },
  {
    code: "man",
    name: "Mandinga (Mandinka)",
    nativeName: "Manding",
    region: "África",
  },
  {
    code: "mos",
    name: "Mossi (Mooré)",
    nativeName: "Mòoré",
    region: "África",
  },
  {
    code: "luo",
    name: "Luo (Dholuo)",
    nativeName: "Dholuo",
    region: "África",
  },

  // =========================================================================
  // 3. AMÉRICAS (INDÍGENAS, REGIONAIS & CRIOULOS)
  // =========================================================================
  {
    code: "gn",
    name: "Guarani",
    nativeName: "Avañe'ẽ",
    region: "Américas",
    isPopular: true,
  },
  {
    code: "qu",
    name: "Quechua",
    nativeName: "Runasimi",
    region: "Américas",
    isPopular: true,
  },
  {
    code: "ay",
    name: "Aimará",
    nativeName: "Aymar aru",
    region: "Américas",
  },
  {
    code: "yrl",
    name: "Nheengatu (Tupi Moderno)",
    nativeName: "Nheengatu",
    region: "Américas",
    notes: "Língua geral amazónica.",
  },
  {
    code: "arn",
    name: "Mapudungun (Mapuche)",
    nativeName: "Mapudungun",
    region: "Américas",
  },
  {
    code: "nah",
    name: "Náuatle (Nahuatl)",
    nativeName: "Nāhuatl",
    region: "Américas",
  },
  {
    code: "yua",
    name: "Maia Yucateco",
    nativeName: "Màaya t'àan",
    region: "Américas",
  },
  {
    code: "zap",
    name: "Zapoteco",
    nativeName: "Diidxazá",
    region: "Américas",
  },
  {
    code: "mix",
    name: "Mixteco",
    nativeName: "Tu'un sávi",
    region: "Américas",
  },
  {
    code: "guc",
    name: "Wayuu",
    nativeName: "Wayuunaiki",
    region: "Américas",
  },
  {
    code: "chr",
    name: "Cherokee",
    nativeName: "ᏣᎳᎩ (Tsalagi)",
    region: "Américas",
  },
  {
    code: "nv",
    name: "Navajo",
    nativeName: "Diné bizaad",
    region: "Américas",
  },
  {
    code: "iu",
    name: "Inuktitut",
    nativeName: "ᐃᓄᒃᑎᑐᑦ",
    region: "Américas",
  },
  {
    code: "kl",
    name: "Groenlandês (Kalaallisut)",
    nativeName: "Kalaallisut",
    region: "Américas",
  },
  {
    code: "cr",
    name: "Cree",
    nativeName: "Nēhiyawēwin",
    region: "Américas",
  },
  {
    code: "oj",
    name: "Ojíbwua (Ojibwe)",
    nativeName: "Anishinaabemowin",
    region: "Américas",
  },
  {
    code: "lkt",
    name: "Lakota",
    nativeName: "Lakȟólʼiyapi",
    region: "Américas",
  },
  {
    code: "ht",
    name: "Crioulo Haitiano",
    nativeName: "Kreyòl ayisyen",
    region: "Américas",
  },
  {
    code: "pap",
    name: "Papiamento",
    nativeName: "Papiamentu",
    region: "Américas",
  },

  // =========================================================================
  // 4. ÁSIA & MÉDIO ORIENTE (INCLUINDO LÍNGUAS RTL)
  // =========================================================================
  // Direita para a esquerda (RTL)
  {
    code: "ar",
    name: "Árabe",
    nativeName: "العربية",
    region: "Ásia",
    direction: "rtl",
    isPopular: true,
  },
  {
    code: "fa",
    name: "Persa (Farsi)",
    nativeName: "فارسی",
    region: "Ásia",
    direction: "rtl",
    isPopular: true,
  },
  {
    code: "ur",
    name: "Urdu",
    nativeName: "اردو",
    region: "Ásia",
    direction: "rtl",
    isPopular: true,
  },
  {
    code: "he",
    name: "Hebraico",
    nativeName: "עברית",
    region: "Ásia",
    direction: "rtl",
    isPopular: true,
  },
  {
    code: "ckb",
    name: "Curdo (Sorani)",
    nativeName: "کوردی",
    region: "Ásia",
    direction: "rtl",
  },
  {
    code: "kmr",
    name: "Curdo (Kurmanji)",
    nativeName: "Kurdî",
    region: "Ásia",
    direction: "ltr",
  },
  {
    code: "ps",
    name: "Pashto",
    nativeName: "پښتو",
    region: "Ásia",
    direction: "rtl",
  },
  {
    code: "ug",
    name: "Uigur",
    nativeName: "ئۇيغۇرچە",
    region: "Ásia",
    direction: "rtl",
  },
  {
    code: "yi",
    name: "Iídiche",
    nativeName: "ייִדיש",
    region: "Europa",
    direction: "rtl",
  },
  {
    code: "sd",
    name: "Sindi",
    nativeName: "سنڌي",
    region: "Ásia",
    direction: "rtl",
  },
  {
    code: "dv",
    name: "Divehi (Maldivense)",
    nativeName: "ދިވެހި",
    region: "Ásia",
    direction: "rtl",
  },

  // Leste & Sudeste Asiático
  {
    code: "zh",
    name: "Chinês (Mandarim)",
    nativeName: "中文 (Zhōngwén)",
    region: "Ásia",
    isPopular: true,
  },
  {
    code: "yue",
    name: "Cantonês",
    nativeName: "粵語 (Yuht Yúh)",
    region: "Ásia",
  },
  {
    code: "ja",
    name: "Japonês",
    nativeName: "日本語 (Nihongo)",
    region: "Ásia",
    isPopular: true,
  },
  {
    code: "ko",
    name: "Coreano",
    nativeName: "한국어 (Hangugeo)",
    region: "Ásia",
    isPopular: true,
  },
  {
    code: "vi",
    name: "Vietnamita",
    nativeName: "Tiếng Việt",
    region: "Ásia",
    isPopular: true,
  },
  {
    code: "th",
    name: "Tailandês",
    nativeName: "ไทย (Phasa Thai)",
    region: "Ásia",
    isPopular: true,
  },
  {
    code: "id",
    name: "Indonésio",
    nativeName: "Bahasa Indonesia",
    region: "Ásia",
    isPopular: true,
  },
  {
    code: "ms",
    name: "Malaio",
    nativeName: "Bahasa Melayu",
    region: "Ásia",
  },
  {
    code: "tl",
    name: "Tagalo (Filipino)",
    nativeName: "Tagalog",
    region: "Ásia",
    isPopular: true,
  },
  {
    code: "my",
    name: "Birmanês",
    nativeName: "မြန်မာစာ",
    region: "Ásia",
  },
  {
    code: "km",
    name: "Khmer (Camboja)",
    nativeName: "ភាសាខ្មែរ",
    region: "Ásia",
  },
  {
    code: "lo",
    name: "Lao (Laos)",
    nativeName: "ພາສາລາວ",
    region: "Ásia",
  },
  {
    code: "mn",
    name: "Mongol",
    nativeName: "Монгол хэл",
    region: "Ásia",
  },
  {
    code: "bo",
    name: "Tibetano",
    nativeName: "བོད་སྐད",
    region: "Ásia",
  },
  {
    code: "jv",
    name: "Javanês",
    nativeName: "Basa Jawa",
    region: "Ásia",
  },
  {
    code: "su",
    name: "Sundanês",
    nativeName: "Basa Sunda",
    region: "Ásia",
  },
  {
    code: "ceb",
    name: "Cebuano",
    nativeName: "Binisaya",
    region: "Ásia",
  },

  // Sul da Ásia
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    region: "Ásia",
    isPopular: true,
  },
  {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    region: "Ásia",
    isPopular: true,
  },
  {
    code: "pa",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    region: "Ásia",
  },
  {
    code: "ta",
    name: "Tâmil",
    nativeName: "தமிழ்",
    region: "Ásia",
    isPopular: true,
  },
  {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    region: "Ásia",
  },
  {
    code: "mr",
    name: "Marata (Marathi)",
    nativeName: "मराठी",
    region: "Ásia",
  },
  {
    code: "gu",
    name: "Guzerate (Gujarati)",
    nativeName: "ગુજરાતી",
    region: "Ásia",
  },
  {
    code: "kn",
    name: "Canarim (Kannada)",
    nativeName: "ಕನ್ನಡ",
    region: "Ásia",
  },
  {
    code: "ml",
    name: "Malaiala (Malayalam)",
    nativeName: "മലയാളം",
    region: "Ásia",
  },
  {
    code: "or",
    name: "Oriá (Odia)",
    nativeName: "ଓଡ଼ିଆ",
    region: "Ásia",
  },
  {
    code: "as",
    name: "Assamês",
    nativeName: "অসমীয়া",
    region: "Ásia",
  },
  {
    code: "ne",
    name: "Nepalês",
    nativeName: "नेपाली",
    region: "Ásia",
  },
  {
    code: "si",
    name: "Cingalês (Sinhala)",
    nativeName: "සිංහල",
    region: "Ásia",
  },

  // Ásia Central & Cáucaso
  {
    code: "tr",
    name: "Turco",
    nativeName: "Türkçe",
    region: "Ásia",
    isPopular: true,
  },
  {
    code: "kk",
    name: "Cazaque",
    nativeName: "Қазақ тілі",
    region: "Ásia",
  },
  {
    code: "uz",
    name: "Uzbeque",
    nativeName: "Oʻzbekcha",
    region: "Ásia",
  },
  {
    code: "ky",
    name: "Quirguiz",
    nativeName: "Кыргызча",
    region: "Ásia",
  },
  {
    code: "tg",
    name: "Tadjique",
    nativeName: "Тоҷикӣ",
    region: "Ásia",
  },
  {
    code: "tk",
    name: "Turcomeno",
    nativeName: "Türkmençe",
    region: "Ásia",
  },
  {
    code: "az",
    name: "Azerbaijano",
    nativeName: "Azərbaycan dili",
    region: "Ásia",
  },
  {
    code: "ka",
    name: "Georgiano",
    nativeName: "ქართული",
    region: "Ásia",
  },
  {
    code: "hy",
    name: "Arménio",
    nativeName: "Հայերեն",
    region: "Ásia",
  },

  // =========================================================================
  // 5. EUROPA (LÍNGUAS NACIONAIS, REGIONAIS & MINORITÁRIAS)
  // =========================================================================
  {
    code: "fr",
    name: "Francês",
    nativeName: "Français",
    region: "Europa",
    isPopular: true,
  },
  {
    code: "it",
    name: "Italiano",
    nativeName: "Italiano",
    region: "Europa",
    isPopular: true,
  },
  {
    code: "de",
    name: "Alemão",
    nativeName: "Deutsch",
    region: "Europa",
    isPopular: true,
  },
  {
    code: "nl",
    name: "Neerlandês (Holandês)",
    nativeName: "Nederlands",
    region: "Europa",
  },
  {
    code: "ca",
    name: "Catalão",
    nativeName: "Català",
    region: "Europa",
  },
  {
    code: "eu",
    name: "Basco (Euskara)",
    nativeName: "Euskara",
    region: "Europa",
  },
  {
    code: "ast",
    name: "Asturiano",
    nativeName: "Asturianu",
    region: "Europa",
  },
  {
    code: "mwl",
    name: "Mirandês",
    nativeName: "Mirandés",
    region: "Europa",
    notes: "Segunda língua oficial de Portugal (Planalto Mirandês).",
  },
  {
    code: "oc",
    name: "Occitano",
    nativeName: "Occitan",
    region: "Europa",
  },
  {
    code: "br",
    name: "Bretão",
    nativeName: "Brezhoneg",
    region: "Europa",
  },
  {
    code: "cy",
    name: "Galês (Cymraeg)",
    nativeName: "Cymraeg",
    region: "Europa",
  },
  {
    code: "ga",
    name: "Gaélico Irlandês (Gaeilge)",
    nativeName: "Gaeilge",
    region: "Europa",
  },
  {
    code: "gd",
    name: "Gaélico Escocês",
    nativeName: "Gàidhlig",
    region: "Europa",
  },
  {
    code: "sv",
    name: "Sueco",
    nativeName: "Svenska",
    region: "Europa",
  },
  {
    code: "da",
    name: "Dinamarquês",
    nativeName: "Dansk",
    region: "Europa",
  },
  {
    code: "no",
    name: "Norueguês",
    nativeName: "Norsk",
    region: "Europa",
  },
  {
    code: "fi",
    name: "Finlandês",
    nativeName: "Suomi",
    region: "Europa",
  },
  {
    code: "is",
    name: "Islandês",
    nativeName: "Íslenska",
    region: "Europa",
  },
  {
    code: "fo",
    name: "Feroês",
    nativeName: "Føroyskt",
    region: "Europa",
  },
  {
    code: "el",
    name: "Grego Moderno",
    nativeName: "Ελληνικά",
    region: "Europa",
    isPopular: true,
  },
  {
    code: "ru",
    name: "Russo",
    nativeName: "Русский",
    region: "Europa",
    isPopular: true,
  },
  {
    code: "uk",
    name: "Ucraniano",
    nativeName: "Українська",
    region: "Europa",
    isPopular: true,
  },
  {
    code: "pl",
    name: "Polaco",
    nativeName: "Polski",
    region: "Europa",
    isPopular: true,
  },
  {
    code: "cs",
    name: "Checo",
    nativeName: "Čeština",
    region: "Europa",
  },
  {
    code: "sk",
    name: "Eslovaco",
    nativeName: "Slovenčina",
    region: "Europa",
  },
  {
    code: "hu",
    name: "Húngaro",
    nativeName: "Magyar",
    region: "Europa",
  },
  {
    code: "ro",
    name: "Romeno",
    nativeName: "Română",
    region: "Europa",
  },
  {
    code: "bg",
    name: "Búlgaro",
    nativeName: "Български",
    region: "Europa",
  },
  {
    code: "sr",
    name: "Sérvio",
    nativeName: "Српски / Srpski",
    region: "Europa",
  },
  {
    code: "hr",
    name: "Croata",
    nativeName: "Hrvatski",
    region: "Europa",
  },
  {
    code: "bs",
    name: "Bósnio",
    nativeName: "Bosanski",
    region: "Europa",
  },
  {
    code: "sl",
    name: "Esloveno",
    nativeName: "Slovenščina",
    region: "Europa",
  },
  {
    code: "mk",
    name: "Macedónio",
    nativeName: "Македонски",
    region: "Europa",
  },
  {
    code: "sq",
    name: "Albanês",
    nativeName: "Shqip",
    region: "Europa",
  },
  {
    code: "mt",
    name: "Maltês",
    nativeName: "Malti",
    region: "Europa",
  },
  {
    code: "et",
    name: "Estónio",
    nativeName: "Eesti",
    region: "Europa",
  },
  {
    code: "lv",
    name: "Letão",
    nativeName: "Latviešu",
    region: "Europa",
  },
  {
    code: "lt",
    name: "Lituano",
    nativeName: "Lietuvių",
    region: "Europa",
  },
  {
    code: "be",
    name: "Bielorrusso",
    nativeName: "Беларуская",
    region: "Europa",
  },
  {
    code: "rm",
    name: "Romanche",
    nativeName: "Rumantsch",
    region: "Europa",
  },
  {
    code: "lb",
    name: "Luxemburguês",
    nativeName: "Lëtzebuergesch",
    region: "Europa",
  },
  {
    code: "se",
    name: "Sami Setentrional",
    nativeName: "Davvisámegiella",
    region: "Europa",
  },

  // =========================================================================
  // 6. OCEÂNIA & ILHAS DO PACÍFICO
  // =========================================================================
  {
    code: "mi",
    name: "Maori",
    nativeName: "Te Reo Māori",
    region: "Oceânia",
  },
  {
    code: "haw",
    name: "Havaiano",
    nativeName: "ʻŌlelo Hawaiʻi",
    region: "Oceânia",
  },
  {
    code: "sm",
    name: "Samoano",
    nativeName: "Gagana Sāmoa",
    region: "Oceânia",
  },
  {
    code: "to",
    name: "Tonganes",
    nativeName: "Lea Fakatonga",
    region: "Oceânia",
  },
  {
    code: "fj",
    name: "Fijiano",
    nativeName: "Na Vosa Vakaviti",
    region: "Oceânia",
  },
  {
    code: "ty",
    name: "Taitiano",
    nativeName: "Reo Tahiti",
    region: "Oceânia",
  },
  {
    code: "tpi",
    name: "Tok Pisin",
    nativeName: "Tok Pisin",
    region: "Oceânia",
  },
  {
    code: "ch",
    name: "Chamorro",
    nativeName: "Finu' Chamorro",
    region: "Oceânia",
  },
  {
    code: "bi",
    name: "Bislama",
    nativeName: "Bislama",
    region: "Oceânia",
  },
  {
    code: "tet",
    name: "Tétum",
    nativeName: "Lia-Tetun",
    region: "Oceânia",
    isPopular: true,
    notes: "Língua co-oficial de Timor-Leste (espaço CPLP).",
  },
];

/** Remove marcas diacríticas para pesquisa textual insensível a acentos. */
function stripDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Retorna a lista completa com todos os nomes de idiomas em português. */
export function getAllLanguageNames(): string[] {
  return LANGUAGE_CATALOG.map((lang) => lang.name);
}

/** Retorna a lista de idiomas recomendados / populares para apresentação rápida. */
export function getPopularLanguages(): LanguageDefinition[] {
  return LANGUAGE_CATALOG.filter((lang) => lang.isPopular);
}

/**
 * Pesquisa no catálogo por nome em português, nome nativo ou código ISO/BCP-47.
 * Tolerante a acentos e maiúsculas.
 */
export function searchLanguages(
  query: string,
  limit = 50,
): LanguageDefinition[] {
  if (!query || !query.trim()) {
    return LANGUAGE_CATALOG.slice(0, limit);
  }
  const clean = stripDiacritics(query.trim());

  // 1. Prioriza correspondências exatas de código ISO
  const exactCode = LANGUAGE_CATALOG.filter(
    (lang) => lang.code.toLowerCase() === clean,
  );

  // 2. Correspondências parciais por código, nome em português ou nome nativo
  const matches = LANGUAGE_CATALOG.filter((lang) => {
    if (lang.code.toLowerCase() === clean) return false; // já incluído
    const nameNorm = stripDiacritics(lang.name);
    const nativeNorm = lang.nativeName ? stripDiacritics(lang.nativeName) : "";
    const codeNorm = lang.code.toLowerCase();
    return (
      codeNorm.startsWith(clean) ||
      nameNorm.includes(clean) ||
      nativeNorm.includes(clean)
    );
  });

  return [...exactCode, ...matches].slice(0, limit);
}

/** Localiza a definição completa de um idioma pelo seu código ou nome. */
export function findLanguage(
  codeOrName: string,
): LanguageDefinition | undefined {
  if (!codeOrName || typeof codeOrName !== "string") return undefined;
  const clean = codeOrName.trim().toLowerCase();
  const cleanNoDiacritics = stripDiacritics(clean);

  return LANGUAGE_CATALOG.find((lang) => {
    if (lang.code.toLowerCase() === clean) return true;
    if (lang.name.toLowerCase() === clean) return true;
    if (stripDiacritics(lang.name) === cleanNoDiacritics) return true;
    if (
      lang.nativeName &&
      stripDiacritics(lang.nativeName) === cleanNoDiacritics
    )
      return true;
    return false;
  });
}

/**
 * Valida e normaliza o idioma para o valor canónico registado na base de dados.
 * Preserva compatibilidade total com obras já guardadas.
 */
export function normalizeLanguageName(
  name: string,
  fallback = "Português",
): string {
  if (!name || typeof name !== "string") return fallback;
  const found = findLanguage(name);
  return found ? found.name : name.trim();
}

/** Verifica se um idioma utiliza escrita da direita para a esquerda (RTL). */
export function isRtlLanguage(codeOrName: string): boolean {
  const lang = findLanguage(codeOrName);
  return lang?.direction === "rtl";
}
