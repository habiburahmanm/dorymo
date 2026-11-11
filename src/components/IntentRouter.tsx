import React from 'react';
import { useEcosystem } from '../context/EcosystemContext';
import { IntentCategory } from '../types';
import {
  Laptop,
  Wrench,
  Layers,
  ArrowRight,
  Shield,
  Lock,
  Clock,
  Sparkles,
  User,
  Briefcase,
} from 'lucide-react';
import { cn } from '../lib/utils';

export const IntentRouter: React.FC = () => {
  const {
    setActiveIntent,
    setSelectedSubcategory,
    setCurrentView,
    currentUser,
    openAuthGate,
    listings,
    equipment,
    tickets,
  } = useEcosystem();

  const intents: {
    id: IntentCategory;
    title: string;
    subtitle: string;
    description: string;
    icon: React.ElementType;
    badge: string;
    sla: string;
    guarantee: string;
    count: number;
    tags: string[];
  }[] = [
    {
      id: 'digital_gig',
      title: 'Digital Freelance & Architecture',
      subtitle: 'Verified Engineering, AI Systems, Cloud & Design',
      description:
        'Direct contract engagement with vetted technical specialists. Milestone-based escrow payments, code reviews, and IP assignment protection.',
      icon: Laptop,
      badge: 'Zero Middleman Fee Escrow',
      sla: 'Instant Remote Sync',
      guarantee: '100% Milestone Lock',
      count: listings.filter((l) => l.category === 'digital_gig').length,
      tags: ['TypeScript / React', 'GenAI / Agentic Systems', 'Cloud & DevOps', 'Security Audits'],
    },
    {
      id: 'home_repair',
      title: 'On-Demand Doorstep Home Repairs',
      subtitle: 'Licensed Electricians, Master Plumbers & Urgent Remediation',
      description:
        'Contextual radius dispatch for critical residential repairs. Live GPS dispatch status, fixed hourly transparency, and proof-of-work completion audits.',
      icon: Wrench,
      badge: '60-Min Emergency Response',
      sla: 'Doorstep SLA < 90m',
      guarantee: 'Licensed & Bonded KYC',
      count: listings.filter((l) => l.category === 'home_repair').length,
      tags: ['Emergency Plumbing', 'High-Voltage Electrical', 'HVAC Diagnostics', 'Roof & Structural'],
    },
    {
      id: 'equipment_rental',
      title: 'Peer-to-Peer & Platform Equipment Rental',
      subtitle: 'Heavy Machinery, Specialized Diagnostic Tools & Gear',
      description:
        'Rent industrial equipment or monetize idle tools safely. Segregated escrow security deposit hold, serial photo check-in/out, and depot locker pickups.',
      icon: Layers,
      badge: 'Automated Escrow Hold',
      sla: 'Same-Day Depot Pickup',
      guarantee: 'Condition Photo Audited',
      count: equipment.length,
      tags: ['Thermal Imagers', 'Rotary Hammer Drills', 'Excavation Machinery', 'Scaffolding Kits'],
    },
  ];

  const availableBidsCount = tickets.filter(
    (t) => t.status === 'approved_open_for_interest' || t.status === 'interest_expressed' || (t.status as string) === 'approved_for_bidding'
  ).length;
  const activeCustomerTickets = tickets.filter(
    (t) => t.status !== 'completed_released' && t.status !== 'admin_rejected' && (t.status as string) !== 'completed'
  ).length;

  const handleLaunchCategory = (categoryId: IntentCategory) => {
    setActiveIntent(categoryId);
    setSelectedSubcategory(null);
    setCurrentView('service_finder');
  };

  const handleCustomerCardClick = () => {
    if (currentUser?.role === 'customer') {
      setCurrentView('customer_portal');
    } else {
      openAuthGate('customer', 'customer_portal');
    }
  };

  const handleProviderCardClick = () => {
    if (currentUser?.role === 'provider') {
      setCurrentView('provider_portal');
    } else {
      openAuthGate('provider', 'provider_portal');
    }
  };

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      {/* Hero Header: 21st.dev Minimalist Architecture */}
      <div className="mb-10 text-center md:mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/80 px-3.5 py-1 text-xs text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
          <span>NexServe Triage & Moderated Dispatch Protocol</span>
          <span className="text-zinc-600">//</span>
          <span className="font-mono text-zinc-300">Dual Portal Architecture</span>
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Moderated Dispatch.
          <span className="block text-zinc-400 font-normal">Dual Self-Serve Portals, Zero Direct Risk.</span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-xs sm:text-sm text-zinc-400 leading-relaxed">
          Customer requirements undergo platform triage before contractor dispatch. Escrow deposits remain securely locked in the platform vault until proof-of-work deliverables are inspected.
        </p>

        {/* Dual Portal Balanced 2-Column Grid (Customer & Provider) */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto text-left">
          {/* Customer Portal Banner Card */}
          <button
            onClick={handleCustomerCardClick}
            className="group relative flex flex-col justify-between rounded-xl border border-white/10 bg-zinc-900/60 p-6 transition-all hover:border-orange-500/50 hover:bg-zinc-900/90 shadow-xl"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2">
                  {activeCustomerTickets > 0 && (
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-300 border border-white/5">
                      {activeCustomerTickets} ACTIVE
                    </span>
                  )}
                  <span className="font-mono text-[10px] uppercase font-bold text-zinc-500 group-hover:text-orange-400 transition-colors">
                    /portal/customer
                  </span>
                </div>
              </div>
              <h3 className="mt-4 text-lg font-bold text-white tracking-tight">Customer Requester Hub</h3>
              <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                Post service requirements in BDT (৳), configure doorstep address masking, monitor triage validation, and release escrow upon inspecting proof-of-work.
              </p>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
              <span className="text-xs font-semibold text-orange-400">
                {currentUser?.role === 'customer' ? 'Open Requester Portal' : 'Sign In as Customer'}
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/10 text-orange-400 group-hover:bg-orange-500 group-hover:text-black transition-all">
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </button>

          {/* Provider Portal Banner Card */}
          <button
            onClick={handleProviderCardClick}
            className="group relative flex flex-col justify-between rounded-xl border border-white/10 bg-zinc-900/60 p-6 transition-all hover:border-orange-500/50 hover:bg-zinc-900/90 shadow-xl"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2">
                  {availableBidsCount > 0 && (
                    <span className="rounded bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-400 font-mono border border-orange-500/30">
                      {availableBidsCount} OPEN REQUESTS
                    </span>
                  )}
                  <span className="font-mono text-[10px] uppercase font-bold text-zinc-500 group-hover:text-orange-400 transition-colors">
                    /portal/provider
                  </span>
                </div>
              </div>
              <h3 className="mt-4 text-lg font-bold text-white tracking-tight">Provider Studio & Terminal</h3>
              <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                Claim admin-approved dispatch contracts, view unmasked jobsite coordinates, submit deliverables photos, and track escrow disbursements in your payout ledger.
              </p>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
              <span className="text-xs font-semibold text-orange-400">
                {currentUser?.role === 'provider' ? 'Open Contractor Studio' : 'Sign In as Provider'}
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/10 text-orange-400 group-hover:bg-orange-500 group-hover:text-black transition-all">
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Tri-Intent Direct Catalog Exploration */}
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
        <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-400">
          Direct Marketplace Discovery Hubs:
        </h2>
        <span className="text-[11px] text-zinc-500 font-mono">Verified Registries Only</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {intents.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between rounded-xl border border-white/10 bg-zinc-950/60 p-6 backdrop-blur transition-all duration-200 hover:border-orange-500/40 hover:bg-zinc-900/40"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-zinc-900 text-orange-500 transition-colors group-hover:border-orange-500/30 group-hover:bg-orange-500/10">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="font-mono text-[11px] font-medium text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                    {item.badge}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-medium text-white tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs font-medium text-orange-400/90 font-mono">
                  {item.subtitle}
                </p>
                <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                  {item.description}
                </p>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-white/5 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-white/5 pt-5">
                <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded bg-zinc-900/50 p-2">
                    <span className="block text-[10px] uppercase text-zinc-500 font-mono">SLA Delivery</span>
                    <span className="font-medium text-zinc-200">{item.sla}</span>
                  </div>
                  <div className="rounded bg-zinc-900/50 p-2">
                    <span className="block text-[10px] uppercase text-zinc-500 font-mono">Inventory</span>
                    <span className="font-medium text-zinc-200">
                      {item.count} {item.id === 'equipment_rental' ? 'Tools Live' : 'Active Providers'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleLaunchCategory(item.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all group-hover:border-orange-500/60 group-hover:bg-orange-500 group-hover:text-black"
                >
                  <span>Explore {item.title.split(' ')[0]}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
