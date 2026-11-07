/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  maxLength?: number;
  currentLength?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, maxLength, currentLength, className = '', id, ...props }, ref) => {
    const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full text-left">
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <label htmlFor={textareaId} className="block text-xs font-medium uppercase tracking-wider text-[#5A6D82] dark:text-[#BFC9D6]">
              {label}
            </label>
          )}
          {maxLength && (
            <span className="text-xs text-[#5A6D82] dark:text-[#BFC9D6]/60">
              {currentLength ?? 0}/{maxLength}
            </span>
          )}
        </div>
        <textarea
          id={textareaId}
          ref={ref}
          maxLength={maxLength}
          rows={props.rows || 4}
          className={`w-full bg-[#FFFFFF] dark:bg-[#14243B] text-[#0B1220] dark:text-[#F8FAFC] placeholder-[#5A6D82]/60 dark:placeholder-[#BFC9D6]/40 text-sm rounded-lg border transition-colors duration-150 p-3 ${
            error
              ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
              : 'border-[#D8E2ED] dark:border-[#203B5C] focus:border-[#203B5C] dark:focus:border-[#BFC9D6] focus:ring-1 focus:ring-[#203B5C] dark:focus:ring-[#BFC9D6]'
          } outline-none resize-y disabled:opacity-50 disabled:bg-[#E7EDF5] dark:disabled:bg-[#0B1220] ${className}`}
          {...props}
        />
        {error ? (
          <p className="mt-1.5 text-xs text-rose-500 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-[#5A6D82] dark:text-[#BFC9D6]/70">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
