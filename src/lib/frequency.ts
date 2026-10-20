import type { Frequency } from "@/types/habit";

/**
 * The number a progression can change: times per week/month/in N days, or the N in "every N days".
 * "Every day" has no number, so it returns null.
 */
export function frequencyCount(frequency: Frequency): number | null {
  switch (frequency.kind) {
    case "daily":
      return null;
    case "everyNDays":
      return frequency.days;
    case "timesPerWeek":
    case "timesPerMonth":
    case "timesInDays":
      return frequency.times;
  }
}

/** The same frequency with its number replaced. */
export function withFrequencyCount(frequency: Frequency, count: number): Frequency {
  switch (frequency.kind) {
    case "daily":
      return frequency;
    case "everyNDays":
      return { ...frequency, days: count };
    case "timesPerWeek":
    case "timesPerMonth":
    case "timesInDays":
      return { ...frequency, times: count };
  }
}
