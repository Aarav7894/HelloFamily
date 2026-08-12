import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Share, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth-context";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import {
  createInvite,
  fetchPendingInvites,
  type PendingInvite,
} from "@/lib/family-api";

export default function InviteFamilyScreen() {
  const { session, profile, loading } = useAuth();
  const [contact, setContact] = useState("");
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    fetchPendingInvites()
      .then(setInvites)
      .finally(() => setLoadingInvites(false));
  }, [session]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!session || profile?.role !== "adult_child") {
    return <Redirect href="/" />;
  }

  async function handleInvite() {
    if (!contact.trim()) {
      setError("Enter an email or phone number.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { token } = await createInvite(contact.trim());
      const link = `hello-family://invite/${token}`;
      setContact("");
      setInvites(await fetchPendingInvites());
      await Share.share({
        message: `You've been invited to HelloFamily. Tap this link to create your account and connect with me: ${link}`,
      });
    } catch (err) {
      setError(
        getAuthErrorMessage(
          err instanceof Error ? err : { message: String(err) },
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-2 pt-2">
        <BackButton />
      </View>
      <View className="flex-1 gap-6 px-6 pt-4">
        <View className="gap-1">
          <Text variant="h1" className="text-left text-3xl">
            Invite Family
          </Text>
          <Text variant="lead" className="text-left">
            Send a link so a loved one can create their account and connect with
            you.
          </Text>
        </View>

        <View className="gap-2">
          <Label nativeID="invite-contact">Email or phone number</Label>
          <Input
            aria-labelledby="invite-contact"
            value={contact}
            onChangeText={setContact}
            placeholder="mom@example.com"
            autoCapitalize="none"
            className="h-14 text-lg"
            editable={!submitting}
          />
          {error ? <Text className="text-destructive">{error}</Text> : null}
        </View>

        <Button
          size="lg"
          className="h-14"
          onPress={handleInvite}
          disabled={submitting}
        >
          <Text className="text-lg font-semibold">
            {submitting ? "Creating Invite..." : "Invite & Share"}
          </Text>
        </Button>

        <View className="gap-3">
          <Text className="text-lg font-semibold">Pending Invites</Text>
          {loadingInvites ? (
            <ActivityIndicator />
          ) : invites.length === 0 ? (
            <Text variant="muted">No invites sent yet.</Text>
          ) : (
            invites.map((invite) => (
              <Card key={invite.id}>
                <CardContent className="flex-row items-center justify-between pt-6">
                  <Text className="text-base">
                    {invite.contact ?? "Invite link"}
                  </Text>
                  <Text variant="muted">Pending</Text>
                </CardContent>
              </Card>
            ))
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
