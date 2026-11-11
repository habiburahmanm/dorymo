import React, { useState } from 'react';
import { useEcosystem } from '../context/EcosystemContext';
import { IntentCategory, ServiceRequirementTicket } from '../types';
import {
  ShieldCheck,
  Plus,
  Trash2,
  AlertTriangle,
  Upload,
  CheckCircle,
  Clock,
  Layers,
  Wrench,
  DollarSign,
  MapPin,
  Camera,
  FileText,
  Sparkles,
  Phone,
  Laptop,
  Briefcase,
  Lock,
  ArrowRight,
  Send,
  Eye,
  ExternalLink,
  X,
  CreditCard,
  User,
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

export const ProviderPortal: React.FC = () => {
  const {
    currentUser,
    activeSession,
    openAuthGate,
    switchUserRole,
    tickets,
    providerExpressInterest,
    providerClaimTicket,
    providerSubmitProofOfWork,
    listings,
    equipment,
    providerKYC,
    addServiceListing,
    deleteServiceListing,
    addEquipmentItem,
    deleteEquipmentItem,
    submitProviderKYC,
    updateProviderKYC,
    approveKYCInstantly,
    resetKYCToUnverified,
    setCurrentView,
  } = useEcosystem();

  const [activeTab, setActiveTab] = useState<'available_bids' | 'active_contracts' | 'payouts' | 'listings' | 'equipment' | 'kyc'>('available_bids');

  // Filter for available requests
  const [categoryFilter, setCategoryFilter] = useState<'all' | IntentCategory>('all');

  // Proof of work modal state
  const [proofModalTicket, setProofModalTicket] = useState<ServiceRequirementTicket | null>(null);
  const [proofUrl, setProofUrl] = useState('https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop');
  const [proofNotes, setProofNotes] = useState('Completed diagnostics, replaced components in compliance with standards, and validated circuit stability.');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Listings Form state
  const [srvTitle, setSrvTitle] = useState('');
  const [srvCategory, setSrvCategory] = useState<IntentCategory>('home_repair');
  const [srvSubcategory, setSrvSubcategory] = useState('High-Voltage Electrical');
  const [srvDescription, setSrvDescription] = useState('');
  const [srvRateType, setSrvRateType] = useState<'hourly' | 'fixed'>('hourly');
  const [srvRate, setSrvRate] = useState<number>(1350);
  const [srvRadius, setSrvRadius] = useState<number>(25);
  const [srvLocation, setSrvLocation] = useState('Dhaka Metro & Gulshan Hub');
  const [srvPhone, setSrvPhone] = useState('+880 1711-223344');
  const [srvSlots, setSrvSlots] = useState('09:00 AM, 11:30 AM, 02:00 PM, 04:30 PM');

  // Equipment Form state
  const [eqTitle, setEqTitle] = useState('');
  const [eqCategory, setEqCategory] = useState('Diagnostic & Inspection');
  const [eqDailyRate, setEqDailyRate] = useState<number>(850);
  const [eqDeposit, setEqDeposit] = useState<number>(4500);
  const [eqCondition, setEqCondition] = useState<'Brand New' | 'Like New' | 'Good' | 'Heavy Duty'>('Like New');
  const [eqConditionNotes, setEqConditionNotes] = useState('Calibrated last month. Includes rugged protective hard case.');
  const [eqPickupOption, setEqPickupOption] = useState<'pickup_only' | 'delivery_available' | 'depot_locker'>('delivery_available');
  const [eqUnits, setEqUnits] = useState<number>(1);
  const [eqSerial, setEqSerial] = useState('SN-8829-FLK');
  const [eqPhone, setEqPhone] = useState('+880 1711-223344');

  // KYC Editing Form state
  const [kycLegalName, setKycLegalName] = useState(providerKYC.legalName);
  const [kycRegNumber, setKycRegNumber] = useState(providerKYC.businessRegNumber);

  // Auth Guard: If not signed in as a provider
  if (!currentUser || currentUser.role !== 'provider') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-white/10 bg-zinc-950 p-8 text-center space-y-4 shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/10 text-orange-400">
            <Briefcase className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <span className="font-mono text-xs uppercase font-bold text-orange-400">
              /portal/provider // AUTH REQUIRED
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Provider Studio & Contractor Terminal
            </h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              Please sign in with your verified contractor account to inspect admin-approved dispatch requests, express interest in customer leads, and submit proof-of-work deliverables.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => openAuthGate('provider', 'provider_portal')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-xs font-bold text-black hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20"
            >
              <span>Sign In / Register as Provider</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tickets available for bidding (Approved by Admin or Open for Interest)
  const availableBiddingTickets = tickets.filter(
    (t) =>
      (t.status === 'approved_open_for_interest' ||
       t.status === 'interest_expressed' ||
       (t.status as string) === 'approved_for_bidding') &&
      (categoryFilter === 'all' || t.category === categoryFilter)
  );

  // Active contracts claimed or assigned to this provider
  const activeClaimedContracts = tickets.filter(
    (t) =>
      (t.status === 'assigned_in_progress' || t.status === 'proof_submitted' || (t.status as string) === 'work_submitted') &&
      (t.selectedProviderId === currentUser.id || t.assignedProviderId === currentUser.id)
  );

  // Completed contracts for ledger
  const completedContracts = tickets.filter(
    (t) =>
      (t.status === 'completed_released' || (t.status as string) === 'completed') &&
      (t.selectedProviderId === currentUser.id || t.assignedProviderId === currentUser.id)
  );

  const totalEarnedReleased = completedContracts
    .reduce((acc, t) => acc + (t.budgetBDT ?? t.estimatedBudget ?? 0), 0);

  const totalEscrowHeldInTransit = activeClaimedContracts
    .reduce((acc, t) => acc + (t.budgetBDT ?? t.estimatedBudget ?? 0), 0);

  const handleClaimTicket = (ticket: ServiceRequirementTicket) => {
    providerExpressInterest(ticket.id, currentUser.id);
    showToast(`Interest registered for #${ticket.id}! Customer will review and assign.`);
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofModalTicket) return;
    providerSubmitProofOfWork(proofModalTicket.id, proofNotes, proofUrl);
    showToast(`Proof-of-work submitted for #${proofModalTicket.id}. Customer notified for escrow release.`);
    setProofModalTicket(null);
  };

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!srvTitle.trim()) return;
    addServiceListing({
      providerId: currentUser.id,
      providerName: currentUser.name,
      providerTitle: srvSubcategory,
      providerPhone: srvPhone,
      category: srvCategory,
      subcategory: srvSubcategory,
      title: srvTitle,
      description: srvDescription,
      rateType: srvRateType,
      rate: Number(srvRate),
      location: srvLocation,
      serviceRadiusKm: Number(srvRadius),
      availableSlots: srvSlots.split(',').map((s) => s.trim()),
    });
    setSrvTitle('');
    setSrvDescription('');
    showToast('Service listing registered in platform catalog.');
  };

  const handleCreateEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eqTitle.trim()) return;
    addEquipmentItem({
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      ownerPhone: eqPhone,
      title: eqTitle,
      category: eqCategory,
      dailyRate: Number(eqDailyRate),
      securityDeposit: Number(eqDeposit),
      condition: eqCondition,
      conditionNotes: eqConditionNotes,
      location: 'Banani Central Depot',
      pickupOption: eqPickupOption,
      availableUnits: Number(eqUnits),
      photos: ['https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop'],
      serialNumber: eqSerial,
    });
    setEqTitle('');
    showToast('Equipment item added to platform rental inventory.');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-lg border border-orange-500/50 bg-zinc-950 px-4 py-3 text-xs text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="h-4 w-4 text-orange-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Directory Routing & Role Header */}
      <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-orange-500/10 px-2 py-0.5 font-mono text-[10px] uppercase font-bold text-orange-400">
              /portal/provider
            </span>
            <span className="font-mono text-xs text-zinc-500">Contractor & Freelancer Workspace</span>
            <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-3 w-3" />
              <span>CCB BONDED CONTRACTOR</span>
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {currentUser.name} // Provider Studio
          </h1>
          <p className="mt-1 text-xs text-zinc-400 max-w-2xl">
            {currentUser.tradeTitle || 'Licensed Contractor & Verified Specialist'}. Claim admin-approved customer dispatch contracts, submit proof-of-work deliverables to release escrow funds, and manage listings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('kyc')}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>License: {providerKYC.contractorLicenseNumber}</span>
          </button>
        </div>
      </div>

      {/* Provider Quick Stats Banner */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-orange-500/30 bg-orange-950/20 p-4">
          <div className="flex items-center justify-between text-orange-400">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Available Leads</span>
            <Sparkles className="h-4 w-4 text-orange-400 animate-pulse" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-orange-400 font-mono">
            {availableBiddingTickets.length}
          </div>
          <div className="mt-0.5 text-[11px] text-zinc-400">Admin-approved requests open for interest</div>
        </div>

        <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4">
          <div className="flex items-center justify-between text-blue-400">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Active Engagements</span>
            <Briefcase className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-blue-300 font-mono">
            {activeClaimedContracts.length}
          </div>
          <div className="mt-0.5 text-[11px] text-zinc-400">Assigned & in-progress contracts</div>
        </div>

        <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Escrow in Transit</span>
            <Lock className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-purple-300 font-mono">
            {formatCurrency(totalEscrowHeldInTransit)}
          </div>
          <div className="mt-0.5 text-[11px] text-zinc-400">Held in platform vault awaiting sign-off</div>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Total Disbursed</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-400 font-mono">
            {formatCurrency(totalEarnedReleased)}
          </div>
          <div className="mt-0.5 text-[11px] text-zinc-400">Completed jobs payout ledger</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-950 p-1 text-xs">
          <button
            onClick={() => setActiveTab('available_bids')}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-colors',
              activeTab === 'available_bids' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            <span>Marketplace Leads ({availableBiddingTickets.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('active_contracts')}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-colors',
              activeTab === 'active_contracts' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Briefcase className="h-3.5 w-3.5 text-blue-400" />
            <span>Active Engagements ({activeClaimedContracts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-colors',
              activeTab === 'payouts' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
            <span>Payouts & Ledger</span>
          </button>
          <button
            onClick={() => setActiveTab('listings')}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-colors',
              activeTab === 'listings' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Wrench className="h-3.5 w-3.5 text-orange-400" />
            <span>My Listings ({listings.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-colors',
              activeTab === 'equipment' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span>Rental Fleet ({equipment.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('kyc')}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-colors',
              activeTab === 'kyc' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>KYC & License</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Available Approved Requests (Bidding Pool) */}
      {activeTab === 'available_bids' && (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono text-zinc-500 uppercase text-[11px] mr-1">Match Category:</span>
            <button
              onClick={() => setCategoryFilter('all')}
              className={cn(
                'rounded-lg px-2.5 py-1 font-medium transition-colors',
                categoryFilter === 'all'
                  ? 'bg-orange-500 text-black font-semibold'
                  : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'
              )}
            >
              All Categories
            </button>
            <button
              onClick={() => setCategoryFilter('home_repair')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-colors',
                categoryFilter === 'home_repair'
                  ? 'bg-orange-500 text-black font-semibold'
                  : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'
              )}
            >
              <Wrench className="h-3.5 w-3.5" />
              <span>Doorstep Repairs</span>
            </button>
            <button
              onClick={() => setCategoryFilter('digital_gig')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-colors',
                categoryFilter === 'digital_gig'
                  ? 'bg-cyan-500 text-black font-semibold'
                  : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'
              )}
            >
              <Laptop className="h-3.5 w-3.5" />
              <span>Digital Gigs</span>
            </button>
            <button
              onClick={() => setCategoryFilter('equipment_rental')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-colors',
                categoryFilter === 'equipment_rental'
                  ? 'bg-emerald-500 text-black font-semibold'
                  : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Equipment Leases</span>
            </button>
          </div>

          {availableBiddingTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/40 p-12 text-center">
              <Sparkles className="h-10 w-10 text-zinc-600 mb-3" />
              <h3 className="text-base font-semibold text-white">No Approved Requests Available Right Now</h3>
              <p className="mt-1 text-xs text-zinc-400 max-w-sm">
                Inbound customer requirements are reviewed continuously in Platform Triage. Check back shortly or view your Active Engagements.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableBiddingTickets.map((t) => {
                const hasExpressedInterest = t.interestedProviderIds?.includes(currentUser.id);
                const budgetAmount = t.budgetBDT ?? t.estimatedBudget ?? 0;

                return (
                  <div
                    key={t.id}
                    className="rounded-2xl border border-orange-500/30 bg-zinc-950 p-5 shadow-lg shadow-black/40 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-orange-400">{t.id}</span>
                          <span className="text-zinc-600">•</span>
                          <span className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                            {t.category === 'home_repair' && <Wrench className="h-3 w-3 text-orange-400" />}
                            {t.category === 'digital_gig' && <Laptop className="h-3 w-3 text-cyan-400" />}
                            {t.category === 'equipment_rental' && <Layers className="h-3 w-3 text-emerald-400" />}
                            <span className="capitalize">{t.category.replace('_', ' ')}</span>
                          </span>
                          <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                            ADMIN APPROVED
                          </span>
                          {t.interestedProviderIds?.length > 0 && (
                            <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                              {t.interestedProviderIds.length} BIDDER{t.interestedProviderIds.length > 1 ? 'S' : ''}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-white tracking-tight">{t.title}</h3>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-[10px] font-mono text-zinc-400 uppercase">Escrow Budget</div>
                          <div className="text-xl font-bold font-mono text-emerald-400">
                            {formatCurrency(budgetAmount)}
                          </div>
                        </div>

                        {hasExpressedInterest ? (
                          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400">
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                            <span>Interest Submitted</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleClaimTicket(t)}
                            className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-black hover:bg-orange-400 shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                          >
                            <Briefcase className="h-4 w-4" />
                            <span>I am Interested / Claim Job</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed">{t.description}</p>

                    {(t.adminNotes || t.adminReviewNotes) && (
                      <div className="rounded-xl border border-white/5 bg-zinc-900/60 p-3 text-xs text-zinc-300 flex items-start gap-2">
                        <ShieldCheck className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-mono text-[10px] text-orange-400 uppercase font-semibold">
                            Platform Dispatcher Scope Validation:
                          </span>
                          <p className="mt-0.5 text-zinc-400">{t.adminNotes || t.adminReviewNotes}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3 text-xs text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                        <span className="font-mono text-zinc-300">{t.locationArea || t.addressMasked}</span>
                      </div>
                      <span className="text-[11px] text-zinc-500">
                        Customer Requester: <strong className="text-zinc-300">{t.customerName}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Active Claimed Contracts */}
      {activeTab === 'active_contracts' && (
        <div className="space-y-4">
          {activeClaimedContracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/40 p-12 text-center">
              <Briefcase className="h-10 w-10 text-zinc-600 mb-3" />
              <h3 className="text-base font-semibold text-white">No Active Engagements</h3>
              <p className="mt-1 text-xs text-zinc-400 max-w-sm">
                Browse Marketplace Leads to express interest. When a customer accepts your bid, the engagement will appear here.
              </p>
            </div>
          ) : (
            activeClaimedContracts.map((t) => {
              const isWorkSubmitted = t.status === 'proof_submitted' || (t.status as string) === 'work_submitted';
              const budgetAmount = t.budgetBDT ?? t.estimatedBudget ?? 0;

              return (
                <div
                  key={t.id}
                  className={cn(
                    'rounded-2xl border p-5 space-y-4 transition-all',
                    isWorkSubmitted
                      ? 'border-purple-500/50 bg-purple-950/20'
                      : 'border-blue-500/40 bg-zinc-950'
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-400">{t.id}</span>
                        <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                          {isWorkSubmitted ? 'PROOF SUBMITTED' : 'IN-PROGRESS'}
                        </span>
                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
                          ESCROW LOCKED: {formatCurrency(budgetAmount)}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight">{t.title}</h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isWorkSubmitted ? (
                        <button
                          onClick={() => {
                            setProofModalTicket(t);
                            setProofNotes('');
                          }}
                          className="flex items-center gap-1.5 rounded-lg bg-purple-500 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-600 shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
                        >
                          <Upload className="h-4 w-4" />
                          <span>Submit Proof-of-Work</span>
                        </button>
                      ) : (
                        <span className="rounded-lg border border-purple-500/40 bg-purple-950/60 px-3 py-1.5 text-xs text-purple-300 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-purple-400 animate-spin" />
                          <span>Awaiting Customer Sign-off</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300">{t.description}</p>

                  {/* Customer Coordinates & Phone */}
                  <div className="rounded-xl border border-white/5 bg-zinc-900/60 p-3.5 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase font-mono block">Jobsite Coordinates / Address:</span>
                      <span className="font-semibold text-white mt-0.5 block">{t.locationArea || t.addressMasked}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase font-mono block">Client Requester:</span>
                      <span className="font-semibold text-white mt-0.5 block">{t.customerName}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase font-mono block">Client Phone:</span>
                      <span className="font-semibold text-white mt-0.5 block">{t.customerPhone || '+880 1712-234567'}</span>
                    </div>
                  </div>

                  {isWorkSubmitted && (
                    <div className="flex items-center gap-3 rounded-lg border border-purple-500/30 bg-purple-950/30 p-3">
                      {t.proofOfWorkUrl && (
                        <img
                          src={t.proofOfWorkUrl}
                          alt="Proof deliverables"
                          className="h-14 w-20 rounded object-cover border border-purple-500/40 shrink-0"
                        />
                      )}
                      <div className="text-xs text-purple-300">
                        <span className="font-semibold block">Deliverables Submitted:</span>
                        <p className="text-zinc-400 text-[11px] mt-0.5">{t.proofNote || 'Work completion verified and submitted.'}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: Payouts & Escrow Ledger */}
      {activeTab === 'payouts' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight">Contractor Payouts & Escrow Ledger</h3>
            <p className="text-xs text-zinc-400">
              Escrow funds are deposited into the platform vault upon dispatch and released immediately to your payout balance when the client verifies deliverables.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="rounded-xl border border-white/5 bg-zinc-950 p-4">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Total Disbursed to Bank</span>
                <div className="mt-1 text-2xl font-bold font-mono text-emerald-400">
                  {formatCurrency(totalEarnedReleased)}
                </div>
              </div>
              <div className="rounded-xl border border-white/5 bg-zinc-950 p-4">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Pending Escrow in Vault</span>
                <div className="mt-1 text-2xl font-bold font-mono text-purple-400">
                  {formatCurrency(totalEscrowHeldInTransit)}
                </div>
              </div>
              <div className="rounded-xl border border-white/5 bg-zinc-950 p-4">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Settled Contracts</span>
                <div className="mt-1 text-2xl font-bold font-mono text-white">
                  {completedContracts.length}
                </div>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40">
            <div className="border-b border-white/10 bg-zinc-950 px-5 py-3 text-xs font-semibold text-zinc-300">
              Disbursement Transactions History
            </div>
            {completedContracts.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">No completed payout events logged yet.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {completedContracts.map((c) => {
                  const budgetAmount = c.budgetBDT ?? c.estimatedBudget ?? 0;
                  return (
                    <div key={c.id} className="flex items-center justify-between px-5 py-3.5 text-xs">
                      <div>
                        <div className="font-semibold text-white">{c.title}</div>
                        <div className="text-[11px] text-zinc-400">Client: {c.customerName} • Ticket: {c.id}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-emerald-400">+{formatCurrency(budgetAmount)}</div>
                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-mono text-emerald-400">
                          ESCROW RELEASED
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Self-Serve Listings */}
      {activeTab === 'listings' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
            <h3 className="text-base font-bold text-white tracking-tight">Create Manual Service Listing</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Publish direct bookable services to the Explore catalog with explicit hourly or fixed rates.
            </p>

            <form onSubmit={handleCreateListing} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Service Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Licensed Electrician // High-Voltage Panel"
                    value={srvTitle}
                    onChange={(e) => setSrvTitle(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Subcategory Specialty</label>
                  <input
                    type="text"
                    required
                    value={srvSubcategory}
                    onChange={(e) => setSrvSubcategory(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Service Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detail scope, compliance standards, and diagnostic procedures..."
                  value={srvDescription}
                  onChange={(e) => setSrvDescription(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Rate Type</label>
                  <select
                    value={srvRateType}
                    onChange={(e) => setSrvRateType(e.target.value as any)}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="hourly">Hourly Rate</option>
                    <option value="fixed">Fixed Engagement</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Rate (৳ / BDT)</label>
                  <input
                    type="number"
                    value={srvRate}
                    onChange={(e) => setSrvRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Service Radius (Km)</label>
                  <input
                    type="number"
                    value={srvRadius}
                    onChange={(e) => setSrvRadius(Number(e.target.value))}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-black hover:bg-orange-400"
              >
                <Plus className="h-4 w-4" />
                <span>Publish Service Listing</span>
              </button>
            </form>
          </div>

          {/* Existing listings list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {listings.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-orange-400 uppercase">{item.subcategory}</span>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  </div>
                  <button
                    onClick={() => deleteServiceListing(item.id)}
                    className="text-zinc-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-zinc-400 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <span className="font-mono font-bold text-white">
                    {formatCurrency(item.rate)}/{item.rateType === 'hourly' ? 'hr' : 'job'}
                  </span>
                  <span className="text-[11px] text-zinc-500">{item.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Rental Fleet */}
      {activeTab === 'equipment' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
            <h3 className="text-base font-bold text-white tracking-tight">Add Tool / Equipment to Rental Inventory</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Provide daily rate, required security deposit escrow hold, and pickup/delivery options.
            </p>

            <form onSubmit={handleCreateEquipment} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Equipment Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fluke Ti480 PRO Industrial Thermal Camera"
                    value={eqTitle}
                    onChange={(e) => setEqTitle(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={eqCategory}
                    onChange={(e) => setEqCategory(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Daily Rate (৳ / BDT)</label>
                  <input
                    type="number"
                    value={eqDailyRate}
                    onChange={(e) => setEqDailyRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Security Deposit Hold (৳)</label>
                  <input
                    type="number"
                    value={eqDeposit}
                    onChange={(e) => setEqDeposit(Number(e.target.value))}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Condition</label>
                  <select
                    value={eqCondition}
                    onChange={(e) => setEqCondition(e.target.value as any)}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="Brand New">Brand New</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Heavy Duty">Heavy Duty</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-black hover:bg-orange-400"
              >
                <Plus className="h-4 w-4" />
                <span>Register Tool in Fleet</span>
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {equipment.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-cyan-400 uppercase">{item.category}</span>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  </div>
                  <button
                    onClick={() => deleteEquipmentItem(item.id)}
                    className="text-zinc-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-white font-bold">{formatCurrency(item.dailyRate)}/day</span>
                  <span className="text-emerald-400">Deposit: {formatCurrency(item.securityDeposit)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: KYC & License */}
      {activeTab === 'kyc' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Contractor Verification & KYC</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Platform KYC mandates Construction Contractors Board license, surety bond, and general liability insurance.
                </p>
              </div>
              <span className="rounded bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-400">
                STATUS: APPROVED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <label className="font-mono text-[10px] text-zinc-500 uppercase block">Legal Business Entity</label>
                <input
                  type="text"
                  value={kycLegalName}
                  onChange={(e) => setKycLegalName(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="font-mono text-[10px] text-zinc-500 uppercase block">Trade Registration / Tax ID</label>
                <input
                  type="text"
                  value={kycRegNumber}
                  onChange={(e) => setKycRegNumber(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-white"
                />
              </div>
            </div>

            <button
              onClick={() => {
                updateProviderKYC({ legalName: kycLegalName, businessRegNumber: kycRegNumber });
                showToast('KYC profile updated.');
              }}
              className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-black hover:bg-orange-400"
            >
              Save Credentials
            </button>
          </div>
        </div>
      )}

      {/* PROOF OF WORK SUBMISSION MODAL */}
      {proofModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-purple-500/50 bg-zinc-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Submit Proof-of-Work Deliverables</h3>
              </div>
              <button onClick={() => setProofModalTicket(null)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl border border-white/5 bg-zinc-900/60 p-3.5 space-y-1 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Contract ID:</span>
                <span className="font-mono text-white font-bold">{proofModalTicket.id}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Escrow Payout Due:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {formatCurrency(proofModalTicket.budgetBDT ?? proofModalTicket.estimatedBudget ?? 0)}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitProof} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Deliverables Photo URL / GitHub Repo / Report Link
                </label>
                <input
                  type="url"
                  required
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Work Completion Notes & Diagnostic Findings
                </label>
                <textarea
                  required
                  rows={3}
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProofModalTicket(null)}
                  className="rounded-lg border border-white/10 bg-zinc-900 px-4 py-2 text-xs text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-purple-500 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-600 shadow-lg shadow-purple-500/20"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Submit Deliverables to Customer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
