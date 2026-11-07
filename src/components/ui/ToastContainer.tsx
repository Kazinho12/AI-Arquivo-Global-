/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  const iconMap = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-sky-400 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
  };

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        const type = toast.type || 'info';
        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl border border-[#203B5C] bg-[#14243B] text-[#F8FAFC] shadow-2xl animate-in slide-in-from-bottom-2 duration-200"
          >
            {iconMap[type]}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold tracking-wide text-[#F8FAFC]">
                {toast.title}
              </p>
              {toast.message && (
                <p className="mt-1 text-xs text-[#BFC9D6] leading-relaxed">
                  {toast.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-[#BFC9D6] hover:text-[#F8FAFC] p-1 rounded transition-colors"
              aria-label="Dispensar notificação"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
