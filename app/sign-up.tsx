import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    if (!email.trim() || !password) {
      setError("Enter an email and password to create your account.");
      return;
    }
    setError(null);
    // Sample data only — real account creation is not implemented yet.
    router.push("/role-select");
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-2 pt-2">
        <BackButton />
      </View>
      <View className="flex-1 gap-6 px-6 pt-4">
        <View className="gap-1">
          <Text variant="h1" className="text-left text-3xl">
            Create your account
          </Text>
          <Text variant="lead" className="text-left">
            It only takes a minute to get started.
          </Text>
        </View>

        <View className="gap-4">
          <View className="gap-2">
            <Label nativeID="signup-email">Email</Label>
            <Input
              aria-labelledby="signup-email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              className="h-14 text-lg"
            />
          </View>
          <View className="gap-2">
            <Label nativeID="signup-password">Password</Label>
            <Input
              aria-labelledby="signup-password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              secureTextEntry
              className="h-14 text-lg"
            />
          </View>
          {error ? <Text className="text-destructive">{error}</Text> : null}
        </View>

        <Button size="lg" className="h-14" onPress={handleSubmit}>
          <Text className="text-lg font-semibold">Create Account</Text>
        </Button>

        <Button variant="ghost" onPress={() => router.replace("/login")}>
          <Text>Already have an account? Log in</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
