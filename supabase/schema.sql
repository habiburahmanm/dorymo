-- ==============================================================================
-- NexServe Ecosystem // Unified Multi-Service Platform
-- Production PostgreSQL Database Schema with Row-Level Security (RLS)
-- Optimized for Supabase + Local Bangladesh Payment & Escrow Protocols
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM TYPES & ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('consumer', 'provider', 'hybrid', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE intent_category AS ENUM ('digital_gig', 'home_repair', 'equipment_rental');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE rate_type AS ENUM ('hourly', 'fixed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE equipment_condition AS ENUM ('Brand New', 'Like New', 'Good', 'Heavy Duty');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE pickup_option AS ENUM ('pickup_only', 'delivery_available', 'depot_locker');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'disputed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE escrow_status AS ENUM ('held', 'released', 'disputed', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE dispute_status AS ENUM ('under_review', 'evidence_requested', 'resolved', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE arbitration_step AS ENUM ('evidence_review', 'mediator_hearing', 'settlement_reached', 'funds_disbursed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_gateway AS ENUM ('bkash', 'nagad', 'sslcommerz', 'rocket', 'cash_on_delivery');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'initiated', 'paid', 'failed', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE escrow_trx_type AS ENUM ('labor_hold', 'deposit_hold', 'deposit_refund', 'labor_payout', 'dispute_settlement');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. CORE ENTITY TABLES

-- TABLE: profiles (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'consumer',
  avatar_url TEXT,
  rating NUMERIC(3,2) NOT NULL DEFAULT 5.00 CHECK (rating >= 1.0 AND rating <= 5.0),
  completed_jobs INTEGER NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- TABLE: provider_kyc (Rigorous trade license, bonding & insurance registration)
CREATE TABLE IF NOT EXISTS public.provider_kyc (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  legal_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  business_reg_number TEXT NOT NULL,
  contractor_license_number TEXT NOT NULL,
  license_board TEXT NOT NULL,
  license_status TEXT NOT NULL DEFAULT 'pending', -- 'active', 'pending', 'expired'
  surety_bond_number TEXT,
  surety_bond_amount NUMERIC(12,2) DEFAULT 0, -- In BDT (৳)
  surety_bond_issuer TEXT,
  bonding_status TEXT NOT NULL DEFAULT 'unbonded', -- 'bonded', 'unbonded', 'pending'
  liability_policy_number TEXT,
  liability_coverage_amount NUMERIC(12,2) DEFAULT 0, -- In BDT (৳)
  background_check_clearance BOOLEAN NOT NULL DEFAULT false,
  id_document_type TEXT NOT NULL,
  id_document_url TEXT,
  verification_step TEXT NOT NULL DEFAULT 'idle', -- 'idle', 'submitted', 'approved', 'rejected'
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- TABLE: dispatch_addresses (Multi-address hub with privacy masking)
CREATE TABLE IF NOT EXISTS public.dispatch_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Jobsite Location',
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  zip TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  obfuscate_until_enroute BOOLEAN NOT NULL DEFAULT true,
  mask_doorstep_number BOOLEAN NOT NULL DEFAULT false,
  ephemeral_access_codes BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- TABLE: service_listings (Digital Gigs & Doorstep Repairs)
CREATE TABLE IF NOT EXISTS public.service_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category intent_category NOT NULL,
  subcategory TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  rate_type rate_type NOT NULL DEFAULT 'hourly',
  rate NUMERIC(10,2) NOT NULL CHECK (rate >= 0), -- Hourly or fixed rate in BDT (৳)
  location TEXT NOT NULL,
  service_radius_km INTEGER NOT NULL DEFAULT 25,
  available_slots TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  badge TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- TABLE: equipment_items (Industrial machinery, diagnostic tools & gear)
CREATE TABLE IF NOT EXISTS public.equipment_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  daily_rate NUMERIC(10,2) NOT NULL CHECK (daily_rate >= 0), -- Daily rental charge in BDT (৳)
  security_deposit NUMERIC(10,2) NOT NULL CHECK (security_deposit >= 0), -- Segregated escrow deposit in BDT (৳)
  condition equipment_condition NOT NULL DEFAULT 'Good',
  condition_notes TEXT,
  location TEXT NOT NULL,
  pickup_option pickup_option NOT NULL DEFAULT 'depot_locker',
  available_units INTEGER NOT NULL DEFAULT 1 CHECK (available_units >= 0),
  serial_number TEXT,
  photos TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  compliance_checked BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- TABLE: orders (Split-flow mixed cart checkout session)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consumer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dispatch_address_id UUID REFERENCES public.dispatch_addresses(id) ON DELETE SET NULL,
  subtotal_labor NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal_equipment NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_escrow_deposit NUMERIC(10,2) NOT NULL DEFAULT 0,
  platform_safety_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  payment_gateway payment_gateway NOT NULL DEFAULT 'bkash',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  gateway_transaction_id TEXT, -- e.g., bKash trxID, SSLCommerz bank_tran_id
  gateway_payment_id TEXT,     -- e.g., bKash paymentID, SSLCommerz tran_id
  payment_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- TABLE: bookings (Granular booking record for each service or equipment item)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  consumer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('service', 'equipment')),
  service_id UUID REFERENCES public.service_listings(id) ON DELETE SET NULL,
  equipment_id UUID REFERENCES public.equipment_items(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  quantity_or_hours INTEGER NOT NULL DEFAULT 1,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  deposit_hold NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (deposit_hold >= 0),
  status booking_status NOT NULL DEFAULT 'confirmed',
  escrow_status escrow_status NOT NULL DEFAULT 'held',
  inspection_notes TEXT,
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- TABLE: escrow_ledger (Double-entry transaction audit trail for security holds & payouts)
CREATE TABLE IF NOT EXISTS public.escrow_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  type escrow_trx_type NOT NULL,
  status TEXT NOT NULL DEFAULT 'held', -- 'held', 'released', 'refunded', 'disputed'
  gateway_trx_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- TABLE: disputes (Multi-tier mediator arbitration engine)
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  claimant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  respondent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  item_title TEXT NOT NULL,
  reason TEXT NOT NULL,
  claim_amount NUMERIC(10,2) NOT NULL CHECK (claim_amount >= 0),
  evidence_photos TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status dispute_status NOT NULL DEFAULT 'under_review',
  arbitration_step arbitration_step NOT NULL DEFAULT 'evidence_review',
  resolution_note TEXT,
  resolved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  resolved_at TIMESTAMPTZ
);

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_services_category ON public.service_listings(category);
CREATE INDEX IF NOT EXISTS idx_services_subcategory ON public.service_listings(subcategory);
CREATE INDEX IF NOT EXISTS idx_services_provider ON public.service_listings(provider_id);
CREATE INDEX IF NOT EXISTS idx_equipment_owner ON public.equipment_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON public.equipment_items(category);
CREATE INDEX IF NOT EXISTS idx_bookings_consumer ON public.bookings(consumer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON public.bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_escrow ON public.bookings(escrow_status);
CREATE INDEX IF NOT EXISTS idx_orders_consumer ON public.orders(consumer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_booking ON public.escrow_ledger(booking_id);
CREATE INDEX IF NOT EXISTS idx_disputes_booking ON public.disputes(booking_id);

-- 5. AUTOMATED TIMESTAMP & PROFILE TRIGGERS

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger across all stateful tables
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER set_provider_kyc_updated_at BEFORE UPDATE ON public.provider_kyc FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER set_dispatch_addresses_updated_at BEFORE UPDATE ON public.dispatch_addresses FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER set_service_listings_updated_at BEFORE UPDATE ON public.service_listings FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER set_equipment_items_updated_at BEFORE UPDATE ON public.equipment_items FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER set_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Function to handle new Supabase auth sign-ups automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'consumer'::user_role)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute upon auth.users creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- PROVIDER KYC POLICIES
CREATE POLICY "Providers can view their own KYC" 
  ON public.provider_kyc FOR SELECT USING (auth.uid() = provider_id);

CREATE POLICY "Providers can create/update their own KYC" 
  ON public.provider_kyc FOR ALL USING (auth.uid() = provider_id);

-- DISPATCH ADDRESSES POLICIES
CREATE POLICY "Users can manage their own addresses" 
  ON public.dispatch_addresses FOR ALL USING (auth.uid() = user_id);

-- SERVICE LISTINGS POLICIES
CREATE POLICY "Active service listings are viewable by everyone" 
  ON public.service_listings FOR SELECT USING (is_active = true);

CREATE POLICY "Providers can manage their own service listings" 
  ON public.service_listings FOR ALL USING (auth.uid() = provider_id);

-- EQUIPMENT ITEMS POLICIES
CREATE POLICY "Active equipment is viewable by everyone" 
  ON public.equipment_items FOR SELECT USING (is_active = true);

CREATE POLICY "Owners can manage their own equipment" 
  ON public.equipment_items FOR ALL USING (auth.uid() = owner_id);

-- ORDERS POLICIES
CREATE POLICY "Consumers can view their own orders" 
  ON public.orders FOR SELECT USING (auth.uid() = consumer_id);

CREATE POLICY "Consumers can create orders" 
  ON public.orders FOR INSERT WITH CHECK (auth.uid() = consumer_id);

-- BOOKINGS POLICIES
CREATE POLICY "Involved parties can view their bookings" 
  ON public.bookings FOR SELECT USING (auth.uid() = consumer_id OR auth.uid() = provider_id);

CREATE POLICY "Consumers can create bookings" 
  ON public.bookings FOR INSERT WITH CHECK (auth.uid() = consumer_id);

CREATE POLICY "Involved parties can update booking lifecycle" 
  ON public.bookings FOR UPDATE USING (auth.uid() = consumer_id OR auth.uid() = provider_id);

-- ESCROW LEDGER POLICIES
CREATE POLICY "Involved parties can view their escrow ledger entries" 
  ON public.escrow_ledger FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = escrow_ledger.booking_id 
      AND (b.consumer_id = auth.uid() OR b.provider_id = auth.uid())
    )
  );

-- DISPUTES POLICIES
CREATE POLICY "Involved parties can view disputes" 
  ON public.disputes FOR SELECT USING (auth.uid() = claimant_id OR auth.uid() = respondent_id);

CREATE POLICY "Claimants can file disputes" 
  ON public.disputes FOR INSERT WITH CHECK (auth.uid() = claimant_id);

CREATE POLICY "Claimants and respondents can update dispute details" 
  ON public.disputes FOR UPDATE USING (auth.uid() = claimant_id OR auth.uid() = respondent_id);

-- 7. SUPABASE STORAGE BUCKET CONFIGURATION
-- Note: Insert into storage.buckets if bucket does not exist
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('kyc-documents', 'kyc-documents', false),
  ('equipment-photos', 'equipment-photos', true),
  ('dispute-evidence', 'dispute-evidence', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "Public read for equipment photos" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'equipment-photos');

CREATE POLICY "Authenticated users can upload equipment photos" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'equipment-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Providers can upload KYC documents" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'kyc-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Providers can view their own KYC documents" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
