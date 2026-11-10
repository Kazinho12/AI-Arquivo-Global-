export const formats = [
  "Romance",
  "Conto",
  "Poesia",
  "Série literária",
  "HQ / Comic",
  "Mangá",
  "Obra ilustrada",
  "Fanfiction",
] as const;
export type WorkFormat = (typeof formats)[number];
export interface Work {
  id: string;
  title: string;
  author: string;
  authorId: string;
  format: WorkFormat;
  genre: string;
  tags: string[];
  synopsis: string;
  createdAt: string;
  cover: number;
  demo: true;
}
export const demoWorks: Work[] = [
  {
    id: "atlas-das-mares",
    authorId: "demo-lia-mavume",
    title: "Atlas das marés esquecidas",
    author: "Lia Mavume",
    format: "Romance",
    genre: "Fantasia",
    tags: ["Oceano", "Memória"],
    synopsis:
      "Uma cartógrafa encontra um mapa que só pode ser lido quando a maré desce. Cada ilha guarda uma memória que o mundo escolheu esquecer.",
    createdAt: "2026-01-08",
    cover: 1,
    demo: true,
  },
  {
    id: "cidade-entre-linhas",
    authorId: "demo-tomas-nilo",
    title: "A cidade entre linhas",
    author: "Tomás Nilo",
    format: "HQ / Comic",
    genre: "Ficção científica",
    tags: ["Cidades", "Futuros"],
    synopsis:
      "Numa metrópole desenhada por algoritmos, um jovem ilustrador descobre uma rua que ninguém programou.",
    createdAt: "2026-01-07",
    cover: 2,
    demo: true,
  },
  {
    id: "silencio-orbita",
    authorId: "demo-iris-vale",
    title: "O silêncio em órbita",
    author: "Íris Vale",
    format: "Poesia",
    genre: "Contemporâneo",
    tags: ["Silêncio", "Cosmos"],
    synopsis:
      "Pequenos poemas sobre a distância entre dois corpos e as constelações que inventamos para os aproximar.",
    createdAt: "2026-01-06",
    cover: 3,
    demo: true,
  },
  {
    id: "jardim-lua",
    authorId: "demo-ren-aoki",
    title: "O jardim da última lua",
    author: "Ren Aoki",
    format: "Mangá",
    genre: "Fantasia",
    tags: ["Natureza", "Aventura"],
    synopsis:
      "Quando a noite deixa de terminar, uma aprendiz de jardineira parte em busca da semente do amanhecer.",
    createdAt: "2026-01-05",
    cover: 4,
    demo: true,
  },
  {
    id: "casa-chuva",
    authorId: "demo-noa-senda",
    title: "A casa onde chove dentro",
    author: "Noa Senda",
    format: "Conto",
    genre: "Mistério",
    tags: ["Casa", "Memória"],
    synopsis:
      "Um visitante regressa à casa da infância e encontra uma chuva que parece lembrar-se dele.",
    createdAt: "2026-01-04",
    cover: 5,
    demo: true,
  },
  {
    id: "arquivo-aurora",
    authorId: "demo-davi-mar",
    title: "Arquivo Aurora",
    author: "Davi Mar",
    format: "Série literária",
    genre: "Ficção científica",
    tags: ["Espaço", "Descoberta"],
    synopsis:
      "Uma equipa de arquivistas percorre estações abandonadas para salvar as histórias de uma civilização dispersa.",
    createdAt: "2026-01-03",
    cover: 6,
    demo: true,
  },
  {
    id: "bestias-tinta",
    authorId: "demo-mila-sol",
    title: "As pequenas bestas de tinta",
    author: "Mila Sol",
    format: "Obra ilustrada",
    genre: "Fantasia",
    tags: ["Arte", "Criaturas"],
    synopsis:
      "Um caderno de viagem ilustrado por territórios onde os desenhos ganham vida à luz da manhã.",
    createdAt: "2026-01-02",
    cover: 7,
    demo: true,
  },
  {
    id: "ecos-aurora",
    authorId: "demo-sam-lume",
    title: "Ecos de Aurora",
    author: "Sam Lume",
    format: "Fanfiction",
    genre: "Aventura",
    tags: ["Universo Aurora", "Viagem"],
    synopsis:
      "Uma aventura derivada do universo fictício de demonstração Arquivo Aurora, contada pela tripulação de uma pequena nave postal.",
    createdAt: "2026-01-01",
    cover: 8,
    demo: true,
  },
];

export const demoAuthors = [
  { id: "demo-lia-mavume", username: "lia-mavume", displayName: "Lia Mavume" },
  { id: "demo-tomas-nilo", username: "tomas-nilo", displayName: "Tomás Nilo" },
  { id: "demo-iris-vale", username: "iris-vale", displayName: "Íris Vale" },
  { id: "demo-ren-aoki", username: "ren-aoki", displayName: "Ren Aoki" },
  { id: "demo-noa-senda", username: "noa-senda", displayName: "Noa Senda" },
  { id: "demo-davi-mar", username: "davi-mar", displayName: "Davi Mar" },
  { id: "demo-mila-sol", username: "mila-sol", displayName: "Mila Sol" },
  { id: "demo-sam-lume", username: "sam-lume", displayName: "Sam Lume" },
] as const;
