/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { getAuthenticatedUserFromAPI, type ApiAuthMeResult } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';

/**
 * Utilitários para mascarar dados sensíveis do utilizador
 */
function maskEmail(email: string | null): string {
  if (!email) return 'não definido';
  const parts = email.split('@');
  if (parts.length !== 2) return '***@***';
  const [name, domain] = parts;
  const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
  const domainParts = domain.split('.');
  const maskedDomain = domainParts[0].length > 2 
    ? `${domainParts[0][0]}***.${domainParts.slice(1).join('.')}`
    : `***.${domainParts.slice(1).join('.')}`;
  return `${maskedName}@${maskedDomain}`;
}

function maskId(id: string | null | undefined): string {
  if (!id) return '********';
  if (id.length <= 8) return '********';
  return `${id.slice(0, 4)}...${id.slice(-4)}`;
}

export const ApiDiagnostics: React.FC = () => {
  // Garantia absoluta de desativação em produção
  if (!import.meta.env.DEV) {
    return null;
  }

  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ApiAuthMeResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const realOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const handleCopyOrigin = () => {
    if (!realOrigin) return;
    navigator.clipboard?.writeText(realOrigin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestAPI = async () => {
    setIsLoading(true);
    try {
      const res = await getAuthenticatedUserFromAPI();
      setResult(res);
    } catch (err) {
      setResult({
        success: false,
        status: 'network_error',
        message: 'Exceção não tratada ao chamar a API.',
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside
      aria-label="Diagnóstico de Desenvolvimento da API"
      className="fixed bottom-4 left-4 z-50 text-left font-sans select-none"
    >
      {!isExpanded ? (
        /* Botão recolhido discreto */
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#203B5C] bg-[#0B1220]/95 text-[#BFC9D6] hover:text-[#F8FAFC] hover:border-[#BFC9D6] shadow-lg backdrop-blur-md text-xs font-mono transition-all cursor-pointer"
          title="Abrir diagnóstico temporário da API Worker + Supabase"
        >
          <Activity className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          <span>API Dev</span>
          <span className="text-[10px] px-1 py-0.2 rounded bg-[#14243B] text-[#BFC9D6]">
            Worker /me
          </span>
          <ChevronUp className="w-3 h-3 text-[#5A6D82]" />
        </button>
      ) : (
        /* Painel expandido */
        <div className="w-84 sm:w-96 rounded-xl border border-[#203B5C] bg-[#0B1220]/95 text-[#F8FAFC] shadow-2xl backdrop-blur-md p-4 space-y-3.5 animate-in slide-in-from-bottom-2 duration-150">
          
          {/* Cabeçalho do Painel */}
          <div className="flex items-center justify-between border-b border-[#203B5C] pb-2.5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-[#F8FAFC]">
                Diagnóstico API Worker
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded text-[#5A6D82] hover:text-[#F8FAFC] hover:bg-[#14243B] transition-colors cursor-pointer"
              title="Recolher painel"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Origem Real da Aplicação (CORS) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[#BFC9D6]">
              <span className="font-mono">Origem Real (window.location.origin):</span>
              <button
                type="button"
                onClick={handleCopyOrigin}
                className="inline-flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300 cursor-pointer"
                title="Copiar origem para configurar no Worker"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <div className="p-2 rounded-md bg-[#14243B] border border-[#203B5C] text-[11px] font-mono break-all text-[#E7EDF5]">
              {realOrigin || 'desconhecido'}
            </div>
          </div>

          {/* Estado Atual do Supabase Auth */}
          <div className="p-2.5 rounded-lg bg-[#14243B]/60 border border-[#203B5C] text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[#BFC9D6]">Sessão Supabase Local:</span>
              {user ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Ativa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Sem Sessão
                </span>
              )}
            </div>
            {user && (
              <p className="text-[10px] text-[#BFC9D6] font-mono truncate">
                Utilizador: {maskEmail(user.email ?? null)}
              </p>
            )}
          </div>

          {/* Botão de Ação: Testar Autenticação */}
          <button
            type="button"
            onClick={handleTestAPI}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#203B5C] hover:bg-[#203B5C]/80 text-[#F8FAFC] text-xs font-semibold tracking-wide transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'A testar endpoint /auth/me...' : 'Testar autenticação da API'}</span>
          </button>

          {/* Resultado do Teste */}
          {result && (
            <div className="space-y-2 pt-1 border-t border-[#203B5C] text-xs">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#BFC9D6]">
                Resultado do Teste:
              </span>

              {/* 1. Sucesso (HTTP 200) */}
              {result.success && result.status === 200 && (
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold font-mono text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Autenticado com Sucesso (200 OK)</span>
                  </div>
                  <div className="text-[11px] font-mono space-y-0.5 text-[#E7EDF5]">
                    <p><span className="text-[#BFC9D6]">ID:</span> {maskId(result.data.user.id)}</p>
                    <p><span className="text-[#BFC9D6]">Email:</span> {maskEmail(result.data.user.email)}</p>
                  </div>
                  <p className="text-[10px] text-emerald-300/80">
                    O Worker validou o token Supabase com sucesso.
                  </p>
                </div>
              )}

              {/* 2. Sem sessão ativa */}
              {!result.success && result.status === 'unauthenticated' && (
                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold font-mono text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Ausência de Autenticação</span>
                  </div>
                  <p className="text-[11px] text-[#E7EDF5] leading-relaxed">
                    Não existe sessão iniciada no Supabase. O pedido HTTP ao Worker não foi disparado para evitar chamadas sem token.
                  </p>
                </div>
              )}

              {/* 3. Erro de Rede ou Bloqueio CORS */}
              {!result.success && result.status === 'network_error' && (
                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-rose-400 font-semibold font-mono text-[11px]">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Falha de Rede / CORS</span>
                  </div>
                  <p className="text-[11px] text-[#E7EDF5] leading-relaxed">
                    O navegador não conseguiu contactar o Worker ou a resposta foi bloqueada por CORS.
                  </p>
                  <p className="text-[10px] text-[#BFC9D6] font-mono">
                    Verifica se o Worker autorizou a origem acima tanto no método <strong className="text-rose-300">OPTIONS</strong> como em respostas normais.
                  </p>
                </div>
              )}

              {/* 4. Erros HTTP (401, 404, 500, 503) */}
              {!result.success && typeof result.status === 'number' && (
                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-400 font-semibold font-mono text-[11px]">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Erro HTTP {result.status}</span>
                  </div>
                  <p className="text-[11px] text-[#E7EDF5] leading-relaxed">
                    {result.message}
                  </p>
                </div>
              )}

              {/* 5. Cliente não configurado */}
              {!result.success && result.status === 'client_unconfigured' && (
                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-400 font-semibold font-mono text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Supabase Não Configurado</span>
                  </div>
                  <p className="text-[11px] text-[#E7EDF5]">
                    {result.message}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Rodapé explicativo */}
          <div className="pt-1 text-[10px] text-[#5A6D82] border-t border-[#203B5C]/50 flex items-center justify-between">
            <span>Componente temporário (Dev Only)</span>
            <span className="font-mono">v0.1</span>
          </div>

        </div>
      )}
    </aside>
  );
};
