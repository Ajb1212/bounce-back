import { createContext, useContext, useState, type ReactNode } from "react";

import type { Habit } from "@/types/habit";

type NewHabit = Omit<Habit, "id" | "createdAt">;

interface HabitsContextValue {
  habits: Habit[];
  addHabit: (habit: NewHabit) => Habit;
}

const HabitsContext = createContext<HabitsContextValue | null>(null);

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Holds the habit list in memory for now, so it resets when the app reloads.
 * Saving to the device comes in a later step.
 */
export function HabitsProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);

  function addHabit(input: NewHabit): Habit {
    const habit: Habit = { ...input, id: makeId(), createdAt: new Date().toISOString() };
    setHabits((prev) => [...prev, habit]);
    return habit;
  }

  return <HabitsContext.Provider value={{ habits, addHabit }}>{children}</HabitsContext.Provider>;
}

export function useHabits(): HabitsContextValue {
  const context = useContext(HabitsContext);
  if (!context) throw new Error("useHabits must be used inside <HabitsProvider>");
  return context;
}
