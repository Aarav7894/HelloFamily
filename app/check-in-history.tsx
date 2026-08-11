import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackButton } from "@/components/back-button";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useAppState } from "@/lib/app-state";
import { type CheckInHistoryEntry, dailyQuestions } from "@/lib/sample-data";

function answerLabel(
  questionId: (typeof dailyQuestions)[number]["id"],
  value: string,
) {
  const question = dailyQuestions.find((q) => q.id === questionId);
  return (
    question?.options.find((option) => option.value === value)?.label ?? value
  );
}

function HistoryRow({ entry }: { entry: CheckInHistoryEntry }) {
  return (
    <Card>
      <CardContent className="gap-2 pt-6">
        <Text className="text-lg font-semibold">{entry.label}</Text>
        {entry.responses ? (
          <View className="flex-row flex-wrap gap-2">
            {dailyQuestions.map((question) => (
              <View
                key={question.id}
                className="rounded-full border border-border bg-muted px-3 py-1"
              >
                <Text className="text-muted-foreground text-sm">
                  {answerLabel(
                    question.id,
                    entry.responses?.[question.id] ?? "",
                  )}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text variant="muted">No check-in that day</Text>
        )}
      </CardContent>
    </Card>
  );
}

export default function CheckInHistoryScreen() {
  const { history } = useAppState();
  const orderedHistory = [...history].reverse();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-2 pt-2">
        <BackButton />
      </View>
      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="gap-4 pb-6 pt-2"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-1">
          <Text variant="h1" className="text-left text-3xl">
            Your Check-In History
          </Text>
          <Text variant="lead" className="text-left">
            Only you can see your past answers.
          </Text>
        </View>

        {orderedHistory.map((entry) => (
          <HistoryRow key={entry.date} entry={entry} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
