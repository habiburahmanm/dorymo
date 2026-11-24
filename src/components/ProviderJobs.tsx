/**
 * dorymo — Provider Jobs (Step 3).
 * ULTRA-SIMPLE bilingual labels so local technicians can accept/finish jobs
 * without calling the founder. Big buttons, one word actions.
 * Jobs are filtered SERVER-SIDE: nationwide digital, or the provider's own thana.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  Clock,
  Inbox,
  MapPin,
  Plus,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { useMaster } from '../context/MasterContext';
import { supabase } from '../lib/supabase';
import {
  acceptOrder,
  completeOrder,
  createService,
  deleteService,
  fetchAvailableOrders,
  fetchMyServices,
  updateService,
  type AvailableOrder,
  type Category,
  type ServiceRow,
} from '../lib/masterDb';
import { formatCurrency, playChime, timeAgo } from '../lib/utils';
import { Badge, Button, Card, EmptyState, Field, Modal, Select, TextArea } from './ui';

const Bi: React.FC<{ bn: string; en: string }> = ({ bn, en }) => (
  <span>{bn}<span className="ml-1.5 text-[10px] font-normal text-zinc-500">· {en}</span></span>
);

export const ProviderJobs: React.FC = () => {
  const { profile, isProvider, refreshProfile, openSignup, goHome, goChat, showToast } = useMaster();
  const [available, setAvailable] = useState<AvailableOrder[]>([]);
  const [myJobs, setMyJobs] = useState<AvailableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<'jobs' | 'services'>('jobs');
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sTitle, setSTitle] = useState('');
  const [sDesc, setSDesc] = useState('');
  const [sCategory, setSCategory] = useState<Category>('home_repair');
  const [sPrice, setSPrice] = useState('');
  const [sDeposit, setSDeposit] = useState('0');
  const [sArea, setSArea] = useState(profile?.area || 'Sonadanga');
  const [sNationwide, setSNationwide] = useState(false);
  const [sMinutes, setSMinutes] = useState('90');

  const load = useCallback(async () => {
    if (!isProvider) { setLoading(false); return; }
    setLoading(true);
    try {
      const rows = await fetchAvailableOrders();
      setAvailable(rows);
      // The RPC only returns unassigned jobs; assigned ones are fetched directly.
      const { data } = await supabase
        .from('orders')
        .select('id, category, amount, deposit_amount, status, created_at, service_id, customer_id, address')
        .eq('provider_id', profile?.id ?? '')
        .in('status', ['in_progress', 'completed'])
        .order('created_at', { ascending: false });
      const names = new Map<string, string>();
      if (data?.length) {
        const serviceIds = Array.from(new Set(data.map((d: any) => d.service_id).filter(Boolean)));
        if (serviceIds.length) {
          const { data: svc } = await supabase.from('services').select('id, title, area').in('id', serviceIds);
          svc?.forEach((s: any) => names.set(s.id, s.title));
        }
        const customerIds = Array.from(new Set(data.map((d: any) => d.customer_id).filter(Boolean)));
        const { data: users } = await supabase.from('users').select('id, full_name').in('id', customerIds);
        users?.forEach((u: any) => names.set(u.id, u.full_name));
      }
      setMyJobs(
        (data ?? []).map((d: any) => ({
          id: d.id,
          category: d.category,
          title: names.get(d.service_id) || 'Job',
          amount: Number(d.amount),
          deposit_amount: Number(d.deposit_amount),
          area: d.address || '—',
          customer_name: names.get(d.customer_id) || 'Customer',
          created_at: d.created_at,
          status: d.status,
        }))
      );
    } catch (e: any) {
      showToast(e?.message || 'কাজ লোড করা যায়নি', 'error');
    } finally {
      setLoading(false);
    }
  }, [isProvider, profile?.id, showToast]);

  useEffect(() => { void load(); }, [load]);

  const loadServices = useCallback(async () => {
    try { setServices(await fetchMyServices()); }
    catch (e: any) { showToast(e?.message || 'সেবা লোড করা যায়নি', 'error'); }
  }, [showToast]);

  useEffect(() => { if (tab === 'services') void loadServices(); }, [tab, loadServices]);

  const openServiceForm = (s?: ServiceRow) => {
    setEditingId(s?.id ?? null);
    setSTitle(s?.title ?? '');
    setSDesc(s?.description ?? '');
    setSCategory(s?.category ?? 'home_repair');
    setSPrice(s ? String(s.price) : '');
    setSDeposit(s ? String(s.security_deposit) : '0');
    setSArea(s?.area || profile?.area || 'Sonadanga');
    setSNationwide(s?.is_nationwide ?? false);
    setSMinutes(s ? String(s.response_minutes) : '90');
    setServiceOpen(true);
  };

  const saveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyId(editingId || 'new-service');
    try {
      const input = {
        title: sTitle, description: sDesc, category: sCategory,
        price: Number(sPrice), priceUnit: 'job' as const,
        area: sArea, isNationwide: sCategory === 'digital_gig' ? true : sNationwide,
        securityDeposit: Number(sDeposit) || 0, responseMinutes: Number(sMinutes) || 90,
      };
      if (editingId) await updateService(editingId, input);
      else await createService(input);
      showToast(editingId ? 'সেবা আপডেট হয়েছে!' : 'সেবা যোগ হয়েছে!', 'success');
      setServiceOpen(false);
      await loadServices();
    } catch (err: any) {
      showToast(err?.message || 'সেবা সংরক্ষণ ব্যর্থ', 'error');
    } finally { setBusyId(null); }
  };



  const handle = async (id: string, action: 'accept' | 'complete') => {
    setBusyId(id);
    try {
      if (action === 'accept') {
        await acceptOrder(id);
        showToast('কাজ গ্রহণ করা হয়েছে! এখন চ্যাটে কথা বলুন।', 'success');
      } else {
        await completeOrder(id);
        showToast('কাজ সম্পন্ন! গ্রাহক এখন রিভিউ দিতে পারেন।', 'success');
      }
      await load();
    } catch (e: any) {
      showToast(e?.message || 'ব্যর্থ', 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <Card className="p-8 text-center">
          <Inbox className="mx-auto h-8 w-8 text-zinc-500" />
          <h2 className="mt-4 text-lg font-semibold text-white">প্রোভাইডার লগইন · Provider login</h2>
          <p className="mt-1.5 text-[13px] text-zinc-400">কাজ দেখতে আপনার প্রোভাইডার অ্যাকাউন্টে লগইন করুন।</p>
          <Button className="mt-5" onClick={openSignup}>লগইন / নিবন্ধন</Button>
        </Card>
      </div>
    );
  }

  if (!isProvider || profile.account_status !== 'APPROVED') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <Card className="p-8 text-center">
          <Clock className="mx-auto h-8 w-8 text-amber-400" />
          <h2 className="mt-4 text-lg font-semibold text-white">অনুমোদনের অপেক্ষায় · Pending approval</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">
            আপনার NID যাচাই করছি। অনুমোদনের পরই কাজের তালিকা দেখা যাবে। সাধারণত ১ দিনের কম সময় লাগে।
          </p>
          <p className="mt-3 text-[12px] text-zinc-500">Status: <strong className="text-amber-300">{profile.account_status}</strong></p>
          <Button className="mt-5" variant="outline" onClick={goHome}>হোমপেজে যান</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-400">Provider studio · কাজের ঘর</p>
          <h1 className="mt-1.5 font-display text-2xl text-white sm:text-3xl">আপনার কাজগুলো</h1>
          <p className="mt-1 text-[12.5px] text-zinc-500">
            <Bi bn="শুধু আপনার এলাকার কাজ দেখা যায়" en="Only jobs in your area (or nationwide digital)" />
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { void load(); void refreshProfile(); }}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="mt-6 flex gap-2">
        {(['jobs','services'] as const).map((v) => (
          <button key={v} onClick={() => setTab(v)} className={`rounded-xl border px-4 py-2 text-[13px] font-medium transition-colors ${tab === v ? 'border-orange-500/50 bg-orange-500/10 text-orange-300' : 'border-white/10 text-zinc-400 hover:text-white'}`}>
            {v === 'jobs' ? 'কাজ · Jobs' : 'আমার সেবা · My Services'}
          </button>
        ))}
      </div>

      {tab === 'jobs' && <>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <p className="flex items-center gap-2 text-[12px] text-zinc-400"><Inbox className="h-4 w-4 text-orange-400" /> <Bi bn="নতুন কাজ" en="Available jobs" /></p>
          <p className="mt-1 text-2xl font-bold text-white">{available.length}</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-2 text-[12px] text-zinc-400"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> <Bi bn="চলমান কাজ" en="Active jobs" /></p>
          <p className="mt-1 text-2xl font-bold text-white">{myJobs.filter((j) => j.status === 'in_progress').length}</p>
        </Card>
      </div>

      {/* AVAILABLE */}
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-white">
          <Inbox className="h-4 w-4 text-orange-400" /> <Bi bn="নতুন কাজ — এখনই নিন" en="Available now — grab one" />
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <Card key={n} className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-32 rounded skeleton-shimmer" />
                  <div className="h-6 w-16 rounded skeleton-shimmer" />
                </div>
                <div className="h-4 w-52 rounded skeleton-shimmer" />
                <div className="h-8 w-full rounded-lg skeleton-shimmer" />
              </Card>
            ))}
          </div>
        ) : available.length === 0 ? (
          <EmptyState
            title="এখন কোনো নতুন কাজ নেই"
            description="নতুন অর্ডার অনুমোদিত হলে এখানে দেখা যাবে। Refresh চাপুন।"
            icon={<Inbox className="h-6 w-6" />}
          />
        ) : (
          <div className="space-y-3">
            {available.map((j) => (
              <Card key={j.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Badge tone="orange"><BadgeCheck className="h-3 w-3" /> Paid · পেমেন্ট হয়েছে</Badge>
                    <h3 className="mt-2 text-[15px] font-semibold text-white">{j.title}</h3>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-zinc-500">
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {j.area}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {timeAgo(j.created_at)}</span>
                      <span>{j.customer_name}</span>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-emerald-400">{formatCurrency(j.amount)}</p>
                </div>
                <div className="mt-4 flex gap-2 border-t border-white/[0.07] pt-3">
                  <Button size="sm" className="flex-1" loading={busyId === j.id} onClick={() => handle(j.id, 'accept')}>
                    <CheckCircle2 className="h-4 w-4" /> নিন · Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => goChat(j.id)}>চ্যাট · Chat</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* MY JOBS */}
      <section className="mt-9">
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-white">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" /> <Bi bn="আমার কাজ" en="My jobs" />
        </h2>
        {myJobs.length === 0 ? (
          <EmptyState title="এখনো কোনো কাজ নেই" description="উপর থেকে একটি কাজ গ্রহণ করুন।" icon={<Wallet className="h-6 w-6" />} />
        ) : (
          <div className="space-y-3">
            {myJobs.map((j) => (
              <Card key={j.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-medium text-white">{j.title}</p>
                    <Badge tone={j.status === 'completed' ? 'green' : 'orange'}>
                      {j.status === 'completed' ? 'সম্পন্ন · Done' : 'চলছে · In progress'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11.5px] text-zinc-500">{j.customer_name} · {formatCurrency(j.amount)}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => goChat(j.id)}>চ্যাট · Chat</Button>
                  {j.status === 'in_progress' && (
                    <Button size="sm" loading={busyId === j.id} onClick={() => handle(j.id, 'complete')}>
                      কাজ শেষ · Done
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
      </>}

      {tab === 'services' && <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-white">
            <Briefcase className="h-4 w-4 text-orange-400" />
            <Bi bn="আপনার সেবাসমূহ" en="Your service listings" />
          </h2>
          <Button size="sm" onClick={() => openServiceForm()}>
            <Plus className="h-4 w-4" /> নতুন সেবা · Add
          </Button>
        </div>
        {services.length === 0 ? (
          <EmptyState title="এখনো কোনো সেবা নেই" description="প্রথম সেবাটি যোগ করুন — ক্রেতারা এক্সপ্লোরে দেখতে পাবেন।" icon={<Briefcase className="h-6 w-6" />} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((s) => (
              <Card key={s.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[14px] font-semibold text-white">{s.title}</p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">{s.is_nationwide ? 'Nationwide' : s.area} · {s.category}</p>
                  </div>
                  <Badge tone={s.is_active ? 'green' : 'neutral'}>{s.is_active ? 'Active' : 'Paused'}</Badge>
                </div>
                <p className="mt-2 text-lg font-bold text-orange-400">{formatCurrency(Number(s.price))}</p>
                {Number(s.security_deposit) > 0 && <p className="text-[11px] text-emerald-400">Deposit {formatCurrency(Number(s.security_deposit))} · refundable</p>}
                <div className="mt-3 flex flex-wrap gap-2 border-t border-white/[0.07] pt-3">
                  <Button size="sm" variant="outline" onClick={() => openServiceForm(s)}>Edit</Button>
                  <Button size="sm" variant="outline" onClick={async () => { await updateService(s.id, { isActive: !s.is_active }); await loadServices(); }}>
                    {s.is_active ? 'Pause' : 'Activate'}
                  </Button>
                  <Button size="sm" variant="danger" onClick={async () => { await deleteService(s.id); await loadServices(); showToast('সেবা মুছে ফেলা হয়েছে।', 'info'); }}>Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>}

      <Modal open={serviceOpen} onClose={() => setServiceOpen(false)} title={editingId ? 'সেবা এডিট করুন' : 'নতুন সেবা যোগ করুন'} size="md">
        <form onSubmit={saveService} className="space-y-3">
          <Field label="সেবার নাম · Title" value={sTitle} onChange={(e) => setSTitle(e.target.value)} placeholder="যেমন: ইলেকট্রিশিয়ান" />
          <TextArea label="বিবরণ · Description" value={sDesc} onChange={(e) => setSDesc(e.target.value)} rows={2} placeholder="কাজের বিবরণ" />
          <Select label="ধরন · Category" value={sCategory} onChange={(e) => setSCategory(e.target.value as Category)}>
            <option value="home_repair">বাসার মেরামত · Home Repair</option>
            <option value="equipment_rental">যন্ত্রপাতি ভাড়া · Rental</option>
            <option value="digital_gig">ডিজিটাল কাজ · Nationwide</option>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Field label="দাম (৳) · Price" type="number" value={sPrice} onChange={(e) => setSPrice(e.target.value)} placeholder="700" />
            <Field label="জামানত (৳) · Deposit" type="number" value={sDeposit} onChange={(e) => setSDeposit(e.target.value)} placeholder="0" />
          </div>
          {sCategory !== 'digital_gig' && (
            <div className="grid grid-cols-2 gap-3">
              <Select label="এলাকা · Thana" value={sArea} onChange={(e) => setSArea(e.target.value)}>
                {['Sonadanga','Khalishpur','Shib Bari','Nirala','Other'].map((a) => <option key={a} value={a}>{a}</option>)}
              </Select>
              <Field label="সাড়া (মিনিট) · Response" type="number" value={sMinutes} onChange={(e) => setSMinutes(e.target.value)} placeholder="90" />
            </div>
          )}
          <p className="rounded-lg bg-orange-500/[0.06] px-3 py-2 text-[11px] text-orange-200">
            আপনি পাবেন ৳{(Number(sPrice || 0) * 0.9).toFixed(0)} — প্ল্যাটফর্ম ফি ১০% (জামানতের ওপর ফি নেই)।
          </p>
          <Button type="submit" fullWidth loading={busyId === (editingId || 'new-service')}>সংরক্ষণ করুন · Save</Button>
        </form>
      </Modal>
    </div>
  );
};

export default ProviderJobs;
