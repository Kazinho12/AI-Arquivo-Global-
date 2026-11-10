import type { Work } from "./works";
import { inauguralCollections } from "./inaugural";
export interface EditorialSelection {
  id: string;
  label: string;
  title: string;
  description: string;
  workIds: readonly string[];
}
export const editorialSelections: readonly EditorialSelection[] =
  inauguralCollections.map((c) => ({
    id: c.id,
    label: "SELEÇÃO DA EQUIPA EDITORIAL",
    title: c.title,
    description: c.description,
    workIds: c.workIds,
  }));
export function selectEditorialWorks(
  works: readonly Work[],
  selection: EditorialSelection,
): Work[] {
  return selection.workIds.flatMap((id) => {
    const work = works.find((w) => w.id === id);
    return work ? [work] : [];
  });
}
