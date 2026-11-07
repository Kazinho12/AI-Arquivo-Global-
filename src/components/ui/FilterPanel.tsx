/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WorkFormat, AgeRating, WorkStatus } from '../../types';
import { Select } from './Select';
import { Checkbox } from './Checkbox';
import { Button } from './Button';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';

export interface FilterPanelProps {
  selectedFormat: WorkFormat | 'all';
  onFormatChange: (format: WorkFormat | 'all') => void;
  selectedAgeRating: AgeRating | 'all';
  onAgeRatingChange: (rating: AgeRating | 'all') => void;
  selectedStatus: WorkStatus | 'all';
  onStatusChange: (status: WorkStatus | 'all') => void;
  sortBy: 'recent' | 'popular' | 'rating';
  onSortByChange: (sort: 'recent' | 'popular' | 'rating') => void;
  hideExplicitContent?: boolean;
  onToggleHideExplicitContent?: (checked: boolean) => void;
  onReset: () => void;
  isModified?: boolean;
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  selectedFormat,
  onFormatChange,
  selectedAgeRating,
  onAgeRatingChange,
  selectedStatus,
  onStatusChange,
  sortBy,
  onSortByChange,
  hideExplicitContent = false,
  onToggleHideExplicitContent,
  onReset,
  isModified = false,
  className = '',
}) => {
  return (
    <div
      className={`p-5 rounded-xl bg-[#FFFFFF] dark:bg-[#14243B] border border-[#D8E2ED] dark:border-[#203B5C] space-y-5 text-left shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-[#D8E2ED] dark:border-[#203B5C]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#203B5C] dark:text-[#BFC9D6]" />
          <h4 className="font-title text-sm font-bold uppercase tracking-wider text-[#0B1220] dark:text-[#F8FAFC]">
            Painel de Filtros
          </h4>
        </div>

        {isModified && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs text-[#5A6D82] dark:text-[#BFC9D6] hover:text-[#0B1220] dark:hover:text-[#F8FAFC] transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Repor</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Formato */}
        <Select
          label="Formato de Obra"
          options={[
            { value: 'all', label: 'Todos os Formatos' },
            { value: 'romance', label: 'Romance' },
            { value: 'conto', label: 'Conto' },
            { value: 'poesia', label: 'Poesia' },
            { value: 'hq', label: 'Banda Desenhada / HQ' },
            { value: 'manga', label: 'Mangá' },
          ]}
          value={selectedFormat}
          onChange={(e) => onFormatChange(e.target.value as WorkFormat | 'all')}
        />

        {/* Classificação Indicativa */}
        <Select
          label="Classificação Etária"
          options={[
            { value: 'all', label: 'Todas as Idades' },
            { value: 'L', label: 'Livre (Todos os Públicos)' },
            { value: '12', label: '12+ (A partir de 12 anos)' },
            { value: '14', label: '14+ (A partir de 14 anos)' },
            { value: '16', label: '16+ (A partir de 16 anos)' },
            { value: '18', label: '18+ (Apenas Adultos)' },
          ]}
          value={selectedAgeRating}
          onChange={(e) => onAgeRatingChange(e.target.value as AgeRating | 'all')}
        />

        {/* Estado da Publicação */}
        <Select
          label="Estado da Obra"
          options={[
            { value: 'all', label: 'Todos os Estados' },
            { value: 'ongoing', label: 'Em andamento' },
            { value: 'completed', label: 'Concluído' },
            { value: 'hiatus', label: 'Em hiato' },
          ]}
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value as WorkStatus | 'all')}
        />

        {/* Ordenação */}
        <Select
          label="Critério de Ordenação"
          options={[
            { value: 'recent', label: 'Mais Recentes' },
            { value: 'popular', label: 'Mais Lidos' },
            { value: 'rating', label: 'Melhor Avaliados' },
          ]}
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as 'recent' | 'popular' | 'rating')}
        />
      </div>

      {onToggleHideExplicitContent && (
        <div className="pt-3 border-t border-[#D8E2ED] dark:border-[#203B5C]/60 flex items-center justify-between">
          <Checkbox
            label="Ocultar obras com classificação 18+ ou avisos de conteúdo sensível"
            description="Filtro de conforto para leitura em ambientes públicos"
            checked={hideExplicitContent}
            onChange={(e) => onToggleHideExplicitContent(e.target.checked)}
            size="sm"
          />
        </div>
      )}
    </div>
  );
};
