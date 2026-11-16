-- =============================================================================
-- dorymo — MASTER SCHEMA v2  (Psychology-Driven Service Marketplace)
-- Run this in Supabase SQL Editor. Idempotent: safe to re-run.
-- -----------------------------------------------------------------------------
-- WHY THIS DESIGN (solo-founder + psychology requirements):
--  * customers are AUTO-APPROVED, providers are PENDING until you approve them
--  * phone + NID live in `user_private`, NOT in the public `users` table
--    -> phone numbers stay HIDDEN until a confirmed order exists (RLS enforces it)
--  * the "backend logic" is Postgres functions + RLS, so there is NO server to
--    host/maintain. A separate Express server is unnecessary for manual SIM
--    verification: security is enforced at the database layer.
--  * money is NEVER auto-captured. `manual_payments` only records what the
--    customer claims they sent; YOU verify the SMS and click one button.
--
-- IMPORTANT: If your old prototype schema is still installed, run this in a
-- FRESH project first. To wipe the prototype tables, uncomment the RESET block
-- below (DESTRUCTIVE — deletes all data).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. RESET (optional, destructive) — uncomment only if you want a clean slate
-- -----------------------------------------------------------------------------
-- drop table if exists public.reviews cascade;
-- drop table if exists public.messages cascade;
-- drop table if exists public.manual_payments cascade;
-- drop table if exists public.orders cascade;
-- drop table if exists public.services cascade;
-- drop table if exists public.user_private cascade;
-- drop table if exists public.users cascade;
-- drop function if exists public.verify_manual_payment(uuid, boolean, text) cascade;
-- drop function if exists public.approve_provider(uuid, boolean) cascade;
-- drop function if exists public.create_manual_payment_order(uuid, text, text, text, text, boolean) cascade;

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- PREFLIGHT — the retired v1 prototype also had a table named `orders`, but it
-- used `consumer_id` instead of `customer_id`. CREATE TABLE IF NOT EXISTS would
-- silently keep that old table and every policy below would fail with
-- `42703: column "customer_id" does not exist`. Move it out of the way first.
-- Legacy rows are preserved in `orders_legacy_v1` — nothing is deleted.
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'orders'
      and column_name = 'consumer_id'
  ) then
    execute 'alter table public.orders rename to orders_legacy_v1';
  end if;
end $$;

-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- 1.1 users — PUBLIC-SAFE profile data only (no phone, no NID here!)
create table if not exists public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  full_name       text not null default 'ব্যবহারকারী',
  role            text not null default 'customer'
                    check (role in ('customer', 'provider', 'admin')),
  account_status  text not null default 'PENDING'
                    check (account_status in ('PENDING', 'APPROVED', 'REJECTED')),
  area            text,            -- thana/area: Sonadanga, Khalishpur, Shib Bari, Nirala...
  service_skill   text,            -- e.g. Electrician, Plumber, Web Developer
  is_nationwide   boolean not null default false,  -- true for digital providers
  avatar_url      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 1.2 user_private — SENSITIVE data, visible only to owner / admin / confirmed counterparty
create table if not exists public.user_private (
  user_id        uuid primary key references public.users(id) on delete cascade,
  phone          text not null default '',
  nid_number     text,
  nid_photo_url  text,
  updated_at     timestamptz not null default now()
);

-- 1.3 services — offers created by approved providers
create table if not exists public.services (
  id                uuid primary key default gen_random_uuid(),
  provider_id       uuid not null references public.users(id) on delete cascade,
  category          text not null
                      check (category in ('digital_gig', 'home_repair', 'equipment_rental')),
  title             text not null,
  description       text not null default '',
  price             numeric(12, 2) not null check (price >= 0),  -- fixed starting price shown on card
  price_unit        text not null default 'job'
                      check (price_unit in ('job', 'hour', 'day')),
  area              text,           -- null when is_nationwide = true
  is_nationwide     boolean not null default false,
  security_deposit  numeric(12, 2) not null default 0,  -- equipment rental only
  response_minutes  integer not null default 90,         -- "within 90 mins" promise
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 1.4 orders — one booking; payment_mode decides the flow
create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  customer_id        uuid not null references public.users(id) on delete cascade,
  provider_id        uuid references public.users(id) on delete set null,
  service_id         uuid references public.services(id) on delete set null,
  category           text not null
                       check (category in ('digital_gig', 'home_repair', 'equipment_rental')),
  amount             numeric(12, 2) not null,  -- price + deposit
  deposit_amount     numeric(12, 2) not null default 0,
  payment_mode       text not null
                       check (payment_mode in ('manual_sim', 'cash_after_work')),
  status             text not null default 'payment_verifying'
                       check (status in (
                         'payment_verifying',   -- customer claims they sent money
                         'payment_approved',    -- YOU verified the SMS -> job unlocked
                         'payment_rejected',    -- YOU rejected it
                         'in_progress',         -- cash-after-work, or approved + started
                         'completed',
                         'cancelled',
                         'disputed'
                       )),
  address            text,
  settlement_trx_id  text,           -- customer's TrxID after Cash-After-Work
  commission_amount  numeric(12, 2) not null default 0,  -- 10% of service price (NOT deposit)
  provider_payout_amount numeric(12, 2) not null default 0, -- amount the provider earns
  provider_paid      boolean not null default false,
  deposit_refunded   boolean not null default false,
  deposit_refund_trx_id text,
  scheduled_date     date,
  time_slot          text,
  deposit_return_status text not null default 'not_applicable'
                       check (deposit_return_status in ('not_applicable','pending_return','clean_pass','damage_detected','refunded')),
  return_note        text,
  warranty_until     timestamptz,   -- 7-day free service warranty (reciprocity nudge)
  next_order_discount numeric(12, 2) not null default 0,  -- ৳100 next-order discount
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- 1.5 manual_payments — the 3-field SIM payment claim
create table if not exists public.manual_payments (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null unique references public.orders(id) on delete cascade,
  customer_id    uuid not null references public.users(id) on delete cascade,
  method         text not null check (method in ('bkash', 'nagad')),
  sender_number  text not null,   -- sender last 4 digits / full number
  trx_id         text not null,
  amount         numeric(12, 2) not null,
  status         text not null default 'PENDING_VERIFICATION'
                   check (status in ('PENDING_VERIFICATION', 'APPROVED', 'REJECTED')),
  admin_note     text,
  verified_by    uuid references public.users(id) on delete set null,
  submitted_at   timestamptz not null default now(),
  verified_at    timestamptz,
  updated_at     timestamptz not null default now()
);

-- 1.5a saved_addresses — customer's reusable delivery/dispatch addresses
create table if not exists public.saved_addresses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  label      text not null default 'বাসা',
  street     text not null,
  city       text not null default 'Khulna',
  zip        text not null default '',
  notes      text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- 1.5b payouts — one row per provider payment (the founder's commission ledger)
create table if not exists public.payouts (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null unique references public.orders(id) on delete cascade,
  provider_id      uuid not null references public.users(id) on delete cascade,
  commission_amount numeric(12, 2) not null default 0,
  payout_amount    numeric(12, 2) not null default 0,
  trx_id           text,
  status           text not null default 'pending' check (status in ('pending', 'paid')),
  paid_at          timestamptz,
  note             text,
  created_at       timestamptz not null default now()
);

-- 1.6 messages — in-app chat (replaces phone sharing before confirmation)
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  sender_id  uuid not null references public.users(id) on delete cascade,
  body       text not null check (length(body) between 1 and 2000),
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

-- 1.7 reviews — real ratings (no hardcoded 5-star fake data)
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null unique references public.orders(id) on delete cascade,
  customer_id uuid not null references public.users(id) on delete cascade,
  provider_id uuid not null references public.users(id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  comment     text not null default '',
  created_at  timestamptz not null default now()
);

-- 1.8 Idempotent migration for databases created before commission columns existed.
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='commission_amount') then
    alter table public.orders add column commission_amount numeric(12,2) not null default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='provider_payout_amount') then
    alter table public.orders add column provider_payout_amount numeric(12,2) not null default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='provider_paid') then
    alter table public.orders add column provider_paid boolean not null default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='deposit_refunded') then
    alter table public.orders add column deposit_refunded boolean not null default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='deposit_refund_trx_id') then
    alter table public.orders add column deposit_refund_trx_id text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='scheduled_date') then
    alter table public.orders add column scheduled_date date;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='time_slot') then
    alter table public.orders add column time_slot text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='deposit_return_status') then
    alter table public.orders add column deposit_return_status text not null default 'not_applicable';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='return_note') then
    alter table public.orders add column return_note text;
  end if;
end $$;

-- =============================================================================
-- 2. INDEXES (fast admin queue + hyper-local filtering)
-- =============================================================================
create index if not exists idx_users_role_status      on public.users(role, account_status);
create index if not exists idx_users_area              on public.users(area);
create index if not exists idx_services_provider       on public.services(provider_id);
create index if not exists idx_services_category_area  on public.services(category, area) where is_active = true;
create index if not exists idx_orders_customer         on public.orders(customer_id, created_at desc);
create index if not exists idx_orders_provider         on public.orders(provider_id, created_at desc);
create index if not exists idx_orders_status           on public.orders(status);
create index if not exists idx_payments_status         on public.manual_payments(status, submitted_at);
create index if not exists idx_addresses_user          on public.saved_addresses(user_id);
create index if not exists idx_payouts_status          on public.payouts(status);
create index if not exists idx_payouts_provider        on public.payouts(provider_id);
create index if not exists idx_messages_order          on public.messages(order_id, created_at);
create index if not exists idx_reviews_provider        on public.reviews(provider_id);

-- =============================================================================
-- 3. HELPERS + TRIGGERS
-- =============================================================================

-- 3.1 updated_at maintenance
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_users_touch on public.users;
create trigger trg_users_touch before update on public.users
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_private_touch on public.user_private;
create trigger trg_private_touch before update on public.user_private
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_services_touch on public.services;
create trigger trg_services_touch before update on public.services
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_orders_touch on public.orders;
create trigger trg_orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_payments_touch on public.manual_payments;
create trigger trg_payments_touch before update on public.manual_payments
  for each row execute function public.touch_updated_at();

-- 3.2 role helpers (SECURITY DEFINER so RLS on users can't recurse)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  );
$$;

create or replace function public.is_approved_provider()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'provider' and u.account_status = 'APPROVED'
  );
$$;

-- 3.3 phone reveal rule: only after a confirmed/paid order with that person
create or replace function public.has_confirmed_order_with(p_target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.orders o
    where o.status in ('payment_approved', 'in_progress', 'completed')
      and (
        (o.customer_id = auth.uid() and o.provider_id = p_target)
        or
        (o.provider_id = auth.uid() and o.customer_id = p_target)
      )
  );
$$;

-- 3.4 auto-create profile on signup
--   Customers -> APPROVED instantly (zero-friction entry)
--   Providers -> PENDING (you approve manually)
--   Admin role can NEVER be self-assigned; only YOU set it via SQL.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role   text := coalesce(new.raw_user_meta_data->>'role', 'customer');
  v_name   text := coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1), 'ব্যবহারকারী');
  v_phone  text := coalesce(new.raw_user_meta_data->>'phone', '');
begin
  if v_role not in ('customer', 'provider', 'admin') then
    v_role := 'customer';
  end if;
  -- prevent privilege escalation: nobody can sign up as admin
  if v_role = 'admin' then
    v_role := 'customer';
  end if;

  insert into public.users (id, email, full_name, role, account_status, area, service_skill, is_nationwide)
  values (
    new.id,
    new.email,
    v_name,
    v_role,
    case when v_role = 'provider' then 'PENDING' else 'APPROVED' end,
    nullif(new.raw_user_meta_data->>'area', ''),
    nullif(new.raw_user_meta_data->>'service_skill', ''),
    coalesce((new.raw_user_meta_data->>'is_nationwide')::boolean, false)
  );

  insert into public.user_private (user_id, phone)
  values (new.id, v_phone);

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3.5 BACKFILL existing v1 accounts into the new tables.
--     Without this, anyone who signed up under the retired app would have no
--     `public.users` row and could not log in. Existing admins keep admin role;
--     existing providers become PENDING (they must redo NID verification).
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profiles'
  ) then
    insert into public.users (id, email, full_name, role, account_status, service_skill, created_at)
    select
      p.id,
      coalesce(p.email, ''),
      coalesce(nullif(p.full_name, ''), split_part(coalesce(p.email, ''), '@', 1), 'ব্যবহারকারী'),
      case when p.role = 'admin' then 'admin' when p.role = 'provider' then 'provider' else 'customer' end,
      case when p.role = 'provider' then 'PENDING' else 'APPROVED' end,
      nullif(p.trade_title, ''),
      coalesce(p.created_at, now())
    from public.profiles p
    where not exists (select 1 from public.users u where u.id = p.id)
    on conflict (id) do nothing;

    insert into public.user_private (user_id, phone)
    select p.id, coalesce(p.phone, '')
    from public.profiles p
    where not exists (select 1 from public.user_private up where up.user_id = p.id)
    on conflict (user_id) do nothing;
  end if;
end $$;

-- =============================================================================
-- 4. BACKEND LOGIC (Postgres functions = secure, atomic, no Express needed)
-- =============================================================================

-- 4.1 Customer submits checkout. Creates the order + payment claim in ONE
--     transaction. Cash-after-work orders skip payment and start in_progress.
create or replace function public.create_manual_payment_order(
  p_service_id     uuid,
  p_address        text,
  p_method         text,
  p_sender_number  text,
  p_trx_id         text,
  p_cash_after_work boolean default false,
  p_scheduled_date date default null,
  p_time_slot      text default null
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_service   services%rowtype;
  v_order     uuid;
  v_amount    numeric(12,2);
  v_commission numeric(12,2);
  v_payout    numeric(12,2);
begin
  if auth.uid() is null then
    raise exception 'Login required';
  end if;

  select * into v_service
  from public.services
  where id = p_service_id and is_active = true;

  if not found then
    raise exception 'Service not found or inactive';
  end if;

  v_amount := v_service.price + v_service.security_deposit;
  -- 10% commission on the SERVICE PRICE only; never on the refundable deposit.
  v_commission := round(v_service.price * 0.10, 2);
  v_payout := v_service.price - v_commission;

  insert into public.orders (
    customer_id, provider_id, service_id, category, amount,
    deposit_amount, commission_amount, provider_payout_amount,
    payment_mode, status, address, scheduled_date, time_slot,
    deposit_return_status
  )
  values (
    auth.uid(), v_service.provider_id, p_service_id, v_service.category, v_amount,
    v_service.security_deposit, v_commission, v_payout,
    case when p_cash_after_work then 'cash_after_work' else 'manual_sim' end,
    case when p_cash_after_work then 'in_progress' else 'payment_verifying' end,
    p_address, p_scheduled_date, p_time_slot,
    case when v_service.security_deposit > 0 then 'pending_return' else 'not_applicable' end
  )
  returning id into v_order;

  if not p_cash_after_work then
    if p_method not in ('bkash', 'nagad') then
      raise exception 'Invalid payment method';
    end if;
    if p_trx_id is null or length(trim(p_trx_id)) < 4 then
      raise exception 'সঠিক Transaction ID দিন।';
    end if;
    -- prevent one TrxID being claimed by two orders
    if exists (select 1 from public.manual_payments where trx_id = trim(p_trx_id)) then
      raise exception 'এই TrxID আগেই জমা দেওয়া হয়েছে। নতুন TrxID দিন।';
    end if;
    insert into public.manual_payments (order_id, customer_id, method, sender_number, trx_id, amount)
    values (v_order, auth.uid(), p_method, p_sender_number, trim(p_trx_id), v_amount);
  end if;

  return v_order;
end $$;

-- 4.1b Database-level guard: a TrxID can only ever be claimed once.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'manual_payments_trx_id_key' and conrelid = 'public.manual_payments'::regclass
  ) then
    alter table public.manual_payments
      add constraint manual_payments_trx_id_key unique (trx_id);
  end if;
end $$;

-- 4.1c Customer actions on their own order — RPC-only (no open UPDATE policy).
-- Idempotent migration for databases created before settlement_trx_id existed.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders'
      and column_name = 'settlement_trx_id'
  ) then
    alter table public.orders add column settlement_trx_id text;
  end if;
end $$;

-- Cancel before completion.
create or replace function public.customer_cancel_order(p_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.orders
     set status = 'cancelled', updated_at = now()
   where id = p_order_id
     and customer_id = auth.uid()
     and status in ('payment_verifying', 'payment_approved', 'in_progress');
  if not found then
    raise exception 'এই অর্ডারটি বাতিল করা যাবে না';
  end if;
end $$;

-- Cash-After-Work settlement: customer records the TrxID they paid after work.
create or replace function public.customer_settle_cash_order(
  p_order_id uuid,
  p_trx_id   text
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_trx_id is null or length(trim(p_trx_id)) < 4 then
    raise exception 'সঠিক Transaction ID দিন';
  end if;
  update public.orders
     set status = 'completed',
         settlement_trx_id = trim(p_trx_id),
         updated_at = now()
   where id = p_order_id
     and customer_id = auth.uid()
     and payment_mode = 'cash_after_work'
     and status = 'in_progress';
  if not found then
    raise exception 'এই অর্ডারটি নিষ্পত্তি করা যাবে না';
  end if;
end $$;

grant execute on function public.customer_cancel_order(uuid) to authenticated;
grant execute on function public.customer_settle_cash_order(uuid, text) to authenticated;

-- 4.2 ONE-CLICK admin payment verification (the core solo-founder action)
create or replace function public.verify_manual_payment(
  p_payment_id uuid,
  p_approve    boolean,
  p_note       text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  select order_id into v_order_id
  from public.manual_payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'Payment not found';
  end if;

  if p_approve then
    update public.manual_payments
       set status = 'APPROVED',
           verified_at = now(),
           verified_by = auth.uid(),
           admin_note = coalesce(p_note, admin_note)
     where id = p_payment_id;

    -- unlock the job for the provider + attach reciprocity/loss-aversion rewards
    update public.orders
       set status = case when status = 'payment_verifying' then 'payment_approved' else status end,
           warranty_until = now() + interval '7 days',
           next_order_discount = 100,
           updated_at = now()
     where id = v_order_id;
  else
    update public.manual_payments
       set status = 'REJECTED',
           verified_at = now(),
           verified_by = auth.uid(),
           admin_note = coalesce(p_note, admin_note)
     where id = p_payment_id;

    update public.orders
       set status = 'payment_rejected', updated_at = now()
     where id = v_order_id;
  end if;
end $$;

-- 4.3 ONE-CLICK admin provider approval
create or replace function public.approve_provider(p_user_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  update public.users
     set account_status = case when p_approve then 'APPROVED' else 'REJECTED' end,
         updated_at = now()
   where id = p_user_id and role = 'provider';
end $$;

grant execute on function public.create_manual_payment_order(uuid, text, text, text, text, boolean) to authenticated;
grant execute on function public.create_manual_payment_order(uuid, text, text, text, text, boolean, date, text) to authenticated;
grant execute on function public.verify_manual_payment(uuid, boolean, text) to authenticated;
grant execute on function public.approve_provider(uuid, boolean) to authenticated;

-- =============================================================================
-- 5. ROW LEVEL SECURITY
-- =============================================================================
alter table public.users           enable row level security;
alter table public.user_private    enable row level security;
alter table public.services        enable row level security;
alter table public.orders          enable row level security;
alter table public.manual_payments enable row level security;
alter table public.payouts        enable row level security;
alter table public.saved_addresses enable row level security;
alter table public.messages        enable row level security;
alter table public.reviews         enable row level security;

-- ----- users ----------------------------------------------------------------
drop policy if exists users_select on public.users;
create policy users_select on public.users
  for select to authenticated
  using (id = auth.uid() or public.is_admin() or role in ('customer', 'provider'));

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select u.role from public.users u where u.id = auth.uid())
    and account_status = (select u.account_status from public.users u where u.id = auth.uid())
  );

drop policy if exists users_admin_all on public.users;
create policy users_admin_all on public.users
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ----- user_private (PHONE + NID — hidden until confirmed order) -------------
drop policy if exists private_select on public.user_private;
create policy private_select on public.user_private
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or public.has_confirmed_order_with(user_id)
  );

drop policy if exists private_insert_own on public.user_private;
create policy private_insert_own on public.user_private
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists private_update_own on public.user_private;
create policy private_update_own on public.user_private
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ----- services -------------------------------------------------------------
drop policy if exists services_select on public.services;
create policy services_select on public.services
  for select to anon, authenticated
  using (is_active = true or provider_id = auth.uid() or public.is_admin());

drop policy if exists services_insert on public.services;
create policy services_insert on public.services
  for insert to authenticated
  with check (provider_id = auth.uid() and public.is_approved_provider());

drop policy if exists services_update on public.services;
create policy services_update on public.services
  for update to authenticated
  using (provider_id = auth.uid() or public.is_admin())
  with check (provider_id = auth.uid() or public.is_admin());

drop policy if exists services_delete on public.services;
create policy services_delete on public.services
  for delete to authenticated
  using (provider_id = auth.uid() or public.is_admin());

-- ----- orders ---------------------------------------------------------------
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders
  for select to authenticated
  using (customer_id = auth.uid() or provider_id = auth.uid() or public.is_admin());

drop policy if exists orders_insert on public.orders;
create policy orders_insert on public.orders
  for insert to authenticated with check (customer_id = auth.uid());

-- SECURITY: no open UPDATE policy for customers/providers.
-- An open UPDATE would let them change `status`, `amount`, `provider_id` etc.
-- All mutations go through the RPCs below (SECURITY DEFINER + strict checks).
drop policy if exists orders_customer_update on public.orders;
drop policy if exists orders_provider_update on public.orders;

drop policy if exists orders_admin_all on public.orders;
create policy orders_admin_all on public.orders
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ----- manual_payments (customer submits, ONLY admin verifies) --------------
drop policy if exists payments_select on public.manual_payments;
create policy payments_select on public.manual_payments
  for select to authenticated
  using (customer_id = auth.uid() or public.is_admin());

-- SECURITY: no direct INSERT policy — payment claims (with server-computed
-- amounts) may ONLY be created by create_manual_payment_order().
drop policy if exists payments_insert on public.manual_payments;

drop policy if exists payments_admin_all on public.manual_payments;
create policy payments_admin_all on public.manual_payments
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- NOTE: there is deliberately NO customer/provider update policy.
-- Only the verify_manual_payment() function (admin-only) can change status.

-- ----- saved_addresses (customer owns their addresses) -----------------------
drop policy if exists addresses_own_all on public.saved_addresses;
create policy addresses_own_all on public.saved_addresses
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ----- payouts (admin records payment; provider can see their own) -----------
drop policy if exists payouts_select_own on public.payouts;
create policy payouts_select_own on public.payouts
  for select to authenticated
  using (provider_id = auth.uid() or public.is_admin());

drop policy if exists payouts_admin_all on public.payouts;
create policy payouts_admin_all on public.payouts
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ----- messages (in-app chat, participants only) ----------------------------
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.customer_id = auth.uid() or o.provider_id = auth.uid())
    )
    or public.is_admin()
  );

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.orders o
      where o.id = order_id and (o.customer_id = auth.uid() or o.provider_id = auth.uid())
    )
  );

-- ----- reviews --------------------------------------------------------------
drop policy if exists reviews_select on public.reviews;
create policy reviews_select on public.reviews
  for select to anon, authenticated using (true);

drop policy if exists reviews_insert on public.reviews;
create policy reviews_insert on public.reviews
  for insert to authenticated
  with check (
    customer_id = auth.uid()
    and exists (
      select 1 from public.orders o
      where o.id = order_id and o.customer_id = auth.uid() and o.status = 'completed'
    )
  );

-- =============================================================================
-- 6. GRANTS (Supabase usually grants these; explicit is safer)
-- =============================================================================
grant usage on schema public to anon, authenticated;
grant select on public.users, public.services, public.reviews to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- =============================================================================
-- 7. HOW TO MAKE YOURSELF ADMIN (run once, after you sign up)
-- -----------------------------------------------------------------------------
--   update public.users set role = 'admin', account_status = 'APPROVED'
--   where email = 'your-email@example.com';
--
-- Then log out and log back in. You cannot become admin via the signup form.
-- =============================================================================

-- =============================================================================
-- 8. STEP 3 — SIGNUP SUPPORT: private NID document storage
--    Path rule: <user-id>/nid-<timestamp>.<ext>  (only the owner / admin can read)
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('nid-documents', 'nid-documents', false)
on conflict (id) do nothing;

drop policy if exists nid_insert_own on storage.objects;
create policy nid_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'nid-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists nid_select_own_or_admin on storage.objects;
create policy nid_select_own_or_admin on storage.objects
  for select to authenticated
  using (
    bucket_id = 'nid-documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

drop policy if exists nid_update_own on storage.objects;
create policy nid_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'nid-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'nid-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================================================
-- 9. STEP 3 — PROVIDER JOB RPCs (hyper-local + nationwide enforced server-side)
-- =============================================================================

-- Only jobs the provider is allowed to see:
--   nationwide digital services, or services in the provider's own thana/area.
create or replace function public.available_orders_for_provider()
returns table (
  id             uuid,
  category       text,
  title          text,
  amount         numeric,
  deposit_amount numeric,
  area           text,
  customer_name  text,
  created_at     timestamptz,
  status         text
)
language sql stable security definer set search_path = public as $$
  select o.id, o.category, s.title, o.amount, o.deposit_amount,
         coalesce(nullif(s.area, ''), u.area, 'Nationwide') as area,
         u.full_name as customer_name, o.created_at, o.status
  from public.orders o
  join public.services s on s.id = o.service_id
  join public.users u on u.id = o.customer_id
  where o.status = 'payment_approved'
    and o.provider_id is null
    and exists (
      select 1 from public.users me
      where me.id = auth.uid()
        and me.role = 'provider'
        and me.account_status = 'APPROVED'
        and (
          me.is_nationwide = true
          or s.is_nationwide = true
          or s.area = me.area
        )
    );
$$;

-- One-click accept: atomic, prevents two providers grabbing the same job.
create or replace function public.provider_accept_order(p_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_approved_provider() then
    raise exception 'Only approved providers can accept jobs';
  end if;

  update public.orders
     set provider_id = auth.uid(),
         status = 'in_progress',
         updated_at = now()
   where id = p_order_id
     and provider_id is null
     and status = 'payment_approved';

  if not found then
    raise exception 'This job is no longer available';
  end if;
end $$;

-- Mark job done; customer can now leave a real review.
create or replace function public.provider_complete_order(p_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.orders
     set status = 'completed', updated_at = now()
   where id = p_order_id
     and provider_id = auth.uid()
     and status = 'in_progress';

  if not found then
    raise exception 'Job not found or not in progress';
  end if;

  -- Open a payout row so it appears in the founder's ledger automatically.
  insert into public.payouts (order_id, provider_id, commission_amount, payout_amount)
  select o.id, o.provider_id, o.commission_amount, o.provider_payout_amount
  from public.orders o
  where o.id = p_order_id
  on conflict (order_id) do nothing;
end $$;

-- Customer confirms a rented tool came back clean (or reports damage).
create or replace function public.customer_confirm_tool_return(
  p_order_id  uuid,
  p_condition text,
  p_note      text default null
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_condition not in ('clean', 'damaged') then
    raise exception 'Invalid return condition';
  end if;

  update public.orders
     set deposit_return_status = case when p_condition = 'clean' then 'clean_pass' else 'damage_detected' end,
         return_note = p_note,
         updated_at = now()
   where id = p_order_id
     and customer_id = auth.uid()
     and status = 'completed'
     and deposit_amount > 0
     and deposit_return_status in ('pending_return','damage_detected');

  if not found then
    raise exception 'এই অর্ডারের জন্য ফেরত নিশ্চিত করা যাবে না';
  end if;
end $$;

grant execute on function public.customer_confirm_tool_return(uuid, text, text) to authenticated;

-- Admin records that they sent the provider's money via bKash/Nagad.
create or replace function public.record_payout(
  p_order_id uuid,
  p_trx_id   text,
  p_note     text default null
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  if p_trx_id is null or length(trim(p_trx_id)) < 4 then
    raise exception 'সঠিক TrxID দিন';
  end if;

  update public.payouts
     set status = 'paid', trx_id = trim(p_trx_id), paid_at = now(), note = p_note
   where order_id = p_order_id;

  if not found then
    raise exception 'Payout row not found';
  end if;

  update public.orders
     set provider_paid = true, updated_at = now()
   where id = p_order_id;
end $$;

-- Admin records that the rental deposit was returned to the customer.
create or replace function public.record_deposit_refund(
  p_order_id uuid,
  p_trx_id   text
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  if p_trx_id is null or length(trim(p_trx_id)) < 4 then
    raise exception 'সঠিক TrxID দিন';
  end if;

  update public.orders
     set deposit_refunded = true,
         deposit_refund_trx_id = trim(p_trx_id),
         deposit_return_status = 'refunded',
         updated_at = now()
   where id = p_order_id
     and deposit_amount > 0;

  if not found then
    raise exception 'No deposit on this order';
  end if;
end $$;

grant execute on function public.available_orders_for_provider() to authenticated;
grant execute on function public.provider_accept_order(uuid) to authenticated;
grant execute on function public.provider_complete_order(uuid) to authenticated;
grant execute on function public.record_payout(uuid, text, text) to authenticated;
grant execute on function public.record_deposit_refund(uuid, text) to authenticated;

-- =============================================================================
-- 10. STEP 4 — REVIEWS (real ratings replace the old hardcoded 5-star data)
-- =============================================================================
create or replace function public.submit_review(
  p_order_id uuid,
  p_rating   integer,
  p_comment  text
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_provider uuid;
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Rating must be between 1 and 5';
  end if;

  select provider_id into v_provider
  from public.orders
  where id = p_order_id
    and customer_id = auth.uid()
    and status = 'completed';

  if not found or v_provider is null then
    raise exception 'Only the customer of a completed job can leave a review';
  end if;

  insert into public.reviews (order_id, customer_id, provider_id, rating, comment)
  values (p_order_id, auth.uid(), v_provider, coalesce(p_comment, ''));
end $$;

grant execute on function public.submit_review(uuid, integer, text) to authenticated;

-- =============================================================================
-- 11. STEP 4 — IN-APP CHAT NOTES
--     messages are already fully RLS-protected (participants only, admin read).
--     Chat polling is kept as a fallback; Realtime now also refreshes it.
-- =============================================================================

-- =============================================================================
-- 12. STEP 5 — REALTIME NOTIFICATIONS
--     A single `notifications` table + DB triggers auto-notify the right person
--     the instant something happens. The client subscribes with Supabase
--     Realtime -> instant toast + bell badge, no polling, no Express server.
-- =============================================================================

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  type       text not null
               check (type in ('payment_pending','payment_approved','payment_rejected',
                               'provider_pending','provider_approved','provider_rejected',
                               'new_message','job_accepted','job_completed',
                               'deposit_dispute','deposit_clean','deposit_refunded')),
  title      text not null,
  body       text not null default '',
  link       text,             -- hash route, e.g. '#/admin-verify'
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_unread on public.notifications(user_id, is_read);

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Only the DB (triggers) inserts notifications; clients never insert directly.

-- 12.1 helper: notify one user
create or replace function public.notify_user(
  p_user  uuid,
  p_type  text,
  p_title text,
  p_body  text default '',
  p_link  text default null
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user is null then return; end if;
  insert into public.notifications (user_id, type, title, body, link)
  values (p_user, p_type, p_title, p_body, p_link);
end $$;

-- 12.2 helper: notify every admin (the solo founder)
create or replace function public.notify_admins(
  p_type  text,
  p_title text,
  p_body  text default '',
  p_link  text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select id from public.users where role = 'admin' loop
    perform public.notify_user(r.id, p_type, p_title, p_body, p_link);
  end loop;
end $$;

-- 12.3 NEW manual payment -> founder sees it instantly
create or replace function public.trg_payment_pending()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
  if tg_op = 'INSERT' and new.status = 'PENDING_VERIFICATION' then
    select full_name into v_name from public.users where id = new.customer_id;
    perform public.notify_admins(
      'payment_pending',
      'নতুন পেমেন্ট যাচাই করুন',
      coalesce(v_name, 'গ্রাহক') || ' · ' || new.amount || ' টাকা · TrxID ' || new.trx_id,
      '#/admin-verify'
    );
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'APPROVED' then
      perform public.notify_user(new.customer_id, 'payment_approved',
        'পেমেন্ট অনুমোদিত ✅',
        'আপনার অর্ডারটি অনুমোদিত হয়েছে — প্রোভাইডার কাজ শুরু করবে। ৭ দিনের ওয়ারেন্টি + ৳১০০ ছাড় যোগ হয়েছে।',
        '#/chat-v2');
    elsif new.status = 'REJECTED' then
      perform public.notify_user(new.customer_id, 'payment_rejected',
        'পেমেন্ট বাতিল',
        coalesce(new.admin_note, 'TrxID মেলেনি। অনুগ্রহ করে আবার চেষ্টা করুন।'),
        '#/pay');
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_payment_pending on public.manual_payments;
create trigger trg_payment_pending after insert or update on public.manual_payments
  for each row execute function public.trg_payment_pending();

-- 12.4 NEW provider signup -> founder; approval result -> provider
create or replace function public.trg_provider_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and new.role = 'provider' and new.account_status = 'PENDING' then
    perform public.notify_admins(
      'provider_pending',
      'নতুন প্রোভাইডার অনুমোদন করুন',
      new.full_name || coalesce(' · ' || new.service_skill, '') || coalesce(' · ' || new.area, ''),
      '#/admin-verify'
    );
  end if;

  if tg_op = 'UPDATE' and new.role = 'provider'
     and new.account_status is distinct from old.account_status then
    if new.account_status = 'APPROVED' then
      perform public.notify_user(new.id, 'provider_approved',
        'অ্যাকাউন্ট অনুমোদিত 🎉',
        'আপনার NID যাচাই শেষ। এখন কাজ দেখে গ্রহণ করতে পারেন।',
        '#/provider-jobs');
    elsif new.account_status = 'REJECTED' then
      perform public.notify_user(new.id, 'provider_rejected',
        'অনুমোদন বাতিল',
        'NID তথ্য মেলেনি। অনুগ্রহ করে নতুন করে আবেদন করুন।',
        null);
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_provider_status on public.users;
create trigger trg_provider_status after insert or update on public.users
  for each row execute function public.trg_provider_status();

-- 12.5 NEW chat message -> notify the OTHER participant
create or replace function public.trg_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_customer uuid;
  v_provider uuid;
  v_target   uuid;
  v_sender   text;
begin
  select customer_id, provider_id into v_customer, v_provider
  from public.orders where id = new.order_id;

  if v_customer = new.sender_id then v_target := v_provider;
  elsif v_provider = new.sender_id then v_target := v_customer;
  else v_target := v_customer; end if;

  select full_name into v_sender from public.users where id = new.sender_id;

  perform public.notify_user(
    v_target,
    'new_message',
    'নতুন মেসেজ 💬',
    coalesce(v_sender, 'কেউ') || ': ' || left(new.body, 80),
    '#/chat-v2'
  );
  return new;
end $$;

drop trigger if exists trg_new_message on public.messages;
create trigger trg_new_message after insert on public.messages
  for each row execute function public.trg_new_message();

-- 12.6 order status changes -> customer / provider
create or replace function public.trg_order_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'in_progress' and old.status = 'payment_approved' then
      perform public.notify_user(new.customer_id, 'job_accepted',
        'প্রোভাইডার কাজ শুরু করেছেন',
        'আপনার অর্ডার এখন চলমান। চ্যাটে যোগাযোগ করতে পারেন।',
        '#/chat-v2');
    elsif new.status = 'completed' then
      perform public.notify_user(new.customer_id, 'job_completed',
        'কাজ সম্পন্ন — রিভিউ দিন ⭐',
        'কাজ বুঝে নিয়ে রিভিউ দিন। আপনার মতামত অন্য ক্রেতাদের সাহায্য করবে।',
        '#/reviews-v2');
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_order_status on public.orders;
create trigger trg_order_status after update on public.orders
  for each row execute function public.trg_order_status();

-- 12.6b Deposit return events -> founder (damage) / customer (refund done)
create or replace function public.trg_deposit_return()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.deposit_return_status is distinct from old.deposit_return_status then
    if new.deposit_return_status = 'damage_detected' then
      perform public.notify_admins(
        'deposit_dispute',
        'যন্ত্রপাতি ক্ষতিগ্রস্ত — জামানত আটকান',
        coalesce(new.return_note, 'ক্রেতা ক্ষতির কথা জানিয়েছেন। যাচাই করুন।'),
        '#/admin-verify'
      );
    elsif new.deposit_return_status = 'clean_pass' then
      perform public.notify_admins(
        'deposit_clean',
        'যন্ত্রপাতি ফেরত — জামানত ফেরত দিন',
        'ক্রেতা যন্ত্রপাতি নিরাপদে ফেরত দিয়েছেন। জামানত ফেরতের ট্রানজেকশন রেকর্ড করুন।',
        '#/admin-verify'
      );
    elsif new.deposit_return_status = 'refunded' then
      perform public.notify_user(new.customer_id, 'deposit_refunded',
        'জামানত ফেরত দেওয়া হয়েছে ✅',
        'আপনার রিফান্ড ট্রানজেকশন রেকর্ড করা হয়েছে।',
        '#/my-account');
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_deposit_return on public.orders;
create trigger trg_deposit_return after update on public.orders
  for each row execute function public.trg_deposit_return();

-- 12.7 mark notifications table as realtime (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- Realtime needs REPLICA IDENTITY to deliver row data reliably
alter table public.notifications replica identity full;

-- =============================================================================
-- 13. OPTIONAL — PHONE PUSH: device tokens for the push-notify Edge Function
--     (native app only; website simply uses the in-app bell/toast)
-- =============================================================================
create table if not exists public.device_tokens (
  token     text primary key,
  user_id   uuid not null references public.users(id) on delete cascade,
  platform  text not null check (platform in ('android', 'ios', 'web')),
  created_at timestamptz not null default now()
);

create index if not exists idx_device_tokens_user on public.device_tokens(user_id);

alter table public.device_tokens enable row level security;

drop policy if exists device_tokens_insert_own on public.device_tokens;
create policy device_tokens_insert_own on public.device_tokens
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists device_tokens_update_own on public.device_tokens;
create policy device_tokens_update_own on public.device_tokens
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists device_tokens_delete_own on public.device_tokens;
create policy device_tokens_delete_own on public.device_tokens
  for delete to authenticated using (user_id = auth.uid());

-- No select policy: only the service-role Edge Function reads tokens.

-- =============================================================================
-- 14. PROFILE PHOTOS — public `avatars` bucket for customers & providers
--     (NID stays private; avatars are meant to be seen by other users)
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists avatar_select_public on storage.objects;
create policy avatar_select_public on storage.objects
  for select to public
  using (bucket_id = 'avatars');

drop policy if exists avatar_insert_own on storage.objects;
create policy avatar_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatar_update_own on storage.objects;
create policy avatar_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatar_delete_own on storage.objects;
create policy avatar_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- users.avatar_url already exists; no migration needed.
