import { inauguralReading } from "../../data/inaugural";
import type { WorkReadingData } from "./types";
/** Compatibility export; all content is canonical editorial data, not fabricated fallback. */
export const demoReadingLibrary = inauguralReading;
export function getWorkReadingData(
  workId: string,
  _format?: string,
  _title?: string,
  _author?: string,
): WorkReadingData | undefined {
  return inauguralReading[workId];
}
