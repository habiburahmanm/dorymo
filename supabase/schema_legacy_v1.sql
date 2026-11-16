-- =============================================================================
-- ARCHIVED v1 SCHEMA — NOT USED BY THE RUNNING APP.
-- Canonical schema: supabase/nexserve_master_schema.sql
-- =============================================================================
-- NexServe (নেক্সসার্ভ) — সম্পূর্ণ Supabase স্কিমা + Row Level Security
-- =============================================================================
-- ব্যবহার: Supabase Dashboard → SQL Editor → New query → পুরো ফাইলটি পেস্ট → Run
-- স্ক্রিপ্টটি idempotent: একাধিকবার চালালেও নিরাপদ।
-- =============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. ENUMS
-- -----------------------------------------------------------------------------
do $$ begin create type public.user_role as enum ('consumer','provider','admin');
exception when duplicate_object then null; end $$;

do $$ begin create type public.intent_category as enum ('digital_gig','home_repair','equipment_rental');
exception when duplicate_object then null; end $$;

do $$ begin create type public.rate_type as enum ('hourly','fixed');
exception when duplicate_object then null; end $$;

do $$ begin create type public.equipment_condition as enum ('Brand New','Like New','Good','Heavy Duty');
exception when duplicate_object then null; end $$;

do $$ begin create type public.pickup_option as enum ('pickup_only','delivery_available','depot_locker');
exception when duplicate_object then null; end $$;

do $$ begin create type public.booking_status as enum ('pending','confirmed','in_progress','completed','disputed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin create type public.escrow_status as enum ('held','released','disputed','refunded');
exception when duplicate_object then null; end $$;

do $$ begin create type public.dispute_status as enum ('under_review','evidence_requested','resolved','refunded');
exception when duplicate_object then null; end $$;

do $$ begin create type public.payment_gateway as enum ('bkash','nagad','sslcommerz','rocket','cash_on_delivery');
exception when duplicate_object then null; end $$;

do $$ begin create type public.payment_status as enum ('pending','initiated','paid','failed','refunded');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- 2. TABLES
-- -----------------------------------------------------------------------------

-- 2.1 প্রোফাইল — auth.users এর সাথে ১:১
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  full_name       text not null,
  phone           text,
  role            public.user_role not null default 'consumer',
  trade_title     text,
  business_name   text,
  avatar_url      text,
  rating          numeric(3,2) not null default 5.00,
  completed_jobs  integer not null default 0,
  is_verified     boolean not null default false,
  created_at      timestamptz not null default timezone('utc', now()),
  updated_at      timestamptz not null default timezone('utc', now())
);

-- 2.2 সার্ভিস লিস্টিং
-- provider_id NULL হলে সেটি প্ল্যাটফর্ম-নির্বাচিত স্টার্টার লিস্টিং (কেউ এডিট করতে পারবে না)
create table if not exists public.service_listings (
  id                uuid primary key default uuid_generate_v4(),
  provider_id       uuid references public.profiles(id) on delete cascade,
  provider_name     text not null default '',
  provider_title    text not null default '',
  provider_phone    text,
  category          public.intent_category not null,
  subcategory       text not null default '',
  title             text not null,
  description       text not null default '',
  rate_type         public.rate_type not null default 'hourly',
  rate              numeric(10,2) not null default 0 check (rate >= 0),
  location          text not null default '',
  service_radius_km integer not null default 25,
  available_slots   text[] not null default array[]::text[],
  badge             text,
  is_seed           boolean not null default false,
  is_active         boolean not null default true,
  created_at        timestamptz not null default timezone('utc', now()),
  updated_at        timestamptz not null default timezone('utc', now())
);

-- 2.3 যন্ত্রপাতি ভাড়া
create table if not exists public.equipment_items (
  id                 uuid primary key default uuid_generate_v4(),
  owner_id           uuid references public.profiles(id) on delete cascade,
  owner_name         text not null default '',
  owner_phone        text,
  title              text not null,
  category           text not null default '',
  daily_rate         numeric(10,2) not null default 0 check (daily_rate >= 0),
  security_deposit   numeric(10,2) not null default 0 check (security_deposit >= 0),
  condition          public.equipment_condition not null default 'Good',
  condition_notes    text not null default '',
  location           text not null default '',
  pickup_option      public.pickup_option not null default 'pickup_only',
  available_units    integer not null default 1 check (available_units >= 0),
  serial_number      text,
  photos             text[] not null default array[]::text[],
  compliance_checked boolean not null default true,
  is_seed            boolean not null default false,
  is_active          boolean not null default true,
  created_at         timestamptz not null default timezone('utc', now()),
  updated_at         timestamptz not null default timezone('utc', now())
);

-- 2.4 টিকিট — গ্রাহকের চাহিদা → অ্যাডমিন যাচাই → প্রোভাইডার আগ্রহ → কাজ → প্রমাণ → এসক্রো রিলিজ
create table if not exists public.tickets (
  id                      uuid primary key default uuid_generate_v4(),
  customer_id             uuid not null references public.profiles(id) on delete cascade,
  customer_name           text not null default '',
  customer_phone          text,
  title                   text not null,
  category                public.intent_category not null,
  description             text not null default '',
  location_area           text not null default '',
  budget_bdt              numeric(12,2) not null default 0 check (budget_bdt >= 0),
  status                  text not null default 'pending_admin_review',
  selected_provider_id    uuid references public.profiles(id) on delete set null,
  selected_provider_name  text,
  admin_notes             text,
  proof_note              text,
  proof_url               text,
  escrow_status           text not null default 'held',
  created_at              timestamptz not null default timezone('utc', now()),
  updated_at              timestamptz not null default timezone('utc', now()),
  constraint tickets_status_valid check (status in (
    'pending_admin_review',
    'admin_rejected',
    'approved_open_for_interest',
    'interest_expressed',
    'assigned_in_progress',
    'proof_submitted',
    'completed_released',
    'disputed'
  )),
  constraint tickets_escrow_valid check (escrow_status in ('held','released','refunded','disputed'))
);

-- 2.5 টিকিটে প্রোভাইডারের আগ্রহ (নামসহ, যাতে গ্রাহক কাকে বাছছেন দেখতে পারেন)
create table if not exists public.ticket_interests (
  ticket_id     uuid not null references public.tickets(id) on delete cascade,
  provider_id   uuid not null references public.profiles(id) on delete cascade,
  provider_name text not null default '',
  trade_title   text,
  created_at    timestamptz not null default timezone('utc', now()),
  primary key (ticket_id, provider_id)
);

-- 2.6 সংরক্ষিত ঠিকানা
create table if not exists public.dispatch_addresses (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references public.profiles(id) on delete cascade,
  label                   text not null default 'ঠিকানা',
  street                  text not null,
  city                    text not null,
  zip                     text not null default '',
  is_default              boolean not null default false,
  notes                   text,
  obfuscate_until_enroute boolean not null default true,
  mask_doorstep_number    boolean not null default false,
  ephemeral_access_codes  boolean not null default true,
  created_at              timestamptz not null default timezone('utc', now()),
  updated_at              timestamptz not null default timezone('utc', now())
);

-- 2.7 অর্ডার (মিক্সড কার্ট চেকআউট)
create table if not exists public.orders (
  id                     uuid primary key default uuid_generate_v4(),
  consumer_id            uuid not null references public.profiles(id) on delete cascade,
  dispatch_address_id    uuid references public.dispatch_addresses(id) on delete set null,
  subtotal_labor         numeric(10,2) not null default 0,
  subtotal_equipment     numeric(10,2) not null default 0,
  total_escrow_deposit   numeric(10,2) not null default 0,
  platform_safety_fee    numeric(10,2) not null default 0,
  total_amount           numeric(10,2) not null default 0 check (total_amount >= 0),
  payment_gateway        public.payment_gateway not null default 'bkash',
  payment_status         public.payment_status not null default 'pending',
  gateway_transaction_id text,
  payment_details        jsonb not null default '{}'::jsonb,
  created_at             timestamptz not null default timezone('utc', now()),
  updated_at             timestamptz not null default timezone('utc', now())
);

-- 2.8 বুকিং
create table if not exists public.bookings (
  id                uuid primary key default uuid_generate_v4(),
  order_id          uuid references public.orders(id) on delete set null,
  consumer_id       uuid not null references public.profiles(id) on delete cascade,
  provider_id       uuid references public.profiles(id) on delete set null,
  type              text not null check (type in ('service','equipment')),
  service_id        uuid references public.service_listings(id) on delete set null,
  equipment_id      uuid references public.equipment_items(id) on delete set null,
  title             text not null,
  provider_name     text not null default '',
  provider_phone    text,
  scheduled_date    date not null default current_date,
  time_slot         text not null default '',
  quantity_or_hours integer not null default 1,
  amount            numeric(10,2) not null default 0 check (amount >= 0),
  deposit_hold      numeric(10,2) not null default 0 check (deposit_hold >= 0),
  status            public.booking_status not null default 'confirmed',
  escrow_status     public.escrow_status not null default 'held',
  inspection_notes  text,
  location          text not null default '',
  payment_gateway   public.payment_gateway not null default 'bkash',
  gateway_trx_id    text,
  created_at        timestamptz not null default timezone('utc', now()),
  updated_at        timestamptz not null default timezone('utc', now())
);

-- 2.9 বিরোধ
create table if not exists public.disputes (
  id                uuid primary key default uuid_generate_v4(),
  booking_id        uuid references public.bookings(id) on delete cascade,
  claimant_id       uuid not null references public.profiles(id) on delete cascade,
  respondent_id     uuid references public.profiles(id) on delete set null,
  item_title        text not null default '',
  reason            text not null,
  claim_amount      numeric(10,2) not null default 0 check (claim_amount >= 0),
  evidence_photos   text[] not null default array[]::text[],
  status            public.dispute_status not null default 'under_review',
  arbitration_step  text not null default 'evidence_review',
  resolution_note   text,
  created_at        timestamptz not null default timezone('utc', now()),
  resolved_at       timestamptz
);

-- 2.10 প্রোভাইডার KYC
create table if not exists public.provider_kyc (
  id                         uuid primary key default uuid_generate_v4(),
  provider_id                uuid not null unique references public.profiles(id) on delete cascade,
  legal_name                 text not null default '',
  contact_phone              text not null default '',
  business_reg_number        text not null default '',
  contractor_license_number  text not null default '',
  license_board              text not null default '',
  license_status             text not null default 'pending',
  surety_bond_number         text,
  surety_bond_amount         numeric(12,2) not null default 0,
  liability_policy_number    text,
  liability_coverage_amount  numeric(12,2) not null default 0,
  id_document_type           text not null default '',
  id_document_url            text,
  verification_step          text not null default 'idle',
  rejection_reason           text,
  created_at                 timestamptz not null default timezone('utc', now()),
  updated_at                 timestamptz not null default timezone('utc', now())
);

-- -----------------------------------------------------------------------------
-- 3. MIGRATION GUARDS (পুরোনো টেবিলের সাথে খাপ খাওয়ানো)
-- -----------------------------------------------------------------------------
alter table public.service_listings alter column provider_id drop not null;
alter table public.service_listings add column if not exists provider_name  text not null default '';
alter table public.service_listings add column if not exists provider_title text not null default '';
alter table public.service_listings add column if not exists provider_phone text;
alter table public.service_listings add column if not exists is_seed        boolean not null default false;

alter table public.equipment_items alter column owner_id drop not null;
alter table public.equipment_items add column if not exists owner_name  text not null default '';
alter table public.equipment_items add column if not exists owner_phone text;
alter table public.equipment_items add column if not exists is_seed     boolean not null default false;

alter table public.bookings alter column provider_id drop not null;
alter table public.bookings add column if not exists provider_name   text not null default '';
alter table public.bookings add column if not exists provider_phone  text;
alter table public.bookings add column if not exists payment_gateway public.payment_gateway not null default 'bkash';
alter table public.bookings add column if not exists gateway_trx_id  text;

alter table public.profiles add column if not exists trade_title   text;
alter table public.profiles add column if not exists business_name text;
alter table public.profiles add column if not exists avatar_url    text;

-- পুরোনো স্কিমায় disputes.booking_id ছিল NOT NULL; টিকিট-ভিত্তিক বিরোধের জন্য শিথিল করা হলো।
alter table public.disputes alter column booking_id drop not null;

alter table public.provider_kyc alter column legal_name                set default '';
alter table public.provider_kyc alter column contact_phone             set default '';
alter table public.provider_kyc alter column business_reg_number       set default '';
alter table public.provider_kyc alter column contractor_license_number set default '';
alter table public.provider_kyc alter column license_board             set default '';
alter table public.provider_kyc alter column id_document_type          set default '';

-- -----------------------------------------------------------------------------
-- 4. INDEXES
-- -----------------------------------------------------------------------------
create index if not exists idx_listings_category on public.service_listings(category);
create index if not exists idx_listings_provider on public.service_listings(provider_id);
create index if not exists idx_equipment_category on public.equipment_items(category);
create index if not exists idx_equipment_owner on public.equipment_items(owner_id);
create index if not exists idx_tickets_customer on public.tickets(customer_id);
create index if not exists idx_tickets_status on public.tickets(status);
create index if not exists idx_tickets_provider on public.tickets(selected_provider_id);
create index if not exists idx_interests_provider on public.ticket_interests(provider_id);
create index if not exists idx_bookings_consumer on public.bookings(consumer_id);
create index if not exists idx_bookings_provider on public.bookings(provider_id);
create index if not exists idx_orders_consumer on public.orders(consumer_id);
create index if not exists idx_disputes_claimant on public.disputes(claimant_id);
create index if not exists idx_addresses_user on public.dispatch_addresses(user_id);

-- -----------------------------------------------------------------------------
-- 5. TRIGGERS
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles','service_listings','equipment_items','tickets',
                           'dispatch_addresses','orders','bookings','provider_kyc'] loop
    execute format('drop trigger if exists trg_%1$s_touch on public.%1$s', t);
    execute format('create trigger trg_%1$s_touch before update on public.%1$s
                    for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- সাইন-আপের সাথে সাথেই প্রোফাইল তৈরি।
-- নিরাপত্তা: কেউ নিজেকে 'admin' বানাতে পারবে না।
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_role public.user_role;
begin
  v_role := case lower(coalesce(new.raw_user_meta_data->>'role','consumer'))
              when 'provider' then 'provider'::public.user_role
              else 'consumer'::public.user_role
            end;

  insert into public.profiles (id, email, full_name, phone, role, trade_title, business_name)
  values (
    new.id,
    coalesce(new.email,''),
    coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(coalesce(new.email,'user'),'@',1)),
    nullif(new.raw_user_meta_data->>'phone',''),
    v_role,
    nullif(new.raw_user_meta_data->>'trade_title',''),
    nullif(new.raw_user_meta_data->>'business_name','')
  )
  on conflict (id) do update set email = excluded.email;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 6. HELPER FUNCTIONS
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_provider()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'provider' from public.profiles where id = auth.uid()), false);
$$;

-- নিজের রোল পড়ার জন্য আলাদা ফাংশন।
-- সরাসরি profiles-এর ভেতরে subquery দিলে RLS infinite recursion হয়, তাই SECURITY DEFINER।
create or replace function public.my_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- প্রোভাইডার "আগ্রহী" চাপলে নিরাপদে টিকিটে যোগ হবে।
-- প্রোভাইডার নিজে tickets আপডেট করতে পারে না (RLS), তাই এই RPC দরকার।
create or replace function public.express_interest(p_ticket_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_name text; v_trade text;
begin
  if auth.uid() is null then
    raise exception 'লগইন প্রয়োজন';
  end if;
  if not public.is_provider() then
    raise exception 'শুধু প্রোভাইডার আগ্রহ দেখাতে পারেন';
  end if;

  select full_name, trade_title into v_name, v_trade
    from public.profiles where id = auth.uid();

  insert into public.ticket_interests (ticket_id, provider_id, provider_name, trade_title)
  values (p_ticket_id, auth.uid(), coalesce(v_name,'প্রোভাইডার'), v_trade)
  on conflict (ticket_id, provider_id) do nothing;

  update public.tickets
     set status = 'interest_expressed',
         updated_at = timezone('utc', now())
   where id = p_ticket_id
     and status = 'approved_open_for_interest';
end $$;

grant execute on function public.express_interest(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.service_listings   enable row level security;
alter table public.equipment_items    enable row level security;
alter table public.tickets            enable row level security;
alter table public.ticket_interests   enable row level security;
alter table public.dispatch_addresses enable row level security;
alter table public.orders             enable row level security;
alter table public.bookings           enable row level security;
alter table public.disputes           enable row level security;
alter table public.provider_kyc       enable row level security;

-- আগের পলিসি থাকলে মুছে ফেলা (নিরাপদে পুনরায় তৈরি করতে)
do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
     where schemaname = 'public'
       and tablename in ('profiles','service_listings','equipment_items','tickets','ticket_interests',
                         'dispatch_addresses','orders','bookings','disputes','provider_kyc')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- 7.1 profiles: নিজের রেকর্ড দেখা/আপডেট; অ্যাডমিন সব দেখে।
-- (অন্য ব্যবহারকারীর নাম-ফোন টিকিট/লিস্টিং-এ ডিনরমালাইজড থাকে, তাই এখানে পাবলিক রিড নেই)
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = public.my_role());

-- 7.2 service_listings: সবাই সক্রিয় লিস্টিং দেখে; মালিক নিজেরটা লেখে।
create policy "listings_read_active" on public.service_listings
  for select using (is_active = true or provider_id = auth.uid() or public.is_admin());

create policy "listings_insert_own" on public.service_listings
  for insert with check (auth.uid() = provider_id and is_seed = false);

create policy "listings_update_own" on public.service_listings
  for update using (auth.uid() = provider_id)
  with check (auth.uid() = provider_id and is_seed = false);

create policy "listings_delete_own" on public.service_listings
  for delete using (auth.uid() = provider_id);

-- 7.3 equipment_items
create policy "equipment_read_active" on public.equipment_items
  for select using (is_active = true or owner_id = auth.uid() or public.is_admin());

create policy "equipment_insert_own" on public.equipment_items
  for insert with check (auth.uid() = owner_id and is_seed = false);

create policy "equipment_update_own" on public.equipment_items
  for update using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id and is_seed = false);

create policy "equipment_delete_own" on public.equipment_items
  for delete using (auth.uid() = owner_id);

-- 7.4 tickets: গ্রাহক নিজের, প্রোভাইডার খোলা চাহিদা, নিযুক্ত প্রোভাইডার সব, অ্যাডমিন সব।
create policy "tickets_select" on public.tickets
  for select using (
    customer_id = auth.uid()
    or public.is_admin()
    or (public.is_provider() and status in ('approved_open_for_interest','interest_expressed'))
    or selected_provider_id = auth.uid()
  );

create policy "tickets_insert_own" on public.tickets
  for insert with check (customer_id = auth.uid() and status = 'pending_admin_review');

create policy "tickets_update_customer" on public.tickets
  for update using (customer_id = auth.uid()) with check (customer_id = auth.uid());

create policy "tickets_update_provider" on public.tickets
  for update using (selected_provider_id = auth.uid())
  with check (selected_provider_id = auth.uid());

create policy "tickets_admin_all" on public.tickets
  for all using (public.is_admin()) with check (public.is_admin());

-- 7.5 ticket_interests
create policy "interests_select" on public.ticket_interests
  for select using (
    provider_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.tickets t where t.id = ticket_id and t.customer_id = auth.uid())
  );

create policy "interests_insert_self" on public.ticket_interests
  for insert with check (provider_id = auth.uid() and public.is_provider());

create policy "interests_delete_self" on public.ticket_interests
  for delete using (provider_id = auth.uid());

-- 7.6 dispatch_addresses
create policy "addresses_own_all" on public.dispatch_addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 7.7 orders
create policy "orders_select_own" on public.orders
  for select using (consumer_id = auth.uid() or public.is_admin());

create policy "orders_insert_own" on public.orders
  for insert with check (consumer_id = auth.uid());

create policy "orders_update_own" on public.orders
  for update using (consumer_id = auth.uid()) with check (consumer_id = auth.uid());

-- 7.8 bookings
create policy "bookings_select" on public.bookings
  for select using (consumer_id = auth.uid() or provider_id = auth.uid() or public.is_admin());

create policy "bookings_insert_own" on public.bookings
  for insert with check (consumer_id = auth.uid());

create policy "bookings_update" on public.bookings
  for update using (consumer_id = auth.uid() or provider_id = auth.uid() or public.is_admin())
  with check (consumer_id = auth.uid() or provider_id = auth.uid() or public.is_admin());

-- 7.9 disputes
create policy "disputes_select" on public.disputes
  for select using (claimant_id = auth.uid() or respondent_id = auth.uid() or public.is_admin());

create policy "disputes_insert_own" on public.disputes
  for insert with check (claimant_id = auth.uid());

create policy "disputes_update" on public.disputes
  for update using (claimant_id = auth.uid() or public.is_admin())
  with check (claimant_id = auth.uid() or public.is_admin());

-- 7.10 provider_kyc
create policy "kyc_select_own" on public.provider_kyc
  for select using (provider_id = auth.uid() or public.is_admin());

create policy "kyc_upsert_own" on public.provider_kyc
  for insert with check (provider_id = auth.uid());

create policy "kyc_update_own" on public.provider_kyc
  for update using (provider_id = auth.uid() or public.is_admin())
  with check (provider_id = auth.uid() or public.is_admin());

-- -----------------------------------------------------------------------------
-- 8. STORAGE
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('equipment-photos','equipment-photos',true),
       ('kyc-documents','kyc-documents',false),
       ('dispute-evidence','dispute-evidence',false)
on conflict (id) do nothing;

do $$
declare p record;
begin
  for p in select policyname from pg_policies
            where schemaname = 'storage' and tablename = 'objects'
              and policyname in (
                'equipment_photos_read','equipment_photos_write',
                'kyc_docs_read','kyc_docs_write','dispute_evidence_write')
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;

create policy "equipment_photos_read" on storage.objects
  for select using (bucket_id = 'equipment-photos');

create policy "equipment_photos_write" on storage.objects
  for insert with check (bucket_id = 'equipment-photos' and auth.role() = 'authenticated');

create policy "kyc_docs_read" on storage.objects
  for select using (bucket_id = 'kyc-documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "kyc_docs_write" on storage.objects
  for insert with check (bucket_id = 'kyc-documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "dispute_evidence_write" on storage.objects
  for insert with check (bucket_id = 'dispute-evidence' and auth.role() = 'authenticated');

-- =============================================================================
-- 9. স্টার্টার ডেটা — বাস্তব বাংলা সার্ভিস লিস্টিং
-- এগুলো কোনো ব্যক্তির অ্যাকাউন্টের নয় (provider_id = NULL, is_seed = true)
-- =============================================================================
delete from public.service_listings where is_seed = true;
insert into public.service_listings
  (provider_id, provider_name, provider_title, provider_phone, category, subcategory,
   title, description, rate_type, rate, location, service_radius_km, available_slots, badge, is_seed)
values
  (null, 'নীলিমা টেক স্টুডিও', 'ওয়েব ও অ্যাপ ডেভেলপমেন্ট', null,
   'digital_gig', 'ওয়েবসাইট ও অ্যাপ',
   'রেসপন্সিভ ওয়েবসাইট ও মোবাইল অ্যাপ ডেভেলপমেন্ট',
   'ব্যবসার জন্য দ্রুতগতির ওয়েবসাইট, ই-কমার্স স্টোর এবং অ্যান্ড্রয়েড অ্যাপ তৈরি করা হয়। বাংলা ভাষা সাপোর্ট, বিকাশ ও নগদ পেমেন্ট ইন্টিগ্রেশন এবং ডেলিভারির পর ৩০ দিনের ফ্রি সাপোর্ট অন্তর্ভুক্ত।',
   'hourly', 1200, 'ঢাকা ও অনলাইন', 0,
   array['সকাল ১০টা','দুপুর ২টা','বিকেল ৫টা'], 'যাচাইকৃত স্টুডিও', true),

  (null, 'মিস্ত্রি হোম সার্ভিস', 'লাইসেন্সপ্রাপ্ত ইলেকট্রিশিয়ান', null,
   'home_repair', 'বৈদ্যুতিক কাজ',
   'ইলেকট্রিক ওয়্যারিং ও সার্কিট মেরামত',
   'বাসা ও অফিসের ওয়্যারিং, ব্রেকার পরিবর্তন, ফ্যান-লাইট ইনস্টলেশন এবং শর্ট সার্কিট সমস্যার সমাধান। কাজ শেষে ৩০ দিনের সার্ভিস ওয়ারেন্টি দেওয়া হয়।',
   'hourly', 850, 'বনানী, ঢাকা', 25,
   array['সকাল ৯টা','দুপুর ১২টা','বিকেল ৪টা'], '৩০ দিনের ওয়ারেন্টি', true),

  (null, 'ঢাকা প্লাম্বার্স', 'প্লাম্বিং বিশেষজ্ঞ', null,
   'home_repair', 'প্লাম্বিং',
   'পাইপ লিক ও পানির লাইন মেরামত',
   'পানির লিক শনাক্তকরণ, বাথরুম ফিটিং প্রতিস্থাপন, পানির ট্যাংক পরিষ্কার এবং সেপটিক ট্যাংক সমস্যার সমাধান। জরুরি প্রয়োজনে ২ ঘণ্টার মধ্যে পৌঁছানো হয়।',
   'hourly', 700, 'ধানমন্ডি, ঢাকা', 30,
   array['সকাল ৮টা','সকাল ১১টা','বিকেল ৩টা'], 'জরুরি সার্ভিস', true),

  (null, 'রঙধনু ডিজাইন হাউস', 'গ্রাফিক ও ব্র্যান্ড ডিজাইন', null,
   'digital_gig', 'গ্রাফিক ডিজাইন',
   'ব্র্যান্ড আইডেন্টিটি ও গ্রাফিক ডিজাইন',
   'লোগো ডিজাইন, ব্র্যান্ড গাইডলাইন, প্যাকেজিং ও সোশ্যাল মিডিয়া ক্রিয়েটিভ। প্রতিটি প্রজেক্টে ৩টি ধারণা এবং ২ বার রিভিশন অন্তর্ভুক্ত।',
   'fixed', 15000, 'অনলাইন', 0,
   array['যেকোনো সময়'], '৩টি ধারণা ফ্রি', true);

delete from public.equipment_items where is_seed = true;
insert into public.equipment_items
  (owner_id, owner_name, owner_phone, title, category, daily_rate, security_deposit,
   condition, condition_notes, location, pickup_option, available_units, photos, is_seed)
values
  (null, 'ঢাকা টুলস ডিপো', null,
   'রোটারি হ্যামার ড্রিল (হিলটি টিই ৭০)', 'পাওয়ার টুলস', 650, 3000,
   'Good', 'চিজেল বিট, গ্রিজ প্যাক ও ভাইব্রেশন কমানোর হ্যান্ডেল সহ।',
   'বনানী ডিপো, ঢাকা', 'pickup_only', 2, array[]::text[], true),

  (null, 'শক্তি জেনারেটর হাউস', null,
   '২ কেভিএ পেট্রোল জেনারেটর', 'জেনারেটর', 1400, 5000,
   'Like New', 'লোড শেয়ারিং সহ, এক ট্যাংকে প্রায় ৬ ঘণ্টা চলে।',
   'মিরপুর ডিপো, ঢাকা', 'delivery_available', 1, array[]::text[], true);

-- =============================================================================
-- 10. অ্যাডমিন বানানোর নিয়ম
-- =============================================================================
-- সাইটে সাইন-আপ করার পর এই কমান্ডটি নিজের ইমেইল দিয়ে একবার চালান:
--
--   update public.profiles set role = 'admin' where email = 'apnar@email.com';
--
-- এরপর লগআউট করে আবার লগইন করলেই অ্যাডমিন প্যানেল দেখা যাবে।
-- =============================================================================
