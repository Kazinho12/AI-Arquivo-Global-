/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface TagProps {
  label: string;
  onClick?: () => void;
  isActive?: boolean;
  size?: 'sm' | 'md';
}

export const Tag: React.FC<TagProps> = ({
  label,
  onClick,
  isActive = false,
  size = 'md',
}) => {
  const isClickable = Boolean(onClick);

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  if (!isClickable) {
    return (
      <span className={`inline-flex items-center rounded border border-[#D8E2ED] dark:border-[#203B5C]/60 text-[#5A6D82] dark:text-[#BFC9D6] ${sizeClasses}`}>
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded transition-all duration-150 cursor-pointer font-medium whitespace-nowrap ${sizeClasses} ${
        isActive
          ? 'bg-[#14243B] text-[#F8FAFC] border border-[#203B5C] dark:bg-[#BFC9D6] dark:text-[#0B1220] dark:border-[#BFC9D6]'
          : 'bg-[#FFFFFF] dark:bg-[#14243B]/60 text-[#203B5C] dark:text-[#BFC9D6] border border-[#D8E2ED] dark:border-[#203B5C] hover:border-[#203B5C] dark:hover:border-[#BFC9D6]/60 hover:text-[#0B1220] dark:hover:text-[#F8FAFC]'
      }`}
    >
      {label}
    </button>
  );
};
