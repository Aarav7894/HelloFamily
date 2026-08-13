import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackButton } from "@/components/back-button";
import { InitialsCircle } from "@/components/initials-circle";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth-context";
import { formatStatusDateLabel, formatTime } from "@/lib/dates";
import {
  type FamilyStatus,
  fetchFamilyMemberDetail,
  type StatusHistoryEntry,
} from "@/lib/family-api";
import { cn } from "@/lib/utils";

const STATUS_META: Record<
  FamilyStatus,
  { emoji: string; label: string; textClass: string }
> = {
  completed: {
    emoji: "🟢",
    label: "Everything's okay",
    textClass: "text-emerald-700",
  },
  concern: {
    emoji: "🟠",
    label: "May need support",
    textClass: "text-amber-700",
  },
  missed: {
    emoji: "⚫",
    label: "Missed check-in",
    textClass: "text-muted-foreground",
  },
  pending: {
    emoji: "⚪",
    label: "Check-in pending",
    textClass: "text-muted-foreground",
  },
};

export default function FamilyMemberScreen() {
  const { session, profile, loading } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [fullName, setFullName] = useState<string | null>(null);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!session || !id) return;
    fetchFamilyMemberDetail(id).then((detail) => {
      setFullName(detail.fullName);
      setHistory(detail.history);
      setLoadingHistory(false);
    });
  }, [session, id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!session || profile?.role !== "adult_child") {
    return <Redirect href="/" />;
  }

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
        <View className="flex-row items-center gap-3">
          <InitialsCircle name={fullName ?? "?"} />
          <Text variant="h1" className="text-left text-3xl">
            {fullName ?? "Family Member"}
          </Text>
        </View>

        {loadingHistory ? (
          <ActivityIndicator />
        ) : history.length === 0 ? (
          <Text variant="muted">No check-ins yet.</Text>
        ) : (
          history.map((entry) => {
            const meta = STATUS_META[entry.status];
            return (
              <Card key={entry.statusDate}>
                <CardContent className="flex-row items-center justify-between pt-6">
                  <Text className="text-base font-semibold">
                    {formatStatusDateLabel(entry.statusDate)}
                  </Text>
                  <View className="items-end gap-1">
                    <Text className={cn("font-semibold", meta.textClass)}>
                      {meta.emoji} {meta.label}
                    </Text>
                    {entry.completedAt ? (
                      <Text variant="muted" className="text-sm">
                        {formatTime(new Date(entry.completedAt))}
                      </Text>
                    ) : null}
                  </View>
                </CardContent>
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
