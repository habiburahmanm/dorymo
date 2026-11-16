/**
 * dorymo — Reviews (Step 4).
 * Replaces the old hardcoded rating:5 with REAL ratings from completed jobs.
 * Customers leave a 1-5 star review only after a job is actually completed.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { MessageSquare, Star, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useMaster } from '../context/MasterContext';
import {
  fetchReviewableOrders,
  fetchReviewsForProvider,
  submitReview,
  type ConversationOrder,
  type ReviewRow,
} from '../lib/masterDb';
import { cn, formatDate } from '../lib/utils';
import { Button, Card, EmptyState, TextArea } from './ui';

const Bi: React.FC<{ bn: string; en: string }> = ({ bn, en }) => (
  <span>{bn}<span className="ml-1.5 text-[10px] font-normal text-zinc-500">· {en}</span></span>
);

export const ReviewsPanel: React.FC = () => {
  const { profile, openSignup, showToast } = useMaster();
  const [reviewable, setReviewable] = useState<ConversationOrder[]>([]);
  const [myReviews, setMyReviews] = useState<ReviewRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) { setLoading(false); return; }
    setLoading(true);
    try {
      const rows = await fetchReviewableOrders();
      setReviewable(rows);
      if (rows.length > 0 && !selected) setSelected(rows[0].id);
      if (profile.role === 'provider') {
        setMyReviews(await fetchReviewsForProvider(profile.id));
      }
    } catch (e: any) {
      showToast(e?.message || 'রিভিউ লোড করা যায়নি', 'error');
    } finally {
      setLoading(false);
    }
  }, [profile, selected, showToast]);

  useEffect(() => { void load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    try {
      await submitReview(selected, rating, comment);
      showToast('রিভিউ দেওয়ার জন্য ধন্যবাদ!', 'success');
      setComment('');
      setRating(5);
      await load();
    } catch (err: any) {
      showToast(err?.message || 'রিভিউ দেওয়া যায়নি', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <Card className="p-8 text-center">
          <Star className="mx-auto h-8 w-8 text-zinc-500" />
          <h2 className="mt-4 text-lg font-semibold text-white">রিভিউ · Reviews</h2>
          <p className="mt-1.5 text-[13px] text-zinc-400">রিভিউ দিতে আপনার অ্যাকাউন্টে লগইন করুন।</p>
          <Button className="mt-5" onClick={openSignup}>লগইন / নিবন্ধন</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-400">Reviews · বাস্তব মতামত</p>
        <h1 className="mt-1.5 font-display text-2xl text-white sm:text-3xl">রিভিউ দিন ও দেখুন</h1>
        <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-zinc-500">
          <ShieldCheck className="h-3.5 w-3.5" />
          <Bi bn="শুধু সম্পন্ন কাজের জন্যই রিভিউ — কোনো ফেক দেওয়া যায় না" en="Only completed jobs can be reviewed" />
        </p>
      </div>

      {loading ? (
        <p className="text-[13px] text-zinc-500">লোড হচ্ছে…</p>
      ) : (
        <>
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-white">
              <MessageSquare className="h-4 w-4 text-orange-400" />
              <Bi bn="আপনার সম্পন্ন কাজ" en="Your completed jobs" />
            </h2>
            {reviewable.length === 0 ? (
              <EmptyState
                title="রিভিউ দেওয়ার মতো কাজ নেই"
                description="কাজ সম্পন্ন হলে এখানে রিভিউ দেওয়ার সুযোগ আসবে।"
                icon={<CheckCircle2 className="h-6 w-6" />}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {reviewable.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setSelected(o.id)}
                      className={cn(
                        'max-w-full truncate rounded-lg border px-3 py-1.5 text-[12px] transition-colors',
                        selected === o.id ? 'border-orange-500/50 bg-orange-500/10 text-orange-300' : 'border-white/10 text-zinc-400'
                      )}
                    >
                      {o.serviceTitle || o.category}
                    </button>
                  ))}
                </div>

                <Card className="p-5">
                  <form onSubmit={handleSubmit}>
                    <p className="text-[12.5px] font-medium text-zinc-300">
                      <Bi bn="কেমন কাজ হয়েছে?" en="How was the work?" />
                    </p>
                    <div className="mt-2 flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
                          <Star
                            className={cn(
                              'h-8 w-8 transition-colors',
                              n <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="mt-4">
                      <TextArea
                        label="মতামত লিখুন · Your comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="কাজের মান, সময়ানুবর্তিতা, আচরণ…"
                        rows={3}
                      />
                    </div>
                    <Button type="submit" className="mt-4" loading={busy}>রিভিউ জমা দিন · Submit</Button>
                  </form>
                </Card>
              </div>
            )}
          </section>

          {profile.role === 'provider' && (
            <section className="mt-10">
              <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-white">
                <Star className="h-4 w-4 text-amber-400" />
                <Bi bn="আমার সম্পর্কে মতামত" en="Reviews about me" />
              </h2>
              {myReviews.length === 0 ? (
                <EmptyState title="এখনো কোনো রিভিউ নেই" description="কাজ শেষে গ্রাহকরা এখানে মতামত দেবেন।" icon={<Star className="h-6 w-6" />} />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-zinc-900/40 p-4">
                    <p className="text-3xl font-bold text-amber-400">
                      {(myReviews.reduce((s, r) => s + r.rating, 0) / myReviews.length).toFixed(1)}
                    </p>
                    <div>
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} className={cn('h-4 w-4', n <= Math.round(myReviews.reduce((s, r) => s + r.rating, 0) / myReviews.length) ? 'fill-amber-400' : 'text-zinc-700')} />
                        ))}
                      </div>
                      <p className="mt-0.5 text-[11.5px] text-zinc-500">{myReviews.length} টি রিভিউ · real reviews</p>
                    </div>
                  </div>
                  {myReviews.map((r) => (
                    <Card key={r.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex text-amber-400">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} className={cn('h-3.5 w-3.5', n <= r.rating ? 'fill-amber-400' : 'text-zinc-700')} />
                          ))}
                        </div>
                        <span className="text-[10.5px] text-zinc-600">{formatDate(r.created_at)}</span>
                      </div>
                      <p className="mt-2 text-[12.5px] leading-relaxed text-zinc-300">{r.comment || '—'}</p>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default ReviewsPanel;
