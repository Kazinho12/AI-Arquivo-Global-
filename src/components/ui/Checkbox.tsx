/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check, Minus } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: React.ReactNode;
  description?: string;
  indeterminate?: boolean;
  error?: string;
  size?: 'sm' | 'md';
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      description,
      indeterminate = false,
      error,
      size = 'md',
      className = '',
      id,
      checked,
      disabled,
      onChange,
      ...props
    },
    ref
  ) => {
    const inputId = id || (typeof label === 'string' ? `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    const sizeStyles = {
      sm: 'w-4 h-4 rounded text-xs',
      md: 'w-5 h-5 rounded-md text-sm',
    };

    const iconSizes = {
      sm: 'w-3 h-3',
      md: 'w-3.5 h-3.5',
    };

    return (
      <div className="flex items-start gap-2.5 text-left select-none">
        <div className="relative flex items-center justify-center shrink-0 mt-0.5">
          <input
            id={inputId}
            ref={ref}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className="peer sr-only"
            {...props}
          />
          <div
            className={`${sizeStyles[size]} flex items-center justify-center border transition-all duration-150 cursor-pointer ${
              disabled
                ? 'opacity-40 cursor-not-allowed bg-[#E7EDF5] dark:bg-[#0B1220] border-[#D8E2ED] dark:border-[#203B5C]'
                : checked || indeterminate
                ? 'bg-[#14243B] dark:bg-[#BFC9D6] border-[#14243B] dark:border-[#BFC9D6] text-[#F8FAFC] dark:text-[#0B1220]'
                : error
                ? 'bg-[#FFFFFF] dark:bg-[#14243B] border-rose-500 hover:border-rose-600'
                : 'bg-[#FFFFFF] dark:bg-[#14243B] border-[#D8E2ED] dark:border-[#203B5C] hover:border-[#203B5C] dark:hover:border-[#BFC9D6]/60 peer-focus-visible:ring-2 peer-focus-visible:ring-[#203B5C]'
            } ${className}`}
            onClick={(e) => {
              if (!disabled && onChange) {
                const syntheticEvent = {
                  ...e,
                  target: { checked: !checked },
                } as unknown as React.ChangeEvent<HTMLInputElement>;
                onChange(syntheticEvent);
              }
            }}
          >
            {indeterminate ? (
              <Minus className={`${iconSizes[size]} stroke-[3]`} />
            ) : checked ? (
              <Check className={`${iconSizes[size]} stroke-[3]`} />
            ) : null}
          </div>
        </div>

        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={inputId}
                className={`text-xs sm:text-sm font-medium cursor-pointer ${
                  disabled
                    ? 'text-[#5A6D82]/60 dark:text-[#BFC9D6]/40 cursor-not-allowed'
                    : 'text-[#0B1220] dark:text-[#F8FAFC]'
                }`}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-[11px] text-[#5A6D82] dark:text-[#BFC9D6]/70 leading-normal mt-0.5">
                {description}
              </p>
            )}
            {error && <p className="text-xs text-rose-500 font-medium mt-1">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
