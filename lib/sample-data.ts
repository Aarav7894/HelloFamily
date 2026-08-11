// Local sample data standing in for future Supabase-backed data.
// Shapes here are intended to mirror what real queries/tables will return
// so screens can later be repointed at Supabase with minimal changes.

import { daysAgo, formatShortDate, isoDate } from "@/lib/dates";

export type CheckInStatus = "completed" | "pending" | "concern" | "missed";

export type MoodAnswer = "good" | "okay" | "not_good";
export type YesNoAnswer = "yes" | "mostly" | "no";

export type CheckInResponses = {
  mood: MoodAnswer;
  physicallyOkay: YesNoAnswer;
  completedActivities: YesNoAnswer;
};

export type QuestionId = keyof CheckInResponses;

export type DailyQuestion = {
  id: QuestionId;
  question: string;
  options: { value: string; label: string }[];
};

export type OlderAdultProfile = {
  name: string;
};

export type CheckInHistoryEntry = {
  date: string; // ISO yyyy-mm-dd
  label: string; // "Today" | "Yesterday" | "Mon, Jan 1"
  responses: CheckInResponses | null; // null = no check-in that day
};

export const sampleOlderAdult: OlderAdultProfile = {
  name: "Eleanor",
};

export const dailyQuestions: DailyQuestion[] = [
  {
    id: "mood",
    question: "How are you feeling today?",
    options: [
      { value: "good", label: "Good" },
      { value: "okay", label: "Okay" },
      { value: "not_good", label: "Not Good" },
    ],
  },
  {
    id: "physicallyOkay",
    question: "Are you feeling physically okay today?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "mostly", label: "Mostly" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "completedActivities",
    question: "Were you able to complete your normal daily activities today?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "mostly", label: "Mostly" },
      { value: "no", label: "No" },
    ],
  },
];

const ANSWER_SCORE: Record<MoodAnswer | YesNoAnswer, number> = {
  good: 2,
  yes: 2,
  okay: 1,
  mostly: 1,
  not_good: 0,
  no: 0,
};

/** Total wellbeing score for one day's responses. Range: 0 (worst) to 6 (best). */
export function scoreResponses(responses: CheckInResponses): number {
  return (
    ANSWER_SCORE[responses.mood] +
    ANSWER_SCORE[responses.physicallyOkay] +
    ANSWER_SCORE[responses.completedActivities]
  );
}

function historyEntry(
  daysBack: number,
  responses: CheckInResponses | null,
): CheckInHistoryEntry {
  const date = daysAgo(daysBack);
  return {
    date: isoDate(date),
    label: formatShortDate(date, daysBack),
    responses,
  };
}

// Sample history for the last 7 days, ending yesterday. Today's entry is
// tracked separately in app state since it's filled in live during the demo.
// Deliberately trends downward toward yesterday to demonstrate the
// "gradual decline" concern case on the Adult Child dashboard.
export const sampleCheckInHistory: CheckInHistoryEntry[] = [
  historyEntry(7, {
    mood: "good",
    physicallyOkay: "yes",
    completedActivities: "yes",
  }),
  historyEntry(6, {
    mood: "good",
    physicallyOkay: "yes",
    completedActivities: "mostly",
  }),
  historyEntry(5, {
    mood: "okay",
    physicallyOkay: "mostly",
    completedActivities: "yes",
  }),
  historyEntry(4, null),
  historyEntry(3, {
    mood: "okay",
    physicallyOkay: "mostly",
    completedActivities: "mostly",
  }),
  historyEntry(2, {
    mood: "not_good",
    physicallyOkay: "mostly",
    completedActivities: "no",
  }),
  historyEntry(1, {
    mood: "not_good",
    physicallyOkay: "no",
    completedActivities: "no",
  }),
];

/**
 * Derives today's dashboard status from recent history so a single so-so day
 * doesn't read as a concern, but an acutely bad day or a multi-day slump does.
 */
export function deriveDashboardStatus(
  history: CheckInHistoryEntry[],
): CheckInStatus {
  const today = history[history.length - 1];
  if (!today || !today.responses) return "pending";

  const todayScore = scoreResponses(today.responses);
  const recentScores = history
    .filter((entry) => entry.responses)
    .slice(-3)
    .map((entry) => scoreResponses(entry.responses as CheckInResponses));

  const acutelyBad = todayScore === 0;
  const decliningTrend =
    recentScores.length === 3 &&
    recentScores[0] > recentScores[1] &&
    recentScores[1] > recentScores[2];
  const sustainedLow =
    recentScores.length === 3 && recentScores.every((score) => score <= 2);

  if (acutelyBad || decliningTrend || sustainedLow) return "concern";
  return "completed";
}

export function dayStatus(entry: CheckInHistoryEntry): CheckInStatus {
  if (!entry.responses) return "missed";
  return scoreResponses(entry.responses) <= 1 ? "concern" : "completed";
}
