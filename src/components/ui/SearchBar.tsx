/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  onSubmit?: () => void;
  placeholder?: string;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showShortcut?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onClear,
  onSubmit,
  placeholder = 'Pesquisar obras, autores, géneros ou temas...',
  isLoading = false,
  size = 'md',
  showShortcut = true,
  autoFocus = false,
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeStyles = {
    sm: 'py-1.5 pl-8 pr-8 text-xs',
    md: 'py-2.5 pl-10 pr-10 text-sm',
    lg: 'py-3.5 pl-12 pr-12 text-base',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5 left-2.5',
    md: 'w-4 h-4 left-3.5',
    lg: 'w-5 h-5 left-4',
  };

  const clearSizes = {
    sm: 'right-2 p-1',
    md: 'right-3 p-1',
    lg: 'right-3.5 p-1.5',
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit();
    } else if (e.key === 'Escape' && value) {
      if (onClear) onClear();
      else onChange('');
    }
  };

  const handleClear = () => {
    if (onClear) onClear();
    else onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      {/* Search Icon or Loading Spinner */}
      <div className={`absolute pointer-events-none text-[#5A6D82] dark:text-[#BFC9D6]/70 ${iconSizes[size]}`}>
        {isLoading ? (
          <Loader2 className="w-full h-full animate-spin text-current" />
        ) : (
          <Search className="w-full h-full" />
        )}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`w-full bg-[#FFFFFF] dark:bg-[#14243B] text-[#0B1220] dark:text-[#F8FAFC] placeholder-[#5A6D82]/60 dark:placeholder-[#BFC9D6]/40 rounded-lg border border-[#D8E2ED] dark:border-[#203B5C] focus:border-[#203B5C] dark:focus:border-[#BFC9D6] focus:ring-1 focus:ring-[#203B5C] dark:focus:ring-[#BFC9D6] outline-none transition-colors duration-150 ${sizeStyles[size]}`}
      />

      {/* Clear Button or Keyboard Shortcut */}
      <div className={`absolute flex items-center gap-1.5 ${clearSizes[size]}`}>
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="text-[#5A6D82] dark:text-[#BFC9D6] hover:text-[#0B1220] dark:hover:text-[#F8FAFC] rounded transition-colors"
            aria-label="Limpar pesquisa"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : showShortcut ? (
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-[#5A6D82] dark:text-[#BFC9D6]/60 bg-[#E7EDF5] dark:bg-[#0B1220] border border-[#D8E2ED] dark:border-[#203B5C] rounded">
            ⌘K
          </kbd>
        ) : null}
      </div>
    </div>
  );
};
