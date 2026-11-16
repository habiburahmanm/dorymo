/**
 * dorymo — self-contained state for the Manual SIM Checkout + Founder Console.
 * Mounted in main.tsx as the single global state provider for the whole app.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  approveProvider as dbApproveProvider,
  fetchMyProfile,
  fetchPayouts,
  fetchPendingPayments,
  fetchPendingProviders,
  submitCheckout as dbSubmitCheckout,
  verifyPayment as dbVerifyPayment,
  recordPayout as dbRecordPayout,
  recordDepositRefund as dbRecordDepositRefund,
  signUpV2 as dbSignUpV2,
  fetchNotifications as dbFetchNotifications,
  markNotificationRead as dbMarkNotificationRead,
  markAllNotificationsRead as dbMarkAllNotificationsRead,
  type CheckoutInput,
  type NotificationRow,
  type PendingPayment,
  type PayoutView,
  type PendingProvider,
  type SignUpV2Input,
  type UserRow,
} from '../lib/masterDb';
import { supabase } from '../lib/supabase';
import { initPushNavigation, registerRemotePush, showLocalAlert } from '../lib/pushNotifications';

export type MasterView =
  | 'manual_checkout'
  | 'admin_verify'
  | 'explore'
  | 'provider_jobs'
  | 'chat'
  | 'reviews'
  | 'how_it_works'
  | 'customer_dashboard'
  | null;

interface Toast {
  message: string;
  tone: 'success' | 'error' | 'info';
}

interface MasterContextType {
  masterView: MasterView;
  goPay: (serviceId?: string) => void;
  goAdmin: () => void;
  goExplore: (category?: string) => void;
  exploreCategory: string | null;
  setExploreCategory: (category: string | null) => void;
  goHow: () => void;
  goAccount: () => void;
  goProviderJobs: () => void;
  goChat: (orderId?: string) => void;
  goReviews: () => void;
  goHome: () => void;
  focusOrderId: string | null;

  profile: UserRow | null;
  isAdmin: boolean;
  isProvider: boolean;
  refreshProfile: () => Promise<void>;
  signUp: (input: SignUpV2Input) => Promise<{ needsConfirmation: boolean } | null>;

  pendingPayments: PendingPayment[];
  pendingProviders: PendingProvider[];
  payouts: PayoutView[];
  commissionEarned: number;
  payoutsDue: number;
  payProvider: (orderId: string, trxId: string, note?: string) => Promise<boolean>;
  refundDeposit: (orderId: string, trxId: string) => Promise<boolean>;
  adminLoading: boolean;
  refreshAdmin: () => Promise<void>;

  submitPayment: (input: CheckoutInput) => Promise<string | null>;
  verify: (paymentId: string, approve: boolean, note?: string) => Promise<boolean>;
  decideProvider: (userId: string, approve: boolean) => Promise<boolean>;

  toast: Toast | null;
  showToast: (message: string, tone?: Toast['tone']) => void;
  clearToast: () => void;

  /* --- realtime notifications --- */
  notifications: NotificationRow[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  realtimeConnected: boolean;

  signupOpen: boolean;
  openSignup: () => void;
  closeSignup: () => void;
  avatarOpen: boolean;
  openAvatar: () => void;
  closeAvatar: () => void;
  /** set by Explore so Checkout preselects the chosen service */
  preselectedServiceId: string | null;
  setPreselectedService: (id: string | null) => void;
}

const MasterContext = createContext<MasterContextType | undefined>(undefined);

function viewFromHash(): MasterView {
  const h = window.location.hash.toLowerCase();
  if (h.includes('admin-verify') || h.includes('console')) return 'admin_verify';
  if (h.includes('provider-jobs')) return 'provider_jobs';
  if (h.includes('explore-v2')) return 'explore';
  if (h.includes('chat-v2')) return 'chat';
  if (h.includes('reviews-v2')) return 'reviews';
  if (h.includes('my-account') || h.includes('dashboard-customer')) return 'customer_dashboard';
  if (h.includes('how')) return 'how_it_works';
  if (h.includes('pay') || h.includes('checkout-manual')) return 'manual_checkout';
  return null;
}

function setHash(hash: string) {
  window.history.replaceState(null, '', hash);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export const MasterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [masterView, setMasterView] = useState<MasterView>(viewFromHash);
  const [profile, setProfile] = useState<UserRow | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [pendingProviders, setPendingProviders] = useState<PendingProvider[]>([]);
  const [payouts, setPayouts] = useState<PayoutView[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [signupOpen, setSignupOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [preselectedServiceId, setPreselectedService] = useState<string | null>(null);
  const [focusOrderId, setFocusOrderId] = useState<string | null>(null);
  const [exploreCategory, setExploreCategory] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const showToast = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3200);
  }, []);
  const clearToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    const onHash = () => setMasterView(viewFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setProfile(await fetchMyProfile());
    } catch {
      /* profile is optional on public pages */
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  /* ------------------------------------------------------ realtime notifications */
  const loadNotifications = useCallback(async () => {
    try {
      setNotifications(await dbFetchNotifications());
    } catch {
      /* notifications are non-critical */
    }
  }, []);

  const refreshAdminRef = useRef<() => Promise<void>>(async () => {});
  const refreshAdminSafe = useCallback(() => refreshAdminRef.current(), []);

  // Native phone push: register device + handle taps
  useEffect(() => {
    if (!profile) return;
    void registerRemotePush();
    let cleanup: (() => void) | undefined;
    void initPushNavigation((link) => {
      if (link) window.location.hash = link;
    }).then((fn) => { cleanup = fn; });
    return () => { cleanup?.(); };
  }, [profile?.id]);

  useEffect(() => {
    if (!profile) { setNotifications([]); return; }
    void loadNotifications();

    const channel = supabase
      .channel(`dorymo-notifications-${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          const row = payload.new as NotificationRow;
          setNotifications((prev) =>
            prev.some((n) => n.id === row.id) ? prev : [row, ...prev].slice(0, 40)
          );
          // Instant founder toast + phone notification (native app)
          showToast(`${row.title} — ${row.body}`, row.type.includes('rejected') ? 'error' : 'info');
          void showLocalAlert(row);
          if (row.type === 'payment_pending' || row.type === 'provider_pending') {
            void refreshAdminSafe();
          }
        }
      )
      .subscribe((status) => setRealtimeConnected(status === 'SUBSCRIBED'));

    return () => { void supabase.removeChannel(channel); };
    // refreshAdminSafe is defined below via ref trick; keep deps minimal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, loadNotifications, showToast]);

  const refreshAdmin = useCallback(async () => {
    setAdminLoading(true);
    try {
      const [payments, providers, payoutRows] = await Promise.all([
        fetchPendingPayments(),
        fetchPendingProviders(),
        fetchPayouts(),
      ]);
      setPendingPayments(payments);
      setPendingProviders(providers);
      setPayouts(payoutRows);
    } catch (e: any) {
      showToast(e?.message || 'অ্যাডমিন ডেটা লোড করা যায়নি', 'error');
    } finally {
      setAdminLoading(false);
    }
  }, [showToast]);

  refreshAdminRef.current = refreshAdmin;

  useEffect(() => {
    if (masterView === 'admin_verify') void refreshAdmin();
  }, [masterView, refreshAdmin]);

  const payProvider = useCallback(
    async (orderId: string, trxId: string, note?: string) => {
      try {
        await dbRecordPayout(orderId, trxId, note);
        showToast('প্রোভাইডার পেমেন্ট রেকর্ড হয়েছে।', 'success');
        await refreshAdmin();
        return true;
      } catch (e: any) {
        showToast(e?.message || 'পেমেন্ট রেকর্ড ব্যর্থ', 'error');
        return false;
      }
    },
    [refreshAdmin, showToast]
  );

  const refundDeposit = useCallback(
    async (orderId: string, trxId: string) => {
      try {
        await dbRecordDepositRefund(orderId, trxId);
        showToast('জামানত ফেরত রেকর্ড হয়েছে।', 'success');
        await refreshAdmin();
        return true;
      } catch (e: any) {
        showToast(e?.message || 'জামানত ফেরত রেকর্ড ব্যর্থ', 'error');
        return false;
      }
    },
    [refreshAdmin, showToast]
  );

  const goPay = useCallback((serviceId?: string) => {
    if (serviceId) setPreselectedService(serviceId);
    setHash('#/pay');
    setMasterView('manual_checkout');
  }, []);
  const goAdmin = useCallback(() => { setHash('#/admin-verify'); setMasterView('admin_verify'); }, []);
  const goExplore = useCallback((category?: string) => {
    if (category) setExploreCategory(category);
    setHash('#/explore-v2');
    setMasterView('explore');
  }, []);
  const goHow = useCallback(() => { setHash('#/how-it-works'); setMasterView('how_it_works'); }, []);
  const goAccount = useCallback(() => { setHash('#/my-account'); setMasterView('customer_dashboard'); }, []);
  const goProviderJobs = useCallback(() => { setHash('#/provider-jobs'); setMasterView('provider_jobs'); }, []);
  const goChat = useCallback((orderId?: string) => {
    if (orderId) setFocusOrderId(orderId);
    setHash('#/chat-v2');
    setMasterView('chat');
  }, []);
  const goReviews = useCallback(() => { setHash('#/reviews-v2'); setMasterView('reviews'); }, []);
  const goHome = useCallback(() => { setHash('#/'); setMasterView(null); }, []);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try { await dbMarkNotificationRead(id); } catch { /* non-critical */ }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try { await dbMarkAllNotificationsRead(); } catch { /* non-critical */ }
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const register = useCallback(
    async (input: SignUpV2Input) => {
      try {
        const result = await dbSignUpV2(input);
        if (!result.needsConfirmation) {
          await loadProfile();
          showToast(
            input.role === 'provider'
              ? 'নিবন্ধন সম্পন্ন! অ্যাডমিন NID যাচাই করে অ্যাকাউন্ট অনুমোদন করবে।'
              : 'অ্যাকাউন্ট তৈরি হয়েছে! এখনই সেবা বুক করতে পারেন।',
            'success'
          );
        }
        return result;
      } catch (e: any) {
        showToast(e?.message || 'নিবন্ধন ব্যর্থ', 'error');
        return null;
      }
    },
    [loadProfile, showToast]
  );

  const submitPayment = useCallback(
    async (input: CheckoutInput) => {
      try {
        const id = await dbSubmitCheckout(input);
        showToast(
          input.cashAfterWork
            ? 'অর্ডার কনফার্ম! কাজ শেষে টাকা দিন — কোনো ঝুঁকি নেই।'
            : 'পেমেন্ট জমা দেওয়া হয়েছে। অ্যাডমিন যাচাই করলে কাজ শুরু হবে।',
          'success'
        );
        return id;
      } catch (e: any) {
        showToast(e?.message || 'অর্ডার করা যায়নি', 'error');
        return null;
      }
    },
    [showToast]
  );

  const verify = useCallback(
    async (paymentId: string, approve: boolean, note?: string) => {
      try {
        await dbVerifyPayment(paymentId, approve, note);
        showToast(
          approve ? 'পেমেন্ট অনুমোদিত — কাজ প্রোভাইডারের জন্য খুলে দেওয়া হয়েছে।' : 'পেমেন্ট বাতিল করা হয়েছে।',
          approve ? 'success' : 'info'
        );
        await refreshAdmin();
        return true;
      } catch (e: any) {
        showToast(e?.message || 'পেমেন্ট যাচাই ব্যর্থ', 'error');
        return false;
      }
    },
    [refreshAdmin, showToast]
  );

  const decideProvider = useCallback(
    async (userId: string, approve: boolean) => {
      try {
        await dbApproveProvider(userId, approve);
        showToast(approve ? 'প্রোভাইডার অনুমোদিত!' : 'প্রোভাইডার বাতিল।', approve ? 'success' : 'info');
        await refreshAdmin();
        return true;
      } catch (e: any) {
        showToast(e?.message || 'অনুমোদন ব্যর্থ', 'error');
        return false;
      }
    },
    [refreshAdmin, showToast]
  );

  const value = useMemo<MasterContextType>(
    () => ({
      masterView,
      goPay,
      goAdmin,
      goExplore,
      exploreCategory,
      setExploreCategory,
      goHow,
      goAccount,
      goProviderJobs,
      goChat,
      goReviews,
      goHome,
      focusOrderId,
      profile,
      isAdmin: profile?.role === 'admin',
      isProvider: profile?.role === 'provider',
      refreshProfile: loadProfile,
      signUp: register,
      pendingPayments,
      pendingProviders,
      payouts,
      commissionEarned: payouts.filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.commission_amount), 0),
      payoutsDue: payouts.filter((p) => p.status === 'pending').length,
      payProvider,
      refundDeposit,
      adminLoading,
      refreshAdmin,
      submitPayment,
      verify,
      decideProvider,
      toast,
      showToast,
      clearToast,
      notifications,
      unreadCount,
      markRead,
      markAllRead,
      realtimeConnected,
      signupOpen,
      openSignup: () => setSignupOpen(true),
      closeSignup: () => setSignupOpen(false),
      avatarOpen,
      openAvatar: () => setAvatarOpen(true),
      closeAvatar: () => setAvatarOpen(false),
      preselectedServiceId,
      setPreselectedService,
    }),
    [
      masterView, goPay, goAdmin, goExplore, exploreCategory, goHow, goAccount, goProviderJobs, goChat, goReviews, goHome,
      focusOrderId, profile, loadProfile, register, pendingPayments, pendingProviders,
      payouts, payProvider, refundDeposit, adminLoading, refreshAdmin, submitPayment, verify, decideProvider, toast,
      showToast, clearToast, notifications, unreadCount, markRead, markAllRead,
      realtimeConnected, signupOpen, avatarOpen, preselectedServiceId,
    ]
  );

  return <MasterContext.Provider value={value}>{children}</MasterContext.Provider>;
};

export const useMaster = (): MasterContextType => {
  const ctx = useContext(MasterContext);
  if (!ctx) throw new Error('useMaster must be used inside MasterProvider');
  return ctx;
};
