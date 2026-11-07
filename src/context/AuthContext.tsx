/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface AuthResponse<T = unknown> {
  data: T | null;
  error: AuthError | Error | null;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<{ error: AuthError | Error | null }>;
  signUpWithPassword: (email: string, password: string) => Promise<AuthResponse<{ user: User | null; session: Session | null }>>;
  signInWithPassword: (email: string, password: string) => Promise<AuthResponse<{ user: User | null; session: Session | null }>>;
  signOut: () => Promise<{ error: AuthError | Error | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Se o cliente Supabase não estiver configurado (null), encerra o carregamento com segurança
    if (!supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    let hasReceivedAuthState = false;

    // 1. Estabelecer o listener de alterações de estado PRIMEIRO para evitar condições de corrida
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      hasReceivedAuthState = true;
      if (isMounted) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    });

    // 2. Obter a sessão inicial persistida, garantindo que uma resposta assíncrona atrasada
    // nunca sobrescreva uma atualização mais recente já processada pelo listener acima
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          console.warn('[Arquivo Global — Auth] Aviso ao obter sessão inicial:', error.message);
        }
        if (isMounted && !hasReceivedAuthState) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('[Arquivo Global — Auth] Erro inesperado ao obter sessão:', err);
        if (isMounted && !hasReceivedAuthState) {
          setLoading(false);
        }
      });

    // 3. Limpeza rigorosa da subscrição ao desmontar o componente
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Autenticação via Google OAuth utilizando o redirecionamento para a origem atual
   */
  const signInWithGoogle = async (): Promise<{ error: AuthError | Error | null }> => {
    if (!supabase) {
      const err = new Error('Cliente Supabase não configurado no ambiente.');
      console.warn('[Arquivo Global — Auth]', err.message);
      return { error: err };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
      return { error };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  /**
   * Registo de novo utilizador através de email e palavra-passe
   */
  const signUpWithPassword = async (
    email: string,
    password: string
  ): Promise<AuthResponse<{ user: User | null; session: Session | null }>> => {
    if (!supabase) {
      const err = new Error('Cliente Supabase não configurado no ambiente.');
      console.warn('[Arquivo Global — Auth]', err.message);
      return { data: null, error: err };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { data, error };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  /**
   * Início de sessão através de email e palavra-passe
   */
  const signInWithPassword = async (
    email: string,
    password: string
  ): Promise<AuthResponse<{ user: User | null; session: Session | null }>> => {
    if (!supabase) {
      const err = new Error('Cliente Supabase não configurado no ambiente.');
      console.warn('[Arquivo Global — Auth]', err.message);
      return { data: null, error: err };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  /**
   * Terminar a sessão atual
   */
  const signOut = async (): Promise<{ error: AuthError | Error | null }> => {
    if (!supabase) {
      const err = new Error('Cliente Supabase não configurado no ambiente.');
      console.warn('[Arquivo Global — Auth]', err.message);
      return { error: err };
    }

    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  /**
   * Envio de email de recuperação / redefinição de palavra-passe
   */
  const resetPassword = async (email: string): Promise<{ error: AuthError | Error | null }> => {
    if (!supabase) {
      const err = new Error('Cliente Supabase não configurado no ambiente.');
      console.warn('[Arquivo Global — Auth]', err.message);
      return { error: err };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      });
      return { error };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    isConfigured: isSupabaseConfigured,
    signInWithGoogle,
    signUpWithPassword,
    signInWithPassword,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook personalizado para aceder ao contexto de autenticação do Arquivo Global.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um <AuthProvider>');
  }
  return context;
};
