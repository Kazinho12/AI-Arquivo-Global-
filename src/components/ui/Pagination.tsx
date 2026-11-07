/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4" aria-label="Paginação">
      {totalItems && itemsPerPage ? (
        <p className="text-xs text-[#5A6D82] dark:text-[#BFC9D6] tabular-nums">
          A mostrar {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} obras no Arquivo
        </p>
      ) : (
        <span />
      )}

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-[#D8E2ED] dark:border-[#203B5C] text-[#203B5C] dark:text-[#BFC9D6] hover:bg-[#E7EDF5] dark:hover:bg-[#14243B] disabled:opacity-30 disabled:pointer-events-none transition-colors"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((p) => {
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`min-w-8 h-8 px-2 text-xs font-mono font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#14243B] text-[#F8FAFC] dark:bg-[#BFC9D6] dark:text-[#0B1220] font-bold shadow-sm'
                  : 'text-[#203B5C] dark:text-[#BFC9D6] hover:bg-[#E7EDF5] dark:hover:bg-[#14243B]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-[#D8E2ED] dark:border-[#203B5C] text-[#203B5C] dark:text-[#BFC9D6] hover:bg-[#E7EDF5] dark:hover:bg-[#14243B] disabled:opacity-30 disabled:pointer-events-none transition-colors"
          aria-label="Página seguinte"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};
