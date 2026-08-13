-- Add profiles.phone_number so an adult child's dashboard can offer real
-- Call/Message actions for a connected older adult. Collected at invite
-- redemption (app/invite/[token].tsx) and signup, passed through
-- raw_user_meta_data the same way full_name/timezone already are.

alter table public.profiles
  add column if not exists phone_number text;

-- Recreate handle_new_user() to also populate phone_number. Full body
-- reproduced (not just the diff) since create or replace function
-- requires the complete definition — see 20260806000000_baseline_schema.sql
-- for the original.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_role public.user_role;
  selected_timezone text;
begin
  selected_role :=
    case
      when new.raw_user_meta_data ->> 'role'
        in ('adult_child', 'older_adult')
      then (new.raw_user_meta_data ->> 'role')::public.user_role
      else null
    end;

  selected_timezone :=
    coalesce(
      nullif(new.raw_user_meta_data ->> 'timezone', ''),
      'America/Chicago'
    );

  insert into public.profiles (id, full_name, role, timezone, phone_number)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    selected_role,
    selected_timezone,
    nullif(new.raw_user_meta_data ->> 'phone_number', '')
  );

  insert into public.notification_preferences (user_id, timezone)
  values (new.id, selected_timezone);

  return new;
end;
$$;
