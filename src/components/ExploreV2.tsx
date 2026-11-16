/**
 * dorymo — Explore (Step 4).
 * Hyper-local filtering for home repair + rental; nationwide for digital work.
 * Real prices, real response times, REAL review ratings (no hardcoded 5 stars).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, Boxes, Clock, Laptop, MapPin, Search, ShieldCheck, Star, Wrench } from 'lucide-react';
import { useMaster } from '../context/MasterContext';
import {
  fetchProviderNames,
  fetchProviderRatings,
  fetchServices,
  type Category,
  type ServiceRow,
} from '../lib/masterDb';
import { formatCurrency } from '../lib/utils';
import { Badge, Button, Card, EmptyState } from './ui';
import { Reveal } from './Reveal';

const AREAS = ['All', 'Sonadanga', 'Khalishpur', 'Shib Bari', 'Nirala'];

const TABS: { id: Category | 'all'; label: string; en: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'সব সেবা', en: 'All', icon: ShieldCheck },
  { id: 'digital_gig', label: 'ডিজিটাল কাজ', en: 'Nationwide', icon: Laptop },
  { id: 'home_repair', label: 'বাসার মেরামত', en: 'Hyper-local', icon: Wrench },
  { id: 'equipment_rental', label: 'যন্ত্রপাতি ভাড়া', en: 'Refundable deposit', icon: Boxes },
];

const CATEGORY_LABEL: Record<Category, string> = {
  digital_gig: 'ডিজিটাল কাজ · Nationwide',
  home_repair: 'বাসার মেরামত · Hyper-local',
  equipment_rental: 'যন্ত্রপাতি ভাড়া · Refundable deposit',
};

export const ExploreV2: React.FC = () => {
  const { goPay, openSignup, profile, showToast, exploreCategory } = useMaster();

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [providerNames, setProviderNames] = useState<Record<string, string>>({});
  const [ratings, setRatings] = useState<Record<string, { avg: number; count: number }>>({});
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<Category | 'all'>(
    exploreCategory === 'digital_gig' || exploreCategory === 'home_repair' || exploreCategory === 'equipment_rental'
      ? exploreCategory
      : 'all'
  );

  useEffect(() => {
    if (exploreCategory === 'digital_gig' || exploreCategory === 'home_repair' || exploreCategory === 'equipment_rental') {
      setTab(exploreCategory);
    }
  }, [exploreCategory]);
  const [area, setArea] = useState('All');
  const [query, setQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState(50000);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchServices(), fetchProviderNames(), fetchProviderRatings()])
      .then(([s, p, r]) => {
        if (!mounted) return;
        setServices(s);
        setProviderNames(p);
        setRatings(r);
      })
      .catch((e) => showToast(e?.message || 'সেবা লোড করা যায়নি', 'error'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [showToast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((s) => {
      if (tab !== 'all' && s.category !== tab) return false;
      // hyper-local areas only apply to physical services
      if (area !== 'All' && !s.is_nationwide && s.area !== area) return false;
      if (Number(s.price) > maxPrice) return false;
      if (q && !`${s.title} ${s.description} ${providerNames[s.provider_id] || ''} ${s.area || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [services, tab, area, maxPrice, query, providerNames]);

  const book = (service: ServiceRow) => {
    if (!profile) {
      openSignup();
      return;
    }
    goPay(service.id);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-400">Explore · সেবা খুঁজুন</p>
        <h1 className="mt-1.5 font-display text-2xl text-white sm:text-3xl">আপনার এলাকায় সেবা খুঁজুন</h1>
        <p className="mt-1 text-[13px] text-zinc-500">
          ডিজিটাল কাজ সারা বাংলাদেশে · বাসার মেরামত ও যন্ত্রপাতি শুধু আপনার থানায়।
        </p>
      </div>

      {/* Category tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[12.5px] font-medium transition-colors ${
              tab === t.id
                ? 'border-orange-500/50 bg-orange-500/10 text-orange-300'
                : 'border-white/10 bg-zinc-900/40 text-zinc-400 hover:border-white/20'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
            <span className="hidden text-[10px] text-zinc-500 sm:inline">· {t.en}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-zinc-300">
              <Search className="mr-1 inline h-3.5 w-3.5" /> খুঁজুন · Search
            </label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="সেবা বা প্রোভাইডারের নাম…"
              className="h-10 w-full rounded-lg border border-white/10 bg-zinc-950/60 px-3 text-[13px] text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/60 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-zinc-300">
              <MapPin className="mr-1 inline h-3.5 w-3.5" /> এলাকা · Area
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AREAS.map((a) => (
                <button
                  key={a}
                  onClick={() => setArea(a)}
                  className={`rounded-lg border px-2.5 py-1.5 text-[11.5px] transition-colors ${
                    area === a ? 'border-orange-500/50 bg-orange-500/10 text-orange-300' : 'border-white/10 text-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div className="min-w-[150px]">
            <label className="mb-1.5 block text-[12px] font-medium text-zinc-300">
              সর্বোচ্চ দাম · Max price
            </label>
            <input
              type="range"
              min={500}
              max={50000}
              step={500}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-orange-500"
            />
            <p className="mt-0.5 text-[11px] text-orange-300">{formatCurrency(maxPrice)}</p>
          </div>
        </div>
      </Card>

      {/* Results */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12.5px] text-zinc-400">
          {loading ? 'লোড হচ্ছে…' : `${filtered.length} টি সেবা পাওয়া গেছে`}
          {area !== 'All' && <span className="text-zinc-600"> · {area}</span>}
        </p>
        <Badge tone="green"><ShieldCheck className="h-3 w-3" /> NID verified providers</Badge>
      </div>

      {!loading && filtered.length === 0 ? (
        <EmptyState
          title="এই ফিল্টারে কোনো সেবা নেই"
          description="এলাকা বা দামের সীমা বদলে আবার চেষ্টা করুন।"
          icon={<Search className="h-6 w-6" />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s, index) => {
            const rating = ratings[s.provider_id];
            return (
              <Reveal delay={index * 55}>
              <Card key={s.id} className="flex flex-col p-5 transition-colors hover:border-orange-500/30">
                <div className="flex items-start justify-between gap-2">
                  <Badge tone={s.category === 'equipment_rental' ? 'blue' : s.category === 'digital_gig' ? 'neutral' : 'orange'}>
                    {CATEGORY_LABEL[s.category]}
                  </Badge>
                  <span className="flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-1 text-[11px] text-zinc-300">
                    <Clock className="h-3 w-3" /> {s.response_minutes}m
                  </span>
                </div>

                <h3 className="mt-3 text-[15px] font-semibold leading-snug text-white">{s.title}</h3>
                <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-zinc-400">{s.description || 'বিস্তারিত জানতে বুক করুন।'}</p>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-zinc-500">
                  <span className="flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5 text-emerald-400" /> {providerNames[s.provider_id] || 'Verified provider'}</span>
                  <span className="flex items-center gap-1">
                    <Star className={`h-3.5 w-3.5 ${rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'}`} />
                    {rating ? `${rating.avg.toFixed(1)} (${rating.count})` : 'New'}
                  </span>
                </div>
                <p className="mt-1.5 flex items-center gap-1 text-[11.5px] text-zinc-500">
                  <MapPin className="h-3.5 w-3.5" /> {s.is_nationwide ? 'সারা বাংলাদেশ · Nationwide' : s.area || 'Khulna'}
                </p>

                <div className="mt-4 border-t border-white/[0.07] pt-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10.5px] uppercase tracking-wide text-zinc-600">Fixed price · নির্দিষ্ট দাম</p>
                      <p className="text-xl font-bold text-orange-400">{formatCurrency(Number(s.price))}</p>
                      {s.category === 'equipment_rental' && (
                        <p className="mt-0.5 text-[10.5px] text-emerald-400">+ {formatCurrency(Number(s.security_deposit))} refundable deposit</p>
                      )}
                    </div>
                    <Button size="sm" onClick={() => book(s)}>
                      বুক করুন <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="mt-2 text-center text-[10px] text-zinc-600">
                    Pay Only When Satisfied · ৭ দিনের ওয়ারেন্টি
                  </p>
                </div>
              </Card>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExploreV2;
