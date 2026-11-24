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

/**
 * মনোরম ও মৃদু সাউন্ড/হ্যাপটিক ফিডব্যাক (Web Audio API).
 * কোনো ভারী অডিও ফাইলের প্রয়োজন নেই।
 */
export function playChime(type: 'tap' | 'success' | 'alert' = 'tap') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'tap') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === 'alert') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(750, now + 0.08);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  } catch {
    // অডিও ব্লক থাকলে কোনো এরর ছড়াবে না
  }
}

/**
 * bKash / Nagad ব্যক্তিগত SMS থেকে TrxID, টাকা ও প্রেরকের নম্বর স্বয়ংক্রিয় নিষ্কাশন
 */
export function parseBkashSms(text: string): {
  trxId: string | null;
  amount: number | null;
  sender: string | null;
} {
  if (!text) return { trxId: null, amount: null, sender: null };

  // 1. TrxID / TxnID extraction
  const trxMatch =
    text.match(/(?:TrxID|TxnID|TxID|Trx\s*Id)[:\s]*([A-Za-z0-9]{8,14})/i) ||
    text.match(/\b([0-9A-Z]{9,12})\b/);
  const trxId = trxMatch ? trxMatch[1].trim().toUpperCase() : null;

  // 2. Amount extraction (e.g. Tk 700.00 or Tk 700 or ৳700)
  const amtMatch =
    text.match(/(?:Tk|TK|BDT|৳)\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i) ||
    text.match(/(?:Amount|পরিমাণ)[:\s]*(?:Tk|TK|BDT|৳)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i);
  let amount: number | null = null;
  if (amtMatch) {
    const rawNum = amtMatch[1].replace(/,/g, '');
    const parsed = parseFloat(rawNum);
    if (!isNaN(parsed) && parsed > 0) amount = parsed;
  }

  // 3. Sender phone (e.g. 017xxxxxxxx or 88017xxxxxxxx)
  const phoneMatch = text.match(/(?:from|Sender|নম্বর)[:\s]*(?:\+?88)?(01[3-9][0-9]{8})/i) ||
                     text.match(/(?:\+?88)?(01[3-9][0-9]{8})/);
  const sender = phoneMatch ? phoneMatch[1] : null;

  return { trxId, amount, sender };
}
