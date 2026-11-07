/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabase';

/**
 * Endereço base do Cloudflare Worker do Arquivo Global
 */
export const WORKER_API_BASE_URL = 'https://arquivo-global-api.killiandesigner.workers.dev';

/**
 * Representação do utilizador autenticado retornada pelo Cloudflare Worker
 */
export interface WorkerAuthUser {
  id: string;
  email: string | null;
}

/**
 * Contrato de sucesso do endpoint /auth/me
 */
export interface WorkerAuthMeSuccessResponse {
  authenticated: true;
  user: WorkerAuthUser;
}

/**
 * Formato de resposta de erro emitida pelo Worker (ex.: { error: "Unauthorized" })
 */
export interface WorkerErrorResponse {
  error?: string;
  message?: string;
  authenticated?: false;
  [key: string]: unknown;
}

/**
 * Tipagem discriminada do resultado da chamada HTTP à API
 */
export type ApiAuthMeResult =
  | { success: true; status: 200; data: WorkerAuthMeSuccessResponse }
  | { success: false; status: 'unauthenticated'; message: string }
  | { success: false; status: 'client_unconfigured'; message: string }
  | { success: false; status: 401; message: string; details?: WorkerErrorResponse }
  | { success: false; status: 404; message: string; details?: WorkerErrorResponse }
  | { success: false; status: 500; message: string; details?: WorkerErrorResponse }
  | { success: false; status: 503; message: string; details?: WorkerErrorResponse }
  | { success: false; status: 'network_error'; message: string; error?: string };

/**
 * Obtém os dados do utilizador autenticado a partir do Cloudflare Worker (/auth/me),
 * encaminhando o access_token gerado pelo Supabase Auth.
 * 
 * Regras:
 * - Se não houver sessão ativa, aborta antes de disparar qualquer pedido HTTP.
 * - Não imprime tokens nem dados sensíveis nos registos de consola.
 * - Trata erros de rede, bloqueios CORS e respostas HTTP 401, 404, 500 e 503.
 */
export async function getAuthenticatedUserFromAPI(): Promise<ApiAuthMeResult> {
  if (!supabase) {
    return {
      success: false,
      status: 'client_unconfigured',
      message: 'Cliente Supabase não está configurado no ambiente.',
    };
  }

  try {
    // 1. Obter a sessão atual do Supabase
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session?.access_token) {
      return {
        success: false,
        status: 'unauthenticated',
        message: 'Nenhuma sessão ativa encontrada no Supabase. Inicie sessão para obter um token válido.',
      };
    }

    const accessToken = data.session.access_token;

    // 2. Disparar o pedido GET para /auth/me passando o token no cabeçalho Authorization
    const response = await fetch(`${WORKER_API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    let jsonBody: unknown = null;
    try {
      jsonBody = await response.json();
    } catch {
      // Resposta sem corpo JSON
    }

    // 3. Sucesso (HTTP 200)
    if (response.ok && response.status === 200) {
      return {
        success: true,
        status: 200,
        data: jsonBody as WorkerAuthMeSuccessResponse,
      };
    }

    const errorPayload = (jsonBody && typeof jsonBody === 'object' ? jsonBody : {}) as WorkerErrorResponse;
    const errorMessage =
      errorPayload.error || errorPayload.message || response.statusText || 'Erro na resposta do Worker';

    // 4. Tratamento de códigos de erro específicos
    if (response.status === 401) {
      return {
        success: false,
        status: 401,
        message: `Não autorizado (401): ${errorMessage}`,
        details: errorPayload,
      };
    }

    if (response.status === 404) {
      return {
        success: false,
        status: 404,
        message: `Rota não encontrada no Worker (404): ${errorMessage}`,
        details: errorPayload,
      };
    }

    if (response.status === 500) {
      return {
        success: false,
        status: 500,
        message: `Erro interno no servidor do Worker (500): ${errorMessage}`,
        details: errorPayload,
      };
    }

    if (response.status === 503) {
      return {
        success: false,
        status: 503,
        message: `Serviço temporariamente indisponível no Worker (503): ${errorMessage}`,
        details: errorPayload,
      };
    }

    return {
      success: false,
      status: 'network_error',
      message: `Código HTTP inesperado (${response.status}): ${errorMessage}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      status: 'network_error',
      message:
        'Falha na comunicação de rede ou bloqueio por CORS. ' +
        'Certifica-te de que o Worker aceita a origem desta aplicação e responde aos pedidos OPTIONS preflight.',
      error: message,
    };
  }
}

// Extensão global para TypeScript reconhecer a função de teste em window
declare global {
  interface Window {
    agTestAuthMe?: () => Promise<ApiAuthMeResult>;
  }
}

// Em desenvolvimento, disponibiliza a função na consola do navegador sem disparar pedidos automáticos
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.agTestAuthMe = async () => {
    console.info('[Arquivo Global — API Test] A testar endpoint /auth/me do Cloudflare Worker...');
    const result = await getAuthenticatedUserFromAPI();
    console.info('[Arquivo Global — API Test] Resultado:', result);
    return result;
  };
}
