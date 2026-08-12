import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

export default function ConfirmEmailScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-accent">
          <Feather name="mail" size={36} className="text-accent-foreground" />
        </View>
        <Text variant="h1" className="text-center text-3xl">
          Check your email
        </Text>
        <Text variant="lead" className="text-center">
          {email
            ? `We sent a confirmation link to ${email}.`
            : "We sent you a confirmation link."}{" "}
          Open it to activate your account, then log in below.
        </Text>
      </View>

      <View className="gap-3 px-6 pb-6">
        <Button
          size="lg"
          className="h-14"
          onPress={() => router.replace("/login")}
        >
          <Text className="text-lg font-semibold">Back to Log In</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
