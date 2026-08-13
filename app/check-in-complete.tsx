import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth-context";
import { formatFullDate } from "@/lib/dates";
import { fetchTodayCheckInStatus } from "@/lib/family-api";

export default function CheckInCompleteScreen() {
  const { session, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [isConcern, setIsConcern] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    if (!session) return;
    fetchTodayCheckInStatus()
      .then((status) => setIsConcern(status === "concern"))
      .finally(() => setLoadingStatus(false));
  }, [session]);

  if (!session) {
    return <Redirect href="/" />;
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  if (loadingStatus) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </SafeAreaView>
    );
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
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <View
          className={
            isConcern
              ? "h-20 w-20 items-center justify-center rounded-full bg-orange-100"
              : "h-20 w-20 items-center justify-center rounded-full bg-emerald-100"
          }
        >
          <Feather
            name="check"
            size={40}
            className={isConcern ? "text-orange-600" : "text-emerald-600"}
          />
        </View>
        <Text variant="h1" className="text-center text-3xl">
          You&apos;re all set for today
        </Text>
        <Text variant="muted">{formatFullDate(new Date())}</Text>
        {isConcern ? (
          <Text variant="lead" className="text-center">
            Thanks for checking in. Your family will see that you may need some
            extra support today.
          </Text>
        ) : (
          <Text variant="lead" className="text-center">
            Thanks for checking in. Your family will see that you&apos;re doing
            okay.
          </Text>
        )}
      </View>

      <View className="gap-3 px-6 pb-6">
        <Button
          variant="outline"
          className="h-12"
          onPress={() => router.push("/check-in-history")}
        >
          <Text>View My Check-In History</Text>
        </Button>
        {__DEV__ && (
          <Button
            variant="ghost"
            className="h-12"
            onPress={() => router.replace("/")}
          >
            <Text>Back to Welcome (Dev)</Text>
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}
