import React from 'react';
import { useMaster } from '../context/MasterContext';
import type { Category } from '../lib/masterDb';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'home_repair', label: 'বাসার মেরামত' },
  { id: 'digital_gig', label: 'ডিজিটাল কাজ' },
  { id: 'equipment_rental', label: 'যন্ত্রপাতি ভাড়া' },
];

export const Footer: React.FC = () => {
  const { goExplore, goHow, openSignup } = useMaster();

  return (
    <footer className="safe-bottom border-t border-white/[0.07] bg-[#08080a]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <img src={`${import.meta.env.BASE_URL}dorymo-icon.svg`} alt="dorymo" className="h-8 w-8 rounded-lg" />
              <span className="text-base font-bold text-white">dorymo</span>
            </div>
            <p className="mt-3 max-w-sm text-[12.5px] leading-relaxed text-zinc-500">
              বাংলাদেশের জন্য তৈরি একটি নিরাপদ সেবা প্ল্যাটফর্ম। ঘরের মিস্ত্রি, ডিজিটাল কাজ কিংবা
              যন্ত্রপাতি ভাড়া — সব এক জায়গায়, নির্দিষ্ট দাম ও ৭ দিনের ওয়ারেন্টিসহ।
            </p>
            <p className="mt-4 text-[11.5px] text-zinc-600">
              জুলাই ২০২৪ গণঅভ্যুত্থানের স্মরণে — নতুন বাংলাদেশের জন্য।
            </p>
          </div>

          <div>
            <p className="text-[12px] font-semibold text-zinc-300">সেবা</p>
            <ul className="mt-3 space-y-2">
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => goExplore(c.id)}
                    className="text-[12.5px] text-zinc-500 transition-colors hover:text-orange-400"
                  >
                    {c.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[12px] font-semibold text-zinc-300">অ্যাকাউন্ট</p>
            <ul className="mt-3 space-y-2">
              <li>
                <button onClick={openSignup} className="text-[12.5px] text-zinc-500 transition-colors hover:text-orange-400">
                  গ্রাহক লগইন
                </button>
              </li>
              <li>
                <button onClick={openSignup} className="text-[12.5px] text-zinc-500 transition-colors hover:text-orange-400">
                  প্রোভাইডার হিসেবে যোগ দিন
                </button>
              </li>
              <li>
                <button onClick={goHow} className="text-[12.5px] text-zinc-500 transition-colors hover:text-orange-400">
                  কীভাবে কাজ করে
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-9 flex flex-col gap-2 border-t border-white/[0.06] pt-5 text-[11.5px] text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} dorymo। সর্বস্বত্ব সংরক্ষিত।</p>
          <p>বাংলায় তৈরি, বাংলাদেশের জন্য ❤</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
