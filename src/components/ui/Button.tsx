import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90',
      secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80',
      outline: 'border border-zinc-200 bg-white hover:bg-zinc-100 hover:text-zinc-900',
      ghost: 'hover:bg-zinc-100 hover:text-zinc-900',
      destructive: 'bg-red-500 text-zinc-50 hover:bg-red-500/90',
    };

    const sizes = {
      sm: 'h-9 rounded-md px-3 text-xs',
      md: 'h-10 px-4 py-2',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
