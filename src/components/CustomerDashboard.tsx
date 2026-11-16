/**
 * dorymo — Customer dashboard.
 * All of a customer's orders, schedule, saved addresses and deposit returns in
 * one place. Phone numbers remain hidden by RLS until an order is confirmed.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  PackageCheck,
  Plus,
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
import { formatCurrency, formatDate } from '../lib/utils';
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
          {loading ? <p className="text-[13px] text-zinc-500">লোড হচ্ছে…</p> : orders.length === 0 ? (
            <EmptyState title="এখনো কোনো অর্ডার নেই" description="একটি সেবা বেছে বুক করুন — সব অর্ডার এখানে দেখা যাবে।" icon={<PackageCheck className="h-6 w-6" />} action={<Button onClick={() => goExplore()}>সেবা খুঁজুন</Button>} />
          ) : (
            <div className="space-y-3">
              {orders.map((o, index) => {
                const meta = STATUS[o.status] || { label: o.status, tone: 'neutral' as const };
                return (
                  <Reveal delay={index * 55}>
              <Card key={o.id} className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[14.5px] font-semibold text-white">{o.serviceTitle || o.category}</h3>
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                        </div>
                        <p className="mt-1 text-[11.5px] text-zinc-500">{o.counterpartName || 'Provider'} · {formatCurrency(Number(o.amount))}</p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-500">
                          {o.scheduled_date && <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(o.scheduled_date)} {o.time_slot && `· ${o.time_slot}`}</span>}
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {o.address || '—'}</span>
                        </div>
                        {o.deposit_amount > 0 && (
                          <p className="mt-1.5 text-[11px] text-amber-300">
                            জামানত {formatCurrency(Number(o.deposit_amount))} · {o.deposit_return_status === 'refunded' ? 'ফেরত দেওয়া হয়েছে' : o.deposit_return_status === 'clean_pass' ? 'ফেরত প্রক্রিয়াধীন' : o.deposit_return_status === 'damage_detected' ? 'ক্ষতি রিপোর্টেড' : 'যন্ত্র ফেরত দিন'}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => goChat(o.id)}><MessageCircle className="h-3.5 w-3.5" /> Chat</Button>
                        {o.status === 'payment_verifying' && <Button size="sm" variant="danger" onClick={async () => { await cancelOrder(o.id); await load(); }}>বাতিল</Button>}
                        {o.payment_mode === 'cash_after_work' && o.status === 'in_progress' && <Button size="sm" onClick={() => { setSettleFor(o.id); setSettleTrx(''); }}><Wallet className="h-3.5 w-3.5" /> পেমেন্ট দিন</Button>}
                        {o.status === 'completed' && o.deposit_amount > 0 && ['pending_return', 'damage_detected'].includes(o.deposit_return_status) && (
                          <Button size="sm" onClick={() => { setReturnFor(o.id); setReturnNote(''); }}><PackageCheck className="h-3.5 w-3.5" /> ফেরত নিশ্চিত</Button>
                        )}
                        {o.status === 'completed' && <Button size="sm" variant="outline" onClick={goReviews}><Star className="h-3.5 w-3.5" /> রিভিউ</Button>}
                      </div>
                    </div>
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

      <Toast message={null} />
    </div>
  );
};

export default CustomerDashboard;
