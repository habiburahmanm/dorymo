import React, { useState } from 'react';
import { useEcosystem, SANDBOX_ACCOUNTS } from '../context/EcosystemContext';
import { IntentCategory, TicketLifecycleStatus, ServiceRequirementTicket } from '../types';
import {
  Wrench,
  Laptop,
  Layers,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Plus,
  MapPin,
  DollarSign,
  Lock,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  FileText,
  User,
  Sparkles,
  Phone,
  X,
  ChevronRight,
  Send,
  Eye,
  AlertTriangle,
  UserCheck,
  Star,
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

export const CustomerPortal: React.FC = () => {
  const {
    currentUser,
    activeSession,
    openAuthGate,
    tickets,
    postRequirementTicket,
    customerAssignProvider,
    customerReleaseEscrow,
    customerDisputeTicket,
    cancelCustomerTicket,
    savedAddresses,
    setDefaultAddress,
    addressPrivacySettings,
    toggleAddressPrivacy,
    bookings,
    disputes,
    userLocation,
  } = useEcosystem();

  const [activeTab, setActiveTab] = useState<'tickets' | 'addresses' | 'bookings' | 'disputes'>('tickets');
  const [ticketFilter, setTicketFilter] = useState<'all' | TicketLifecycleStatus>('all');
  
  // Post Requirement Modal
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [reqTitle, setReqTitle] = useState('');
  const [reqCategory, setReqCategory] = useState<IntentCategory>('home_repair');
  const [reqDescription, setReqDescription] = useState('');
  const [reqLocation, setReqLocation] = useState(userLocation || 'House 42, Road 11, Block D, Banani, Dhaka');
  const [reqBudgetBDT, setReqBudgetBDT] = useState<number>(35000);

  // Escrow Release Modal
  const [releaseModalTicket, setReleaseModalTicket] = useState<ServiceRequirementTicket | null>(null);
  const [releaseConfirmed, setReleaseConfirmed] = useState(false);

  // Dispute Modal
  const [disputeModalTicket, setDisputeModalTicket] = useState<ServiceRequirementTicket | null>(null);
  const [disputeReason, setDisputeReason] = useState('Incomplete workmanship or missing deliverables');
  const [disputeDetails, setDisputeDetails] = useState('');

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auth Guard: if not authenticated as customer
  if (!currentUser || currentUser.role !== 'customer') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-white/10 bg-zinc-950 p-8 text-center space-y-4 shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/10 text-orange-400">
            <User className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <span className="font-mono text-xs uppercase font-bold text-orange-400">
              /portal/customer // AUTH REQUIRED
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Customer Requester Portal
            </h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              Please sign in with your customer account to post repair or digital requirements, inspect contractor triage, and release escrow payments.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => openAuthGate('customer', 'customer_portal')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-xs font-bold text-black hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20"
            >
              <span>Sign In / Register as Customer</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    if (ticketFilter === 'all') return true;
    return t.status === ticketFilter;
  });

  // Ticket counts
  const pendingCount = tickets.filter((t) => t.status === 'pending_admin_review').length;
  const approvedCount = tickets.filter((t) => t.status === 'approved_open_for_interest').length;
  const interestCount = tickets.filter((t) => t.status === 'interest_expressed').length;
  const inProgressCount = tickets.filter((t) => t.status === 'assigned_in_progress').length;
  const proofSubmittedCount = tickets.filter((t) => t.status === 'proof_submitted').length;
  const completedCount = tickets.filter((t) => t.status === 'completed_released').length;

  const handlePostTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim() || !reqDescription.trim()) {
      showToast('Please provide a title and description.');
      return;
    }

    const newTicket = postRequirementTicket({
      customerId: currentUser.id,
      customerName: currentUser.name,
      customerPhone: currentUser.phone || '+880 1712-234567',
      title: reqTitle.trim(),
      category: reqCategory,
      description: reqDescription.trim(),
      locationArea: reqLocation.trim(),
      budgetBDT: Number(reqBudgetBDT) || 25000,
    });

    setIsPostModalOpen(false);
    setReqTitle('');
    setReqDescription('');
    showToast(`Requirement ticket #${newTicket.id} submitted for Admin Triage!`);
  };

  const handleConfirmRelease = () => {
    if (!releaseModalTicket) return;
    customerReleaseEscrow(releaseModalTicket.id);
    showToast(`Escrow of ${formatCurrency(releaseModalTicket.budgetBDT || releaseModalTicket.estimatedBudget || 0)} released to contractor!`);
    setReleaseModalTicket(null);
    setReleaseConfirmed(false);
  };

  const handleConfirmDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeModalTicket) return;
    const reasonText = disputeDetails ? `${disputeReason}: ${disputeDetails}` : disputeReason;
    customerDisputeTicket(disputeModalTicket.id, reasonText);
    showToast(`Dispute lodged for #${disputeModalTicket.id}. Escrow frozen in platform arbitration.`);
    setDisputeModalTicket(null);
    setDisputeDetails('');
  };

  const handleAssignProvider = (ticketId: string, providerId: string) => {
    const providerAccount = SANDBOX_ACCOUNTS.provider.find((p) => p.id === providerId);
    const providerName = providerAccount?.name || 'Verified Contractor';
    customerAssignProvider(ticketId, providerId, providerName);
    showToast(`Assigned ${providerName} to job! Status updated to In-Progress.`);
  };

  const applyTemplate = (type: 'electrical' | 'agent' | 'thermal') => {
    if (type === 'electrical') {
      setReqCategory('home_repair');
      setReqTitle('Emergency 200A Main Distribution Panel Arcing Diagnostics');
      setReqDescription('Audible buzzing and voltage flickering detected on main busbar. Need CCB-licensed electrician for infrared scan and circuit remediation.');
      setReqBudgetBDT(35000);
      setReqLocation('House 42, Road 11, Block D, Banani, Dhaka');
    } else if (type === 'agent') {
      setReqCategory('digital_gig');
      setReqTitle('Agentic AI Routing & Latency Optimization Pipeline');
      setReqDescription('Integrate fallback routing between Gemini 2.0 and Claude 3.5 Sonnet. Implement Redis vector caching and streaming SSE endpoint with sub-second p99 latency.');
      setReqBudgetBDT(45000);
      setReqLocation('Digital Remote Cloud Workspace');
    } else {
      setReqCategory('equipment_rental');
      setReqTitle('Fluke Ti480 PRO Thermal Camera Rental for Industrial Audit');
      setReqDescription('Require calibrated high-resolution thermal imaging camera for 3-day substation switchgear predictive maintenance inspection.');
      setReqBudgetBDT(18500);
      setReqLocation('Plot 18, Sector 3, Uttara, Dhaka');
    }
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
              /portal/customer
            </span>
            <span className="font-mono text-xs text-zinc-500">Requester Directory</span>
            <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
              ACTIVE SESSION: {currentUser.name}
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Customer Requester & Dispatch Center
          </h1>
          <p className="mt-1 text-xs text-zinc-400 max-w-2xl">
            Post service or repair requirements, review interested verified contractors, track active doorstep work, and release escrow payments upon completion.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsPostModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-black shadow-lg shadow-orange-500/20 hover:bg-orange-400 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Post New Service Requirement</span>
          </button>
        </div>
      </div>

      {/* Telemetry / Status Pill Bar */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Active Tickets</span>
            <Clock className="h-3.5 w-3.5 text-orange-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{tickets.length}</div>
          <div className="mt-0.5 text-[10px] text-zinc-500">In dispatch lifecycle</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Triage Pending</span>
            <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400 font-mono">{pendingCount}</div>
          <div className="mt-0.5 text-[10px] text-zinc-500">Awaiting Admin inspection</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Providers Interested</span>
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-cyan-400 font-mono">{interestCount}</div>
          <div className="mt-0.5 text-[10px] text-zinc-500">Ready for contractor selection</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Proof Under Review</span>
            <Lock className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-400 font-mono">{proofSubmittedCount}</div>
          <div className="mt-0.5 text-[10px] text-purple-300">Ready for escrow release</div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-950 p-1 text-xs">
          <button
            onClick={() => setActiveTab('tickets')}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-colors',
              activeTab === 'tickets' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Clock className="h-3.5 w-3.5 text-orange-400" />
            <span>Service Requirements & Ledger ({tickets.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-colors',
              activeTab === 'addresses' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <MapPin className="h-3.5 w-3.5 text-orange-400" />
            <span>Saved Addresses ({savedAddresses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-colors',
              activeTab === 'bookings' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <FileText className="h-3.5 w-3.5 text-orange-400" />
            <span>Catalog Bookings ({bookings.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Dispatch Tickets & Lifecycle Ledger */}
      {activeTab === 'tickets' && (
        <div className="space-y-6">
          {/* Sub-Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setTicketFilter('all')}
              className={cn(
                'rounded-lg px-2.5 py-1 font-medium transition-colors',
                ticketFilter === 'all'
                  ? 'bg-orange-500 text-black font-semibold'
                  : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'
              )}
            >
              All ({tickets.length})
            </button>
            <button
              onClick={() => setTicketFilter('pending_admin_review')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-colors',
                ticketFilter === 'pending_admin_review'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Pending Review ({pendingCount})
            </button>
            <button
              onClick={() => setTicketFilter('approved_open_for_interest')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-colors',
                ticketFilter === 'approved_open_for_interest'
                  ? 'bg-orange-500 text-black font-semibold'
                  : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
              Approved Open ({approvedCount})
            </button>
            <button
              onClick={() => setTicketFilter('interest_expressed')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-colors',
                ticketFilter === 'interest_expressed'
                  ? 'bg-cyan-500 text-black font-semibold'
                  : 'bg-zinc-900 border border-cyan-500/30 text-cyan-300 hover:text-white'
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Providers Interested ({interestCount})
            </button>
            <button
              onClick={() => setTicketFilter('assigned_in_progress')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-colors',
                ticketFilter === 'assigned_in_progress'
                  ? 'bg-blue-500 text-white font-semibold'
                  : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              In Progress ({inProgressCount})
            </button>
            <button
              onClick={() => setTicketFilter('proof_submitted')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-colors',
                ticketFilter === 'proof_submitted'
                  ? 'bg-purple-500 text-white font-semibold'
                  : 'bg-zinc-900 border border-purple-500/30 text-purple-300 hover:text-white'
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
              Proof Submitted ({proofSubmittedCount})
            </button>
            <button
              onClick={() => setTicketFilter('completed_released')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-colors',
                ticketFilter === 'completed_released'
                  ? 'bg-emerald-500 text-black font-semibold'
                  : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Completed ({completedCount})
            </button>
          </div>

          {/* Ticket Feed */}
          {filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/30 p-12 text-center">
              <Clock className="h-10 w-10 text-zinc-600 mb-3" />
              <h3 className="text-base font-semibold text-white">No service tickets in this view</h3>
              <p className="mt-1 text-xs text-zinc-400 max-w-md">
                Post your repair or digital gig requirement. Platform moderators will review and dispatch qualified contractors.
              </p>
              <button
                onClick={() => setIsPostModalOpen(true)}
                className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-black hover:bg-orange-400"
              >
                Post New Service Requirement
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((t) => {
                const isPending = t.status === 'pending_admin_review';
                const isApproved = t.status === 'approved_open_for_interest';
                const hasInterest = t.status === 'interest_expressed';
                const isInProgress = t.status === 'assigned_in_progress';
                const isProofSubmitted = t.status === 'proof_submitted';
                const isCompleted = t.status === 'completed_released';
                const isDisputed = t.status === 'disputed';

                return (
                  <div
                    key={t.id}
                    className={cn(
                      'rounded-2xl border p-5 transition-all',
                      hasInterest
                        ? 'border-cyan-500/50 bg-gradient-to-b from-cyan-950/20 to-zinc-950 shadow-xl'
                        : isProofSubmitted
                        ? 'border-purple-500/60 bg-gradient-to-b from-purple-950/20 to-zinc-950 shadow-xl'
                        : isDisputed
                        ? 'border-red-500/40 bg-zinc-950'
                        : 'border-white/10 bg-zinc-900/60'
                    )}
                  >
                    {/* Header Row */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-orange-400">{t.id}</span>
                          <span className="text-zinc-600">•</span>
                          <span className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                            {t.category === 'home_repair' && <Wrench className="h-3 w-3 text-orange-400" />}
                            {t.category === 'digital_gig' && <Laptop className="h-3 w-3 text-cyan-400" />}
                            {t.category === 'equipment_rental' && <Layers className="h-3 w-3 text-emerald-400" />}
                            <span className="capitalize">{t.category.replace('_', ' ')}</span>
                          </span>

                          <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-400 border border-emerald-500/30">
                            <Lock className="h-2.5 w-2.5" />
                            <span>ESCROW: {formatCurrency(t.budgetBDT || t.estimatedBudget || 0)}</span>
                          </span>
                        </div>

                        <h3 className="text-lg font-semibold text-white tracking-tight">{t.title}</h3>
                      </div>

                      {/* Status Pill */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider',
                            isPending && 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
                            isApproved && 'bg-orange-500/20 text-orange-400 border border-orange-500/40',
                            hasInterest && 'bg-cyan-500 text-black font-bold animate-pulse shadow-lg shadow-cyan-500/30',
                            isInProgress && 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
                            isProofSubmitted && 'bg-purple-500 text-white animate-pulse shadow-lg shadow-purple-500/30',
                            isCompleted && 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
                            isDisputed && 'bg-red-500/20 text-red-400 border border-red-500/40',
                            t.status === 'admin_rejected' && 'bg-zinc-800 text-zinc-400 line-through'
                          )}
                        >
                          {t.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="mt-3 text-xs leading-relaxed text-zinc-300">{t.description}</p>

                    {/* Metadata Strip */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3.5 text-xs text-zinc-400">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                          <span className="font-mono text-zinc-300">{t.locationArea}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="font-mono font-semibold text-white">
                            Budget: {formatCurrency(t.budgetBDT || t.estimatedBudget || 0)}
                          </span>
                        </div>
                      </div>

                      {t.selectedProviderName && (
                        <div className="flex items-center gap-2 rounded-lg bg-zinc-950 px-2.5 py-1 text-[11px] border border-white/5">
                          <User className="h-3 w-3 text-blue-400" />
                          <span className="text-zinc-400">Assigned Contractor:</span>
                          <span className="font-semibold text-white">{t.selectedProviderName}</span>
                        </div>
                      )}
                    </div>

                    {/* Admin Review Notes (if available) */}
                    {t.adminNotes && (
                      <div className="mt-3 rounded-lg border border-white/5 bg-zinc-950/60 p-2.5 text-xs text-zinc-300 flex items-start gap-2">
                        <ShieldCheck className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-mono text-[10px] uppercase text-orange-400 font-bold block">
                            Platform Dispatcher Notes:
                          </span>
                          <p className="text-[11px] text-zinc-400 mt-0.5">{t.adminNotes}</p>
                        </div>
                      </div>
                    )}

                    {/* ACTION AREA 1: INTEREST EXPRESSED -> ASSIGN PROVIDER */}
                    {hasInterest && t.interestedProviderIds.length > 0 && !t.selectedProviderId && (
                      <div className="mt-4 rounded-xl border border-cyan-500/40 bg-cyan-950/20 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-cyan-300">
                            <Sparkles className="h-4 w-4 text-cyan-400" />
                            <span className="font-bold text-xs uppercase tracking-wider">
                              Verified Contractors Expressed Interest ({t.interestedProviderIds.length})
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-400">Review & select your contractor</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {t.interestedProviderIds.map((provId) => {
                            const prov = SANDBOX_ACCOUNTS.provider.find((p) => p.id === provId) || {
                              id: provId,
                              name: 'Verified Contractor Trade',
                              tradeTitle: 'Master Contractor',
                              rating: 5.0,
                              avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop',
                            };

                            return (
                              <div
                                key={provId}
                                className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-900/80 p-3"
                              >
                                <div className="flex items-center gap-3">
                                  <img src={prov.avatar} alt={prov.name} className="h-10 w-10 rounded-full object-cover border border-cyan-500/30" />
                                  <div className="text-xs">
                                    <div className="font-bold text-white flex items-center gap-1.5">
                                      <span>{prov.name}</span>
                                      <span className="rounded bg-emerald-500/20 px-1 text-[9px] text-emerald-400 font-mono">
                                        ★ {prov.rating}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-zinc-400 mt-0.5">{prov.tradeTitle}</div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleAssignProvider(t.id, prov.id)}
                                  className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-cyan-400 transition-all shadow-md shadow-cyan-500/20 shrink-0"
                                >
                                  Accept & Assign
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ACTION AREA 2: PROOF SUBMITTED -> RELEASE ESCROW OR DISPUTE */}
                    {isProofSubmitted && (
                      <div className="mt-4 rounded-xl border border-purple-500/40 bg-purple-950/30 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-purple-300">
                            <Sparkles className="h-4 w-4 text-purple-400" />
                            <span className="font-semibold text-xs uppercase tracking-wider">
                              Proof-of-Work Deliverables Submitted by Contractor
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-purple-300">
                            Awaiting Customer Escrow Release
                          </span>
                        </div>

                        {t.proofNote && (
                          <div className="rounded-lg bg-zinc-950/70 p-3 text-xs text-zinc-300 border border-white/5">
                            <span className="font-mono text-[10px] text-purple-400 uppercase font-bold block mb-1">
                              Contractor Completion Note:
                            </span>
                            <p>{t.proofNote}</p>
                          </div>
                        )}

                        {t.proofOfWorkUrl && (
                          <div className="flex items-center gap-3">
                            <img
                              src={t.proofOfWorkUrl}
                              alt="Proof of work"
                              className="h-16 w-24 rounded-lg object-cover border border-purple-500/30"
                            />
                            <div className="text-xs">
                              <span className="font-medium text-white block">Deliverables Photo Attached</span>
                              <a
                                href={t.proofOfWorkUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-flex items-center gap-1 text-[11px] text-purple-400 hover:underline"
                              >
                                View full resolution proof <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          <button
                            onClick={() => {
                              setReleaseModalTicket(t);
                              setReleaseConfirmed(false);
                            }}
                            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all active:scale-95"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Verify Work & Release Escrow ({formatCurrency(t.budgetBDT || t.estimatedBudget || 0)})</span>
                          </button>
                          <button
                            onClick={() => setDisputeModalTicket(t)}
                            className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                          >
                            <AlertCircle className="h-4 w-4" />
                            <span>Raise Dispute & Freeze Escrow</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Cancel action if still in pending */}
                    {isPending && (
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => {
                            cancelCustomerTicket(t.id);
                            showToast(`Ticket #${t.id} has been cancelled.`);
                          }}
                          className="text-[11px] text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          Cancel Request
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Saved Addresses */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {savedAddresses.map((addr) => (
              <div
                key={addr.id}
                className={cn(
                  'rounded-xl border p-4 transition-all',
                  addr.isDefault ? 'border-orange-500/50 bg-zinc-900/80' : 'border-white/10 bg-zinc-900/40'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-400" />
                    <span className="text-sm font-semibold text-white">{addr.label}</span>
                  </div>
                  {addr.isDefault ? (
                    <span className="rounded bg-orange-500/20 px-2 py-0.5 text-[10px] font-semibold text-orange-400">
                      DEFAULT DISPATCH
                    </span>
                  ) : (
                    <button
                      onClick={() => setDefaultAddress(addr.id)}
                      className="text-[11px] text-zinc-400 hover:text-white"
                    >
                      Set as Default
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs text-zinc-300">{addr.street}</p>
                <p className="text-xs text-zinc-400">
                  {addr.city}, ZIP {addr.zip}
                </p>
                {addr.notes && <p className="mt-2 text-[11px] text-zinc-500 italic">"{addr.notes}"</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Catalog Bookings */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-8 text-center text-zinc-400 text-xs">
              No catalog bookings completed yet. Browse services or rent tools to see bookings here.
            </div>
          ) : (
            bookings.map((b) => (
              <div key={b.id} className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">{b.title}</div>
                  <span className="font-mono text-xs font-bold text-orange-400">{formatCurrency(b.amount)}</span>
                </div>
                <div className="mt-1 text-xs text-zinc-400">
                  Provider: {b.providerOrOwner} • Date: {b.date} • Slot: {b.timeSlot}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* POST REQUIREMENT MODAL */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-zinc-950 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Post New Service Requirement</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Your ticket enters Platform Triage moderation before being approved to the verified contractor lead pool.
                </p>
              </div>
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:text-white hover:bg-zinc-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Fast-Fill Demo Presets */}
            <div>
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block mb-1.5">
                Fast-Fill Demo Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyTemplate('electrical')}
                  className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-xs text-orange-300 hover:bg-orange-500/20"
                >
                  ⚡ Electrical Arcing (৳35,000)
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('agent')}
                  className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-300 hover:bg-cyan-500/20"
                >
                  🤖 Agentic AI API (৳45,000)
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('thermal')}
                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20"
                >
                  📷 Thermal Imager (৳18,500)
                </button>
              </div>
            </div>

            <form onSubmit={handlePostTicket} className="space-y-4">
              {/* Category Selector */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Service Category</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReqCategory('home_repair')}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-lg border p-2.5 text-xs font-medium transition-all',
                      reqCategory === 'home_repair'
                        ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                        : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
                    )}
                  >
                    <Wrench className="h-3.5 w-3.5" />
                    <span>Home Repair</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReqCategory('digital_gig')}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-lg border p-2.5 text-xs font-medium transition-all',
                      reqCategory === 'digital_gig'
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                        : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
                    )}
                  >
                    <Laptop className="h-3.5 w-3.5" />
                    <span>Digital Gig</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReqCategory('equipment_rental')}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-lg border p-2.5 text-xs font-medium transition-all',
                      reqCategory === 'equipment_rental'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
                    )}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Rental Tool</span>
                  </button>
                </div>
              </div>

              {/* Requirement Title */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Title / Fault Summary</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Breaker Panel Arcing & Smart Load Center Upgrade"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Fault Description */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Detailed Fault Description & Safety Scope
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Specify symptoms, equipment model, observed hazards, or technical constraints..."
                  value={reqDescription}
                  onChange={(e) => setReqDescription(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Location & Budget in BDT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Location / Area</label>
                  <input
                    type="text"
                    required
                    value={reqLocation}
                    onChange={(e) => setReqLocation(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Estimated Budget in BDT (৳)
                  </label>
                  <input
                    type="number"
                    min={500}
                    step={500}
                    required
                    value={reqBudgetBDT}
                    onChange={(e) => setReqBudgetBDT(Number(e.target.value))}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="rounded-lg border border-white/10 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-black hover:bg-orange-400 shadow-lg shadow-orange-500/20"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Submit to Admin Moderation Queue</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ESCROW RELEASE MODAL */}
      {releaseModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-emerald-500/50 bg-zinc-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Authorize Escrow Release</h3>
              </div>
              <button
                onClick={() => setReleaseModalTicket(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Contract Ticket:</span>
                <span className="font-mono text-white font-medium">{releaseModalTicket.id}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Contractor:</span>
                <span className="text-white font-medium">{releaseModalTicket.selectedProviderName || 'Assigned Contractor'}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Escrow Payout Due:</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  {formatCurrency(releaseModalTicket.budgetBDT || releaseModalTicket.estimatedBudget || 0)}
                </span>
              </div>
            </div>

            {releaseModalTicket.proofNote && (
              <div className="rounded-lg bg-zinc-900 p-3 text-xs text-zinc-300">
                <span className="font-mono text-[10px] text-zinc-500 uppercase block mb-1">Proof Deliverable Note:</span>
                <p>{releaseModalTicket.proofNote}</p>
              </div>
            )}

            <label className="flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={releaseConfirmed}
                onChange={(e) => setReleaseConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-emerald-600 bg-zinc-900 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-xs text-emerald-300">
                I verify that the work has been delivered and inspected satisfactorily and authorize
                immediate release of escrow funds to the contractor.
              </span>
            </label>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setReleaseModalTicket(null)}
                className="rounded-lg border border-white/10 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300"
              >
                Cancel
              </button>
              <button
                disabled={!releaseConfirmed}
                onClick={handleConfirmRelease}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all',
                  releaseConfirmed
                    ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                )}
              >
                <CheckCircle className="h-4 w-4" />
                <span>Confirm & Release Escrow Payment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISPUTE MODAL */}
      {disputeModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-red-500/50 bg-zinc-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <h3 className="text-base font-bold text-white">Raise Dispute & Freeze Escrow</h3>
              </div>
              <button
                onClick={() => setDisputeModalTicket(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDispute} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Reason for Dispute</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                >
                  <option value="Incomplete workmanship or missing deliverables">Incomplete workmanship or missing deliverables</option>
                  <option value="Property damage or site hazard">Property damage or site hazard</option>
                  <option value="Contractor no-show or severe delay">Contractor no-show or severe delay</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Grievance Details</label>
                <textarea
                  required
                  rows={3}
                  value={disputeDetails}
                  onChange={(e) => setDisputeDetails(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDisputeModalTicket(null)}
                  className="rounded-lg border border-white/10 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 shadow-lg shadow-red-500/20"
                >
                  Freeze Escrow & Send to Moderator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
