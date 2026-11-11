import React, { useState } from 'react';
import { useEcosystem } from '../context/EcosystemContext';
import { IntentCategory } from '../types';
import {
  Wrench,
  Laptop,
  Layers,
  ShoppingBag,
  Search,
  Menu,
  X,
  Sparkles,
  User,
  LogOut,
  Briefcase,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface NavbarProps {
  onOpenCommand: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCommand }) => {
  const {
    currentView,
    setCurrentView,
    currentUser,
    activeRole,
    openAuthGate,
    logout,
    activeIntent,
    setActiveIntent,
    setSelectedSubcategory,
    cart,
    tickets,
  } = useEcosystem();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const intents: { id: IntentCategory; label: string; icon: React.ElementType }[] = [
    { id: 'digital_gig', label: 'Digital Gigs', icon: Laptop },
    { id: 'home_repair', label: 'Doorstep Repairs', icon: Wrench },
    { id: 'equipment_rental', label: 'Equipment Rental', icon: Layers },
  ];

  const totalCartCount = cart.reduce((acc, i) => acc + i.quantityOrHours, 0);

  // Non-admin public counters
  const availableBidsCount = tickets.filter(
    (t) => t.status === 'approved_open_for_interest' || t.status === 'interest_expressed' || (t.status as string) === 'approved_for_bidding'
  ).length;
  const customerTicketsCount = tickets.filter(
    (t) => t.status !== 'completed_released' && t.status !== 'admin_rejected' && (t.status as string) !== 'completed'
  ).length;

  const handleNavClick = (view: typeof currentView) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  const handleCustomerClick = () => {
    if (currentUser?.role === 'customer') {
      setCurrentView('customer_portal');
    } else {
      openAuthGate('customer', 'customer_portal');
    }
    setIsMobileMenuOpen(false);
  };

  const handleProviderClick = () => {
    if (currentUser?.role === 'provider') {
      setCurrentView('provider_portal');
    } else {
      openAuthGate('provider', 'provider_portal');
    }
    setIsMobileMenuOpen(false);
  };

  const handleRoleSwitch = (role: 'customer' | 'provider') => {
    if (currentUser?.role === role) {
      if (role === 'provider') setCurrentView('provider_portal');
      else setCurrentView('customer_portal');
    } else {
      openAuthGate(role, role === 'provider' ? 'provider_portal' : 'customer_portal');
    }
  };

  const handleCategoryClick = (categoryId: IntentCategory) => {
    setActiveIntent(categoryId);
    setSelectedSubcategory(null);
    setCurrentView('service_finder');
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#09090b]/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand & Intent Tag */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavClick('intent_router')}
            className="group flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-zinc-900 transition-colors group-hover:border-orange-500/50">
              <span className="font-mono text-sm font-bold tracking-tighter text-orange-500">N</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-sm font-semibold tracking-tight text-white">NexServe</span>
              <span className="hidden sm:inline font-mono text-[9px] uppercase tracking-wider text-orange-400">
                Triage Graph
              </span>
            </div>
          </button>

          <div className="hidden h-4 w-px bg-white/10 md:block" />

          {/* Functional Intent Category Switcher Pills */}
          <div className="hidden items-center rounded-lg border border-white/10 bg-zinc-950 p-0.5 md:flex">
            {intents.map((item) => {
              const Icon = item.icon;
              const isCategoryActive = activeIntent === item.id && currentView === 'service_finder';
              return (
                <button
                  key={item.id}
                  onClick={() => handleCategoryClick(item.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                    isCategoryActive
                      ? 'border border-orange-500/50 bg-orange-500/10 text-orange-400 shadow-sm'
                      : 'border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5', isCategoryActive ? 'text-orange-400' : 'text-zinc-500')} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Search / Command Trigger */}
        <div className="flex items-center">
          <button
            onClick={onOpenCommand}
            className="flex items-center gap-2 rounded-md border border-white/10 bg-zinc-900/60 px-2.5 sm:px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-white/20 hover:text-zinc-200"
          >
            <Search className="h-3.5 w-3.5 text-orange-400" />
            <span className="hidden sm:inline">Search Services, Tools, Gigs...</span>
            <span className="inline sm:hidden font-medium">Search</span>
            <kbd className="rounded border border-white/10 bg-zinc-950 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Action Controls & Navigation Views */}
        <div className="flex items-center gap-2.5">
          {/* Main Navigation Views (Explore, Customer, Provider) */}
          <nav className="hidden lg:flex items-center gap-1 text-xs">
            <button
              onClick={() => setCurrentView('service_finder')}
              className={cn(
                'rounded-md px-2.5 py-1.5 font-medium transition-colors',
                currentView === 'service_finder' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              Explore
            </button>

            {/* Customer Portal */}
            <button
              onClick={handleCustomerClick}
              className={cn(
                'relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium transition-colors',
                currentView === 'customer_portal' || currentView === 'consumer_account'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <span>Customer</span>
              {customerTicketsCount > 0 && (
                <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-zinc-800 border border-white/10 text-[9px] font-mono text-zinc-300">
                  {customerTicketsCount}
                </span>
              )}
            </button>

            {/* Provider Studio */}
            <button
              onClick={handleProviderClick}
              className={cn(
                'relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium transition-colors',
                currentView === 'provider_portal' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <span>Provider</span>
              {availableBidsCount > 0 && (
                <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-orange-500/20 text-[9px] font-mono font-bold text-orange-400 border border-orange-500/30">
                  {availableBidsCount}
                </span>
              )}
            </button>
          </nav>

          {/* User Account / Role Pill */}
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 rounded-md border border-white/10 bg-zinc-950 px-2 py-1 text-xs">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="h-4 w-4 rounded-full object-cover" />
                ) : (
                  <User className="h-3 w-3 text-orange-400" />
                )}
                <span className="hidden sm:inline font-medium text-white max-w-[90px] truncate">{currentUser.name}</span>
                <span className="rounded bg-orange-500/20 px-1 py-0.5 text-[9px] font-mono font-bold uppercase text-orange-400">
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={() => logout()}
                className="rounded-md border border-white/10 bg-zinc-900 p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => openAuthGate('customer', 'customer_portal')}
                className="hidden sm:inline-flex rounded-md border border-white/10 bg-zinc-900/80 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white hover:border-white/20 transition-all"
              >
                Customer Login
              </button>
              <button
                onClick={() => openAuthGate('provider', 'provider_portal')}
                className="flex items-center gap-1 rounded-md bg-orange-500 px-2.5 py-1 text-xs font-semibold text-black hover:bg-orange-400 transition-all shadow-sm shadow-orange-500/20"
              >
                <Briefcase className="h-3 w-3" />
                <span>Provider Login</span>
              </button>
            </div>
          )}

          {/* Mixed Cart Trigger */}
          <button
            onClick={() => handleNavClick('hybrid_checkout')}
            className={cn(
              'relative flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all',
              currentView === 'hybrid_checkout'
                ? 'border-orange-500/60 bg-orange-500/10 text-orange-400'
                : 'border-white/10 bg-zinc-900 text-zinc-300 hover:border-white/20'
            )}
          >
            <ShoppingBag className="h-3.5 w-3.5 text-orange-500" />
            <span className="hidden sm:inline">Checkout</span>
            {totalCartCount > 0 && (
              <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-black">
                {totalCartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="flex lg:hidden items-center justify-center rounded-md border border-white/10 bg-zinc-900 p-1.5 text-zinc-400 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-zinc-950 px-4 py-3 space-y-3 animate-in slide-in-from-top-2 duration-150">
          {/* Mobile Category Quick Links */}
          <div className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">
            Categories
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            {intents.map((item) => {
              const Icon = item.icon;
              const isCategoryActive = activeIntent === item.id && currentView === 'service_finder';
              return (
                <button
                  key={item.id}
                  onClick={() => handleCategoryClick(item.id)}
                  className={cn(
                    'flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-all',
                    isCategoryActive
                      ? 'border border-orange-500/50 bg-orange-500/10 text-orange-400'
                      : 'border border-white/5 bg-zinc-900 text-zinc-400'
                  )}
                >
                  <Icon className="h-3 w-3" />
                  <span>{item.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-white/5 pt-2 text-[10px] font-mono uppercase text-zinc-500 tracking-wider">
            Portals & Views
          </div>
          <div className="grid grid-cols-1 gap-1 text-xs">
            <button
              onClick={() => handleNavClick('service_finder')}
              className={cn(
                'rounded-md px-3 py-2 text-left font-medium transition-colors',
                currentView === 'service_finder' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              )}
            >
              Explore Catalog Hub
            </button>
            <button
              onClick={handleCustomerClick}
              className={cn(
                'flex items-center justify-between rounded-md px-3 py-2 text-left font-medium transition-colors',
                currentView === 'customer_portal' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              )}
            >
              <span>Customer Portal</span>
              {customerTicketsCount > 0 && (
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300 font-mono">
                  {customerTicketsCount} active
                </span>
              )}
            </button>
            <button
              onClick={handleProviderClick}
              className={cn(
                'flex items-center justify-between rounded-md px-3 py-2 text-left font-medium transition-colors',
                currentView === 'provider_portal' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              )}
            >
              <span>Provider Studio</span>
              {availableBidsCount > 0 && (
                <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] text-orange-400 font-mono font-bold">
                  {availableBidsCount} open
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
