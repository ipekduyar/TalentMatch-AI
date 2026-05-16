import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-100',
      secondary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-100',
      outline: 'border border-slate-200 bg-transparent hover:bg-slate-50 text-slate-900',
      ghost: 'bg-transparent hover:bg-slate-100 text-slate-600',
      danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm'
    };
    
    const sizes = {
      sm: 'h-8 px-4 text-[10px] font-bold uppercase tracking-wider',
      md: 'h-11 px-6 text-sm font-bold tracking-tight',
      lg: 'h-14 px-10 text-base font-black tracking-tighter',
      icon: 'h-10 w-10 p-0'
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
