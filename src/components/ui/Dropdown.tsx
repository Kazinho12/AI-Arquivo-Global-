/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}

export interface DropdownProps {
  label: string;
  items: DropdownItem[];
  icon?: React.ReactNode;
  align?: 'left' | 'right';
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  items,
  icon,
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium uppercase tracking-wider rounded-lg border border-[#D8E2ED] dark:border-[#203B5C] bg-[#FFFFFF] dark:bg-[#14243B] text-[#0B1220] dark:text-[#F8FAFC] hover:bg-[#E7EDF5] dark:hover:bg-[#203B5C] transition-colors cursor-pointer select-none"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {icon && <span className="text-[#5A6D82] dark:text-[#BFC9D6]">{icon}</span>}
        <span>{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#5A6D82] dark:text-[#BFC9D6] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute z-30 mt-1.5 w-48 rounded-lg border border-[#D8E2ED] dark:border-[#203B5C] bg-[#FFFFFF] dark:bg-[#14243B] shadow-xl py-1 focus:outline-none ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          role="menu"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-left transition-colors cursor-pointer ${
                item.destructive
                  ? 'text-rose-500 hover:bg-rose-500/10'
                  : 'text-[#203B5C] dark:text-[#E7EDF5] hover:bg-[#E7EDF5] dark:hover:bg-[#203B5C]'
              }`}
              role="menuitem"
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
