import type { Amount, Current, Goal, GoalType, Interval, TimeOfDay } from "@/types/habit";

/**
 * The form keeps every field for every goal type, so switching type back and forth
 * doesn't lose what the user typed. The build functions below pick the fields that matter.
 */
export interface TargetDraft {
  amount: Amount;
  time: TimeOfDay;
  interval: Interval;
}

export interface ProgressionDraft {
  direction: "increase" | "decrease";
  value: number;
  interval: Interval;
}

export const DEFAULT_TARGET: TargetDraft = {
  amount: { value: 1, unit: "times" },
  time: { hour: 8, minute: 0 },
  interval: { every: 1, period: "day" },
};

export const DEFAULT_PROGRESSION: ProgressionDraft = {
  direction: "increase",
  value: 1,
  interval: { every: 7, period: "day" },
};

export function buildGoal(type: GoalType, draft: TargetDraft, afterHabitId: string | null): Goal | null {
  switch (type) {
    case "count":
      return { type, amount: draft.amount, interval: draft.interval };
    case "time":
      return { type, time: draft.time, interval: draft.interval };
    case "stack":
      if (!afterHabitId) return null;
      return { type, afterHabitId, amount: draft.amount };
  }
}

/** The current state always uses the goal's type and unit. */
export function buildCurrent(goal: Goal, draft: TargetDraft, progression: ProgressionDraft | null): Current {
  const built = progression
    ? {
        change: progression.direction === "increase" ? progression.value : -progression.value,
        interval: progression.interval,
      }
    : undefined;

  switch (goal.type) {
    case "count":
      return {
        type: "count",
        amount: { value: draft.amount.value, unit: goal.amount.unit },
        interval: draft.interval,
        progression: built,
      };
    case "time":
      return { type: "time", time: draft.time, interval: draft.interval, progression: built };
    case "stack":
      return {
        type: "stack",
        amount: { value: draft.amount.value, unit: goal.amount.unit },
        progression: built,
      };
  }
}
