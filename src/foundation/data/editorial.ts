import type { Work } from "./works";
export interface EditorialSelection {
  id: string;
  label: string;
  title: string;
  description: string;
  workIds: readonly string[];
}
/** Curated demo IDs, never engagement-based ranks or recommendations about real readers. */
export const editorialSelections: readonly EditorialSelection[] = [
  {
    id: "alem-do-horizonte",
    label: "MUNDOS POSSÍVEIS",
    title: "Para lá do horizonte",
    description:
      "Mapas, estações e cidades que abrem caminho para o desconhecido.",
    workIds: [
      "atlas-das-mares",
      "cidade-entre-linhas",
      "arquivo-aurora",
      "ecos-aurora",
    ],
  },
  {
    id: "entre-silencios",
    label: "PALAVRAS QUE FICAM",
    title: "Entre o silêncio e a memória",
    description: "Uma pausa para histórias que vivem nas pequenas coisas.",
    workIds: ["silencio-orbita", "casa-chuva"],
  },
  {
    id: "universos-desenhados",
    label: "NARRATIVAS VISUAIS",
    title: "Universos desenhados",
    description: "Traços, criaturas e jardins que contam de outra maneira.",
    workIds: ["jardim-lua", "bestias-tinta", "cidade-entre-linhas"],
  },
];
export function selectEditorialWorks(
  works: readonly Work[],
  selection: EditorialSelection,
): Work[] {
  return selection.workIds.flatMap((id) => {
    const work = works.find((w) => w.id === id);
    return work ? [work] : [];
  });
}
