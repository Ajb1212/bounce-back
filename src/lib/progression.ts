import type { Amount, Habit, Interval, TimeOfDay } from "@/types/habit";

export type Direction = "increase" | "decrease";

const MINUTES_PER_DAY = 24 * 60;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function toMinutes({ hour, minute }: TimeOfDay): number {
  return hour * 60 + minute;
}

export function fromMinutes(total: number): TimeOfDay {
  const wrapped = ((total % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return { hour: Math.floor(wrapped / 60), minute: wrapped % 60 };
}

/** Which way the current amount has to move to reach the goal, or null if it's already there. */
export function amountDirection(current: number, goal: number): Direction | null {
  if (current === goal) return null;
  return current < goal ? "increase" : "decrease";
}

/** How far the current amount is from the goal. */
export function amountGap(current: number, goal: number): number {
  return Math.abs(goal - current);
}

/**
 * Minutes from `from` to `to` moving in one direction around the clock.
 * "increase" means later: 23:00 → 01:00 is 120 min later, or 1320 min earlier.
 */
export function timeGap(from: TimeOfDay, to: TimeOfDay, direction: Direction): number {
  const diff = direction === "increase" ? toMinutes(to) - toMinutes(from) : toMinutes(from) - toMinutes(to);
  return ((diff % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

/** How many whole intervals have passed between start and date. */
export function stepsElapsed(start: Date, date: Date, { every, period }: Interval): number {
  if (date <= start) return 0;
  if (period === "month") {
    let months = (date.getFullYear() - start.getFullYear()) * 12 + (date.getMonth() - start.getMonth());
    if (date.getDate() < start.getDate()) months -= 1;
    return Math.floor(months / every);
  }
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // Rounded because a day with a daylight-saving switch is 23 or 25 hours long.
  const days = Math.round((day.getTime() - startDay.getTime()) / MS_PER_DAY);
  const daysPerStep = period === "week" ? every * 7 : every;
  return Math.floor(days / daysPerStep);
}

export type Target = { type: "count" | "stack"; amount: Amount } | { type: "time"; time: TimeOfDay };

/**
 * What the user should aim for on a given date: the current state moved toward
 * the goal by the progression, never past the goal. Without a current state, it's the goal.
 */
export function targetOn(habit: Habit, date: Date): Target {
  const { goal, current } = habit;
  const goalTarget: Target =
    goal.type === "time" ? { type: "time", time: goal.time } : { type: goal.type, amount: goal.amount };
  if (!current) return goalTarget;

  const progression = current.progression;
  const moved = progression
    ? stepsElapsed(new Date(habit.createdAt), date, progression.interval) * Math.abs(progression.change)
    : 0;
  const direction: Direction = progression && progression.change < 0 ? "decrease" : "increase";
  const sign = direction === "increase" ? 1 : -1;

  if (current.type === "time" && goal.type === "time") {
    const shift = Math.min(moved, timeGap(current.time, goal.time, direction));
    return { type: "time", time: fromMinutes(toMinutes(current.time) + sign * shift) };
  }
  if (current.type !== "time" && goal.type !== "time") {
    const shift = Math.min(moved, amountGap(current.amount.value, goal.amount.value));
    return { type: goal.type, amount: { ...current.amount, value: current.amount.value + sign * shift } };
  }
  return goalTarget;
}
