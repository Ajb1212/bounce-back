import type { Habit } from "@/types/habit";

/** True if `habit` is `targetId`, or stacks after it directly or through a chain of other habits. */
function leadsTo(habit: Habit, targetId: number, habits: Habit[]): boolean {
  const seen = new Set<number>();
  let next: Habit | undefined = habit;
  while (next && !seen.has(next.id)) {
    if (next.id === targetId) return true;
    seen.add(next.id);
    const goal: Habit["goal"] = next.goal;
    next = goal.type === "stack" ? habits.find((h) => h.id === goal.afterHabitId) : undefined;
  }
  return false;
}

/**
 * The habits a habit can be stacked after. When editing, that excludes the habit itself
 * and every habit stacked after it, because either would make a loop.
 */
export function stackCandidates(habits: Habit[], editingId: number | null): Habit[] {
  if (editingId === null) return habits;
  return habits.filter((h) => !leadsTo(h, editingId, habits));
}
