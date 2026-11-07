/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AgeRating as AgeRatingType } from '../../types';
import { Tooltip } from './Tooltip';

export interface AgeRatingProps {
  rating: AgeRatingType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  withTooltip?: boolean;
}

export const AgeRating: React.FC<AgeRatingProps> = ({
  rating,
  size = 'sm',
  showLabel = false,
  withTooltip = true,
}) => {
  const ratingDetails: Record<
    AgeRatingType,
    { label: string; description: string; bg: string; text: string; border: string }
  > = {
    L: {
      label: 'Livre',
      description: 'Classificação Livre: Adequado para todos os públicos',
      bg: 'bg-emerald-950/20 dark:bg-emerald-950/50',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-600/30 dark:border-emerald-600/40',
    },
    '12': {
      label: '12+',
      description: 'Não recomendado para menores de 12 anos',
      bg: 'bg-sky-950/20 dark:bg-sky-950/50',
      text: 'text-sky-700 dark:text-sky-300',
      border: 'border-sky-600/30 dark:border-sky-600/40',
    },
    '14': {
      label: '14+',
      description: 'Não recomendado para menores de 14 anos',
      bg: 'bg-amber-950/20 dark:bg-amber-950/50',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-600/30 dark:border-amber-600/40',
    },
    '16': {
      label: '16+',
      description: 'Não recomendado para menores de 16 anos',
      bg: 'bg-orange-950/20 dark:bg-orange-950/50',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-600/30 dark:border-orange-600/40',
    },
    '18': {
      label: '18+',
      description: 'Conteúdo restrito para maiores de 18 anos',
      bg: 'bg-rose-950/20 dark:bg-rose-950/50',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-600/30 dark:border-rose-600/40',
    },
  };

  const item = ratingDetails[rating];

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-0.5 text-xs',
    lg: 'px-2.5 py-1 text-sm',
  };

  const badgeElement = (
    <span
      className={`inline-flex items-center gap-1 font-mono font-semibold tracking-wider rounded border select-none ${item.bg} ${item.text} ${item.border} ${sizeClasses[size]}`}
      aria-label={item.description}
    >
      <span>{rating === 'L' ? 'L' : rating}</span>
      {showLabel && <span className="font-sans font-normal text-[10px]">· {item.label}</span>}
    </span>
  );

  if (!withTooltip) {
    return badgeElement;
  }

  return <Tooltip content={item.description}>{badgeElement}</Tooltip>;
};
