import React from 'react';
import { ShieldCheck, BadgeCheck, Clock, Wallet, Users, FileCheck2, ArrowRight } from 'lucide-react';
import { useMaster } from '../context/MasterContext';
import { Button } from './ui';
import { Reveal } from './Reveal';

const CUSTOMER_STEPS = [
  { icon: FileCheck2, title: 'চাহিদা লিখুন', text: 'কী কাজ দরকার, কোথায় করতে হবে এবং আনুমানিক বাজেট কত — সব লিখে জমা দিন।' },
  { icon: BadgeCheck, title: 'যাচাই সম্পন্ন হয়', text: 'আমাদের টিম চাহিদাটি যাচাই করে নিশ্চিত করে এটি সম্পূর্ণ ও বাস্তবসম্মত।' },
  { icon: Users, title: 'প্রোভাইডার বাছুন', text: 'আগ্রহী প্রোভাইডারদের নাম, কাজ ও রেটিং দেখে একজনকে বেছে নিন।' },
  { icon: ShieldCheck, title: 'প্রমাণ দেখে পেমেন্ট', text: 'কাজ শেষে ছবি ও বিবরণ দেখে সন্তুষ্ট হলে তবেই এসক্রো থেকে টাকা ছাড়ুন।' },
];

const PROVIDER_STEPS = [
  { icon: Wallet, title: 'অ্যাকাউন্ট খুলুন', text: 'নাম, ইমেইল, মোবাইল ও পাসওয়ার্ড দিয়ে প্রোভাইডার হিসেবে রেজিস্টার করুন।' },
  { icon: FileCheck2, title: 'সেবা যোগ করুন', text: 'আপনার কাজের ধরন, দাম ও সময়সূচি দিয়ে নিজের সেবা তালিকায় যোগ করুন।' },
  { icon: BadgeCheck, title: 'চাহিদা দেখুন', text: 'যাচাইকৃত গ্রাহকের চাহিদা দেখে আগ্রহ প্রকাশ করুন।' },
  { icon: Clock, title: 'কাজ করুন, টাকা পান', text: 'কাজ শেষে প্রমাণ জমা দিন। গ্রাহক অনুমোদন দিলেই টাকা আপনার অ্যাকাউন্টে।' },
];

const FAQ = [
  {
    q: 'আমার টাকা কি নিরাপদ?',
    a: 'হ্যাঁ। গ্রাহকের পেমেন্ট সরাসরি প্রোভাইডারকে দেওয়া হয় না — তা এসক্রোতে জমা থাকে। গ্রাহক কাজ বুঝে নেওয়ার অনুমতি দিলেই কেবল তা প্রোভাইডার পান। কোনো সমস্যা হলে বিরোধ জানানো যায়।',
  },
  {
    q: 'অ্যাকাউন্ট খুলতে কি টাকা লাগে?',
    a: 'না, সম্পূর্ণ ফ্রি। শুধু নাম, ইমেইল, মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে রেজিস্টার করলেই হবে।',
  },
  {
    q: 'পরের বার লগইন করলে আমার তথ্য থাকবে?',
    a: 'হ্যাঁ। আপনার নাম, ইমেইল, মোবাইল নম্বর আপনার অ্যাকাউন্টের সাথে নিরাপদে সংরক্ষিত থাকে। একই ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করলেই সব তথ্য ফিরে পাবেন।',
  },
  {
    q: 'প্রোভাইডার কারা?',
    a: 'ইলেকট্রিশিয়ান, প্লাম্বার, টেকনিশিয়ান, ডেভেলপার, ডিজাইনার কিংবা যন্ত্রপাতির মালিক — যেকোনো ব্যক্তি প্রোভাইডার হিসেবে যোগ দিতে পারেন। প্রতিটি প্রোভাইডারের পরিচয় যাচাই করা হয়।',
  },
  {
    q: 'পেমেন্ট কীভাবে করব?',
    a: 'বিকাশ বা নগদ থেকে আমার পার্সোনাল নম্বরে Send Money করে TrxID জমা দিন — আমি SMS মিলিয়ে যাচাই করি। বাসার মেরামতের ক্ষেত্রে "কাজ শেষে নগদ" বিকল্পও আছে, অর্থাৎ আগে কোনো টাকা দিতে হবে না।',
  },
];

export const HowItWorks: React.FC = () => {
  const { openSignup, goExplore } = useMaster();
  const [openFaq, setOpenFaq] = React.useState<number | null>(0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="text-center">
        <h1 className="font-display text-3xl text-white sm:text-4xl">কীভাবে কাজ করে</h1>
        <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-zinc-400">
          dorymo কাজ করে খুব সহজভাবে — গ্রাহক চাহিদা জানান, প্রোভাইডার কাজ করেন, আর টাকা
          নিরাপদে থাকে আমাদের এসক্রোতে।
        </p>
      </div>

      {/* গ্রাহকের জন্য */}
      <Reveal delay={0}><section className="mt-12">
        <div className="mb-5 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          <h2 className="text-lg font-semibold text-white">গ্রাহকের জন্য</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {CUSTOMER_STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[11.5px] font-medium text-zinc-500">ধাপ {i + 1}</span>
                </div>
                <h3 className="mt-3 text-[14.5px] font-semibold text-white">{s.title}</h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-400">{s.text}</p>
              </div>
            );
          })}
        </div>
      </section></Reveal>

      {/* প্রোভাইডারের জন্য */}
      <Reveal delay={80}><section className="mt-10">
        <div className="mb-5 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
          <h2 className="text-lg font-semibold text-white">প্রোভাইডারের জন্য</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {PROVIDER_STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[11.5px] font-medium text-zinc-500">ধাপ {i + 1}</span>
                </div>
                <h3 className="mt-3 text-[14.5px] font-semibold text-white">{s.title}</h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-400">{s.text}</p>
              </div>
            );
          })}
        </div>
      </section></Reveal>

      {/* প্রশ্নোত্তর */}
      <Reveal delay={160}><section className="mt-12">
        <h2 className="mb-5 text-lg font-semibold text-white">সাধারণ প্রশ্ন</h2>
        <div className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/30">
          {FAQ.map((item, i) => (
            <div key={item.q}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
              >
                <span className="text-[13.5px] font-medium text-zinc-100">{item.q}</span>
                <span className="shrink-0 text-zinc-500">{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && (
                <p className="animate-fade-in px-5 pb-4 text-[12.5px] leading-relaxed text-zinc-400">{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </section></Reveal>

      <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-orange-500/25 bg-orange-500/[0.06] px-6 py-8 text-center">
        <h3 className="text-lg font-semibold text-white">প্রস্তুত?</h3>
        <p className="max-w-md text-[13px] text-zinc-400">
          আজই অ্যাকাউন্ট খুলুন এবং আপনার প্রথম কাজ শুরু করুন।
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => goExplore()}>
            সেবা খুঁজুন <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={openSignup}>
            প্রোভাইডার হিসেবে যোগ দিন
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
