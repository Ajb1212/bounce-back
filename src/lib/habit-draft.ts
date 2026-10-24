import { frequencyCount, withFrequencyCount } from "@/lib/frequency";
import { amountDirection, amountGap, type Direction } from "@/lib/progression";
import { toLocalDateString } from "@/lib/reminder-plan";
import type {
  Amount,
  Current,
  Frequency,
  FrequencyKind,
  Goal,
  GoalType,
  Habit,
  Interval,
  Progression,
  Reminder,
  ReminderSlot,
  TimeOfDay,
} from "@/types/habit";

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

/** Like the frequency draft, it keeps the values of every kind so switching kind loses nothing. */
export interface ReminderDraft {
  enabled: boolean;
  /** Used by every day and every N days, and as the starting time for newly picked days. */
  time: TimeOfDay;
  weekDays: ReminderSlot[];
  monthDays: ReminderSlot[];
  cycleSlots: ReminderSlot[];
  /** Kept from the saved habit so editing doesn't restart the cycle; null = starts today. */
  startDate: string | null;
}

const DEFAULT_TIME: TimeOfDay = { hour: 20, minute: 0 };

const DEFAULT_REMINDER: ReminderDraft = {
  enabled: false,
  time: DEFAULT_TIME,
  weekDays: [],
  monthDays: [],
  cycleSlots: [{ day: 1, time: DEFAULT_TIME }],
  startDate: null,
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
  reminder: ReminderDraft;
}

export const NEW_HABIT_DRAFTS: HabitDrafts = {
  goalType: "count",
  goal: DEFAULT_TARGET,
  afterHabitId: null,
  hasCurrent: false,
  current: DEFAULT_TARGET,
  hasProgression: false,
  progression: DEFAULT_PROGRESSION,
  reminder: DEFAULT_REMINDER,
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
function reminderDraftFrom(reminder: Reminder | undefined): ReminderDraft {
  if (!reminder) return DEFAULT_REMINDER;
  const draft: ReminderDraft = { ...DEFAULT_REMINDER, enabled: true };
  switch (reminder.kind) {
    case "daily":
      return { ...draft, time: reminder.time };
    case "timesPerWeek":
      return { ...draft, weekDays: reminder.days };
    case "timesPerMonth":
      return { ...draft, monthDays: reminder.days };
    case "everyNDays":
      return { ...draft, time: reminder.time, startDate: reminder.startDate };
    case "timesInDays":
      return { ...draft, cycleSlots: reminder.slots, startDate: reminder.startDate };
  }
}

export function draftsFromHabit({ goal, current, reminder }: Habit): HabitDrafts {
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
    reminder: reminderDraftFrom(reminder),
  };
}

export type ReminderResult = { reminder?: Reminder; error?: undefined } | { reminder?: undefined; error: string };

/**
 * Turns the reminder fields into the saved reminder, matching the goal's frequency.
 * Returns an error message instead when reminders are on but incomplete.
 */
export function buildReminder(goal: Goal | null, draft: ReminderDraft, today: Date): ReminderResult {
  if (!draft.enabled || goal?.type !== "count") return {};
  const startDate = draft.startDate ?? toLocalDateString(today);
  const frequency = goal.frequency;

  switch (frequency.kind) {
    case "daily":
      return { reminder: { kind: "daily", time: draft.time } };
    case "timesPerWeek":
      if (draft.weekDays.length === 0) return { error: "Pick at least one day for reminders." };
      return { reminder: { kind: "timesPerWeek", days: [...draft.weekDays].sort((a, b) => a.day - b.day) } };
    case "timesPerMonth":
      if (draft.monthDays.length === 0) return { error: "Pick at least one day for reminders." };
      return { reminder: { kind: "timesPerMonth", days: [...draft.monthDays].sort((a, b) => a.day - b.day) } };
    case "everyNDays":
      return { reminder: { kind: "everyNDays", time: draft.time, startDate } };
    case "timesInDays": {
      // The cycle may have been shortened after the slots were picked.
      const slots = draft.cycleSlots
        .map((slot) => ({ ...slot, day: Math.min(slot.day, frequency.days) }))
        .sort((a, b) => a.day - b.day || a.time.hour - b.time.hour || a.time.minute - b.time.minute);
      if (slots.length === 0) return { error: "Add at least one reminder." };
      return { reminder: { kind: "timesInDays", slots, startDate } };
    }
  }
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
