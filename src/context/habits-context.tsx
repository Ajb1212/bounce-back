import { useSQLiteContext } from "expo-sqlite";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { getAllHabits, insertHabit, updateHabit as saveHabitChanges } from "@/db/habits-repository";
import type { Habit, HabitInput } from "@/types/habit";

interface HabitsContextValue {
  habits: Habit[];
  isLoading: boolean;
  addHabit: (input: HabitInput) => Promise<Habit>;
  updateHabit: (id: number, input: HabitInput) => Promise<Habit>;
}

const HabitsContext = createContext<HabitsContextValue | null>(null);

/**
 * Loads the habits from SQLite once, then keeps them in memory for the screens.
 * Every change is written to the database first, so the list survives app restarts.
 */
export function HabitsProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAllHabits(db)
      .then((loaded) => {
        if (!cancelled) setHabits(loaded);
      })
      .catch((error) => console.error("Failed to load habits", error))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [db]);

  async function addHabit(input: HabitInput): Promise<Habit> {
    const unsaved = { ...input, createdAt: new Date().toISOString() };
    const id = await insertHabit(db, unsaved);
    const habit: Habit = { ...unsaved, id };
    setHabits((prev) => [...prev, habit]);
    return habit;
  }

  async function updateHabit(id: number, input: HabitInput): Promise<Habit> {
    const existing = habits.find((h) => h.id === id);
    if (!existing) throw new Error(`Habit ${id} not found`);
    const habit: Habit = { ...existing, ...input };
    await saveHabitChanges(db, habit);
    setHabits((prev) => prev.map((h) => (h.id === id ? habit : h)));
    return habit;
  }

  return <HabitsContext.Provider value={{ habits, isLoading, addHabit, updateHabit }}>{children}</HabitsContext.Provider>;
}

export function useHabits(): HabitsContextValue {
  const context = useContext(HabitsContext);
  if (!context) throw new Error("useHabits must be used inside <HabitsProvider>");
  return context;
}
