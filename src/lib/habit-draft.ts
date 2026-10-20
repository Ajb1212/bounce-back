import { amountDirection, amountGap, timeGap, type Direction } from "@/lib/progression";
import type { Amount, Current, Goal, GoalType, Habit, Interval, TimeOfDay } from "@/types/habit";

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
  /** Only used for time goals. For amounts the direction follows from current vs goal. */
  timeDirection: Direction;
  value: number;
  interval: Interval;
}

export const DEFAULT_TARGET: TargetDraft = {
  amount: { value: 1, unit: "times" },
  time: { hour: 8, minute: 0 },
  interval: { every: 1, period: "day" },
};

export const DEFAULT_PROGRESSION: ProgressionDraft = {
  timeDirection: "decrease",
  value: 1,
  interval: { every: 7, period: "day" },
};

/** Everything the habit form edits about the goal and current state. */
export interface HabitDrafts {
  goalType: GoalType;
  goal: TargetDraft;
  afterHabitId: number | null;
  hasCurrent: boolean;
  current: TargetDraft;
  hasProgression: boolean;
  progression: ProgressionDraft;
}

export const NEW_HABIT_DRAFTS: HabitDrafts = {
  goalType: "count",
  goal: DEFAULT_TARGET,
  afterHabitId: null,
  hasCurrent: false,
  current: DEFAULT_TARGET,
  hasProgression: false,
  progression: DEFAULT_PROGRESSION,
};

/** The reverse of buildGoal and buildCurrent: turns a saved habit back into form values. */
export function draftsFromHabit({ goal, current }: Habit): HabitDrafts {
  const goalDraft: TargetDraft = {
    ...DEFAULT_TARGET,
    ...(goal.type === "time" ? { time: goal.time } : { amount: goal.amount }),
    ...(goal.type === "stack" ? {} : { interval: goal.interval }),
  };
  const currentDraft: TargetDraft = current
    ? { ...goalDraft, ...(current.type === "time" ? { time: current.time } : { amount: current.amount }) }
    : goalDraft;
  const progression = current?.progression;

  return {
    goalType: goal.type,
    goal: goalDraft,
    afterHabitId: goal.type === "stack" ? goal.afterHabitId : null,
    hasCurrent: current !== undefined,
    current: currentDraft,
    hasProgression: progression !== undefined,
    progression: progression
      ? {
          timeDirection: progression.change >= 0 ? "increase" : "decrease",
          value: Math.abs(progression.change),
          interval: progression.interval,
        }
      : DEFAULT_PROGRESSION,
  };
}

export interface ProgressionBounds {
  /** null when current already equals the goal, so there's nothing to progress. */
  direction: Direction | null;
  /** The largest useful step: anything bigger would jump past the goal. */
  gap: number;
}

export function progressionBounds(
  type: GoalType,
  goal: TargetDraft,
  current: TargetDraft,
  timeDirection: Direction,
): ProgressionBounds {
  if (type === "time") {
    const gap = timeGap(current.time, goal.time, timeDirection);
    return { direction: gap === 0 ? null : timeDirection, gap };
  }
  return {
    direction: amountDirection(current.amount.value, goal.amount.value),
    gap: amountGap(current.amount.value, goal.amount.value),
  };
}

export function buildGoal(type: GoalType, draft: TargetDraft, afterHabitId: number | null): Goal | null {
  switch (type) {
    case "count":
      return { type, amount: draft.amount, interval: draft.interval };
    case "time":
      return { type, time: draft.time, interval: draft.interval };
    case "stack":
      if (afterHabitId === null) return null;
      return { type, afterHabitId, amount: draft.amount };
  }
}

/** The current state always uses the goal's type, unit and interval. */
export function buildCurrent(
  goal: Goal,
  goalDraft: TargetDraft,
  draft: TargetDraft,
  progression: ProgressionDraft | null,
): Current {
  const { direction, gap } = progressionBounds(goal.type, goalDraft, draft, progression?.timeDirection ?? "increase");
  const built =
    progression && direction
      ? {
          change: (direction === "increase" ? 1 : -1) * Math.min(progression.value, gap),
          interval: progression.interval,
        }
      : undefined;

  switch (goal.type) {
    case "count":
    case "stack":
      return {
        type: goal.type,
        amount: { value: draft.amount.value, unit: goal.amount.unit },
        progression: built,
      };
    case "time":
      return { type: "time", time: draft.time, progression: built };
  }
}
