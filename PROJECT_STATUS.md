# HelloFamily — Project Status

> Living document. Update this every session. Long-term/stable project
> knowledge (product scope, architecture, schema, conventions) lives in
> [CLAUDE.md](CLAUDE.md) instead — don't duplicate it here.

**Last updated**: 2026-08-20, after verifying the Expo notifications native
module fix on the iOS Simulator.

## Completed so far

- **Auth**: real Supabase email/password signup, login, logout, session restore (AsyncStorage-persisted, auto-refresh on foreground).
- **Role-based routing**: `app/index.tsx` gate → `/family` (adult_child) or `/check-in` (older_adult) tab groups, or `/role-select` fallback.
- **Family invite system**: create (`create_invite` RPC) → Mail/Messages hand-off with the link pre-filled → redeem (`redeem_invite` RPC) → `family_connections` row. Only a token hash is ever stored.
- **Real check-in writes**: older adult's 3-question form → `check_ins` insert → trigger creates `daily_statuses` row.
- **Adult child Family tab**: reads real connected members + today's status + last completed/concern date; per-member Call/Message buttons (`tel:`/`sms:` using `profiles.phone_number`).
- **Older adult's own check-in history and "today" confirmation copy**: now read real data (`fetchOwnCheckInHistory`, `fetchTodayCheckInStatus`) — this used to be local fake sample data (`lib/app-state.tsx`, now deleted).
- **Both tab groups rebuilt as native-feeling iOS tab experiences**: `app/(tabs)` (Family / Settings) and `app/(checkin-tabs)` (Check-In / History), each self-guarding on role.
- **Welcome screen rebuilt** to match a supplied reference: DM Serif Display headline, Inter body copy, a real family-connection illustration (`assets/images/family-connection.png`, chroma-keyed to blend into the background), bespoke Log In / Create Account buttons.
- **Daily Check-In form rebuilt**: numbered steps, a single-container segmented answer control (`components/segmented-choice.tsx`) instead of three separate boxes, fits one screen with no scrolling.
- **Invite delivery reworked**: no generic share sheet — "Send Invite via Mail"/"Send Invite via Message" open Mail/Messages directly with the link pre-filled; a failed send now deletes the just-created invite instead of leaving an orphaned row; pending invites can be deleted individually or all at once.
- **`profiles.phone_number`** column added (migration `20260813135758_add_profiles_phone_number.sql`), collected at invite redemption, used for the Family tab's Call/Message buttons.
- **The older adult's daily check-in reminder notification** (this session) — see "Just completed" below for full detail.
- **Migration history fully backfilled and in sync with remote** (6 migrations, `npx supabase migration list` confirms local == remote for all).
- **Generated TypeScript types** wired into the Supabase client (`src/types/database.types.ts`, `createClient<Database>(...)`).

## Just completed this session: local daily reminder notification

- `lib/notifications.ts` (new) — `syncDailyCheckInReminder(enabled, time)`: cancels any existing scheduled reminder, and if enabled, requests notification permission and schedules a repeating daily local notification at the given time via `expo-notifications`.
- `app/(checkin-tabs)/_layout.tsx` — calls `fetchNotificationPreferences()` then `syncDailyCheckInReminder(...)` in a `useEffect`, for `older_adult` sessions only.
- `lib/family-api.ts` — added `fetchNotificationPreferences()` (reads `notification_preferences.daily_reminder_enabled`/`daily_reminder_time` for the current user).
- `app.config.js` — added `"expo-notifications"` to the `plugins` array (adds the `aps-environment` entitlement automatically via `expo prebuild`).
- `package.json`/`pnpm-lock.yaml` — added `expo-notifications` dependency.
- **Required and completed a real native rebuild** (`expo prebuild` implicitly, then `npx expo run:ios --device "68DFA0F6-FFFD-4074-A95A-CE7CB46F645B"`) — a JS-only reload is not enough for a new native module.
- **Verified working** via a native device log stream (not just "no crash"): `xcrun simctl spawn <udid> log stream ... 'subsystem contains "UserNotifications"'` showed `Adding notification request ...` → `Added notification request: [ hasError: 0 ]`.

### Resolved: `ExpoPushTokenManager` native-module error

Importing the `expo-notifications` package root (`import * as Notifications from "expo-notifications"`) crashes at import time with:

```
Error: Cannot find native module 'ExpoPushTokenManager'
```

The error occurred with the older Expo SDK 57.0.11 native dependency set. The
SDK patch upgrade in PR #1 moved `expo-notifications` to 57.0.13. After
regenerating the native dependency graph, the standard package-root import
loaded successfully in an iOS 26 Simulator dev build. `lib/notifications.ts`
now uses the public `expo-notifications` API instead of unsupported deep
imports into the package's build output.

The generated `ios/` and `android/` folders are ignored. Run `pnpm prebuild`
after checking out the dependency upgrade so the native projects match the
JavaScript packages before running the app.

**A Metro cache gotcha found along the way**: after editing `lib/notifications.ts`, the exact same stale error (referencing the *old*, already-deleted import line) kept reappearing on fresh app launches. This was a stale Metro transform cache, not a real repro — killing the Metro process (port 8081) and restarting with `pnpm start --clear` fixed it. **If you're debugging something in this file and the error message doesn't match the current file content, clear the Metro cache before concluding anything.**

## Unresolved bugs / issues

1. **`docs/database-schema.md` is stale** — generated 2026-08-12, predates `profiles.phone_number` and the `notification_preferences` table going live. CLAUDE.md's "Database" section is current; this doc file itself has not been regenerated.
2. **No automated tests exist** in this repo (no test runner configured) — all verification this session was manual (TypeScript, Biome, and hands-on Simulator testing).

## Unfinished work

In priority order (also see CLAUDE.md's "Confirmed MVP scope" — this list is what's left of it):

1. **Remote push notifications for the adult child** (completed / concern / missed check-in alerts) — the biggest remaining MVP gap. Needs, roughly:
   - Expo push token registration on the client, stored into `push_tokens` (currently unused).
   - A Supabase Database Webhook on `daily_statuses` insert → a Supabase Edge Function that sends the push via Expo's push API.
   - A separate scheduled process (Supabase Cron / Edge Function on a schedule) to create `missed` `daily_statuses` rows after a cutoff time — no client code path should ever create a `missed` row itself.
   - **Cannot be verified in the iOS Simulator at all** — no real APNs delivery. Requires a real device and a paid Apple Developer push profile.
2. **Re-enable email confirmation** in the Supabase dashboard before shipping (see "Temporary testing settings" below).
3. **Tighten client-side email validation** back to a real pattern in `app/sign-up.tsx` and `app/invite/[token].tsx` (currently loosened for testing with placeholder addresses).
4. **Invite management**: no revoke-invite UI beyond delete, no resend/regenerate for an expired invite, no expiry countdown shown to the user.
5. **Universal links**: current deep link is a custom scheme (`hello-family://invite/<token>`), which only works if the app is already installed. A public launch needs `https://hellofamilyapp.com/invite/...` + Associated Domains + a hosted `apple-app-site-association`.
6. **Finish `docs/supabase-project-settings.md`** with the remaining dashboard-only values (site URL, JWT expiry, enabled auth providers).
7. Regenerate `docs/database-schema.md` from the live schema (see Unresolved Issues #2) — low priority, informational only.

## Files recently changed (this session)

- `lib/notifications.ts` — **new**. Local daily reminder scheduling.
- `app/(checkin-tabs)/_layout.tsx` — calls the new sync function for older_adult sessions.
- `lib/family-api.ts` — added `fetchNotificationPreferences`.
- `app.config.js` — added the `expo-notifications` config plugin.
- `package.json`, `pnpm-lock.yaml` — added `expo-notifications` dependency.
- `CLAUDE.md` — split into stable long-term doc + this file; corrected several stale route references (`/dashboard` → `/family`, `app/check-in.tsx` → `app/(checkin-tabs)/check-in.tsx`, removed references to the deleted `lib/app-state.tsx`).
- `PROJECT_STATUS.md` — **new** (this file).

Everything above is committed — see the commit this handoff was written in for the exact diff.

## Temporary testing settings — must revisit before shipping

- **Email confirmation is disabled** in the Supabase dashboard (Authentication → Sign In / Providers → Email → "Confirm email" toggled off), at the project owner's explicit request, so sign-up works with placeholder/fake addresses during testing. The app code already handles both outcomes (`signUp()` returning a session immediately vs. showing `/confirm-email`), so re-enabling needs no code change — just flip the dashboard toggle.
- **Client-side email validation is deliberately loose**: `EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/` in `app/sign-up.tsx` and `app/invite/[token].tsx` (just requires an `@`). `app/login.tsx` still has the stricter original pattern. Marked with a `// Loosened for pre-launch testing` comment in the code.
- Test accounts named "Dad"/"Mom" (older_adult, connected to an adult_child test account) exist in the linked Supabase project from earlier manual testing, including a manually-backfilled `phone_number` on at least one of them. These are throwaway dev-project rows, not anything to preserve or treat as real data.
- **GitHub remote now configured** (2026-08-18): private repo at `git@github.com:Aarav7894/HelloFamily.git`, `origin/main` pushed and tracked. Auth is via a new ed25519 SSH key (`~/.ssh/id_ed25519`) added to the user's GitHub account — `gh` CLI is not installed on this machine.

## Important warnings / things that must not be changed without discussion

- **Keep the Expo SDK package patch versions aligned** and regenerate the native projects after changing them.
- **Do not modify the database schema, RLS policies, triggers, or functions** without explaining the change and getting explicit approval first — this is the project owner's own standing rule (see CLAUDE.md).
- **Do not let the service-role key or DB password enter the mobile app or its repo.**
- **Do not weaken the `check_ins`/`daily_statuses` privacy split** (adult_child must never read raw check-in answers).
- **Do not hand-edit anything under `ios/` or `android/`** — both are gitignored and fully regenerated by `expo prebuild`/`expo run:ios` from `app.config.js`. Any native-facing change (plugins, entitlements) belongs in `app.config.js`.
- **Do not run `supabase db pull`/`db dump`/`db diff`** — Docker isn't installed on this machine and these commands require it. Use `supabase db query --linked` for schema introspection instead.
- **Do not push to a remote or open a PR** without first setting one up with the user — none exists today.

## Exact next steps (priority order)

1. Design the remote-push Edge Function + Database Webhook + push-token-registration flow, get the user's explicit sign-off on any schema change, then implement it.
2. Verify Expo token registration and notification delivery on a physical iPhone using the Lumos Fellows Apple Developer team; the Simulator only verifies that the native module loads.
3. Otherwise, work down the "Unfinished work" list above in order (re-enable email confirmation prep, tighten email validation, invite management UI, universal links, finish `docs/supabase-project-settings.md`).
