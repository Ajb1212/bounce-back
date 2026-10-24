import { Platform } from "react-native";

import { describeGoal } from "@/lib/format";
import { planReminder, type PlannedTrigger } from "@/lib/reminder-plan";
import type { Habit } from "@/types/habit";

// Not "expo-notifications" directly: see the comment in this file.
import * as Notifications from "./expo-notifications";

const CHANNEL_ID = "reminders";

// Show reminders as a banner with sound even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let channel: Promise<string | undefined> | null = null;

/**
 * Android groups notifications into channels; one should exist before asking for permission.
 * Returns the channel id to schedule with, or undefined to use the default channel.
 *
 * Expo Go on Android can't create channels (it fails with a NullPointerException), so there
 * notifications go to expo-notifications' fallback channel instead. A real build creates it normally.
 */
function ensureChannel(): Promise<string | undefined> {
  if (Platform.OS !== "android") return Promise.resolve(undefined);
  channel ??= Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Habit reminders",
    importance: Notifications.AndroidImportance.HIGH,
  }).then(
    () => CHANNEL_ID,
    (error) => {
      console.warn("Couldn't create the reminders channel; using the default one.", error);
      return undefined;
    },
  );
  return channel;
}

/** Asks for notification permission if needed. Returns whether notifications are allowed. */
export async function ensureNotificationPermission(): Promise<boolean> {
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** A channel id that doesn't exist would make Android drop the notification, so it's left out then. */
function toTriggerInput(
  planned: PlannedTrigger,
  channelId: string | undefined,
): Notifications.SchedulableNotificationTriggerInput {
  const T = Notifications.SchedulableTriggerInputTypes;
  switch (planned.type) {
    case "daily":
      return { type: T.DAILY, hour: planned.hour, minute: planned.minute, channelId };
    case "weekly":
      return { type: T.WEEKLY, weekday: planned.weekday, hour: planned.hour, minute: planned.minute, channelId };
    case "monthly":
      return { type: T.MONTHLY, day: planned.day, hour: planned.hour, minute: planned.minute, channelId };
    case "date":
      return { type: T.DATE, date: planned.date, channelId };
  }
}

/** Every notification of a habit has an identifier starting with this, so they can be found again. */
function prefix(habitId: number): string {
  return `habit-${habitId}-`;
}

async function scheduleHabit(habit: Habit, now: Date, channelId: string | undefined): Promise<void> {
  if (!habit.reminder || habit.goal.type !== "count") return;
  const planned = planReminder(habit.reminder, habit.goal.frequency, now);
  for (const [index, trigger] of planned.entries()) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${prefix(habit.id)}${index}`,
      content: { title: habit.title, body: describeGoal(habit.goal, []) },
      trigger: toTriggerInput(trigger, channelId),
    });
  }
}

async function cancelHabit(habitId: number): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ours = scheduled.filter((request) => request.identifier.startsWith(prefix(habitId)));
  await Promise.all(ours.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)));
}

/** Replaces one habit's notifications after it was created or edited. */
export async function syncHabitReminders(habit: Habit): Promise<void> {
  await cancelHabit(habit.id);
  if (!habit.reminder) return;
  if (!(await Notifications.getPermissionsAsync()).granted) return;
  await scheduleHabit(habit, new Date(), await ensureChannel());
}

/**
 * Rebuilds every notification from the saved habits. Run when the app opens:
 * it tops up the one-off reminders and removes any left over from deleted habits.
 */
export async function syncAllReminders(habits: Habit[]): Promise<void> {
  if (!(await Notifications.getPermissionsAsync()).granted) return;
  const channelId = await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  const now = new Date();
  for (const habit of habits) await scheduleHabit(habit, now, channelId);
}
