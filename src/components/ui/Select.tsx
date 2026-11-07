/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, error, options, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full text-left">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-medium uppercase tracking-wider text-[#5A6D82] dark:text-[#BFC9D6] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={`w-full appearance-none bg-[#FFFFFF] dark:bg-[#14243B] text-[#0B1220] dark:text-[#F8FAFC] text-sm rounded-lg border transition-colors duration-150 py-2.5 pl-3.5 pr-10 ${
              error
                ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                : 'border-[#D8E2ED] dark:border-[#203B5C] focus:border-[#203B5C] dark:focus:border-[#BFC9D6] focus:ring-1 focus:ring-[#203B5C] dark:focus:ring-[#BFC9D6]'
            } outline-none cursor-pointer disabled:opacity-50 disabled:bg-[#E7EDF5] dark:disabled:bg-[#0B1220] ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-white dark:bg-[#14243B] text-[#0B1220] dark:text-[#F8FAFC]">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 pointer-events-none text-[#5A6D82] dark:text-[#BFC9D6]/70">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-rose-500 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-[#5A6D82] dark:text-[#BFC9D6]/70">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
