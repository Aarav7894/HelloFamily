import { router } from "expo-router";
import { Image, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useAppState } from "@/lib/app-state";

export default function WelcomeScreen() {
  const { setRole } = useAppState();

  function previewAs(role: "adult-child" | "older-adult") {
    setRole(role);
    router.replace(role === "adult-child" ? "/dashboard" : "/check-in");
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-between px-6 py-8">
        <View className="flex-1 items-center justify-center gap-5">
          <Image
            source={require("@/assets/images/icon.png")}
            className="h-20 w-20 rounded-2xl"
            resizeMode="cover"
            accessibilityLabel="HelloFamily logo"
          />
          <Text variant="h1" className="text-4xl">
            Stay connected.{"\n"}Know they&apos;re okay.
          </Text>
          <Text variant="lead" className="text-center">
            HelloFamily helps families stay connected with their loved ones
            through one simple daily check-in.
          </Text>
        </View>

        <View className="gap-3">
          <Button
            size="lg"
            className="h-14"
            onPress={() => router.push("/sign-up")}
          >
            <Text className="text-lg font-semibold">Create Account</Text>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-14"
            onPress={() => router.push("/login")}
          >
            <Text className="text-lg font-semibold">Log In</Text>
          </Button>

          {__DEV__ && (
            <View className="mt-6 gap-3 border-border border-t pt-6">
              <Text variant="muted" className="text-center">
                Developer Preview — test both roles without an account
              </Text>
              <View className="flex-row gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onPress={() => previewAs("adult-child")}
                >
                  <Text>Adult Child View</Text>
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onPress={() => previewAs("older-adult")}
                >
                  <Text>Older Adult View</Text>
                </Button>
              </View>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
