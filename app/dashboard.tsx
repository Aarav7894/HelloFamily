import { router } from "expo-router";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useAppState } from "@/lib/app-state";
import { formatFullDate } from "@/lib/dates";
import { dayStatus } from "@/lib/sample-data";
import { cn } from "@/lib/utils";

export default function DashboardScreen() {
  const { olderAdultName, history, todayStatus, reset } = useAppState();

  const lastCompletedEntry = [...history]
    .reverse()
    .find((entry) => entry.responses);
  const pastDays = history.slice(0, -1).reverse();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="gap-6 pb-6 pt-8"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-1">
          <Text variant="muted">{formatFullDate(new Date())}</Text>
          <Text variant="h1" className="text-left text-3xl">
            {olderAdultName}&apos;s Day
          </Text>
        </View>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Today&apos;s Check-In</CardTitle>
          </CardHeader>
          <CardContent className="gap-4">
            <StatusBadge status={todayStatus} />
            <Text variant="muted" className="text-base">
              Last completed:{" "}
              {lastCompletedEntry
                ? lastCompletedEntry.label
                : "No check-ins yet"}
            </Text>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            {pastDays.map((entry, index) => (
              <View
                key={entry.date}
                className={cn(
                  "flex-row items-center justify-between pt-3",
                  index > 0 && "border-border border-t",
                )}
              >
                <Text className="text-base">{entry.label}</Text>
                <StatusBadge status={dayStatus(entry)} size="compact" />
              </View>
            ))}
            <Text variant="muted" className="text-sm">
              Individual answers stay private — only daily status is shown here.
            </Text>
          </CardContent>
        </Card>
      </ScrollView>

      {__DEV__ && (
        <View className="px-6 pb-6">
          <Button
            variant="outline"
            className="h-12"
            onPress={() => {
              reset();
              router.replace("/");
            }}
          >
            <Text>Switch Role (Dev)</Text>
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}
