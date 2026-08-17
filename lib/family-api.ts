// Thin typed wrappers around the Supabase queries/RPCs backing the family
// connection and check-in flows. Kept separate from screens so the data
// access shape stays easy to audit against the schema/RLS contract.

import { isoDate } from "@/lib/dates";
import type {
  CheckInResponses,
  MoodAnswer,
  YesNoAnswer,
} from "@/lib/sample-data";
import { supabase } from "@/lib/supabase";

export type FamilyStatus = "completed" | "concern" | "missed" | "pending";

export type FamilyMember = {
  id: string;
  fullName: string | null;
  phoneNumber: string | null;
  status: FamilyStatus;
  lastCompletedAt: string | null;
};

export type StatusHistoryEntry = {
  statusDate: string;
  status: FamilyStatus;
  completedAt: string | null;
};

export type PendingInvite = {
  id: string;
  contact: string | null;
  expiresAt: string;
};

export type OwnCheckInHistoryEntry = {
  date: string;
  responses: CheckInResponses;
};

export type NotificationPreferences = {
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
};

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
    supabase
      .from("profiles")
      .select("id, full_name, phone_number")
      .in("id", olderAdultIds),
    supabase
      .from("daily_statuses")
      .select("older_adult_id, status")
      .in("older_adult_id", olderAdultIds)
      .eq("status_date", isoDate(new Date())),
    supabase
      .from("daily_statuses")
      .select("older_adult_id, status_date, completed_at")
      .in("older_adult_id", olderAdultIds)
      .in("status", ["completed", "concern"])
      .order("status_date", { ascending: false }),
  ]);

  const nameById = new Map<string, string | null>(
    (profiles ?? []).map((p) => [p.id as string, p.full_name as string | null]),
  );
  const phoneById = new Map<string, string | null>(
    (profiles ?? []).map((p) => [
      p.id as string,
      p.phone_number as string | null,
    ]),
  );
  const todayStatusById = new Map<string, FamilyStatus>(
    (todayStatuses ?? []).map((s) => [
      s.older_adult_id as string,
      s.status as FamilyStatus,
    ]),
  );
  const lastCompletedAtById = new Map<string, string>();
  for (const row of recentStatuses ?? []) {
    const id = row.older_adult_id as string;
    if (!lastCompletedAtById.has(id) && row.completed_at) {
      lastCompletedAtById.set(id, row.completed_at as string);
    }
  }

  return olderAdultIds.map((id) => ({
    id,
    fullName: nameById.get(id) ?? null,
    phoneNumber: phoneById.get(id) ?? null,
    status: todayStatusById.get(id) ?? "pending",
    lastCompletedAt: lastCompletedAtById.get(id) ?? null,
  }));
}

export async function fetchFamilyMemberDetail(memberId: string): Promise<{
  fullName: string | null;
  history: StatusHistoryEntry[];
}> {
  const [{ data: profile }, { data: statuses }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", memberId)
      .maybeSingle(),
    supabase
      .from("daily_statuses")
      .select("status_date, status, completed_at")
      .eq("older_adult_id", memberId)
      .order("status_date", { ascending: false })
      .limit(30),
  ]);

  return {
    fullName: (profile?.full_name as string | null) ?? null,
    history: (statuses ?? []).map((row) => ({
      statusDate: row.status_date as string,
      status: row.status as FamilyStatus,
      completedAt: row.completed_at as string | null,
    })),
  };
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
    .eq("check_in_date", isoDate(new Date()))
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
    check_in_date: isoDate(new Date()),
    feeling: responses.mood,
    physically_okay: responses.physicallyOkay,
    normal_activities: responses.completedActivities,
  });

  if (error) throw new Error(error.message);
}

export async function fetchOwnCheckInHistory(): Promise<
  OwnCheckInHistoryEntry[]
> {
  const userId = await currentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("check_ins")
    .select("check_in_date, feeling, physically_okay, normal_activities")
    .eq("older_adult_id", userId)
    .order("check_in_date", { ascending: false })
    .limit(30);

  if (error || !data) return [];
  return data.map((row) => ({
    date: row.check_in_date as string,
    responses: {
      mood: row.feeling as MoodAnswer,
      physicallyOkay: row.physically_okay as YesNoAnswer,
      completedActivities: row.normal_activities as YesNoAnswer,
    },
  }));
}

export async function fetchTodayCheckInStatus(): Promise<FamilyStatus | null> {
  const userId = await currentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("daily_statuses")
    .select("status")
    .eq("older_adult_id", userId)
    .eq("status_date", isoDate(new Date()))
    .maybeSingle();

  if (error || !data) return null;
  return data.status as FamilyStatus;
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences | null> {
  const userId = await currentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("daily_reminder_enabled, daily_reminder_time")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    dailyReminderEnabled: data.daily_reminder_enabled,
    dailyReminderTime: data.daily_reminder_time,
  };
}
