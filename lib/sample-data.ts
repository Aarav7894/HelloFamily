// The older adult's daily check-in question config. Shared between the
// check-in form and the check-in history screen.

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
