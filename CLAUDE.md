# Expo App

## Rules Index

Detailed rules live in `.claude/rules/`. When adding, updating, or deleting a rules file, keep this index in sync.

- [env-vars.md](.claude/rules/env-vars.md) — Environment variable access patterns
- [naming.md](.claude/rules/naming.md) — File and directory naming conventions
- [stack.md](.claude/rules/stack.md) — Framework, language, and tooling overview
- [styling.md](.claude/rules/styling.md) — NativeWind and design token conventions
- [supabase.md](.claude/rules/supabase.md) — Database migrations and RLS patterns

## Project Reference Docs

- [docs/prd.md](docs/prd.md) — HelloFamily MVP PRD (4-day scope). This is the product spec; read it before adding or changing user-facing features.
- [docs/supabase-schema.md](docs/supabase-schema.md) — **Authoritative Supabase database schema** (tables, enums, RLS, triggers, roadmap), persisted from the project owner's own schema doc. Do not create/rename/modify tables, columns, enums, triggers, functions, or RLS policies without explaining the change and getting explicit approval first — this rule comes from that doc itself and has been followed throughout this project.
- [docs/database-schema.md](docs/database-schema.md) — human-readable schema doc generated *from the live database* (not from assumptions) on 2026-08-12, including a couple of concrete findings the pull surfaced (see "Known limitations" below).

## Product Summary

HelloFamily: an "adult child" invites an "older adult" loved one to send a daily 3-question wellbeing check-in. The adult child sees only a derived status (Completed / Concern / Missed / Pending) for their connected family members — **never** the raw answers. See [docs/prd.md](docs/prd.md) for full detail.

## Supabase

The hosted Supabase project is connected — CLI linked, real Supabase Auth wired into the app (see "Supabase Project Setup" below for connection details).

- **Tables** (7): `profiles`, `family_connections`, `invites`, `check_ins`, `daily_statuses`, `notification_preferences`, `push_tokens`.
- **Row Level Security is enabled on every table.**
- **Privacy split**: `check_ins` holds the older adult's private daily answers and only they can ever read it; adult children only ever read `daily_statuses`, a derived status enum that never contains the answers.
- **Source of truth**: [`supabase/migrations/`](supabase/migrations/) defines the schema — not the dashboard. Generated types live in [`src/types/database.types.ts`](src/types/database.types.ts). Full detail in [docs/database-schema.md](docs/database-schema.md) (schema) and [docs/supabase-project-settings.md](docs/supabase-project-settings.md) (dashboard-only settings).
- **Email confirmation is temporarily disabled** in the dashboard for development testing — must be re-enabled before shipping.
- **The mobile app must never contain the service-role key or the database password** — only `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

**Completed**: auth (signup/login/logout/session restore), role-based routing, the family-invite system (create/redeem via RPCs), real check-in writes, the adult-child dashboard reading real connected-family data, a full migration-history backfill matching the live schema, and generated TypeScript types wired into the client.

**Next**: re-verify the invite → redeem → check-in → dashboard loop end-to-end in the simulator (previously blocked by a grants bug that's since been fixed, but not yet re-tested since); then finish [docs/supabase-project-settings.md](docs/supabase-project-settings.md) with the remaining dashboard values (site URL, JWT expiry, enabled providers).

## Current Implementation Status (as of 2026-08-12)

### Built and working
- **Frontend prototype** — all PRD screens, navigation, and the cream/teal/coral design system (rebranded to match `hellofamilyapp.com`). Sample-data-driven pieces described below are intentionally still local-only.
- **Supabase Auth** — real email/password signup and login. Session persisted via AsyncStorage, restored on relaunch, auto-refresh wired to `AppState` foreground/background (see `lib/supabase.ts`).
- **Role-based routing** — `app/index.tsx` is the routing gate: shows a spinner while auth resolves, then redirects based on `profile.role` (`adult_child` → `/dashboard`, `older_adult` → `/check-in`, `null` → `/role-select`), or shows the Welcome/Login/Sign-up flow if signed out.
- **Sign-up is adult_child only** — `/sign-up` has no role picker; it always signs up as `adult_child`. `older_adult` accounts can *only* be created by opening an invite link (see below). `/role-select` still exists as a fallback recovery screen for the rare case of an authenticated user whose `profiles.role` is null.
- **Family invite system**:
  - Adult child taps "Invite Family Member" on the dashboard → `/invite-family` → enters a contact string (email or phone, stored for display only) → calls the `create_invite` RPC → gets back a plaintext token (shown once) → builds `hello-family://invite/<token>` → opens the native iOS share sheet (`Share.share()`) so the adult child sends it themselves.
  - Older adult opens that link → `app/invite/[token].tsx` → fills in name/email/password (role is hardcoded `older_adult`, not asked) → on signup success, calls the `redeem_invite` RPC, which validates the token and creates the `family_connections` row.
  - Only a SHA-256 hash of the token is ever stored in `invites.token_hash`; the plaintext token exists only transiently, returned once to the client that created it.
- **Real check-in writes** — `app/check-in.tsx` inserts into `public.check_ins` on submit (via `lib/family-api.ts#submitCheckIn`), which fires the DB trigger that creates the matching `daily_statuses` row. `hasCheckedInToday()` guards against re-showing the form / duplicate submission same day.
- **Adult child dashboard** (`app/dashboard.tsx`) — reads *real* connected family members: `family_connections` → `profiles` (names) → `daily_statuses` (today's status + most recent completed/concern date). See `lib/family-api.ts#fetchFamilyMembers`.
- **Real logout** — `supabase.auth.signOut()`, available on both the dashboard and check-in screens.

### Known limitations / explicitly deferred

These are deliberate scope decisions made during this build, not oversights — but they need attention before shipping:

- **Email confirmation is currently DISABLED in the Supabase dashboard** (Authentication → Sign In / Providers → Email → "Confirm email" toggled off), at the project owner's explicit request, so sign-up works with placeholder/fake email addresses during testing without sending real mail. **Must be turned back on before shipping.** The app code already handles both outcomes correctly — if `signUp()` returns a session immediately, it routes in; if not, it shows `/confirm-email` — so re-enabling the dashboard setting needs no code change.
- **Client-side email validation is deliberately loose right now**: `EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/` in `app/sign-up.tsx` and `app/invite/[token].tsx` (just requires an `@`, no TLD check), marked with a `// Loosened for pre-launch testing` comment. `app/login.tsx` still has the stricter original pattern (`...@...\....`). Tighten sign-up/invite to match before shipping.
- **Invite delivery is share-sheet only** — no automated email/SMS sending. Supabase's own admin "invite user" API needs the service-role key, which must never ship in the app, so real automated sending would require a server-side Edge Function + a provider (Resend for email, Twilio for SMS) and API keys the project owner would need to supply. This was an explicit, agreed scope cut, not a bug.
- **Deep link is a custom URL scheme** (`hello-family://invite/<token>`), which only works if the app is already installed on the device that opens the link — fine for TestFlight/dev testing, not for a stranger without the app. A real universal link (`https://hellofamilyapp.com/invite/...` + Associated Domains + hosted `apple-app-site-association`) would be needed before public launch.
- **The older adult's own check-in history/confirmation screens still read local sample data**, not the real database: `app/check-in-history.tsx` and the "today" message on `app/check-in-complete.tsx` are driven by `lib/app-state.tsx` (`AppStateProvider`/`useAppState()`), a local-only, in-memory context with seeded sample history. This is unrelated to `lib/auth-context.tsx` — **don't confuse the two.** Only the adult child's dashboard reads real Supabase data. Wiring the older adult's own history to real `check_ins` reads is roadmap step 5 in [docs/supabase-schema.md](docs/supabase-schema.md) and was explicitly not done yet.
- **Nothing from roadmap steps 8–11 is implemented**: local daily reminder notifications, Expo push token registration, remote push notifications (completed/concern/missed alerts), or scheduled missed-check-in processing. No `daily_statuses` row with `status = 'missed'` is ever created by the client — correct, since that's meant to come from a future trusted scheduled backend process, not the app.
- **Invite management is minimal** — no revoke-invite UI, no resend/regenerate for an expired invite, no expiry countdown shown to the user.
- **The invite/check-in/dashboard loop has NOT yet been re-tested end-to-end after the fix below was applied.** It was implemented in an earlier session but interrupted by simulator/host instability before a full pass completed, then blocked by the grant bug (now fixed). **Re-run the full loop in "How to Test" before assuming this works.**
- ~~Concrete bug: `invites` had a `SELECT` RLS policy but no matching table grant~~ — **fixed 2026-08-12** via `supabase/migrations/20260812203852_grant_invites_select.sql` (`grant select on public.invites to authenticated;`), applied and verified against the remote project (`information_schema.role_table_grants` confirms `authenticated` now has `SELECT` on `invites`). One remaining minor finding (a harmless duplicate index) is still noted in [docs/database-schema.md](docs/database-schema.md).
- **Local Supabase migration history is fully backfilled and in sync with remote.** `supabase/migrations/` contains, in order: `20260806000000_baseline_schema.sql` (the full pre-existing schema — all 7 tables, 6 enums, RLS, policies, grants, the `private` schema helpers, and the `public`-schema functions), `20260806000001_auth_schema_new_user_trigger.sql` (the one trigger on the managed `auth.users` table, kept isolated per this project's own rule about auth-schema changes), `20260812050147_create_invite_functions.sql` (pre-existing), and `20260812203852_grant_invites_select.sql` (the fix above). The first two were reconstructed via direct SQL introspection (`supabase db query --linked`) rather than `supabase db pull`, because Docker isn't installed on this machine and both `db pull` and `db dump` require it in CLI 2.111.0 for their shadow-database/bundled-pg_dump steps — then marked applied in the remote ledger via `supabase migration repair --status applied 20260806000000 20260806000001` (bookkeeping only, no schema change) so `db push` would treat only the real grant fix as pending. `npx supabase migration list` now shows all four with matching local/remote timestamps.
- **TypeScript types are now generated from the live schema**: `src/types/database.types.ts` (via `npx supabase gen types typescript --project-id curtqahakfbfucrnsler --schema public`), and `lib/supabase.ts`'s client is now `createClient<Database>(...)`. Regenerate after any real schema change with the same command. Note the `src/` location doesn't match this repo's usual flat `lib/`/`app/`/`components/` layout — it was placed there because the task that generated it specified that exact path; move it under `lib/` instead if you'd rather match convention (update the one import in `lib/supabase.ts` accordingly).
- **No GitHub remote is configured** — `git remote -v` is empty and `main` has no upstream. All work exists only as local commits on this machine.

## Supabase Project Setup

- **Env vars** (`.env.local`, gitignored — only `.env*.local` is ignored, a bare `.env` would not be): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Note the name is `PUBLISHABLE_KEY`, not the older `ANON_KEY` — this project uses Supabase's current API key naming (a drop-in replacement for the legacy anon key; same `createClient(url, key)` call). See `env.ts` (Zod-validated) and `lib/supabase.ts`.
- **Supabase client** — `lib/supabase.ts` is the single client file. Imports `react-native-url-polyfill/auto` first (required for supabase-js on React Native), configures `AsyncStorage` for persisted sessions (`autoRefreshToken`/`persistSession: true`, `detectSessionInUrl: false`), and wires an `AppState` listener so token auto-refresh (`startAutoRefresh`/`stopAutoRefresh`) only runs while the app is foregrounded — this is Supabase's current recommended Expo/RN pattern.
- **Auth state** — `lib/auth-context.tsx`: `AuthProvider` / `useAuth()`. Exposes `{ session, profile, loading, refreshProfile, signOut }`. `profile` (shape: `{ id, full_name, role, timezone }`) is fetched from `public.profiles` whenever the session changes.
- **Data access layer** — `lib/family-api.ts`: typed wrapper functions for every invite/family/check-in Supabase call (`createInvite`, `redeemInvite`, `fetchFamilyMembers`, `fetchPendingInvites`, `hasCheckedInToday`, `submitCheckIn`). Add new Supabase queries here rather than scattering raw `supabase.from(...)` calls across screens.
- **Friendly errors** — `lib/auth-errors.ts`: `getAuthErrorMessage()` maps common Supabase auth/query errors to short user-facing text, falling back to the raw error message.
- **CLI access** — the Supabase CLI is linked to the remote project on this machine (`supabase login` + `supabase link` have been run; project ref `curtqahakfbfucrnsler`), so `npx supabase db push`, `npx supabase migration list`, and `npx supabase db query "..."` all work directly against the remote project without extra setup.
- **pgcrypto** — installed in the `extensions` schema on the remote project (confirmed via `supabase db query`). The invite RPCs call `extensions.gen_random_bytes` / `extensions.digest`; if pgcrypto is ever reinstalled elsewhere, those calls will break.
- **⚠️ Docker is NOT installed on this machine.** `supabase db pull`, `supabase db dump`, and `supabase db diff` all require Docker in CLI 2.111.0 (for a shadow database or a bundled `pg_dump`) and will fail with `LegacyDeclarativeShadowDbError` / `LegacyDockerRunError`. `supabase db query --linked` does **not** need Docker (it talks to the remote Postgres directly via the Management API) — when you need to inspect the live schema and can't install Docker, query `information_schema`/`pg_catalog`/`pg_policies` directly instead. This is exactly how `supabase/migrations/20260806000000_baseline_schema.sql` and `20260806000001_auth_schema_new_user_trigger.sql` were reconstructed; see their header comments for the reasoning.

## Auth & Routing Architecture

- `app/_layout.tsx` wraps everything in `AuthProvider` (real Supabase auth) then `AppStateProvider` (local sample-data check-in state — see below). Order doesn't matter functionally; they're independent.
- `app/index.tsx` (Welcome) is the routing gate — see "Role-based routing" above.
- `app/role-select.tsx` is a fallback recovery screen only, for `profile.role === null`. It updates the real `profiles.role` via a direct client `UPDATE` (allowed by RLS: users can update only their own profile) — no RPC needed for this part.
- `app/dashboard.tsx` and `app/check-in.tsx` each self-guard (`if (!session) return <Redirect href="/" />`, with a loading spinner while `loading`), so a signed-out or session-expired user bounces back to Welcome from either screen.
- `lib/app-state.tsx` (`AppStateProvider`/`useAppState()`) is a **separate, local-only** system — in-memory sample/seeded state for the older adult's own trend view (`app/check-in-history.tsx`) and today's confirmation copy (`app/check-in-complete.tsx`). It does not persist across restarts and is not backed by Supabase. **Do not confuse this with `lib/auth-context.tsx`** — similar-sounding names, unrelated purposes.

## Database Functions (SECURITY DEFINER RPCs)

Defined in `supabase/migrations/20260812050147_create_invite_functions.sql`:

- **`public.create_invite(p_contact text default null)`** — callable by `authenticated`. Verifies the caller's `profiles.role = 'adult_child'`, generates a random token, stores only its SHA-256 hash (+ optional `contact` string) in `invites`, and returns the plaintext token exactly once.
- **`public.redeem_invite(p_token text)`** — callable by `authenticated`. Verifies the caller's `profiles.role = 'older_adult'`, validates the token (must be `pending` and not expired, row-locked with `for update`), inserts the `family_connections` row, and marks the invite `accepted`.
- Both use `set search_path = ''` with fully-qualified names (hardening against search_path hijacking), and are `revoke`d from `PUBLIC` / granted only to `authenticated` — per Supabase's current SECURITY DEFINER hardening guidance.
- The same migration adds an `invites_select_own` RLS policy (`created_by = auth.uid()`) so an adult_child can read their own invites for the pending-invites list on `/invite-family`, and adds the nullable `invites.contact` column.

## How to Test the Current Build

1. Start Metro: `pnpm start` (or `npx expo start --dev-client`), then launch the installed dev-client build on a simulator. If it doesn't auto-connect, open `hello-family://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081` on the simulator.
2. **Adult child sign-up → invite**: "Create Account" with any name/email/password (email confirmation is currently off, so this logs you in immediately) → lands on `/dashboard` → tap "Invite Family Member" → enter any contact string → "Invite & Share" opens the iOS share sheet containing a `hello-family://invite/<token>` link. Copy the token/link instead of actually sending it anywhere.
3. **Redeem as older adult**: trigger that link on the same simulator/device — `xcrun simctl openurl booted "hello-family://invite/<token>"`, or paste it into Safari — which opens the older-adult account form. Submitting should create the account, redeem the invite, and land on `/check-in`.
4. **Real check-in**: answer all three questions and submit → should insert into `check_ins`, which triggers a `daily_statuses` row, then routes to `/check-in-complete`.
5. **Verify the loop closes**: log out, log back in as the adult child → `/dashboard` should show the older adult by name with status "Completed" or "Concern" — not stuck on "Pending".
6. **This has not yet been confirmed working end-to-end after the latest changes** (see Known Limitations) — treat step 5 as unverified until you've personally seen it pass.
