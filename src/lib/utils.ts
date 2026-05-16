import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function getMatchColor(score: number) {
  if (score >= 80) return 'text-green-600 border-green-600';
  if (score >= 60) return 'text-amber-600 border-amber-600';
  return 'text-slate-600 border-slate-600';
}
