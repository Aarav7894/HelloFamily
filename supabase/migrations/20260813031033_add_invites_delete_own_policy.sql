-- Lets an adult_child delete invites they created — needed so the
-- Invite Family screen can offer "delete" on a pending invite (e.g. one that
-- failed to actually get sent, or that the adult child no longer wants
-- outstanding), individually or in bulk.
--
-- `invites` has no delete policy or delete grant yet (only the select policy
-- + grant added in the two prior invites migrations), so both are added here
-- following the same created_by-ownership pattern as invites_select_own.

create policy "invites_delete_own"
  on public.invites
  for delete
  to authenticated
  using (created_by = (select auth.uid()));

grant delete on public.invites to authenticated;
