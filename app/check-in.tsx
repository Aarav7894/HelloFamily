import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChoiceButton } from "@/components/choice-button";
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

export default function CheckInScreen() {
  const { session, loading, signOut } = useAuth();
  const [answers, setAnswers] = useState<Partial<Record<QuestionId, string>>>(
    {},
  );
  const [signingOut, setSigningOut] = useState(false);
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

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pt-2">
        <Pressable
          onPress={() => router.push("/check-in-history")}
          accessibilityRole="button"
          hitSlop={12}
          className="rounded-full px-3 py-2 active:bg-accent"
        >
          <Text className="font-semibold text-base">History</Text>
        </Pressable>
        <Pressable
          onPress={handleSignOut}
          disabled={signingOut}
          accessibilityRole="button"
          hitSlop={12}
          className="rounded-full px-3 py-2 active:bg-accent"
        >
          <Text variant="muted" className="text-base">
            {signingOut ? "Logging Out..." : "Log Out"}
          </Text>
        </Pressable>
      </View>
      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="gap-8 pb-6 pt-2"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-2">
          <Text variant="muted">{formatFullDate(new Date())}</Text>
          <Text variant="h1" className="text-left text-3xl">
            Daily Check-In
          </Text>
          <Text variant="lead" className="text-left">
            Let your family know how you&apos;re doing today.
          </Text>
        </View>

        {dailyQuestions.map((question) => (
          <View key={question.id} className="gap-3">
            <Text className="text-xl font-semibold">{question.question}</Text>
            <View className="flex-row gap-3">
              {question.options.map((option) => (
                <ChoiceButton
                  key={option.value}
                  label={option.label}
                  selected={answers[question.id] === option.value}
                  onPress={() => selectAnswer(question.id, option.value)}
                />
              ))}
            </View>
          </View>
        ))}
        {submitError ? (
          <Text className="text-destructive">{submitError}</Text>
        ) : null}
      </ScrollView>
      <View className="border-border border-t px-6 py-4">
        <Button
          size="lg"
          className="h-14"
          disabled={!isComplete || submitting}
          onPress={handleSubmit}
        >
          <Text className="text-lg font-semibold">
            {submitting ? "Submitting..." : "Submit Check-In"}
          </Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
