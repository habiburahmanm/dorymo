import React, { useState, useEffect, useMemo } from 'react';
import { useEcosystem } from '../context/EcosystemContext';
import {
  Search,
  Wrench,
  Laptop,
  Layers,
  ShoppingBag,
  User,
  ShieldCheck,
  Palette,
  X,
  ArrowRight,
  Sparkles,
  Lock,
  Clock,
  Briefcase,
  Scale,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const {
    setCurrentView,
    setActiveIntent,
    switchUserRole,
    seedAuthenticRegistry,
    resetTicketsToBaseline,
  } = useEcosystem();

  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions = useMemo(
    () => [
      {
        id: 'nav-customer-portal',
        title: 'Customer Requester Portal (/portal/customer)',
        subtitle: 'Post service requirements, inspect tickets, and release escrow',
        icon: User,
        run: () => {
          switchUserRole('customer');
          setCurrentView('customer_portal');
        },
      },
      {
        id: 'nav-admin-portal',
        title: 'Elevated Dispatcher Backoffice (/gatekeeper-admin)',
        subtitle: 'Validate inbound customer requests, adjust budgets, and arbitrate disputes (Shortcut: Ctrl+Shift+A)',
        icon: Lock,
        run: () => {
          switchUserRole('admin');
          setCurrentView('admin_portal');
        },
      },
      {
        id: 'nav-provider-portal',
        title: 'Provider Studio & Bidding Terminal (/portal/provider)',
        subtitle: 'Claim approved dispatch contracts, submit proof-of-work, and view payouts',
        icon: Briefcase,
        run: () => {
          switchUserRole('provider');
          setCurrentView('provider_portal');
        },
      },
      {
        id: 'cmd-seed',
        title: 'Reset Baseline Fixtures & Tickets',
        subtitle: 'Restore demo tickets across triage, active contract, and dispute phases',
        icon: Sparkles,
        run: () => {
          seedAuthenticRegistry();
          resetTicketsToBaseline();
          setCurrentView('customer_portal');
        },
      },
      {
        id: 'nav-repair',
        title: 'Explore Doorstep Home Repairs',
        subtitle: 'Dispatch licensed electricians, plumbers, and emergency trades',
        icon: Wrench,
        run: () => {
          setActiveIntent('home_repair');
          setCurrentView('service_finder');
        },
      },
      {
        id: 'nav-equip',
        title: 'Browse Equipment & Tool Leases',
        subtitle: 'Inspect heavy machinery, diagnostic cameras, and escrow terms',
        icon: Layers,
        run: () => {
          setActiveIntent('equipment_rental');
          setCurrentView('service_finder');
        },
      },
      {
        id: 'nav-gig',
        title: 'Engage Digital Freelance Specialists',
        subtitle: 'Hire remote software architects, AI engineers, and UI systems',
        icon: Laptop,
        run: () => {
          setActiveIntent('digital_gig');
          setCurrentView('service_finder');
        },
      },
      {
        id: 'nav-checkout',
        title: 'Mixed-Cart Split-Flow Checkout',
        subtitle: 'Inspect escrow security deposit holds and itemized breakdown',
        icon: ShoppingBag,
        run: () => {
          setCurrentView('hybrid_checkout');
        },
      },
      {
        id: 'nav-tokens',
        title: '21st.dev Design System Tokens',
        subtitle: 'Examine color palette, typography scale, and component primitives',
        icon: Palette,
        run: () => {
          setCurrentView('design_system');
        },
      },
      {
        id: 'nav-inspector',
        title: 'Moderated Dispatch Graph & State Inspector',
        subtitle: 'Inspect live state JSON, 0 console errors, and confidence metrics',
        icon: ShieldCheck,
        run: () => {
          setCurrentView('system_inspector');
        },
      },
    ],
    [setActiveIntent, setCurrentView, switchUserRole, seedAuthenticRegistry, resetTicketsToBaseline]
  );

  const filteredItems = useMemo(() => {
    const isQueryingAdmin = search.toLowerCase().includes('admin') || search.toLowerCase().includes('gatekeeper');
    const baseActions = actions.filter((i) => i.id !== 'nav-admin-portal' || isQueryingAdmin);
    if (!search.trim()) return baseActions;
    const q = search.toLowerCase();
    return baseActions.filter(
      (i) => i.title.toLowerCase().includes(q) || i.subtitle.toLowerCase().includes(q)
    );
  }, [actions, search]);

  // Handle ESC and Arrow/Enter navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].run();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  // Reset index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 sm:px-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-zinc-950 p-2 shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="flex items-center gap-2 border-b border-white/10 px-3 pb-2 pt-1">
          <Search className="h-4 w-4 text-orange-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or portal (Customer, Provider, Bids, Escrow)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-500 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Command Items List */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No matching actions found for "{search}".
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.run();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors',
                    isSelected ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-md border shrink-0',
                        isSelected
                          ? 'border-orange-500/50 bg-orange-500/10 text-orange-400'
                          : 'border-white/10 bg-zinc-900 text-zinc-400'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-white truncate">{item.title}</div>
                      <div className="text-[11px] text-zinc-400 truncate">{item.subtitle}</div>
                    </div>
                  </div>

                  <ArrowRight
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 transition-transform',
                      isSelected ? 'text-orange-400 translate-x-0.5' : 'text-zinc-600 opacity-0'
                    )}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Keyboard Footer Helper */}
        <div className="flex items-center justify-between border-t border-white/10 px-3 pt-2 text-[10px] text-zinc-500 font-mono">
          <div className="flex items-center gap-2">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-orange-400 font-medium">NexServe Tri-Actor Triage</span>
        </div>
      </div>
    </div>
  );
};
