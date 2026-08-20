import {
  AndroidImportance,
  cancelScheduledNotificationAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  SchedulableTriggerInputTypes,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
} from "expo-notifications";
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
