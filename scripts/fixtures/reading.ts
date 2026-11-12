import { inauguralReading } from "./editorial-fixture";
export const demoReadingLibrary = inauguralReading;
export function getWorkReadingData(id: string, ..._args: string[]) {
  return inauguralReading[id];
}
