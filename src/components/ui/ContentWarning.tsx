/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertTriangle, Info, ChevronDown } from 'lucide-react';

export interface ContentWarningProps {
  warnings: string[];
  expandable?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const ContentWarning: React.FC<ContentWarningProps> = ({
  warnings,
  expandable = false,
  size = 'md',
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!warnings || warnings.length === 0) return null;

  if (!expandable) {
    return (
      <div className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          title="Aviso de Conteúdo Sensível"
        >
          <AlertTriangle className="w-3 h-3 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>AVISO:</span>
          <span className="font-sans font-normal truncate max-w-[200px]">
            {warnings.join(', ')}
          </span>
        </span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 p-3 text-left transition-all ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-xs font-medium text-amber-800 dark:text-amber-300 cursor-pointer select-none"
      >
        <span className="inline-flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="font-mono text-[11px] font-semibold tracking-wider uppercase">
            Avisos de Conteúdo ({warnings.length})
          </span>
        </span>
        <span className="flex items-center gap-1 text-[11px] font-sans opacity-80">
          <span>{isExpanded ? 'Ocultar detalhes' : 'Consultar'}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {isExpanded && (
        <div className="mt-2.5 pt-2.5 border-t border-amber-500/20 text-xs text-[#5A6D82] dark:text-[#BFC9D6] space-y-1.5 animate-in fade-in duration-150">
          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
            Esta obra contém temas que podem requerer discernimento do leitor:
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-xs text-[#0B1220] dark:text-[#F8FAFC]">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
