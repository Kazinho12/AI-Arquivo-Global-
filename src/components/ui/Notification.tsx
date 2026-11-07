/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface NotificationProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export const Notification: React.FC<NotificationProps> = ({
  type = 'info',
  title,
  children,
  onDismiss,
  action,
  className = '',
}) => {
  const config = {
    success: {
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
      bg: 'bg-emerald-500/10 dark:bg-emerald-950/30',
      border: 'border-emerald-500/30',
      text: 'text-emerald-900 dark:text-emerald-200',
    },
    error: {
      icon: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
      bg: 'bg-rose-500/10 dark:bg-rose-950/30',
      border: 'border-rose-500/30',
      text: 'text-rose-900 dark:text-rose-200',
    },
    warning: {
      icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
      bg: 'bg-amber-500/10 dark:bg-amber-950/30',
      border: 'border-amber-500/30',
      text: 'text-amber-900 dark:text-amber-200',
    },
    info: {
      icon: <Info className="w-4 h-4 text-sky-500 shrink-0" />,
      bg: 'bg-sky-500/10 dark:bg-sky-950/30',
      border: 'border-sky-500/30',
      text: 'text-sky-900 dark:text-sky-200',
    },
  };

  const current = config[type];

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 p-3.5 rounded-lg border ${current.bg} ${current.border} ${current.text} transition-colors ${className}`}
    >
      <div className="mt-0.5">{current.icon}</div>
      <div className="flex-1 min-w-0 text-left">
        {title && (
          <h5 className="text-xs sm:text-sm font-semibold tracking-tight mb-0.5 text-current">
            {title}
          </h5>
        )}
        <div className="text-xs leading-relaxed opacity-90">{children}</div>
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded text-current opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dispensar aviso"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
