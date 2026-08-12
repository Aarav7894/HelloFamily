# HelloFamily Supabase Database Schema

> Persisted copy of the schema document supplied by the project owner.
> **Treat this as the source of truth for the existing Supabase database.**
> The schema and Row Level Security policies described here have already
> been created directly on the remote project (not via migrations in this
> repo — see the "Local migration history" note in CLAUDE.md).
>
> **Do not create, rename, delete, or modify database tables, columns, enum
> values, triggers, functions, or RLS policies unless you first explain the
> proposed change and receive approval.** If the schema you observe differs
> from this document, stop and report the exact difference rather than
> guessing or silently changing either side.

## Authentication

Supabase Auth stores accounts in `auth.users`. Application profiles use the
same UUID as the corresponding `auth.users.id`.

The application must use only:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Never place the database password, secret key, or service-role key in the
Expo app.

---

## Enum Types

**`public.user_role`**: `adult_child` | `older_adult`

**`public.connection_status`**: `active` | `revoked`

**`public.invite_status`**: `pending` | `accepted` | `expired` | `revoked`

**`public.feeling_answer`**: `good` | `okay` | `not_good`

**`public.wellness_answer`**: `yes` | `mostly` | `no`

**`public.checkin_status`**: `completed` | `concern` | `missed`

"Pending" is not stored as a database status. If no `daily_statuses` row
exists for the current date before the missed-check-in cutoff, the app
displays "Pending."

---

## Tables

### 1. `public.profiles`

Stores application profile information for each authenticated user.

| Column       | Type               | Rules                                                              |
| ------------ | ------------------ | -------------------------------------------------------------------- |
| `id`         | `uuid`             | Primary key; references `auth.users.id`; cascades on user deletion |
| `full_name`  | `text`             | Nullable; 1–100 characters when present                            |
| `role`       | `public.user_role` | Nullable initially                                                  |
| `timezone`   | `text`             | Required; default `America/Chicago`                                 |
| `created_at` | `timestamptz`      | Required; default `now()`                                           |
| `updated_at` | `timestamptz`      | Required; default `now()`                                           |

Security behavior:
- Users can read their own profile.
- Users can read profiles belonging to connected family members.
- Users can insert or update only their own profile.

`updated_at` is updated automatically.

### 2. `public.family_connections`

Connects one adult-child account with one older-adult account.

| Column           | Type                       | Rules                                                    |
| ---------------- | -------------------------- | --------------------------------------------------------- |
| `id`             | `uuid`                     | Primary key; generated automatically                      |
| `adult_child_id` | `uuid`                     | Required; references `profiles.id`; cascades on deletion |
| `older_adult_id` | `uuid`                     | Required; references `profiles.id`; cascades on deletion |
| `status`         | `public.connection_status` | Required; default `active`                                |
| `connected_at`   | `timestamptz`              | Required; default `now()`                                 |
| `revoked_at`     | `timestamptz`              | Nullable                                                   |

Constraints:
- A user cannot be connected to themselves.
- The same adult-child/older-adult pair can appear only once.

Security behavior:
- Either person in a connection can read the connection.
- The mobile client cannot directly insert, update, or delete connections.
- A secure invitation-redemption function will create connections later
  *(implemented — see `redeem_invite` below)*.

### 3. `public.invites`

Stores invitations created by adult-child accounts.

| Column       | Type                   | Rules                                                                       |
| ------------ | ---------------------- | ----------------------------------------------------------------------------- |
| `id`         | `uuid`                 | Primary key; generated automatically                                          |
| `created_by` | `uuid`                 | Required; references `profiles.id`; cascades on deletion                     |
| `token_hash` | `text`                 | Required and unique                                                           |
| `status`     | `public.invite_status` | Required; default `pending`                                                   |
| `expires_at` | `timestamptz`          | Required                                                                       |
| `used_by`    | `uuid`                 | Nullable; references `profiles.id`; becomes null if that profile is deleted |
| `used_at`    | `timestamptz`          | Nullable                                                                       |
| `created_at` | `timestamptz`          | Required; default `now()`                                                     |
| `contact`    | `text`                 | **Added by `20260812050147_create_invite_functions.sql`.** Nullable; the email/phone the adult child entered, for display only. |

Important:
- Store only a hash of an invitation token, never the plain token.
- Originally: "No direct mobile-client policies or privileges currently
  exist for this table." **Updated**: a `invites_select_own` SELECT policy
  (own `created_by` only) was added in the same migration, so the client can
  show its own pending invites. INSERT/UPDATE/DELETE are still only possible
  via the `create_invite`/`redeem_invite` SECURITY DEFINER functions.

### 4. `public.check_ins`

Stores the older adult's private daily answers.

| Column              | Type                     | Rules                                                    |
| -------------------- | ------------------------ | --------------------------------------------------------- |
| `id`                | `uuid`                   | Primary key; generated automatically                       |
| `older_adult_id`    | `uuid`                   | Required; references `profiles.id`; cascades on deletion  |
| `check_in_date`     | `date`                   | Required                                                   |
| `feeling`           | `public.feeling_answer`  | Required                                                   |
| `physically_okay`   | `public.wellness_answer` | Required                                                   |
| `normal_activities` | `public.wellness_answer` | Required                                                   |
| `concern_detected`  | `boolean`                | Generated automatically                                     |
| `submitted_at`      | `timestamptz`            | Required; default `now()`                                  |

Constraints:
- An older adult can submit only one check-in per date.
- Check-in history should not be updated or deleted from the client.

`concern_detected` becomes `true` when `feeling = 'not_good'`, or
`physically_okay = 'no'`, or `normal_activities = 'no'`. Otherwise `false`.

Security behavior:
- Older adults can insert their own check-ins.
- Older adults can read only their own check-ins.
- Adult children cannot read this table, and must never receive individual
  answers through another client-side query.

Value mappings from the interface: "Good"→`good`, "Okay"→`okay`,
"Not Good"→`not_good`, "Yes"→`yes`, "Mostly"→`mostly`, "No"→`no`.

### 5. `public.daily_statuses`

Stores status-only history that may be viewed by the older adult and
connected adult child.

| Column           | Type                    | Rules                                                                |
| ---------------- | ----------------------- | ----------------------------------------------------------------------- |
| `id`             | `uuid`                  | Primary key; generated automatically                                     |
| `older_adult_id` | `uuid`                  | Required; references `profiles.id`; cascades on deletion                |
| `status_date`    | `date`                  | Required                                                                  |
| `status`         | `public.checkin_status` | Required                                                                  |
| `completed_at`   | `timestamptz`           | Nullable                                                                   |
| `check_in_id`    | `uuid`                  | Nullable and unique; references `check_ins.id`; cascades on deletion    |
| `created_at`     | `timestamptz`           | Required; default `now()`                                                 |

Constraints:
- Only one status row can exist for each older adult on each date.
- `completed` and `concern` require both `check_in_id` and `completed_at`.
- `missed` requires `check_in_id` and `completed_at` to be null.

Security behavior:
- An older adult can read their own statuses.
- A connected adult child can read the older adult's statuses.
- The mobile client cannot directly insert, update, or delete status rows —
  they're created by trusted database processes (the `check_ins` trigger, or
  in future a scheduled missed-check-in job).

Display mappings: `completed`→"Check-in completed", `concern`→"Concern
detected", `missed`→"Missed", no row for today before cutoff→"Pending".

This table must never contain the three private answers.

### 6. `public.notification_preferences`

| Column                    | Type          | Rules                                                       |
| ------------------------- | ------------- | -------------------------------------------------------------- |
| `user_id`                 | `uuid`        | Primary key; references `profiles.id`; cascades on deletion  |
| `timezone`                | `text`        | Required; default `America/Chicago`                          |
| `daily_reminder_time`     | `time`        | Required; default `18:00`                                     |
| `missed_check_in_cutoff`  | `time`        | Required; default `21:00`                                     |
| `daily_reminder_enabled`  | `boolean`     | Required; default `true`                                       |
| `completed_alert_enabled` | `boolean`     | Required; default `true`                                       |
| `concern_alert_enabled`   | `boolean`     | Required; default `true`                                       |
| `missed_alert_enabled`    | `boolean`     | Required; default `true`                                       |
| `updated_at`              | `timestamptz` | Required; default `now()`                                      |

Security: users can read, insert, and update only their own preferences.
`updated_at` is updated automatically. **Not yet used by the app** — no
notification features are implemented.

### 7. `public.push_tokens`

| Column            | Type          | Rules                                                    |
| ----------------- | ------------- | ------------------------------------------------------------- |
| `id`              | `uuid`        | Primary key; generated automatically                            |
| `user_id`         | `uuid`        | Required; references `profiles.id`; cascades on deletion       |
| `expo_push_token` | `text`        | Required and unique                                              |
| `platform`        | `text`        | Required; default `ios`; must be `ios` or `android`              |
| `active`          | `boolean`     | Required; default `true`                                         |
| `created_at`      | `timestamptz` | Required; default `now()`                                        |
| `updated_at`      | `timestamptz` | Required; default `now()`                                        |

Security: users can read, add, update, and delete only their own device
tokens. `updated_at` is updated automatically. **Not yet used by the app.**

---

## Automatic Database Behavior

**New-user trigger.** When Supabase creates a row in `auth.users`,
`public.handle_new_user()` automatically creates a matching `profiles` row
and a matching `notification_preferences` row, reading `full_name`, `role`,
`timezone` from the signup metadata. If the metadata has no valid role,
`profiles.role` remains null. Signup must send:

```ts
options: {
  data: { full_name: fullName, role: selectedRole, timezone: deviceTimezone }
}
```

Do not manually create a second profile after signup unless the automatic
trigger demonstrably failed.

**Check-in trigger.** After a new `check_ins` row is inserted,
`public.create_status_from_check_in()` automatically creates a
corresponding `daily_statuses` row (`concern` if `concern_detected`, else
`completed`; `status_date = check_in_date`; `completed_at = submitted_at`;
`check_in_id` = the new row's id). The app should insert the check-in only —
never separately insert a completed/concern status.

**Missed status.** Not implemented yet. A future secure scheduled backend
process will create a `daily_statuses` row with `status = 'missed'`,
`check_in_id = null`, `completed_at = null`, only after the relevant older
adult's local cutoff time and timezone.

---

## Relationships

```text
auth.users
    │
    └── profiles
          ├── notification_preferences
          ├── push_tokens
          ├── check_ins
          │      └── daily_statuses
          ├── invites
          └── family_connections
                 ├── adult_child_id
                 └── older_adult_id
```

---

## Privacy Requirements (mandatory)

1. An older adult may view their own historical answers from `check_ins`.
2. An adult child may view only status history from `daily_statuses`.
3. An adult child must never query or receive rows from `check_ins`.
4. Do not weaken or bypass Row Level Security.
5. Do not use a service-role key in the mobile app.
6. Do not calculate privacy authorization only in the interface.
7. Do not store plain invitation tokens.
8. Do not allow the client to directly create family connections.
9. Do not allow the client to directly create daily status rows.
10. Do not allow check-in history to be edited or deleted through the app.

---

## Implementation Order (roadmap)

1. Supabase authentication and persistent sessions — **done**
2. Fetch the authenticated user's `profiles` row — **done**
3. Route according to `profiles.role` — **done**
4. Submit older-adult check-ins to `check_ins` — **done**
5. Read the older adult's answer history from `check_ins` — **not done**
   (the older adult's own history screen still reads local sample data)
6. Build secure invitation creation and redemption functions — **done**
   (`create_invite` / `redeem_invite`, see CLAUDE.md)
7. Read connected family and status history — **done** (adult child
   dashboard)
8. Add local daily reminders — **not done**
9. Register Expo push tokens — **not done**
10. Add remote completed, concern, and missed notifications — **not done**
11. Add scheduled missed-check-in processing — **not done**

When integrating the app, use the existing schema exactly as documented. If
the schema you observe differs from this document, stop and report the
exact difference rather than guessing or silently changing either side.
