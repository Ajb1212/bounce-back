import type { Amount, Current, Goal, Habit, Interval, Progression, TimeOfDay, Unit } from "@/types/habit";

export function formatAmount({ value, unit }: Amount): string {
  if (unit === "minutes") return `${value} min`;
  return `${value} ${value === 1 ? "time" : "times"}`;
}

export function formatTime({ hour, minute }: TimeOfDay): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** style "per" reads "per day", style "every" reads "every day"; both read "every 2 days" for more than one. */
export function formatInterval({ every, period }: Interval, style: "per" | "every"): string {
  if (every === 1) return `${style} ${period}`;
  return `every ${every} ${period}s`;
}

export function formatProgression({ change, interval }: Progression, unit: Unit): string {
  const sign = change >= 0 ? "+" : "-";
  return `${sign}${formatAmount({ value: Math.abs(change), unit })} ${formatInterval(interval, "every")}`;
}

export function describeGoal(goal: Goal, habits: Habit[]): string {
  switch (goal.type) {
    case "count":
      return `${formatAmount(goal.amount)} ${formatInterval(goal.interval, "per")}`;
    case "time":
      return `at ${formatTime(goal.time)} ${formatInterval(goal.interval, "every")}`;
    case "stack": {
      const anchor = habits.find((h) => h.id === goal.afterHabitId);
      return `${formatAmount(goal.amount)} after "${anchor?.title ?? "a deleted habit"}"`;
    }
  }
}

export function describeCurrent(current: Current): string {
  let text: string;
  let progressionUnit: Unit;
  switch (current.type) {
    case "count":
      text = `${formatAmount(current.amount)} ${formatInterval(current.interval, "per")}`;
      progressionUnit = current.amount.unit;
      break;
    case "time":
      text = `at ${formatTime(current.time)} ${formatInterval(current.interval, "every")}`;
      progressionUnit = "minutes";
      break;
    case "stack":
      text = formatAmount(current.amount);
      progressionUnit = current.amount.unit;
      break;
  }
  if (current.progression) {
    text += `, ${formatProgression(current.progression, progressionUnit)}`;
  }
  return text;
}
