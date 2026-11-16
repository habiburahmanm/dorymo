/**
 * dorymo — Manual SIM Checkout (psychology-driven).
 *
 * Triggers embedded here:
 *  - Fixed price + "within 90 mins" on the card -> kills decision anxiety
 *  - Trust badges ("Pay Only When Satisfied", "NID Verified") -> fear of scam
 *  - Cash After Work default for home repairs -> zero financial risk
 *  - 7-day warranty + ৳100 next-order discount -> loss aversion / anti-bypass
 *  - Deposit framed as "100% Refundable upon safe return" -> rental commitment
 *  - Copy-number button -> zero frustration
 *  - Bilingual (Bangla primary, English secondary) labels
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Gift,
  MapPin,
  RefreshCcw,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useMaster } from '../context/MasterContext';
import { fetchProviderNames, fetchSavedAddresses, fetchServices, type SavedAddress, type ServiceRow } from '../lib/masterDb';
import { formatCurrency } from '../lib/utils';
import { Badge, Button, Card, Field, Select } from './ui';

const OWNER_BKASH = (import.meta.env.VITE_OWNER_BKASH_NUMBER || '01700000000').trim();
const OWNER_NAGAD = (import.meta.env.VITE_OWNER_NAGAD_NUMBER || '01900000000').trim();

const CATEGORY_LABEL: Record<ServiceRow['category'], { bn: string; en: string }> = {
  digital_gig: { bn: 'ডিজিটাল কাজ', en: 'Digital Work · Nationwide' },
  home_repair: { bn: 'বাসার মেরামত', en: 'Home Repair · Hyper-local' },
  equipment_rental: { bn: 'যন্ত্রপাতি ভাড়া', en: 'Equipment Rental · Refundable deposit' },
};

/** Bangla primary + small English secondary — helps local technicians & users */
const Bi: React.FC<{ bn: string; en: string; className?: string }> = ({ bn, en, className = '' }) => (
  <span className={className}>
    {bn}
    <span className="ml-1.5 text-[10px] font-normal text-zinc-500">· {en}</span>
  </span>
);

export const ManualCheckout: React.FC = () => {
  const { goHome, goAdmin, submitPayment, profile, isAdmin, showToast, preselectedServiceId } = useMaster();

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [providerNames, setProviderNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [serviceId, setServiceId] = useState('');
  const [method, setMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [sender, setSender] = useState('');
  const [trxId, setTrxId] = useState('');
  const [address, setAddress] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [cashAfterWork, setCashAfterWork] = useState(false);
  const [busy, setBusy] = useState(false);
  const [doneOrderId, setDoneOrderId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchServices(), fetchProviderNames(), fetchSavedAddresses()])
      .then(([s, p, addrs]) => {
        if (!mounted) return;
        setServices(s);
        setProviderNames(p);
        setSavedAddresses(addrs);
        const def = addrs.find((a) => a.is_default) || addrs[0];
        if (def) setAddress(`${def.street}, ${def.city}`);
        const chosen = preselectedServiceId && s.some((x) => x.id === preselectedServiceId)
          ? preselectedServiceId
          : s[0]?.id;
        if (chosen) setServiceId(chosen);
      })
      .catch((e) => showToast(e?.message || 'সেবা লোড করা যায়নি', 'error'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [showToast, preselectedServiceId]);

  const service = useMemo(() => services.find((s) => s.id === serviceId) ?? null, [services, serviceId]);

  // Home repair => Cash After Work ON by default (zero financial risk)
  useEffect(() => {
    if (service) setCashAfterWork(service.category === 'home_repair');
  }, [service]);

  const isRental = service?.category === 'equipment_rental';
  const total = service ? Number(service.price) + Number(service.security_deposit) : 0;
  const payNumber = method === 'bkash' ? OWNER_BKASH : OWNER_NAGAD;

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(payNumber);
      showToast('নম্বার কপি হয়েছে', 'success');
    } catch {
      showToast(payNumber, 'info');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return showToast('একটি সেবা বেছে নিন', 'error');
    if (!cashAfterWork && trxId.trim().length < 6) {
      return showToast('সঠিক Transaction ID দিন', 'error');
    }
    setBusy(true);
    const id = await submitPayment({
      serviceId: service.id,
      address: address.trim() || profile?.area || 'Khulna',
      method,
      senderNumber: sender.trim() || '—',
      trxId: cashAfterWork ? 'CASH_AFTER_WORK' : trxId.trim(),
      cashAfterWork,
      scheduledDate: scheduledDate || undefined,
      timeSlot: timeSlot || undefined,
    });
    setBusy(false);
    if (id) setDoneOrderId(id);
  };

  if (doneOrderId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14 sm:px-6">
        <Card className="p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="mt-5 font-display text-2xl text-white">
            {cashAfterWork ? 'অর্ডার কনফার্ম!' : 'পেমেন্ট জমা পড়েছে'}
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-zinc-400">
            {cashAfterWork
              ? 'কাজ শেষে টাকা দিন — আগে কোনো পেমেন্ট লাগবে না। প্রোভাইডার শীঘ্রই যোগাযোগ করবে।'
              : 'আমি SMS চেক করে পেমেন্ট যাচাই করব। অনুমোদনের সাথে সাথে প্রোভাইডারের জন্য কাজ খুলে যাবে।'}
          </p>
          <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950/60 p-4 text-left">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">Order ID</p>
            <p className="mt-1 break-all font-mono text-[12px] text-orange-300">{doneOrderId}</p>
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="outline" onClick={goHome}>
              <ArrowLeft className="h-4 w-4" /> হোমপেজে ফিরুন
            </Button>
            {isAdmin && (
              <Button onClick={goAdmin}>অ্যাডমিন কনসোল খুলুন</Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <button onClick={goHome} className="mb-6 flex items-center gap-1.5 text-[13px] text-zinc-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> ফিরে যান
      </button>

      <div className="mb-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-400">Secure Checkout · নিরাপদ চেকআউট</p>
        <h1 className="mt-1.5 font-display text-2xl text-white sm:text-3xl">নিশ্চিত করে বুক করুন</h1>
        <p className="mt-1 text-[13px] text-zinc-500">
          সবচেয়ে কম ঝুঁকিতে সেবা পেতে নিচের ধাপগুলো অনুসরণ করুন।
        </p>
      </div>

      {/* Trust bar — reciprocal reassurance */}
      <div className="mb-6 grid gap-2 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, bn: ' Pay Only When Satisfied', en: 'Pay after you are happy' },
          { icon: CheckCircle2, bn: 'NID Verified Professionals', en: 'Identity-checked providers' },
          { icon: RefreshCcw, bn: '100% Refundable Deposit', en: 'Deposit back on safe return' },
        ].map((t) => (
          <div key={t.en} className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-zinc-900/40 px-3 py-2.5">
            <t.icon className="h-4 w-4 shrink-0 text-emerald-400" />
            <span className="text-[12px] text-zinc-300">
              <Bi bn={t.bn} en={t.en} />
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* ---------------- LEFT: what you are booking ---------------- */}
        <Card className="p-5 sm:p-6">
          <h2 className="text-[15px] font-semibold text-white">আপনার বুকিং</h2>

          <div className="mt-4 space-y-1.5">
            <label className="block text-[12.5px] font-medium text-zinc-300">
              <Bi bn="সেবা বেছে নিন" en="Choose a service" />
            </label>
            <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)} disabled={loading}>
              <option value="">{loading ? 'লোড হচ্ছে…' : '— সেবা নির্বাচন —'}</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} — {formatCurrency(Number(s.price))}
                  {s.is_nationwide ? ' (Nationwide)' : s.area ? ` (${s.area})` : ''}
                </option>
              ))}
            </Select>
          </div>

          {service && (
            <div className="mt-4 rounded-xl border border-orange-500/20 bg-orange-500/[0.05] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[15px] font-semibold text-white">{service.title}</p>
                  <p className="mt-0.5 text-[11.5px] text-orange-300">
                    {CATEGORY_LABEL[service.category].bn}
                    <span className="ml-1 text-zinc-500">· {CATEGORY_LABEL[service.category].en}</span>
                  </p>
                  <p className="mt-1 text-[12px] text-zinc-400">
                    {providerNames[service.provider_id] || 'Nexserve Provider'}
                  </p>
                </div>
                <Badge tone="orange" className="shrink-0">
                  <Clock className="h-3 w-3" /> {service.response_minutes} min
                </Badge>
              </div>

              <div className="mt-4 space-y-2 border-t border-white/[0.07] pt-3 text-[13px]">
                <div className="flex justify-between text-zinc-400">
                  <span>Service fee · সেবা মূল্য</span>
                  <span className="text-zinc-200">{formatCurrency(Number(service.price))}</span>
                </div>
                {isRental && (
                  <div className="flex justify-between text-zinc-400">
                    <span className="flex items-center gap-1"><RefreshCcw className="h-3 w-3" /> Refundable deposit</span>
                    <span className="text-zinc-200">{formatCurrency(Number(service.security_deposit))}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-white/[0.07] pt-2 text-[15px] font-semibold text-white">
                  <span>Total · মোট</span>
                  <span className="text-orange-400">{formatCurrency(total)}</span>
                </div>
                <p className="pt-1 text-center text-[10.5px] text-zinc-600">
                  এর মধ্যে প্ল্যাটফর্ম ফি {formatCurrency(Math.round(Number(service.price) * 0.1))} — ৭ দিনের ওয়ারেন্টি ও সাপোর্টের জন্য
                </p>
              </div>
            </div>
          )}

          {/* Cash after work — default ON for home repair */}
          {service?.category === 'home_repair' && (
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-3.5">
              <input
                type="checkbox"
                checked={cashAfterWork}
                onChange={(e) => setCashAfterWork(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-emerald-500"
              />
              <span>
                <span className="block text-[13px] font-medium text-emerald-200">
                  <Bi bn="কাজ শেষে নগদ দিন" en="Cash After Work" />
                </span>
                <span className="mt-0.5 block text-[11.5px] leading-relaxed text-zinc-400">
                  প্রথম বুকিংয়ে কোনো অগ্রিম নেই। কাজ বুঝে নিয়ে তবেই টাকা দিন — শূন্য আর্থিক ঝুঁকি।
                </span>
              </span>
            </label>
          )}

          {isRental && (
            <div className="mt-4 rounded-xl border border-sky-500/20 bg-sky-500/[0.05] p-3.5 text-[12px] leading-relaxed text-zinc-300">
              <p className="font-medium text-sky-300">NID + Refundable Deposit</p>
              <p className="mt-1">
                যন্ত্রপাতি ফেরত দেওয়ার পর জামানতের পুরো টাকা ফেরত পাবেন — ১০০% রিফান্ডেবল।
                NID ছবি প্রোভাইডার যাচাই করবে।
              </p>
            </div>
          )}

          <div className="mt-4 space-y-2.5">
            {savedAddresses.length > 0 && (
              <Select
                label="সংরক্ষিত ঠিকানা · Saved address"
                value=""
                onChange={(e) => {
                  const a = savedAddresses.find((x) => x.id === e.target.value);
                  if (a) setAddress(`${a.street}, ${a.city}`);
                }}
              >
                <option value="">— বেছে নিন / Choose —</option>
                {savedAddresses.map((a) => <option key={a.id} value={a.id}>{a.label} — {a.street}, {a.city}</option>)}
              </Select>
            )}
            <div className="space-y-1.5">
              <label className="block text-[12.5px] font-medium text-zinc-300">
                <Bi bn="ঠিকানা / এলাকা" en="Your area / address" />
              </label>
              <Field value={address} onChange={(e) => setAddress(e.target.value)} placeholder="যেমন: Sonadanga, Khulna" />
            </div>
            {service && service.category !== 'digital_gig' && (
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <label className="block text-[12.5px] font-medium text-zinc-300"><Bi bn="তারিখ" en="Date" /></label>
                  <Field type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[12.5px] font-medium text-zinc-300"><Bi bn="সময়" en="Time slot" /></label>
                  <Select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}>
                    <option value="">— সময় বাছুন —</option>
                    <option>সকাল ১০টা · 10 AM</option>
                    <option>দুপুর ২টা · 2 PM</option>
                    <option>বিকেল ৪টা · 4 PM</option>
                    <option>সন্ধ্যা ৬টা · 6 PM</option>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* ---------------- RIGHT: payment box ---------------- */}
        <Card className="p-5 sm:p-6">
          {!cashAfterWork ? (
            <form onSubmit={handleSubmit}>
              <h2 className="flex items-center gap-2 text-[15px] font-semibold text-white">
                <Wallet className="h-4 w-4 text-orange-400" />
                <Bi bn="সেন্ড মানি করুন" en="Send Money" />
              </h2>
              <p className="mt-1 text-[11.5px] text-zinc-500">
                নিচের নম্বরে বিকাশ/নগদ থেকে টাকা পাঠান, তারপর ৩টি ঘর পূরণ করুন।
              </p>

              {/* Payment number box */}
              <div className="mt-4 rounded-xl border border-orange-500/30 bg-[#0d0d10] p-4">
                <p className="text-[11px] uppercase tracking-wider text-zinc-500">Send money to · পাঠানোর নম্বর</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex gap-1.5">
                      {(['bkash', 'nagad'] as const).map((m) => (
                        <button
                          type="button"
                          key={m}
                          onClick={() => setMethod(m)}
                          className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            method === m
                              ? m === 'bkash'
                                ? 'border-pink-500/60 bg-pink-500/10 text-pink-300'
                                : 'border-orange-500/60 bg-orange-500/10 text-orange-300'
                              : 'border-white/10 text-zinc-500'
                          }`}
                        >
                          {m === 'bkash' ? 'bKash' : 'Nagad'}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2.5 font-mono text-xl font-bold tracking-wide text-white">{payNumber}</p>
                  </div>
                  <button
                    type="button"
                    onClick={copyNumber}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-[12px] font-medium text-zinc-200 hover:bg-white/5"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3">
                  <span className="text-[12px] text-zinc-400">Exact amount · নির্দিষ্ট অঙ্ক</span>
                  <span className="text-lg font-bold text-orange-400">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Step-by-step -> reduces confusion */}
              <ol className="mt-4 space-y-2 text-[12px] text-zinc-400">
                {[
                  `১. ${method === 'bkash' ? 'bKash' : 'Nagad'} অ্যাপ খুলুন → Send Money`,
                  `২. ${payNumber} নম্বরে ${formatCurrency(total)} পাঠান`,
                  '৩. Transaction ID (TrxID) কপি করে নিচে দিন',
                ].map((s) => (
                  <li key={s} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" /> {s}
                  </li>
                ))}
              </ol>

              {/* Only 3 fields */}
              <div className="mt-5 space-y-3">
                <div>
                  <label className="block text-[12.5px] font-medium text-zinc-300">
                    <Bi bn="পেমেন্ট মেথড" en="Payment method" />
                  </label>
                  <Select value={method} onChange={(e) => setMethod(e.target.value as 'bkash' | 'nagad')} className="mt-1.5">
                    <option value="bkash">bKash · বিকাশ</option>
                    <option value="nagad">Nagad · নগদ</option>
                  </Select>
                </div>
                <Field
                  label="Sender last 4 digits / full number · প্রেরক নম্বর"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  placeholder="0171…"
                />
                <Field
                  label="Transaction ID (TrxID)"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  placeholder="যেমন: AB12CD34EF"
                />
              </div>

              {/* Loss-aversion nudge */}
              <div className="mt-5 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3.5">
                <p className="flex items-center gap-2 text-[12.5px] font-medium text-amber-300">
                  <Gift className="h-4 w-4" /> অ্যাপে বুক করার সুবিধা
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-zinc-400">
                  Nexserve-এ বুক করলে পাবেন <strong className="text-amber-200">৭ দিনের ফ্রি সার্ভিস ওয়ারেন্টি</strong> +
                  পরবর্তী অর্ডারে <strong className="text-amber-200">৳১০০ ছাড়</strong>। বাইরে গেলে এই সুবিধা হারাবেন।
                </p>
              </div>

              <Button type="submit" fullWidth size="lg" loading={busy} className="mt-5">
                {cashAfterWork ? 'অর্ডার নিশ্চিত করুন' : 'পেমেন্ট জমা দিন + অর্ডার করুন'}
              </Button>
              <p className="mt-2.5 text-center text-[10.5px] leading-relaxed text-zinc-600">
                টাকা পাঠানোর after আমি SMS মিলিয়ে যাচাই করি — কোনো অটো-চার্জ নেই, কোনো ফি নেই।
              </p>
            </form>
          ) : (
            /* Cash after work — no payment fields at all */
            <div>
              <h2 className="flex items-center gap-2 text-[15px] font-semibold text-white">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Zero-risk booking
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">
                কোনো অগ্রিম পেমেন্ট লাগবে না। প্রোভাইডার কাজ শেষ করলে আপনি ক্যাশ বা বিকাশ/নগদ দিয়ে
                দিতে পারেন — আপনি সন্তুষ্ট হওয়ার আগেই কোনো টাকা যাবে না।
              </p>
              <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
                <p className="text-[12px] text-emerald-200">আপনার সুবিধা</p>
                <ul className="mt-2 space-y-1.5 text-[12px] text-zinc-300">
                  <li className="flex gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Pay Only When Satisfied</li>
                  <li className="flex gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> ৭ দিনের ফ্রি ওয়ারেন্টি</li>
                  <li className="flex gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> NID-verified প্রোভাইডার</li>
                </ul>
              </div>
              <Button fullWidth size="lg" loading={busy} className="mt-5" onClick={() => handleSubmit({ preventDefault() {} } as React.FormEvent)}>
                বিনা পেমেন্টে বুক করুন
              </Button>
            </div>
          )}
        </Card>
      </div>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] text-zinc-600">
        <MapPin className="h-3 w-3" /> Hyper-local service · Shib Bari, Sonadanga, Khalishpur, Nirala (Khulna)
      </p>
    </div>
  );
};

export default ManualCheckout;
