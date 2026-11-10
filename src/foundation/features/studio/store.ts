import { localId } from "../local/id";
import {
  bindScope,
  localSnapshot,
  useLocalCollection,
  notifyLocal,
  currentScope,
  readLocal,
  registerLocal,
  useLocalRevision,
  writeLocal,
} from "../local/persistence";
import { validCollection } from "../local/validation";
import type {
  StudioWork,
  EditorialActivity,
  StudioStats,
  MediaItem,
  WorkFormat,
} from "./types";
import type { Chapter } from "../reader/types";
import { demoReadingLibrary } from "../reader/data";

const STORAGE_KEY_WORKS = "ag_studio_works_v1";
const STORAGE_KEY_ACTIVITIES = "ag_studio_activities_v1";
const STORAGE_KEY_MEDIA = "ag_studio_media_v1";

const initialSeedWorks: StudioWork[] = [
  {
    id: "atlas-das-mares",
    title: "Atlas das marés esquecidas",
    subtitle: "Crónica de Porto-Vento",
    synopsis:
      "A cada maré-viva trinta anos depois do colapso, uma cidade submersa emerge ao largo de Porto-Vento. Uma cartógrafa desce ao cais para registar o que o mar esconde.",
    format: "Romance",
    mode: "prose",
    genre: "Ficção especulativa",
    language: "Português",
    tags: ["mar", "cartografia", "memória", "ficção especulativa"],
    ageRating: "Livre",
    contentWarnings: [],
    status: "published",
    coverAccentColor: "#0E2A47",
    coverStyle: "geometric",
    createdAt: "2026-02-14",
    updatedAt: "Hoje, às 09:30",
    chapters: demoReadingLibrary["atlas-das-mares"]?.chapters || [],
  },
  {
    id: "silencio-orbita",
    title: "O silêncio em órbita",
    subtitle: "Métrica das distâncias",
    synopsis:
      "Versos sobre distâncias astronómicas, corpos celestes e a lentidão com que a luz atravessa uma sala vazia.",
    format: "Poesia",
    mode: "poetry",
    genre: "Poesia contemporânea",
    language: "Português",
    tags: ["astronomia", "solidão", "física", "versos livres"],
    ageRating: "Livre",
    contentWarnings: [],
    status: "published",
    coverAccentColor: "#1B2233",
    coverStyle: "minimalist",
    createdAt: "2026-02-20",
    updatedAt: "Ontem",
    chapters: demoReadingLibrary["silencio-orbita"]?.chapters || [],
  },
  {
    id: "cidade-entre-linhas",
    title: "A cidade entre linhas",
    subtitle: "Volume 1: O código esquecido",
    synopsis:
      "No Setor 09 de uma metrópole cibernética, um ilustrador encontra um beco que não consta de nenhuma cartografia digital.",
    format: "HQ / Comic",
    mode: "comic",
    genre: "Ficção urbana",
    language: "Português",
    tags: ["cyberpunk", "arquitetura", "ilustração", "mistério"],
    ageRating: "+14",
    contentWarnings: ["Violência moderada"],
    status: "published",
    coverAccentColor: "#14243B",
    coverStyle: "illustrated",
    createdAt: "2026-02-28",
    updatedAt: "Há 3 dias",
    chapters: demoReadingLibrary["cidade-entre-linhas"]?.chapters || [],
  },
  {
    id: "jardim-lua",
    title: "O jardim da última lua",
    subtitle: "Ato I",
    synopsis:
      "Na colina dos cem pinheiros onde a noite se tornou eterna, uma jovem tenta proteger a seiva da flor primordial.",
    format: "Mangá",
    mode: "manga",
    genre: "Fantasia",
    language: "Português",
    tags: ["mangá", "fantasia", "folclore", "lua"],
    ageRating: "+12",
    contentWarnings: [],
    status: "published",
    coverAccentColor: "#171F2C",
    coverStyle: "monochrome",
    createdAt: "2026-03-02",
    updatedAt: "Há 5 dias",
    chapters: demoReadingLibrary["jardim-lua"]?.chapters || [],
  },
  {
    id: "o-porto-antigo",
    title: "Memórias do Porto Antigo",
    subtitle: "Rascunho de trabalho",
    synopsis:
      "Ensaio biográfico e ficcional sobre as antigas docas de madeira e os pescadores que guardavam histórias orais.",
    format: "Conto",
    mode: "prose",
    genre: "Realismo mágico",
    language: "Português",
    tags: ["porto", "memória", "tradição"],
    ageRating: "Livre",
    contentWarnings: [],
    status: "draft",
    coverAccentColor: "#2C3E50",
    coverStyle: "typographic",
    createdAt: "2026-03-08",
    updatedAt: "Hoje, às 08:15",
    chapters: [
      {
        id: "cap-1",
        number: 1,
        title: "I. As tábuas de pinho",
        content: `As tábuas do cais rangiam com o peso de passos lentos. Antes de o betão armado dominar a foz do rio, era sobre pinho resinoso que se descarregava o peixe salgado.\n\nManuel conhecia cada nó daquelas pranchas pelo nome do carpinteiro naval que as pregara com cavilhas de cobre.`,
      },
      {
        id: "cap-2",
        number: 2,
        title: "II. O farol que não piscava",
        content: `Na ponta do esporão, a lanterna de azeite dependia de vigia contínua. Não havia relógio automático: havia o cansaço dos olhos de quem sabia que uma bruma súbita podia encalhar uma chalupa em cinco minutos.`,
      },
    ],
  },
  {
    id: "caderno-de-versos",
    title: "Caderno das Horas Tardias",
    subtitle: "Rascunho poético",
    synopsis:
      "Coleção de apontamentos e versos sobre o silêncio da madrugada na cidade.",
    format: "Poesia",
    mode: "poetry",
    genre: "Poesia lírica",
    language: "Português",
    tags: ["noite", "silêncio", "urbano"],
    ageRating: "Livre",
    contentWarnings: [],
    status: "draft",
    coverAccentColor: "#1E2A38",
    coverStyle: "minimalist",
    createdAt: "2026-03-09",
    updatedAt: "Ontem",
    chapters: [
      {
        id: "cap-1",
        number: 1,
        title: "Primeira Vigília",
        stanzas: [
          [
            "A cidade apaga-se lâmpada a lâmpada,",
            "como quem recolhe as peças de um jogo cansado.",
          ],
          [
            "Fica apenas o som da chuva fina",
            "contra a folha de zinco da clarabóia.",
          ],
        ],
      },
      {
        id: "cap-2",
        number: 2,
        title: "Segunda Vigília",
        stanzas: [
          [
            "Escrever à noite é medir o peso",
            "das palavras que ninguém teve coragem de dizer ao dia.",
          ],
        ],
      },
    ],
  },
];

const initialSeedActivities: EditorialActivity[] = [
  {
    id: "act-1",
    workId: "atlas-das-mares",
    workTitle: "Atlas das marés esquecidas",
    type: "chapter_edit",
    description: "Capítulo 3 revisto e notas de cartografia adicionadas.",
    timestamp: "Hoje, às 09:30",
  },
  {
    id: "act-2",
    workId: "o-porto-antigo",
    workTitle: "Memórias do Porto Antigo",
    type: "draft_created",
    description: "Novo rascunho de conto iniciado.",
    timestamp: "Hoje, às 08:15",
  },
  {
    id: "act-3",
    workId: "caderno-de-versos",
    workTitle: "Caderno das Horas Tardias",
    type: "chapter_added",
    description: "Adicionado poema 'Segunda Vigília'.",
    timestamp: "Ontem",
  },
  {
    id: "act-4",
    workId: "cidade-entre-linhas",
    workTitle: "A cidade entre linhas",
    type: "page_added",
    description: "Prancha 4 (O Primeiro Traço) sequenciada.",
    timestamp: "Há 3 dias",
  },
];

const initialSeedMedia: MediaItem[] = [
  {
    id: "med-1",
    name: "capa_atlas_mares_grafica.svg",
    type: "cover",
    url: "/assets/covers/atlas.svg",
    size: "42 KB",
    dimensions: "1200 x 1600",
    workId: "atlas-das-mares",
    workTitle: "Atlas das marés esquecidas",
    createdAt: "2026-02-14",
  },
  {
    id: "med-2",
    name: "capa_silencio_orbita.svg",
    type: "cover",
    url: "/assets/covers/silencio.svg",
    size: "28 KB",
    dimensions: "1200 x 1600",
    workId: "silencio-orbita",
    workTitle: "O silêncio em órbita",
    createdAt: "2026-02-20",
  },
  {
    id: "med-3",
    name: "prancha_metropole_setor09.svg",
    type: "page",
    url: "/assets/plates/comic-p1.svg",
    size: "86 KB",
    dimensions: "1600 x 2400",
    workId: "cidade-entre-linhas",
    workTitle: "A cidade entre linhas",
    createdAt: "2026-02-28",
  },
];

registerLocal(STORAGE_KEY_WORKS, initialSeedWorks, (value) =>
  validCollection("works", value),
);
export const getStoredWorks = () => readLocal<StudioWork>(STORAGE_KEY_WORKS);
export const saveStoredWorks = (value: StudioWork[]) =>
  writeLocal(STORAGE_KEY_WORKS, value);

registerLocal(STORAGE_KEY_ACTIVITIES, initialSeedActivities, (value) =>
  validCollection("activities", value),
);
export const getStoredActivities = () =>
  readLocal<EditorialActivity>(STORAGE_KEY_ACTIVITIES);
export const saveStoredActivities = (value: EditorialActivity[]) =>
  writeLocal(STORAGE_KEY_ACTIVITIES, value);

registerLocal(STORAGE_KEY_MEDIA, initialSeedMedia, (value) =>
  validCollection("media", value),
);
export const getStoredMedia = () => readLocal<MediaItem>(STORAGE_KEY_MEDIA);
export const saveStoredMedia = (value: MediaItem[]) =>
  writeLocal(STORAGE_KEY_MEDIA, value);

const statsCache = new WeakMap<StudioWork[], StudioStats>();
export const studioStore = {
  getWorks: getStoredWorks,

  getWork(id: string): StudioWork | undefined {
    return getStoredWorks().find((w) => w.id === id);
  },

  createWork(
    workData: Omit<StudioWork, "id" | "createdAt" | "updatedAt"> & {
      id?: string;
    },
  ): StudioWork {
    const works = getStoredWorks();
    const id = workData.id || `obra-${localId()}`;
    const newWork: StudioWork = {
      ...workData,
      id,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: "Agora mesmo",
      chapters: workData.chapters || [
        {
          id: "cap-1",
          number: 1,
          title:
            workData.mode === "poetry"
              ? "Primeiro Poema"
              : workData.mode === "comic" || workData.mode === "manga"
                ? "Ato I"
                : "Capítulo 1",
          content:
            workData.mode === "poetry"
              ? undefined
              : "Começa aqui a escrever o primeiro capítulo da tua história...",
          stanzas:
            workData.mode === "poetry"
              ? [
                  [
                    "Escreve aqui o primeiro verso,",
                    "e a estrofe que inaugura a tua obra.",
                  ],
                ]
              : undefined,
          pages:
            workData.mode === "comic" || workData.mode === "manga"
              ? [
                  {
                    id: "p-1",
                    number: 1,
                    title: "Página de Abertura",
                    description: "Primeira cena da narrativa visual.",
                    aspectRatio: "3/4",
                    accentColor: "#1A2B44",
                    caption: "Página inicial de demonstração.",
                  },
                ]
              : undefined,
        },
      ],
    };
    works.unshift(newWork);
    saveStoredWorks(works);

    studioStore.addActivity(
      newWork.id,
      newWork.title,
      "draft_created",
      `Obra criada em formato ${newWork.format}.`,
    );

    return newWork;
  },

  updateWork(id: string, partial: Partial<StudioWork>): StudioWork | undefined {
    const works = getStoredWorks();
    const index = works.findIndex((w) => w.id === id);
    if (index < 0) return undefined;

    works[index] = {
      ...works[index],
      ...partial,
      updatedAt: "Agora mesmo",
    };
    saveStoredWorks(works);

    studioStore.addActivity(
      works[index].id,
      works[index].title,
      "metadata_update",
      "Metadados e configuração da obra atualizados.",
    );

    return works[index];
  },

  duplicateWork(id: string): StudioWork | undefined {
    const works = getStoredWorks();
    const source = works.find((w) => w.id === id);
    if (!source) return undefined;

    const copy: StudioWork = {
      ...source,
      id: `${source.id}-copia-${localId()}`,
      title: `${source.title} (Cópia)`,
      status: "draft",
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: "Agora mesmo",
      chapters: JSON.parse(JSON.stringify(source.chapters)),
    };
    works.unshift(copy);
    saveStoredWorks(works);

    studioStore.addActivity(
      copy.id,
      copy.title,
      "draft_created",
      `Cópia criada a partir de ${source.title}.`,
    );

    return copy;
  },

  deleteWork(id: string): boolean {
    const works = getStoredWorks();
    const remaining = works.filter((w) => w.id !== id);
    if (remaining.length === works.length) return false;
    saveStoredWorks(remaining);
    return true;
  },

  archiveWork(id: string): boolean {
    const works = getStoredWorks();
    const work = works.find((w) => w.id === id);
    if (!work) return false;
    work.status = work.status === "archived" ? "draft" : "archived";
    work.updatedAt = "Agora mesmo";
    saveStoredWorks(works);
    return true;
  },

  addChapter(workId: string, title?: string): Chapter | undefined {
    const works = getStoredWorks();
    const work = works.find((w) => w.id === workId);
    if (!work) return undefined;

    const nextNumber = work.chapters.length + 1;
    const newChapter: Chapter = {
      id: `cap-${localId()}`,
      number: nextNumber,
      title:
        title ||
        (work.mode === "poetry"
          ? `Poema ${nextNumber}`
          : `Capítulo ${nextNumber}`),
      content: work.mode === "poetry" ? undefined : "",
      stanzas: work.mode === "poetry" ? [["Novo verso..."]] : undefined,
      pages:
        work.mode === "comic" || work.mode === "manga"
          ? [
              {
                id: `p-${localId()}`,
                number: 1,
                title: "Nova Página",
                description: "Descrição visual da cena.",
                aspectRatio: "3/4",
                accentColor: "#1A2B44",
              },
            ]
          : undefined,
    };

    work.chapters.push(newChapter);
    work.updatedAt = "Agora mesmo";
    saveStoredWorks(works);

    studioStore.addActivity(
      work.id,
      work.title,
      "chapter_added",
      `Adicionado ${newChapter.title}.`,
    );

    return newChapter;
  },

  updateChapter(
    workId: string,
    chapterId: string,
    partial: Partial<Chapter>,
  ): Chapter | undefined {
    const works = getStoredWorks();
    const work = works.find((w) => w.id === workId);
    if (!work) return undefined;

    const chapterIndex = work.chapters.findIndex((c) => c.id === chapterId);
    if (chapterIndex < 0) return undefined;

    work.chapters[chapterIndex] = {
      ...work.chapters[chapterIndex],
      ...partial,
    };
    work.updatedAt = "Agora mesmo";
    saveStoredWorks(works);

    return work.chapters[chapterIndex];
  },

  reorderChapters(workId: string, newOrderChapterIds: string[]): boolean {
    const works = getStoredWorks();
    const work = works.find((w) => w.id === workId);
    if (!work) return false;

    const map = new Map(work.chapters.map((c) => [c.id, c]));
    if (
      newOrderChapterIds.length !== work.chapters.length ||
      new Set(newOrderChapterIds).size !== work.chapters.length ||
      newOrderChapterIds.some((id) => !map.has(id))
    )
      return false;
    const reordered: Chapter[] = [];
    newOrderChapterIds.forEach((id, idx) => {
      const c = map.get(id);
      if (c) {
        reordered.push({ ...c, number: idx + 1 });
      }
    });

    work.chapters = reordered;
    work.updatedAt = "Agora mesmo";
    saveStoredWorks(works);
    return true;
  },

  duplicateChapter(workId: string, chapterId: string): Chapter | undefined {
    const works = getStoredWorks();
    const work = works.find((w) => w.id === workId);
    if (!work) return undefined;

    const source = work.chapters.find((c) => c.id === chapterId);
    if (!source) return undefined;

    const copy: Chapter = {
      ...JSON.parse(JSON.stringify(source)),
      id: `cap-${localId()}`,
      number: work.chapters.length + 1,
      title: `${source.title} (Cópia)`,
    };
    work.chapters.push(copy);
    work.updatedAt = "Agora mesmo";
    saveStoredWorks(works);
    return copy;
  },

  deleteChapter(workId: string, chapterId: string): boolean {
    const works = getStoredWorks();
    const work = works.find((w) => w.id === workId);
    if (!work || work.chapters.length <= 1) return false; // keep at least 1 chapter

    work.chapters = work.chapters
      .filter((c) => c.id !== chapterId)
      .map((c, idx) => ({ ...c, number: idx + 1 }));
    work.updatedAt = "Agora mesmo";
    saveStoredWorks(works);
    return true;
  },

  // Pages for Visual works
  addPage(workId: string, chapterId: string, pageData?: any): any {
    const works = getStoredWorks();
    const work = works.find((w) => w.id === workId);
    if (!work) return undefined;

    const chapter = work.chapters.find((c) => c.id === chapterId);
    if (!chapter) return undefined;

    chapter.pages = chapter.pages || [];
    const newPage = {
      id: `p-${localId()}`,
      number: chapter.pages.length + 1,
      title: pageData?.title || `Página ${chapter.pages.length + 1}`,
      description:
        pageData?.description ||
        "Descrição de cena e composição de enquadramento.",
      aspectRatio: "3/4",
      accentColor: pageData?.accentColor || "#1E2A38",
      caption: pageData?.caption || "",
      imageUrl: pageData?.imageUrl,
    };
    chapter.pages.push(newPage);
    work.updatedAt = "Agora mesmo";
    saveStoredWorks(works);

    studioStore.addActivity(
      work.id,
      work.title,
      "page_added",
      `Adicionada ${newPage.title}.`,
    );

    return newPage;
  },

  updatePage(
    workId: string,
    chapterId: string,
    pageId: string,
    partial: any,
  ): any {
    const works = getStoredWorks();
    const work = works.find((w) => w.id === workId);
    if (!work) return undefined;

    const chapter = work.chapters.find((c) => c.id === chapterId);
    if (!chapter || !chapter.pages) return undefined;

    const pageIndex = chapter.pages.findIndex((p) => p.id === pageId);
    if (pageIndex < 0) return undefined;

    chapter.pages[pageIndex] = {
      ...chapter.pages[pageIndex],
      ...partial,
    };
    work.updatedAt = "Agora mesmo";
    saveStoredWorks(works);

    return chapter.pages[pageIndex];
  },

  reorderPages(
    workId: string,
    chapterId: string,
    newOrderPageIds: string[],
  ): boolean {
    const works = getStoredWorks();
    const work = works.find((w) => w.id === workId);
    if (!work) return false;

    const chapter = work.chapters.find((c) => c.id === chapterId);
    if (!chapter || !chapter.pages) return false;

    const map = new Map(chapter.pages.map((p) => [p.id, p]));
    if (
      newOrderPageIds.length !== chapter.pages.length ||
      new Set(newOrderPageIds).size !== chapter.pages.length ||
      newOrderPageIds.some((id) => !map.has(id))
    )
      return false;
    const reordered: any[] = [];
    newOrderPageIds.forEach((id, idx) => {
      const p = map.get(id);
      if (p) {
        reordered.push({ ...p, number: idx + 1 });
      }
    });

    chapter.pages = reordered;
    work.updatedAt = "Agora mesmo";
    saveStoredWorks(works);
    return true;
  },

  deletePage(workId: string, chapterId: string, pageId: string): boolean {
    const works = getStoredWorks();
    const work = works.find((w) => w.id === workId);
    if (!work) return false;

    const chapter = work.chapters.find((c) => c.id === chapterId);
    if (!chapter || !chapter.pages || chapter.pages.length <= 1) return false;

    chapter.pages = chapter.pages
      .filter((p) => p.id !== pageId)
      .map((p, idx) => ({ ...p, number: idx + 1 }));
    work.updatedAt = "Agora mesmo";
    saveStoredWorks(works);
    return true;
  },

  getActivities: getStoredActivities,

  addActivity(
    workId: string,
    workTitle: string,
    type: EditorialActivity["type"],
    description: string,
  ) {
    const activities = getStoredActivities();
    const newAct: EditorialActivity = {
      id: `act-${localId()}`,
      workId,
      workTitle,
      type,
      description,
      timestamp: "Agora mesmo",
    };
    activities.unshift(newAct);
    if (activities.length > 25) activities.pop();
    saveStoredActivities(activities);
  },

  getMediaItems: getStoredMedia,

  addMediaItem(item: Omit<MediaItem, "id" | "createdAt">): MediaItem {
    const media = getStoredMedia();
    const newItem: MediaItem = {
      ...item,
      id: `med-${localId()}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    media.unshift(newItem);
    saveStoredMedia(media);
    return newItem;
  },

  deleteMediaItem(id: string): boolean {
    const media = getStoredMedia();
    const item = media.find((m) => m.id === id);
    if (
      item &&
      item.isLocalObjectUrl &&
      typeof window !== "undefined" &&
      window.URL
    ) {
      try {
        window.URL.revokeObjectURL(item.url);
      } catch {
        // ignore
      }
    }
    const remaining = media.filter((m) => m.id !== id);
    saveStoredMedia(remaining);
    return true;
  },

  getStats(): StudioStats {
    const works = localSnapshot<StudioWork>(STORAGE_KEY_WORKS);
    const cached = statsCache.get(works);
    if (cached) return cached;
    const totalWorks = works.length;
    const draftsCount = works.filter((w) => w.status === "draft").length;
    const publishedCount = works.filter((w) => w.status === "published").length;

    let totalWords = 0;
    let totalChapters = 0;

    works.forEach((w) => {
      totalChapters += w.chapters.length;
      w.chapters.forEach((c) => {
        if (c.content) {
          totalWords += c.content.trim().split(/\s+/).filter(Boolean).length;
        } else if (c.stanzas) {
          c.stanzas.forEach((stanza) => {
            stanza.forEach((verse) => {
              totalWords += verse.trim().split(/\s+/).filter(Boolean).length;
            });
          });
        }
      });
    });

    const estimatedReads = publishedCount * 480 + draftsCount * 12;
    const avgReadTimeMinutes = Math.max(1, Math.round(totalWords / 200));

    const stats = {
      totalWorks,
      draftsCount,
      publishedCount,
      totalWords,
      totalChapters,
      estimatedReads,
      avgReadTimeMinutes,
    };
    statsCache.set(works, stats);
    return stats;
  },
};

export function useStudio() {
  const works = useLocalCollection<StudioWork>(STORAGE_KEY_WORKS);
  const activities = useLocalCollection<EditorialActivity>(
    STORAGE_KEY_ACTIVITIES,
  );
  const media = useLocalCollection<MediaItem>(STORAGE_KEY_MEDIA);
  return {
    works,
    activities,
    media,
    stats: studioStore.getStats(),
    store: bindScope(studioStore, currentScope()),
    refresh: notifyLocal,
  };
}
