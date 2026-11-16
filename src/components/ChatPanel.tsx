/**
 * dorymo — In-App Chat (Step 4).
 * Phone numbers stay hidden until an order is confirmed/paid — RLS enforces the
 * reveal; before that, all communication happens here. Light 5s polling keeps
 * it simple and works everywhere (Realtime can be enabled later, no schema change).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Lock, MessageCircle, Phone, Send, ShieldCheck } from 'lucide-react';
import { useMaster } from '../context/MasterContext';
import { supabase } from '../lib/supabase';
import {
  cancelOrder,
  fetchConversationOrders,
  fetchMessages,
  sendMessage,
  settleCashOrder,
  type ChatMessage,
  type ConversationOrder,
} from '../lib/masterDb';
import { cn } from '../lib/utils';
import { Badge, Button, Card, EmptyState } from './ui';

const REVEAL_STATUSES = ['payment_approved', 'in_progress', 'completed'];

const Bi: React.FC<{ bn: string; en: string }> = ({ bn, en }) => (
  <span>{bn}<span className="ml-1.5 text-[10px] font-normal text-zinc-500">· {en}</span></span>
);

export const ChatPanel: React.FC = () => {
  const { profile, focusOrderId, openSignup, showToast, notifications } = useMaster();
  const [orders, setOrders] = useState<ConversationOrder[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(focusOrderId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [settleTrx, setSettleTrx] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (focusOrderId) setSelectedId(focusOrderId); }, [focusOrderId]);

  const loadOrders = useCallback(async () => {
    try {
      setOrders(await fetchConversationOrders('all'));
    } catch (e: any) {
      showToast(e?.message || 'কথোপকথন লোড করা যায়নি', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void loadOrders(); }, [loadOrders]);

  // A new message/order notification refreshes the conversation list instantly.
  useEffect(() => {
    if (notifications.length > 0) void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.length]);

  const loadMessages = useCallback(async (id: string) => {
    try { setMessages(await fetchMessages(id)); }
    catch { /* keep old messages on transient errors */ }
  }, []);

  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }
    void loadMessages(selectedId);

    // Instant realtime delivery; polling kept as a safety fallback.
    const channel = supabase
      .channel(`chat-${selectedId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `order_id=eq.${selectedId}` },
        () => void loadMessages(selectedId)
      )
      .subscribe();
    const timer = window.setInterval(() => void loadMessages(selectedId), 15000);

    return () => {
      void supabase.removeChannel(channel);
      window.clearInterval(timer);
    };
  }, [selectedId, loadMessages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const selected = useMemo(
    () => orders.find((o) => o.id === selectedId) ?? null,
    [orders, selectedId]
  );

  const handleSettle = async () => {
    if (!selected || settleTrx.trim().length < 4) {
      showToast('সঠিক Transaction ID দিন', 'error');
      return;
    }
    setBusy(true);
    try {
      await settleCashOrder(selected.id, settleTrx);
      setSettleTrx('');
      showToast('পেমেন্ট নিষ্পত্তি হয়েছে — এখন রিভিউ দিন!', 'success');
      await loadOrders();
    } catch (e: any) {
      showToast(e?.message || 'নিষ্পত্তি ব্যর্থ', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await cancelOrder(selected.id);
      showToast('অর্ডার বাতিল হয়েছে।', 'info');
      await loadOrders();
    } catch (e: any) {
      showToast(e?.message || 'বাতিল ব্যর্থ', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !text.trim()) return;
    setSending(true);
    try {
      await sendMessage(selectedId, text);
      setText('');
      await loadMessages(selectedId);
    } catch (err: any) {
      showToast(err?.message || 'মেসেজ পাঠানো যায়নি', 'error');
    } finally {
      setSending(false);
    }
  };

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <Card className="p-8 text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-zinc-500" />
          <h2 className="mt-4 text-lg font-semibold text-white">চ্যাট · Messages</h2>
          <p className="mt-1.5 text-[13px] text-zinc-400">কথা বলতে আপনার অ্যাকাউন্টে লগইন করুন।</p>
          <Button className="mt-5" onClick={openSignup}>লগইন / নিবন্ধন</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-400">In-app chat · নিরাপদ কথোপকথন</p>
        <h1 className="mt-1.5 font-display text-2xl text-white sm:text-3xl">মেসেজ</h1>
        <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-zinc-500">
          <Lock className="h-3.5 w-3.5" />
          <Bi bn="অর্ডার কনফার্ম হওয়ার আগে ফোন নম্বর দেখা যায় না" en="Phone hidden until the order is confirmed" />
        </p>
      </div>

      {loading ? (
        <p className="text-[13px] text-zinc-500">লোড হচ্ছে…</p>
      ) : orders.length === 0 ? (
        <EmptyState
          title="এখনো কোনো কথোপকথন নেই"
          description="একটি সেবা বুক করলেই প্রোভাইডারের সাথে চ্যাত শুরু করা যাবে।"
          icon={<MessageCircle className="h-6 w-6" />}
        />
      ) : (
        <Card className="grid overflow-hidden md:grid-cols-[260px_1fr]">
          {/* Conversation list */}
          <div className={cn('border-b border-white/[0.07] md:border-b-0 md:border-r', selected && 'hidden md:block')}>
            <p className="border-b border-white/[0.06] px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              All chats · সব কথোপকথন
            </p>
            <div className="max-h-[520px] overflow-y-auto">
              {orders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setSelectedId(o.id)}
                  className={cn(
                    'flex w-full flex-col gap-1 border-b border-white/[0.04] px-4 py-3 text-left transition-colors',
                    selectedId === o.id ? 'bg-orange-500/10' : 'hover:bg-white/[0.03]'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      {o.counterpartAvatar ? (
                        <img src={o.counterpartAvatar} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-[9px] font-bold text-orange-400">
                          {(o.counterpartName || 'N').charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="truncate text-[13px] font-medium text-white">{o.counterpartName || 'Nexserve'}</span>
                    </span>
                    <Badge tone={REVEAL_STATUSES.includes(o.status) ? 'green' : 'amber'} className="shrink-0">
                      {o.status === 'payment_approved' ? 'Paid' : o.status === 'in_progress' ? 'Working' : o.status === 'completed' ? 'Done' : 'Verify'}
                    </Badge>
                  </div>
                  <span className="truncate text-[11.5px] text-zinc-500">{o.serviceTitle || o.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Message thread */}
          <div className="flex min-h-[420px] flex-col">
            {!selected ? (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-[13px] text-zinc-500">
                একটি কথোপকথন বেছে নিন · Select a conversation
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <button className="md:hidden" onClick={() => setSelectedId(null)} aria-label="Back">
                      <ArrowLeft className="h-4 w-4 text-zinc-400" />
                    </button>
                    {selected.counterpartAvatar ? (
                      <img src={selected.counterpartAvatar} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-xs font-bold text-orange-400">
                        {(selected.counterpartName || 'N').charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-semibold text-white">{selected.counterpartName || 'Nexserve user'}</p>
                      <p className="truncate text-[11px] text-zinc-500">{selected.serviceTitle || selected.category}</p>
                    </div>
                  </div>
                  {REVEAL_STATUSES.includes(selected.status) && selected.counterpartPhone ? (
                    <a
                      href={`tel:${selected.counterpartPhone}`}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11.5px] font-medium text-emerald-300"
                    >
                      <Phone className="h-3.5 w-3.5" /> {selected.counterpartPhone}
                    </a>
                  ) : (
                    <span className="flex shrink-0 items-center gap-1 rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-[10.5px] text-zinc-500">
                      <ShieldCheck className="h-3.5 w-3.5" /> Phone locked
                    </span>
                  )}
                </div>

                {/* Cash-After-Work settlement / cancellation — RPC-only actions */}
                {profile.role === 'customer' && selected.status === 'payment_verifying' && (
                  <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 bg-amber-500/[0.05] px-4 py-2.5">
                    <p className="text-[11.5px] text-amber-200">পেমেন্ট যাচাই হচ্ছে · Waiting for verification</p>
                    <Button size="sm" variant="danger" loading={busy} onClick={() => void handleCancel()}>বাতিল</Button>
                  </div>
                )}
                {profile.role === 'customer' && selected.payment_mode === 'cash_after_work' && selected.status === 'in_progress' && (
                  <div className="border-b border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3">
                    <p className="text-[11.5px] font-medium text-emerald-200">
                      কাজ শেষে পেমেন্ট দিন · Settle after work
                    </p>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={settleTrx}
                        onChange={(e) => setSettleTrx(e.target.value)}
                        placeholder="bKash/Nagad TrxID"
                        className="h-9 flex-1 rounded-lg border border-white/10 bg-zinc-950/60 px-3 text-[12px] text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/60 focus:outline-none"
                      />
                      <Button size="sm" loading={busy} onClick={() => void handleSettle()}>নিষ্পত্তি করুন</Button>
                    </div>
                  </div>
                )}

                <div className="flex-1 space-y-2 overflow-y-auto bg-[#0b0b0e] p-4" style={{ maxHeight: 420 }}>
                  {messages.length === 0 && (
                    <p className="py-10 text-center text-[12px] text-zinc-600">
                      এখনো কোনো মেসেজ নেই। প্রথম বার্তাটি পাঠান।
                    </p>
                  )}
                  {messages.map((m) => (
                    <div key={m.id} className={cn('flex', m.sender_id === profile.id ? 'justify-end' : 'justify-start')}>
                      <div
                        className={cn(
                          'max-w-[78%] rounded-2xl px-3.5 py-2 text-[12.5px] leading-relaxed',
                          m.sender_id === profile.id
                            ? 'rounded-br-sm bg-orange-500 text-black'
                            : 'rounded-bl-sm border border-white/[0.07] bg-zinc-900 text-zinc-200'
                        )}
                      >
                        {m.body}
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={handleSend} className="flex gap-2 border-t border-white/[0.07] p-3">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="মেসেজ লিখুন… · Type a message"
                    className="h-10 flex-1 rounded-lg border border-white/10 bg-zinc-950/60 px-3 text-[13px] text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/60 focus:outline-none"
                  />
                  <Button type="submit" size="sm" disabled={!text.trim()} loading={sending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ChatPanel;
