import React, { useEffect, useRef, useState } from 'react';
import {
  Laptop,
  Wrench,
  Boxes,
  ArrowRight,
  ShieldCheck,
  Clock,
  BadgeCheck,
  Users,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useMaster } from '../context/MasterContext';
import { fetchServices, type Category, type ServiceRow } from '../lib/masterDb';
import { HeroArt } from './HeroArt';
import { Button, Card } from './ui';
import { Reveal } from './Reveal';
import { bn, formatCurrency } from '../lib/utils';

const CATEGORIES: {
  id: Category;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  points: string[];
}[] = [
  {
    id: 'digital_gig',
    title: 'ডিজিটাল কাজ',
    subtitle: 'ওয়েবসাইট, অ্যাপ, ডিজাইন ও লেখালেখি',
    description:
      'দক্ষ ফ্রিল্যান্সারের সাথে সরাসরি কাজ করুন। কাজের ধাপ অনুযায়ী টাকা নিরাপদে জমা থাকে, কাজ বুঝে নেওয়ার পরেই প্রোভাইডার টাকা পান।',
    icon: Laptop,
    points: ['ওয়েবসাইট ও অ্যাপ', 'গ্রাফিক ডিজাইন', 'কনটেন্ট লেখা'],
  },
  {
    id: 'home_repair',
    title: 'বাসার মেরামত',
    subtitle: 'ইলেকট্রিশিয়ান, প্লাম্বার ও টেকনিশিয়ান',
    description:
      'ঘরে বসেই যাচাইকৃত কারিগর ডাকুন। কাজের আগে দাম জানুন, কাজ শেষে ছবি দেখে যাচাই করে তবেই পেমেন্ট ছাড়ুন।',
    icon: Wrench,
    points: ['বৈদ্যুতিক কাজ', 'প্লাম্বিং', 'এসি ও ফ্যান সার্ভিস'],
  },
  {
    id: 'equipment_rental',
    title: 'যন্ত্রপাতি ভাড়া',
    subtitle: 'ড্রিল, জেনারেটর ও প্রয়োজনীয় টুলস',
    description:
      'প্রয়োজনের দিন কিনতে হবে না — ভাড়া নিন। নিরাপত্তা জমা এসক্রোতে থাকে, ফেরত দেওয়ার পর ফেরত পান।',
    icon: Boxes,
    points: ['পাওয়ার টুলস', 'জেনারেটর', 'নির্মাণ সরঞ্জাম'],
  },
];

const STEPS = [
  {
    icon: Sparkles,
    title: 'চাহিদা জানান',
    text: 'কী কাজ দরকার, কোথায় এবং কত বাজেট — সহজ ভাষায় লিখে দিন।',
  },
  {
    icon: BadgeCheck,
    title: 'যাচাই হয়',
    text: 'আমাদের টিম চাহিদাটি যাচাই করে উপযুক্ত প্রোভাইডারদের কাছে পৌঁছে দেয়।',
  },
  {
    icon: Users,
    title: 'প্রোভাইডার বাছুন',
    text: 'আগ্রহী প্রোভাইডারদের মধ্যে থেকে নিজের পছন্দমতো একজনকে বেছে নিন।',
  },
  {
    icon: ShieldCheck,
    title: 'কাজ বুঝে টাকা দিন',
    text: 'কাজের প্রমাণ দেখে সন্তুষ্ট হলে তবেই এসক্রো থেকে পেমেন্ট ছাড়ুন।',
  },
];

export const IntentRouter: React.FC = () => {
  const { goExplore, goProviderJobs, goAdmin, goChat, openSignup, profile } = useMaster();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    fetchServices().then((s) => { if (mounted) setServices(s); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(() => {
        if (heroRef.current) {
          heroRef.current.style.transform = `translateY(${Math.min(window.scrollY * 0.1, 55)}px)`;
        }
        raf = 0;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const goDashboard = () => {
    if (!profile) return openSignup();
    if (profile.role === 'provider') return goProviderJobs();
    if (profile.role === 'admin') return goAdmin();
    goChat();
  };

  const countFor = (id: Category) => services.filter((s) => s.category === id).length;
  const cheapest = services.length ? Math.min(...services.map((s) => Number(s.price))) : 0;
  const totalServices = services.length;

  return (
    <div className="relative">
      {/* ================= হিরো ================= */}
      <Reveal delay={0}><section className="relative overflow-hidden">
        {/* ডট ব্যাকগ্রাউন্ড */}
        <div className="pointer-events-none absolute inset-0 dot-grid opacity-[0.35]" aria-hidden="true" />
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-40 blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(255,133,39,0.35), transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 sm:pb-14 sm:pt-14 lg:pb-16 lg:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
            {/* বাম দিকের লেখা */}
            <div className="animate-fade-up text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11.5px] text-zinc-300 backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-500" />
                </span>
                বাংলাদেশের জন্য তৈরি — বাংলায় প্রথম পূর্ণ সেবা প্ল্যাটফর্ম
              </div>

              <h1 className="mt-5 font-display text-[2rem] leading-[1.28] tracking-tight text-white sm:text-[2.75rem] lg:text-[3.15rem]">
                সব ধরনের সেবা,
                <br />
                <span className="text-orange-500">এক জায়গায়।</span>
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-[14.5px] leading-relaxed text-zinc-400 sm:text-[15.5px] lg:mx-0">
                ঘরের মিস্ত্রি থেকে ওয়েবসাইট বানানো, কিংবা প্রয়োজনের দিন যন্ত্রপাতি ভাড়া — সবকিছু
                নিরাপদভাবে এক প্ল্যাটফর্মে। টাকা জমা থাকে আমাদের কাছে, কাজ বুঝে নিয়ে তবেই ছাড় পায়।
              </p>

              <div className="mt-7 flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
                <Button size="lg" onClick={() => goExplore()}>
                  সেবা খুঁজুন
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={goDashboard}>
                  {profile ? 'আমার ড্যাশবোর্ড' : 'অ্যাকাউন্ট খুলুন'}
                </Button>
              </div>

              {/* জরুরি টেকনিশিয়ান শর্টকাট কার্ড */}
              <div
                onClick={() => goExplore('home_repair')}
                className="mt-5 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-orange-950/20 to-zinc-950/40 p-3 sm:p-3.5 backdrop-blur-md transition-all hover:border-amber-500/60 hover:shadow-[0_0_25px_rgba(245,158,11,0.15)] group"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 group-hover:scale-105 transition-transform">
                    <Zap className="h-4 w-4 fill-amber-400 text-amber-400 animate-pulse" />
                  </span>
                  <div className="text-left">
                    <p className="text-[12.5px] font-semibold text-white flex items-center gap-1.5">
                      জরুরি মেরামত দরকার?
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9.5px] font-bold text-amber-300">
                        ৩০–৬০ মিনিট
                      </span>
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      বিদ্যুৎ, প্লাম্বিং বা এসির জরুরি সমস্যায় এখনই ডাকুন · Cash After Work
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </div>

              {/* ছোট পরিসংখ্যান */}
              <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/[0.07] pt-6">
                {[
                  totalServices > 0
                    ? { value: bn(totalServices), label: 'সক্রিয় সেবা' }
                    : { value: bn(3), label: 'সেবার ধরন' },
                  cheapest
                    ? { value: formatCurrency(cheapest), label: 'শুরুর দাম' }
                    : { value: '১০০%', label: 'এসক্রো সুরক্ষা' },
                  { value: `${bn(90)} মিনিট`, label: 'গড় সাড়া' },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-lg font-semibold text-white sm:text-xl">{s.value}</p>
                    <p className="text-[11.5px] text-zinc-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ডান দিকের ডট-শিল্পকর্ম */}
            <div className="relative flex items-center justify-center">
              <div className="relative mx-auto w-full max-w-[440px] sm:max-w-[500px] lg:max-w-[560px]">
                <div ref={heroRef} className="parallax-hero animate-slow-float px-2">
                  <HeroArt />
                </div>

                {/* ভাসমান তথ্য-চিহ্ন */}
                <div className="absolute left-0 top-1 hidden rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2 backdrop-blur-md sm:block">
                  <p className="text-[10.5px] font-medium text-zinc-500">এসক্রো সুরক্ষা</p>
                  <p className="text-[12px] font-semibold text-emerald-300">১০০% নিরাপদ</p>
                </div>
                <div className="absolute bottom-2 right-0 hidden rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2 backdrop-blur-md sm:block">
                  <p className="text-[10.5px] font-medium text-zinc-500">গড় সাড়া</p>
                  <p className="text-[12px] font-semibold text-orange-300">৯০ মিনিটের মধ্যে</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section></Reveal>

      {/* ================= ক্যাটাগরি ================= */}
      <Reveal delay={90}><section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="mb-8 text-center">
          <h2 className="font-display text-2xl text-white sm:text-[1.75rem]">আপনার কী প্রয়োজন?</h2>
          <p className="mt-1.5 text-[13.5px] text-zinc-500">তিনটি প্রধান সেবা — একটি অ্যাকাউন্টেই সব</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {CATEGORIES.map((cat, index) => {
            const Icon = cat.icon;
            const count = countFor(cat.id);
            return (
              <Card
                key={cat.id}
                className="group relative flex flex-col justify-between overflow-hidden p-5 transition-all duration-200 hover:border-orange-500/40 hover:bg-zinc-900/70 sm:p-6 animate-fade-up"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-orange-400 transition-colors group-hover:bg-orange-500 group-hover:text-black">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-md bg-white/[0.05] px-2 py-1 text-[11px] text-zinc-400">
                      {bn(count)} টি সেবা
                    </span>
                  </div>

                  <h3 className="mt-4 text-[17px] font-semibold text-white">{cat.title}</h3>
                  <p className="mt-0.5 text-[12.5px] text-orange-400/90">{cat.subtitle}</p>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-zinc-400">{cat.description}</p>

                  <ul className="mt-3.5 space-y-1.5">
                    {cat.points.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-[12.5px] text-zinc-400">
                        <span className="h-1 w-1 rounded-full bg-orange-500/70" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => goExplore(cat.id)}
                  className="mt-5 flex w-full items-center justify-between rounded-xl border border-white/10 px-4 py-2.5 text-[13px] font-medium text-zinc-200 transition-all hover:border-orange-500/50 hover:bg-orange-500 hover:text-black"
                >
                  <span>দেখুন</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </Card>
            );
          })}
        </div>
      </section></Reveal>

      {/* ================= কীভাবে কাজ করে ================= */}
      <Reveal delay={180}><section className="border-y border-white/[0.07] bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="mb-9 text-center">
            <h2 className="font-display text-2xl text-white sm:text-[1.75rem]">কীভাবে কাজ করে</h2>
            <p className="mt-1.5 text-[13.5px] text-zinc-500">চারটি সহজ ধাপে আপনার কাজ শেষ</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative rounded-2xl border border-white/[0.07] bg-zinc-900/30 p-5">
                  <span className="absolute right-4 top-4 text-[34px] font-bold leading-none text-white/[0.05]">
                    {bn(i + 1)}
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-orange-400">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="mt-3.5 text-[14.5px] font-semibold text-white">{step.title}</h3>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-400">{step.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section></Reveal>

      {/* ================= আস্থা ================= */}
      <Reveal delay={270}><section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: 'এসক্রো সুরক্ষা', text: 'টাকা আমাদের কাছে জমা থাকে, কাজ বুঝে নেওয়ার আগে প্রোভাইডার পান না।' },
            { icon: BadgeCheck, title: 'যাচাইকৃত প্রোভাইডার', text: 'প্রতিটি প্রোভাইডারের পরিচয় যাচাই করা হয় কাজ শুরুর আগেই।' },
            { icon: Clock, title: 'দ্রুত সাড়া', text: 'জরুরি কাজের জন্য সাধারণত ৯০ মিনিটের মধ্যেই প্রোভাইডার পাওয়া যায়।' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex gap-3.5 rounded-2xl border border-white/[0.07] bg-zinc-900/30 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-[14px] font-semibold text-white">{item.title}</h3>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-zinc-400">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* শেষের আহ্বান */}
        <div className="relative mt-10 overflow-hidden rounded-3xl border border-orange-500/25 bg-gradient-to-br from-orange-500/[0.12] via-zinc-900/40 to-zinc-900/10 px-6 py-10 text-center sm:px-10 sm:py-14">
          <div className="pointer-events-none absolute inset-0 dot-grid opacity-20" aria-hidden="true" />
          <h2 className="relative font-display text-2xl text-white sm:text-3xl">
            আজই শুরু করুন — সম্পূর্ণ ফ্রি
          </h2>
          <p className="relative mx-auto mt-2 max-w-lg text-[13.5px] leading-relaxed text-zinc-300">
            অ্যাকাউন্ট খুলতে কোনো টাকা লাগে না। আপনার নাম, ইমেইল ও মোবাইল নম্বর দিয়ে রেজিস্টার করুন —
            পরের বার একই তথ্য দিয়ে লগইন করলেই সব ফিরে পাবেন।
          </p>
          <div className="relative mt-6 flex flex-col items-stretch justify-center gap-2.5 sm:flex-row sm:items-center">
            <Button size="lg" onClick={openSignup}>
              গ্রাহক হিসেবে শুরু করুন
            </Button>
            <Button size="lg" variant="outline" onClick={openSignup}>
              প্রোভাইডার হিসেবে যোগ দিন
            </Button>
          </div>
        </div>
      </section></Reveal>
    </div>
  );
};

export default IntentRouter;
