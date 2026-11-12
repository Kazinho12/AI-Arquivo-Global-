import type { Work } from "../../src/foundation/data/works";
import type { WorkReadingData } from "../../src/foundation/features/reader/types";
export const editorialDate = "2026-11-10";
export const editorialIdentity = {
  id: "ag-editorial-team",
  username: "equipa-editorial",
  displayName: "Arquivo Global — Equipa Editorial",
  bio: "Identidade editorial local para preparar a abertura do Arquivo Global. Textos e composições originais criados para o projeto; ainda sem publicação remota. Não é uma conta Supabase nem concede privilégios.",
  createdAt: editorialDate + "T00:00:00Z",
};
export const editorialAuthors = [editorialIdentity];
export const editorialPublisher = {
  id: "ag-publisher-editorial",
  name: editorialIdentity.displayName,
  kind: "editorial-organization" as const,
};
export interface InauguralWork extends Work {
  originalAuthorId: string;
  publisherId: string;
  ownerId: string;
  origin: "original-created-for-project";
  rights: "original-institutional-draft";
  publicationStatus: "prepared-local";
  preparedAt: string;
  publishedAt: null;
  coverAsset: string;
  readingMode: WorkReadingData["mode"];
}
const base = {
  author: editorialIdentity.displayName,
  authorId: editorialIdentity.id,
  originalAuthorId: editorialIdentity.id,
  publisherId: editorialPublisher.id,
  ownerId: "ag-editorial-organization",
  origin: "original-created-for-project" as const,
  rights: "original-institutional-draft" as const,
  publicationStatus: "prepared-local" as const,
  preparedAt: editorialDate,
  publishedAt: null,
  createdAt: editorialDate,
};
export const inauguralWorks: InauguralWork[] = [
  {
    ...base,
    id: "ag-carta-abertura",
    title: "Carta de abertura",
    format: "Conto",
    genre: "Institucional",
    tags: ["Criação", "Descoberta", "Arquivo"],
    synopsis:
      "Uma breve carta sobre abrir um lugar para as histórias e guardar espaço para quem ainda está a começar. Texto editorial original em duas partes.",
    cover: 1,
    coverAsset:
      "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22800%22%3E%3Crect width=%22600%22 height=%22800%22 fill=%22%2314243b%22/%3E%3C/svg%3E",
    readingMode: "prose",
  },
  {
    ...base,
    id: "ag-primeiras-linhas",
    title: "Primeiras linhas",
    format: "Poesia",
    genre: "Contemporâneo",
    tags: ["Criação", "Silêncio", "Memória"],
    synopsis:
      "Três poemas breves sobre a página em branco, a atenção e aquilo que escolhemos guardar. Um caderno editorial original, sem atribuição a terceiros.",
    cover: 3,
    coverAsset:
      "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22800%22%3E%3Crect width=%22600%22 height=%22800%22 fill=%22%2314243b%22/%3E%3C/svg%3E",
    readingMode: "poetry",
  },
  {
    ...base,
    id: "ag-tres-gestos",
    title: "Um arquivo em três gestos",
    format: "HQ / Comic",
    genre: "Ensaio visual",
    tags: ["Arte", "Arquivo", "Descoberta"],
    synopsis:
      "Uma sequência gráfica original sobre encontrar, ler e guardar. Dois capítulos com composições vetoriais, legendas e descrição textual.",
    cover: 2,
    coverAsset:
      "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22800%22%3E%3Crect width=%22600%22 height=%22800%22 fill=%22%2314243b%22/%3E%3C/svg%3E",
    readingMode: "comic",
  },
  {
    ...base,
    id: "ag-outra-margem",
    title: "A outra margem da página",
    format: "Mangá",
    genre: "Ensaio visual",
    tags: ["Arte", "Leitura", "Criação"],
    synopsis:
      "Um ensaio gráfico original para explorar o ritmo da leitura da direita para a esquerda. Uma experiência editorial breve, não uma obra atribuída a um mangaká real.",
    cover: 4,
    coverAsset:
      "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22800%22%3E%3Crect width=%22600%22 height=%22800%22 fill=%22%2314243b%22/%3E%3C/svg%3E",
    readingMode: "manga",
  },
];
const visualPage = (
  id: string,
  number: number,
  title: string,
  description: string,
  asset: string,
  caption: string,
) => ({
  id,
  number,
  title,
  description,
  aspectRatio: "3/4",
  accentColor: "#19354c",
  imageUrl:
    "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22800%22%3E%3Crect width=%22600%22 height=%22800%22 fill=%22%2314243b%22/%3E%3C/svg%3E",
  caption,
});
export const inauguralReading: Record<string, WorkReadingData> =
  Object.fromEntries(
    inauguralWorks.map((work) => [
      work.id,
      {
        workId: work.id,
        title: work.title,
        author: work.author,
        format: work.format,
        mode: work.readingMode,
        chapters:
          work.id === "ag-carta-abertura"
            ? [
                {
                  id: "cap-1",
                  number: 1,
                  title: "Uma porta entreaberta",
                  content: `# Começar pelo espaço

Antes da primeira história, existe um gesto simples: abrir espaço. Uma mesa livre, uma janela com luz, uma página que ainda não exige respostas.

O Arquivo Global começa nessa disponibilidade. Queremos aproximar palavras e imagens sem as obrigar a contar da mesma maneira. Um poema pode caber numa pausa; uma narrativa visual pode precisar de virar a página. Há lugar para ambos.

Esta carta não anuncia uma multidão nem promete uma biblioteca já terminada. Apresenta um começo: ferramentas locais para ler e criar, e um pequeno conjunto de peças editoriais preparado para conhecer esse espaço.

**Ler é uma escolha de atenção.** Não precisamos de contar quantas pessoas passaram antes para decidir ficar um pouco mais.`,
                },
                {
                  id: "cap-2",
                  number: 2,
                  title: "Guardar sem fechar",
                  content: `# O que levamos connosco

Guardar uma história não é encerrá-la. É deixar um sinal de que queremos regressar: uma palavra na margem, uma lista com nome próprio, o lugar onde a leitura parou.

Na versão atual, esse sinal pertence ao navegador em que foi criado. Rascunhos e imagens precisam de cópias cuidadas; mudar de dispositivo não os transporta por magia. Dizer isto com clareza também faz parte de construir um arquivo.

O conteúdo desta abertura foi escrito para o projeto e permanece preparado localmente. A publicação remota e a entrada de outras vozes exigirão passos próprios, com origem e autoria visíveis.

Por agora, a porta fica entreaberta. Entra com tempo. Lê uma página. Se uma ideia te acompanhar à saída, já existe um começo.`,
                },
              ]
            : work.id === "ag-primeiras-linhas"
              ? [
                  {
                    id: "cap-1",
                    number: 1,
                    title: "Página",
                    stanzas: [
                      [
                        "A página não pede pressa,",
                        "só a sombra de uma mão",
                        "que aceite começar.",
                      ],
                      [
                        "Uma linha encontra outra.",
                        "Entre as duas,",
                        "cabe o dia inteiro.",
                      ],
                    ],
                  },
                  {
                    id: "cap-2",
                    number: 2,
                    title: "Atenção",
                    stanzas: [
                      [
                        "Deixo o ruído à porta",
                        "e abro devagar",
                        "o espaço de uma palavra.",
                      ],
                      [
                        "Não é silêncio vazio:",
                        "é o tempo que ofereço",
                        "ao que ainda não conheço.",
                      ],
                    ],
                  },
                  {
                    id: "cap-3",
                    number: 3,
                    title: "Memória",
                    stanzas: [
                      [
                        "Guardo a dobra,",
                        "não para prender a folha,",
                        "mas para saber voltar.",
                      ],
                      [
                        "O que fica",
                        "não é sempre o que pesa.",
                        "Às vezes, é só luz.",
                      ],
                    ],
                  },
                ]
              : work.id === "ag-tres-gestos"
                ? [
                    {
                      id: "cap-1",
                      number: 1,
                      title: "Encontrar e abrir",
                      pages: [
                        visualPage(
                          "gesto-1",
                          1,
                          "Encontrar",
                          "Três caminhos azuis aproximam-se de uma pequena página aberta, num fundo de papel escuro.",
                          "gestos-1",
                          "Não há um único caminho para uma história.",
                        ),
                        visualPage(
                          "gesto-2",
                          2,
                          "Abrir",
                          "Uma janela geométrica revela linhas que se transformam numa página.",
                          "gestos-2",
                          "Abrir é oferecer atenção ao que ainda não conhecemos.",
                        ),
                      ],
                    },
                    {
                      id: "cap-2",
                      number: 2,
                      title: "Ler e guardar",
                      pages: [
                        visualPage(
                          "gesto-3",
                          1,
                          "Ler",
                          "Uma linha atravessa três quadros; em cada um, o intervalo torna-se maior.",
                          "gestos-3",
                          "Cada página tem o seu próprio ritmo.",
                        ),
                        visualPage(
                          "gesto-4",
                          2,
                          "Guardar",
                          "Um marcador azul assinala uma página entre duas margens.",
                          "gestos-4",
                          "Guardar é deixar um caminho para regressar.",
                        ),
                      ],
                    },
                  ]
                : [
                    {
                      id: "cap-1",
                      number: 1,
                      title: "Um começo à direita",
                      pages: [
                        visualPage(
                          "margem-1",
                          1,
                          "O primeiro olhar",
                          "Dois quadros numerados da direita para a esquerda ligam uma janela e uma página.",
                          "margem-1",
                          "Começa à direita. O olhar aprende um novo percurso.",
                        ),
                        visualPage(
                          "margem-2",
                          2,
                          "A pausa",
                          "Um quadro largo e dois quadros pequenos alternam espaços cheios e vazios.",
                          "margem-2",
                          "A direção muda; a atenção continua tua.",
                        ),
                      ],
                    },
                    {
                      id: "cap-2",
                      number: 2,
                      title: "Chegar à outra margem",
                      pages: [
                        visualPage(
                          "margem-3",
                          1,
                          "O intervalo",
                          "Um arco atravessa a margem superior e termina num quadrado azul à esquerda.",
                          "margem-3",
                          "O intervalo também conta uma parte da história.",
                        ),
                        visualPage(
                          "margem-4",
                          2,
                          "Voltar",
                          "Um livro aberto reúne dois percursos, sem apagar o espaço entre eles.",
                          "margem-4",
                          "Uma página termina. A possibilidade de voltar permanece.",
                        ),
                      ],
                    },
                  ],
      },
    ]),
  );
export interface EditorialCollection {
  id: string;
  title: string;
  description: string;
  workIds: readonly string[];
  publisherId: string;
  visibility: "public-preview";
  publicationStatus: "prepared-local";
  preparedAt: string;
}
export const inauguralCollections: EditorialCollection[] = [
  {
    id: "ag-colecao-comecar",
    title: "Começar pelas palavras",
    description:
      "Uma carta e um caderno de poemas para entrar no Arquivo Global com tempo.",
    workIds: ["ag-carta-abertura", "ag-primeiras-linhas"],
    publisherId: editorialPublisher.id,
    visibility: "public-preview",
    publicationStatus: "prepared-local",
    preparedAt: editorialDate,
  },
  {
    id: "ag-colecao-olhar",
    title: "Outras formas de olhar",
    description:
      "Dois ensaios gráficos originais, com percursos de leitura diferentes.",
    workIds: ["ag-tres-gestos", "ag-outra-margem"],
    publisherId: editorialPublisher.id,
    visibility: "public-preview",
    publicationStatus: "prepared-local",
    preparedAt: editorialDate,
  },
];
export const editorialTaxonomy = {
  genres: ["Institucional", "Contemporâneo", "Ensaio visual"],
  tags: [
    "Criação",
    "Descoberta",
    "Arquivo",
    "Silêncio",
    "Memória",
    "Arte",
    "Leitura",
  ],
  categories: ["literaria", "visual"],
};
export const institutionalContent = {
  catalogNotice:
    "Conteúdo editorial · conteúdo local da Equipa Editorial, identificado separadamente das publicações de autores.",
  rulesStatus:
    "Rascunho não publicado · sem aprovação institucional ou jurídica",
  privacyStatus: "Descrição técnica atual; política oficial ainda por aprovar.",
  announcement: {
    id: "ag-abertura-preparacao",
    title: "Um primeiro conjunto de leituras",
    description:
      "Quatro peças originais estão preparadas nesta versão local: uma carta, poesia e dois percursos visuais. A publicação remota permanece pendente.",
    preparedAt: editorialDate,
    workIds: inauguralWorks.map((w) => w.id),
  },
};
export const inauguralCatalog = {
  schemaVersion: 1,
  preparedAt: editorialDate,
  authors: editorialAuthors,
  publishers: [editorialPublisher],
  works: inauguralWorks,
  reading: inauguralReading,
  collections: inauguralCollections,
  taxonomy: editorialTaxonomy,
  institutional: institutionalContent,
};

export const editorialTagDetails = {
  criacao: {
    description: "O gesto de começar, escrever e desenhar.",
    group: "Criação" as const,
  },
  descoberta: {
    description: "Encontrar leituras com atenção e curiosidade.",
    group: "Temas" as const,
  },
  arquivo: {
    description: "Guardar histórias sem fechar os seus caminhos.",
    group: "Criação" as const,
  },
  silencio: {
    description: "Uma pausa para escutar a página.",
    group: "Temas" as const,
  },
  memoria: {
    description: "Sinais que nos ajudam a regressar.",
    group: "Temas" as const,
  },
  arte: {
    description: "Linhas e composições que contam de outra maneira.",
    group: "Criação" as const,
  },
  leitura: {
    description: "Percursos e ritmos para atravessar uma página.",
    group: "Temas" as const,
  },
};
export const editorialGenreDescriptions: Record<string, string> = {
  Institucional: "Uma abertura para conhecer o projeto.",
  Contemporâneo: "Palavras para observar o que está perto.",
  "Ensaio visual": "Ideias contadas em linhas e espaços.",
};
