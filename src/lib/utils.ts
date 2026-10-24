import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Deterministic rounding for currency without IEEE-754 floating-point drift
 */
export function roundToPaise(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Format currency in Indian numbering system (en-IN, ₹)
 */
export function formatINR(val: number, includeDecimals = false): string {
  const rounded = roundToPaise(val);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  }).format(rounded);
}

/**
 * Format percentage with 1 or 2 decimals
 */
export function formatPercent(val: number): string {
  return `${(roundToPaise(val * 100) / 100).toFixed(1)}%`;
}
