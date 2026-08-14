import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@/components/icon";
import {
  type ChoiceTone,
  SegmentedChoice,
} from "@/components/segmented-choice";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth-context";
import { formatFullDate } from "@/lib/dates";
import { hasCheckedInToday, submitCheckIn } from "@/lib/family-api";
import {
  type CheckInResponses,
  dailyQuestions,
  type QuestionId,
} from "@/lib/sample-data";

const OPTION_TONES: ChoiceTone[] = ["positive", "neutral", "negative"];

export default function CheckInScreen() {
  const { session, loading } = useAuth();
  const [answers, setAnswers] = useState<Partial<Record<QuestionId, string>>>(
    {},
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [checkingToday, setCheckingToday] = useState(true);

  useEffect(() => {
    if (!session) return;
    hasCheckedInToday()
      .then((done) => {
        if (done) router.replace("/check-in-complete");
      })
      .finally(() => setCheckingToday(false));
  }, [session]);

  if (loading || checkingToday) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!session) {
    return <Redirect href="/" />;
  }

  const isComplete = dailyQuestions.every((question) => answers[question.id]);

  function selectAnswer(id: QuestionId, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit() {
    if (!isComplete) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await submitCheckIn(answers as CheckInResponses);
      router.replace("/check-in-complete");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Could not submit your check-in.",
      );
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-between gap-3 px-6 pt-4 pb-5">
        <View className="gap-3">
          <View className="gap-1">
            <Text variant="muted">{formatFullDate(new Date())}</Text>
            <Text variant="h1" className="text-left text-2xl">
              Daily Check-In
            </Text>
            <Text variant="lead" className="text-left text-sm">
              Take a moment to share how you&apos;re doing today.
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-muted-foreground text-sm">
              3 quick questions
            </Text>
            <View className="flex-row items-center">
              {[1, 2, 3].map((step, i) => (
                <View key={step} className="flex-row items-center">
                  {i > 0 ? <View className="h-px w-4 bg-border" /> : null}
                  <View className="h-6 w-6 items-center justify-center rounded-full border border-border bg-background">
                    <Text className="font-semibold text-[11px] text-muted-foreground">
                      {step}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {dailyQuestions.map((question, index) => (
            <View key={question.id} className="gap-2">
              {index > 0 ? <View className="h-px bg-border" /> : null}
              <View className="flex-row items-center gap-2">
                <View className="h-6 w-6 items-center justify-center rounded-full bg-foreground">
                  <Text className="font-semibold text-[11px] text-background">
                    {index + 1}
                  </Text>
                </View>
                <Text className="flex-1 text-lg font-semibold">
                  {question.question}
                </Text>
              </View>
              <SegmentedChoice
                options={question.options.map((option, optionIndex) => ({
                  ...option,
                  tone: OPTION_TONES[optionIndex],
                }))}
                selectedValue={answers[question.id]}
                onSelect={(value) => selectAnswer(question.id, value)}
              />
            </View>
          ))}
          {submitError ? (
            <Text className="text-destructive">{submitError}</Text>
          ) : null}
        </View>

        <Button
          size="lg"
          className="h-14"
          disabled={!isComplete || submitting}
          onPress={handleSubmit}
        >
          <Text className="text-lg font-semibold">
            {submitting ? "Submitting..." : "Submit Check-In"}
          </Text>
          {!submitting ? (
            <Feather
              name="arrow-right"
              size={20}
              className="text-primary-foreground"
            />
          ) : null}
        </Button>
      </View>
    </SafeAreaView>
  );
}
