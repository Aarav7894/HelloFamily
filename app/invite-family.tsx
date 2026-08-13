import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackButton } from "@/components/back-button";
import { Feather } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth-context";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import {
  createInvite,
  deleteInvite,
  deleteInvites,
  fetchPendingInvites,
  type PendingInvite,
} from "@/lib/family-api";

type SendMethod = "mail" | "message";

function inviteMessage(link: string) {
  return `You've been invited to HelloFamily. Tap this link to create your account and connect with me: ${link}`;
}

export default function InviteFamilyScreen() {
  const { session, profile, loading } = useAuth();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [sending, setSending] = useState<SendMethod | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

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

  async function sendInvite(method: SendMethod) {
    setError(null);
    setSending(method);
    let createdId: string | null = null;
    try {
      const { id, token } = await createInvite();
      createdId = id;
      const link = `hello-family://invite/${token}`;
      const body = encodeURIComponent(inviteMessage(link));
      const url =
        method === "mail"
          ? `mailto:?subject=${encodeURIComponent("You're invited to HelloFamily")}&body=${body}`
          : Platform.OS === "ios"
            ? `sms:&body=${body}`
            : `sms:?body=${body}`;
      await Linking.openURL(url);
      setInvites(await fetchPendingInvites());
    } catch (err) {
      if (createdId) {
        await deleteInvite(createdId).catch(() => {});
        setError(
          method === "mail"
            ? "No Mail app is set up on this device."
            : "No Messages app is set up on this device.",
        );
      } else {
        setError(
          getAuthErrorMessage(
            err instanceof Error ? err : { message: String(err) },
          ),
        );
      }
    } finally {
      setSending(null);
    }
  }

  function handleDeleteInvite(id: string) {
    Alert.alert("Delete invite?", "This invite link will stop working.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeletingId(id);
          try {
            await deleteInvite(id);
            setInvites((prev) => prev.filter((invite) => invite.id !== id));
          } catch (err) {
            setError(
              getAuthErrorMessage(
                err instanceof Error ? err : { message: String(err) },
              ),
            );
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  }

  function handleDeleteAll() {
    if (invites.length === 0) return;
    Alert.alert(
      "Delete all pending invites?",
      "These invite links will stop working.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            setDeletingAll(true);
            try {
              await deleteInvites(invites.map((invite) => invite.id));
              setInvites([]);
            } catch (err) {
              setError(
                getAuthErrorMessage(
                  err instanceof Error ? err : { message: String(err) },
                ),
              );
            } finally {
              setDeletingAll(false);
            }
          },
        },
      ],
    );
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

        <View className="gap-3">
          <Button
            size="lg"
            className="h-14"
            onPress={() => sendInvite("mail")}
            disabled={sending !== null}
          >
            <Feather
              name="mail"
              size={20}
              className="text-primary-foreground"
            />
            <Text className="text-lg font-semibold">
              {sending === "mail"
                ? "Creating Invite..."
                : "Send Invite via Mail"}
            </Text>
          </Button>
          <Button
            size="lg"
            className="h-14"
            onPress={() => sendInvite("message")}
            disabled={sending !== null}
          >
            <Feather
              name="message-circle"
              size={20}
              className="text-primary-foreground"
            />
            <Text className="text-lg font-semibold">
              {sending === "message"
                ? "Creating Invite..."
                : "Send Invite via Message"}
            </Text>
          </Button>
          {error ? <Text className="text-destructive">{error}</Text> : null}
        </View>

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold">Pending Invites</Text>
            {invites.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onPress={handleDeleteAll}
                disabled={deletingAll}
              >
                <Text className="text-destructive">
                  {deletingAll ? "Deleting..." : "Delete All"}
                </Text>
              </Button>
            ) : null}
          </View>
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
                  <View className="flex-row items-center gap-3">
                    <Text variant="muted">Pending</Text>
                    <Button
                      variant="ghost"
                      size="icon"
                      onPress={() => handleDeleteInvite(invite.id)}
                      disabled={deletingId === invite.id}
                    >
                      <Feather
                        name="trash-2"
                        size={18}
                        className="text-destructive"
                      />
                    </Button>
                  </View>
                </CardContent>
              </Card>
            ))
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
