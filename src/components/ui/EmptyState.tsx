/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button } from './Button';
import { RotateCcw } from 'lucide-react';

export interface EmptyStateProps {
  title?: string;
  message?: string;
  onReset?: () => void;
  actionLabel?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Nenhuma obra encontrada no Arquivo',
  message = 'Não foram encontrados registos correspondentes aos filtros selecionados. Tente ajustar os termos de pesquisa, o formato ou a classificação etária.',
  onReset,
  actionLabel = 'Limpar Filtros de Pesquisa',
}) => {
  return (
    <div className="py-16 px-6 text-center max-w-md mx-auto flex flex-col items-center">
      {/* Editorial SVG Emblem */}
      <div className="w-16 h-16 rounded-2xl bg-[#E7EDF5] dark:bg-[#14243B] border border-[#D8E2ED] dark:border-[#203B5C] flex items-center justify-center mb-5 text-[#203B5C] dark:text-[#BFC9D6]">
        <svg
          className="w-8 h-8 opacity-80"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>

      <h3 className="font-title text-xl sm:text-2xl font-bold text-[#0B1220] dark:text-[#F8FAFC] tracking-tight">
        {title}
      </h3>
      <p className="mt-2 text-sm text-[#5A6D82] dark:text-[#BFC9D6] leading-relaxed">
        {message}
      </p>

      {onReset && (
        <div className="mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
