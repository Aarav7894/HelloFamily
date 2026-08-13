// Thin typed wrappers around the Supabase queries/RPCs backing the family
// connection and check-in flows. Kept separate from screens so the data
// access shape stays easy to audit against the schema/RLS contract.

import type { CheckInResponses } from "@/lib/sample-data";
import { supabase } from "@/lib/supabase";

export type FamilyStatus = "completed" | "concern" | "missed" | "pending";

export type FamilyMember = {
  id: string;
  fullName: string | null;
  status: FamilyStatus;
  lastCompletedDate: string | null;
};

export type PendingInvite = {
  id: string;
  contact: string | null;
  expiresAt: string;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function fetchFamilyMembers(): Promise<FamilyMember[]> {
  const userId = await currentUserId();
  if (!userId) return [];

  const { data: connections } = await supabase
    .from("family_connections")
    .select("older_adult_id")
    .eq("adult_child_id", userId)
    .eq("status", "active");

  const olderAdultIds = (connections ?? []).map(
    (c) => c.older_adult_id as string,
  );
  if (olderAdultIds.length === 0) return [];

  const [
    { data: profiles },
    { data: todayStatuses },
    { data: recentStatuses },
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", olderAdultIds),
    supabase
      .from("daily_statuses")
      .select("older_adult_id, status")
      .in("older_adult_id", olderAdultIds)
      .eq("status_date", todayIso()),
    supabase
      .from("daily_statuses")
      .select("older_adult_id, status_date")
      .in("older_adult_id", olderAdultIds)
      .in("status", ["completed", "concern"])
      .order("status_date", { ascending: false }),
  ]);

  const nameById = new Map<string, string | null>(
    (profiles ?? []).map((p) => [p.id as string, p.full_name as string | null]),
  );
  const todayStatusById = new Map<string, FamilyStatus>(
    (todayStatuses ?? []).map((s) => [
      s.older_adult_id as string,
      s.status as FamilyStatus,
    ]),
  );
  const lastCompletedById = new Map<string, string>();
  for (const row of recentStatuses ?? []) {
    const id = row.older_adult_id as string;
    if (!lastCompletedById.has(id)) {
      lastCompletedById.set(id, row.status_date as string);
    }
  }

  return olderAdultIds.map((id) => ({
    id,
    fullName: nameById.get(id) ?? null,
    status: todayStatusById.get(id) ?? "pending",
    lastCompletedDate: lastCompletedById.get(id) ?? null,
  }));
}

export async function fetchPendingInvites(): Promise<PendingInvite[]> {
  const { data, error } = await supabase
    .from("invites")
    .select("id, contact, expires_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    contact: row.contact as string | null,
    expiresAt: row.expires_at as string,
  }));
}

export async function deleteInvite(id: string): Promise<void> {
  const { error } = await supabase.from("invites").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteInvites(ids: string[]): Promise<void> {
  const { error } = await supabase.from("invites").delete().in("id", ids);
  if (error) throw new Error(error.message);
}

export async function createInvite(
  contact?: string,
): Promise<{ id: string; token: string; expiresAt: string }> {
  const { data, error } = await supabase.rpc("create_invite", {
    p_contact: contact,
  });

  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row) {
    throw new Error(error?.message ?? "Could not create invite.");
  }
  return {
    id: row.invite_id as string,
    token: row.token as string,
    expiresAt: row.expires_at as string,
  };
}

export async function redeemInvite(
  token: string,
): Promise<{ adultChildId: string } | null> {
  const { data, error } = await supabase.rpc("redeem_invite", {
    p_token: token,
  });

  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row) return null;
  return { adultChildId: row.adult_child_id as string };
}

export async function hasCheckedInToday(): Promise<boolean> {
  const userId = await currentUserId();
  if (!userId) return false;

  const { data, error } = await supabase
    .from("check_ins")
    .select("id")
    .eq("older_adult_id", userId)
    .eq("check_in_date", todayIso())
    .maybeSingle();

  return !error && !!data;
}

export async function submitCheckIn(
  responses: CheckInResponses,
): Promise<void> {
  const userId = await currentUserId();
  if (!userId) throw new Error("You're not signed in.");

  const { error } = await supabase.from("check_ins").insert({
    older_adult_id: userId,
    check_in_date: todayIso(),
    feeling: responses.mood,
    physically_okay: responses.physicallyOkay,
    normal_activities: responses.completedActivities,
  });

  if (error) throw new Error(error.message);
}
