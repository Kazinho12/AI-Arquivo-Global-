/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Work, Author, ColorToken } from '../types';

export const COLOR_TOKENS: ColorToken[] = [
  {
    name: 'Azul Abissal',
    namePt: 'Fundo Primário (Dark)',
    hex: '#0B1220',
    role: 'Cor de base e profundidade para o tema escuro. Evoca a serenidade do oceano profundo e os arquivos históricos silenciosos.',
    textRole: 'Utilizada como texto de alto contraste no tema claro (#F8FAFC).',
    wcagContrast: '15.8:1 contra texto #F8FAFC (AAA)',
  },
  {
    name: 'Azul Noturno',
    namePt: 'Superfície & Cartões',
    hex: '#14243B',
    role: 'Superfícies de cartões, barras de navegação secundárias e divisões modulares no tema escuro.',
    textRole: 'Hierarquia secundária de fundo para dar volumetria sem ruído.',
    wcagContrast: '11.4:1 contra texto #F8FAFC (AAA)',
  },
  {
    name: 'Azul Profundo',
    namePt: 'Bordas & Realces Sutis',
    hex: '#203B5C',
    role: 'Linhas divisórias (hairline borders), estados de foco, caixas de seleção ativas e acentos estruturais.',
    textRole: 'Contraste estrutural equilibrado para interfaces densas e editoriais.',
    wcagContrast: '6.2:1 contra texto #F8FAFC (AA)',
  },
  {
    name: 'Prata',
    namePt: 'Tipografia Secundária & Metadados',
    hex: '#BFC9D6',
    role: 'Metadados, tempos de leitura, datas, nomes de autores e ícones secundários.',
    textRole: 'Legibilidade suave que descansa os olhos durante longas leituras no escuro.',
    wcagContrast: '7.8:1 contra fundo #0B1220 (AAA)',
  },
  {
    name: 'Gelo',
    namePt: 'Superfície (Light) & Iluminação',
    hex: '#E7EDF5',
    role: 'Fundo de componentes e cartões no tema claro; acento de brilho frio no tema escuro.',
    textRole: 'Garante transição suave de luminância entre o branco puro e as bordas.',
    wcagContrast: '13.2:1 contra texto #0B1220 (AAA)',
  },
  {
    name: 'Branco',
    namePt: 'Texto Principal (Dark) / Fundo (Light)',
    hex: '#F8FAFC',
    role: 'Fundo principal no tema claro e cor de títulos/texto primário no tema escuro.',
    textRole: 'Alabastro óptico calibrado para evitar o ofuscamento do branco puro (#FFFFFF).',
    wcagContrast: '16.1:1 contra fundo #0B1220 (AAA)',
  },
];

export const MOCK_AUTHORS: Author[] = [
  {
    id: 'aut-01',
    name: 'Eleanor Vance',
    handle: '@eleanor.vance',
    bio: 'Escritora e investigadora oceanográfica. Escreve ficção especulativa e crónicas ambientais sobre o litoral atlântico.',
    role: 'Romancista & Ensaísta',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    location: 'Porto, Portugal',
    worksCount: 4,
    followersCount: 1420,
    featuredWorkTitle: 'O Último Farol Abissal',
  },
  {
    id: 'aut-02',
    name: 'Kaito Sato',
    handle: '@kaito.manga',
    bio: 'Mangaká independente radicado em Lisboa. Explora narrativas seinen com foco em realismo urbano, silêncios e futuros próximos.',
    role: 'Mangaká & Ilustrador',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    location: 'Lisboa, Portugal',
    worksCount: 6,
    followersCount: 2890,
    featuredWorkTitle: 'Eco da Fenda',
  },
  {
    id: 'aut-03',
    name: 'Valentin Rouge',
    handle: '@valentin.bd',
    bio: 'Roteirista de banda desenhada e arquiteto de formação. Combina traço europeu contemporâneo com suspense sociopolítico.',
    role: 'Autor de Banda Desenhada',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    location: 'Bruxelas / Coimbra',
    worksCount: 3,
    followersCount: 950,
    featuredWorkTitle: 'A Sombra da Chuva',
  },
  {
    id: 'aut-04',
    name: 'Clara von Holst',
    handle: '@clara.poesia',
    bio: 'Poeta e tradutora literária. Autora de três coletâneas minimalistas sobre memória, pedra e acústica das marés.',
    role: 'Poeta & Tradutora',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    location: 'Funchal, Madeira',
    worksCount: 5,
    followersCount: 1680,
    featuredWorkTitle: 'Círculos de Prata',
  },
];

export const MOCK_WORKS: Work[] = [
  {
    id: 'work-01',
    title: 'O Último Farol Abissal',
    author: 'Eleanor Vance',
    authorId: 'aut-01',
    format: 'romance',
    genres: ['Ficção Científica', 'Mistério', 'Ecológico'],
    contentWarnings: ['Claustrofobia', 'Isolamento'],
    ageRating: '14',
    status: 'ongoing',
    coverUrl: '/src/assets/images/capa_romance_abissal_1794056226841.jpg',
    isDemoCover: true,
    synopsis: 'A trezentos metros abaixo da superfície da Fossa de Cascais, o farol submerso Estação Éter continua a emitir coordenadas desconhecidas. Uma bióloga solitária e o último operador do Arquivo procuram a fonte antes que o corte de energia condene a costa.',
    chaptersCount: 18,
    readTime: '4h 30m',
    publishedAt: '12 Out 2026',
    updatedAt: 'Há 3 dias',
    rating: 4.9,
    viewsCount: 14850,
    likesCount: 1230,
    license: 'CC BY-NC-ND 4.0 (Arquivo Global)',
    sampleExcerpt: {
      chapterTitle: 'Capítulo I — A Frequência Silenciosa',
      text: [
        'A água fria do canal vibrava não com som, mas com uma pressão seca contra o casco do módulo.',
        'Eleanor ajustou o manómetro de bronze. Os ponteiros oscilavam no mesmo ritmo cadenciado há sete meses: três pulsares curtos, seguidos por uma pausa de quatro segundos.',
        '— Se alguém estiver a ouvir do outro lado da plataforma continental — murmurou ela para o registador magnético —, digam-lhes que a luz ainda não se apagou.',
        'Do lado de fora da vigia reforçada, a escuridão abissal abriu-se numa fenda de bioluminescência prateada.'
      ]
    }
  },
  {
    id: 'work-02',
    title: 'Eco da Fenda (裂け目の残響)',
    author: 'Kaito Sato',
    authorId: 'aut-02',
    format: 'manga',
    genres: ['Seinen', 'Sobrenatural', 'Urbano'],
    contentWarnings: ['Violência moderada', 'Temas psicológicos'],
    ageRating: '16',
    status: 'ongoing',
    coverUrl: '/src/assets/images/capa_manga_guardioes_1794056230213.jpg',
    isDemoCover: true,
    synopsis: 'Nas noites de chuva intensa sobre os terraços da baixa metropolitana, fraturas celestes revelam memórias de pessoas que nunca existiram. Ren, um restaurador de livros antigos, começa a desenhar as fendas antes que elas se fechem.',
    chaptersCount: 24,
    readTime: '3h 15m',
    publishedAt: '03 Ago 2026',
    updatedAt: 'Ontem',
    rating: 4.8,
    viewsCount: 28400,
    likesCount: 3120,
    license: 'Direitos Reservados ao Criador',
    sampleExcerpt: {
      chapterTitle: 'Ato I — Linhas de Tinta e Chuva',
      text: [
        '[Quadro 1]: Panorâmica dos telhados molhados da cidade. Reflexos de luz azul nas poças de asfalto.',
        '[Quadro 2]: Ren sobre o parapeito de betão, segurando um caderno com folhas de papel de algodão.',
        '[Quadro 3]: Um relâmpago silencioso rasga o céu, revelando a silhueta geométrica de uma torre invertida nas nuvens.',
        '— Não é uma ilusão de ótica. O céu está a rachar.'
      ]
    }
  },
  {
    id: 'work-03',
    title: 'A Sombra da Chuva',
    author: 'Valentin Rouge',
    authorId: 'aut-03',
    format: 'hq',
    genres: ['Noir', 'Drama', 'Histórico Alternativo'],
    contentWarnings: ['Armas de fogo', 'Conspiração política'],
    ageRating: '16',
    status: 'completed',
    coverUrl: '/src/assets/images/capa_hq_distopia_1794056228920.jpg',
    isDemoCover: true,
    synopsis: 'Numa cidade portuária europeia onde a chuva nunca cessa desde o Grande Nevoeiro de 1958, uma arquivista descobre plantas de edifícios que foram apagados dos registos oficiais da municipalidade.',
    chaptersCount: 12,
    readTime: '1h 45m',
    publishedAt: '15 Fev 2026',
    updatedAt: 'Concluído',
    rating: 4.7,
    viewsCount: 9200,
    likesCount: 840,
    license: 'CC BY-NC 4.0',
    sampleExcerpt: {
      chapterTitle: 'Parte I — O Elétrico das 22h',
      text: [
        'A calçada brilhava como estanho derretido sob as lâmpadas a gás dos quiosques.',
        'Hélène fechou o guarda-chuva ao entrar na livraria Le Hibou. O aroma a café frio e encadernações de couro húmidas era o único refúgio seguro daquele bairro.',
        '— Encontrou os mapas da ala norte? — perguntou o livreiro em voz baixa, sem levantar os olhos da prensa de xilogravura.',
        '— Encontrei mais do que isso. Encontrei a lista dos nomes que foram retirados do censo.'
      ]
    }
  },
  {
    id: 'work-04',
    title: 'Círculos de Prata',
    author: 'Clara von Holst',
    authorId: 'aut-04',
    format: 'poesia',
    genres: ['Contemporâneo', 'Filosófico', 'Lírico'],
    contentWarnings: [],
    ageRating: 'L',
    status: 'completed',
    coverUrl: '/src/assets/images/capa_poesia_silencio_1794056228622.jpg',
    isDemoCover: true,
    synopsis: 'Uma coletânea de quarenta e dois poemas curtos dedicados à passagem do tempo, à geometria da ausência e à quietude dos arquipélagos atlânticos.',
    chaptersCount: 42,
    readTime: '45 min',
    publishedAt: '28 Set 2026',
    updatedAt: 'Concluído',
    rating: 4.95,
    viewsCount: 6300,
    likesCount: 910,
    license: 'Domínio Público / Aberto',
    sampleExcerpt: {
      chapterTitle: 'Canto VII — Maré de Vidro',
      text: [
        'Não há peso na pedra que a água esquece.',
        'Entre o azul do fundo',
        'e a prata da margem,',
        'o silêncio não pede licença para existir:',
        'apenas respira.'
      ]
    }
  },
  {
    id: 'work-05',
    title: 'O Relojoeiro de Sintra',
    author: 'Duarte Mendonça',
    authorId: 'aut-05',
    format: 'conto',
    genres: ['Realismo Mágico', 'Ficção Histórica'],
    contentWarnings: ['Luto / Perda familiar'],
    ageRating: '12',
    status: 'completed',
    coverUrl: '', // Procedural styled graphic
    isDemoCover: true,
    synopsis: 'Uma oficina na encosta da serra onde os relógios não medem minutos, mas a intensidade dos reencontros entre pessoas que partiram sem se despedir.',
    chaptersCount: 3,
    readTime: '30 min',
    publishedAt: '18 Out 2026',
    updatedAt: 'Concluído',
    rating: 4.6,
    viewsCount: 4100,
    likesCount: 380,
    license: 'CC BY-NC-SA 4.0',
    sampleExcerpt: {
      chapterTitle: 'Conto — A Engrenagem de Quartzo',
      text: [
        'Mestre Amaro desmontava o escape com uma pinça de titânio tão fina que quase se confundia com um fio de teia de aranha.',
        '— O tempo não corre em linha reta nesta serra, rapaz. Quem te disse isso nunca tentou subir a Pena com nevoeiro cerrado.'
      ]
    }
  },
  {
    id: 'work-06',
    title: 'Arquivos do Século Submerso',
    author: 'Inês Calheiros & Tomás Brito',
    authorId: 'aut-06',
    format: 'hq',
    genres: ['Ficção Científica', 'Aventura', 'Exploração'],
    contentWarnings: ['Perigo ambiental'],
    ageRating: '12',
    status: 'ongoing',
    coverUrl: '',
    isDemoCover: true,
    synopsis: 'Crónicas visuais de duas mergulhadoras cartógrafas encarregadas de mapear as antigas bibliotecas submersas do estuário do Tejo no ano 2140.',
    chaptersCount: 8,
    readTime: '1h 10m',
    publishedAt: '01 Nov 2026',
    updatedAt: 'Há 5 dias',
    rating: 4.85,
    viewsCount: 8900,
    likesCount: 1100,
    license: 'CC BY-NC 4.0',
    sampleExcerpt: {
      chapterTitle: 'Prólogo — Abaixo dos Pilares',
      text: [
        '[Prancha 1]: Sonar acústico desenha a cúpula octogonal de um claustro a quarenta metros de profundidade.',
        '— Oxigénio estável a 82%. Tomás, acende os projetores de proa.',
        'Feixes de luz esmeralda cortam a água, iluminando estantes de granito cheias de cilindros de vidro lacrados.'
      ]
    }
  }
];

export const FORMAT_LABELS: Record<string, { label: string; count: number; description: string }> = {
  all: { label: 'Todos os Formatos', count: 6, description: 'Catálogo integral de obras independentes' },
  romance: { label: 'Romances', count: 1, description: 'Narrativas longas, sagas e ficção estruturada' },
  conto: { label: 'Contos', count: 1, description: 'Ficção concisa e histórias em dose única' },
  poesia: { label: 'Poesia', count: 1, description: 'Versos, métrica contemporânea e poesia visual' },
  hq: { label: 'Banda Desenhada / HQ', count: 2, description: 'Narrativas gráficas, webcomics e romances ilustrados' },
  manga: { label: 'Mangás', count: 1, description: 'Quadrinhos de inspiração oriental e estética seinen/shonen' },
};

export const AGE_RATINGS_INFO = [
  { code: 'L', label: 'Livre', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700/50', description: 'Adequado para todos os públicos' },
  { code: '12', label: '12+', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-700/50', description: 'Não recomendado para menores de 12 anos' },
  { code: '14', label: '14+', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700/50', description: 'Não recomendado para menores de 14 anos' },
  { code: '16', label: '16+', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-700/50', description: 'Não recomendado para menores de 16 anos' },
  { code: '18', label: '18+', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700/50', description: 'Conteúdo estritamente para maiores de 18 anos' },
];
