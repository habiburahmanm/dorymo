import React, { useState } from 'react';
import {
  Bell,
  Briefcase,
  ChevronDown,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  Star,
  Wallet,
  User,
  X,
} from 'lucide-react';
import { useMaster } from '../context/MasterContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { Button } from './ui';

const ROLE_LABEL: Record<string, string> = {
  customer: 'গ্রাহক',
  provider: 'প্রোভাইডার',
  admin: 'অ্যাডমিন',
};

export const Navbar: React.FC = () => {
  const {
    masterView, profile, goHome, goExplore, goHow, goPay, goProviderJobs,
    goChat, goReviews, goAdmin, goAccount, openSignup, openAvatar,
    notifications, unreadCount, markRead, markAllRead, realtimeConnected,
    refreshProfile,
  } = useMaster();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const close = () => { setMobileOpen(false); setMenuOpen(false); setNotifOpen(false); };

  const doLogout = async () => {
    await supabase.auth.signOut();
    await refreshProfile();
    close();
    goHome();
  };

  const DashboardIcon =
    profile?.role === 'provider' ? Briefcase : profile?.role === 'admin' ? ShieldCheck : LayoutDashboard;

  const openDashboard = () => {
    close();
    if (profile?.role === 'provider') goProviderJobs();
    else if (profile?.role === 'admin') goAdmin();
    else goAccount();
  };

  const navLink = (active: boolean) =>
    cn(
      'rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors',
      active ? 'bg-white/[0.07] text-white' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100'
    );

  const notifPanel = (
    <>
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div>
          <p className="text-[13px] font-semibold text-white">নোটিফিকেশন · Alerts</p>
          <p className="text-[10px] text-zinc-500">
            {realtimeConnected ? '● Live · instant updates' : '○ Reconnecting…'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={() => void markAllRead()} className="text-[11px] text-orange-400 hover:underline">
            Mark all read
          </button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="px-4 py-8 text-center text-[12px] text-zinc-500">কোনো নোটিফিকেশন নেই।</p>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                void markRead(n.id);
                close();
                if (n.link) window.location.hash = n.link;
              }}
              className={cn(
                'flex w-full gap-2.5 border-b border-white/[0.04] px-4 py-3 text-left transition-colors hover:bg-white/[0.03]',
                n.is_read ? 'opacity-60' : 'bg-orange-500/[0.04]'
              )}
            >
              <span className={cn('mt-1 h-1.5 w-1.5 shrink-0 rounded-full', n.is_read ? 'bg-zinc-600' : 'bg-orange-400')} />
              <span className="min-w-0">
                <span className="block text-[12.5px] font-medium text-white">{n.title}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-zinc-400">{n.body}</span>
              </span>
            </button>
          ))
        )}
      </div>
    </>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-[#09090b]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        {/* Brand */}
        <button onClick={() => { close(); goHome(); }} className="group flex shrink-0 items-center gap-2.5" aria-label="dorymo home">
          <img
            src={`${import.meta.env.BASE_URL}dorymo-icon.svg`}
            alt="dorymo"
            className="h-9 w-9 rounded-xl transition-transform group-hover:scale-105"
          />
          <span className="hidden text-[18px] font-bold tracking-tight text-white sm:block">dorymo</span>
        </button>

        {/* Desktop nav */}
        <nav className="ml-2 hidden items-center gap-0.5 lg:flex">
          <button onClick={() => { close(); goExplore(); }} className={navLink(masterView === 'explore')}>
            সেবা খুঁজুন
          </button>
          <button onClick={() => { close(); goHow(); }} className={navLink(masterView === 'how_it_works')}>
            কীভাবে কাজ করে
          </button>
          {profile?.role === 'provider' && (
            <button onClick={() => { close(); goProviderJobs(); }} className={navLink(masterView === 'provider_jobs')}>
              কাজ · Jobs
            </button>
          )}
          {profile && (
            <>
              {profile.role === 'customer' && (
                <button onClick={() => { close(); goAccount(); }} className={navLink(masterView === 'customer_dashboard')}>
                  অ্যাকাউন্ট · Account
                </button>
              )}
              <button onClick={() => { close(); goChat(); }} className={navLink(masterView === 'chat')}>
                মেসেজ · Chat
              </button>
              <button onClick={() => { close(); goReviews(); }} className={navLink(masterView === 'reviews')}>
                রিভিউ · Reviews
              </button>
            </>
          )}
          <button
            onClick={() => { close(); goPay(); }}
            className="rounded-lg px-3 py-2 text-[13.5px] font-medium text-orange-300 transition-colors hover:bg-orange-500/10"
          >
            বুক করুন · Pay
          </button>
          {profile?.role === 'admin' && (
            <button
              onClick={() => { close(); goAdmin(); }}
              className="rounded-lg px-3 py-2 text-[13.5px] font-medium text-emerald-300 transition-colors hover:bg-emerald-500/10"
            >
              Founder Console
            </button>
          )}
        </nav>

        <div className="flex-1" />

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          {profile && (
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-zinc-900/60 text-zinc-300 hover:border-white/20"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-black">
                    {unreadCount}
                  </span>
                )}
                <span className={cn('absolute bottom-0.5 right-0.5 h-1.5 w-1.5 rounded-full', realtimeConnected ? 'bg-emerald-400' : 'bg-zinc-600')} />
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-80 animate-fade-in overflow-hidden rounded-xl border border-white/10 bg-[#111114] shadow-2xl">
                    {notifPanel}
                  </div>
                </>
              )}
            </div>
          )}

          {profile ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-zinc-900/60 pl-1.5 pr-2.5 hover:border-white/20"
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-6 w-6 rounded-md object-cover" />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-500/15 text-[11px] font-bold text-orange-400">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="max-w-[92px] truncate text-[13px] font-medium text-zinc-200">{profile.full_name}</span>
                <ChevronDown className={cn('h-3.5 w-3.5 text-zinc-500 transition-transform', menuOpen && 'rotate-180')} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-56 animate-fade-in overflow-hidden rounded-xl border border-white/10 bg-[#111114] shadow-2xl">
                    <div className="border-b border-white/[0.06] px-4 py-3">
                      <p className="truncate text-[13px] font-semibold text-white">{profile.full_name}</p>
                      <p className="truncate text-[11.5px] text-zinc-500">{profile.email}</p>
                      <span className="mt-1.5 inline-flex rounded-md bg-orange-500/12 px-1.5 py-0.5 text-[10.5px] font-medium text-orange-300">
                        {ROLE_LABEL[profile.role] || profile.role}
                      </span>
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={() => { setMenuOpen(false); openAvatar(); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-zinc-300 hover:bg-white/5 hover:text-white"
                      >
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="h-4 w-4 rounded object-cover" />
                        ) : (
                          <LayoutDashboard className="h-4 w-4 text-zinc-500" />
                        )}
                        ছবি বদলান · Photo
                      </button>
                      <button onClick={openDashboard} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-zinc-300 hover:bg-white/5 hover:text-white">
                        <DashboardIcon className="h-4 w-4 text-zinc-500" /> আমার ড্যাশবোর্ড
                      </button>
                      <button onClick={() => { close(); goHome(); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-zinc-300 hover:bg-white/5 hover:text-white">
                        <Search className="h-4 w-4 text-zinc-500" /> হোমপেজে যান
                      </button>
                      <button onClick={() => void doLogout()} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-red-400 hover:bg-red-500/10">
                        <LogOut className="h-4 w-4" /> লগআউট
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={openSignup} className="h-9 rounded-lg px-3 text-[13px] font-medium text-zinc-300 hover:text-white">লগইন</button>
              <Button size="sm" onClick={openSignup}>শুরু করুন</Button>
            </div>
          )}
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-2 md:hidden">
          {profile && (
            <button onClick={() => setNotifOpen((v) => !v)} aria-label="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-zinc-900/60 text-zinc-300">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-orange-500 px-0.5 text-[9px] font-bold text-black">
                  {unreadCount}
                </span>
              )}
            </button>
          )}
          <button onClick={() => { close(); goPay(); }} aria-label="Pay" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-zinc-900/60 text-zinc-300">
            <Wallet className="h-4 w-4" />
          </button>
          <button onClick={() => setMobileOpen((v) => !v)} aria-label="Menu" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-zinc-900/60 text-zinc-300">
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="animate-fade-in border-t border-white/[0.07] bg-[#0c0c0f] px-4 py-4 md:hidden">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-600">সেবা</p>
          <div className="grid grid-cols-1 gap-1">
            <button onClick={() => { close(); goExplore(); }} className="rounded-lg bg-white/[0.04] px-3 py-2.5 text-left text-sm font-medium text-zinc-200">সেবা খুঁজুন</button>
            <button onClick={() => { close(); goHow(); }} className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-zinc-400">কীভাবে কাজ করে</button>
            {profile?.role === 'provider' && (
              <button onClick={() => { close(); goProviderJobs(); }} className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-emerald-300">কাজ · Jobs</button>
            )}
            {profile && (
              <>
                {profile.role === 'customer' && (
                  <button onClick={() => { close(); goAccount(); }} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-orange-300"><User className="h-4 w-4" /> অ্যাকাউন্ট · Account</button>
                )}
                <button onClick={() => { close(); goChat(); }} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-zinc-400"><MessageCircle className="h-4 w-4" /> মেসেজ · Chat</button>
                <button onClick={() => { close(); goReviews(); }} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-zinc-400"><Star className="h-4 w-4" /> রিভিউ · Reviews</button>
              </>
            )}
            {profile?.role === 'admin' && (
              <button onClick={() => { close(); goAdmin(); }} className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-emerald-300">Founder Console</button>
            )}
          </div>

          <div className="mt-4 border-t border-white/[0.06] pt-4">
            {profile ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-lg bg-white/[0.04] px-3 py-2.5">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/15 text-sm font-bold text-orange-400">
                      {profile.full_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{profile.full_name}</p>
                    <p className="truncate text-[11.5px] text-zinc-500">{profile.email}</p>
                  </div>
                </div>
                <button onClick={() => { close(); openAvatar(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-zinc-200">
                  <ImageIcon className="h-4 w-4" /> ছবি বদলান · Photo
                </button>
                <button onClick={openDashboard} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-zinc-200">
                  <DashboardIcon className="h-4 w-4" /> আমার ড্যাশবোর্ড
                </button>
                <button onClick={() => void doLogout()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-400">
                  <LogOut className="h-4 w-4" /> লগআউট
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" fullWidth onClick={() => { close(); openSignup(); }}>লগইন</Button>
                <Button fullWidth onClick={() => { close(); openSignup(); }}>প্রোভাইডার</Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile notification panel */}
      {notifOpen && profile && (
        <div className="absolute right-2 top-16 z-50 w-[calc(100%-1rem)] max-w-sm animate-fade-in overflow-hidden rounded-xl border border-white/10 bg-[#111114] shadow-2xl md:hidden">
          {notifPanel}
        </div>
      )}
    </header>
  );
};

export default Navbar;
