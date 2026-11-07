/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AgeRating, WorkFormat, WorkStatus } from '../../types';

export interface AgeRatingBadgeProps {
  rating: AgeRating;
  size?: 'sm' | 'md';
}

export const AgeRatingBadge: React.FC<AgeRatingBadgeProps> = ({ rating, size = 'sm' }) => {
  const styles: Record<AgeRating, { bg: string; text: string; border: string; label: string }> = {
    L: {
      bg: 'bg-emerald-950/30 dark:bg-emerald-950/50',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-600/30 dark:border-emerald-600/40',
      label: 'Livre',
    },
    '12': {
      bg: 'bg-sky-950/30 dark:bg-sky-950/50',
      text: 'text-sky-700 dark:text-sky-300',
      border: 'border-sky-600/30 dark:border-sky-600/40',
      label: '12+',
    },
    '14': {
      bg: 'bg-amber-950/30 dark:bg-amber-950/50',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-600/30 dark:border-amber-600/40',
      label: '14+',
    },
    '16': {
      bg: 'bg-orange-950/30 dark:bg-orange-950/50',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-600/30 dark:border-orange-600/40',
      label: '16+',
    },
    '18': {
      bg: 'bg-rose-950/30 dark:bg-rose-950/50',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-600/30 dark:border-rose-600/40',
      label: '18+',
    },
  };

  const current = styles[rating];
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center font-mono font-semibold tracking-wider rounded border ${current.bg} ${current.text} ${current.border} ${sizeClasses} select-none`}
      title={`Classificação Indicativa: ${current.label}`}
    >
      {rating === 'L' ? 'LIVRE' : rating}
    </span>
  );
};

export interface FormatBadgeProps {
  format: WorkFormat;
  variant?: 'outline' | 'filled';
}

export const FormatBadge: React.FC<FormatBadgeProps> = ({ format, variant = 'outline' }) => {
  const labels: Record<WorkFormat, string> = {
    romance: 'Romance',
    conto: 'Conto',
    poesia: 'Poesia',
    hq: 'Banda Desenhada',
    manga: 'Mangá',
  };

  if (variant === 'filled') {
    return (
      <span className="inline-flex items-center text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-[#14243B] dark:bg-[#203B5C] text-[#F8FAFC]">
        {labels[format]}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded border border-[#203B5C]/60 dark:border-[#BFC9D6]/30 text-[#203B5C] dark:text-[#BFC9D6]">
      {labels[format]}
    </span>
  );
};

export interface StatusBadgeProps {
  status: WorkStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config: Record<WorkStatus, { label: string; text: string }> = {
    ongoing: {
      label: 'Em andamento',
      text: 'text-sky-600 dark:text-sky-300',
    },
    completed: {
      label: 'Concluído',
      text: 'text-emerald-600 dark:text-emerald-300',
    },
    hiatus: {
      label: 'Em hiato',
      text: 'text-amber-600 dark:text-amber-300',
    },
  };

  const item = config[status];

  return (
    <span className={`inline-flex items-center text-xs font-medium ${item.text}`}>
      {item.label}
    </span>
  );
};
