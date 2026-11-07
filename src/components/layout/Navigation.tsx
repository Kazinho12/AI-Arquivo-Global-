/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, Sparkles, Compass, Users, Palette, Shield } from 'lucide-react';

export type NavigationModule = 'home' | 'prose' | 'visual' | 'authors' | 'catalog' | 'design-system' | 'manifesto';

export interface NavigationProps {
  activeModule: NavigationModule;
  onSelectModule: (module: NavigationModule) => void;
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeModule,
  onSelectModule,
  className = '',
}) => {
  const items: { id: NavigationModule; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'home', label: 'Início', icon: <Compass className="w-3.5 h-3.5" /> },
    { id: 'catalog', label: 'Catálogo Geral', icon: <BookOpen className="w-3.5 h-3.5" />, badge: '6' },
    { id: 'prose', label: 'Prosa & Poesia', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'visual', label: 'HQ & Mangá', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'authors', label: 'Criadores', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'design-system', label: 'Design System', icon: <Palette className="w-3.5 h-3.5" />, badge: 'v0.1' },
    { id: 'manifesto', label: 'Manifesto', icon: <Shield className="w-3.5 h-3.5" /> },
  ];

  return (
    <nav
      aria-label="Navegação secundária especializada"
      className={`w-full overflow-x-auto no-scrollbar py-2.5 border-b border-[#D8E2ED] dark:border-[#203B5C]/60 bg-[#FFFFFF]/70 dark:bg-[#0B1220]/70 backdrop-blur-xs transition-colors ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2">
        {items.map((item) => {
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectModule(item.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-[#14243B] text-[#F8FAFC] dark:bg-[#BFC9D6] dark:text-[#0B1220] font-semibold shadow-xs'
                  : 'text-[#5A6D82] dark:text-[#BFC9D6] hover:bg-[#E7EDF5] dark:hover:bg-[#14243B] hover:text-[#0B1220] dark:hover:text-[#F8FAFC]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    isActive
                      ? 'bg-black/20 text-white dark:bg-black/20 dark:text-[#0B1220]'
                      : 'bg-[#E7EDF5] dark:bg-[#14243B] text-[#5A6D82] dark:text-[#BFC9D6]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
