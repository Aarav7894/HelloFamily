import { Redirect, router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth-context";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type RoleChoice = "adult_child" | "older_adult";

export default function RoleSelectScreen() {
  const { session, loading, refreshProfile } = useAuth();
  const [submittingRole, setSubmittingRole] = useState<RoleChoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!session) {
    return <Redirect href="/" />;
  }

  const userId = session.user.id;

  async function choose(role: RoleChoice) {
    setError(null);
    setSubmittingRole(role);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (updateError) {
      setError(getAuthErrorMessage(updateError));
      setSubmittingRole(null);
      return;
    }

    await refreshProfile();
    router.replace(role === "adult_child" ? "/dashboard" : "/check-in");
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center gap-4 px-6">
        <View className="mb-2 gap-1">
          <Text variant="h1" className="text-left text-3xl">
            Who are you?
          </Text>
          <Text variant="lead" className="text-left">
            Choose how you&apos;ll use HelloFamily.
          </Text>
        </View>

        <Pressable
          onPress={() => choose("adult_child")}
          disabled={submittingRole !== null}
          accessibilityRole="button"
          className={cn(submittingRole !== null && "opacity-50")}
        >
          <Card className="border-2">
            <CardContent className="gap-1 pt-6">
              <CardTitle className="text-xl">I&apos;m an Adult Child</CardTitle>
              <CardDescription className="text-base">
                I want to check on a loved one&apos;s daily wellbeing.
              </CardDescription>
            </CardContent>
          </Card>
        </Pressable>

        <Pressable
          onPress={() => choose("older_adult")}
          disabled={submittingRole !== null}
          accessibilityRole="button"
          className={cn(submittingRole !== null && "opacity-50")}
        >
          <Card className="border-2">
            <CardContent className="gap-1 pt-6">
              <CardTitle className="text-xl">I&apos;m an Older Adult</CardTitle>
              <CardDescription className="text-base">
                I want to send a daily check-in to my family.
              </CardDescription>
            </CardContent>
          </Card>
        </Pressable>

        {submittingRole ? (
          <Text variant="muted" className="text-center">
            Saving...
          </Text>
        ) : null}
        {error ? (
          <Text className="text-center text-destructive">{error}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
