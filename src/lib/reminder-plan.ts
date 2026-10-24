import type { Frequency, Reminder, ReminderSlot, TimeOfDay, Weekday } from "@/types/habit";

/**
 * A notification to schedule. The repeating kinds keep firing on their own;
 * "date" fires once, so those are planned a few at a time and topped up when the app opens.
 */
export type PlannedTrigger =
  | { type: "daily"; hour: number; minute: number }
  // expo-notifications counts weekdays 1 = Sunday … 7 = Saturday.
  | { type: "weekly"; weekday: number; hour: number; minute: number }
  | { type: "monthly"; day: number; hour: number; minute: number }
  | { type: "date"; date: Date };

/**
 * How many one-off notifications to plan ahead per habit.
 * iOS keeps at most 64 pending notifications for the whole app, so this stays small.
 */
export const ONE_OFF_LIMIT = 5;

/** Repeating monthly triggers misbehave for days a month may not have, so 29–31 are planned as dates. */
const LAST_SAFE_MONTH_DAY = 28;

export function toLocalDateString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(day: Date, days: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + days);
}

function at(day: Date, { hour, minute }: TimeOfDay): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Whole days from a to b; rounded because a daylight-saving day is 23 or 25 hours long. */
function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / (24 * 60 * 60 * 1000));
}

function bySlot(a: ReminderSlot, b: ReminderSlot): number {
  return a.day - b.day || a.time.hour - b.time.hour || a.time.minute - b.time.minute;
}

function isoToExpoWeekday(day: Weekday): number {
  return (day % 7) + 1; // Monday 1 → 2 … Sunday 7 → 1
}

/** The next dates of slots repeating every `cycleDays` days from `start`, after `now`. */
function upcomingCycleDates(start: Date, cycleDays: number, slots: ReminderSlot[], now: Date): Date[] {
  const sorted = [...slots].sort(bySlot);
  const dates: Date[] = [];
  let cycle = Math.max(0, Math.floor(daysBetween(start, now) / cycleDays));
  // A cycle always contains every slot, so a few cycles are enough to fill the limit.
  for (let checked = 0; dates.length < ONE_OFF_LIMIT && checked < ONE_OFF_LIMIT + 2; checked++, cycle++) {
    for (const slot of sorted) {
      const day = Math.min(slot.day, cycleDays);
      const date = at(addDays(start, cycle * cycleDays + day - 1), slot.time);
      if (date > now && dates.length < ONE_OFF_LIMIT) dates.push(date);
    }
  }
  return dates;
}

/** Days 29–31: in shorter months the reminder comes on the month's last day instead. */
function upcomingLateMonthDates(slots: ReminderSlot[], now: Date): Date[] {
  const dates: Date[] = [];
  for (let offset = 0; offset < 12; offset++) {
    const year = now.getFullYear();
    const month = now.getMonth() + offset;
    const lastDay = new Date(year, month + 1, 0).getDate();
    for (const slot of slots) {
      const date = at(new Date(year, month, Math.min(slot.day, lastDay)), slot.time);
      if (date > now) dates.push(date);
    }
  }
  return dates.sort((a, b) => a.getTime() - b.getTime()).slice(0, ONE_OFF_LIMIT);
}

/** Turns a habit's reminder into the notifications to schedule from `now`. */
export function planReminder(reminder: Reminder, frequency: Frequency, now: Date): PlannedTrigger[] {
  switch (reminder.kind) {
    case "daily":
      return [{ type: "daily", ...reminder.time }];

    case "timesPerWeek":
      return reminder.days.map((slot) => ({
        type: "weekly",
        weekday: isoToExpoWeekday(slot.day as Weekday),
        ...slot.time,
      }));

    case "timesPerMonth": {
      const repeating: PlannedTrigger[] = reminder.days
        .filter((slot) => slot.day <= LAST_SAFE_MONTH_DAY)
        .map((slot) => ({ type: "monthly", day: slot.day, ...slot.time }));
      const late = reminder.days.filter((slot) => slot.day > LAST_SAFE_MONTH_DAY);
      return [...repeating, ...upcomingLateMonthDates(late, now).map((date) => ({ type: "date" as const, date }))];
    }

    case "everyNDays": {
      if (frequency.kind !== "everyNDays") return [];
      const slots = [{ day: 1, time: reminder.time }];
      return upcomingCycleDates(parseLocalDate(reminder.startDate), frequency.days, slots, now).map((date) => ({
        type: "date",
        date,
      }));
    }

    case "timesInDays": {
      if (frequency.kind !== "timesInDays") return [];
      return upcomingCycleDates(parseLocalDate(reminder.startDate), frequency.days, reminder.slots, now).map(
        (date) => ({ type: "date", date }),
      );
    }
  }
}
