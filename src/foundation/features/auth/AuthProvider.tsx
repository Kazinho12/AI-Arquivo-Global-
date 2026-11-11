import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { AuthController, initialAuthState, type AuthState } from "./controller";
import { authConfig, getAuthClient } from "./client";
const controllerKey = Symbol.for("arquivo-global.auth-controller");
function getController(): AuthController {
  const origin =
    typeof window === "undefined" ? "http://localhost" : window.location.origin;
  const env = {
    origin,
    href: typeof window === "undefined" ? origin : window.location.href,
    replaceUrl: (path: string) => {
      if (typeof window !== "undefined")
        window.history.replaceState(window.history.state, "", path);
    },
    now: Date.now,
  };
  const create = () =>
    new AuthController(
      getAuthClient()?.auth ?? null,
      env,
      authConfig.ready ? undefined : authConfig.message,
    );
  if (typeof window === "undefined") return create();
  const scope = window as typeof window & { [controllerKey]?: AuthController };
  return (scope[controllerKey] ??= create());
}
export interface AuthContextValue {
  state: AuthState;
  actions: AuthController | null;
}
const fallback: AuthContextValue = {
  state: {
    ...initialAuthState,
    status: "configuration-error",
    error: "A autenticação ainda não está configurada neste ambiente.",
  },
  actions: null,
};
const AuthContext = createContext<AuthContextValue>(fallback);
const subscribeEmpty = () => () => {};
const bootState: AuthState = authConfig.ready
  ? initialAuthState
  : {
      ...initialAuthState,
      status: "configuration-error",
      error: authConfig.message,
    };
const getBootState = () => bootState;
export const useAuth = () => useContext(AuthContext);
export function AuthProvider({
  children,
  controller,
}: {
  children: ReactNode;
  controller?: AuthController;
}) {
  const [store, setStore] = useState<AuthController | null>(
    () => controller ?? null,
  );
  const state = useSyncExternalStore(
    store?.subscribe ?? subscribeEmpty,
    store?.getSnapshot ?? getBootState,
    controller ? controller.getSnapshot : getBootState,
  );
  useEffect(() => {
    // SDK construction starts recovery/timers. Never do it during render.
    const active = controller ?? getController();
    setStore(active);
    void active.start();
    return active.stop;
  }, [controller]);
  return (
    <AuthContext.Provider value={{ state, actions: store }}>
      {children}
    </AuthContext.Provider>
  );
}
