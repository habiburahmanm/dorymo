import React, { useState } from 'react';
import { useEcosystem, SANDBOX_ACCOUNTS } from '../context/EcosystemContext';
import {
  User,
  Briefcase,
  Lock,
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  Wrench,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';

export const AuthGateModal: React.FC = () => {
  const {
    activeAuthGate,
    closeAuthGate,
    loginAsAccount,
    loginCustomerSandbox,
    loginProviderSandbox,
    loginAdminPin,
    signupCustomer,
    signupProvider,
  } = useEcosystem();

  const [authMode, setAuthMode] = useState<'sandbox' | 'login' | 'register'>('sandbox');

  // Customer Form State
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('+880 1712-');

  // Provider Form State
  const [provName, setProvName] = useState('');
  const [provEmail, setProvEmail] = useState('');
  const [provPhone, setProvPhone] = useState('+880 1711-');
  const [provTrade, setProvTrade] = useState('Master Licensed Electrician');

  // Admin PIN State
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState(false);

  if (!activeAuthGate) return null;

  const handleManualCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'register') {
      if (!custName.trim() || !custEmail.trim()) return;
      signupCustomer(custName.trim(), custEmail.trim(), custPhone.trim());
    } else {
      // Mock login with provided email
      signupCustomer(custEmail.split('@')[0] || 'Customer User', custEmail || 'customer@nexserve.internal', custPhone);
    }
  };

  const handleManualProviderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'register') {
      if (!provName.trim() || !provEmail.trim()) return;
      signupProvider(provName.trim(), provEmail.trim(), provPhone.trim(), provTrade.trim());
    } else {
      signupProvider(provName.trim() || 'Contractor Trade', provEmail || 'provider@nexserve.internal', provPhone, provTrade);
    }
  };

  const handleAdminPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = loginAdminPin(adminPin.trim());
    if (!success) {
      setPinError(true);
      setTimeout(() => setPinError(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-zinc-950 p-6 shadow-2xl shadow-black/90 space-y-5">
        {/* Close Button */}
        <button
          onClick={closeAuthGate}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* 1. CUSTOMER AUTH GATE */}
        {activeAuthGate === 'customer' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-400">
                <User className="h-5 w-5" />
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-orange-400">
                  /portal/customer // AUTH GATE
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight">Customer Requester Portal</h3>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Sign in to post repair or digital requirements, monitor admin triage, assign interested contractors, and release escrow upon inspecting proof-of-work.
            </p>

            {/* Mode Switcher */}
            <div className="flex rounded-lg border border-white/10 bg-zinc-900 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setAuthMode('sandbox')}
                className={cn(
                  'flex-1 rounded-md py-1.5 font-medium transition-all text-center',
                  authMode === 'sandbox' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                ⚡ 1-Click Sandbox
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={cn(
                  'flex-1 rounded-md py-1.5 font-medium transition-all text-center',
                  authMode === 'register' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                Sign Up / Register
              </button>
            </div>

            {authMode === 'sandbox' ? (
              <div className="space-y-2.5 pt-1">
                <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                  Select Verified Sandbox Profile:
                </span>
                {SANDBOX_ACCOUNTS.customer.map((acc, idx) => (
                  <button
                    key={acc.id}
                    onClick={() => loginCustomerSandbox(idx)}
                    className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-left hover:border-orange-500/50 hover:bg-zinc-900 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <img src={acc.avatar} alt={acc.name} className="h-9 w-9 rounded-full object-cover border border-white/10" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                          {acc.name}
                        </div>
                        <div className="text-[11px] text-zinc-400">{acc.phone} • {acc.email}</div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            ) : (
              <form onSubmit={handleManualCustomerSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marcus Vance"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@workplace.com"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Mobile Phone (BDT / +880)</label>
                  <input
                    type="tel"
                    required
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-orange-500 py-2.5 text-xs font-bold text-black hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20"
                >
                  Create Account & Enter Customer Hub
                </button>
              </form>
            )}
          </div>
        )}

        {/* 2. PROVIDER AUTH GATE */}
        {activeAuthGate === 'provider' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-blue-400">
                  /portal/provider // AUTH GATE
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight">Provider Studio & Terminal</h3>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Sign in with your contractor credentials to browse admin-approved lead requests, express job interest, and submit deliverables for escrow disbursement.
            </p>

            {/* Mode Switcher */}
            <div className="flex rounded-lg border border-white/10 bg-zinc-900 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setAuthMode('sandbox')}
                className={cn(
                  'flex-1 rounded-md py-1.5 font-medium transition-all text-center',
                  authMode === 'sandbox' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                ⚡ 1-Click Sandbox
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={cn(
                  'flex-1 rounded-md py-1.5 font-medium transition-all text-center',
                  authMode === 'register' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                Contractor Registration
              </button>
            </div>

            {authMode === 'sandbox' ? (
              <div className="space-y-2.5 pt-1">
                <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                  Select Bonded Contractor Account:
                </span>
                {SANDBOX_ACCOUNTS.provider.map((acc, idx) => (
                  <button
                    key={acc.id}
                    onClick={() => loginProviderSandbox(idx)}
                    className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-left hover:border-blue-500/50 hover:bg-zinc-900 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <img src={acc.avatar} alt={acc.name} className="h-9 w-9 rounded-full object-cover border border-white/10" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                          <span>{acc.name}</span>
                          <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-mono text-emerald-400 border border-emerald-500/20">
                            ★ {acc.rating}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400">{acc.tradeTitle}</div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            ) : (
              <form onSubmit={handleManualProviderSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Contractor / Business Entity Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vance Engineering & Logistics LLC"
                    value={provName}
                    onChange={(e) => setProvName(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Trade Title & Primary Specialty</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Licensed Electrician // High-Voltage Specialist"
                    value={provTrade}
                    onChange={(e) => setProvTrade(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Business Email</label>
                    <input
                      type="email"
                      required
                      placeholder="contractor@trade.com"
                      value={provEmail}
                      onChange={(e) => setProvEmail(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Phone</label>
                    <input
                      type="tel"
                      required
                      value={provPhone}
                      onChange={(e) => setProvPhone(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                >
                  Register Provider & Enter Terminal
                </button>
              </form>
            )}
          </div>
        )}

        {/* 3. ADMIN AUTH GATE */}
        {activeAuthGate === 'admin' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-amber-400">
                  #admin-terminal // SECRET ELEVATION GATE
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight">Admin Triage Gatekeeper</h3>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Elevated access for platform moderators. Authorize triage audits, adjust budgets, and arbitrate escrow disputes.
            </p>

            <form onSubmit={handleAdminPinSubmit} className="space-y-3 pt-2">
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                  Security PIN / Passkey (Default demo: <code className="text-amber-400 font-mono font-bold">2026</code>)
                </label>
                <input
                  type="password"
                  autoFocus
                  required
                  placeholder="Enter 4-digit PIN or master key"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className={cn(
                    'w-full rounded-lg border bg-zinc-900 px-3 py-2.5 text-center text-sm font-mono tracking-widest text-white focus:outline-none transition-colors',
                    pinError ? 'border-red-500 ring-1 ring-red-500' : 'border-white/15 focus:border-amber-400'
                  )}
                />
                {pinError && (
                  <p className="mt-1 text-[11px] text-red-400 text-center">Invalid PIN. Please use: 2026</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-amber-500 py-2.5 text-xs font-bold text-black hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
              >
                Authenticate Dispatch Officer
              </button>
            </form>

            <div className="pt-2 border-t border-white/5 text-center">
              <button
                type="button"
                onClick={() => loginAdminPin('2026')}
                className="text-[11px] text-zinc-500 hover:text-amber-400 font-mono transition-colors"
              >
                ⚡ 1-Click Fast Pass-Through as Chief Dispatcher HQ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
