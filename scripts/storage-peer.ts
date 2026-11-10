import {
  selectScope,
  flushLocal,
  localWarnings,
} from "../src/foundation/features/local/persistence";
import { studioStore } from "../src/foundation/features/studio/store";
declare global {
  interface Window {
    agPeer: (request: {
      scope: string;
      action: string;
      id?: string;
      title?: string;
    }) => unknown;
  }
}
let storageEvents = 0;
window.addEventListener("storage", () => {
  storageEvents++;
});
window.agPeer = (request) => {
  selectScope(request.scope);
  if (request.action === "edit" && request.id) {
    studioStore.updateWork(request.id, { title: request.title });
    flushLocal();
  }
  return {
    works: studioStore.getWorks(),
    storageEvents,
    warnings: localWarnings(),
  };
};
