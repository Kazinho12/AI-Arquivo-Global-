/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium tracking-tight rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap shrink-0 cursor-pointer select-none';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 focus-visible:ring-offset-1',
    md: 'text-sm px-4 py-2 gap-2 focus-visible:ring-offset-2',
    lg: 'text-base px-5 py-2.5 gap-2.5 focus-visible:ring-offset-2',
  };

  const variantStyles = {
    // Primário: No dark mode destaca com prata luminoso / azul profundo; no light mode usa o azul abissal
    primary: 'bg-[#BFC9D6] text-[#0B1220] hover:bg-[#E7EDF5] active:bg-[#BFC9D6] dark:bg-[#BFC9D6] dark:text-[#0B1220] dark:hover:bg-[#F8FAFC] dark:hover:shadow-[0_0_15px_rgba(191,201,214,0.25)] focus-visible:ring-[#BFC9D6] dark:focus-visible:ring-offset-[#0B1220] font-semibold',
    
    // Secundário: Superfície noturna elegante
    secondary: 'bg-[#14243B] text-[#F8FAFC] hover:bg-[#203B5C] border border-[#203B5C] dark:bg-[#14243B] dark:text-[#F8FAFC] dark:hover:bg-[#203B5C] dark:border-[#203B5C] focus-visible:ring-[#203B5C] dark:focus-visible:ring-offset-[#0B1220]',
    
    // Outline: Linha de prata / azul profundo com fundo transparente
    outline: 'border border-[#203B5C] text-[#14243B] hover:bg-[#E7EDF5]/50 dark:border-[#203B5C] dark:text-[#E7EDF5] dark:hover:bg-[#14243B] dark:hover:border-[#BFC9D6] focus-visible:ring-[#203B5C] dark:focus-visible:ring-offset-[#0B1220]',
    
    // Ghost: Sem borda, apenas hover sutil
    ghost: 'text-[#14243B] hover:bg-[#E7EDF5] dark:text-[#BFC9D6] dark:hover:text-[#F8FAFC] dark:hover:bg-[#14243B] focus-visible:ring-[#203B5C] dark:focus-visible:ring-offset-[#0B1220]',
    
    // Subtle: Superfície gelo no light, azul noturno no dark
    subtle: 'bg-[#E7EDF5] text-[#0B1220] hover:bg-[#D8E2ED] dark:bg-[#14243B]/80 dark:text-[#BFC9D6] dark:hover:text-[#F8FAFC] dark:hover:bg-[#203B5C] focus-visible:ring-[#203B5C] dark:focus-visible:ring-offset-[#0B1220]',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
