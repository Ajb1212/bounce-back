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

/** For time goals, e.g. "30 min earlier every 5 days". */
export function formatTimeProgression({ change, interval }: Progression): string {
  const direction = change >= 0 ? "later" : "earlier";
  return `${formatAmount({ value: Math.abs(change), unit: "minutes" })} ${direction} ${formatInterval(interval, "every")}`;
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

/** The current state repeats on the goal's interval, so the goal is needed to describe it. */
export function describeCurrent(current: Current, goal: Goal): string {
  const progression = current.progression;
  switch (current.type) {
    case "time": {
      let text = `at ${formatTime(current.time)}`;
      if (goal.type === "time") text += ` ${formatInterval(goal.interval, "every")}`;
      return progression ? `${text}, ${formatTimeProgression(progression)}` : text;
    }
    case "count":
    case "stack": {
      let text = formatAmount(current.amount);
      if (goal.type === "count") text += ` ${formatInterval(goal.interval, "per")}`;
      return progression ? `${text}, ${formatProgression(progression, current.amount.unit)}` : text;
    }
  }
}
