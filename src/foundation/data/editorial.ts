import type { Work } from "./works";
export interface EditorialSelection {
  id: string;
  label: string;
  title: string;
  description: string;
  workIds: readonly string[];
}
export const editorialSelections: readonly EditorialSelection[] = [];
export function selectEditorialWorks(
  works: readonly Work[],
  selection: EditorialSelection,
): Work[] {
  return selection.workIds.flatMap((id) => {
    const work = works.find((w) => w.id === id);
    return work ? [work] : [];
  });
}
