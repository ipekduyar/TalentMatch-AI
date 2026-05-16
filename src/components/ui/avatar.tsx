import * as React from "react";
import { cn } from "@/lib/utils";

export const Avatar = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)} {...props} />
);

export const AvatarImage = ({ className, src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img referrerPolicy="no-referrer" src={src} alt={alt} className={cn("aspect-square h-full w-full", className)} {...props} />
);

export const AvatarFallback = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-slate-500", className)} {...props} />
);
