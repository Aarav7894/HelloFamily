import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackButton } from "@/components/back-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useAppState } from "@/lib/app-state";

export default function RoleSelectScreen() {
  const { setRole } = useAppState();

  function choose(role: "adult-child" | "older-adult") {
    setRole(role);
    router.replace(role === "adult-child" ? "/dashboard" : "/check-in");
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-2 pt-2">
        <BackButton />
      </View>
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
          onPress={() => choose("adult-child")}
          accessibilityRole="button"
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
          onPress={() => choose("older-adult")}
          accessibilityRole="button"
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
      </View>
    </SafeAreaView>
  );
}
