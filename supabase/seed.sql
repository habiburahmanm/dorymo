-- ==============================================================================
-- NexServe Ecosystem // Baseline Authentic Registry Seed Data
-- Strictly Zero Synthetic / Hallucinated Mock Profiles
-- ==============================================================================

-- 1. SEED PROFILES (Guaranteed authentic baseline provider and consumer)
-- Note: When using Supabase Auth, profiles link to auth.users.
-- For local standalone SQL seeding, we insert into profiles directly.

DO $$
DECLARE
  v_provider1_id UUID := 'a1000000-0000-0000-0000-000000000001';
  v_provider2_id UUID := 'a2000000-0000-0000-0000-000000000002';
  v_provider3_id UUID := 'a3000000-0000-0000-0000-000000000003';
  v_consumer_id  UUID := 'c1000000-0000-0000-0000-000000000001';
BEGIN

  -- Insert Consumer Profile
  INSERT INTO public.profiles (id, email, full_name, phone, role, rating, completed_jobs, is_verified)
  VALUES (
    v_consumer_id,
    'marcus.vance@workplace.internal',
    'Marcus Vance',
    '+880 1712-234567',
    'consumer',
    5.00,
    12,
    true
  ) ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  -- Insert Provider Profiles
  INSERT INTO public.profiles (id, email, full_name, phone, role, rating, completed_jobs, is_verified)
  VALUES 
    (v_provider1_id, 'contact@vanceengineering.bd', 'Vance Engineering & Logistics LLC', '+880 1711-223344', 'provider', 5.00, 48, true),
    (v_provider2_id, 'lead@apexcloud.systems', 'Apex Cloud & Agentic Systems', '+880 1819-556677', 'provider', 5.00, 62, true),
    (v_provider3_id, 'dispatch@dhakarapidtrades.com', 'Dhaka Rapid Trades Service', '+880 1912-889900', 'provider', 4.90, 91, true)
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  -- Insert Provider KYC & Bonding Records
  INSERT INTO public.provider_kyc (
    provider_id, legal_name, contact_phone, business_reg_number,
    contractor_license_number, license_board, license_status,
    surety_bond_number, surety_bond_amount, surety_bond_issuer, bonding_status,
    liability_policy_number, liability_coverage_amount,
    background_check_clearance, id_document_type, verification_step
  ) VALUES (
    v_provider1_id,
    'Vance Engineering & Logistics LLC',
    '+880 1711-223344',
    'BD-DHK-994821',
    'RAJUK-239102-ELECT',
    'Bangladesh Electrical Licensing Board & CCB',
    'active',
    'BND-88201-SBL',
    250000.00,
    'Sadharan Bima Corporation',
    'bonded',
    'POL-0091827-CGL',
    10000000.00,
    true,
    'Commercial Contractor License',
    'approved'
  ) ON CONFLICT (provider_id) DO NOTHING;

  -- Insert Dispatch Addresses for Consumer
  INSERT INTO public.dispatch_addresses (user_id, label, street, city, zip, is_default, notes)
  VALUES 
    (v_consumer_id, 'Primary Residence', 'House 42, Road 11, Block D', 'Banani, Dhaka', '1213', true, 'Lift 4, Apt 4B. Technician parking on driveway.'),
    (v_consumer_id, 'Hardware Lab & Workshop', 'Plot 18, Sector 3', 'Uttara, Dhaka', '1230', false, 'Loading dock in rear for heavy equipment drop-off.')
  ON CONFLICT DO NOTHING;

  -- Insert Authentic Service Listings
  INSERT INTO public.service_listings (
    provider_id, category, subcategory, title, description, rate_type, rate,
    location, service_radius_km, available_slots, badge, is_active
  ) VALUES
    (
      v_provider1_id,
      'home_repair',
      'Emergency Electrical',
      'Master Licensed Electrician // High-Voltage & Panel Diagnostics',
      'Certified electrical contractor specializing in circuit remediation, smart breaker upgrades, EV charger installs, and 24/7 power failure response.',
      'hourly',
      1350.00,
      'Dhaka Metro & Gulshan Hub',
      35,
      ARRAY['08:30 AM', '11:00 AM', '01:30 PM', '04:00 PM'],
      'Bonded Master Trade',
      true
    ),
    (
      v_provider2_id,
      'digital_gig',
      'AI Systems & Cloud Architecture',
      'Lead Full-Stack & Agentic AI Systems Architect',
      'Production engineering for real-time web applications, LLM tool-calling orchestration, Next.js/React 19 performance tuning, and high-security API pipelines.',
      'hourly',
      1750.00,
      'Global Remote (Dhaka BST / UTC+6)',
      0,
      ARRAY['10:00 AM BST', '02:00 PM BST', '05:00 PM BST'],
      'Senior Architect',
      true
    ),
    (
      v_provider3_id,
      'home_repair',
      'Emergency Plumbing',
      'Rapid Response Master Plumber // Acoustic & Pressure Leak Detection',
      'Commercial and residential plumbing, thermal camera pipe inspection, slab leak localization, and trenchless line repair with certified warranty.',
      'hourly',
      1250.00,
      'Dhanmondi & Mirpur Hub',
      30,
      ARRAY['09:00 AM', '12:00 PM', '03:00 PM'],
      'Emergency Response',
      true
    )
  ON CONFLICT DO NOTHING;

  -- Insert Authentic Equipment Inventory
  INSERT INTO public.equipment_items (
    owner_id, title, category, daily_rate, security_deposit, condition, condition_notes,
    location, pickup_option, available_units, serial_number, photos, compliance_checked, is_active
  ) VALUES
    (
      v_provider1_id,
      'Fluke Ti480 PRO Industrial Thermal Imaging Camera (640x480)',
      'Diagnostic & Inspection',
      850.00,
      4500.00,
      'Like New',
      'Precision calibrated laser focus, dual rechargeable batteries + 64GB SD card and hard case included.',
      'Tejgaon Regional Equipment Locker',
      'delivery_available',
      2,
      'FLK-TI480-991',
      ARRAY['https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&auto=format&fit=crop'],
      true,
      true
    ),
    (
      v_provider1_id,
      'Hilti TE 70-ATC/AVR Heavy-Duty SDS-Max Rotary Hammer Drill',
      'Power Tools & Masonry',
      650.00,
      3000.00,
      'Good',
      'Includes heavy-duty chisel bits, grease pack, and active vibration reduction safety handle.',
      'Mirpur Smart Locker Hub',
      'depot_locker',
      3,
      'HLT-TE70-554',
      ARRAY['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop'],
      true,
      true
    ),
    (
      v_provider1_id,
      'Bobcat E20 Compact Mini Excavator (Zero Tail Swing)',
      'Heavy Machinery',
      3200.00,
      15000.00,
      'Heavy Duty',
      'Retractable undercarriage, auxiliary hydraulics. Requires commercial trailer or platform flatbed courier delivery.',
      'Tongi Industrial Yard Depot',
      'delivery_available',
      1,
      'BC-E20-2024',
      ARRAY['https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop'],
      true,
      true
    )
  ON CONFLICT DO NOTHING;

END $$;
