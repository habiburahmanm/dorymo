/**
 * dorymo — Founder Console (ONE screen to run the whole business).
 *
 * Queue 1: PAYMENT_VERIFYING claims -> you check your bKash/Nagad SMS and
 *          click ONE button. verify_manual_payment() unlocks the job, grants
 *          the 7-day warranty + ৳100 next-order discount atomically.
 * Queue 2: PENDING providers -> NID/skill/area shown, ONE click to approve.
 *
 * Everything is admin-RLS protected; a non-admin cannot even read these rows.
 */
import React, { useState } from 'react';
import {
  BadgeCheck,
  Check,
  Clock,
  Phone,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Wallet,
  TrendingUp,
  X,
} from 'lucide-react';
import { useMaster } from '../context/MasterContext';
import { formatCurrency, timeAgo } from '../lib/utils';
import { Badge, Button, Card, EmptyState, Field, Modal, Toast } from './ui';
import type { PayoutView } from '../lib/masterDb';

const Bi: React.FC<{ bn: string; en: string }> = ({ bn, en }) => (
  <span>
    {bn}
    <span className="ml-1.5 text-[10px] font-normal text-zinc-500">· {en}</span>
  </span>
);

export const AdminVerificationPanel: React.FC = () => {
  const {
    pendingPayments,
    pendingProviders,
    adminLoading,
    refreshAdmin,
    verify,
    decideProvider,
    payouts,
    commissionEarned,
    payoutsDue,
    payProvider,
    refundDeposit,
    toast,
    clearToast,
    goHome,
    profile,
  } = useMaster();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [payoutFor, setPayoutFor] = useState<PayoutView | null>(null);
  const [payoutTrx, setPayoutTrx] = useState('');
  const [refundFor, setRefundFor] = useState<PayoutView | null>(null);
  const [refundTrx, setRefundTrx] = useState('');

  const handleVerify = async (id: string, approve: boolean) => {
    setBusyId(id);
    await verify(id, approve);
    setBusyId(null);
  };

  const handleProvider = async (id: string, approve: boolean) => {
    setBusyId(id);
    await decideProvider(id, approve);
    setBusyId(null);
  };

  if (profile && profile.role !== 'admin') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <Card className="p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-white">Founder only · শুধু অ্যাডমিনের জন্য</h2>
          <p className="mt-1.5 text-[13px] text-zinc-400">
            এই কনসোল শুধু প্ল্যাটফর্ম মালিকের জন্য। আপনার ভূমিকা: {profile.role}
          </p>
          <Button className="mt-5" variant="outline" onClick={goHome}>হোমপেজে যান</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-400">Founder Console · এক স্ক্রিনে সব ব্যবস্থাপনা</p>
          <h1 className="mt-1.5 font-display text-2xl text-white sm:text-3xl">অ্যাডমিন কনসোল</h1>
          <p className="mt-1 text-[12.5px] text-zinc-500">পেমেন্ট যাচাই + প্রোভাইডার অনুমোদন — একটিমাত্র ক্লিকে।</p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshAdmin} disabled={adminLoading}>
          <RefreshCw className={`h-4 w-4 ${adminLoading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { icon: Wallet, label: 'Payments to verify', bn: 'যাচাইযোগ্য পেমেন্ট', value: pendingPayments.length, tone: 'text-amber-400' },
          { icon: BadgeCheck, label: 'Providers to approve', bn: 'অনুমোদনের অপেক্ষায়', value: pendingProviders.length, tone: 'text-sky-400' },
          { icon: TrendingUp, label: 'Commission earned', bn: 'আপনার কমিশন', value: formatCurrency(commissionEarned), tone: 'text-emerald-400' },
          { icon: Wallet, label: 'Payouts due', bn: 'প্রোভাইডারকে দিতে হবে', value: payoutsDue, tone: 'text-amber-400' },
          { icon: ShieldCheck, label: 'Your role', bn: 'আপনার ভূমিকা', value: profile?.role ?? 'admin', tone: 'text-zinc-400' },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] ${s.tone}`}>
              <s.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] text-zinc-500">{s.label} · {s.bn}</p>
              <p className="text-lg font-semibold text-white">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* ---------------- QUEUE 1: payments ---------------- */}
      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <ReceiptText className="h-4 w-4 text-amber-400" />
          <h2 className="text-[15px] font-semibold text-white">
            <Bi bn="পেমেন্ট যাচাই করুন" en="Verify payments" />
          </h2>
          {pendingPayments.length > 0 && (
            <Badge tone="amber" className="ml-1 animate-pulse">NEW · {pendingPayments.length}</Badge>
          )}
        </div>

        {adminLoading && pendingPayments.length === 0 ? (
          <p className="text-[13px] text-zinc-500">লোড হচ্ছে…</p>
        ) : pendingPayments.length === 0 ? (
          <EmptyState
            title="কোনো পেমেন্ট অপেক্ষায় নেই"
            description="নতুন পেমেন্ট জমা হলে এখানে সবার উপরে দেখা যাবে।"
            icon={<Check className="h-6 w-6" />}
          />
        ) : (
          <div className="space-y-3">
            {pendingPayments.map((p) => (
              <Card key={p.payment.id} className="border-amber-500/25 bg-amber-500/[0.03] p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                        Payment verifying
                      </span>
                      <span className="text-[11px] text-zinc-500">{timeAgo(p.payment.submitted_at)}</span>
                    </div>
                    <p className="mt-2 text-[14px] font-semibold text-white">
                      {p.customer?.full_name || 'গ্রাহক'}
                      <span className="ml-2 font-normal text-zinc-500">· {p.customer?.area || '—'}</span>
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-zinc-400">
                      <span>Method: <strong className="uppercase text-zinc-200">{p.payment.method}</strong></span>
                      <span>Sender: <strong className="text-zinc-200">{p.payment.sender_number}</strong></span>
                      {p.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{p.phone}</span>}
                    </div>
                    <p className="mt-1.5 font-mono text-[11.5px] text-orange-300">
                      TrxID: {p.payment.trx_id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-zinc-500">Amount · অঙ্ক</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(Number(p.payment.amount))}</p>
                    <p className="mt-1 text-[10.5px] text-zinc-500">{p.order?.status ?? 'order'}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2 border-t border-white/[0.07] pt-4">
                  <Button
                    size="sm"
                    className="flex-1"
                    loading={busyId === p.payment.id}
                    onClick={() => handleVerify(p.payment.id, true)}
                  >
                    <Check className="h-4 w-4" /> Approve Payment · অনুমোদন
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    className="flex-1"
                    disabled={busyId === p.payment.id}
                    onClick={() => handleVerify(p.payment.id, false)}
                  >
                    <X className="h-4 w-4" /> Reject · বাতিল
                  </Button>
                </div>
                <p className="mt-2 text-center text-[10.5px] text-zinc-600">
                  অনুমোদনে কাজ আনলক + ৭ দিনের ওয়ারেন্টি + ৳১০০ ছাড় যোগ হয় · বাতিলে গ্রাহককে জানানো হয়
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ---------------- QUEUE 2: providers ---------------- */}
      <section className="mt-9">
        <div className="mb-3 flex items-center gap-2">
          <BadgeCheck className="h-4 w-4 text-sky-400" />
          <h2 className="text-[15px] font-semibold text-white">
            <Bi bn="প্রোভাইডার অনুমোদন" en="Approve providers" />
          </h2>
          {pendingProviders.length > 0 && <Badge tone="blue" className="ml-1">{pendingProviders.length}</Badge>}
        </div>

        {adminLoading && pendingProviders.length === 0 ? (
          <p className="text-[13px] text-zinc-500">লোড হচ্ছে…</p>
        ) : pendingProviders.length === 0 ? (
          <EmptyState
            title="কোনো প্রোভাইডার অপেক্ষায় নেই"
            description="নতুন প্রোভাইডার NID দিয়ে নিবন্ধন করলে এখানে আসবে।"
            icon={<BadgeCheck className="h-6 w-6" />}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {pendingProviders.map((p) => (
              <Card key={p.user.id} className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  {p.nidPhotoUrl ? (
                    <img
                      src={p.nidPhotoUrl}
                      alt="NID"
                      className="h-14 w-20 shrink-0 rounded-lg border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-white/15 text-zinc-600">
                      NID
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-white">{p.user.full_name}</p>
                    <p className="mt-0.5 text-[12px] text-zinc-400">
                      {p.user.service_skill || 'Skill not set'}
                      <span className="ml-1.5 text-zinc-500">· {p.user.area || 'Nationwide'}</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">{p.user.email}</p>
                    {p.phone && <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-zinc-400"><Phone className="h-3 w-3" />{p.phone}</p>}
                    <div className="mt-1.5 flex items-center gap-1 text-[10.5px] text-zinc-600">
                      <Clock className="h-3 w-3" /> {timeAgo(p.user.created_at)}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2 border-t border-white/[0.07] pt-3">
                  <Button
                    size="sm"
                    className="flex-1"
                    loading={busyId === p.user.id}
                    onClick={() => handleProvider(p.user.id, true)}
                  >
                    <Check className="h-4 w-4" /> Approve · অনুমোদন
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    className="flex-1"
                    disabled={busyId === p.user.id}
                    onClick={() => handleProvider(p.user.id, false)}
                  >
                    <X className="h-4 w-4" /> Reject · বাতিল
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ---------------- QUEUE 3: payouts / commission ---------------- */}
      <section className="mt-9">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <h2 className="text-[15px] font-semibold text-white">
            <Bi bn="কমিশন ও প্রোভাইডার পেমেন্ট" en="Commission & provider payouts" />
          </h2>
          {payoutsDue > 0 && <Badge tone="amber" className="ml-1">{payoutsDue} due</Badge>}
        </div>

        {payouts.length === 0 ? (
          <EmptyState title="এখনো কোনো পেমেন্ট বাকি নেই" description="কাজ সম্পন্ন হলে প্রোভাইডারের পেমেন্ট এখানে আসবে।" icon={<Wallet className="h-6 w-6" />} />
        ) : (
          <div className="space-y-2">
            {payouts.map((p) => (
              <Card key={p.id} className={`p-4 ${p.status === 'pending' ? 'border-emerald-500/25 bg-emerald-500/[0.03]' : ''}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={p.status === 'paid' ? 'green' : 'amber'}>
                        {p.status === 'paid' ? 'Paid · দেওয়া হয়েছে' : 'Due · বাকি আছে'}
                      </Badge>
                      <span className="text-[11px] text-zinc-500">{p.providerName || 'Provider'}</span>
                    </div>
                    <p className="mt-1.5 text-[13.5px] font-medium text-white">{p.serviceTitle || p.category || 'Job'}</p>
                    <p className="mt-1 font-mono text-[11px] text-zinc-500">
                      Commission {formatCurrency(p.commission_amount)} · {p.trx_id ? `TrxID ${p.trx_id}` : 'no TrxID yet'}
                    </p>
                    {p.depositAmount > 0 && (
                      <p className={`mt-0.5 text-[11px] ${p.depositRefunded ? 'text-emerald-400' : p.depositReturnStatus === 'damage_detected' ? 'text-red-400' : 'text-amber-400'}`}>
                        Deposit {formatCurrency(p.depositAmount)} · {p.depositRefunded ? 'refunded' : p.depositReturnStatus === 'damage_detected' ? '⚠ damage reported — hold funds' : p.depositReturnStatus === 'clean_pass' ? '✓ clean return — refund now' : 'awaiting return confirmation'}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10.5px] text-zinc-500">Provider gets</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(p.payout_amount)}</p>
                  </div>
                </div>
                {p.status === 'pending' && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-white/[0.07] pt-3">
                    <Button size="sm" className="flex-1" onClick={() => { setPayoutFor(p); setPayoutTrx(''); }}>
                      <Check className="h-4 w-4" /> Mark paid · পেমেন্ট দিন
                    </Button>
                    {p.depositAmount > 0 && !p.depositRefunded && (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => { setRefundFor(p); setRefundTrx(''); }}>
                        Refund deposit · জামানত ফেরত
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      <Modal open={Boolean(payoutFor)} onClose={() => setPayoutFor(null)} title="Mark provider payment" size="sm"
        description={`${payoutFor?.providerName || 'Provider'} — ${payoutFor ? formatCurrency(payoutFor.payout_amount) : ''}`}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!payoutFor) return;
          setBusyId(payoutFor.order_id);
          await payProvider(payoutFor.order_id, payoutTrx);
          setBusyId(null);
          setPayoutFor(null);
        }} className="space-y-3">
          <Field label="bKash/Nagad TrxID (আপনি যে ট্রানজেকশন দিয়েছেন)" value={payoutTrx} onChange={(e) => setPayoutTrx(e.target.value)} placeholder="TrxID" />
          <Button type="submit" fullWidth loading={busyId === payoutFor?.order_id}>Confirm payment · নিশ্চিত করুন</Button>
        </form>
      </Modal>

      <Modal open={Boolean(refundFor)} onClose={() => setRefundFor(null)} title="Refund security deposit" size="sm"
        description={`Customer refund ${refundFor ? formatCurrency(refundFor.depositAmount) : ''}`}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!refundFor) return;
          setBusyId(refundFor.order_id + '-refund');
          await refundDeposit(refundFor.order_id, refundTrx);
          setBusyId(null);
          setRefundFor(null);
        }} className="space-y-3">
          <Field label="Refund TrxID · ফেরত ট্রানজেকশন" value={refundTrx} onChange={(e) => setRefundTrx(e.target.value)} placeholder="TrxID" />
          <Button type="submit" fullWidth loading={busyId === refundFor?.order_id + '-refund'}>Record refund · রেকর্ড করুন</Button>
        </form>
      </Modal>

      <Toast message={toast?.message ?? null} tone={toast?.tone === 'error' ? 'error' : 'success'} />
    </div>
  );
};

export default AdminVerificationPanel;
