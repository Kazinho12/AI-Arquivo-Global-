/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium uppercase tracking-wider text-[#5A6D82] dark:text-[#BFC9D6] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[#5A6D82] dark:text-[#BFC9D6]/70">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-[#FFFFFF] dark:bg-[#14243B] text-[#0B1220] dark:text-[#F8FAFC] placeholder-[#5A6D82]/60 dark:placeholder-[#BFC9D6]/40 text-sm rounded-lg border transition-colors duration-150 py-2.5 ${
              leftIcon ? 'pl-10' : 'pl-3.5'
            } ${rightIcon ? 'pr-10' : 'pr-3.5'} ${
              error
                ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                : 'border-[#D8E2ED] dark:border-[#203B5C] focus:border-[#203B5C] dark:focus:border-[#BFC9D6] focus:ring-1 focus:ring-[#203B5C] dark:focus:ring-[#BFC9D6]'
            } outline-none disabled:opacity-50 disabled:bg-[#E7EDF5] dark:disabled:bg-[#0B1220] ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-[#5A6D82] dark:text-[#BFC9D6]/70">
              {rightIcon}
            </div>
          )}
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

Input.displayName = 'Input';
