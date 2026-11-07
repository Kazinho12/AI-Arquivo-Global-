/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Search, Menu, X, PlusCircle, BookOpen } from 'lucide-react';
import { Button } from '../ui/Button';

export interface HeaderProps {
  currentTab: 'home' | 'catalog' | 'design-system' | 'manifesto';
  onNavigate: (tab: 'home' | 'catalog' | 'design-system' | 'manifesto') => void;
  onOpenSearch?: () => void;
  onOpenPublishModal?: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  onOpenSearch,
  onOpenPublishModal,
  onToggleSidebar,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFFFFF]/90 dark:bg-[#0B1220]/90 backdrop-blur-md border-b border-[#D8E2ED] dark:border-[#203B5C] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Brand Wordmark (Display face, single line, no badges attached) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            {/* Minimalist Geometric Crest: 'AG' Archival Horizon */}
            <div className="w-8 h-8 rounded-lg bg-[#14243B] dark:bg-[#14243B] border border-[#203B5C] flex items-center justify-center text-[#BFC9D6] group-hover:border-[#BFC9D6] transition-colors">
              <span className="font-title text-base font-bold tracking-widest text-[#F8FAFC]">
                AG
              </span>
            </div>
            <span className="font-title text-xl sm:text-2xl font-bold tracking-tight text-[#0B1220] dark:text-[#F8FAFC] whitespace-nowrap">
              Arquivo Global
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links (4-5 concise single-line links with active state indicator) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              currentTab === 'home'
                ? 'text-[#0B1220] dark:text-[#F8FAFC] font-semibold border-b-2 border-[#14243B] dark:border-[#BFC9D6]'
                : 'text-[#5A6D82] dark:text-[#BFC9D6] hover:text-[#0B1220] dark:hover:text-[#F8FAFC]'
            }`}
          >
            Página Inicial
          </button>

          <button
            type="button"
            onClick={() => onNavigate('catalog')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              currentTab === 'catalog'
                ? 'text-[#0B1220] dark:text-[#F8FAFC] font-semibold border-b-2 border-[#14243B] dark:border-[#BFC9D6]'
                : 'text-[#5A6D82] dark:text-[#BFC9D6] hover:text-[#0B1220] dark:hover:text-[#F8FAFC]'
            }`}
          >
            Explorar Obras
          </button>

          <button
            type="button"
            onClick={() => onNavigate('design-system')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
              currentTab === 'design-system'
                ? 'text-[#0B1220] dark:text-[#F8FAFC] font-semibold border-b-2 border-[#14243B] dark:border-[#BFC9D6]'
                : 'text-[#5A6D82] dark:text-[#BFC9D6] hover:text-[#0B1220] dark:hover:text-[#F8FAFC]'
            }`}
          >
            <span>Identidade & Design System</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#E7EDF5] dark:bg-[#14243B] border border-[#D8E2ED] dark:border-[#203B5C] text-[#203B5C] dark:text-[#BFC9D6]">
              V1.0
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('manifesto')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              currentTab === 'manifesto'
                ? 'text-[#0B1220] dark:text-[#F8FAFC] font-semibold border-b-2 border-[#14243B] dark:border-[#BFC9D6]'
                : 'text-[#5A6D82] dark:text-[#BFC9D6] hover:text-[#0B1220] dark:hover:text-[#F8FAFC]'
            }`}
          >
            Manifesto
          </button>
        </nav>

        {/* Zone 3: Actions (Theme Toggle, Search trigger, 1 Primary CTA) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick search button */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="p-2 rounded-lg text-[#5A6D82] dark:text-[#BFC9D6] hover:text-[#0B1220] dark:hover:text-[#F8FAFC] hover:bg-[#E7EDF5] dark:hover:bg-[#14243B] border border-transparent hover:border-[#D8E2ED] dark:hover:border-[#203B5C] transition-colors cursor-pointer"
            aria-label="Pesquisar obras no Arquivo"
            title="Pesquisar no Arquivo"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Theme switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg text-[#5A6D82] dark:text-[#BFC9D6] hover:text-[#0B1220] dark:hover:text-[#F8FAFC] hover:bg-[#E7EDF5] dark:hover:bg-[#14243B] border border-[#D8E2ED] dark:border-[#203B5C] transition-colors cursor-pointer"
            aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            title={theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-[#14243B]" />
            )}
          </button>

          {/* Primary Action Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenPublishModal}
            leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
            className="hidden sm:inline-flex"
          >
            Submeter Obra
          </Button>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-[#5A6D82] dark:text-[#BFC9D6] hover:bg-[#E7EDF5] dark:hover:bg-[#14243B] transition-colors"
            aria-label="Abrir menu de navegação"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

      </div>
    </header>
  );
};
