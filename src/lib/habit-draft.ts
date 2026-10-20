import { frequencyCount, withFrequencyCount } from "@/lib/frequency";
import { amountDirection, amountGap, type Direction } from "@/lib/progression";
import type { Amount, Current, Frequency, FrequencyKind, Goal, GoalType, Habit, Interval, Progression } from "@/types/habit";

/**
 * The form keeps a number for every frequency kind, so switching kind back and forth
 * doesn't lose what the user typed. frequencyFromDraft picks the ones that matter.
 */
export interface FrequencyDraft {
  kind: FrequencyKind;
  everyDays: number;
  perWeek: number;
  perMonth: number;
  times: number;
  inDays: number;
}

export interface TargetDraft {
  amount: Amount;
  frequency: FrequencyDraft;
}

export type ProgressionTarget = Progression["target"];

export interface ProgressionDraft {
  target: ProgressionTarget;
  value: number;
  interval: Interval;
}

const DEFAULT_FREQUENCY: FrequencyDraft = {
  kind: "daily",
  everyDays: 2,
  perWeek: 3,
  perMonth: 10,
  times: 12,
  inDays: 16,
};

const DEFAULT_TARGET: TargetDraft = {
  amount: { value: 1, unit: "times" },
  frequency: DEFAULT_FREQUENCY,
};

const DEFAULT_PROGRESSION: ProgressionDraft = {
  target: "amount",
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

export function frequencyFromDraft(draft: FrequencyDraft): Frequency {
  switch (draft.kind) {
    case "daily":
      return { kind: "daily" };
    case "everyNDays":
      return { kind: "everyNDays", days: draft.everyDays };
    case "timesPerWeek":
      return { kind: "timesPerWeek", times: draft.perWeek };
    case "timesPerMonth":
      return { kind: "timesPerMonth", times: draft.perMonth };
    case "timesInDays":
      return { kind: "timesInDays", times: draft.times, days: draft.inDays };
  }
}

function draftFromFrequency(frequency: Frequency): FrequencyDraft {
  const draft: FrequencyDraft = { ...DEFAULT_FREQUENCY, kind: frequency.kind };
  switch (frequency.kind) {
    case "everyNDays":
      return { ...draft, everyDays: frequency.days };
    case "timesPerWeek":
      return { ...draft, perWeek: frequency.times };
    case "timesPerMonth":
      return { ...draft, perMonth: frequency.times };
    case "timesInDays":
      return { ...draft, times: frequency.times, inDays: frequency.days };
    case "daily":
      return draft;
  }
}

/** The current state always has the goal's frequency kind; only its number comes from the current draft. */
function currentFrequency(goal: Frequency, current: FrequencyDraft): Frequency {
  const count = frequencyCount(frequencyFromDraft({ ...current, kind: goal.kind }));
  return count === null ? goal : withFrequencyCount(goal, count);
}

/** The reverse of buildGoal and buildCurrent: turns a saved habit back into form values. */
export function draftsFromHabit({ goal, current }: Habit): HabitDrafts {
  const goalDraft: TargetDraft = {
    amount: goal.amount,
    frequency: goal.type === "count" ? draftFromFrequency(goal.frequency) : DEFAULT_FREQUENCY,
  };
  const currentDraft: TargetDraft = current
    ? {
        amount: current.amount,
        frequency: current.type === "count" ? draftFromFrequency(current.frequency) : goalDraft.frequency,
      }
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
      ? { target: progression.target, value: Math.abs(progression.change), interval: progression.interval }
      : DEFAULT_PROGRESSION,
  };
}

export interface Bounds {
  /** null when current already equals the goal, so there's nothing to progress. */
  direction: Direction | null;
  /** The largest useful step: anything bigger would jump past the goal. */
  gap: number;
}

export type ProgressionBounds = Record<ProgressionTarget, Bounds>;

const AT_GOAL: Bounds = { direction: null, gap: 0 };

function bounds(current: number, goal: number): Bounds {
  return { direction: amountDirection(current, goal), gap: amountGap(current, goal) };
}

/** How far current is from the goal, for the amount and for the frequency's number. */
export function progressionBounds(type: GoalType, goal: TargetDraft, current: TargetDraft): ProgressionBounds {
  const amount = bounds(current.amount.value, goal.amount.value);
  if (type === "stack") return { amount, frequency: AT_GOAL };

  const goalFrequency = frequencyFromDraft(goal.frequency);
  const goalCount = frequencyCount(goalFrequency);
  const currentCount = frequencyCount(currentFrequency(goalFrequency, current.frequency));
  return {
    amount,
    frequency: goalCount === null || currentCount === null ? AT_GOAL : bounds(currentCount, goalCount),
  };
}

/** The target the user picked, or the other one if the picked one is already at the goal. */
export function effectiveTarget(draft: ProgressionDraft, b: ProgressionBounds): ProgressionTarget | null {
  if (b[draft.target].direction) return draft.target;
  const other: ProgressionTarget = draft.target === "amount" ? "frequency" : "amount";
  return b[other].direction ? other : null;
}

export function buildGoal(type: GoalType, draft: TargetDraft, afterHabitId: number | null): Goal | null {
  switch (type) {
    case "count":
      return { type, amount: draft.amount, frequency: frequencyFromDraft(draft.frequency) };
    case "stack":
      if (afterHabitId === null) return null;
      return { type, afterHabitId, amount: draft.amount };
  }
}

/** The current state always uses the goal's type, unit and frequency kind. */
export function buildCurrent(
  goal: Goal,
  goalDraft: TargetDraft,
  draft: TargetDraft,
  progression: ProgressionDraft | null,
): Current {
  const b = progressionBounds(goal.type, goalDraft, draft);
  const target = progression ? effectiveTarget(progression, b) : null;
  const built: Progression | undefined =
    progression && target
      ? {
          target,
          change: (b[target].direction === "increase" ? 1 : -1) * Math.min(progression.value, b[target].gap),
          interval: progression.interval,
        }
      : undefined;
  const amount: Amount = { value: draft.amount.value, unit: goal.amount.unit };

  switch (goal.type) {
    case "count":
      return { type: "count", amount, frequency: currentFrequency(goal.frequency, draft.frequency), progression: built };
    case "stack":
      return { type: "stack", amount, progression: built };
  }
}
