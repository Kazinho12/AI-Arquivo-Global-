/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Falha temporária ao consultar o Arquivo',
  message = 'Ocorreu uma anomalia ao tentar recuperar os registos solicitados. Verifique a sua ligação ou tente novamente.',
  onRetry,
  retryLabel = 'Tentar Novamente',
}) => {
  return (
    <div className="py-12 px-6 text-center max-w-md mx-auto flex flex-col items-center">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-500">
        <AlertCircle className="w-7 h-7" />
      </div>

      <h3 className="font-title text-xl sm:text-2xl font-bold text-[#0B1220] dark:text-[#F8FAFC]">
        {title}
      </h3>
      <p className="mt-2 text-sm text-[#5A6D82] dark:text-[#BFC9D6] leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <div className="mt-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
