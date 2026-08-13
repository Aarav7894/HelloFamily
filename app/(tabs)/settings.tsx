import { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth-context";

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 gap-6 px-6 pt-8">
        <Text variant="h1" className="text-left text-3xl">
          Settings
        </Text>
        <Button
          variant="outline"
          className="h-12"
          onPress={handleSignOut}
          disabled={signingOut}
        >
          <Text>{signingOut ? "Logging Out..." : "Log Out"}</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
