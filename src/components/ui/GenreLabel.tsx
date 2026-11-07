/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface GenreLabelProps {
  genre: string;
  count?: number;
  isActive?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export const GenreLabel: React.FC<GenreLabelProps> = ({
  genre,
  count,
  isActive = false,
  onClick,
  size = 'md',
}) => {
  const isClickable = Boolean(onClick);

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  if (!isClickable) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded font-sans border border-[#D8E2ED] dark:border-[#203B5C]/70 text-[#5A6D82] dark:text-[#BFC9D6] ${sizeClasses}`}>
        <span>{genre}</span>
        {count !== undefined && (
          <span className="font-mono text-[10px] text-[#5A6D82]/70 dark:text-[#BFC9D6]/60 tabular-nums">
            {count}
          </span>
        )}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded font-sans transition-all duration-150 cursor-pointer font-medium whitespace-nowrap ${sizeClasses} ${
        isActive
          ? 'bg-[#14243B] text-[#F8FAFC] border border-[#203B5C] dark:bg-[#BFC9D6] dark:text-[#0B1220] dark:border-[#BFC9D6] shadow-xs'
          : 'bg-[#FFFFFF] dark:bg-[#14243B]/60 text-[#203B5C] dark:text-[#BFC9D6] border border-[#D8E2ED] dark:border-[#203B5C] hover:border-[#203B5C] dark:hover:border-[#BFC9D6]/60 hover:text-[#0B1220] dark:hover:text-[#F8FAFC]'
      }`}
    >
      <span>{genre}</span>
      {count !== undefined && (
        <span
          className={`font-mono text-[10px] tabular-nums ${
            isActive ? 'text-[#BFC9D6] dark:text-[#0B1220]/80' : 'text-[#5A6D82] dark:text-[#BFC9D6]/60'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};
