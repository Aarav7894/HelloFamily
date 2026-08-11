import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackButton } from "@/components/back-button";
import { ChoiceButton } from "@/components/choice-button";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useAppState } from "@/lib/app-state";
import { formatFullDate } from "@/lib/dates";
import {
  type CheckInResponses,
  dailyQuestions,
  type QuestionId,
} from "@/lib/sample-data";

export default function CheckInScreen() {
  const { completeCheckIn } = useAppState();
  const [answers, setAnswers] = useState<Partial<Record<QuestionId, string>>>(
    {},
  );

  const isComplete = dailyQuestions.every((question) => answers[question.id]);

  function selectAnswer(id: QuestionId, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function handleSubmit() {
    if (!isComplete) return;
    completeCheckIn(answers as CheckInResponses);
    router.replace("/check-in-complete");
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-2 pt-2">
        <BackButton />
        <Pressable
          onPress={() => router.push("/check-in-history")}
          accessibilityRole="button"
          hitSlop={12}
          className="rounded-full px-3 py-2 active:bg-accent"
        >
          <Text className="font-semibold text-base">History</Text>
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
      </ScrollView>
      <View className="border-border border-t px-6 py-4">
        <Button
          size="lg"
          className="h-14"
          disabled={!isComplete}
          onPress={handleSubmit}
        >
          <Text className="text-lg font-semibold">Submit Check-In</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
