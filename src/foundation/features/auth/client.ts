import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readAuthConfig } from "./config";
export const authConfig = readAuthConfig({
  VITE_SUPABASE_URL: import.meta.env?.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY,
});
export const authClientOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    flowType: "pkce" as const,
    detectSessionInUrl: false,
  },
};
// A module-local singleton is recreated by Vite HMR. Keep one SDK per project
// in this browser realm; different tabs still coordinate through SDK Web Locks.
export interface AuthClientRegistry {
  [project: string]: SupabaseClient | undefined;
}
export function sharedAuthClient(
  registry: AuthClientRegistry,
  config: typeof authConfig,
  factory: typeof createClient = createClient,
): SupabaseClient | null {
  if (!config.ready) return null;
  const project = new URL(config.url).origin;
  return (registry[project] ??= factory(
    config.url,
    config.key,
    authClientOptions,
  ));
}
const registryKey = Symbol.for("arquivo-global.auth-clients");
export function getAuthClient(): SupabaseClient | null {
  if (!authConfig.ready || typeof window === "undefined") return null;
  const scope = window as typeof window & {
    [registryKey]?: AuthClientRegistry;
  };
  return sharedAuthClient(
    (scope[registryKey] ??= Object.create(null)),
    authConfig,
  );
}
