import type { WorkReadingData } from "./types";
export const demoReadingLibrary: Record<string, WorkReadingData> = {};
export function getWorkReadingData(
  _workId: string,
  _format?: string,
  _title?: string,
  _author?: string,
): WorkReadingData | undefined {
  return undefined;
}
