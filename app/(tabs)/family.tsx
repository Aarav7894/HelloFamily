import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@/components/icon";
import { InitialsCircle } from "@/components/initials-circle";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { formatCheckInMoment, formatFullDate } from "@/lib/dates";
import { type FamilyMember, fetchFamilyMembers } from "@/lib/family-api";
import { cn } from "@/lib/utils";

async function handleCall(phoneNumber: string | null) {
  if (!phoneNumber) {
    Alert.alert(
      "No phone number on file",
      "This family member doesn't have a phone number saved yet.",
    );
    return;
  }
  try {
    await Linking.openURL(`tel:${phoneNumber.replace(/[^\d+]/g, "")}`);
  } catch {
    Alert.alert("Couldn't open Phone", "This device can't place calls.");
  }
}

async function handleMessage(phoneNumber: string | null) {
  if (!phoneNumber) {
    Alert.alert(
      "No phone number on file",
      "This family member doesn't have a phone number saved yet.",
    );
    return;
  }
  try {
    await Linking.openURL(`sms:${phoneNumber.replace(/[^\d+]/g, "")}`);
  } catch {
    Alert.alert(
      "Couldn't open Messages",
      "No Messages app is set up on this device.",
    );
  }
}

function StatusBadge({
  icon,
  label,
  className,
  textClassName,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  className: string;
  textClassName: string;
}) {
  return (
    <View
      className={cn(
        "flex-row items-center gap-1.5 self-start rounded-full px-3 py-1",
        className,
      )}
    >
      <Feather name={icon} size={14} className={textClassName} />
      <Text className={cn("text-sm font-semibold", textClassName)}>
        {label}
      </Text>
    </View>
  );
}

function StatusLine({ member }: { member: FamilyMember }) {
  if (member.status === "completed") {
    return (
      <View className="gap-1.5">
        <StatusBadge
          icon="check-circle"
          label="Everything's okay"
          className="bg-emerald-100"
          textClassName="text-emerald-700"
        />
        {member.lastCompletedAt ? (
          <Text variant="muted">
            Checked in {formatCheckInMoment(member.lastCompletedAt)}
          </Text>
        ) : null}
      </View>
    );
  }

  if (member.status === "concern") {
    return (
      <View className="gap-1.5">
        <StatusBadge
          icon="alert-circle"
          label="May need support"
          className="bg-amber-100"
          textClassName="text-amber-700"
        />
        <Text variant="muted">Today's check-in indicated a concern.</Text>
        {member.lastCompletedAt ? (
          <Text variant="muted">
            Checked in {formatCheckInMoment(member.lastCompletedAt)}
          </Text>
        ) : null}
        <View className="mt-1 flex-row gap-3">
          <Pressable
            onPress={() => handleCall(member.phoneNumber)}
            accessibilityRole="button"
            className="flex-row items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100/60 px-4 py-2 active:bg-amber-100"
          >
            <Feather name="phone" size={16} className="text-amber-700" />
            <Text className="font-medium text-amber-700">Call</Text>
          </Pressable>
          <Pressable
            onPress={() => handleMessage(member.phoneNumber)}
            accessibilityRole="button"
            className="flex-row items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100/60 px-4 py-2 active:bg-amber-100"
          >
            <Feather
              name="message-circle"
              size={16}
              className="text-amber-700"
            />
            <Text className="font-medium text-amber-700">Message</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (member.status === "missed") {
    return (
      <View className="gap-1.5">
        <StatusBadge
          icon="x-circle"
          label="Missed check-in"
          className="bg-muted"
          textClassName="text-muted-foreground"
        />
        {member.lastCompletedAt ? (
          <Text variant="muted">
            Last checked in {formatCheckInMoment(member.lastCompletedAt)}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View className="gap-1.5">
      <StatusBadge
        icon="clock"
        label="Check-in pending"
        className="bg-muted"
        textClassName="text-muted-foreground"
      />
      {member.lastCompletedAt ? (
        <Text variant="muted">
          Last checked in {formatCheckInMoment(member.lastCompletedAt)}
        </Text>
      ) : null}
    </View>
  );
}

function MemberCard({ member }: { member: FamilyMember }) {
  const theme =
    member.status === "completed"
      ? {
          bar: "bg-emerald-500",
          card: "bg-[#fcf9f5]",
          circle: "bg-emerald-100",
          text: "text-emerald-700",
        }
      : member.status === "concern"
        ? {
            bar: "bg-amber-500",
            card: "bg-[#fffef8]",
            circle: "bg-amber-100",
            text: "text-amber-700",
          }
        : {
            bar: "bg-border",
            card: "bg-[#fcf9f5]",
            circle: "bg-accent",
            text: "text-accent-foreground",
          };

  return (
    <Pressable
      onPress={() => router.push(`/family-member/${member.id}`)}
      accessibilityRole="button"
      className="active:opacity-80"
    >
      <View className={cn("flex-row overflow-hidden rounded-2xl", theme.card)}>
        <View className={cn("w-1.5", theme.bar)} />
        <View className="flex-1 flex-row items-start gap-4 p-4">
          <InitialsCircle
            name={member.fullName ?? "?"}
            className={theme.circle}
            textClassName={theme.text}
          />
          <View className="flex-1 gap-1.5">
            <Text className="text-xl font-semibold">
              {member.fullName ?? "Family Member"}
            </Text>
            <StatusLine member={member} />
          </View>
          <Feather
            name="chevron-right"
            size={20}
            className="mt-2 text-muted-foreground"
          />
        </View>
      </View>
    </Pressable>
  );
}

function SummaryCard({ members }: { members: FamilyMember[] }) {
  const completedCount = members.filter((m) => m.status === "completed").length;
  const concernCount = members.filter((m) => m.status === "concern").length;
  const checkedInCount = completedCount + concernCount;

  return (
    <Card className="border-0 bg-[#fcf9f5]">
      <CardContent className="flex-row items-center gap-4 pt-6">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-accent">
          <Feather name="users" size={22} className="text-accent-foreground" />
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-lg font-semibold">
            {checkedInCount} check-in{checkedInCount === 1 ? "" : "s"} today
          </Text>
          {checkedInCount > 0 ? (
            <View className="flex-row items-center gap-3">
              {completedCount > 0 ? (
                <View className="flex-row items-center gap-1">
                  <Feather
                    name="check-circle"
                    size={14}
                    className="text-emerald-600"
                  />
                  <Text className="text-sm font-medium text-emerald-700">
                    {completedCount} all good
                  </Text>
                </View>
              ) : null}
              {concernCount > 0 ? (
                <View className="flex-row items-center gap-1">
                  <Feather
                    name="alert-circle"
                    size={14}
                    className="text-amber-600"
                  />
                  <Text className="text-sm font-medium text-amber-700">
                    {concernCount} needs attention
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <Text variant="muted">No check-ins yet today</Text>
          )}
        </View>
      </CardContent>
    </Card>
  );
}

export default function FamilyScreen() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    fetchFamilyMembers()
      .then(setMembers)
      .finally(() => setLoadingMembers(false));
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="gap-5 pb-6 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-start justify-between">
          <View className="gap-1">
            <Text variant="muted">{formatFullDate(new Date())}</Text>
            <Text variant="h1" className="text-left text-3xl">
              Your Family
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/invite-family")}
            accessibilityRole="button"
            accessibilityLabel="Invite a family member"
            hitSlop={12}
            className="h-11 w-11 items-center justify-center rounded-full bg-primary active:bg-primary/90"
          >
            <Feather
              name="plus"
              size={22}
              className="text-primary-foreground"
            />
          </Pressable>
        </View>

        {loadingMembers ? (
          <ActivityIndicator />
        ) : members.length === 0 ? (
          <Card>
            <CardContent className="gap-2 pt-6">
              <Text className="text-lg font-semibold">
                No family members yet
              </Text>
              <Text variant="muted">
                Tap the + button above to invite a loved one and see their daily
                check-in status here.
              </Text>
            </CardContent>
          </Card>
        ) : (
          <>
            <SummaryCard members={members} />
            <Text className="text-lg font-semibold">Today</Text>
            <View className="gap-3">
              {members.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
