# HelloFamily

## Handoff

For what's done, what's in progress, and exact next steps, read
[PROJECT_STATUS.md](PROJECT_STATUS.md) **first**, every session. This file
(`CLAUDE.md`) holds only long-term, stable project knowledge — product
scope, architecture, schema, conventions, rules. It should rarely change.
`PROJECT_STATUS.md` is the living document that changes every session.

## Rules Index

Detailed rules live in `.claude/rules/`. When adding, updating, or deleting a rules file, keep this index in sync.

- [env-vars.md](.claude/rules/env-vars.md) — Environment variable access patterns
- [naming.md](.claude/rules/naming.md) — File and directory naming conventions
- [stack.md](.claude/rules/stack.md) — Framework, language, and tooling overview
- [styling.md](.claude/rules/styling.md) — NativeWind and design token conventions
- [supabase.md](.claude/rules/supabase.md) — Database migrations and RLS patterns

## Project Reference Docs

- [docs/prd.md](docs/prd.md) — HelloFamily MVP PRD (4-day scope). The product spec; read it before adding or changing user-facing features.
- [docs/supabase-schema.md](docs/supabase-schema.md) — the project owner's original schema doc. **Do not create/rename/modify tables, columns, enums, triggers, functions, or RLS policies without explaining the change and getting explicit approval first** — this rule comes from that doc itself and has been followed throughout this project.
- [docs/database-schema.md](docs/database-schema.md) — a human-readable schema doc generated *from the live database* on 2026-08-12. **It is now stale** (predates the `profiles.phone_number` column and the `notification_preferences` table going live) — treat the "Database" section below as the current source of truth, and regenerate this doc if you need the full RLS-policy-by-policy detail again.
- [docs/supabase-project-settings.md](docs/supabase-project-settings.md) — dashboard-only settings (not in migrations): site URL, JWT expiry, enabled auth providers.

## Product Summary

**One job**: help families know an older loved one is okay every day, through a daily check-in.

- **Older adult**: creates an account only via an invite link, answers 3 fixed-choice daily reflection questions, gets one daily reminder notification.
- **Adult child**: creates an account directly (email/password), invites an older adult by link, sees only a **derived status** per day (Everything's okay / May need support / Missed check-in / Check-in pending) for each connected older adult — **never** the raw answers. Intended to eventually receive push notifications for completed/concern/missed check-ins (not yet built — see PROJECT_STATUS.md).
- Platform: iOS app (primary product) + a simple marketing website (`hellofamilyapp.com`, not part of this repo) linking to the app.

### Confirmed MVP scope

Must-haves (from [docs/prd.md](docs/prd.md)):
- Email/password account creation.
- Invite link connecting one adult child to one older adult.
- Daily reminder notification for the older adult.
- Three fixed-choice daily reflection questions (no free text).
- Daily check-in completion + derived status shown to the adult child.
- Adult-child notifications: check-in completed, concern detected, check-in missed.

### Out of scope for v1 — do not build unless explicitly asked

- Adult child ever viewing the older adult's raw reflection answers.
- Any messaging/communication feature beyond the daily check-in + notifications.
- Advanced analytics/trend tracking beyond the simple history list.
- Visual/behavioral customization, themes, multi-account, multi-language.
- Anything not in service of "one daily check-in, one derived status."

## Technology Stack

- **Framework**: Expo (React Native), Expo Router (file-based routing, typed routes enabled), New Architecture enabled (`newArchEnabled: true` in `app.config.js`).
- **Language**: TypeScript throughout.
- **Styling**: NativeWind (Tailwind for React Native). **Never `StyleSheet.create()` or inline `style={{}}` objects** — the one documented exception is React Navigation's `screenOptions` (e.g. `tabBarStyle`), which doesn't accept `className`.
- **Backend**: Supabase (Postgres + Auth + RLS). `@supabase/supabase-js` client in `lib/supabase.ts`.
- **Package manager**: pnpm (enforced via `preinstall: npx only-allow pnpm`).
- **Linter/formatter**: Biome (`pnpm lint`, `pnpm format`).
- **Fonts**: `DM Serif Display` (headline serif) + `Inter` (everything else), loaded via `@expo-google-fonts/dm-serif-display` + `@expo-google-fonts/inter` in `app/_layout.tsx`, gated behind `expo-splash-screen` so nothing flashes unstyled. Registered as Tailwind `fontFamily` tokens in `tailwind.config.ts` — use `font-display`, `font-body`, `font-body-medium`, `font-body-semibold`, `font-body-bold` classes, not raw arbitrary font-family strings.
- **Icons**: `@expo/vector-icons` Feather, wrapped in `components/icon.tsx` with a NativeWind `cssInterop` so `className="text-..."` controls icon color/size like any other element.
- **Notifications**: `expo-notifications`. See "Known gotchas" below — this one has a real landmine.
- **Safe area**: `react-native-safe-area-context`'s `SafeAreaView`, used on every screen.

## Architecture

- **Auth**: `lib/auth-context.tsx` (`AuthProvider`/`useAuth()`) wraps the whole app in `app/_layout.tsx`. Exposes `{ session, profile, loading, refreshProfile, signOut }`. `profile` is fetched from `public.profiles` whenever the session changes. Session persisted via AsyncStorage, auto-refresh wired to `AppState` foreground/background (`lib/supabase.ts`).
- **Data access layer**: `lib/family-api.ts` — every invite/family/check-in/notification-preference Supabase call lives here as a typed function (`createInvite`, `redeemInvite`, `fetchFamilyMembers`, `fetchPendingInvites`, `hasCheckedInToday`, `submitCheckIn`, `fetchOwnCheckInHistory`, `fetchTodayCheckInStatus`, `fetchNotificationPreferences`, `deleteInvite(s)`, `fetchFamilyMemberDetail`). **Add new Supabase queries here, not scattered inline in screens.**
- **Routing gate**: `app/index.tsx` (Welcome) — while signed out, shows the Welcome screen; once `session`+`profile` resolve, redirects by role: `adult_child` → `/family`, `older_adult` → `/check-in`, `null` role → `/role-select` (fallback recovery screen, updates `profiles.role` directly).
- **Two tab groups**, each self-guarding on role (`if (!session || profile?.role !== "...") return <Redirect href="/" />`):
  - `app/(tabs)/` for `adult_child`: `family.tsx` (Family tab — connected members + status) and `settings.tsx` (Settings tab — Log Out lives here).
  - `app/(checkin-tabs)/` for `older_adult`: `check-in.tsx` (Check-In tab) and `check-in-history.tsx` (History tab). **No Settings tab for older_adult** — Log Out is inline on `check-in.tsx`, `check-in-complete.tsx`, and `check-in-history.tsx` instead.
  - Group-folder parens never appear in the actual route path (`/family`, `/check-in`, etc.).
- `app/check-in-complete.tsx` is a **standalone route**, not part of either tab group — reached via `router.replace` right after a successful check-in submission.
- **Sign-up is adult_child-only** — `/sign-up` has no role picker. `older_adult` accounts can *only* be created by opening an invite link (`app/invite/[token].tsx`).
- **Family invite flow**: adult child → Family tab → `/invite-family` → "Send Invite via Mail"/"Send Invite via Message" → creates the invite server-side (`create_invite` RPC), builds `hello-family://invite/<token>`, opens Mail/Messages directly (`mailto:`/`sms:` — no generic share sheet) with the link pre-filled so the adult child addresses and sends it themselves. Older adult opens that link → fills in name/email/(phone)/password → `redeem_invite` RPC validates the token and creates the `family_connections` row.
- **Reusable UI primitives**: `components/ui/` (shadcn-style: `Button`, `Card`, `Text`, `Input`, `Label`, etc., all cva-variant-based). `components/segmented-choice.tsx` is the 3-option answer control used on the check-in form (single bordered container, not three separate boxes — deliberate, matches the reference design). When an exact pixel/behavior spec conflicts with what a shared component's variants can express (and changing the shared component would affect unrelated screens), build a bespoke `Pressable` for that one screen instead of bending the shared component — this has been done for the Welcome screen's Log In/Create Account buttons and the invite screen's Mail/Message buttons.

## Database

Supabase Postgres, RLS enabled on every table. Source of truth is `supabase/migrations/` — **never** the dashboard. Generated TypeScript types live in `src/types/database.types.ts` (regenerate after any real schema change: `npx supabase gen types typescript --project-id curtqahakfbfucrnsler --schema public`).

**The core privacy guarantee**: raw daily answers live only in `check_ins`, readable only by the older adult who wrote them (no policy/grant exists for anyone else). A trigger derives a same-day `daily_statuses` row containing only a status enum — never the answers — and *that* is what a connected adult_child is allowed to read. There is no code path, client or server, through which an adult_child can reach the underlying answers. **This split must never be weakened.**

### Tables (7)

| Table | Purpose | Who can read |
|---|---|---|
| `profiles` | One row per user. `full_name`, `role` (nullable until set), `timezone`, `phone_number` (nullable — added for the Call/Message buttons on the adult child's Family tab). | Own profile, or a profile you're connected to. |
| `family_connections` | Links one `adult_child` to one `older_adult`. `status` defaults `active`. Rows created only by `redeem_invite()`. | Either person in the connection. |
| `invites` | An adult_child's invitation. Stores only `token_hash` (SHA-256, never the plaintext), `status`, `expires_at`, optional `contact`. Rows created/consumed only by `create_invite()`/`redeem_invite()`. | Adult child, their own invites only (by `created_by`). |
| `check_ins` | The older adult's **private** daily answers (`feeling`, `physically_okay`, `normal_activities`) + a **generated** `concern_detected` column: `feeling = 'not_good' OR physically_okay = 'no' OR normal_activities = 'no'`. One row per older adult per day. Immutable — insert only, no update/delete from the client. | Only the older adult, their own rows. Adult children have **no access at all**. |
| `daily_statuses` | The **shareable** derived status (`completed`/`concern`/`missed`) + `completed_at`. One row per older adult per day, created only by the `on_check_in_created` trigger. "Pending" is a UI-only concept — no row for today = pending; there is no `pending` value in the enum. | The older adult (own rows), or a connected adult_child. |
| `notification_preferences` | One row per user (created at signup). `daily_reminder_enabled`, `daily_reminder_time`, a cutoff time, and alert toggles. Now used by `lib/notifications.ts` for the older adult's local reminder. | Own row only. |
| `push_tokens` | Zero or more Expo push tokens per user. **Not yet used** — needed for the remote push feature (adult-child alerts). | Own rows only. |

### Enums

`user_role` (`adult_child`, `older_adult`) · `connection_status` (`active`, `revoked`) · `invite_status` (`pending`, `accepted`, `expired`, `revoked`) · `feeling_answer` (`good`, `okay`, `not_good`) · `wellness_answer` (`yes`, `mostly`, `no`) · `checkin_status` (`completed`, `concern`, `missed` — no `pending`).

### Triggers

- `on_auth_user_created` (on `auth.users`) → creates matching `profiles` + `notification_preferences` rows from signup metadata.
- `on_check_in_created` (on `check_ins`) → creates the matching `daily_statuses` row (`concern` if `concern_detected`, else `completed`).
- `*_set_updated_at` on `profiles`/`notification_preferences`/`push_tokens`.

Two `SECURITY DEFINER` helper functions in a `private` schema (`private.are_connected`, `private.is_connected_adult_child`) let RLS policies check connection status without granting direct access to `family_connections`.

### RPCs (`supabase/migrations/20260812050147_create_invite_functions.sql`)

- `public.create_invite(p_contact text default null)` — verifies caller is `adult_child`, generates a token, stores only its hash, returns the plaintext token **exactly once**.
- `public.redeem_invite(p_token text)` — verifies caller is `older_adult`, validates the token (`pending`, not expired, row-locked), inserts `family_connections`, marks the invite `accepted`.
- Both `set search_path = ''` with fully-qualified names, `revoke`d from `PUBLIC`, granted only to `authenticated`.

### Environment / secrets

- **The mobile app must never contain the service-role key or the database password** — only `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`.env.local`, Zod-validated via `env.ts`). Note the current key name is `PUBLISHABLE_KEY`, not the legacy `ANON_KEY`.
- **⚠️ Docker is NOT installed on this machine.** `supabase db pull`/`db dump`/`db diff` require Docker and will fail. `supabase db query --linked` does **not** need Docker (talks to the remote Postgres directly) — use it to inspect `information_schema`/`pg_catalog`/`pg_policies` instead.
- Supabase CLI is linked to the remote project (ref `curtqahakfbfucrnsler`) on this machine — `db push`, `migration list`, `db query` all work directly.

## Design System

- **Colors** — the app's shadcn-style theme tokens live in `global.css` as CSS custom properties (`--background`, `--primary`, `--card`, `--border`, `--muted-foreground`, etc.), consumed via `tailwind.config.ts`'s `theme.extend.colors`. Prefer these tokens (`bg-background`, `text-foreground`, `border-border`, ...) over hardcoded hex for anything reusable across screens.
- The Welcome screen specifically uses an exact reference palette that does **not** map 1:1 onto the tokens above (close but not identical) — it's applied there via NativeWind arbitrary-value classes (`bg-[#FBF8F3]`, `text-[#173F43]`, etc.) scoped to that one screen, deliberately, rather than changing the global tokens and risking unrelated screens. Don't "clean this up" into the shared tokens without checking every other screen first.
- **Status colors/terminology** (used consistently across the Family tab, family-member detail, and the older adult's own history): 🟢 emerald = "Everything's okay" (`completed`), 🟠 amber = "May need support" (`concern`) — deliberately amber/orange, not red, so a concern reads as "may need a check-in," not "emergency." ⚫ muted = "Missed check-in" (`missed`). ⚪ muted = "Check-in pending" (no row yet).
- **Terminology**: use `adult_child` / `older_adult` internally (matches the DB enum and code); user-facing copy says "Family" (adult child's tab) and "Daily Check-In" / "Check-In" (older adult's tab). Never expose the raw enum values in UI copy.

## Coding Conventions

Full detail in `.claude/rules/*.md` (linked above). Additional conventions established during this project:

- New Supabase queries go in `lib/family-api.ts`, typed, not inlined in screens.
- Use kebab-case file/directory names (existing Expo Router conventions like `_layout.tsx` and `[id].tsx` are the only exceptions).
- Prefer the shared `components/ui/*` primitives; build a bespoke `Pressable`/`View` for one screen only when an exact design spec genuinely can't be expressed through the shared component's variants without risking other screens.
- Exact hex/pixel specs from a supplied design reference are implemented with NativeWind arbitrary-value classes (`bg-[#RRGGBB]`, `text-[18px]`, `top-[12px]`, etc.) — never inline `style` objects, never `StyleSheet.create()`.
- Custom fonts are Tailwind `fontFamily` theme tokens (see Technology Stack above), not ad-hoc arbitrary `font-[...]` strings scattered through screens.

## Important Commands

```bash
pnpm start                 # Metro dev server (expo start --dev-client)
pnpm ios                   # build + run on simulator (needs ios/ — run prebuild first if missing)
pnpm prebuild              # regenerate ios/ and android/ (both gitignored, regenerated from app.config.js)
pnpm typecheck             # tsc --noEmit
pnpm lint                  # biome check .
pnpm format                # biome format --write .
npx supabase db push       # apply pending migrations to the linked remote project
npx supabase migration list
npx supabase db query --linked "<sql>"   # direct SQL against remote Postgres (no Docker needed)
```

To reload the running dev-client app after a JS-only change: just save the file (Fast Refresh). After a **native** change (new native module, config plugin, entitlements), you must do a real rebuild — a Metro reload alone will not pick it up:

```bash
npx expo run:ios --device "<simulator-udid>"
```

## Decisions Future Sessions Must Follow

- **Never create/rename/modify tables, columns, enums, triggers, functions, or RLS policies without explaining the change and getting explicit approval first.** This rule originates from the project owner's own schema doc and has been followed throughout.
- **Never let the service-role key or DB password enter the mobile app.**
- **Never weaken the `check_ins`/`daily_statuses` privacy split** — an adult_child must never be able to read raw check-in answers, through any code path.
- **`ios/` and `android/` are gitignored and fully regenerated by `expo prebuild`/`expo run:ios` from `app.config.js`.** Don't hand-edit native project files expecting them to persist — put the change in `app.config.js` (a plugin, an entitlement) instead.
- **`lib/notifications.ts` deliberately deep-imports specific `expo-notifications/build/<file>` submodules instead of importing the package root.** Importing the root (`import * as Notifications from "expo-notifications"`) eagerly resolves `PushTokenManager` (remote-push registration), and that specific native module fails to resolve at runtime in this project's dev-client build (`Cannot find native module 'ExpoPushTokenManager'`) even though it compiles, links, and registers correctly natively — a real, reproducible, still-unexplained interaction with this Expo SDK 57 / New Architecture / expo-dev-client combination. **Do not "clean up" those imports back to a single root import** — see PROJECT_STATUS.md for full detail and the exact repro/fix.
- **Docker is not installed on this machine** — never suggest `supabase db pull`/`db dump`/`db diff`; use `supabase db query --linked` for schema introspection instead.
- **GitHub remote**: `origin` is `git@github.com:Aarav7894/HelloFamily.git` (SSH, private repo), `main` tracks `origin/main`. Still confirm with the user before pushing or opening a PR — an existing remote doesn't imply standing authorization for every push.
