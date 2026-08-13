import { Redirect, router } from "expo-router";
import { ActivityIndicator, Image, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth-context";

export default function WelcomeScreen() {
  const { session, profile, loading } = useAuth();

  if (!loading && session && profile) {
    if (profile.role === "adult_child") return <Redirect href="/family" />;
    if (profile.role === "older_adult") return <Redirect href="/check-in" />;
    return <Redirect href="/role-select" />;
  }

  if (loading || (session && !profile)) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center gap-6 px-6">
        <View className="items-center gap-3">
          <Image
            source={require("@/assets/images/icon.png")}
            className="h-20 w-20 rounded-2xl"
            resizeMode="cover"
            accessibilityLabel="HelloFamily logo"
          />
          <Text className="text-2xl font-bold">HelloFamily</Text>
          <Text variant="h1">Stay connected.{"\n"}Know they&apos;re okay.</Text>
          <Text variant="lead" className="text-center">
            Daily check-ins give families peace of mind, one simple tap at a
            time.
          </Text>
        </View>

        <Card>
          <CardContent className="gap-3 pt-6">
            <Button
              size="lg"
              className="h-14"
              onPress={() => router.push("/login")}
            >
              <Text className="text-lg font-semibold">Log In</Text>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14"
              onPress={() => router.push("/sign-up")}
            >
              <Text className="text-lg font-semibold">Create Account</Text>
            </Button>
            <View className="flex-row items-center justify-center gap-2 pt-1">
              <Feather
                name="users"
                size={16}
                className="text-muted-foreground"
              />
              <Text variant="muted">For adult children and older adults</Text>
            </View>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex-col items-center gap-2 pt-6">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-accent">
              <Feather
                name="lock"
                size={22}
                className="text-accent-foreground"
              />
            </View>
            <Text className="text-lg font-semibold">Private and simple</Text>
          </CardContent>
        </Card>

        <Text variant="muted" className="text-center text-sm">
          Email and password required
        </Text>
      </View>
    </SafeAreaView>
  );
}
