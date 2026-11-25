/**
 * dorymo — Signup / login gate.
 *
 * Psychology: customers are told they are approved INSTANTLY (zero friction),
 * providers are told exactly what happens next (NID check -> approval), and
 * every sensitive step carries a trust reassurance line.
 * Bilingual labels throughout (Bangla primary, English secondary).
 */
import React, { useEffect, useState } from 'react';
import { BadgeCheck, Camera, CheckCircle2, Clock, Eye, EyeOff, FileCheck2, Lock, Mail, Phone, ShieldCheck, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { captureNidPhoto, isNativeApp } from '../lib/nativeCamera';
import { useMaster } from '../context/MasterContext';
import { fetchMyProfile, type Category } from '../lib/masterDb';
import { cn } from '../lib/utils';
import { Button, Field, Modal, Select } from './ui';

const AREAS = ['Sonadanga', 'Khalishpur', 'Shib Bari', 'Nirala', 'অন্যান্য / Other'];

function friendlyAuthError(err: any): string {
  const m = String(err?.message || '').toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email or password is wrong. Please try again.';
  if (m.includes('email not confirmed')) return 'This email is not verified yet. Check your inbox — or turn OFF "Confirm email" in Supabase → Authentication → Providers → Email.';
  if (m.includes('user not found') || m.includes('unable to validate')) return 'No account found with this email. Please sign up first.';
  if (m.includes('too many requests') || m.includes('rate limit')) return 'Too many attempts. Wait a minute and try again.';
  if (m.includes('failed to fetch') || m.includes('network') || m.includes('load failed')) return 'Cannot reach the server. Check your internet or Supabase keys in .env.';
  return err?.message || 'Could not complete. Check your details and try again.';
}

const Bi: React.FC<{ bn: string; en: string }> = ({ bn, en }) => (
  <span>{bn}<span className="ml-1.5 text-[10px] font-normal text-zinc-500">· {en}</span></span>
);

export const SignUpModal: React.FC = () => {
  const {
    signupOpen, signupMode, closeSignup, signUp, showToast, refreshProfile,
    goAdmin, goProviderJobs, goExplore, goHome,
  } = useMaster();

  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const [busy, setBusy] = useState(false);

  const [successInfo, setSuccessInfo] = useState<{
    type: 'login' | 'signup';
    email: string;
    name?: string;
    role?: string;
    status?: string;
  } | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [skill, setSkill] = useState('');
  const [category, setCategory] = useState<Category>('home_repair');
  const [area, setArea] = useState('Sonadanga');
  const [nidNumber, setNidNumber] = useState('');
  const [nidFile, setNidFile] = useState<File | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (signupOpen) {
      setMode(signupMode);
      setSuccessInfo(null);
      setNotice(null);
    }
  }, [signupOpen, signupMode]);

  const handleClose = () => {
    setSuccessInfo(null);
    closeSignup();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) {
          console.error('[dorymo] login error:', error);
          showToast(friendlyAuthError(error), 'error');
          return;
        }
        console.info('[dorymo] logged in:', data.user?.email);
        setConfirmPassword('');
        await refreshProfile();
        const myProfile = await fetchMyProfile();
        showToast('স্বাগতম ফিরে!', 'success');
        setSuccessInfo({
          type: 'login',
          email: data.user?.email || email,
          name: myProfile?.full_name || data.user?.user_metadata?.full_name || email.split('@')[0],
          role: myProfile?.role || 'customer',
          status: myProfile?.account_status || 'APPROVED',
        });
      } else {
        if (password !== confirmPassword) {
          showToast('পাসওয়ার্ড দুটি মিলছে না।', 'error');
          return;
        }
        const result = await signUp({
          name, email, phone, password, role,
          area: role === 'provider' && category !== 'digital_gig' ? area : '',
          serviceSkill: role === 'provider' ? skill : '',
          category,
          nidNumber,
          nidFile: role === 'provider' ? nidFile : null,
        });
        if (!result) return;
        if (result.needsConfirmation) {
          setNotice('ইমেইল যাচাইকরণ চালু আছে — ইনবক্সে পাঠানো লিংকে ক্লিক করে লগইন করুন।');
          setSuccessInfo({
            type: 'signup',
            email,
            name,
            role,
            status: 'PENDING_CONFIRMATION',
          });
        } else {
          await refreshProfile();
          const myProfile = await fetchMyProfile();
          setSuccessInfo({
            type: 'signup',
            email,
            name: myProfile?.full_name || name,
            role: myProfile?.role || role,
            status: myProfile?.account_status || (role === 'customer' ? 'APPROVED' : 'PENDING'),
          });
        }
      }
    } catch (err: any) {
      console.error('[dorymo] auth error:', err);
      showToast(friendlyAuthError(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const cleanPhone = phone.replace(/[\s-]/g, '').replace(/^\+?880/, '');
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const phoneOk = /^01[3-9]\d{8}$/.test(cleanPhone);
  const nameOk = name.trim().length >= 2;
  const passwordOk = password.length >= 6;
  const confirmOk = confirmPassword.length >= 6 && confirmPassword === password;
  const skillOk = skill.trim().length > 0;
  const nidNumberOk = nidNumber.trim().length > 0;

  return (
    <Modal
      open={signupOpen}
      onClose={handleClose}
      size="md"
      title={
        successInfo
          ? successInfo.type === 'login'
            ? 'লগইন সফল হয়েছে · Login Successful'
            : 'অ্যাকাউন্ট তৈরি হয়েছে · Sign Up Successful'
          : mode === 'signup'
          ? 'dorymo-তে যোগ দিন'
          : 'স্বাগতম ফিরে'
      }
      description={
        successInfo
          ? 'আপনার অ্যাকাউন্ট বিবরণ ও নিয়ন্ত্রণ নিচে দেওয়া হলো।'
          : mode === 'signup'
          ? role === 'customer'
            ? 'নাম, ইমেইল ও ফোন দিলেই অ্যাকাউন্ট তৈরি — কোনো অপেক্ষা নেই।'
            : 'NID দিয়ে যোগ দিন। আমি যাচাই করে অনুমোদন করলে কাজ পাবেন।'
          : 'আপনার ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন।'
      }
    >
      {successInfo ? (
        <div className="py-2 text-center animate-fade-in">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-8 ring-emerald-500/10">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <h3 className="mt-4 font-display text-xl text-white">
            {successInfo.type === 'login' ? 'স্বাগতম ফিরে!' : 'স্বাগতম dorymo-তে!'}
          </h3>
          <p className="mt-1 text-sm text-zinc-400">
            {successInfo.name ? <span className="font-medium text-zinc-200">{successInfo.name}</span> : null}
            {successInfo.name ? ' · ' : ''}
            <span className="text-zinc-400">{successInfo.email}</span>
          </p>

          <div className="mt-5 rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-left">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <span className="text-[12px] text-zinc-400">ভূমিকা · Current Role</span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-semibold',
                  successInfo.role === 'admin'
                    ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                    : successInfo.role === 'provider'
                    ? 'border border-sky-500/30 bg-sky-500/15 text-sky-300'
                    : 'border border-orange-500/30 bg-orange-500/15 text-orange-300'
                )}
              >
                {successInfo.role === 'admin' && '👑 Founder / অ্যাডমিন'}
                {successInfo.role === 'provider' && '🛠️ প্রোভাইডার · Provider'}
                {successInfo.role === 'customer' && '👤 গ্রাহক · Customer'}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[12px] text-zinc-400">অ্যাকাউন্ট স্ট্যাটাস · Status</span>
              <span
                className={cn(
                  'text-[12px] font-medium',
                  successInfo.status === 'APPROVED' ? 'text-emerald-400' : 'text-amber-400'
                )}
              >
                {successInfo.status === 'APPROVED'
                  ? '● সক্রিয় / অনুমোদিত · Active'
                  : successInfo.status === 'PENDING_CONFIRMATION'
                  ? '○ ইমেইল নিশ্চিতকরণ প্রয়োজন'
                  : '⏳ NID অনুমোদন অপেক্ষমাণ · Pending Review'}
              </span>
            </div>

            {successInfo.role === 'admin' && (
              <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-950/40 p-3 text-[12px] text-emerald-200">
                <p className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Founder Console অ্যাক্সেস সক্রিয়
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-emerald-300/80">
                  আপনি এখন প্ল্যাটফর্মের সকল কাস্টমার পেমেন্ট যাচাই এবং প্রোভাইডার কেওয়াইসি অনুমোদন করতে পারবেন।
                </p>
              </div>
            )}

            {successInfo.role === 'provider' && successInfo.status !== 'APPROVED' && (
              <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-950/40 p-3 text-[12px] text-amber-200">
                <p className="flex items-center gap-1.5 font-semibold">
                  <Clock className="h-4 w-4 text-amber-400" />
                  NID যাচাই প্রক্রিয়াধীন
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-amber-300/80">
                  অ্যাডমিন আপনার NID যাচাই করে অনুমোদন দিলে সাথে সাথে কাজ গ্রহণ করতে পারবেন।
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-2">
            {successInfo.role === 'admin' && (
              <Button
                size="lg"
                fullWidth
                onClick={() => {
                  handleClose();
                  goAdmin();
                }}
                className="bg-emerald-500 font-semibold text-black hover:bg-emerald-400"
              >
                <ShieldCheck className="mr-1.5 h-4 w-4" /> Founder Console-এ যান · Go to Admin Panel
              </Button>
            )}

            {successInfo.role === 'provider' && (
              <Button
                size="lg"
                fullWidth
                onClick={() => {
                  handleClose();
                  goProviderJobs();
                }}
              >
                কাজ দেখুন · View Jobs
              </Button>
            )}

            {successInfo.role === 'customer' && (
              <Button
                size="lg"
                fullWidth
                onClick={() => {
                  handleClose();
                  goExplore();
                }}
              >
                সেবা খুঁজুন · Explore Services
              </Button>
            )}

            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                handleClose();
                goHome();
              }}
            >
              হোমপেজে যান · Continue to Homepage
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* mode switch */}
          <div className="mb-5 flex rounded-xl border border-white/10 bg-zinc-950/60 p-1">
            {(['signup', 'login'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setNotice(null); }}
                className={cn(
                  'flex-1 rounded-lg py-2 text-[13px] font-medium transition-colors',
                  mode === m ? 'bg-orange-500 text-black' : 'text-zinc-400 hover:text-white'
                )}
              >
                {m === 'signup' ? 'নতুন অ্যাকাউন্ট · Sign up' : 'লগইন · Log in'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <>
            {/* Role cards */}
            <div>
              <p className="mb-2 text-[12.5px] font-medium text-zinc-300">
                <Bi bn="আপনি কে?" en="Who are you?" />
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={cn(
                    'rounded-xl border p-3 text-left transition-all',
                    role === 'customer' ? 'border-orange-500/60 bg-orange-500/[0.08]' : 'border-white/10 hover:border-white/20'
                  )}
                >
                  <User className={cn('h-4 w-4', role === 'customer' ? 'text-orange-400' : 'text-zinc-500')} />
                  <p className="mt-1.5 text-[13px] font-medium text-white">গ্রাহক · Customer</p>
                  <p className="mt-0.5 text-[10.5px] leading-tight text-emerald-400">Instant approved · সাথে সাথে শুরু করুন</p>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('provider')}
                  className={cn(
                    'rounded-xl border p-3 text-left transition-all',
                    role === 'provider' ? 'border-orange-500/60 bg-orange-500/[0.08]' : 'border-white/10 hover:border-white/20'
                  )}
                >
                  <FileCheck2 className={cn('h-4 w-4', role === 'provider' ? 'text-orange-400' : 'text-zinc-500')} />
                  <p className="mt-1.5 text-[13px] font-medium text-white">প্রোভাইডার · Provider</p>
                  <p className="mt-0.5 text-[10.5px] leading-tight text-zinc-500">NID check · ১ দিনে অনুমোদন</p>
                </button>
              </div>
            </div>

            <Field label="পুরো নাম · Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="আপনার নাম" valid={nameOk} />
          </>
        )}

        <Field
          label="ইমেইল · Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          valid={emailOk}
        />
        <Field
          label="মোবাইল নম্বর · Phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="01712345678"
          valid={phoneOk}
        />
        <div className="relative">
          <Field
            label="পাসওয়ার্ড · Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'login' ? 'password' : 'কমপক্ষে ৬ অক্ষর'}
            valid={mode === 'login' ? password.length > 0 : passwordOk}
            className={password.length > 0 ? 'pr-16' : 'pr-11'}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-10 top-[34px] rounded-md p-1 text-zinc-500 transition-colors hover:text-white"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {mode === 'signup' && (
          <div className="relative">
            <Field
              label="কনফার্ম পাসওয়ার্ড · Confirm password"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="পাসওয়ার্ড আবার লিখুন"
              valid={confirmOk}
              className={confirmPassword.length > 0 ? 'pr-16' : 'pr-11'}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              className="absolute right-10 top-[34px] rounded-md p-1 text-zinc-500 transition-colors hover:text-white"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        )}

        {mode === 'signup' && role === 'provider' && (
          <div className="space-y-4 rounded-xl border border-white/[0.07] bg-zinc-950/40 p-4">
            <p className="flex items-center gap-2 text-[12.5px] font-medium text-orange-300">
              <BadgeCheck className="h-4 w-4" />
              <Bi bn="প্রোভাইডার তথ্য (আবশ্যক)" en="Provider details (required)" />
            </p>
            <p className="text-[10.5px] leading-relaxed text-zinc-500">
              প্রোভাইডার হিসেবে নিবন্ধনের জন্য কাজের ধরন, এলাকা, NID নম্বর ও NID ছবি আবশ্যক। আমি যাচাই করে অনুমোদন করব।
            </p>

            <Field
              label="কাজের ধরন · Service skill *"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="যেমন: ইলেকট্রিশিয়ান / Web Developer"
              valid={skillOk}
            />

            <Select label="সেবার ধরন · Category" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              <option value="home_repair">বাসার মেরামত · Home Repair (Hyper-local)</option>
              <option value="equipment_rental">যন্ত্রপাতি ভাড়া · Equipment Rental</option>
              <option value="digital_gig">ডিজিটাল কাজ · Digital Work (Nationwide)</option>
            </Select>

            {category !== 'digital_gig' && (
              <Select label="আপনার এলাকা · Your thana/area" value={area} onChange={(e) => setArea(e.target.value)}>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </Select>
            )}

            <Field
              label="NID নম্বর · NID number *"
              value={nidNumber}
              onChange={(e) => setNidNumber(e.target.value)}
              placeholder="১০ বা ১৭ ডিজিট"
              valid={nidNumberOk}
            />

            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-zinc-300">
                <Bi bn="NID ছবি আপলোড *" en="Upload NID photo (required)" />
                {nidFile && <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 animate-fade-in"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg></span>}
              </label>
              <button
                type="button"
                onClick={async () => {
                  const shot = await captureNidPhoto();
                  if (shot) setNidFile(shot);
                }}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/15 bg-zinc-950/60 px-3.5 py-3 text-left hover:border-orange-500/40"
              >
                <Camera className="h-5 w-5 shrink-0 text-zinc-500" />
                <span className="min-w-0 text-[12px] text-zinc-400">
                  {nidFile ? (
                    <span className="truncate text-orange-300">{nidFile.name}</span>
                  ) : isNativeApp ? (
                    'ক্যামেরা বা গ্যালারি থেকে NID তুলুন · Take / choose photo'
                  ) : (
                    'JPG/PNG ছবি বেছে নিন · Choose a photo'
                  )}
                </span>
                {isNativeApp && <input type="file" accept="image/*" className="hidden" />}
              </button>
              {!isNativeApp && (
                <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[11.5px] text-zinc-400 hover:border-orange-500/40">
                  <Camera className="h-3.5 w-3.5" /> অথবা ফাইল থেকে বেছে নিন · Or pick a file
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setNidFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
              <p className="mt-1.5 flex items-center gap-1 text-[10.5px] text-zinc-600">
                <ShieldCheck className="h-3 w-3" /> ছবি শুধু আপনি ও অ্যাডমিন দেখতে পারবেন — private storage-এ রাখা হয়।
              </p>
            </div>
          </div>
        )}

        {notice && (
          <p className="rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2 text-[11.5px] text-amber-200">
            {notice}
          </p>
        )}

        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] px-3 py-2 text-[11px] text-emerald-300">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <Bi bn="গড় সাড়া ৯০ মিনিট · কোনো লুকোনো ফি নেই" en="Avg response 90 mins · No hidden fees" />
        </div>

        <Button type="submit" fullWidth size="lg" loading={busy}>
          {mode === 'login'
            ? 'লগইন করুন · Log in'
            : role === 'provider'
              ? 'নিবন্ধন করুন · Register as provider'
              : 'বিনা অপেক্ষায় শুরু করুন · Start now'}
        </Button>

        {mode === 'signup' && (
          <p className="flex items-center justify-center gap-1.5 text-center text-[10.5px] text-zinc-600">
            <Lock className="h-3 w-3" /> আপনার তথ্য এনক্রিপ্টেড ও RLS দ্বারা সুরক্ষিত।
          </p>
        )}
      </form>
      </>
      )}
    </Modal>
  );
};

export default SignUpModal;
