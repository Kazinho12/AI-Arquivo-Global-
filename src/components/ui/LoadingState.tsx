/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  variant?: 'centered' | 'inline' | 'skeleton';
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'A carregar registos do Arquivo...',
  subMessage = 'Sincronizando índices editoriais e metadados',
  variant = 'centered',
  className = '',
}) => {
  if (variant === 'inline') {
    return (
      <div className={`inline-flex items-center gap-2 text-xs text-[#5A6D82] dark:text-[#BFC9D6] ${className}`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#203B5C] dark:text-[#BFC9D6]" />
        <span>{message}</span>
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className={`space-y-4 animate-pulse ${className}`}>
        <div className="h-6 w-1/3 bg-[#E7EDF5] dark:bg-[#1B2E49] rounded-md" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-[#E7EDF5] dark:bg-[#1B2E49] rounded" />
          <div className="h-4 w-4/5 bg-[#E7EDF5] dark:bg-[#1B2E49] rounded" />
          <div className="h-4 w-2/3 bg-[#E7EDF5] dark:bg-[#1B2E49] rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className={`py-16 px-4 flex flex-col items-center justify-center text-center ${className}`}>
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-xl bg-[#E7EDF5] dark:bg-[#14243B] border border-[#D8E2ED] dark:border-[#203B5C] flex items-center justify-center text-[#203B5C] dark:text-[#BFC9D6]">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </div>

      <h4 className="font-title text-base sm:text-lg font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
        {message}
      </h4>

      {subMessage && (
        <p className="mt-1 text-xs text-[#5A6D82] dark:text-[#BFC9D6] max-w-xs leading-relaxed">
          {subMessage}
        </p>
      )}
    </div>
  );
};
