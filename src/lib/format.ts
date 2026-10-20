import type { Amount, Current, Frequency, Goal, Habit, Interval, Progression } from "@/types/habit";

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function formatAmount({ value, unit }: Amount): string {
  if (unit === "minutes") return `${value} min`;
  return plural(value, "time");
}

/** "every day", "every 2 weeks" */
export function formatInterval({ every, period }: Interval): string {
  if (every === 1) return `every ${period}`;
  return `every ${every} ${period}s`;
}

export function formatFrequency(frequency: Frequency): string {
  switch (frequency.kind) {
    case "daily":
      return "every day";
    case "everyNDays":
      return `every ${frequency.days} days`;
    case "timesPerWeek":
      return `${plural(frequency.times, "time")} per week`;
    case "timesPerMonth":
      return `${plural(frequency.times, "time")} per month`;
    case "timesInDays":
      return `${plural(frequency.times, "time")} in ${frequency.days} days`;
  }
}

/** "+1 time per week", "-1 day between times" */
function formatFrequencyChange(change: number, frequency: Frequency): string {
  const sign = change >= 0 ? "+" : "-";
  const size = Math.abs(change);
  switch (frequency.kind) {
    case "daily":
      return "";
    case "everyNDays":
      return `${sign}${plural(size, "day")} between times`;
    case "timesPerWeek":
      return `${sign}${plural(size, "time")} per week`;
    case "timesPerMonth":
      return `${sign}${plural(size, "time")} per month`;
    case "timesInDays":
      return `${sign}${plural(size, "time")} in ${frequency.days} days`;
  }
}

export function formatProgression(progression: Progression, amount: Amount, frequency: Frequency | null): string {
  const { change, target, interval } = progression;
  const what =
    target === "frequency" && frequency
      ? formatFrequencyChange(change, frequency)
      : `${change >= 0 ? "+" : "-"}${formatAmount({ ...amount, value: Math.abs(change) })}`;
  return `${what} ${formatInterval(interval)}`;
}

/** "30 min, 3 times per week". A plain "1 time" adds nothing, so then it's just "3 times per week". */
function amountWithFrequency(amount: Amount, frequency: Frequency): string {
  if (amount.unit === "times" && amount.value === 1) return formatFrequency(frequency);
  return `${formatAmount(amount)}, ${formatFrequency(frequency)}`;
}

export function describeGoal(goal: Goal, habits: Habit[]): string {
  switch (goal.type) {
    case "count":
      return amountWithFrequency(goal.amount, goal.frequency);
    case "stack": {
      const anchor = habits.find((h) => h.id === goal.afterHabitId);
      return `${formatAmount(goal.amount)} after "${anchor?.title ?? "a deleted habit"}"`;
    }
  }
}

export function describeCurrent(current: Current): string {
  const frequency = current.type === "count" ? current.frequency : null;
  let text = frequency ? amountWithFrequency(current.amount, frequency) : formatAmount(current.amount);
  if (current.progression) text += `; ${formatProgression(current.progression, current.amount, frequency)}`;
  return text;
}
