-- =============================================================================
-- NEXSERVE — FULL RESET TO A CLEAN DATABASE
-- =============================================================================
-- ⚠️ DESTRUCTIVE AND IRREVERSIBLE.
-- This drops EVERY table in schema `public` (v1 AND v2) and ALL login accounts.
-- Old storage buckets are left untouched (delete them in Dashboard -> Storage).
--
-- After running this, paste and Run `supabase/nexserve_master_schema.sql`.
--
-- RECOMMENDED: create a brand-new Supabase project instead (even cleaner).
-- If you use this script, download a backup first anyway:
--   Dashboard -> Project Settings -> Database -> Backups -> Download
-- =============================================================================

-- 1. Drop every table in public (including the renamed orders_legacy_v1).
do $$
declare r record;
begin
  for r in (select tablename from pg_tables where schemaname = 'public') loop
    execute 'drop table if exists public.' || quote_ident(r.tablename) || ' cascade';
  end loop;
end $$;

-- 2. Remove v1-only helper function (v2 keeps is_admin / is_provider / my_role /
--    touch_updated_at, which the new schema recreates anyway).
drop function if exists public.express_interest(uuid) cascade;

-- 3. Storage buckets are intentionally LEFT ALONE.
--    Supabase forbids direct DELETE from storage.objects (protective trigger),
--    so old buckets must be removed via Dashboard -> Storage (select bucket -> Delete).
--    They are harmless: the app only uses `nid-documents`, which the master
--    schema creates with INSERT ... ON CONFLICT DO NOTHING.

-- 4. Remove every login account so you start completely fresh.
--    You WILL need to sign up again after re-applying the master schema, then
--    promote yourself to admin. (Comment this out if you want to keep Auth users.)
delete from auth.users;

-- DONE. Now paste and Run: supabase/nexserve_master_schema.sql
