import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth-context";
import { formatFullDate } from "@/lib/dates";
import { type FamilyMember, fetchFamilyMembers } from "@/lib/family-api";

export default function DashboardScreen() {
  const { session, loading, signOut } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetchFamilyMembers()
      .then(setMembers)
      .finally(() => setLoadingMembers(false));
  }, [session]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!session) {
    return <Redirect href="/" />;
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="gap-6 pb-6 pt-8"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-1">
          <Text variant="muted">{formatFullDate(new Date())}</Text>
          <Text variant="h1" className="text-left text-3xl">
            Your Family
          </Text>
        </View>

        <Button
          size="lg"
          className="h-14"
          onPress={() => router.push("/invite-family")}
        >
          <Text className="text-lg font-semibold">Invite Family Member</Text>
        </Button>

        {loadingMembers ? (
          <ActivityIndicator />
        ) : members.length === 0 ? (
          <Card>
            <CardContent className="gap-2 pt-6">
              <Text className="text-lg font-semibold">
                No family members yet
              </Text>
              <Text variant="muted">
                Invite a loved one above to see their daily check-in status
                here.
              </Text>
            </CardContent>
          </Card>
        ) : (
          members.map((member) => (
            <Card key={member.id}>
              <CardHeader>
                <CardTitle className="text-xl">
                  {member.fullName ?? "Family Member"}
                </CardTitle>
              </CardHeader>
              <CardContent className="gap-4">
                <StatusBadge status={member.status} />
                <Text variant="muted" className="text-base">
                  Last completed:{" "}
                  {member.lastCompletedDate ?? "No check-ins yet"}
                </Text>
              </CardContent>
            </Card>
          ))
        )}
      </ScrollView>

      <View className="px-6 pb-6">
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
