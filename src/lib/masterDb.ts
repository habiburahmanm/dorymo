/**
 * dorymo — data layer for the psychology-driven marketplace.
 *
 * "Backend logic" lives in Postgres (see supabase/nexserve_master_schema.sql):
 *   - create_manual_payment_order() : atomic order + payment claim
 *   - verify_manual_payment()       : ONE-CLICK admin action (admin-only)
 *   - approve_provider()            : ONE-CLICK admin action (admin-only)
 * All security is enforced by RLS, so no Express server is required here.
 */
import { supabase } from './supabase';

/* ------------------------------------------------------------------ types */
export type Role = 'customer' | 'provider' | 'admin';
export type AccountStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type Category = 'digital_gig' | 'home_repair' | 'equipment_rental';
export type OrderStatus =
  | 'payment_verifying'
  | 'payment_approved'
  | 'payment_rejected'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed';
export type PaymentStatus = 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';

export interface UserRow {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  account_status: AccountStatus;
  area: string | null;
  service_skill: string | null;
  is_nationwide: boolean;
  avatar_url: string | null;
  created_at: string;
}

export interface ServiceRow {
  id: string;
  provider_id: string;
  category: Category;
  title: string;
  description: string;
  price: number;
  price_unit: 'job' | 'hour' | 'day';
  area: string | null;
  is_nationwide: boolean;
  security_deposit: number;
  response_minutes: number;
  is_active: boolean;
}

export interface OrderRow {
  id: string;
  customer_id: string;
  provider_id: string | null;
  service_id: string | null;
  category: Category;
  amount: number;
  deposit_amount: number;
  payment_mode: 'manual_sim' | 'cash_after_work';
  status: OrderStatus;
  address: string | null;
  settlement_trx_id: string | null;
  commission_amount: number;
  provider_payout_amount: number;
  provider_paid: boolean;
  deposit_refunded: boolean;
  deposit_refund_trx_id: string | null;
  scheduled_date: string | null;
  time_slot: string | null;
  deposit_return_status: 'not_applicable' | 'pending_return' | 'clean_pass' | 'damage_detected' | 'refunded';
  return_note: string | null;
  warranty_until: string | null;
  next_order_discount: number;
  created_at: string;
}

export interface PaymentRow {
  id: string;
  order_id: string;
  customer_id: string;
  method: 'bkash' | 'nagad';
  sender_number: string;
  trx_id: string;
  amount: number;
  status: PaymentStatus;
  admin_note: string | null;
  submitted_at: string;
  verified_at: string | null;
}

/** One row in the founder's "payments to verify" queue */
export interface PendingPayment {
  payment: PaymentRow;
  order: OrderRow | null;
  customer: UserRow | null;
  phone: string | null;
  serviceTitle: string | null;
}

/** One row in the founder's "providers to approve" queue */
export interface PendingProvider {
  user: UserRow;
  phone: string | null;
  nidPhotoUrl: string | null;
}

export interface ChatMessage {
  id: string;
  order_id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export type NotificationType =
  | 'payment_pending'
  | 'payment_approved'
  | 'payment_rejected'
  | 'provider_pending'
  | 'provider_approved'
  | 'provider_rejected'
  | 'new_message'
  | 'job_accepted'
  | 'job_completed'
  | 'deposit_dispute'
  | 'deposit_clean'
  | 'deposit_refunded';

export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

/* ------------------------------------------------------------------ helpers */
async function me(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

function fail(error: { message: string } | null, fallback: string): void {
  if (error) throw new Error(error.message || fallback);
}

/* ------------------------------------------------------------------ reads */
export async function fetchMyProfile(): Promise<UserRow | null> {
  const id = await me();
  if (!id) return null;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  fail(error, 'প্রোফাইল লোড করা যায়নি');
  return (data as UserRow) ?? null;
}

export async function fetchServices(): Promise<ServiceRow[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  fail(error, 'সেবা লোড করা যায়নি');
  return (data as ServiceRow[]) ?? [];
}

export async function fetchProviderNames(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, area')
    .eq('role', 'provider')
    .eq('account_status', 'APPROVED');
  fail(error, 'প্রোভাইডার লোড করা যায়নি');
  const map: Record<string, string> = {};
  (data ?? []).forEach((u: any) => {
    map[u.id] = u.area ? `${u.full_name} · ${u.area}` : u.full_name;
  });
  return map;
}

export async function fetchMyOrders(): Promise<OrderRow[]> {
  const id = await me();
  if (!id) return [];
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', id)
    .order('created_at', { ascending: false });
  fail(error, 'অর্ডার লোড করা যায়নি');
  return (data as OrderRow[]) ?? [];
}

export async function fetchMessages(orderId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });
  fail(error, 'মেসেজ লোড করা যায়নি');
  return (data as ChatMessage[]) ?? [];
}

export async function sendMessage(orderId: string, body: string): Promise<void> {
  const id = await me();
  if (!id) throw new Error('লগইন প্রয়োজন');
  const { error } = await supabase
    .from('messages')
    .insert({ order_id: orderId, sender_id: id, body: body.trim() });
  fail(error, 'মেসেজ পাঠানো যায়নি');
}

/* ------------------------------------------------------------------ admin reads */
export async function fetchPendingPayments(): Promise<PendingPayment[]> {
  const { data: payments, error } = await supabase
    .from('manual_payments')
    .select('*')
    .eq('status', 'PENDING_VERIFICATION')
    .order('submitted_at', { ascending: true }); // oldest first = founder clears the queue
  fail(error, 'পেমেন্ট কিউ লোড করা যায়নি');
  const rows = (payments as PaymentRow[]) ?? [];
  if (rows.length === 0) return [];

  const orderIds = rows.map((r) => r.order_id);
  const customerIds = Array.from(new Set(rows.map((r) => r.customer_id)));

  const [{ data: orders }, { data: users }, { data: privates }] = await Promise.all([
    supabase.from('orders').select('*').in('id', orderIds),
    supabase.from('users').select('*').in('id', customerIds),
    supabase.from('user_private').select('user_id, phone').in('user_id', customerIds),
  ]);

  const orderMap = new Map((orders ?? []).map((o: any) => [o.id, o as OrderRow]));
  const userMap = new Map((users ?? []).map((u: any) => [u.id, u as UserRow]));
  const phoneMap = new Map((privates ?? []).map((p: any) => [p.user_id, p.phone as string]));

  return rows.map((payment) => {
    const order = orderMap.get(payment.order_id) ?? null;
    return {
      payment,
      order,
      customer: userMap.get(payment.customer_id) ?? null,
      phone: phoneMap.get(payment.customer_id) ?? null,
      serviceTitle: null,
    };
  });
}

export async function fetchPendingProviders(): Promise<PendingProvider[]> {
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'provider')
    .eq('account_status', 'PENDING')
    .order('created_at', { ascending: true });
  fail(error, 'প্রোভাইডার কিউ লোড করা যায়নি');
  const rows = (users as UserRow[]) ?? [];
  if (rows.length === 0) return [];

  const ids = rows.map((u) => u.id);
  const { data: privates } = await supabase
    .from('user_private')
    .select('user_id, phone, nid_photo_url')
    .in('user_id', ids);
  const pMap = new Map((privates ?? []).map((p: any) => [p.user_id, p]));

  return Promise.all(
    rows.map(async (user) => {
      const p = pMap.get(user.id) as { phone: string; nid_photo_url: string | null } | undefined;
      return {
        user,
        phone: p?.phone ?? null,
        nidPhotoUrl: await signedNidUrl(p?.nid_photo_url ?? null),
      };
    })
  );
}

/* ------------------------------------------------------------------ writes (backend logic via RPC) */
export interface CheckoutInput {
  serviceId: string;
  address: string;
  method: 'bkash' | 'nagad';
  senderNumber: string;
  trxId: string;
  cashAfterWork: boolean;
  scheduledDate?: string;
  timeSlot?: string;
}

export async function submitCheckout(input: CheckoutInput): Promise<string> {
  const { data, error } = await supabase.rpc('create_manual_payment_order', {
    p_service_id: input.serviceId,
    p_address: input.address,
    p_method: input.method,
    p_sender_number: input.senderNumber,
    p_trx_id: input.trxId,
    p_cash_after_work: input.cashAfterWork,
    p_scheduled_date: input.scheduledDate || null,
    p_time_slot: input.timeSlot || null,
  });
  fail(error, 'অর্ডার তৈরি করা যায়নি');
  return data as string;
}

export async function verifyPayment(paymentId: string, approve: boolean, note?: string): Promise<void> {
  const { error } = await supabase.rpc('verify_manual_payment', {
    p_payment_id: paymentId,
    p_approve: approve,
    p_note: note ?? null,
  });
  fail(error, 'পেমেন্ট যাচাই করা যায়নি');
}

export async function approveProvider(userId: string, approve: boolean): Promise<void> {
  const { error } = await supabase.rpc('approve_provider', {
    p_user_id: userId,
    p_approve: approve,
  });
  fail(error, 'প্রোভাইডার অনুমোদন করা যায়নি');
}

/* ========================================================================== */
/* STEP 3 — SIGNUP WITH NID + BILINGUAL PROVIDER JOBS                         */
/* ========================================================================== */

export interface SignUpV2Input {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'customer' | 'provider';
  area: string;
  serviceSkill: string;
  category: Category;
  nidNumber: string;
  nidFile: File | null;
}

/** Signup + optional NID upload. Customers are auto-approved by the DB trigger. */
export async function signUpV2(input: SignUpV2Input): Promise<{ needsConfirmation: boolean }> {
  const email = input.email.trim().toLowerCase();
  if (input.password.length < 6) throw new Error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('সঠিক ইমেইল লিখুন।');
  const phone = input.phone.replace(/[\s-]/g, '').replace(/^\+?880/, '');
  if (!/^01[3-9]\d{8}$/.test(phone)) {
    throw new Error('সঠিক মোবাইল নম্বর লিখুন (01712345678)।');
  }
  if (input.role === 'provider' && !input.serviceSkill.trim()) {
    throw new Error('প্রোভাইডারের জন্য কাজের ধরন লিখুন (যেমন: ইলেকট্রিশিয়ান)।');
  }
  if (input.role === 'provider' && !input.nidNumber.trim()) {
    throw new Error('প্রোভাইডারের জন্য NID নম্বর লিখুন।');
  }
  if (input.role === 'provider' && !input.nidFile) {
    throw new Error('প্রোভাইডারের জন্য NID ছবি আপলোড করুন।');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        full_name: input.name.trim(),
        phone: phone || null,
        role: input.role,
        area: input.area || null,
        service_skill: input.serviceSkill || null,
        // digital work is nationwide; home repair + rental stay hyper-local
        is_nationwide: input.role === 'provider' && input.category === 'digital_gig',
      },
    },
  });
  fail(error, 'অ্যাকাউন্ট তৈরি করা যায়নি');

  if (!data.session) return { needsConfirmation: true };

  if (input.role === 'provider' && input.nidFile) {
    const path = await uploadNidPhoto(input.nidFile);
    await saveProviderNid(input.nidNumber, path);
  }
  return { needsConfirmation: false };
}

export async function uploadNidPhoto(file: File): Promise<string> {
  const id = await me();
  if (!id) throw new Error('NID আপলোডের জন্য লগইন প্রয়োজন');
  const ext = (file.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '').slice(0, 5) || 'jpg';
  const path = `${id}/nid-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('nid-documents')
    .upload(path, file, { contentType: file.type, upsert: false });
  fail(error, 'NID ছবি আপলোড করা যায়নি');
  return path;
}

export async function saveProviderNid(nidNumber: string, path: string): Promise<void> {
  const id = await me();
  if (!id) throw new Error('লগইন প্রয়োজন');
  const { error } = await supabase
    .from('user_private')
    .update({ nid_number: nidNumber || null, nid_photo_url: path })
    .eq('user_id', id);
  fail(error, 'NID তথ্য সংরক্ষণ করা যায়নি');
}

export interface AvailableOrder {
  id: string;
  category: Category;
  title: string;
  amount: number;
  deposit_amount: number;
  area: string;
  customer_name: string;
  created_at: string;
  status: OrderStatus;
}

export async function fetchAvailableOrders(): Promise<AvailableOrder[]> {
  const { data, error } = await supabase.rpc('available_orders_for_provider');
  fail(error, 'কাজের তালিকা লোড করা যায়নি');
  return (data as AvailableOrder[]) ?? [];
}

export async function acceptOrder(orderId: string): Promise<void> {
  const { error } = await supabase.rpc('provider_accept_order', { p_order_id: orderId });
  fail(error, 'কাজ গ্রহণ করা যায়নি');
}

export async function completeOrder(orderId: string): Promise<void> {
  const { error } = await supabase.rpc('provider_complete_order', { p_order_id: orderId });
  fail(error, 'কাজ সম্পন্ন করা যায়নি');
}

/** Customer cancels their own order (RPC-only, no open UPDATE policy). */
export async function cancelOrder(orderId: string): Promise<void> {
  const { error } = await supabase.rpc('customer_cancel_order', { p_order_id: orderId });
  fail(error, 'অর্ডার বাতিল করা যায়নি');
}

/** Customer records the TrxID they paid after a Cash-After-Work job. */
export async function settleCashOrder(orderId: string, trxId: string): Promise<void> {
  const { error } = await supabase.rpc('customer_settle_cash_order', {
    p_order_id: orderId,
    p_trx_id: trxId,
  });
  fail(error, 'পেমেন্ট নিষ্পত্তি করা যায়নি');
}

/* ========================================================================== */
/* STEP 4 — HYPER-LOCAL EXPLORE, CHAT, REVIEWS                                */
/* ========================================================================== */

export interface ConversationOrder extends OrderRow {
  serviceTitle: string | null;
  counterpartId: string | null;
  counterpartName: string | null;
  counterpartAvatar: string | null;
  counterpartPhone: string | null;
}

async function enrichOrders(rows: OrderRow[], viewerId: string): Promise<ConversationOrder[]> {
  if (rows.length === 0) return [];
  const serviceIds = Array.from(new Set(rows.map((r) => r.service_id).filter(Boolean) as string[]));
  const counterpartIds = Array.from(
    new Set(rows.map((r) => (r.customer_id === viewerId ? r.provider_id : r.customer_id)).filter(Boolean) as string[])
  );

  const [{ data: services }, { data: users }, { data: privates }] = await Promise.all([
    serviceIds.length
      ? supabase.from('services').select('id, title').in('id', serviceIds)
      : Promise.resolve({ data: [] as any[] }),
    counterpartIds.length
      ? supabase.from('users').select('id, full_name, avatar_url').in('id', counterpartIds)
      : Promise.resolve({ data: [] as any[] }),
    counterpartIds.length
      ? supabase.from('user_private').select('user_id, phone').in('user_id', counterpartIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const serviceMap = new Map((services ?? []).map((s: any) => [s.id, s.title as string]));
  const userMap = new Map((users ?? []).map((u: any) => [u.id, u.full_name as string]));
  const avatarMap = new Map((users ?? []).map((u: any) => [u.id, u.avatar_url as string | null]));
  const phoneMap = new Map((privates ?? []).map((p: any) => [p.user_id, p.phone as string]));

  return rows.map((r) => {
    const counterpartId = r.customer_id === viewerId ? r.provider_id : r.customer_id;
    return {
      ...r,
      serviceTitle: r.service_id ? serviceMap.get(r.service_id) ?? null : null,
      counterpartId,
      counterpartName: counterpartId ? userMap.get(counterpartId) ?? null : null,
      counterpartAvatar: counterpartId ? avatarMap.get(counterpartId) ?? null : null,
      counterpartPhone: counterpartId ? phoneMap.get(counterpartId) ?? null : null,
    };
  });
}

export async function fetchConversationOrders(
  scope: 'all' | 'customer' | 'provider' = 'all'
): Promise<ConversationOrder[]> {
  const viewer = await me();
  if (!viewer) return [];
  let query = supabase.from('orders').select('*');
  if (scope === 'customer') query = query.eq('customer_id', viewer);
  else if (scope === 'provider') query = query.eq('provider_id', viewer);
  else query = query.or(`customer_id.eq.${viewer},provider_id.eq.${viewer}`);

  const { data, error } = await query.order('created_at', { ascending: false });
  fail(error, 'অর্ডার লোড করা যায়নি');
  return enrichOrders((data as OrderRow[]) ?? [], viewer);
}

export interface ReviewRow {
  id: string;
  order_id: string;
  customer_id: string;
  provider_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export async function submitReview(orderId: string, rating: number, comment: string): Promise<void> {
  const { error } = await supabase.rpc('submit_review', {
    p_order_id: orderId,
    p_rating: rating,
    p_comment: comment,
  });
  fail(error, 'রিভিউ দেওয়া যায়নি');
}

/** Completed customer orders that have not been reviewed yet */
export async function fetchReviewableOrders(): Promise<ConversationOrder[]> {
  const rows = await fetchConversationOrders('customer');
  const completed = rows.filter((r) => r.status === 'completed');
  if (completed.length === 0) return [];
  const { data } = await supabase
    .from('reviews')
    .select('order_id')
    .in('order_id', completed.map((r) => r.id));
  const reviewed = new Set((data ?? []).map((r: any) => r.order_id as string));
  return completed.filter((r) => !reviewed.has(r.id));
}

export async function fetchReviewsForProvider(providerId: string): Promise<ReviewRow[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });
  fail(error, 'রিভিউ লোড করা যায়নি');
  return (data as ReviewRow[]) ?? [];
}

export interface ProviderRating {
  provider_id: string;
  avg: number;
  count: number;
}

/** Real aggregated ratings from the reviews table (no hardcoded 5 stars). */
export async function fetchProviderRatings(): Promise<Record<string, ProviderRating>> {
  const { data, error } = await supabase.from('reviews').select('provider_id, rating');
  fail(error, 'রেটিং লোড করা যায়নি');
  const acc: Record<string, { sum: number; count: number }> = {};
  (data ?? []).forEach((r: any) => {
    const key = r.provider_id as string;
    if (!acc[key]) acc[key] = { sum: 0, count: 0 };
    acc[key].sum += Number(r.rating);
    acc[key].count += 1;
  });
  const out: Record<string, ProviderRating> = {};
  Object.entries(acc).forEach(([key, v]) => {
    out[key] = { provider_id: key, avg: v.sum / v.count, count: v.count };
  });
  return out;
}

/** Upload a profile photo to the public `avatars` bucket and save the URL. */
export async function saveAvatar(file: File): Promise<string> {
  const id = await me();
  if (!id) throw new Error('ছবি আপলোডের জন্য লগইন প্রয়োজন');
  const ext = (file.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '').slice(0, 5) || 'jpg';
  const path = `${id}/avatar-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { contentType: file.type, upsert: false });
  fail(uploadError, 'প্রোফাইল ছবি আপলোড করা যায়নি');

  const url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;

  const { error } = await supabase
    .from('users')
    .update({ avatar_url: url })
    .eq('id', id);
  fail(error, 'প্রোফাইল ছবি সংরক্ষণ করা যায়নি');
  return url;
}

/** Remove the current photo (DB reference only; old file can be cleaned later). */
export async function clearAvatar(): Promise<void> {
  const id = await me();
  if (!id) return;
  const { error } = await supabase.from('users').update({ avatar_url: null }).eq('id', id);
  fail(error, 'ছবি সরানো যায়নি');
}

/* ========================================================================== */
/* PROVIDER SELF-SERVICE — service listings                                   */
/* ========================================================================== */

export async function fetchMyServices(): Promise<ServiceRow[]> {
  const id = await me();
  if (!id) return [];
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('provider_id', id)
    .order('created_at', { ascending: false });
  fail(error, 'আপনার সেবা লোড করা যায়নি');
  return (data as ServiceRow[]) ?? [];
}

export interface ServiceInput {
  title: string;
  description: string;
  category: Category;
  price: number;
  priceUnit: 'job' | 'hour' | 'day';
  area: string;
  isNationwide: boolean;
  securityDeposit: number;
  responseMinutes: number;
}

export async function createService(input: ServiceInput): Promise<void> {
  const id = await me();
  if (!id) throw new Error('লগইন প্রয়োজন');
  const { error } = await supabase.from('services').insert({
    provider_id: id,
    category: input.category,
    title: input.title.trim(),
    description: input.description.trim(),
    price: input.price,
    price_unit: input.priceUnit,
    area: input.isNationwide ? null : input.area,
    is_nationwide: input.isNationwide,
    security_deposit: input.securityDeposit,
    response_minutes: input.responseMinutes,
    is_active: true,
  });
  fail(error, 'সেবা যোগ করা যায়নি');
}

export async function updateService(serviceId: string, patch: Partial<ServiceInput> & { isActive?: boolean }): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) dbPatch.title = patch.title.trim();
  if (patch.description !== undefined) dbPatch.description = patch.description.trim();
  if (patch.price !== undefined) dbPatch.price = patch.price;
  if (patch.priceUnit !== undefined) dbPatch.price_unit = patch.priceUnit;
  if (patch.area !== undefined) dbPatch.area = patch.isNationwide ? null : patch.area;
  if (patch.isNationwide !== undefined) dbPatch.is_nationwide = patch.isNationwide;
  if (patch.securityDeposit !== undefined) dbPatch.security_deposit = patch.securityDeposit;
  if (patch.responseMinutes !== undefined) dbPatch.response_minutes = patch.responseMinutes;
  if (patch.isActive !== undefined) dbPatch.is_active = patch.isActive;
  const { error } = await supabase.from('services').update(dbPatch).eq('id', serviceId);
  fail(error, 'সেবা আপডেট করা যায়নি');
}

export async function deleteService(serviceId: string): Promise<void> {
  const { error } = await supabase.from('services').delete().eq('id', serviceId);
  fail(error, 'সেবা মুছে ফেলা যায়নি');
}

/* ========================================================================== */
/* COMMISSION + PAYOUT LEDGER                                                 */
/* ========================================================================== */

export interface PayoutRow {
  id: string;
  order_id: string;
  provider_id: string;
  commission_amount: number;
  payout_amount: number;
  trx_id: string | null;
  status: 'pending' | 'paid';
  paid_at: string | null;
  note: string | null;
  created_at: string;
}

export interface PayoutView extends PayoutRow {
  providerName: string | null;
  serviceTitle: string | null;
  depositAmount: number;
  depositRefunded: boolean;
  depositReturnStatus: string | null;
  category: Category | null;
}

/** Admin ledger: every completed job's provider payment + commission. */
export async function fetchPayouts(): Promise<PayoutView[]> {
  const { data, error } = await supabase
    .from('payouts')
    .select('*')
    .order('status', { ascending: true })
    .order('created_at', { ascending: true });
  fail(error, 'পেমেন্ট লেডার লোড করা যায়নি');
  const rows = (data as PayoutRow[]) ?? [];
  if (rows.length === 0) return [];

  const orderIds = rows.map((r) => r.order_id);
  const providerIds = Array.from(new Set(rows.map((r) => r.provider_id)));
  const [{ data: orders }, { data: providers }] = await Promise.all([
    supabase.from('orders').select('id, deposit_amount, deposit_refunded, deposit_return_status, service_id, category').in('id', orderIds),
    supabase.from('users').select('id, full_name').in('id', providerIds),
  ]);
  const orderMap = new Map((orders ?? []).map((o: any) => [o.id, o]));
  const providerMap = new Map((providers ?? []).map((u: any) => [u.id, u.full_name as string]));
  const serviceIds = Array.from(new Set((orders ?? []).map((o: any) => o.service_id).filter(Boolean)));
  const { data: services } = serviceIds.length
    ? await supabase.from('services').select('id, title').in('id', serviceIds)
    : { data: [] as any[] };
  const serviceMap = new Map((services ?? []).map((s: any) => [s.id, s.title as string]));

  return rows.map((r) => {
    const o = orderMap.get(r.order_id) as any;
    return {
      ...r,
      providerName: providerMap.get(r.provider_id) ?? null,
      serviceTitle: o?.service_id ? serviceMap.get(o.service_id) ?? null : null,
      depositAmount: Number(o?.deposit_amount ?? 0),
      depositRefunded: Boolean(o?.deposit_refunded),
      depositReturnStatus: (o?.deposit_return_status as string) ?? null,
      category: (o?.category as Category) ?? null,
    };
  });
}

export async function recordPayout(orderId: string, trxId: string, note?: string): Promise<void> {
  const { error } = await supabase.rpc('record_payout', {
    p_order_id: orderId,
    p_trx_id: trxId,
    p_note: note ?? null,
  });
  fail(error, 'প্রোভাইডার পেমেন্ট রেকর্ড করা যায়নি');
}

export async function recordDepositRefund(orderId: string, trxId: string): Promise<void> {
  const { error } = await supabase.rpc('record_deposit_refund', {
    p_order_id: orderId,
    p_trx_id: trxId,
  });
  fail(error, 'জামানত ফেরত রেকর্ড করা যায়নি');
}

/* ========================================================================== */
/* CUSTOMER DASHBOARD — saved addresses + deposit return                      */
/* ========================================================================== */

export interface SavedAddress {
  id: string;
  user_id: string;
  label: string;
  street: string;
  city: string;
  zip: string;
  notes: string | null;
  is_default: boolean;
}

export async function fetchSavedAddresses(): Promise<SavedAddress[]> {
  const id = await me();
  if (!id) return [];
  const { data, error } = await supabase
    .from('saved_addresses')
    .select('*')
    .eq('user_id', id)
    .order('is_default', { ascending: false });
  fail(error, 'ঠিকানা লোড করা যায়নি');
  return (data as SavedAddress[]) ?? [];
}

export async function addSavedAddress(input: {
  label: string; street: string; city: string; zip: string; notes?: string; isDefault: boolean;
}): Promise<void> {
  const id = await me();
  if (!id) throw new Error('লগইন প্রয়োজন');
  const { error } = await supabase.from('saved_addresses').insert({
    user_id: id,
    label: input.label.trim(),
    street: input.street.trim(),
    city: input.city.trim(),
    zip: input.zip.trim(),
    notes: input.notes || null,
    is_default: input.isDefault,
  });
  fail(error, 'ঠিকানা যোগ করা যায়নি');
}

export async function deleteSavedAddress(addressId: string): Promise<void> {
  const { error } = await supabase.from('saved_addresses').delete().eq('id', addressId);
  fail(error, 'ঠিকানা মুছে ফেলা যায়নি');
}

export async function setDefaultSavedAddress(addressId: string): Promise<void> {
  const id = await me();
  if (!id) return;
  await supabase.from('saved_addresses').update({ is_default: false }).eq('user_id', id);
  const { error } = await supabase.from('saved_addresses').update({ is_default: true }).eq('id', addressId);
  fail(error, 'ডিফল্ট ঠিকানা সেট করা যায়নি');
}

export async function confirmToolReturn(
  orderId: string,
  condition: 'clean' | 'damaged',
  note?: string
): Promise<void> {
  const { error } = await supabase.rpc('customer_confirm_tool_return', {
    p_order_id: orderId,
    p_condition: condition,
    p_note: note ?? null,
  });
  fail(error, 'ফেরত নিশ্চিত করা যায়নি');
}

/* ========================================================================== */
/* STEP 5 — REALTIME NOTIFICATIONS                                            */
/* ========================================================================== */

export async function fetchNotifications(limit = 40): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  fail(error, 'নোটিফিকেশন লোড করা যায়নি');
  return (data as NotificationRow[]) ?? [];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);
  fail(error, 'নোটিফিকেশন আপডেট করা যায়নি');
}

export async function markAllNotificationsRead(): Promise<void> {
  const id = await me();
  if (!id) return;
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', id)
    .eq('is_read', false);
  fail(error, 'নোটিফিকেশন আপডেট করা যায়নি');
}

/** Signed URL for a private NID photo (legacy full URLs pass through). */
export async function signedNidUrl(pathOrUrl: string | null): Promise<string | null> {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  const { data, error } = await supabase.storage
    .from('nid-documents')
    .createSignedUrl(pathOrUrl, 60 * 60);
  return error ? null : data?.signedUrl ?? null;
}
