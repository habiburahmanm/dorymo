import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  IntentCategory,
  AuthRole,
  UserAccount,
  TicketLifecycleStatus,
  ServiceRequirementTicket,
  ServiceListing,
  EquipmentItem,
  SavedAddress,
  BookingRecord,
  DisputeRecord,
  CartItem,
  EcosystemState,
  ProviderKYCData,
  AddressPrivacySettings,
} from '../types';

export type EcosystemView =
  | 'intent_router'
  | 'service_finder'
  | 'customer_portal'
  | 'consumer_account'
  | 'provider_portal'
  | 'admin_portal'
  | 'hybrid_checkout'
  | 'system_inspector'
  | 'design_system';

export const SANDBOX_ACCOUNTS: {
  customer: UserAccount[];
  provider: UserAccount[];
  admin: UserAccount[];
} = {
  customer: [
    {
      id: 'cust-marcus-01',
      name: 'Marcus Vance',
      email: 'marcus.vance@workplace.internal',
      role: 'customer',
      phone: '+880 1712-234567',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
      isVerifiedKYC: true,
      isVerified: true,
    },
    {
      id: 'cust-sarah-02',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@apex.internal',
      role: 'customer',
      phone: '+880 1812-998877',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop',
      isVerifiedKYC: true,
      isVerified: true,
    },
  ],
  provider: [
    {
      id: 'prov-vance-01',
      name: 'Vance Engineering & Logistics',
      email: 'vance.contractor@nexserve.internal',
      role: 'provider',
      phone: '+880 1711-223344',
      tradeTitle: 'Master Licensed Electrician // High-Voltage Specialist',
      rating: 5.0,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop',
      isVerifiedKYC: true,
      isVerified: true,
    },
    {
      id: 'prov-apex-02',
      name: 'Apex Cloud & Agentic Systems',
      email: 'apex.dev@nexserve.internal',
      role: 'provider',
      phone: '+880 1819-556677',
      tradeTitle: 'Senior Full-Stack & AI Systems Architect',
      rating: 4.9,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop',
      isVerifiedKYC: true,
      isVerified: true,
    },
    {
      id: 'prov-hydro-03',
      name: 'HydroSafe Master Plumbers',
      email: 'hydrosafe@nexserve.internal',
      role: 'provider',
      phone: '+880 1912-889900',
      tradeTitle: 'Certified Plumbing Contractor & Slab Diagnostics',
      rating: 4.8,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop',
      isVerifiedKYC: true,
      isVerified: true,
    },
  ],
  admin: [
    {
      id: 'admin-dispatch-hq',
      name: 'Chief Dispatch Officer (HQ)',
      email: 'dispatch.lead@nexserve.internal',
      role: 'admin',
      phone: '+880 1700-000001',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop',
      isVerifiedKYC: true,
      isVerified: true,
    },
  ],
};

// Legacy compatibility demo sessions
export const DEMO_SESSIONS: Record<AuthRole, UserAccount> = {
  customer: SANDBOX_ACCOUNTS.customer[0],
  provider: SANDBOX_ACCOUNTS.provider[0],
  admin: SANDBOX_ACCOUNTS.admin[0],
};

export const baselineTickets: ServiceRequirementTicket[] = [
  {
    id: 'tkt-01-tri',
    customerId: 'cust-marcus-01',
    customerName: 'Marcus Vance',
    customerPhone: '+880 1712-234567',
    title: 'Main Breaker Panel Arcing & Smart Load Center Upgrade',
    category: 'home_repair',
    description: 'Audible arcing and intermittent trip faults detected on primary 200A main service entrance. Requires certified electrician for infrared thermal inspection, breaker torque validation, and potential panel replacement.',
    locationArea: 'House 42, Road 11, Block D, Banani, Dhaka',
    budgetBDT: 35000,
    status: 'pending_admin_review',
    interestedProviderIds: [],
    createdAt: '2026-11-10T14:30:00Z',
    // Compatibility fields
    addressMasked: 'House 42, Road 11, Block D, Banani [Masked]',
    estimatedBudget: 35000,
    escrowStatus: 'funded_held',
  },
  {
    id: 'tkt-02-tri',
    customerId: 'cust-sarah-02',
    customerName: 'Sarah Jenkins',
    customerPhone: '+880 1812-998877',
    title: 'Agentic Tool-Calling API Pipeline Tuning & Vector Cache',
    category: 'digital_gig',
    description: 'Architect multi-provider agent router fallback between Gemini 2.0 and Claude 3.5. Need Redis semantic caching layer, streaming SSE output, and sub-second p99 latency guarantees.',
    locationArea: 'Digital Remote Cloud Workspace',
    budgetBDT: 45000,
    status: 'approved_open_for_interest',
    interestedProviderIds: [],
    adminNotes: 'Verified technical specifications and architectural scope. Escrow pre-funded in platform vault. Open for bidding by Level-3 AI Engineers.',
    createdAt: '2026-11-09T18:15:00Z',
    // Compatibility fields
    addressMasked: 'Digital Cloud Workspace [Encrypted]',
    estimatedBudget: 45000,
    escrowStatus: 'funded_held',
  },
  {
    id: 'tkt-03-tri',
    customerId: 'cust-marcus-01',
    customerName: 'Marcus Vance',
    customerPhone: '+880 1712-234567',
    title: 'Commercial HVAC Halogen Leak Test & Refrigerant Re-charge',
    category: 'home_repair',
    description: 'Server room ductless split unit losing cooling capacity. Nitrogen pressure test conducted, faulty schrader core replaced, and R-410A recharged.',
    locationArea: 'Gulshan-2 Commercial Hub, Dhaka',
    budgetBDT: 22000,
    status: 'interest_expressed',
    interestedProviderIds: ['prov-vance-01', 'prov-hydro-03'],
    adminNotes: 'Verified safety specs. CCB contractor license required.',
    createdAt: '2026-11-08T11:20:00Z',
    addressMasked: 'House 42, Road 11, Banani [Masked]',
    estimatedBudget: 22000,
    escrowStatus: 'funded_held',
  },
  {
    id: 'tkt-04-tri',
    customerId: 'cust-marcus-01',
    customerName: 'Marcus Vance',
    customerPhone: '+880 1712-234567',
    title: 'Fluke Ti480 PRO Thermal Imaging Camera 3-Day Rental',
    category: 'equipment_rental',
    description: 'Require calibrated industrial thermal camera for substation transformer heat distribution and switchgear inspection.',
    locationArea: 'Plot 18, Sector 3, Uttara, Dhaka',
    budgetBDT: 18500,
    status: 'assigned_in_progress',
    interestedProviderIds: ['prov-vance-01'],
    selectedProviderId: 'prov-vance-01',
    selectedProviderName: 'Vance Engineering & Logistics',
    adminNotes: 'Security deposit validated. Dispatch order claimed by Vance Engineering.',
    createdAt: '2026-11-07T09:00:00Z',
    addressMasked: 'Plot 18, Sector 3, Uttara [Masked]',
    estimatedBudget: 18500,
    escrowStatus: 'funded_held',
  },
  {
    id: 'tkt-05-tri',
    customerId: 'cust-sarah-02',
    customerName: 'Sarah Jenkins',
    customerPhone: '+880 1812-998877',
    title: 'Hilti TE 70 Heavy-Duty Rotary Drill & Anchor Setter Rental',
    category: 'equipment_rental',
    description: 'Heavy duty SDS-Max drill rental with dust removal kit for server rack seismic bolting.',
    locationArea: 'Tech Hub, Banani, Dhaka',
    budgetBDT: 9500,
    status: 'proof_submitted',
    interestedProviderIds: ['prov-vance-01'],
    selectedProviderId: 'prov-vance-01',
    selectedProviderName: 'Vance Engineering & Logistics',
    proofNote: 'Equipment demonstrated on site and floor seismic anchors drilled to spec. Equipment returned in clean condition.',
    proofOfWorkUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&auto=format&fit=crop',
    adminNotes: 'Work verified by contractor. Awaiting client escrow release.',
    createdAt: '2026-11-05T16:00:00Z',
    addressMasked: 'Tech Center, Banani',
    estimatedBudget: 9500,
    escrowStatus: 'funded_held',
  },
  {
    id: 'tkt-06-tri',
    customerId: 'cust-marcus-01',
    customerName: 'Marcus Vance',
    customerPhone: '+880 1712-234567',
    title: 'Emergency Trenchless Water Main Leak Remediation',
    category: 'home_repair',
    description: 'Foundation water line breach. Contractor completed pipe lining and certified subfloor pressure seal.',
    locationArea: 'House 42, Road 11, Banani, Dhaka',
    budgetBDT: 28000,
    status: 'completed_released',
    interestedProviderIds: ['prov-vance-01'],
    selectedProviderId: 'prov-vance-01',
    selectedProviderName: 'Vance Engineering & Logistics',
    proofNote: '120 PSI hydro test passed without leakage. Subfloor sealed.',
    proofOfWorkUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop',
    createdAt: '2026-11-04T10:00:00Z',
    addressMasked: 'House 42, Road 11, Banani',
    estimatedBudget: 28000,
    escrowStatus: 'released',
  },
  {
    id: 'tkt-07-tri',
    customerId: 'cust-marcus-01',
    customerName: 'Marcus Vance',
    customerPhone: '+880 1712-234567',
    title: 'Server Room Inverter High-Frequency Ground Fault Audit',
    category: 'home_repair',
    description: 'Ground fault interrupter tripped intermittently. Customer disputing incomplete grounding rod installation.',
    locationArea: 'Banani Sector 3, Dhaka',
    budgetBDT: 15000,
    status: 'disputed',
    interestedProviderIds: ['prov-vance-01'],
    selectedProviderId: 'prov-vance-01',
    selectedProviderName: 'Vance Engineering & Logistics',
    adminNotes: 'Customer flagged missing exterior ground earth rod. Escrow frozen in platform arbitration.',
    createdAt: '2026-11-03T10:00:00Z',
    addressMasked: 'Banani Sector 3',
    estimatedBudget: 15000,
    escrowStatus: 'funded_held',
  },
];

const baselineListings: ServiceListing[] = [
  {
    id: 'srv-base-01',
    providerId: 'prov-vance-01',
    providerName: 'Vance Engineering & Logistics',
    providerTitle: 'Emergency Electrical',
    providerPhone: '+880 1711-223344',
    category: 'home_repair',
    subcategory: 'Emergency Electrical',
    title: 'Master Licensed Electrician // High-Voltage & Panel Diagnostics',
    description: 'Certified electrical contractor specializing in circuit remediation, smart breaker upgrades, EV charger installs, and 24/7 power failure response.',
    rateType: 'hourly',
    rate: 1350,
    location: 'Dhaka Metro & Gulshan Hub',
    serviceRadiusKm: 35,
    availableSlots: ['08:30 AM', '11:00 AM', '01:30 PM', '04:00 PM'],
    rating: 5.0,
    completedJobs: 48,
    verified: true,
    badge: 'Bonded Master Trade',
  },
  {
    id: 'srv-base-02',
    providerId: 'prov-apex-02',
    providerName: 'Apex Cloud & Agentic Systems',
    providerTitle: 'AI Systems Architecture',
    providerPhone: '+880 1819-556677',
    category: 'digital_gig',
    subcategory: 'AI Systems & Cloud Architecture',
    title: 'Lead Full-Stack & Agentic AI Systems Architect',
    description: 'Production engineering for real-time web applications, LLM tool-calling orchestration, Next.js/React 19 performance tuning, and high-security API pipelines.',
    rateType: 'hourly',
    rate: 1750,
    location: 'Global Remote (Dhaka BST / UTC+6)',
    serviceRadiusKm: 0,
    availableSlots: ['10:00 AM BST', '02:00 PM BST', '05:00 PM BST'],
    rating: 4.9,
    completedJobs: 62,
    verified: true,
    badge: 'CCB Elite Dev',
  },
  {
    id: 'srv-base-03',
    providerId: 'prov-hydro-03',
    providerName: 'HydroSafe Master Plumbers',
    providerTitle: 'Emergency Plumbing',
    providerPhone: '+880 1912-889900',
    category: 'home_repair',
    subcategory: 'Emergency Plumbing',
    title: 'Rapid Response Master Plumber // Acoustic Leak & Slab Diagnostics',
    description: 'Trenchless sewer camera inspection, slab leak localization, pressure regulator rebuilds, and hydronic heating balancing.',
    rateType: 'hourly',
    rate: 1250,
    location: 'Dhanmondi & Mirpur Hub',
    serviceRadiusKm: 30,
    availableSlots: ['09:00 AM', '12:00 PM', '03:00 PM'],
    rating: 4.8,
    completedJobs: 37,
    verified: true,
    badge: 'Bonded Master Trade',
  },
];

const baselineEquipment: EquipmentItem[] = [
  {
    id: 'eq-base-01',
    ownerId: 'prov-vance-01',
    ownerName: 'Vance Engineering & Logistics',
    ownerPhone: '+880 1711-223344',
    title: 'Fluke Ti480 PRO Industrial Thermal Imaging Camera (640x480)',
    category: 'Diagnostic & Inspection',
    dailyRate: 850,
    securityDeposit: 4500,
    condition: 'Like New',
    conditionNotes: 'Precision calibrated laser focus, rechargeable batteries + 64GB SD card included.',
    location: 'Gulshan Hardware Depot',
    pickupOption: 'delivery_available',
    availableUnits: 1,
    photos: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop'],
    serialNumber: 'FLK-TI480-991',
    complianceChecked: true,
  },
  {
    id: 'eq-base-02',
    ownerId: 'prov-vance-01',
    ownerName: 'Vance Engineering & Logistics',
    ownerPhone: '+880 1711-223344',
    title: 'Hilti TE 70-ATC/AVR Heavy-Duty SDS-Max Rotary Hammer Drill',
    category: 'Power Tools & Masonry',
    dailyRate: 650,
    securityDeposit: 3000,
    condition: 'Good',
    conditionNotes: 'Includes chisel bits, grease pack, and active vibration reduction safety handle.',
    location: 'Banani Central Depot',
    pickupOption: 'pickup_only',
    availableUnits: 2,
    photos: ['https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop'],
    serialNumber: 'HLT-TE70-5542',
    complianceChecked: true,
  },
];

const defaultProviderKYC: ProviderKYCData = {
  legalName: 'Vance Engineering & Logistics LLC',
  contactPhone: '+880 1711-223344',
  businessRegNumber: 'BD-DHK-994821',
  contractorLicenseNumber: 'RAJUK-239102-ELECT',
  licenseBoard: 'Bangladesh Electrical Licensing Board & CCB',
  licenseStatus: 'active',
  suretyBondNumber: 'BND-88201-SBL',
  suretyBondAmount: 250000,
  suretyBondIssuer: 'Sadharan Bima Corporation',
  bondingStatus: 'bonded',
  liabilityPolicyNumber: 'POL-0091827-CGL',
  liabilityCoverageAmount: 10000000,
  backgroundCheckClearance: true,
  idDocumentType: 'Commercial Contractor License',
  idVerified: true,
  verificationStep: 'approved',
};

const defaultAddresses: SavedAddress[] = [
  {
    id: 'addr-1',
    label: 'Primary Residence',
    street: 'House 42, Road 11, Block D',
    city: 'Banani, Dhaka',
    zip: '1213',
    isDefault: true,
    notes: 'Lift 4, Apt 4B. Technician parking on driveway.',
  },
  {
    id: 'addr-2',
    label: 'Hardware Lab & Workshop',
    street: 'Plot 18, Sector 3',
    city: 'Uttara, Dhaka',
    zip: '1230',
    isDefault: false,
    notes: 'Loading dock in rear for heavy equipment drop-off.',
  },
];

const STORAGE_KEY = 'NEXSERVE_ECOSYSTEM_STATE_V4';

interface EcosystemContextType extends EcosystemState {
  currentView: EcosystemView;
  setCurrentView: (view: EcosystemView) => void;

  // Tri-Portal Auth Engine
  currentUser: UserAccount | null;
  activeSession: UserAccount;
  activeRole: AuthRole;
  activeAuthGate: 'customer' | 'provider' | 'admin' | null;
  openAuthGate: (role: 'customer' | 'provider' | 'admin', returnView?: EcosystemView) => void;
  closeAuthGate: () => void;
  loginAsAccount: (account: UserAccount) => void;
  loginCustomerSandbox: (index?: number) => void;
  loginProviderSandbox: (index?: number) => void;
  loginAdminPin: (pin: string) => boolean;
  signupCustomer: (name: string, email: string, phone: string) => UserAccount;
  signupProvider: (name: string, email: string, phone: string, tradeTitle: string) => UserAccount;
  logout: () => void;
  logoutSession: () => void;
  switchUserRole: (role: AuthRole) => void;
  setActiveRole: (role: AuthRole) => void;

  // Search & Filters
  activeIntent: IntentCategory;
  setActiveIntent: (intent: IntentCategory) => void;
  userLocation: string;
  setUserLocation: (loc: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedSubcategory: string | null;
  setSelectedSubcategory: (subcat: string | null) => void;
  radiusKm: number;
  setRadiusKm: (radius: number) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;

  // Tickets & Moderated Lifecycle
  tickets: ServiceRequirementTicket[];
  postRequirementTicket: (ticket: Omit<ServiceRequirementTicket, 'id' | 'createdAt' | 'status' | 'interestedProviderIds'>) => ServiceRequirementTicket;
  createServiceRequestTicket: (ticket: any) => ServiceRequirementTicket; // Compatibility
  adminApproveTicket: (ticketId: string, adjustedBudgetBDT?: number, adminNotes?: string) => void;
  adminRejectTicket: (ticketId: string, reason: string) => void;
  providerExpressInterest: (ticketId: string, providerId: string) => void;
  providerClaimTicket: (ticketId: string, providerId: string, providerName?: string) => void; // Compatibility
  customerAssignProvider: (ticketId: string, providerId: string, providerName: string) => void;
  adminAssignTicketToProvider: (ticketId: string, providerId: string, providerName: string, notes?: string) => void;
  providerSubmitProofOfWork: (ticketId: string, proofNote: string, proofUrl?: string) => void;
  customerReleaseEscrow: (ticketId: string) => void;
  customerDisputeTicket: (ticketId: string, reason: string) => void;
  adminResolveTicketDispute: (ticketId: string, outcome: 'refund_customer' | 'release_provider', resolutionNote: string) => void;
  cancelCustomerTicket: (ticketId: string) => void;
  resetTicketsToBaseline: () => void;

  // Provider Self-Serve
  addServiceListing: (listing: Omit<ServiceListing, 'id' | 'rating' | 'completedJobs' | 'verified'>) => void;
  deleteServiceListing: (id: string) => void;
  addEquipmentItem: (item: Omit<EquipmentItem, 'id' | 'complianceChecked'>) => void;
  deleteEquipmentItem: (id: string) => void;
  submitProviderKYC: (legalName: string, regNumber: string, docType: string) => void;
  updateProviderKYC: (fields: Partial<ProviderKYCData>) => void;
  approveKYCInstantly: () => void;
  resetKYCToUnverified: () => void;

  // Consumer Profile & Addresses
  updateConsumerProfile: (profile: Partial<EcosystemState['consumerProfile']>) => void;
  addSavedAddress: (address: Omit<SavedAddress, 'id'>) => void;
  deleteSavedAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  toggleAddressPrivacy: (key: keyof AddressPrivacySettings) => void;
  fileDispute: (dispute: Omit<DisputeRecord, 'id' | 'filedAt' | 'status'>) => void;
  resolveDispute: (disputeId: string, resolution: 'refunded' | 'resolved', resolutionNote?: string) => void;
  returnEquipmentAndReleaseEscrow: (bookingId: string, returnCondition: 'clean_pass' | 'damage_detected') => void;

  // Cart & Checkout
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateCartQuantity: (id: string, newQuantity: number) => void;
  clearCart: () => void;
  completeCheckout: (paymentMeta?: {
    gateway: 'bkash' | 'nagad' | 'sslcommerz' | 'rocket';
    trxId: string;
    phone?: string;
  }) => BookingRecord[];

  // Fixtures & Telemetry
  seedAuthenticRegistry: () => void;
  clearAllData: () => void;
  logError: (err: string) => void;
  clearErrors: () => void;
  setVerificationConfidence: (val: number) => void;
}

const EcosystemContext = createContext<EcosystemContextType | undefined>(undefined);

function getInitialViewFromHash(): EcosystemView {
  try {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('admin-terminal') || hash.includes('gatekeeper-admin') || hash.includes('portal/admin')) {
      return 'admin_portal';
    }
    if (hash.includes('portal/provider')) return 'provider_portal';
    if (hash.includes('portal/customer') || hash.includes('consumer')) return 'customer_portal';
    if (hash.includes('explore') || hash.includes('finder')) return 'service_finder';
    if (hash.includes('checkout')) return 'hybrid_checkout';
    if (hash.includes('inspector')) return 'system_inspector';
    if (hash.includes('tokens') || hash.includes('design')) return 'design_system';
  } catch {}
  return 'intent_router';
}

function updateHashForView(view: EcosystemView) {
  try {
    switch (view) {
      case 'customer_portal':
      case 'consumer_account':
        if (window.location.hash !== '#/portal/customer') window.location.hash = '/portal/customer';
        break;
      case 'admin_portal':
        if (window.location.hash !== '#admin-terminal') window.location.hash = '#admin-terminal';
        break;
      case 'provider_portal':
        if (window.location.hash !== '#/portal/provider') window.location.hash = '/portal/provider';
        break;
      case 'service_finder':
        if (window.location.hash !== '#/explore') window.location.hash = '/explore';
        break;
      case 'hybrid_checkout':
        if (window.location.hash !== '#/checkout') window.location.hash = '/checkout';
        break;
      case 'system_inspector':
        if (window.location.hash !== '#/inspector') window.location.hash = '/inspector';
        break;
      case 'design_system':
        if (window.location.hash !== '#/design_system') window.location.hash = '/design_system';
        break;
      case 'intent_router':
      default:
        if (window.location.hash && window.location.hash !== '#/' && window.location.hash !== '#/intent') {
          window.location.hash = '/intent';
        }
        break;
    }
  } catch {}
}

export const EcosystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentViewState] = useState<EcosystemView>(() => getInitialViewFromHash());
  
  const setCurrentView = useCallback((view: EcosystemView) => {
    const target = view === 'consumer_account' ? 'customer_portal' : view;
    setCurrentViewState(target);
    updateHashForView(target);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const v = getInitialViewFromHash();
      setCurrentViewState(v);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Tri-Portal Auth State
  const [currentUser, setCurrentUserState] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_current_user`);
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default to Public Guest (unauthenticated) for unified landing experience
    return null;
  });

  const activeRole: AuthRole = currentUser?.role || 'customer';
  const activeSession: UserAccount = currentUser || SANDBOX_ACCOUNTS.customer[0];

  const setCurrentUser = useCallback((user: UserAccount | null) => {
    setCurrentUserState(user);
    try {
      if (user) {
        localStorage.setItem(`${STORAGE_KEY}_current_user`, JSON.stringify(user));
      } else {
        localStorage.removeItem(`${STORAGE_KEY}_current_user`);
      }
    } catch {}
  }, []);

  // Auth Gate Modal State
  const [activeAuthGate, setActiveAuthGate] = useState<'customer' | 'provider' | 'admin' | null>(null);
  const [authReturnView, setAuthReturnView] = useState<EcosystemView | null>(null);

  const openAuthGate = useCallback((role: 'customer' | 'provider' | 'admin', returnView?: EcosystemView) => {
    setActiveAuthGate(role);
    if (returnView) setAuthReturnView(returnView);
  }, []);

  const closeAuthGate = useCallback(() => {
    setActiveAuthGate(null);
    setAuthReturnView(null);
  }, []);

  const loginAsAccount = useCallback((account: UserAccount) => {
    setCurrentUser(account);
    closeAuthGate();
    if (authReturnView) {
      setCurrentView(authReturnView);
    } else if (account.role === 'customer') {
      setCurrentView('customer_portal');
    } else if (account.role === 'provider') {
      setCurrentView('provider_portal');
    } else if (account.role === 'admin') {
      setCurrentView('admin_portal');
    }
  }, [closeAuthGate, authReturnView, setCurrentView, setCurrentUser]);

  const loginCustomerSandbox = useCallback((index = 0) => {
    const account = SANDBOX_ACCOUNTS.customer[index] || SANDBOX_ACCOUNTS.customer[0];
    loginAsAccount(account);
  }, [loginAsAccount]);

  const loginProviderSandbox = useCallback((index = 0) => {
    const account = SANDBOX_ACCOUNTS.provider[index] || SANDBOX_ACCOUNTS.provider[0];
    loginAsAccount(account);
  }, [loginAsAccount]);

  const loginAdminPin = useCallback((pin: string): boolean => {
    if (pin === '2026' || pin === 'dispatch2026' || pin.toLowerCase() === 'admin') {
      loginAsAccount(SANDBOX_ACCOUNTS.admin[0]);
      return true;
    }
    return false;
  }, [loginAsAccount]);

  const signupCustomer = useCallback((name: string, email: string, phone: string): UserAccount => {
    const newAcc: UserAccount = {
      id: `cust-${Date.now().toString(36)}`,
      name,
      email,
      phone,
      role: 'customer',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      isVerifiedKYC: true,
      isVerified: true,
    };
    loginAsAccount(newAcc);
    return newAcc;
  }, [loginAsAccount]);

  const signupProvider = useCallback((name: string, email: string, phone: string, tradeTitle: string): UserAccount => {
    const newAcc: UserAccount = {
      id: `prov-${Date.now().toString(36)}`,
      name,
      email,
      phone,
      role: 'provider',
      tradeTitle,
      rating: 5.0,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      isVerifiedKYC: true,
      isVerified: true,
    };
    loginAsAccount(newAcc);
    return newAcc;
  }, [loginAsAccount]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setCurrentView('intent_router');
  }, [setCurrentUser, setCurrentView]);

  const logoutSession = logout;

  const switchUserRole = useCallback((role: AuthRole) => {
    const target = SANDBOX_ACCOUNTS[role]?.[0] || SANDBOX_ACCOUNTS.customer[0];
    loginAsAccount(target);
  }, [loginAsAccount]);

  const setActiveRole = switchUserRole;

  // Search & Catalog
  const [activeIntent, setActiveIntent] = useState<IntentCategory>('home_repair');
  const [userLocation, setUserLocationState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_user_location`);
      return saved || 'Banani, Dhaka';
    } catch {
      return 'Banani, Dhaka';
    }
  });

  const setUserLocation = useCallback((loc: string) => {
    setUserLocationState(loc);
    try {
      localStorage.setItem(`${STORAGE_KEY}_user_location`, loc);
    } catch {}
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState(30);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);

  // Moderated Dispatch Tickets State
  const [tickets, setTickets] = useState<ServiceRequirementTicket[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_tickets`);
      if (saved) return JSON.parse(saved);
      return baselineTickets;
    } catch {
      return baselineTickets;
    }
  });

  const [listings, setListings] = useState<ServiceListing[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_listings`);
      if (saved) return JSON.parse(saved);
      return baselineListings;
    } catch {
      return baselineListings;
    }
  });

  const [equipment, setEquipment] = useState<EquipmentItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_equipment`);
      if (saved) return JSON.parse(saved);
      return baselineEquipment;
    } catch {
      return baselineEquipment;
    }
  });

  const [consumerProfile, setConsumerProfile] = useState({
    name: 'Marcus Vance',
    email: 'marcus.vance@workplace.internal',
    phone: '+880 1712-234567',
    kycVerified: true,
  });

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_addresses`);
      return saved ? JSON.parse(saved) : defaultAddresses;
    } catch {
      return defaultAddresses;
    }
  });

  const [addressPrivacySettings, setAddressPrivacySettings] = useState<AddressPrivacySettings>({
    obfuscateUntilEnRoute: true,
    maskDoorstepNumber: false,
    ephemeralAccessCodes: true,
  });

  const [bookings, setBookings] = useState<BookingRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_bookings`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [disputes, setDisputes] = useState<DisputeRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_disputes`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [providerKYC, setProviderKYC] = useState<ProviderKYCData>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_kyc`);
      return saved ? JSON.parse(saved) : defaultProviderKYC;
    } catch {
      return defaultProviderKYC;
    }
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_cart`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [consoleErrors, setConsoleErrors] = useState<string[]>([]);
  const [verificationConfidence, setVerificationConfidence] = useState(100);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_tickets`, JSON.stringify(tickets));
      localStorage.setItem(`${STORAGE_KEY}_listings`, JSON.stringify(listings));
      localStorage.setItem(`${STORAGE_KEY}_equipment`, JSON.stringify(equipment));
      localStorage.setItem(`${STORAGE_KEY}_addresses`, JSON.stringify(savedAddresses));
      localStorage.setItem(`${STORAGE_KEY}_bookings`, JSON.stringify(bookings));
      localStorage.setItem(`${STORAGE_KEY}_disputes`, JSON.stringify(disputes));
      localStorage.setItem(`${STORAGE_KEY}_cart`, JSON.stringify(cart));
      localStorage.setItem(`${STORAGE_KEY}_kyc`, JSON.stringify(providerKYC));
      localStorage.setItem(`${STORAGE_KEY}_user_location`, userLocation);
    } catch (e) {
      console.warn('LocalStorage persistence sync warning:', e);
    }
  }, [tickets, listings, equipment, savedAddresses, bookings, disputes, cart, providerKYC, userLocation]);

  // Moderated Dispatch Tickets Lifecycle Actions
  const postRequirementTicket = useCallback((
    ticketData: Omit<ServiceRequirementTicket, 'id' | 'createdAt' | 'status' | 'interestedProviderIds'>
  ) => {
    const newTicket: ServiceRequirementTicket = {
      ...ticketData,
      id: `tkt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'pending_admin_review',
      interestedProviderIds: [],
      createdAt: new Date().toISOString(),
      // Compatibility
      addressMasked: ticketData.locationArea ? `${ticketData.locationArea.split(',')[0]} [Masked]` : 'Masked Area',
      estimatedBudget: ticketData.budgetBDT,
      escrowStatus: 'funded_held',
    };
    setTickets((prev) => [newTicket, ...prev]);
    return newTicket;
  }, []);

  const createServiceRequestTicket = useCallback((ticketData: any) => {
    return postRequirementTicket({
      customerId: ticketData.customerId || 'cust-marcus-01',
      customerName: ticketData.customerName || 'Marcus Vance',
      customerPhone: ticketData.customerPhone || '+880 1712-234567',
      title: ticketData.title,
      category: ticketData.category,
      description: ticketData.description,
      locationArea: ticketData.locationArea || ticketData.addressMasked || 'Banani, Dhaka',
      budgetBDT: ticketData.budgetBDT || ticketData.estimatedBudget || 25000,
      adminNotes: ticketData.adminReviewNotes,
    });
  }, [postRequirementTicket]);

  const adminApproveTicket = useCallback((ticketId: string, adjustedBudgetBDT?: number, adminNotes?: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'approved_open_for_interest',
              budgetBDT: adjustedBudgetBDT !== undefined ? adjustedBudgetBDT : t.budgetBDT,
              estimatedBudget: adjustedBudgetBDT !== undefined ? adjustedBudgetBDT : t.budgetBDT,
              adminNotes: adminNotes || t.adminNotes || 'Scope validated by Platform Moderator. Approved for verified contractors.',
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
  }, []);

  const adminRejectTicket = useCallback((ticketId: string, reason: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'admin_rejected',
              adminNotes: reason || 'Requirements did not meet platform safety or technical thresholds.',
              escrowStatus: 'refunded',
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
  }, []);

  const providerExpressInterest = useCallback((ticketId: string, providerId: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const exists = t.interestedProviderIds.includes(providerId);
        const updatedInterested = exists ? t.interestedProviderIds : [...t.interestedProviderIds, providerId];
        return {
          ...t,
          status: 'interest_expressed',
          interestedProviderIds: updatedInterested,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const providerClaimTicket = useCallback((ticketId: string, providerId: string, _providerName?: string) => {
    providerExpressInterest(ticketId, providerId);
  }, [providerExpressInterest]);

  const customerAssignProvider = useCallback((ticketId: string, providerId: string, providerName: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'assigned_in_progress',
              selectedProviderId: providerId,
              selectedProviderName: providerName,
              // Compatibility
              assignedProviderId: providerId,
              assignedProviderName: providerName,
              escrowStatus: 'funded_held',
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
  }, []);

  const adminAssignTicketToProvider = useCallback((ticketId: string, providerId: string, providerName: string, notes?: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'assigned_in_progress',
              selectedProviderId: providerId,
              selectedProviderName: providerName,
              assignedProviderId: providerId,
              assignedProviderName: providerName,
              adminNotes: notes || t.adminNotes || `Dispatched directly to ${providerName}.`,
              escrowStatus: 'funded_held',
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
  }, []);

  const providerSubmitProofOfWork = useCallback((ticketId: string, proofNote: string, proofUrl?: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'proof_submitted',
              proofNote,
              proofOfWorkUrl: proofUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop',
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
  }, []);

  const customerReleaseEscrow = useCallback((ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'completed_released',
              escrowStatus: 'released',
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
  }, []);

  const customerDisputeTicket = useCallback((ticketId: string, reason: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'disputed',
              adminNotes: `[Dispute Lodged]: ${reason}`,
              escrowStatus: 'funded_held',
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
  }, []);

  const adminResolveTicketDispute = useCallback((ticketId: string, outcome: 'refund_customer' | 'release_provider', resolutionNote: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'completed_released',
              escrowStatus: outcome === 'refund_customer' ? 'refunded' : 'released',
              adminNotes: `[Arbitration Finding]: ${resolutionNote}`,
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
  }, []);

  const cancelCustomerTicket = useCallback((ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'admin_rejected',
              adminNotes: 'Cancelled by customer before provider dispatch.',
              escrowStatus: 'refunded',
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
  }, []);

  const resetTicketsToBaseline = useCallback(() => {
    setTickets(baselineTickets);
    try {
      localStorage.setItem(`${STORAGE_KEY}_tickets`, JSON.stringify(baselineTickets));
    } catch {}
  }, []);

  // Provider Self-Serve Methods
  const addServiceListing = useCallback((item: Omit<ServiceListing, 'id' | 'rating' | 'completedJobs' | 'verified'>) => {
    const newListing: ServiceListing = {
      ...item,
      id: `srv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      providerPhone: item.providerPhone || providerKYC.contactPhone || '+880 1712-345678',
      rating: 5.0,
      completedJobs: 0,
      verified: providerKYC.idVerified,
      badge: 'Self-Serve Registered',
    };
    setListings((prev) => [newListing, ...prev]);
  }, [providerKYC.idVerified, providerKYC.contactPhone]);

  const deleteServiceListing = useCallback((id: string) => {
    setListings((prev) => prev.filter((l) => l.id !== id));
    setCart((prev) => prev.filter((item) => !(item.kind === 'service' && item.refId === id)));
  }, []);

  const addEquipmentItem = useCallback((item: Omit<EquipmentItem, 'id' | 'complianceChecked'>) => {
    const newItem: EquipmentItem = {
      ...item,
      id: `eq-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      ownerPhone: item.ownerPhone || providerKYC.contactPhone || '+880 1711-223344',
      complianceChecked: true,
    };
    setEquipment((prev) => [newItem, ...prev]);
  }, [providerKYC.contactPhone]);

  const deleteEquipmentItem = useCallback((id: string) => {
    setEquipment((prev) => prev.filter((e) => e.id !== id));
    setCart((prev) => prev.filter((item) => !(item.kind === 'equipment' && item.refId === id)));
  }, []);

  const submitProviderKYC = useCallback((legalName: string, regNumber: string, docType: string) => {
    setProviderKYC((prev) => ({
      ...prev,
      legalName,
      businessRegNumber: regNumber,
      idDocumentType: docType,
      idVerified: false,
      verificationStep: 'submitted',
    }));
  }, []);

  const updateProviderKYC = useCallback((fields: Partial<ProviderKYCData>) => {
    setProviderKYC((prev) => ({ ...prev, ...fields }));
  }, []);

  const approveKYCInstantly = useCallback(() => {
    setProviderKYC((prev) => ({
      ...prev,
      idVerified: true,
      verificationStep: 'approved',
      licenseStatus: 'active',
      bondingStatus: 'bonded',
    }));
  }, []);

  const resetKYCToUnverified = useCallback(() => {
    setProviderKYC((prev) => ({
      ...prev,
      idVerified: false,
      verificationStep: 'idle',
      licenseStatus: 'pending',
      bondingStatus: 'unbonded',
    }));
  }, []);

  // Consumer Methods
  const updateConsumerProfile = useCallback((fields: Partial<EcosystemState['consumerProfile']>) => {
    setConsumerProfile((prev) => ({ ...prev, ...fields }));
  }, []);

  const addSavedAddress = useCallback((address: Omit<SavedAddress, 'id'>) => {
    const newAddress: SavedAddress = {
      ...address,
      id: `addr-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    };
    setSavedAddresses((prev) => [...prev, newAddress]);
  }, []);

  const deleteSavedAddress = useCallback((id: string) => {
    setSavedAddresses((prev) => {
      const remaining = prev.filter((a) => a.id !== id);
      if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
        remaining[0].isDefault = true;
      }
      return remaining;
    });
  }, []);

  const setDefaultAddress = useCallback((id: string) => {
    setSavedAddresses((prev) =>
      prev.map((a) => ({ ...a, isDefault: a.id === id }))
    );
  }, []);

  const toggleAddressPrivacy = useCallback((key: keyof AddressPrivacySettings) => {
    setAddressPrivacySettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const fileDispute = useCallback((dispute: Omit<DisputeRecord, 'id' | 'filedAt' | 'status'>) => {
    const newDispute: DisputeRecord = {
      ...dispute,
      id: `disp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      filedAt: new Date().toISOString().split('T')[0],
      status: 'under_review',
      arbitrationStep: 'evidence_review',
    };
    setDisputes((prev) => [newDispute, ...prev]);
    setBookings((prev) =>
      prev.map((b) =>
        b.id === dispute.bookingId
          ? { ...b, status: 'disputed', escrowStatus: 'disputed' }
          : b
      )
    );
  }, []);

  const resolveDispute = useCallback((disputeId: string, resolution: 'refunded' | 'resolved', resolutionNote?: string) => {
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disputeId
          ? {
              ...d,
              status: resolution,
              resolutionNote: resolutionNote || `Case settled as ${resolution}.`,
              arbitrationStep: 'funds_disbursed',
            }
          : d
      )
    );
  }, []);

  const returnEquipmentAndReleaseEscrow = useCallback((bookingId: string, returnCondition: 'clean_pass' | 'damage_detected') => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        if (returnCondition === 'clean_pass') {
          const refundTrx = `REF-${b.paymentGateway ? b.paymentGateway.toUpperCase() : 'BKH'}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          return {
            ...b,
            status: 'completed',
            escrowStatus: 'released',
            depositHold: 0,
            refundTrxId: refundTrx,
            inspectionNotes: `Check-in inspection passed. 100% of escrow security deposit (৳${b.depositHold || 0}) automatically refunded to customer via ${b.paymentGateway ? b.paymentGateway.toUpperCase() : 'bKash'} API (${refundTrx}).`,
          };
        } else {
          return {
            ...b,
            status: 'disputed',
            escrowStatus: 'held',
            inspectionNotes: 'Damage detected during physical check-in inspection. Deposit hold retained in escrow ledger pending mediator arbitration.',
          };
        }
      })
    );
  }, []);

  // Cart & Checkout
  const addToCart = useCallback((item: CartItem) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.refId === item.refId && i.kind === item.kind && i.scheduledSlot === item.scheduledSlot
      );
      if (existingIndex > -1) {
        const copy = [...prev];
        copy[existingIndex] = {
          ...copy[existingIndex],
          quantityOrHours: copy[existingIndex].quantityOrHours + item.quantityOrHours,
        };
        return copy;
      }
      return [...prev, item];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateCartQuantity = useCallback((id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantityOrHours: Math.max(1, Math.round(newQuantity)) } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const completeCheckout = useCallback((paymentMeta?: {
    gateway: 'bkash' | 'nagad' | 'sslcommerz' | 'rocket';
    trxId: string;
    phone?: string;
  }): BookingRecord[] => {
    const currentDefaultAddr = userLocation || savedAddresses.find((a) => a.isDefault)?.street || savedAddresses[0]?.street || 'Client Site';

    const newBookings: BookingRecord[] = cart.map((item, idx) => ({
      id: `book-${Date.now().toString(36)}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      type: item.kind,
      title: item.title,
      providerOrOwner: item.providerName,
      providerPhone: item.providerPhone || '+880 1711-223344',
      date: item.scheduledDate || new Date().toISOString().split('T')[0],
      timeSlot: item.scheduledSlot || '10:00 AM - 12:00 PM',
      status: 'confirmed',
      amount: item.basePrice * item.quantityOrHours,
      depositHold: item.securityDeposit,
      escrowStatus: item.securityDeposit > 0 ? 'held' : 'released',
      location: currentDefaultAddr,
      paymentGateway: paymentMeta?.gateway || 'bkash',
      gatewayTrxId: paymentMeta?.trxId || `BKH${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    }));

    setBookings((prev) => [...newBookings, ...prev]);
    setCart([]);
    return newBookings;
  }, [cart, savedAddresses, userLocation]);

  const seedAuthenticRegistry = useCallback(() => {
    setListings(baselineListings);
    setEquipment(baselineEquipment);
    setTickets(baselineTickets);
  }, []);

  const clearAllData = useCallback(() => {
    setListings([]);
    setEquipment([]);
    setCart([]);
    setBookings([]);
    setDisputes([]);
    setTickets([]);
  }, []);

  const logError = useCallback((err: string) => {
    setConsoleErrors((prev) => [...prev, `${new Date().toLocaleTimeString()} - ${err}`]);
  }, []);

  const clearErrors = useCallback(() => {
    setConsoleErrors([]);
  }, []);

  const contextValue = useMemo<EcosystemContextType>(
    () => ({
      currentView,
      setCurrentView,
      currentUser,
      activeSession,
      activeRole,
      activeAuthGate,
      openAuthGate,
      closeAuthGate,
      loginAsAccount,
      loginCustomerSandbox,
      loginProviderSandbox,
      loginAdminPin,
      signupCustomer,
      signupProvider,
      logout,
      logoutSession,
      switchUserRole,
      setActiveRole,
      activeIntent,
      setActiveIntent,
      userLocation,
      setUserLocation,
      searchQuery,
      setSearchQuery,
      selectedSubcategory,
      setSelectedSubcategory,
      radiusKm,
      setRadiusKm,
      priceRange,
      setPriceRange,
      tickets,
      postRequirementTicket,
      createServiceRequestTicket,
      adminApproveTicket,
      adminRejectTicket,
      providerExpressInterest,
      providerClaimTicket,
      customerAssignProvider,
      adminAssignTicketToProvider,
      providerSubmitProofOfWork,
      customerReleaseEscrow,
      customerDisputeTicket,
      adminResolveTicketDispute,
      cancelCustomerTicket,
      resetTicketsToBaseline,
      listings,
      equipment,
      consumerProfile,
      savedAddresses,
      addressPrivacySettings,
      bookings,
      disputes,
      providerKYC,
      cart,
      consoleErrors,
      verificationConfidence,
      addServiceListing,
      deleteServiceListing,
      addEquipmentItem,
      deleteEquipmentItem,
      submitProviderKYC,
      updateProviderKYC,
      approveKYCInstantly,
      resetKYCToUnverified,
      updateConsumerProfile,
      addSavedAddress,
      deleteSavedAddress,
      setDefaultAddress,
      toggleAddressPrivacy,
      fileDispute,
      resolveDispute,
      returnEquipmentAndReleaseEscrow,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      completeCheckout,
      seedAuthenticRegistry,
      clearAllData,
      logError,
      clearErrors,
      setVerificationConfidence,
    }),
    [
      currentView,
      setCurrentView,
      currentUser,
      activeSession,
      activeRole,
      activeAuthGate,
      openAuthGate,
      closeAuthGate,
      loginAsAccount,
      loginCustomerSandbox,
      loginProviderSandbox,
      loginAdminPin,
      signupCustomer,
      signupProvider,
      logout,
      logoutSession,
      switchUserRole,
      setActiveRole,
      activeIntent,
      setActiveIntent,
      userLocation,
      setUserLocation,
      searchQuery,
      setSearchQuery,
      selectedSubcategory,
      setSelectedSubcategory,
      radiusKm,
      setRadiusKm,
      priceRange,
      setPriceRange,
      tickets,
      postRequirementTicket,
      createServiceRequestTicket,
      adminApproveTicket,
      adminRejectTicket,
      providerExpressInterest,
      providerClaimTicket,
      customerAssignProvider,
      adminAssignTicketToProvider,
      providerSubmitProofOfWork,
      customerReleaseEscrow,
      customerDisputeTicket,
      adminResolveTicketDispute,
      cancelCustomerTicket,
      resetTicketsToBaseline,
      listings,
      equipment,
      consumerProfile,
      savedAddresses,
      addressPrivacySettings,
      bookings,
      disputes,
      providerKYC,
      cart,
      consoleErrors,
      verificationConfidence,
      addServiceListing,
      deleteServiceListing,
      addEquipmentItem,
      deleteEquipmentItem,
      submitProviderKYC,
      updateProviderKYC,
      approveKYCInstantly,
      resetKYCToUnverified,
      updateConsumerProfile,
      addSavedAddress,
      deleteSavedAddress,
      setDefaultAddress,
      toggleAddressPrivacy,
      fileDispute,
      resolveDispute,
      returnEquipmentAndReleaseEscrow,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      completeCheckout,
      seedAuthenticRegistry,
      clearAllData,
      logError,
      clearErrors,
    ]
  );

  return (
    <EcosystemContext.Provider value={contextValue}>
      {children}
    </EcosystemContext.Provider>
  );
};

export const useEcosystem = () => {
  const context = useContext(EcosystemContext);
  if (!context) {
    throw new Error('useEcosystem must be used within an EcosystemProvider');
  }
  return context;
};
