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
let browserController: AuthController | null = null;
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
  return (browserController ??= new AuthController(
    getAuthClient()?.auth ?? null,
    env,
    authConfig.ready ? undefined : authConfig.message,
  ));
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
export const useAuth = () => useContext(AuthContext);
export function AuthProvider({
  children,
  controller,
}: {
  children: ReactNode;
  controller?: AuthController;
}) {
  const [store] = useState(() => controller ?? getController());
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  useEffect(() => {
    void store.start();
    return store.stop;
  }, [store]);
  return (
    <AuthContext.Provider value={{ state, actions: store }}>
      {children}
    </AuthContext.Provider>
  );
}
