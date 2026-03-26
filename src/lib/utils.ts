import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-MM', {
    style: 'currency',
    currency: 'MMK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateOrderNumber(todayOrderCount: number) {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const count = String(todayOrderCount + 1).padStart(3, '0');
  return `${day}${month}${year}${count}`;
}

export function convertMyanmarToEnglish(input: string): string {
  const myanmarDigits = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];
  return input.split('').map(char => {
    const index = myanmarDigits.indexOf(char);
    return index !== -1 ? index.toString() : char;
  }).join('');
}
