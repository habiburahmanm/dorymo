import React, { useState, useMemo } from 'react';
import { useEcosystem } from '../context/EcosystemContext';
import { BookingRecord } from '../types';
import {
  ShoppingBag,
  Trash2,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  Truck,
  CreditCard,
  Building,
  Sparkles,
  Plus,
  Minus,
  AlertTriangle,
  Calendar,
  Phone,
  Wallet,
  Zap,
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import {
  type BangladeshGateway,
  GATEWAY_METADATA,
  executeBangladeshPayment,
} from '../lib/payment/bangladeshGateways';

export const HybridCheckout: React.FC = () => {
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    completeCheckout,
    setCurrentView,
    savedAddresses,
    userLocation,
    consumerProfile,
    seedAuthenticRegistry,
  } = useEcosystem();

  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);
  const [confirmedBookings, setConfirmedBookings] = useState<BookingRecord[]>([]);
  const [escrowAccepted, setEscrowAccepted] = useState(true);
  const [inspectionSigned, setInspectionSigned] = useState(true);

  // Bangladesh Local Payment Gateways State
  const [selectedGateway, setSelectedGateway] = useState<BangladeshGateway>('bkash');
  const [customerPhone, setCustomerPhone] = useState(consumerProfile?.phone || '+880 1712-234567');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedPaymentTrx, setCompletedPaymentTrx] = useState<string | null>(null);

  const activeAddress = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];

  const serviceItems = useMemo(() => cart.filter((i) => i.kind === 'service'), [cart]);
  const equipmentItems = useMemo(() => cart.filter((i) => i.kind === 'equipment'), [cart]);

  // Multi-Provider Detection
  const distinctProviders = useMemo(() => {
    return Array.from(new Set(cart.map((i) => i.providerName)));
  }, [cart]);

  // Schedule Collision / Mismatched Slot Detection
  const scheduleConflicts = useMemo(() => {
    const conflicts: string[] = [];
    const slotMap = new Map<string, string>();
    for (const item of cart) {
      if (item.scheduledDate && item.scheduledSlot) {
        const key = `${item.scheduledDate} @ ${item.scheduledSlot}`;
        if (slotMap.has(key)) {
          conflicts.push(`"${item.title}" overlaps with "${slotMap.get(key)}" at ${key}.`);
        } else {
          slotMap.set(key, item.title);
        }
      }
    }
    return conflicts;
  }, [cart]);

  const totalServiceLabor = useMemo(
    () => serviceItems.reduce((acc, i) => acc + i.basePrice * i.quantityOrHours, 0),
    [serviceItems]
  );

  const totalEquipmentRental = useMemo(
    () => equipmentItems.reduce((acc, i) => acc + i.basePrice * i.quantityOrHours, 0),
    [equipmentItems]
  );

  const totalEscrowDepositHold = useMemo(
    () => equipmentItems.reduce((acc, i) => acc + i.securityDeposit, 0),
    [equipmentItems]
  );

  const platformSafetyFee = Math.round((totalServiceLabor + totalEquipmentRental) * 0.05);
  const totalChargedNow = totalServiceLabor + totalEquipmentRental + platformSafetyFee;

  const handleFinishCheckout = async () => {
    setIsProcessing(true);
    try {
      const paymentResult = await executeBangladeshPayment(
        selectedGateway,
        `PAY-${Date.now()}`,
        totalChargedNow,
        totalEscrowDepositHold,
        customerPhone
      );
      const bookings = completeCheckout({
        gateway: selectedGateway,
        trxId: paymentResult.trxId,
        phone: customerPhone,
      });
      setCompletedPaymentTrx(paymentResult.trxId);
      setConfirmedBookings(bookings);
      setCheckoutStep(3);
    } catch (err) {
      console.error('Checkout processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0 && checkoutStep !== 3) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-zinc-950">
          <ShoppingBag className="h-8 w-8 text-zinc-600" />
        </div>
        <h3 className="text-xl font-semibold text-white">Your Mixed Cart is Empty</h3>
        <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
          Explore our unified ecosystem to book doorstep technicians or rent specialized equipment with smart escrow deposit holds.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setCurrentView('service_finder')}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-orange-400"
          >
            <span>Explore Services & Inventory</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              seedAuthenticRegistry();
              setCurrentView('service_finder');
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-zinc-900 px-4 py-2.5 text-xs font-medium text-zinc-300 hover:text-white"
          >
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            <span>Seed Baseline Registry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Checkout Progress Stepper */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 uppercase font-semibold">
              Split-Flow Hybrid Protocol
            </span>
            <span className="text-zinc-600">//</span>
            <span className="font-mono text-xs text-zinc-400">Escrow Contract Engine</span>
          </div>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            {checkoutStep === 3 ? 'Booking & Escrow Confirmed' : 'Mixed-Cart Split-Flow Checkout'}
          </h2>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className={cn('px-2.5 py-1 rounded', checkoutStep === 1 ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-500')}>
            1. Cart & Logistics
          </span>
          <span className="text-zinc-600">&rarr;</span>
          <span className={cn('px-2.5 py-1 rounded', checkoutStep === 2 ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-500')}>
            2. Escrow & Authorization
          </span>
          <span className="text-zinc-600">&rarr;</span>
          <span className={cn('px-2.5 py-1 rounded', checkoutStep === 3 ? 'bg-emerald-500/20 text-emerald-400 font-medium' : 'text-zinc-500')}>
            3. Confirmation
          </span>
        </div>
      </div>

      {/* STEP 1 & 2: CART OR ESCROW FLOW */}
      {checkoutStep < 3 && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Multi-Provider Alert Callout */}
            {distinctProviders.length > 1 && (
              <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-xs text-orange-300 flex items-start gap-3">
                <Building className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">
                    Multi-Provider Mixed Cart ({distinctProviders.length} Distinct Entities):
                  </span>{' '}
                  This order coordinates dispatches across separate verified vendors:{' '}
                  <span className="font-mono text-white">{distinctProviders.join(' • ')}</span>.
                  Separate dispatch manifests and completion milestones will be generated upon checkout.
                </div>
              </div>
            )}

            {/* Scheduling Conflict Alert */}
            {scheduleConflicts.length > 0 && (
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-xs text-yellow-300 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Scheduling Collision Detected:</span>
                  <ul className="mt-1 list-disc list-inside space-y-0.5 font-mono text-[11px] text-yellow-200">
                    {scheduleConflicts.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                  <span className="mt-1 block text-zinc-400 text-[11px]">
                    Technicians will arrive at the same destination window. You may proceed if concurrent labor is intended.
                  </span>
                </div>
              </div>
            )}

            {checkoutStep === 1 && (
              <div className="space-y-6">
                {/* Services Section */}
                {serviceItems.length > 0 && (
                  <div className="rounded-xl border border-white/10 bg-zinc-950 p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <span className="font-mono text-xs uppercase tracking-wider text-zinc-300 font-semibold flex items-center gap-2">
                        <span>Doorstep & Digital Services ({serviceItems.length})</span>
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono">Released on Milestone Completion</span>
                    </div>

                    <div className="space-y-3">
                      {serviceItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 rounded-lg border border-white/5 bg-zinc-900/60 p-4"
                        >
                          <div className="space-y-1">
                            <span className="font-mono text-[10px] text-orange-400 uppercase bg-orange-500/10 px-1.5 py-0.5 rounded">
                              {item.intent.replace('_', ' ')}
                            </span>
                            <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                            <p className="text-xs text-zinc-400">
                              Provider: <span className="text-zinc-200 font-medium">{item.providerName}</span>
                            </p>
                            {item.providerPhone && (
                              <p className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                                <Phone className="h-3 w-3 text-orange-400" />
                                <span>Hotline: {item.providerPhone}</span>
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 pt-1">
                              <span className="flex items-center gap-1 font-mono">
                                <Clock className="h-3 w-3 text-zinc-500" />
                                {item.scheduledSlot}
                              </span>
                              <span className="flex items-center gap-1 font-mono">
                                <Calendar className="h-3 w-3 text-zinc-500" />
                                {item.scheduledDate}
                              </span>
                              <span className="capitalize">{item.fulfillmentType?.replace('_', ' ')}</span>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 self-stretch border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                            <div className="flex items-center gap-2">
                              {/* Quantity / Hours Controls (Zero Quantity Handling) */}
                              <div className="flex items-center border border-white/10 rounded bg-zinc-950 px-1 py-0.5">
                                <button
                                  type="button"
                                  onClick={() => updateCartQuantity(item.id, item.quantityOrHours - 1)}
                                  className="p-1 text-zinc-400 hover:text-white"
                                  title="Decrease hours (removes at 0)"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="px-2 text-xs font-mono text-white">
                                  {item.quantityOrHours}h
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateCartQuantity(item.id, item.quantityOrHours + 1)}
                                  className="p-1 text-zinc-400 hover:text-white"
                                  title="Increase hours"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>

                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <span className="font-mono text-sm font-semibold text-white">
                              {formatCurrency(item.basePrice * item.quantityOrHours)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Equipment Section with Escrow Flag */}
                {equipmentItems.length > 0 && (
                  <div className="rounded-xl border border-orange-500/30 bg-zinc-950 p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-orange-400" />
                        <span className="font-mono text-xs uppercase tracking-wider text-zinc-200 font-semibold">
                          Specialized Equipment & Security Escrow ({equipmentItems.length})
                        </span>
                      </div>
                      <span className="text-[11px] text-orange-400 font-mono">
                        Escrow Deposit Held Separately
                      </span>
                    </div>

                    <div className="space-y-3">
                      {equipmentItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 rounded-lg border border-white/5 bg-zinc-900/60 p-4"
                        >
                          <div className="space-y-1">
                            <span className="font-mono text-[10px] text-zinc-400 uppercase bg-zinc-800 px-1.5 py-0.5 rounded">
                              Tool Custody Lease
                            </span>
                            <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                            <p className="text-xs text-zinc-400">
                              Depot Owner: <span className="text-zinc-200 font-medium">{item.providerName}</span>
                            </p>
                            {item.providerPhone && (
                              <p className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                                <Phone className="h-3 w-3 text-orange-400" />
                                <span>Depot Hotline: {item.providerPhone}</span>
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 pt-1">
                              <span className="font-mono text-orange-400">
                                Segregated Deposit: {formatCurrency(item.securityDeposit)}
                              </span>
                              <span className="capitalize">{item.fulfillmentType?.replace('_', ' ')}</span>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 self-stretch border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                            <div className="flex items-center gap-2">
                              {/* Quantity / Days Controls (Zero Quantity Handling) */}
                              <div className="flex items-center border border-white/10 rounded bg-zinc-950 px-1 py-0.5">
                                <button
                                  type="button"
                                  onClick={() => updateCartQuantity(item.id, item.quantityOrHours - 1)}
                                  className="p-1 text-zinc-400 hover:text-white"
                                  title="Decrease days (removes at 0)"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="px-2 text-xs font-mono text-white">
                                  {item.quantityOrHours}d
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateCartQuantity(item.id, item.quantityOrHours + 1)}
                                  className="p-1 text-zinc-400 hover:text-white"
                                  title="Increase days"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>

                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                                title="Remove tool"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <span className="font-mono text-sm font-semibold text-white">
                              {formatCurrency(item.basePrice * item.quantityOrHours)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dispatch Destination Info */}
                <div className="rounded-xl border border-white/10 bg-zinc-950 p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-zinc-900 text-orange-400">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-mono text-[10px] uppercase text-zinc-500">Dispatch Location</span>
                      <h4 className="text-sm font-semibold text-white">
                        {userLocation || (activeAddress ? `${activeAddress.street}, ${activeAddress.city}` : 'Banani, Dhaka')}
                      </h4>
                      <p className="text-xs text-zinc-400">
                        {activeAddress?.street ? `${activeAddress.street} • ` : ''}Active Service Territory
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentView('consumer_account')}
                    className="text-xs text-orange-400 hover:underline"
                  >
                    Change Address / Territory
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: ESCROW AGREEMENT & PAYMENT AUTHORIZATION */}
            {checkoutStep === 2 && (
              <div className="space-y-6">
                <div className="rounded-xl border border-white/10 bg-zinc-950 p-6 space-y-5">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    <div>
                      <h3 className="text-base font-semibold text-white">
                        Smart Escrow Deposit & Damage Hold Agreement
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Cryptographically backed escrow release contract for equipment custody and service milestones.
                      </p>
                    </div>
                  </div>

                  {/* Escrow Rule Accordion */}
                  <div className="space-y-3 text-xs text-zinc-300">
                    <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-4 space-y-2">
                      <div className="flex items-center justify-between text-orange-400 font-mono text-[11px] font-semibold">
                        <span>1. STATUTORILY SEGREGATED ESCROW SECURITY DEPOSIT HOLD</span>
                        <span>{formatCurrency(totalEscrowDepositHold)}</span>
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        This amount is <strong>NEVER</strong> charged as labor or platform fees. It is held as an authorization hold in a segregated client trust escrow account. The hold cannot be commingled with operating revenue.
                      </p>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-zinc-900/50 p-4 space-y-2">
                      <div className="flex items-center justify-between text-emerald-400 font-mono text-[11px] font-semibold">
                        <span>2. SERVICE COMPLETION MILESTONE ESCROW</span>
                        <span>{formatCurrency(totalServiceLabor)}</span>
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Funds for doorstep technicians or digital deliverables are deposited into milestone escrow. The provider is not disbursed payment until proof-of-work completion or 24 hours elapse with zero dispute claims.
                      </p>
                    </div>

                    {/* 4-Stage Return Inspection Protocol */}
                    {totalEscrowDepositHold > 0 && (
                      <div className="rounded-lg border border-white/10 bg-zinc-900/30 p-4 space-y-2.5">
                        <span className="font-semibold text-zinc-200 font-mono text-[11px] uppercase block">
                          3. Automated Return Inspection Release Criteria (4-Stage Protocol):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div className="rounded border border-white/5 bg-zinc-950 p-2.5 space-y-1">
                            <span className="text-orange-400 font-mono block font-semibold">Stage A: Pre-Dispatch Baseline</span>
                            <span className="text-zinc-400 block">Serial verification, battery health audit, and high-res timestamped condition photos recorded in custody contract.</span>
                          </div>
                          <div className="rounded border border-white/5 bg-zinc-950 p-2.5 space-y-1">
                            <span className="text-orange-400 font-mono block font-semibold">Stage B: Handover Check-In</span>
                            <span className="text-zinc-400 block">Digital handover sign-off via courier or 24/7 smart depot lockbox NFC handshake.</span>
                          </div>
                          <div className="rounded border border-white/5 bg-zinc-950 p-2.5 space-y-1">
                            <span className="text-orange-400 font-mono block font-semibold">Stage C: Return Diagnostic Scan</span>
                            <span className="text-zinc-400 block">Drop-off depot optical comparison scan & motor run test against pre-dispatch baseline.</span>
                          </div>
                          <div className="rounded border border-white/5 bg-zinc-950 p-2.5 space-y-1">
                            <span className="text-emerald-400 font-mono block font-semibold">Stage D: Algorithmic Release</span>
                            <span className="text-zinc-400 block">Upon clean diagnostic pass, authorization hold is released within 120 minutes with zero manual mediation required.</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mandatory Checkbox Consents */}
                  <div className="space-y-2 pt-2 text-xs">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={escrowAccepted}
                        onChange={(e) => setEscrowAccepted(e.target.checked)}
                        className="mt-0.5 accent-orange-500 rounded"
                      />
                      <span className="text-zinc-300">
                        I authorize the platform escrow hold of <strong>{formatCurrency(totalEscrowDepositHold)}</strong> and accept the condition check-in guidelines.
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inspectionSigned}
                        onChange={(e) => setInspectionSigned(e.target.checked)}
                        className="mt-0.5 accent-orange-500 rounded"
                      />
                      <span className="text-zinc-300">
                        I confirm the doorstep address is accessible for dispatch and equipment drop-off.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Bangladesh Local Payment & Escrow Gateways */}
                <div className="rounded-xl border border-white/10 bg-zinc-950 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-orange-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
                        Bangladesh Local Payment Gateway
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                      BDT Escrow Enabled
                    </span>
                  </div>

                  {/* Gateway Selector Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(['bkash', 'nagad', 'sslcommerz', 'rocket'] as BangladeshGateway[]).map((gw) => {
                      const meta = GATEWAY_METADATA[gw];
                      const isSelected = selectedGateway === gw;
                      return (
                        <button
                          key={gw}
                          type="button"
                          onClick={() => setSelectedGateway(gw)}
                          className={cn(
                            'flex flex-col text-left p-3 rounded-lg border transition-all',
                            isSelected
                              ? 'border-orange-500 bg-orange-500/10 shadow-sm'
                              : 'border-white/10 bg-zinc-900/60 hover:border-white/20'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className={cn('font-bold text-xs tracking-tight', meta.color)}>
                              {meta.logoText}
                            </span>
                            {isSelected && (
                              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                            )}
                          </div>
                          <span className="text-[11px] font-medium text-white mt-1">
                            {meta.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 truncate mt-0.5">
                            {meta.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Customer Phone verification for Bangladesh MFS / OTP */}
                  <div className="rounded-lg border border-white/5 bg-zinc-900/40 p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-300 font-medium">Customer Mobile Wallet / SMS OTP:</span>
                      <span className="text-orange-400 font-mono text-[10px]">Verified MFS</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-white/10 bg-zinc-950 text-xs font-mono text-zinc-300">
                        <Phone className="h-3 w-3 text-orange-400" />
                        <span>BD</span>
                      </div>
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+880 1712-XXXXXX"
                        className="flex-1 rounded border border-white/10 bg-zinc-950 px-3 py-1.5 text-xs font-mono text-white focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      Escrow deposit refund (৳{totalEscrowDepositHold.toLocaleString()}) will be credited automatically to this {GATEWAY_METADATA[selectedGateway].logoText} account upon verified return inspection.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Summary Sidebar (Split Breakdown) */}
          <div className="lg:col-span-4">
            <div className="sticky top-20 rounded-xl border border-white/10 bg-zinc-950 p-6 space-y-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 font-mono border-b border-white/10 pb-4">
                Split Financial Ledger
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-zinc-300">
                  <span>Doorstep & Digital Labor</span>
                  <span className="font-mono">{formatCurrency(totalServiceLabor)}</span>
                </div>

                <div className="flex items-center justify-between text-zinc-300">
                  <span>Tool & Machinery Rental</span>
                  <span className="font-mono">{formatCurrency(totalEquipmentRental)}</span>
                </div>

                <div className="flex items-center justify-between text-zinc-300">
                  <span>Platform Bond & Insurance (5%)</span>
                  <span className="font-mono">{formatCurrency(platformSafetyFee)}</span>
                </div>

                <div className="border-t border-white/10 pt-3 flex items-center justify-between text-sm font-semibold text-white">
                  <span>Total Due Today</span>
                  <span className="font-mono text-base text-white">{formatCurrency(totalChargedNow)}</span>
                </div>

                {/* Segregated Escrow Hold Row */}
                {totalEscrowDepositHold > 0 && (
                  <div className="mt-3 rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between text-orange-300 font-semibold font-mono">
                      <span className="flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5" />
                        <span>Escrow Deposit Hold</span>
                      </span>
                      <span>{formatCurrency(totalEscrowDepositHold)}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400">
                      Temporarily held on card; released in full upon equipment check-in inspection.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                {checkoutStep === 1 && (
                  <button
                    onClick={() => setCheckoutStep(2)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-500 py-3 font-semibold text-black transition-colors hover:bg-orange-400 text-xs"
                  >
                    <span>Proceed to Escrow Authorization</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}

                {checkoutStep === 2 && (
                  <button
                    onClick={handleFinishCheckout}
                    disabled={!escrowAccepted || !inspectionSigned || isProcessing}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500 py-3 font-semibold text-black transition-colors hover:bg-emerald-400 disabled:opacity-40 text-xs"
                  >
                    {isProcessing ? (
                      <>
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                        <span>Connecting {GATEWAY_METADATA[selectedGateway].logoText}...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Authorize via {GATEWAY_METADATA[selectedGateway].logoText} & Confirm</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: BOOKING CONFIRMATION SCREEN */}
      {checkoutStep === 3 && (
        <div className="mx-auto max-w-2xl rounded-xl border border-emerald-500/30 bg-zinc-950 p-8 text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Dispatches Confirmed & Escrow Bound
            </h3>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
              Your mixed-cart booking is active in our state graph. Provider notifications have been dispatched, and equipment lockboxes have generated your access PINs.
            </p>
          </div>

          {/* Itemized Confirmation List */}
          <div className="rounded-lg border border-white/10 bg-zinc-900/50 p-4 text-left text-xs space-y-3 font-mono">
            {/* Bangladesh Payment Gateway Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 text-[11px]">
              <div className="flex items-center gap-2">
                <span className={cn('px-2 py-0.5 rounded font-bold uppercase', GATEWAY_METADATA[selectedGateway].color, 'bg-zinc-800 border border-white/10')}>
                  {GATEWAY_METADATA[selectedGateway].logoText}
                </span>
                <span className="text-zinc-300">Transaction ID:</span>
                <span className="text-white font-semibold">{completedPaymentTrx || 'BKH-PENDING'}</span>
              </div>
              <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Escrow Hold Activated
              </span>
            </div>

            <div className="text-zinc-500 text-[11px] uppercase border-b border-white/5 pb-2">
              Generated Booking Contracts ({confirmedBookings.length}):
            </div>
            {confirmedBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-zinc-300">
                <div>
                  <span className="block font-medium text-white">{b.title}</span>
                  <span className="text-[10px] text-zinc-500 block">
                    Vendor: {b.providerOrOwner} • {b.date} ({b.timeSlot})
                  </span>
                  {b.providerPhone && (
                    <span className="text-[10px] text-orange-400 flex items-center gap-1 font-mono mt-0.5">
                      <Phone className="h-2.5 w-2.5" />
                      Direct Line: {b.providerPhone}
                    </span>
                  )}
                  {b.paymentGateway && (
                    <span className="text-[9px] text-zinc-500 block mt-0.5">
                      Paid via: {b.paymentGateway.toUpperCase()} ({b.gatewayTrxId})
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-white font-semibold block">{formatCurrency(b.amount)}</span>
                  {b.depositHold ? (
                    <span className="text-[10px] text-orange-400">Escrow: {formatCurrency(b.depositHold)}</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setCurrentView('consumer_account')}
              className="rounded-lg bg-orange-500 px-5 py-2.5 text-xs font-semibold text-black hover:bg-orange-400 transition-colors"
            >
              Track Dispatches in Account Center &rarr;
            </button>
            <button
              onClick={() => {
                setCheckoutStep(1);
                setCurrentView('service_finder');
              }}
              className="rounded-lg border border-white/10 bg-zinc-900 px-4 py-2.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Back to Marketplace
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
