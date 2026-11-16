import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** ৳ সহ বাংলা সংখ্যায় টাকা দেখায় */
export function formatCurrency(amount: number): string {
  return `৳${new Intl.NumberFormat('bn-BD', { maximumFractionDigits: 0 }).format(amount || 0)}`;
}

/** বাংলা সংখ্যা */
export function bn(number: number | string): string {
  return String(number).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
}

/** ISO তারিখ → বাংলা তারিখ */
export function formatDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** সময়-বান্ধব অপেক্ষার লেখা */
export function timeAgo(iso: string): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'এইমাত্র';
  if (mins < 60) return `${bn(mins)} মিনিট আগে`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${bn(hours)} ঘণ্টা আগে`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${bn(days)} দিন আগে`;
  return formatDate(iso);
}
