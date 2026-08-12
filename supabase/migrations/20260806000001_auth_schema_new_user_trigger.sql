-- Auth-schema change (isolated per project convention): the single
-- trigger HelloFamily adds to Supabase's managed `auth` schema.
--
-- ⚠️ ALREADY APPLIED ON THE REMOTE PROJECT — DO NOT RUN THIS AGAINST THE
-- DATABASE. Reconstructed 2026-08-12 via read-only introspection
-- (`supabase db query --linked --schema auth`-equivalent queries against
-- pg_trigger), since Docker (required for `supabase db pull`/`db diff`)
-- isn't installed on this machine. See CLAUDE.md for how this was
-- produced.
--
-- This is intentionally the ONLY auth-schema object captured here — no
-- other Supabase-managed `auth.*` definitions are included, per this
-- project's rule of never touching Supabase-managed internals beyond
-- this one deliberate trigger.
--
-- Depends on public.handle_new_user(), defined in
-- 20260806000000_baseline_schema.sql.

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
