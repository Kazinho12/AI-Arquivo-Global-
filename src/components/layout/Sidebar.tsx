/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { X, Sun, Moon, BookOpen, Sparkles, Compass, Shield, PlusCircle } from 'lucide-react';
import { Button } from '../ui/Button';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: 'home' | 'catalog' | 'design-system' | 'manifesto';
  onNavigate: (tab: 'home' | 'catalog' | 'design-system' | 'manifesto') => void;
  onOpenPublishModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentTab,
  onNavigate,
  onOpenPublishModal,
}) => {
  const { theme, toggleTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0B1220]/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className="relative w-4/5 max-w-xs bg-[#FFFFFF] dark:bg-[#14243B] text-[#0B1220] dark:text-[#F8FAFC] border-r border-[#D8E2ED] dark:border-[#203B5C] p-6 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-[#D8E2ED] dark:border-[#203B5C]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-[#14243B] dark:bg-[#203B5C] text-[#F8FAFC] flex items-center justify-center font-title font-bold text-sm">
                AG
              </div>
              <span className="font-title text-lg font-bold">Arquivo Global</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#5A6D82] dark:text-[#BFC9D6] hover:bg-[#E7EDF5] dark:hover:bg-[#203B5C]"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                onNavigate('home');
                onClose();
              }}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-left transition-colors ${
                currentTab === 'home'
                  ? 'bg-[#14243B] text-[#F8FAFC] dark:bg-[#203B5C]'
                  : 'text-[#5A6D82] dark:text-[#BFC9D6] hover:bg-[#E7EDF5] dark:hover:bg-[#203B5C]/50'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Página Inicial</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigate('catalog');
                onClose();
              }}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-left transition-colors ${
                currentTab === 'catalog'
                  ? 'bg-[#14243B] text-[#F8FAFC] dark:bg-[#203B5C]'
                  : 'text-[#5A6D82] dark:text-[#BFC9D6] hover:bg-[#E7EDF5] dark:hover:bg-[#203B5C]/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Explorar Catálogo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigate('design-system');
                onClose();
              }}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-left transition-colors ${
                currentTab === 'design-system'
                  ? 'bg-[#14243B] text-[#F8FAFC] dark:bg-[#203B5C]'
                  : 'text-[#5A6D82] dark:text-[#BFC9D6] hover:bg-[#E7EDF5] dark:hover:bg-[#203B5C]/50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Identidade & Design System</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigate('manifesto');
                onClose();
              }}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-left transition-colors ${
                currentTab === 'manifesto'
                  ? 'bg-[#14243B] text-[#F8FAFC] dark:bg-[#203B5C]'
                  : 'text-[#5A6D82] dark:text-[#BFC9D6] hover:bg-[#E7EDF5] dark:hover:bg-[#203B5C]/50'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Manifesto Editorial</span>
            </button>
          </nav>
        </div>

        {/* Bottom Drawer Actions */}
        <div className="pt-6 border-t border-[#D8E2ED] dark:border-[#203B5C] space-y-3">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={() => {
              onClose();
              onOpenPublishModal?.();
            }}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Submeter Obra
          </Button>

          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-[#D8E2ED] dark:border-[#203B5C] text-xs font-medium text-[#5A6D82] dark:text-[#BFC9D6]"
          >
            <span>Alternar Tema</span>
            {theme === 'dark' ? (
              <span className="flex items-center gap-1.5 text-amber-300">
                <Sun className="w-4 h-4" /> Escuro
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[#14243B]">
                <Moon className="w-4 h-4" /> Claro
              </span>
            )}
          </button>
        </div>
      </aside>
    </div>
  );
};
