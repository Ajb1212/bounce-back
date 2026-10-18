import type Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";

export type IconName = ComponentProps<typeof Ionicons>["name"];

export type GoalType = "count" | "time" | "stack";
export type Unit = "times" | "minutes";
export type Period = "day" | "week" | "month";

/** A repeating window: { every: 1, period: "day" } = per day, { every: 16, period: "day" } = every 16 days. */
export interface Interval {
  every: number;
  period: Period;
}

/** How much of the habit: 4 times, or 30 minutes. */
export interface Amount {
  value: number;
  unit: Unit;
}

export interface TimeOfDay {
  hour: number; // 0-23
  minute: number; // 0-59
}

export type Goal =
  | { type: "count"; amount: Amount; interval: Interval }
  | { type: "time"; time: TimeOfDay; interval: Interval }
  // A stacked habit happens right after another habit, so it inherits that habit's repetition.
  | { type: "stack"; afterHabitId: string; amount: Amount };

/**
 * A gradual change applied to the current state, e.g. +1 time every 14 days.
 * `change` is in the goal's unit, or in minutes for time goals. Negative means decrease.
 */
export interface Progression {
  change: number;
  interval: Interval;
}

/** Where the user is today. Always the same type as the goal. */
export type Current =
  | { type: "count"; amount: Amount; interval: Interval; progression?: Progression }
  | { type: "time"; time: TimeOfDay; interval: Interval; progression?: Progression }
  | { type: "stack"; amount: Amount; progression?: Progression };

export interface Habit {
  id: string;
  title: string;
  color: string;
  icon: IconName;
  goal: Goal;
  current?: Current;
  createdAt: string; // ISO date
}
