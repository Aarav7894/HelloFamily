import { router } from "expo-router";
import { Pressable } from "react-native";
import { Feather } from "@/components/icon";

export function BackButton() {
  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      className="h-12 w-12 items-center justify-center rounded-full active:bg-accent"
    >
      <Feather name="chevron-left" size={28} className="text-foreground" />
    </Pressable>
  );
}
