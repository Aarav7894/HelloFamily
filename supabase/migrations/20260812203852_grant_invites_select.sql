-- Fixes a gap found during the 2026-08-12 schema pull: the
-- `invites_select_own` RLS policy (added by
-- 20260812050147_create_invite_functions.sql) had no matching table-level
-- grant. Postgres checks table privileges before RLS, so an authenticated
-- client's `select` on `invites` was failing regardless of the policy —
-- this is why the adult child's pending-invites list never worked.
--
-- See docs/database-schema.md for the full finding.

grant select on public.invites to authenticated;
