import * as React from "react";
import { cn } from "@/lib/utils";

export const Badge = ({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "secondary" | "outline" | "destructive" | "success" | "warning" | "indigo" }) => {
  const variants = {
    default: "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80",
    secondary: "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80",
    outline: "text-slate-950 border border-slate-200",
    destructive: "border-transparent bg-rose-500 text-slate-50 hover:bg-rose-500/80",
    success: "border-transparent bg-emerald-500 text-slate-50 hover:bg-emerald-500/80",
    warning: "border-transparent bg-amber-500 text-slate-50 hover:bg-amber-500/80",
    indigo: "border-transparent bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
  };

  return (
    <div className={cn("inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2", variants[variant as keyof typeof variants], className)} {...props} />
  );
};
