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
let client: SupabaseClient | null = null;
/** Lazy singleton: the previous integration is never imported. SDK alone owns token persistence. */
export function getAuthClient(): SupabaseClient | null {
  if (!authConfig.ready || typeof window === "undefined") return null;
  return (client ??= createClient(
    authConfig.url,
    authConfig.key,
    authClientOptions,
  ));
}
