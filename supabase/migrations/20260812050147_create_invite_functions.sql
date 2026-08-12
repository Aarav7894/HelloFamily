-- Adds secure invitation creation/redemption for the family-connection flow.
--
-- The mobile client has no direct INSERT/UPDATE privileges on `invites` or
-- `family_connections` (per the schema's privacy design), so both operations
-- are exposed as SECURITY DEFINER functions that:
--   * verify the caller's role before acting
--   * store only a SHA-256 hash of the invite token, never the plaintext
--   * use an empty search_path with fully-qualified names to prevent
--     search_path hijacking
--   * are revoked from PUBLIC and granted only to `authenticated`

-- pgcrypto provides gen_random_bytes()/digest() for token generation/hashing.
create extension if not exists pgcrypto with schema extensions;

-- Lets an adult_child remember who they invited (e.g. "Invited: mom@x.com").
-- Nullable: the invite still works even if no contact info is recorded.
alter table public.invites
  add column if not exists contact text;

-- The client needs to read back its own invites to show pending/accepted
-- status; no such policy existed before this migration.
create index if not exists idx_invites_created_by on public.invites (created_by);

create policy "invites_select_own"
  on public.invites
  for select
  to authenticated
  using (created_by = (select auth.uid()));

-- Generates one invite for the calling adult_child. Returns the plaintext
-- token exactly once so the client can build a shareable link; only its
-- hash is persisted.
create or replace function public.create_invite(p_contact text default null)
returns table (invite_id uuid, token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_role;
  v_token text;
  v_expires timestamptz := now() + interval '7 days';
  v_id uuid;
begin
  select role into v_role from public.profiles where id = (select auth.uid());
  if v_role is distinct from 'adult_child' then
    raise exception 'Only adult_child accounts can create invites';
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.invites (created_by, token_hash, expires_at, contact)
  values (
    (select auth.uid()),
    encode(extensions.digest(v_token, 'sha256'), 'hex'),
    v_expires,
    nullif(trim(both from p_contact), '')
  )
  returning id into v_id;

  return query select v_id, v_token, v_expires;
end;
$$;

revoke all on function public.create_invite(text) from public;
grant execute on function public.create_invite(text) to authenticated;

-- Validates a plaintext invite token for the calling older_adult and, if
-- valid, atomically creates the family connection and marks the invite
-- accepted. Raises if the token is missing/expired/already used, or if the
-- caller isn't an older_adult.
create or replace function public.redeem_invite(p_token text)
returns table (adult_child_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_role;
  v_invite public.invites%rowtype;
begin
  select role into v_role from public.profiles where id = (select auth.uid());
  if v_role is distinct from 'older_adult' then
    raise exception 'Only older_adult accounts can redeem invites';
  end if;

  select * into v_invite from public.invites
    where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
      and status = 'pending'
      and expires_at > now()
    for update;

  if not found then
    raise exception 'Invalid or expired invite';
  end if;

  insert into public.family_connections (adult_child_id, older_adult_id)
  values (v_invite.created_by, (select auth.uid()));

  update public.invites
    set status = 'accepted', used_by = (select auth.uid()), used_at = now()
    where id = v_invite.id;

  return query select v_invite.created_by;
end;
$$;

revoke all on function public.redeem_invite(text) from public;
grant execute on function public.redeem_invite(text) to authenticated;
