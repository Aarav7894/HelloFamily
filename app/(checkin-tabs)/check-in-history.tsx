import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth-context";
import { formatStatusDateLabel } from "@/lib/dates";
import {
  fetchOwnCheckInHistory,
  type OwnCheckInHistoryEntry,
} from "@/lib/family-api";
import { dailyQuestions } from "@/lib/sample-data";

function answerLabel(
  questionId: (typeof dailyQuestions)[number]["id"],
  value: string,
) {
  const question = dailyQuestions.find((q) => q.id === questionId);
  return (
    question?.options.find((option) => option.value === value)?.label ?? value
  );
}

function HistoryRow({ entry }: { entry: OwnCheckInHistoryEntry }) {
  return (
    <Card>
      <CardContent className="gap-2 pt-6">
        <Text className="text-lg font-semibold">
          {formatStatusDateLabel(entry.date)}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {dailyQuestions.map((question) => (
            <View
              key={question.id}
              className="rounded-full border border-border bg-muted px-3 py-1"
            >
              <Text className="text-muted-foreground text-sm">
                {answerLabel(question.id, entry.responses[question.id])}
              </Text>
            </View>
          ))}
        </View>
      </CardContent>
    </Card>
  );
}

export default function CheckInHistoryScreen() {
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [history, setHistory] = useState<OwnCheckInHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOwnCheckInHistory()
      .then(setHistory)
      .finally(() => setLoading(false));
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-end px-4 pt-2">
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
        contentContainerClassName="gap-4 pb-6"
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

        {loading ? (
          <ActivityIndicator />
        ) : history.length === 0 ? (
          <Text variant="muted">No check-ins yet.</Text>
        ) : (
          history.map((entry) => <HistoryRow key={entry.date} entry={entry} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
