export type IntentCategory = 'digital_gig' | 'home_repair' | 'equipment_rental';

export type AuthRole = 'customer' | 'provider' | 'admin';
export type UserRole = AuthRole; // Backward compatibility alias

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  phone?: string;
  avatar?: string;
  avatarUrl?: string; // Compatibility
  rating?: number;
  tradeTitle?: string; // For providers (e.g., "Master Electrician", "Senior Fullstack Dev")
  isVerifiedKYC?: boolean;
  isVerified?: boolean; // Compatibility
}
export type UserSession = UserAccount; // Backward compatibility alias

export type TicketLifecycleStatus = 
  | 'pending_admin_review'       // Customer submitted, waiting for Admin audit
  | 'admin_rejected'             // Admin rejected (fraud/incomplete spec)
  | 'approved_open_for_interest' // Admin approved, live in Provider Feed
  | 'interest_expressed'         // One or more providers clicked "Interested"
  | 'assigned_in_progress'       // Customer accepted a provider, job ongoing
  | 'proof_submitted'            // Provider submitted proof of completion
  | 'completed_released'         // Customer confirmed, escrow released
  | 'disputed';

export type TicketStatus = TicketLifecycleStatus; // Backward compatibility alias

export interface ServiceRequirementTicket {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  title: string;
  category: 'digital_gig' | 'home_repair' | 'equipment_rental';
  description: string;
  locationArea: string;
  budgetBDT: number;
  status: TicketLifecycleStatus;
  interestedProviderIds: string[]; // List of providers who clicked "Interested"
  selectedProviderId?: string;
  selectedProviderName?: string;
  adminNotes?: string;
  proofNote?: string;
  createdAt: string;

  // Compatibility fields
  assignedProviderId?: string;
  assignedProviderName?: string;
  proofOfWorkUrl?: string;
  addressMasked?: string;
  estimatedBudget?: number;
  escrowStatus?: 'none' | 'funded_held' | 'released' | 'refunded';
  updatedAt?: string;
  adminReviewNotes?: string;
}

export type ServiceRequestTicket = ServiceRequirementTicket; // Backward compatibility alias

export interface ServiceListing {
  id: string;
  providerId: string;
  providerName: string;
  providerTitle: string;
  providerPhone?: string;
  category: IntentCategory;
  subcategory: string;
  title: string;
  description: string;
  rateType: 'hourly' | 'fixed';
  rate: number;
  location: string;
  serviceRadiusKm: number;
  availableSlots: string[];
  rating: number;
  completedJobs: number;
  verified: boolean;
  badge?: string;
}

export interface EquipmentItem {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerPhone?: string;
  title: string;
  category: string;
  dailyRate: number;
  securityDeposit: number;
  condition: 'Brand New' | 'Like New' | 'Good' | 'Heavy Duty';
  conditionNotes: string;
  location: string;
  pickupOption: 'pickup_only' | 'delivery_available' | 'depot_locker';
  availableUnits: number;
  photos: string[];
  serialNumber?: string;
  complianceChecked: boolean;
}

export interface SavedAddress {
  id: string;
  label: string;
  street: string;
  city: string;
  zip: string;
  isDefault: boolean;
  notes?: string;
  privacyProtected?: boolean;
}

export interface BookingRecord {
  id: string;
  type: 'service' | 'equipment';
  title: string;
  providerOrOwner: string;
  providerPhone?: string;
  date: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'disputed';
  amount: number;
  depositHold?: number;
  escrowStatus?: 'held' | 'released' | 'disputed' | 'refunded';
  inspectionNotes?: string;
  location: string;
  paymentGateway?: 'bkash' | 'nagad' | 'sslcommerz' | 'rocket';
  gatewayTrxId?: string;
  refundTrxId?: string;
}

export interface DisputeRecord {
  id: string;
  bookingId: string;
  itemTitle: string;
  reason: string;
  filedAt: string;
  status: 'under_review' | 'evidence_requested' | 'resolved' | 'refunded';
  evidencePhotos: string[];
  claimAmount: number;
  resolutionNote?: string;
  arbitrationStep?: 'evidence_review' | 'mediator_hearing' | 'settlement_reached' | 'funds_disbursed';
}

export interface CartItem {
  id: string;
  kind: 'service' | 'equipment';
  refId: string;
  title: string;
  providerName: string;
  providerPhone?: string;
  intent: IntentCategory;
  basePrice: number;
  securityDeposit: number;
  quantityOrHours: number;
  scheduledDate?: string;
  scheduledSlot?: string;
  fulfillmentType?: 'onsite_doorstep' | 'remote_digital' | 'equipment_pickup' | 'equipment_delivery';
}

export interface ProviderKYCData {
  legalName: string;
  contactPhone?: string;
  businessRegNumber: string;
  contractorLicenseNumber: string;
  licenseBoard: string;
  licenseStatus: 'active' | 'pending' | 'expired';
  suretyBondNumber: string;
  suretyBondAmount: number;
  suretyBondIssuer: string;
  bondingStatus: 'bonded' | 'unbonded' | 'pending';
  liabilityPolicyNumber: string;
  liabilityCoverageAmount: number;
  backgroundCheckClearance: boolean;
  idDocumentType: string;
  idVerified: boolean;
  verificationStep: 'idle' | 'submitted' | 'approved';
}

export interface AddressPrivacySettings {
  obfuscateUntilEnRoute: boolean;
  maskDoorstepNumber: boolean;
  ephemeralAccessCodes: boolean;
}

export interface EcosystemState {
  currentUser: UserAccount | null; // Nullable for public guests
  activeSession: UserAccount; // Compatibility fallback
  activeRole: AuthRole;
  activeIntent: IntentCategory;
  userLocation: string;
  searchQuery: string;
  selectedSubcategory: string | null;
  radiusKm: number;
  priceRange: [number, number];
  
  // Strict non-hallucinated registries
  listings: ServiceListing[];
  equipment: EquipmentItem[];
  
  // Moderated Dispatch Tickets
  tickets: ServiceRequirementTicket[];
  
  // Consumer / Customer state
  consumerProfile: {
    name: string;
    email: string;
    phone: string;
    kycVerified: boolean;
  };
  savedAddresses: SavedAddress[];
  addressPrivacySettings: AddressPrivacySettings;
  bookings: BookingRecord[];
  disputes: DisputeRecord[];
  
  // Provider self-serve portal state
  providerKYC: ProviderKYCData;
  
  // Hybrid Checkout & Cart
  cart: CartItem[];
  
  // Quality & System Telemetry
  consoleErrors: string[];
  verificationConfidence: number;
}
