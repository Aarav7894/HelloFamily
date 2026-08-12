# Supabase Project Settings (Dashboard-Only)

> Settings that live in the Supabase dashboard / Management API, not in the
> SQL schema — so they aren't (and can't be) captured by
> `supabase/migrations/`. **No secrets are recorded here, ever** — no keys,
> passwords, or access tokens.

## Project

| Item | Value |
|---|---|
| Project ref | `curtqahakfbfucrnsler` |
| Region | `us-east-2` (AWS) |
| Postgres | `17.6.1.155` |
| Auth (GoTrue) | `v2.195.0` |
| PostgREST | `v14.15` |
| Storage | `v1.68.11` |

(Versions/region read from local Supabase CLI metadata — `supabase/.temp/*-version`, `supabase/.temp/pooler-url` — not from the dashboard UI, since Docker isn't available on this machine to reach the Management API through the CLI. See CLAUDE.md's Supabase section for that constraint.)

## Authentication

| Setting | Value | Status |
|---|---|---|
| Confirm email | **Disabled** | Confirmed in this project's working sessions — turned off deliberately so signup works with placeholder/fake emails during development, without sending real mail. **Must be re-enabled before shipping.** |
| Site URL | — | Not yet confirmed. Check Authentication → URL Configuration in the dashboard. |
| Redirect URLs | — | Not yet confirmed. |
| JWT expiry (access token lifetime) | — | Not yet confirmed. Check Authentication → Settings. |
| Enabled providers | — | Not yet confirmed. Expected: Email only — the app only implements email/password auth. |
| Rate limits | — | Not yet confirmed / assumed default. |

## Security reminders

- The mobile app must only ever use `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see `.env.local`, gitignored via `.env*.local`).
- The service-role key and the database password must **never** be placed in the Expo app, in `.env.local`, or committed anywhere in this repo.

## How to finish this doc

The "Not yet confirmed" rows need a human to check the dashboard (Authentication → Settings / Providers / URL Configuration) and fill in the actual values — none of them are secrets, just configuration.
