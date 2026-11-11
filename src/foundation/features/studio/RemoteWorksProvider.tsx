import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useAuth } from "../auth/AuthProvider";
import { getAuthClient } from "../auth/client";
import { createWorksRepository } from "./worksRepository";
import { WorksController } from "./worksController";
import type { StudioWork } from "./types";
const Context = createContext<WorksController | null>(null);
export function RemoteWorksProvider({
  children,
  controller,
}: {
  children: ReactNode;
  controller?: WorksController;
}) {
  const { state } = useAuth();
  // Match LocalDataBoundary: a transient Auth network error retains the last
  // known identity and unsaved buffers. Every server operation still validates JWT.
  const ownerId =
    state.status === "authenticated" || state.status === "operational-error"
      ? state.user?.id
      : undefined;
  const store = useMemo(
    () =>
      controller ??
      (ownerId
        ? new WorksController(createWorksRepository(getAuthClient(), ownerId))
        : null),
    [controller, ownerId],
  );
  useEffect(() => {
    if (!store) return;
    void store.load();
    return store.stop;
  }, [store]);
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
const empty = {
  works: [] as StudioWork[],
  loading: false,
  saving: false,
  loaded: false,
  error: "",
};
const subscribeEmpty = () => () => {};
const getEmpty = () => empty;
export function useRemoteWorks() {
  const controller = useContext(Context);
  const state = useSyncExternalStore(
    controller?.subscribe ?? subscribeEmpty,
    controller?.getSnapshot ?? getEmpty,
    controller?.getSnapshot ?? getEmpty,
  );
  return { ...state, controller, enabled: Boolean(controller) };
}
