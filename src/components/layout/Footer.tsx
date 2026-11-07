/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export interface FooterProps {
  onNavigate: (tab: 'home' | 'catalog' | 'design-system' | 'manifesto') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <footer className="w-full bg-[#FFFFFF] dark:bg-[#0B1220] border-t border-[#D8E2ED] dark:border-[#203B5C] transition-colors mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#14243B] dark:bg-[#14243B] border border-[#203B5C] flex items-center justify-center text-[#BFC9D6]">
                <span className="font-title text-sm font-bold text-[#F8FAFC]">AG</span>
              </div>
              <span className="font-title text-xl font-bold tracking-tight text-[#0B1220] dark:text-[#F8FAFC]">
                Arquivo Global
              </span>
            </div>
            <p className="text-xs text-[#5A6D82] dark:text-[#BFC9D6] leading-relaxed">
              Plataforma digital independente de publicação, catalogação e leitura de obras literárias, romances, contos, poesia, bandas desenhadas e mangás.
            </p>
            <p className="text-[11px] text-[#5A6D82] dark:text-[#BFC9D6]/70">
              Preservação da autonomia criativa dos autores e artistas independentes.
            </p>
          </div>

          {/* Formatos Col */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0B1220] dark:text-[#F8FAFC] mb-3">
              Formatos Catalogados
            </h4>
            <ul className="space-y-2 text-xs text-[#5A6D82] dark:text-[#BFC9D6]">
              <li>
                <button type="button" onClick={() => onNavigate('catalog')} className="hover:text-[#0B1220] dark:hover:text-[#F8FAFC] transition-colors">
                  Romances Literários
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('catalog')} className="hover:text-[#0B1220] dark:hover:text-[#F8FAFC] transition-colors">
                  Contos & Ficção Curta
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('catalog')} className="hover:text-[#0B1220] dark:hover:text-[#F8FAFC] transition-colors">
                  Poesia Contemporânea
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('catalog')} className="hover:text-[#0B1220] dark:hover:text-[#F8FAFC] transition-colors">
                  Banda Desenhada & Novelas Gráficas
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('catalog')} className="hover:text-[#0B1220] dark:hover:text-[#F8FAFC] transition-colors">
                  Mangás & Narrativas Visuais
                </button>
              </li>
            </ul>
          </div>

          {/* Arquitetura & Diretrizes Col */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0B1220] dark:text-[#F8FAFC] mb-3">
              Fundação & Governança
            </h4>
            <ul className="space-y-2 text-xs text-[#5A6D82] dark:text-[#BFC9D6]">
              <li>
                <button type="button" onClick={() => onNavigate('design-system')} className="hover:text-[#0B1220] dark:hover:text-[#F8FAFC] transition-colors">
                  Tokens & Sistema de Cores
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('design-system')} className="hover:text-[#0B1220] dark:hover:text-[#F8FAFC] transition-colors">
                  Biblioteca de Componentes
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('manifesto')} className="hover:text-[#0B1220] dark:hover:text-[#F8FAFC] transition-colors">
                  Manifesto Editorial
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('manifesto')} className="hover:text-[#0B1220] dark:hover:text-[#F8FAFC] transition-colors">
                  Preparação Técnica para Supabase
                </button>
              </li>
            </ul>
          </div>

          {/* Sistema & Preferências */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0B1220] dark:text-[#F8FAFC] mb-3">
              Preferência de Leitura
            </h4>
            <p className="text-xs text-[#5A6D82] dark:text-[#BFC9D6] mb-3">
              O tema principal do Arquivo Global é o Azul Abissal (Escuro), com opção de modo Claro para ambientes de alta iluminação.
            </p>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#D8E2ED] dark:border-[#203B5C] bg-[#FFFFFF] dark:bg-[#14243B] text-xs font-medium text-[#0B1220] dark:text-[#F8FAFC] hover:bg-[#E7EDF5] dark:hover:bg-[#203B5C] transition-colors"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                  <span>Tema Escuro Ativo (Abissal)</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#14243B]" />
                  <span>Tema Claro Ativo (Gelo/Branco)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom hairline & legal */}
        <div className="mt-12 pt-6 border-t border-[#D8E2ED] dark:border-[#203B5C] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5A6D82] dark:text-[#BFC9D6]">
          <p>
            © {new Date().getFullYear()} Arquivo Global (AG). Fundação visual e arquitetural da plataforma.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <span>Acessibilidade WCAG AA</span>
            <span aria-hidden="true">·</span>
            <span>Tipografia: Cormorant & Jakarta</span>
            <span aria-hidden="true">·</span>
            <span>Versão 1.0 (Fundação)</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
