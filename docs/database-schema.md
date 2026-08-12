# HelloFamily Database Schema (as verified against the live project)

> Generated 2026-08-12 by directly querying the linked Supabase project's
> `information_schema`/`pg_catalog`/`pg_policies` (via `supabase db query
> --linked`), **not** from assumptions or the earlier hand-written doc.
> This reflects what is actually deployed. See
> [supabase-schema.md](supabase-schema.md) for the original project-owner
> doc, and CLAUDE.md for how this file was produced and its caveats
> (Docker wasn't available, so this wasn't generated via `supabase db
> pull`).

## Enums

| Enum | Values |
|---|---|
| `user_role` | `adult_child`, `older_adult` |
| `connection_status` | `active`, `revoked` |
| `invite_status` | `pending`, `accepted`, `expired`, `revoked` |
| `feeling_answer` | `good`, `okay`, `not_good` |
| `wellness_answer` | `yes`, `mostly`, `no` |
| `checkin_status` | `completed`, `concern`, `missed` (there is **no** `pending` enum value — see below) |

## Tables

### `profiles`
One row per authenticated user (`id` = `auth.users.id`, cascades on delete). Holds `full_name` (nullable, 1–100 chars if present), `role` (nullable — null until a valid role is set at signup or via the role-select fallback), and `timezone` (default `America/Chicago`).

- **Read**: own profile, or a profile you're connected to (via `private.are_connected()`).
- **Write**: insert/update only your own row.

### `family_connections`
Links one `adult_child` profile to one `older_adult` profile. `status` defaults `active`; `adult_child_id ≠ older_adult_id` is enforced, as is uniqueness of the pair.

- **Read**: either person in the connection.
- **Write**: none directly — rows are only created by the `redeem_invite()` function.

### `invites`
An adult_child's invitation to connect an older adult. Stores only `token_hash` (never the plaintext token), `status` (default `pending`), `expires_at`, `contact` (nullable, added later — see below), and who created/used it.

- **Read**: nothing at baseline. `invites_select_own` (added by the `create_invite_functions` migration) lets an adult_child read their own invites by `created_by` — **but see the ⚠️ finding below.**
- **Write**: none directly — only via `create_invite()` / `redeem_invite()`.

### `check_ins` — the older adult's *private* answers
One row per older adult per day (`unique (older_adult_id, check_in_date)`). Three answer columns (`feeling`, `physically_okay`, `normal_activities`) plus a **generated** column, `concern_detected`, computed automatically as:

```
feeling = 'not_good' OR physically_okay = 'no' OR normal_activities = 'no'
```

- **Read**: only the older adult, their own rows.
- **Write**: only insert, only your own row (no update/delete from the client — check-in history is immutable once submitted).
- **Adult children have no access to this table at all** — no policy, no grant.

### `daily_statuses` — the *shareable* status derived from check-ins
One row per older adult per day (`unique (older_adult_id, status_date)`). Never contains the three private answers — just `status` (`completed`/`concern`/`missed`), `completed_at`, and a nullable, unique link back to the `check_ins` row that produced it. A check constraint enforces that `completed`/`concern` always have both `check_in_id` and `completed_at` set, while `missed` always has both null.

- **Read**: the older adult (own rows), or a connected adult_child (via `private.is_connected_adult_child()`).
- **Write**: none directly — created only by the `on_check_in_created` trigger (see below), or in future by a scheduled missed-check-in job.
- **"Pending" is a UI concept, not a stored value**: if no row exists for today, the app should show "Pending" — there is no `pending` value in the `checkin_status` enum.

### `notification_preferences`
One row per user (`user_id` PK), created automatically alongside `profiles` at signup. Reminder time, cutoff time, and four alert toggles, all with sensible defaults. **Not yet used by the app** — no notification feature reads or writes this table today.

- **Read/write**: only your own row.

### `push_tokens`
Zero or more Expo push tokens per user, unique per token string, `platform` constrained to `ios`/`android`. **Not yet used by the app.**

- **Read/write/delete**: only your own rows.

## Foreign keys

| From | Column | To | On delete |
|---|---|---|---|
| `profiles.id` | — | `auth.users.id` | CASCADE |
| `family_connections.adult_child_id` / `.older_adult_id` | → `profiles.id` | CASCADE |
| `invites.created_by` | → `profiles.id` | CASCADE |
| `invites.used_by` | → `profiles.id` | SET NULL |
| `check_ins.older_adult_id` | → `profiles.id` | CASCADE |
| `daily_statuses.older_adult_id` | → `profiles.id` | CASCADE |
| `daily_statuses.check_in_id` | → `check_ins.id` | CASCADE |
| `notification_preferences.user_id` | → `profiles.id` | CASCADE |
| `push_tokens.user_id` | → `profiles.id` | CASCADE |

## Automatic triggers

| Trigger | On | Fires | Calls |
|---|---|---|---|
| `on_auth_user_created` | `auth.users` (managed schema) | AFTER INSERT | `handle_new_user()` — creates the matching `profiles` and `notification_preferences` rows from signup metadata (`full_name`, `role`, `timezone`) |
| `on_check_in_created` | `public.check_ins` | AFTER INSERT | `create_status_from_check_in()` — creates the matching `daily_statuses` row (`concern` if `concern_detected`, else `completed`) |
| `profiles_set_updated_at` | `public.profiles` | BEFORE UPDATE | `set_updated_at()` |
| `notification_preferences_set_updated_at` | `public.notification_preferences` | BEFORE UPDATE | `set_updated_at()` |
| `push_tokens_set_updated_at` | `public.push_tokens` | BEFORE UPDATE | `set_updated_at()` |

Two more functions exist in a `private` schema and are used *inside* RLS policies (not called by the app directly): `private.are_connected(a, b)` and `private.is_connected_adult_child(adult_child, older_adult)`, both `SECURITY DEFINER` so a policy can check connection status without granting the querying role direct access to `family_connections`.

## Privacy separation: `check_ins` vs. `daily_statuses`

This is the core privacy guarantee of the app: the three raw daily answers live only in `check_ins`, which only the older adult who wrote them can ever read (no policy or grant exists for any other role). The `on_check_in_created` trigger derives a same-day `daily_statuses` row containing only a status enum — never the answers — and *that* table is what a connected adult_child is allowed to read. There is no code path, client-side or server-side, through which an adult_child can reach the underlying answers.

## ⚠️ Findings from this pull (differences from the earlier doc / issues worth fixing)

1. ~~**`invites_select_own` policy exists but has no matching table grant.**~~ **Fixed 2026-08-12** in `supabase/migrations/20260812203852_grant_invites_select.sql` (`grant select on public.invites to authenticated;`), applied to the remote project and verified via `information_schema.role_table_grants`. Originally: the `create_invite_functions` migration added a `SELECT` RLS policy on `invites` for `authenticated`, but never ran the matching `GRANT`. Postgres checks table-level privileges *before* RLS, so the policy was silently non-functional — this likely explains why the "pending invites" list was never confirmed working before this fix.
2. **Duplicate index on `invites.created_by`.** Two indexes cover the same column: the pre-existing `invites_created_by_idx` and `idx_invites_created_by` (added by the same migration that added the policy above, redundantly). Harmless but worth dropping one in a future cleanup migration.
3. Everything else in [supabase-schema.md](supabase-schema.md) (the original project-owner doc) matches what's actually deployed — all 7 tables, all 6 enums, all named functions/triggers, and every stated RLS/privacy behavior were confirmed present exactly as documented.
