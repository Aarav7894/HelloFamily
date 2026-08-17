// Deep-imports specific expo-notifications submodules instead of the
// package's root index, because importing the root eagerly resolves
// PushTokenManager (used for remote push registration, which this app
// doesn't use) and that native module fails to resolve in this dev-client
// build. None of the local-scheduling pieces below depend on it.

import { cancelScheduledNotificationAsync } from "expo-notifications/build/cancelScheduledNotificationAsync";
import { AndroidImportance } from "expo-notifications/build/NotificationChannelManager.types";
import {
  getPermissionsAsync,
  requestPermissionsAsync,
} from "expo-notifications/build/NotificationPermissions";
import { SchedulableTriggerInputTypes } from "expo-notifications/build/Notifications.types";
import { setNotificationHandler } from "expo-notifications/build/NotificationsHandler";
import { scheduleNotificationAsync } from "expo-notifications/build/scheduleNotificationAsync";
import { setNotificationChannelAsync } from "expo-notifications/build/setNotificationChannelAsync";
import { Platform } from "react-native";

const DAILY_REMINDER_NOTIFICATION_ID = "daily-check-in-reminder";

setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensurePermissions(): Promise<boolean> {
  const current = await getPermissionsAsync();
  if (current.granted) return true;

  const requested = await requestPermissionsAsync();
  return requested.granted;
}

function parseTime(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(":").map(Number);
  return { hour, minute };
}

export async function syncDailyCheckInReminder(
  reminderEnabled: boolean,
  reminderTime: string,
): Promise<void> {
  if (Platform.OS === "android") {
    await setNotificationChannelAsync("default", {
      name: "Daily reminders",
      importance: AndroidImportance.DEFAULT,
    });
  }

  await cancelScheduledNotificationAsync(DAILY_REMINDER_NOTIFICATION_ID);

  if (!reminderEnabled) return;

  const granted = await ensurePermissions();
  if (!granted) return;

  const { hour, minute } = parseTime(reminderTime);
  await scheduleNotificationAsync({
    identifier: DAILY_REMINDER_NOTIFICATION_ID,
    content: {
      title: "Daily Check-In",
      body: "Let your family know how you're doing today.",
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}
