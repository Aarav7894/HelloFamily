import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { redeemInvite } from "@/lib/family-api";
import { supabase } from "@/lib/supabase";

// Loosened for pre-launch testing with placeholder addresses — tighten before shipping.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

function validate(fullName: string, email: string, password: string) {
  if (!fullName.trim()) return "Enter your full name.";
  if (!EMAIL_PATTERN.test(email.trim())) return "Enter a valid email address.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export default function AcceptInviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const validationError = validate(fullName, email, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role: "older_adult",
          timezone,
        },
      },
    });

    if (signUpError) {
      setSubmitting(false);
      setError(getAuthErrorMessage(signUpError));
      return;
    }

    if (data.session && token) {
      const result = await redeemInvite(token);
      setSubmitting(false);
      if (!result) {
        setError(
          "Your account was created, but this invite link is invalid or has expired.",
        );
        return;
      }
      router.replace("/");
      return;
    }

    setSubmitting(false);
    router.replace({
      pathname: "/confirm-email",
      params: { email: email.trim() },
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 gap-6 px-6 pt-10">
        <View className="gap-1">
          <Text variant="h1" className="text-left text-3xl">
            You&apos;ve been invited
          </Text>
          <Text variant="lead" className="text-left">
            Create your account to connect with your family.
          </Text>
        </View>

        <View className="gap-4">
          <View className="gap-2">
            <Label nativeID="accept-name">Full Name</Label>
            <Input
              aria-labelledby="accept-name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
              autoCapitalize="words"
              autoComplete="name"
              className="h-14 text-lg"
              editable={!submitting}
            />
          </View>
          <View className="gap-2">
            <Label nativeID="accept-email">Email</Label>
            <Input
              aria-labelledby="accept-email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              className="h-14 text-lg"
              editable={!submitting}
            />
          </View>
          <View className="gap-2">
            <Label nativeID="accept-password">Password</Label>
            <Input
              aria-labelledby="accept-password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              secureTextEntry
              className="h-14 text-lg"
              editable={!submitting}
            />
          </View>
          {error ? <Text className="text-destructive">{error}</Text> : null}
        </View>

        <Button
          size="lg"
          className="h-14"
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text className="text-lg font-semibold">
            {submitting ? "Creating Account..." : "Create Account"}
          </Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
