import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Validação das variáveis de ambiente necessárias para a integração com o Supabase.
 */
export const missingSupabaseEnvVars: string[] = [];
if (!supabaseUrl) {
  missingSupabaseEnvVars.push('VITE_SUPABASE_URL');
}
if (!supabaseAnonKey) {
  missingSupabaseEnvVars.push('VITE_SUPABASE_PUBLISHABLE_KEY');
}

export const isSupabaseConfigured = missingSupabaseEnvVars.length === 0;

if (!isSupabaseConfigured) {
  console.error(
    `[Arquivo Global — Supabase] Erro de Configuração: variáveis de ambiente em falta:\n` +
    missingSupabaseEnvVars.map((v) => ` - ${v}`).join('\n') +
    `\n\nO cliente Supabase não foi inicializado. ` +
    `Certifica-te de que definiste estas variáveis no ficheiro .env.local ou através do painel de Secrets do ambiente.`
  );
}

/**
 * Cliente Supabase inicializado para o Arquivo Global.
 * Só é instanciado quando ambas as variáveis de ambiente necessárias estão presentes,
 * evitando a inicialização com valores fictícios ou URLs de contingência.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
