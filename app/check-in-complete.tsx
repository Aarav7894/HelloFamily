import { router } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { formatFullDate } from "@/lib/dates";

export default function CheckInCompleteScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <Feather name="check" size={40} className="text-emerald-600" />
        </View>
        <Text variant="h1" className="text-center text-3xl">
          You&apos;re all set for today
        </Text>
        <Text variant="muted">{formatFullDate(new Date())}</Text>
        <Text variant="lead" className="text-center">
          Thanks for checking in. Your family will see that you&apos;re doing
          okay.
        </Text>
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
