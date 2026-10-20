import { frequencyCount, withFrequencyCount } from "@/lib/frequency";
import type { Amount, Frequency, Habit, Interval } from "@/types/habit";

export type Direction = "increase" | "decrease";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Which way the current number has to move to reach the goal, or null if it's already there. */
export function amountDirection(current: number, goal: number): Direction | null {
  if (current === goal) return null;
  return current < goal ? "increase" : "decrease";
}

/** How far the current number is from the goal. */
export function amountGap(current: number, goal: number): number {
  return Math.abs(goal - current);
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

/** Moves `from` toward `to` by `moved`, never past `to`. */
function moveToward(from: number, to: number, moved: number): number {
  const shift = Math.min(moved, amountGap(from, to));
  return from < to ? from + shift : from - shift;
}

/** `frequency` is null for stacked habits: they follow the other habit's timing. */
export interface Target {
  amount: Amount;
  frequency: Frequency | null;
}

/**
 * What the user should aim for on a given date: the current state moved toward
 * the goal by the progression, never past the goal. Without a current state, it's the goal.
 */
export function targetOn(habit: Habit, date: Date): Target {
  const { goal, current } = habit;
  const goalFrequency = goal.type === "count" ? goal.frequency : null;
  if (!current) return { amount: goal.amount, frequency: goalFrequency };

  const amount = current.amount;
  const frequency = current.type === "count" ? current.frequency : null;
  const progression = current.progression;
  if (!progression) return { amount, frequency };

  const moved =
    stepsElapsed(new Date(habit.createdAt), date, progression.interval) * Math.abs(progression.change);

  if (progression.target === "amount") {
    return { amount: { ...amount, value: moveToward(amount.value, goal.amount.value, moved) }, frequency };
  }

  const currentCount = frequency ? frequencyCount(frequency) : null;
  const goalCount = goalFrequency ? frequencyCount(goalFrequency) : null;
  if (!frequency || currentCount === null || goalCount === null) return { amount, frequency };
  return { amount, frequency: withFrequencyCount(frequency, moveToward(currentCount, goalCount, moved)) };
}
