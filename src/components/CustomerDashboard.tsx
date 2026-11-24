/**
 * dorymo — Customer dashboard.
 * All of a customer's orders, schedule, saved addresses and deposit returns in
 * one place. Phone numbers remain hidden by RLS until an order is confirmed.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  MessageCircle,
  PackageCheck,
  Plus,
  Printer,
  ShieldCheck,
  Star,
  Trash2,
  User,
  Wallet,
} from 'lucide-react';
import { useMaster } from '../context/MasterContext';
import {
  addSavedAddress,
  cancelOrder,
  confirmToolReturn,
  deleteSavedAddress,
  fetchConversationOrders,
  fetchSavedAddresses,
  setDefaultSavedAddress,
  settleCashOrder,
  type ConversationOrder,
  type SavedAddress,
} from '../lib/masterDb';
import { formatCurrency, formatDate, playChime } from '../lib/utils';
import { Badge, Button, Card, EmptyState, Field, Modal, Toast } from './ui';
import { Reveal } from './Reveal';

const STATUS: Record<string, { label: string; tone: 'neutral' | 'orange' | 'green' | 'red' | 'blue' | 'amber' }> = {
  payment_verifying: { label: 'পেমেন্ট যাচাই হচ্ছে', tone: 'amber' },
  payment_approved: { label: 'পেমেন্ট অনুমোদিত', tone: 'green' },
  payment_rejected: { label: 'পেমেন্ট বাতিল', tone: 'red' },
  in_progress: { label: 'কাজ চলছে', tone: 'orange' },
  completed: { label: 'সম্পন্ন', tone: 'green' },
  cancelled: { label: 'বাতিল', tone: 'red' },
  disputed: { label: 'বিরোধ', tone: 'red' },
};

const Bi: React.FC<{ bn: string; en: string }> = ({ bn, en }) => (
  <span>{bn}<span className="ml-1.5 text-[10px] font-normal text-zinc-500">· {en}</span></span>
);

const STEP_CONFIG = [
  { step: 1, label: 'অর্ডার জমা', en: 'Placed' },
  { step: 2, label: 'পেমেন্ট যাচাই', en: 'Verified' },
  { step: 3, label: 'কাজ চলছে', en: 'In Progress' },
  { step: 4, label: 'সম্পন্ন ও ওয়ারেন্টি', en: 'Completed' },
];

function getActiveStep(status: string): number {
  switch (status) {
    case 'payment_verifying':
      return 1;
    case 'payment_approved':
      return 2;
    case 'in_progress':
      return 3;
    case 'completed':
      return 4;
    default:
      return 0; // cancelled, rejected, disputed
  }
}

const OrderProgressStepper: React.FC<{ status: string }> = ({ status }) => {
  const current = getActiveStep(status);
  const isFailed =
    status === 'cancelled' ||
    status === 'payment_rejected' ||
    status === 'disputed';

  if (isFailed) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-950/20 px-3 py-2 text-[12px] text-red-300">
        <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
        <span>
          অর্ডারটি বাতিল বা নিষ্পত্তির অপেক্ষায় রয়েছে। প্রয়োজনে সাপোর্টে বা চ্যাটে যোগাযোগ করুন।
        </span>
      </div>
    );
  }

  return (
    <div className="mt-3.5 pt-3 border-t border-white/[0.06]">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-3 right-3 top-2.5 h-0.5 bg-zinc-800 -z-0" />
        <div
          className="absolute left-3 top-2.5 h-0.5 bg-gradient-to-r from-orange-500 to-amber-400 -z-0 transition-all duration-500"
          style={{
            width: `${Math.max(0, Math.min(100, ((current - 1) / 3) * 100))}%`,
          }}
        />

        {STEP_CONFIG.map((s) => {
          const isDone = current >= s.step;
          const isCurrent = current === s.step;
          return (
            <div
              key={s.step}
              className="relative z-10 flex flex-col items-center"
            >
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold transition-all ${
                  isDone
                    ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.5)]'
                    : 'border border-zinc-700 bg-zinc-900 text-zinc-500'
                }`}
              >
                {isDone ? <Check className="h-3 w-3 stroke-[3]" /> : s.step}
              </div>
              <span
                className={`mt-1 text-[10px] font-medium text-center ${
                  isCurrent
                    ? 'text-orange-400 font-semibold'
                    : isDone
                    ? 'text-zinc-200'
                    : 'text-zinc-500'
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CustomerDashboard: React.FC = () => {
  const {
    profile, openSignup, openAvatar, goChat, goReviews, goExplore, showToast,
  } = useMaster();
  const [tab, setTab] = useState<'orders' | 'addresses' | 'profile'>('orders');
  const [orders, setOrders] = useState<ConversationOrder[]>([]);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [addrOpen, setAddrOpen] = useState(false);
  const [addrLabel, setAddrLabel] = useState('বাসা');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('Khulna');
  const [addrZip, setAddrZip] = useState('');
  const [settleFor, setSettleFor] = useState<string | null>(null);
  const [settleTrx, setSettleTrx] = useState('');
  const [returnFor, setReturnFor] = useState<string | null>(null);
  const [returnNote, setReturnNote] = useState('');
  const [receiptFor, setReceiptFor] = useState<ConversationOrder | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!profile) { setLoading(false); return; }
    setLoading(true);
    try {
      const [o, a] = await Promise.all([fetchConversationOrders('customer'), fetchSavedAddresses()]);
      setOrders(o);
      setAddresses(a);
    } catch (e: any) {
      showToast(e?.message || 'ডেটা লোড করা যায়নি', 'error');
    } finally { setLoading(false); }
  }, [profile, showToast]);

  useEffect(() => { void load(); }, [load]);

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <Card className="p-8 text-center">
          <User className="mx-auto h-8 w-8 text-zinc-500" />
          <h2 className="mt-4 text-lg font-semibold text-white">আপনার অ্যাকাউন্ট · My account</h2>
          <p className="mt-1.5 text-[13px] text-zinc-400">অর্ডার ও ঠিকানা দেখতে লগইন করুন।</p>
          <Button className="mt-5" onClick={openSignup}>লগইন / নিবন্ধন</Button>
        </Card>
      </div>
    );
  }

  const doSettle = async () => {
    if (!settleFor) return;
    setBusy(true);
    try {
      await settleCashOrder(settleFor, settleTrx);
      showToast('পেমেন্ট নিষ্পত্তি হয়েছে!', 'success');
      setSettleFor(null); setSettleTrx(''); await load();
    } catch (e: any) { showToast(e?.message || 'ব্যর্থ', 'error'); }
    finally { setBusy(false); }
  };

  const doReturn = async (condition: 'clean' | 'damaged') => {
    if (!returnFor) return;
    setBusy(true);
    try {
      await confirmToolReturn(returnFor, condition, returnNote);
      showToast(condition === 'clean' ? 'ফেরত নিশ্চিত — জামানত ফেরতের জন্য অপেক্ষা করুন।' : 'ক্ষতির কথা জানানো হয়েছে।', 'info');
      setReturnFor(null); setReturnNote(''); await load();
    } catch (e: any) { showToast(e?.message || 'ব্যর্থ', 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-400">My account · আমার অ্যাকাউন্ট</p>
          <h1 className="mt-1.5 font-display text-2xl text-white sm:text-3xl">স্বাগতম, {profile.full_name}</h1>
          <p className="mt-1 text-[12.5px] text-zinc-500">{profile.email} · {profile.area || 'Bangladesh'}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()}><Clock className="h-4 w-4" /> Refresh</Button>
      </div>

      <div className="mt-6 flex gap-2">
        {([
          ['orders', 'অর্ডার · Orders'],
          ['addresses', 'ঠিকানা · Addresses'],
          ['profile', 'প্রোফাইল · Profile'],
        ] as const).map(([v, label]) => (
          <button key={v} onClick={() => setTab(v)} className={`rounded-xl border px-4 py-2 text-[13px] font-medium transition-colors ${tab === v ? 'border-orange-500/50 bg-orange-500/10 text-orange-300' : 'border-white/10 text-zinc-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <section className="mt-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <Card key={n} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between">
                    <div className="w-2/3 space-y-2.5">
                      <div className="h-4 w-44 rounded-md skeleton-shimmer" />
                      <div className="h-3 w-28 rounded-md skeleton-shimmer" />
                      <div className="h-3 w-52 rounded-md skeleton-shimmer" />
                    </div>
                    <div className="h-8 w-20 rounded-lg skeleton-shimmer" />
                  </div>
                </Card>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              title="এখনো কোনো অর্ডার নেই"
              description="একটি সেবা বেছে বুক করুন — সব অর্ডার এখানে দেখা যাবে।"
              icon={<PackageCheck className="h-6 w-6" />}
              action={<Button onClick={() => goExplore()}>সেবা খুঁজুন</Button>}
            />
          ) : (
            <div className="space-y-3">
              {orders.map((o, index) => {
                const meta = STATUS[o.status] || {
                  label: o.status,
                  tone: 'neutral' as const,
                };
                return (
                  <Reveal key={o.id} delay={index * 55}>
                    <Card className="p-4 sm:p-5 hover:border-orange-500/30 transition-colors">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-[14.5px] font-semibold text-white">
                              {o.serviceTitle || o.category}
                            </h3>
                            <Badge tone={meta.tone}>{meta.label}</Badge>
                            {o.payment_mode === 'cash_after_work' && (
                              <Badge tone="blue">Cash After Work</Badge>
                            )}
                          </div>
                          <p className="mt-1 text-[11.5px] text-zinc-400">
                            {o.counterpartName || 'Provider'} ·{' '}
                            <span className="font-semibold text-white">
                              {formatCurrency(Number(o.amount))}
                            </span>
                          </p>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-500">
                            {o.scheduled_date && (
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5 text-zinc-400" />{' '}
                                {formatDate(o.scheduled_date)}{' '}
                                {o.time_slot && `· ${o.time_slot}`}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-zinc-400" />{' '}
                              {o.address || '—'}
                            </span>
                          </div>
                          {o.deposit_amount > 0 && (
                            <p className="mt-1.5 text-[11px] text-amber-300">
                              জামানত {formatCurrency(Number(o.deposit_amount))} ·{' '}
                              {o.deposit_return_status === 'refunded'
                                ? 'ফেরত দেওয়া হয়েছে'
                                : o.deposit_return_status === 'clean_pass'
                                ? 'ফেরত প্রক্রিয়াধীন'
                                : o.deposit_return_status === 'damage_detected'
                                ? 'ক্ষতি রিপোর্টেড'
                                : 'যন্ত্র ফেরত দিন'}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              playChime('tap');
                              setReceiptFor(o);
                            }}
                          >
                            <FileText className="h-3.5 w-3.5 text-orange-400" />{' '}
                            রসিদ
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => goChat(o.id)}
                          >
                            <MessageCircle className="h-3.5 w-3.5" /> Chat
                          </Button>
                          {o.status === 'payment_verifying' && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={async () => {
                                await cancelOrder(o.id);
                                await load();
                              }}
                            >
                              বাতিল
                            </Button>
                          )}
                          {o.payment_mode === 'cash_after_work' &&
                            o.status === 'in_progress' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSettleFor(o.id);
                                  setSettleTrx('');
                                }}
                              >
                                <Wallet className="h-3.5 w-3.5" /> পেমেন্ট দিন
                              </Button>
                            )}
                          {o.status === 'completed' &&
                            o.deposit_amount > 0 &&
                            ['pending_return', 'damage_detected'].includes(
                              o.deposit_return_status
                            ) && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setReturnFor(o.id);
                                  setReturnNote('');
                                }}
                              >
                                <PackageCheck className="h-3.5 w-3.5" /> ফেরত
                                নিশ্চিত
                              </Button>
                            )}
                          {o.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={goReviews}
                            >
                              <Star className="h-3.5 w-3.5" /> রিভিউ
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Visual Order Stepper */}
                      <OrderProgressStepper status={o.status} />
                    </Card>
                  </Reveal>
                );
              })}
            </div>
          )}
        </section>
      )}

      {tab === 'addresses' && (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-white"><MapPin className="h-4 w-4 text-orange-400" /> <Bi bn="সংরক্ষিত ঠিকানা" en="Saved addresses" /></h2>
            <Button size="sm" onClick={() => setAddrOpen(true)}><Plus className="h-4 w-4" /> Add</Button>
          </div>
          {addresses.length === 0 ? (
            <EmptyState title="কোনো ঠিকানা নেই" description="প্রথম ঠিকানাটি যোগ করুন।" icon={<MapPin className="h-6 w-6" />} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {addresses.map((a) => (
                <Card key={a.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[13.5px] font-semibold text-white">{a.label} {a.is_default && <Badge tone="orange" className="ml-1">Default</Badge>}</p>
                      <p className="mt-1 text-[12px] text-zinc-400">{a.street}, {a.city} {a.zip && `— ${a.zip}`}</p>
                      {a.notes && <p className="mt-1 text-[11px] text-zinc-500">{a.notes}</p>}
                    </div>
                    <button onClick={() => void deleteSavedAddress(a.id).then(load)} className="text-zinc-600 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  {!a.is_default && <Button size="sm" variant="outline" className="mt-3" onClick={() => void setDefaultSavedAddress(a.id).then(load)}>Default করুন</Button>}
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'profile' && (
        <section className="mt-6">
          <Card className="flex flex-wrap items-center gap-4 p-5">
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/15 text-2xl font-bold text-orange-400">{profile.full_name.charAt(0)}</div>}
            <div>
              <p className="text-[16px] font-semibold text-white">{profile.full_name}</p>
              <p className="text-[12.5px] text-zinc-500">{profile.email}</p>
              <Badge tone="neutral" className="mt-1">{profile.role}</Badge>
            </div>
            <Button variant="outline" className="ml-auto" onClick={openAvatar}>ছবি বদলান · Photo</Button>
          </Card>
        </section>
      )}

      <Modal open={addrOpen} onClose={() => setAddrOpen(false)} title="নতুন ঠিকানা · New address" size="sm">
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!addrStreet.trim()) return;
          setBusy(true);
          try {
            await addSavedAddress({ label: addrLabel, street: addrStreet, city: addrCity, zip: addrZip, isDefault: addresses.length === 0 });
            showToast('ঠিকানা যোগ হয়েছে!', 'success');
            setAddrOpen(false); setAddrStreet(''); setAddrZip(''); await load();
          } catch (err: any) { showToast(err?.message || 'ব্যর্থ', 'error'); }
          finally { setBusy(false); }
        }} className="space-y-3">
          <Field label="লেবেল · Label" value={addrLabel} onChange={(e) => setAddrLabel(e.target.value)} placeholder="বাসা / অফিস" />
          <Field label="রাস্তা · Street" value={addrStreet} onChange={(e) => setAddrStreet(e.target.value)} placeholder="বাড়ী নং, রাস্তা" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="শহর · City" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} />
            <Field label="ZIP" value={addrZip} onChange={(e) => setAddrZip(e.target.value)} />
          </div>
          <Button type="submit" fullWidth loading={busy}>সংরক্ষণ করুন</Button>
        </form>
      </Modal>

      <Modal open={Boolean(settleFor)} onClose={() => setSettleFor(null)} title="কাজের পর পেমেন্ট" size="sm">
        <form onSubmit={(e) => { e.preventDefault(); void doSettle(); }} className="space-y-3">
          <Field label="bKash/Nagad TrxID" value={settleTrx} onChange={(e) => setSettleTrx(e.target.value)} placeholder="TrxID" />
          <Button type="submit" fullWidth loading={busy}>নিশ্চিত করুন</Button>
        </form>
      </Modal>

      <Modal open={Boolean(returnFor)} onClose={() => setReturnFor(null)} title="যন্ত্রপাতি ফেরত · Tool return" size="sm" description="যন্ত্রটি কেমন অবস্থায় ফেরত দিয়েছেন?">
        <div className="space-y-3">
          <Field label="নোট (ঐচ্ছিক)" value={returnNote} onChange={(e) => setReturnNote(e.target.value)} placeholder="যেকোনো তথ্য" />
          <Button fullWidth loading={busy} onClick={() => void doReturn('clean')}><CheckCircle2 className="h-4 w-4" /> নিরাপদে ফেরত দিয়েছি · Clean</Button>
          <Button variant="danger" fullWidth loading={busy} onClick={() => void doReturn('damaged')}>ক্ষতি হয়েছে · Damaged</Button>
        </div>
      </Modal>

      {/* 4. Digital Invoice / Receipt Modal */}
      <Modal
        open={Boolean(receiptFor)}
        onClose={() => setReceiptFor(null)}
        title="ডিজিটাল সেবা রসিদ · Service Invoice"
        size="md"
      >
        {receiptFor && (
          <div className="printable-voucher space-y-4 text-zinc-100">
            {/* Header with seal */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg font-bold text-orange-400">
                    dorymo
                  </span>
                  <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-orange-300">
                    Official Voucher
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-zinc-400">
                  অর্ডার আইডি: #{receiptFor.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  যাচাইকৃত রসিদ
                </span>
                <p className="mt-1 text-[10.5px] text-zinc-500">
                  তারিখ: {formatDate(receiptFor.created_at)}
                </p>
              </div>
            </div>

            {/* Service & Customer details */}
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-[10.5px] font-medium text-zinc-500 uppercase tracking-wider">
                  গ্রাহক ও ঠিকানা
                </p>
                <p className="mt-1 font-semibold text-white">{profile.full_name}</p>
                <p className="mt-0.5 text-zinc-400">{receiptFor.address || 'ঠিকানা নির্ধারিত নেই'}</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-[10.5px] font-medium text-zinc-500 uppercase tracking-wider">
                  প্রোভাইডার ও সেবা
                </p>
                <p className="mt-1 font-semibold text-white">
                  {receiptFor.serviceTitle || receiptFor.category}
                </p>
                <p className="mt-0.5 text-zinc-400">
                  প্রোভাইডার: {receiptFor.counterpartName || 'Dorymo Partner'}
                </p>
              </div>
            </div>

            {/* Bill breakdown table */}
            <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-3.5 space-y-2 text-[12.5px]">
              <div className="flex justify-between text-zinc-300">
                <span>সেবা মূল্য (Service Fee)</span>
                <span className="font-semibold text-white">
                  {formatCurrency(Number(receiptFor.amount))}
                </span>
              </div>
              {receiptFor.deposit_amount > 0 && (
                <div className="flex justify-between text-amber-300">
                  <span>ফেরতযোগ্য জামানত (Security Deposit)</span>
                  <span className="font-semibold">
                    {formatCurrency(Number(receiptFor.deposit_amount))}
                  </span>
                </div>
              )}
              <div className="border-t border-white/[0.08] pt-2 flex justify-between font-bold text-white text-[13.5px]">
                <span>সর্বমোট (Total Payable)</span>
                <span className="text-orange-400">
                  {formatCurrency(
                    Number(receiptFor.amount) + Number(receiptFor.deposit_amount || 0)
                  )}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-400">
                <span>পেমেন্ট পদ্ধতি:</span>
                <span className="font-medium text-zinc-200">
                  {receiptFor.payment_mode === 'cash_after_work'
                    ? 'Cash After Work (ক্যাশ অন ডেলিভারি)'
                    : 'bKash / Nagad Manual SIM'}
                </span>
              </div>
            </div>

            {/* 7-Day Warranty banner */}
            <div className="flex items-start gap-2.5 rounded-xl border border-orange-500/25 bg-orange-950/20 p-3 text-[12px] text-orange-200">
              <ShieldCheck className="h-5 w-5 shrink-0 text-orange-400" />
              <div>
                <p className="font-semibold">৭ দিনের ফ্রি সেবা ওয়ারেন্টি অন্তর্ভুক্ত</p>
                <p className="mt-0.5 text-[11px] text-orange-300/80">
                  কাজে কোনো ত্রুটি বা সমস্যা হলে ৭ দিনের মধ্যে বিনামূল্যে প্রোভাইডার সহায়তা প্রদান করা হবে।
                </p>
              </div>
            </div>

            {/* Print & Close */}
            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06] no-print">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  playChime('tap');
                  window.print();
                }}
              >
                <Printer className="h-4 w-4" /> প্রিন্ট / সেভ করুন
              </Button>
              <Button size="sm" onClick={() => setReceiptFor(null)}>
                বন্ধ করুন
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Toast message={null} />
    </div>
  );
};

export default CustomerDashboard;
