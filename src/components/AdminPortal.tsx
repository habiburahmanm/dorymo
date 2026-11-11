import React, { useState } from 'react';
import { useEcosystem, SANDBOX_ACCOUNTS } from '../context/EcosystemContext';
import { ServiceRequirementTicket, TicketLifecycleStatus } from '../types';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  UserCheck,
  FileText,
  DollarSign,
  MapPin,
  Laptop,
  Wrench,
  Layers,
  ArrowRight,
  Eye,
  Edit3,
  RefreshCw,
  Sparkles,
  Sliders,
  Scale,
  Activity,
  X,
  Phone,
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

export const AdminPortal: React.FC = () => {
  const {
    currentUser,
    activeSession,
    loginAdminPin,
    loginAsAccount,
    switchUserRole,
    tickets,
    adminApproveTicket,
    adminRejectTicket,
    adminAssignTicketToProvider,
    adminResolveTicketDispute,
    resetTicketsToBaseline,
    providerKYC,
    approveKYCInstantly,
    resetKYCToUnverified,
    updateProviderKYC,
    setCurrentView,
  } = useEcosystem();

  const [activeTab, setActiveTab] = useState<'triage' | 'disputes' | 'kyc' | 'graph'>('triage');
  const [triageFilter, setTriageFilter] = useState<'pending' | 'all' | 'disputed' | 'active'>('pending');

  // Inspection Drawer/Modal State
  const [inspectTicket, setInspectTicket] = useState<ServiceRequirementTicket | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [adjustedBudget, setAdjustedBudget] = useState<number>(0);
  const [selectedProviderId, setSelectedProviderId] = useState('prov-vance-01');
  const [selectedProviderName, setSelectedProviderName] = useState('Vance Engineering & Logistics');

  // Rejection Modal
  const [rejectTicketTarget, setRejectTicketTarget] = useState<ServiceRequirementTicket | null>(null);
  const [rejectReason, setRejectReason] = useState('Scope does not meet platform technical feasibility or safety thresholds.');

  // Dispute Arbitration Modal
  const [arbitrateTicket, setArbitrateTicket] = useState<ServiceRequirementTicket | null>(null);
  const [arbitrationNotes, setArbitrationNotes] = useState('');

  // Passkey State for Backoffice Gate
  const [passkey, setPasskey] = useState('');
  const [passkeyError, setPasskeyError] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Ticket metrics
  const pendingTickets = tickets.filter((t) => t.status === 'pending_admin_review');
  const activeContracts = tickets.filter(
    (t) => t.status === 'assigned_in_progress' || t.status === 'proof_submitted' || (t.status as string) === 'work_submitted'
  );
  const disputedTickets = tickets.filter((t) => t.status === 'disputed');
  const totalHeldEscrow = tickets
    .filter((t) => t.status !== 'completed_released' && t.status !== 'admin_rejected' && (t.status as string) !== 'completed')
    .reduce((acc, t) => acc + (t.budgetBDT ?? t.estimatedBudget ?? 0), 0);

  // If user is not authenticated as admin, show Protected Backoffice Gate
  if (!currentUser || currentUser.role !== 'admin') {
    const handlePasskeySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const success = loginAdminPin(passkey);
      if (success) {
        showToast('Authenticated as Chief Dispatch Officer (PIN Authorized).');
      } else {
        setPasskeyError(true);
        setTimeout(() => setPasskeyError(false), 3000);
      }
    };

    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-orange-500/40 bg-orange-500/10">
              <Lock className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase font-bold text-orange-400">
                  /gatekeeper-admin
                </span>
                <span className="rounded bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/20">
                  RESTRICTED ELEVATED GATE
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight mt-1">
                NexServe Dispatch & Triage Backoffice Gate
              </h2>
            </div>
          </div>

          <p className="mt-4 text-xs text-zinc-400 leading-relaxed">
            This administrative backoffice controls platform service request validation, budget adjustments in BDT (৳), contractor dispatch routing, and escrow dispute arbitration. Only authorized platform dispatchers may enter.
          </p>

          <div className="mt-8 rounded-xl border border-white/5 bg-zinc-900/60 p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              One-Click Administrator Pass-Through:
            </h3>
            <button
              onClick={() => {
                loginAdminPin('2026');
                showToast('Welcome to Dispatch Backoffice, Chief Dispatch Officer.');
              }}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-xs font-semibold text-black hover:bg-orange-400 shadow-lg shadow-orange-500/20 transition-all active:scale-95"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Authenticate as Chief Dispatch Officer (Admin Sandbox)</span>
            </button>

            <div className="relative flex items-center justify-center text-xs">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative bg-zinc-900 px-3 text-[11px] font-mono text-zinc-500 uppercase">
                Or Verify With Security PIN / Master Key
              </span>
            </div>

            <form onSubmit={handlePasskeySubmit} className="space-y-3">
              <div>
                <input
                  type="password"
                  placeholder="Enter dispatch PIN (PIN: 2026 or dispatch2026)"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  className={cn(
                    'w-full rounded-lg border bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors font-mono',
                    passkeyError
                      ? 'border-red-500 ring-1 ring-red-500'
                      : 'border-white/10 focus:border-orange-500'
                  )}
                />
                {passkeyError && (
                  <p className="mt-1 text-[11px] text-red-400">Invalid PIN. Use demo PIN: 2026</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-700 transition-colors"
              >
                Submit Authorization PIN
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Admin Authenticated View
  const handleOpenInspect = (ticket: ServiceRequirementTicket) => {
    setInspectTicket(ticket);
    setAdminNotes(ticket.adminNotes || ticket.adminReviewNotes || 'Verified safety specifications and budget validity. Approved for contractor pool.');
    setAdjustedBudget(ticket.budgetBDT ?? ticket.estimatedBudget ?? 25000);
  };

  const handleApprove = () => {
    if (!inspectTicket) return;
    adminApproveTicket(inspectTicket.id, adjustedBudget, adminNotes);
    showToast(`Ticket #${inspectTicket.id} APPROVED and routed to provider marketplace!`);
    setInspectTicket(null);
  };

  const handleDirectDispatch = () => {
    if (!inspectTicket) return;
    adminAssignTicketToProvider(inspectTicket.id, selectedProviderId, selectedProviderName, adminNotes);
    showToast(`Ticket #${inspectTicket.id} directly dispatched to ${selectedProviderName}!`);
    setInspectTicket(null);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTicketTarget) return;
    adminRejectTicket(rejectTicketTarget.id, rejectReason);
    showToast(`Ticket #${rejectTicketTarget.id} REJECTED. Customer notified and escrow refunded.`);
    setRejectTicketTarget(null);
    setRejectReason('');
  };

  const handleResolveDispute = (outcome: 'refund_customer' | 'release_provider') => {
    if (!arbitrateTicket) return;
    adminResolveTicketDispute(
      arbitrateTicket.id,
      outcome,
      arbitrationNotes || `Arbitration resolved with outcome: ${outcome.replace('_', ' ')}.`
    );
    showToast(`Dispute for #${arbitrateTicket.id} settled. Escrow disbursed.`);
    setArbitrateTicket(null);
    setArbitrationNotes('');
  };

  const filteredTriageList = tickets.filter((t) => {
    if (triageFilter === 'pending') return t.status === 'pending_admin_review';
    if (triageFilter === 'disputed') return t.status === 'disputed';
    if (triageFilter === 'active') {
      return t.status === 'assigned_in_progress' || t.status === 'proof_submitted' || (t.status as string) === 'work_submitted';
    }
    return true;
  });

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
              /gatekeeper-admin
            </span>
            <span className="font-mono text-xs text-zinc-500">Platform Validator & Dispatcher</span>
            <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              TRIAGE ACTIVE
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Triage & Moderated Dispatch Backoffice
          </h1>
          <p className="mt-1 text-xs text-zinc-400 max-w-2xl">
            Inspect inbound customer requirements, verify safety and technical scope, authorize contractor pool bidding in BDT (৳), and mediate escrow disputes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={resetTicketsToBaseline}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Reset tickets to default authentic scenarios"
          >
            <RefreshCw className="h-3.5 w-3.5 text-orange-400" />
            <span>Reset Demo Graph</span>
          </button>
          <button
            onClick={() => setCurrentView('intent_router')}
            className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Exit Backoffice
          </button>
        </div>
      </div>

      {/* Admin Telemetry Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Triage Queue</span>
            <Clock className="h-4 w-4 animate-spin text-amber-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-amber-300 font-mono">
            {pendingTickets.length}
          </div>
          <div className="mt-0.5 text-[11px] text-amber-400/80">Pending dispatcher inspection</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Vault Escrow</span>
            <Lock className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-400 font-mono">
            {formatCurrency(totalHeldEscrow)}
          </div>
          <div className="mt-0.5 text-[11px] text-zinc-500">Funded & held under platform lock</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Under Dispatch</span>
            <Wrench className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-blue-400 font-mono">
            {activeContracts.length}
          </div>
          <div className="mt-0.5 text-[11px] text-zinc-500">Active claimed contractor contracts</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Arbitration Cases</span>
            <Scale className="h-4 w-4 text-red-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-red-400 font-mono">
            {disputedTickets.length}
          </div>
          <div className="mt-0.5 text-[11px] text-zinc-500">Escrow dispute mediations</div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-950 p-1 text-xs">
          <button
            onClick={() => setActiveTab('triage')}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-colors',
              activeTab === 'triage' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>Triage Queue ({pendingTickets.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('disputes')}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-colors',
              activeTab === 'disputes' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Scale className="h-3.5 w-3.5 text-red-400" />
            <span>Dispute & Arbitration Engine ({disputedTickets.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('kyc')}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-colors',
              activeTab === 'kyc' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Provider KYC & Credentials</span>
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-colors',
              activeTab === 'graph' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Activity className="h-3.5 w-3.5 text-orange-400" />
            <span>Moderated Dispatch Graph</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Triage Queue */}
      {activeTab === 'triage' && (
        <div className="space-y-6">
          {/* Sub Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setTriageFilter('pending')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-colors',
                triageFilter === 'pending'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'
              )}
            >
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              Pending Review Only ({pendingTickets.length})
            </button>
            <button
              onClick={() => setTriageFilter('all')}
              className={cn(
                'rounded-lg px-3 py-1.5 font-medium transition-colors',
                triageFilter === 'all'
                  ? 'bg-zinc-700 text-white'
                  : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'
              )}
            >
              All Platform Tickets ({tickets.length})
            </button>
            <button
              onClick={() => setTriageFilter('active')}
              className={cn(
                'rounded-lg px-3 py-1.5 font-medium transition-colors',
                triageFilter === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'
              )}
            >
              Claimed & In-Progress ({activeContracts.length})
            </button>
            <button
              onClick={() => setTriageFilter('disputed')}
              className={cn(
                'rounded-lg px-3 py-1.5 font-medium transition-colors',
                triageFilter === 'disputed'
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'
              )}
            >
              Disputed ({disputedTickets.length})
            </button>
          </div>

          {/* Triage List */}
          {filteredTriageList.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/40 p-12 text-center">
              <CheckCircle className="h-12 w-12 text-emerald-400 mb-3" />
              <h3 className="text-base font-semibold text-white">Triage Queue is Clear</h3>
              <p className="mt-1 text-xs text-zinc-400 max-w-sm">
                No customer requirements currently require administrative validation or dispatch routing.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTriageList.map((t) => {
                const isPending = t.status === 'pending_admin_review';
                const isApproved = t.status === 'approved_open_for_interest' || (t.status as string) === 'approved_for_bidding';
                const isInterest = t.status === 'interest_expressed';
                const isAssigned = t.status === 'assigned_in_progress';
                const isWorkSubmitted = t.status === 'proof_submitted' || (t.status as string) === 'work_submitted';
                const isDisputed = t.status === 'disputed';
                const budgetAmount = t.budgetBDT ?? t.estimatedBudget ?? 0;

                return (
                  <div
                    key={t.id}
                    className={cn(
                      'rounded-2xl border p-5 transition-all',
                      isPending
                        ? 'border-amber-500/40 bg-zinc-950/80 shadow-lg shadow-amber-950/20'
                        : isDisputed
                        ? 'border-red-500/40 bg-zinc-950'
                        : 'border-white/10 bg-zinc-900/60'
                    )}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-orange-400">{t.id}</span>
                          <span className="text-zinc-600">•</span>
                          <span className="text-xs text-zinc-400">Customer: <strong className="text-white">{t.customerName}</strong></span>
                          <span className="text-zinc-600">•</span>
                          <span className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                            {t.category === 'home_repair' && <Wrench className="h-3 w-3 text-orange-400" />}
                            {t.category === 'digital_gig' && <Laptop className="h-3 w-3 text-cyan-400" />}
                            {t.category === 'equipment_rental' && <Layers className="h-3 w-3 text-emerald-400" />}
                            <span className="capitalize">{t.category.replace('_', ' ')}</span>
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white tracking-tight">{t.title}</h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            'rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider',
                            isPending && 'bg-amber-500 text-black animate-pulse font-bold',
                            (isApproved || isInterest) && 'bg-orange-500/20 text-orange-400 border border-orange-500/40',
                            isAssigned && 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
                            isWorkSubmitted && 'bg-purple-500/20 text-purple-400 border border-purple-500/40',
                            isDisputed && 'bg-red-500/20 text-red-400 border border-red-500/40',
                            t.status === 'completed_released' && 'bg-emerald-500/20 text-emerald-400',
                            t.status === 'admin_rejected' && 'bg-zinc-800 text-zinc-500 line-through'
                          )}
                        >
                          {t.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    <p className="mt-2.5 text-xs text-zinc-300 leading-relaxed">{t.description}</p>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3.5 text-xs">
                      <div className="flex flex-wrap items-center gap-4 text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                          <span className="font-mono text-zinc-300">{t.locationArea || t.addressMasked}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="font-mono font-bold text-white">
                            Budget: {formatCurrency(budgetAmount)} ({t.escrowStatus?.toUpperCase() || 'ESCROW HELD'})
                          </span>
                        </div>
                        {(t.selectedProviderName || t.assignedProviderName) && (
                          <div className="flex items-center gap-1.5 text-blue-300">
                            <span>Contractor:</span>
                            <strong className="text-white">{t.selectedProviderName || t.assignedProviderName}</strong>
                          </div>
                        )}
                      </div>

                      {/* Admin Actions */}
                      <div className="flex items-center gap-2">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleOpenInspect(t)}
                              className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-orange-400 transition-all shadow-md shadow-orange-500/20 active:scale-95"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span>Inspect & Validate</span>
                            </button>
                            <button
                              onClick={() => setRejectTicketTarget(t)}
                              className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {(isApproved || isInterest) && (
                          <button
                            onClick={() => handleOpenInspect(t)}
                            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
                          >
                            <Sliders className="h-3.5 w-3.5 text-orange-400" />
                            <span>Adjust / Direct Dispatch</span>
                          </button>
                        )}

                        {isDisputed && (
                          <button
                            onClick={() => {
                              setArbitrateTicket(t);
                              setArbitrationNotes(t.adminNotes || t.adminReviewNotes || '');
                            }}
                            className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 shadow-md shadow-red-500/20"
                          >
                            <Scale className="h-3.5 w-3.5" />
                            <span>Arbitrate Dispute</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {(t.adminNotes || t.adminReviewNotes) && (
                      <div className="mt-3 rounded-lg border border-white/5 bg-zinc-950 p-2.5 text-xs text-zinc-400 flex items-start gap-2">
                        <FileText className="h-3.5 w-3.5 text-orange-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-mono text-[10px] text-orange-400 uppercase font-semibold">Dispatcher Log:</span>
                          <span className="ml-1 text-zinc-300">{t.adminNotes || t.adminReviewNotes}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Dispute & Arbitration Engine */}
      {activeTab === 'disputes' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-red-500/30 bg-zinc-950 p-6">
            <div className="flex items-center gap-2.5 text-red-400 mb-2">
              <Scale className="h-5 w-5" />
              <h3 className="text-base font-bold text-white tracking-tight">Escrow Dispute & Arbitration Console</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
              As platform moderator, you hold binding escrow arbitration authority. Review customer fault claims, contractor proof-of-work submissions, and determine fund disbursement in BDT (৳).
            </p>
          </div>

          {disputedTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/40 p-12 text-center">
              <ShieldCheck className="h-10 w-10 text-emerald-400 mb-3" />
              <h3 className="text-base font-semibold text-white">Zero Active Escrow Disputes</h3>
              <p className="mt-1 text-xs text-zinc-400">All contractor engagements and rental returns are in healthy standing.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputedTickets.map((t) => {
                const budgetAmount = t.budgetBDT ?? t.estimatedBudget ?? 0;
                return (
                  <div key={t.id} className="rounded-2xl border border-red-500/40 bg-zinc-950 p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-red-400">{t.id}</span>
                          <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300">
                            ESCROW FROZEN: {formatCurrency(budgetAmount)}
                          </span>
                        </div>
                        <h4 className="mt-1.5 text-base font-bold text-white">{t.title}</h4>
                        <p className="mt-1 text-xs text-zinc-400">
                          Customer: <strong className="text-white">{t.customerName}</strong> • Contractor: <strong className="text-white">{t.selectedProviderName || t.assignedProviderName || 'Assigned Specialist'}</strong>
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setArbitrateTicket(t);
                          setArbitrationNotes(t.adminNotes || t.adminReviewNotes || '');
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 shadow-lg shadow-red-500/20 shrink-0"
                      >
                        <Scale className="h-4 w-4" />
                        <span>Execute Arbitration Hearing</span>
                      </button>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-zinc-900/60 p-3.5 text-xs space-y-2">
                      <span className="font-mono text-[10px] uppercase text-red-400 font-bold block">
                        Customer Grievance & Scope Failure:
                      </span>
                      <p className="text-zinc-300">{t.adminNotes || t.adminReviewNotes || t.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Provider KYC & Credentials */}
      {activeTab === 'kyc' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Contractor Credential & KYC Validator</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Verify Construction Contractors Board (CCB) licenses, surety bonds, and general liability insurance.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    approveKYCInstantly();
                    showToast('Contractor credentials verified and approved!');
                  }}
                  className="rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
                >
                  Authorize Full Verification
                </button>
                <button
                  onClick={() => {
                    resetKYCToUnverified();
                    showToast('KYC reset to unverified.');
                  }}
                  className="rounded-lg border border-white/10 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Revoke Verification
                </button>
              </div>
            </div>

            {/* KYC Details Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-white/5 bg-zinc-950 p-5 text-xs">
              <div className="space-y-2.5">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-400">Legal Entity:</span>
                  <span className="font-semibold text-white">{providerKYC.legalName}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-400">Registration Number:</span>
                  <span className="font-mono text-zinc-200">{providerKYC.businessRegNumber}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-400">Contractor License:</span>
                  <span className="font-mono text-orange-400 font-semibold">{providerKYC.contractorLicenseNumber}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-400">Licensing Board:</span>
                  <span className="text-zinc-200">{providerKYC.licenseBoard}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-400">Surety Bond Amount:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{formatCurrency(providerKYC.suretyBondAmount)}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-400">Liability Policy:</span>
                  <span className="font-mono text-zinc-200">{providerKYC.liabilityPolicyNumber}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-400">Background Clearance:</span>
                  <span className="text-emerald-400 font-semibold">VERIFIED & PASSED</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-400">Platform Badge:</span>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    {providerKYC.idVerified ? 'BONDED MASTER CONTRACTOR' : 'UNVERIFIED'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Moderated Dispatch Graph Monitor */}
      {activeTab === 'graph' && (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Triage & Moderated Dispatch State Graph</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Visual architectural map of all ticket lifecycles passing through platform dispatch validation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-4 text-center">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block">1. Customer Inbound</span>
              <div className="mt-2 text-2xl font-bold font-mono text-white">
                {tickets.length}
              </div>
              <span className="text-[10px] text-zinc-400 mt-1 block">Total Submissions</span>
            </div>

            <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 text-center">
              <span className="text-[10px] font-mono text-amber-400 uppercase block">2. Triage Queue</span>
              <div className="mt-2 text-2xl font-bold font-mono text-amber-300">
                {pendingTickets.length}
              </div>
              <span className="text-[10px] text-amber-400/80 mt-1 block">Awaiting Dispatch</span>
            </div>

            <div className="rounded-xl border border-orange-500/40 bg-orange-950/20 p-4 text-center">
              <span className="text-[10px] font-mono text-orange-400 uppercase block">3. Provider Pool</span>
              <div className="mt-2 text-2xl font-bold font-mono text-orange-300">
                {tickets.filter((t) => t.status === 'approved_open_for_interest' || t.status === 'interest_expressed' || (t.status as string) === 'approved_for_bidding').length}
              </div>
              <span className="text-[10px] text-orange-400/80 mt-1 block">Open for Bidding</span>
            </div>

            <div className="rounded-xl border border-blue-500/40 bg-blue-950/20 p-4 text-center">
              <span className="text-[10px] font-mono text-blue-400 uppercase block">4. In-Progress</span>
              <div className="mt-2 text-2xl font-bold font-mono text-blue-300">
                {tickets.filter((t) => t.status === 'assigned_in_progress').length}
              </div>
              <span className="text-[10px] text-blue-400/80 mt-1 block">Contract Claimed</span>
            </div>

            <div className="rounded-xl border border-purple-500/40 bg-purple-950/20 p-4 text-center">
              <span className="text-[10px] font-mono text-purple-400 uppercase block">5. Work Submitted</span>
              <div className="mt-2 text-2xl font-bold font-mono text-purple-300">
                {tickets.filter((t) => t.status === 'proof_submitted' || (t.status as string) === 'work_submitted').length}
              </div>
              <span className="text-[10px] text-purple-400/80 mt-1 block">Proof Under Review</span>
            </div>

            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 text-center">
              <span className="text-[10px] font-mono text-emerald-400 uppercase block">6. Completed</span>
              <div className="mt-2 text-2xl font-bold font-mono text-emerald-300">
                {tickets.filter((t) => t.status === 'completed_released' || (t.status as string) === 'completed').length}
              </div>
              <span className="text-[10px] text-emerald-400/80 mt-1 block">Escrow Released</span>
            </div>
          </div>
        </div>
      )}

      {/* INSPECTION & TRIAGE MODAL */}
      {inspectTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-orange-500/40 bg-zinc-950 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-orange-400" />
                <h3 className="text-base font-bold text-white">Platform Dispatch Triage & Validation</h3>
              </div>
              <button onClick={() => setInspectTicket(null)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl border border-white/5 bg-zinc-900/60 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Ticket ID:</span>
                <span className="font-mono text-white font-bold">{inspectTicket.id}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Customer Requester:</span>
                <span className="text-white font-semibold">{inspectTicket.customerName}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Customer Phone:</span>
                <span className="text-white font-mono">{inspectTicket.customerPhone || '+880 1712-234567'}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Dispatch Coordinates / Location:</span>
                <span className="font-mono text-zinc-300">{inspectTicket.locationArea || inspectTicket.addressMasked}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Requirement Title:</span>
                <span className="text-orange-400 font-semibold">{inspectTicket.title}</span>
              </div>
              <p className="mt-2 text-zinc-300 leading-relaxed bg-zinc-950 p-2.5 rounded-lg border border-white/5">
                {inspectTicket.description}
              </p>
            </div>

            {/* Triage Adjustments */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Adjust Escrow Budget (৳ / BDT) if scope requires:
                </label>
                <input
                  type="number"
                  value={adjustedBudget}
                  onChange={(e) => setAdjustedBudget(Number(e.target.value))}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Platform Dispatcher Review & Safety Specifications Notes:
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Direct Dispatch Option */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Or Direct Dispatch to Certified Contractor:
                </label>
                <select
                  value={selectedProviderName}
                  onChange={(e) => {
                    setSelectedProviderName(e.target.value);
                    if (e.target.value.includes('Vance')) setSelectedProviderId('prov-vance-01');
                    else if (e.target.value.includes('Apex')) setSelectedProviderId('prov-apex-02');
                    else setSelectedProviderId('prov-hydro-03');
                  }}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="Vance Engineering & Logistics">Vance Engineering & Logistics (CCB Active // Bonded Master)</option>
                  <option value="Apex Cloud & Agentic Systems">Apex Cloud & Agentic Systems (AI Systems Architect)</option>
                  <option value="HydroSafe Master Plumbers">HydroSafe Master Plumbers (Licensed Trade)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => {
                  setRejectTicketTarget(inspectTicket);
                  setInspectTicket(null);
                }}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Reject Ticket
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDirectDispatch}
                  className="rounded-lg border border-white/10 bg-zinc-800 px-3.5 py-2 text-xs font-medium text-white hover:bg-zinc-700"
                >
                  Direct Assign to Contractor
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-black hover:bg-orange-400 shadow-lg shadow-orange-500/20"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Approve & Open for Provider Pool</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectTicketTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-red-500/50 bg-zinc-950 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Reject Service Request Ticket</h3>
            <p className="text-xs text-zinc-400">
              Provide specific regulatory, safety, or scope reasons for rejection. Escrow funds will automatically be refunded to the customer.
            </p>
            <form onSubmit={handleConfirmReject} className="space-y-3">
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectTicketTarget(null)}
                  className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-red-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
                >
                  Confirm Rejection & Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ARBITRATION MODAL */}
      {arbitrateTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-red-500/50 bg-zinc-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-red-400">
                <Scale className="h-5 w-5" />
                <h3 className="text-base font-bold text-white">Dispute Arbitration Hearing</h3>
              </div>
              <button onClick={() => setArbitrateTicket(null)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl border border-white/5 bg-zinc-900/60 p-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Disputed Escrow Amount:</span>
                <span className="font-mono text-red-400 font-bold">
                  {formatCurrency(arbitrateTicket.budgetBDT ?? arbitrateTicket.estimatedBudget ?? 0)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Customer Requester:</span>
                <span className="text-white">{arbitrateTicket.customerName}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Contractor Respondent:</span>
                <span className="text-white">{arbitrateTicket.selectedProviderName || arbitrateTicket.assignedProviderName || 'Assigned Specialist'}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Official Moderator Finding & Arbitration Settlement Note:
              </label>
              <textarea
                rows={3}
                placeholder="Document evidence findings and reasoning for funds settlement..."
                value={arbitrationNotes}
                onChange={(e) => setArbitrationNotes(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleResolveDispute('refund_customer')}
                className="rounded-lg border border-red-500/40 bg-red-950/30 p-2.5 text-xs font-semibold text-red-300 hover:bg-red-950/60 transition-colors text-center"
              >
                100% Refund to Customer
              </button>
              <button
                type="button"
                onClick={() => handleResolveDispute('release_provider')}
                className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 p-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-950/60 transition-colors text-center"
              >
                Disburse 100% to Contractor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
