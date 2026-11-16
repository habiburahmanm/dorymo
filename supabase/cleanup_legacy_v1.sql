-- =============================================================================
-- OPTIONAL — remove the retired v1 tables from your live Supabase database.
-- THE APP DOES NOT USE THEM. Keeping them is harmless except for clutter.
--
-- ⚠️ DESTRUCTIVE AND IRREVERSIBLE. Take a database backup first:
--    Supabase Dashboard -> Project Settings -> Database -> Backups -> Download
--
-- All statements are commented out ON PURPOSE. Uncomment only when you are sure.
-- =============================================================================

-- drop table if exists public.ticket_interests cascade;
-- drop table if exists public.tickets cascade;
-- drop table if exists public.disputes cascade;
-- drop table if exists public.bookings cascade;
-- drop table if exists public.dispatch_addresses cascade;
-- drop table if exists public.provider_kyc cascade;
-- drop table if exists public.service_listings cascade;
-- drop table if exists public.equipment_items cascade;
-- drop table if exists public.profiles cascade;
-- drop table if exists public.orders_legacy_v1 cascade;

-- v1-only helper functions (keep is_admin / is_provider / my_role / touch_updated_at —
-- the v2 schema still uses them)
-- drop function if exists public.express_interest(uuid) cascade;

-- v1-only storage buckets (contents are deleted too)
-- delete from storage.objects where bucket_id in ('equipment-photos','kyc-documents','dispute-evidence');
-- delete from storage.buckets where id in ('equipment-photos','kyc-documents','dispute-evidence');
