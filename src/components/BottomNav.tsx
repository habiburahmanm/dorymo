import React from 'react';
import {
  Briefcase,
  Home,
  MessageCircle,
  PackageCheck,
  Search,
  User,
} from 'lucide-react';
import { useMaster } from '../context/MasterContext';
import { playChime } from '../lib/utils';

export const BottomNav: React.FC = () => {
  const {
    masterView,
    goHome,
    goExplore,
    goAccount,
    goProviderJobs,
    goChat,
    openSignup,
    profile,
    unreadCount,
  } = useMaster();

  const handleNav = (action: () => void) => {
    playChime('tap');
    action();
  };

  const isHome = !masterView;
  const isExplore = masterView === 'explore';
  const isBookings =
    masterView === 'customer_dashboard' || masterView === 'provider_jobs';
  const isChat = masterView === 'chat';
  const isProfile = masterView === 'customer_dashboard';

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.08] bg-zinc-950/85 px-2 py-1.5 backdrop-blur-xl shadow-[0_-8px_25px_rgba(0,0,0,0.6)] md:hidden safe-bottom"
    >
      <div className="mx-auto flex max-w-md items-center justify-around">
        {/* 1. Home */}
        <button
          onClick={() => handleNav(goHome)}
          className={`relative flex flex-col items-center justify-center py-1 px-3 transition-colors ${
            isHome ? 'text-orange-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="mt-1 text-[10px] font-medium">হোম</span>
          {isHome && (
            <span className="absolute -bottom-1 h-1 w-3 rounded-full bg-orange-500" />
          )}
        </button>

        {/* 2. Explore */}
        <button
          onClick={() => handleNav(() => goExplore())}
          className={`relative flex flex-col items-center justify-center py-1 px-3 transition-colors ${
            isExplore ? 'text-orange-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Search className="h-5 w-5" />
          <span className="mt-1 text-[10px] font-medium">খুঁজুন</span>
          {isExplore && (
            <span className="absolute -bottom-1 h-1 w-3 rounded-full bg-orange-500" />
          )}
        </button>

        {/* 3. Orders / Jobs */}
        <button
          onClick={() =>
            handleNav(() => {
              if (profile?.role === 'provider') goProviderJobs();
              else if (profile) goAccount();
              else openSignup();
            })
          }
          className={`relative flex flex-col items-center justify-center py-1 px-3 transition-colors ${
            isBookings ? 'text-orange-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {profile?.role === 'provider' ? (
            <Briefcase className="h-5 w-5" />
          ) : (
            <PackageCheck className="h-5 w-5" />
          )}
          <span className="mt-1 text-[10px] font-medium">
            {profile?.role === 'provider' ? 'কাজ' : 'অর্ডার'}
          </span>
          {isBookings && (
            <span className="absolute -bottom-1 h-1 w-3 rounded-full bg-orange-500" />
          )}
        </button>

        {/* 4. Chat */}
        <button
          onClick={() =>
            handleNav(() => {
              if (profile) goChat();
              else openSignup();
            })
          }
          className={`relative flex flex-col items-center justify-center py-1 px-3 transition-colors ${
            isChat ? 'text-orange-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <MessageCircle className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="mt-1 text-[10px] font-medium">চ্যাট</span>
          {isChat && (
            <span className="absolute -bottom-1 h-1 w-3 rounded-full bg-orange-500" />
          )}
        </button>

        {/* 5. Account */}
        <button
          onClick={() =>
            handleNav(() => {
              if (profile) goAccount();
              else openSignup();
            })
          }
          className={`relative flex flex-col items-center justify-center py-1 px-3 transition-colors ${
            isProfile ? 'text-orange-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="h-5 w-5 rounded-full object-cover ring-1 ring-white/20"
            />
          ) : (
            <User className="h-5 w-5" />
          )}
          <span className="mt-1 text-[10px] font-medium">
            {profile ? 'অ্যাকাউন্ট' : 'লগইন'}
          </span>
          {isProfile && (
            <span className="absolute -bottom-1 h-1 w-3 rounded-full bg-orange-500" />
          )}
        </button>
      </div>
    </nav>
  );
};
