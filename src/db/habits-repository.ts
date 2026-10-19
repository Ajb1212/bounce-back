import type { SQLiteDatabase } from "expo-sqlite";

import type { Habit, IconName } from "@/types/habit";

/** A row exactly as it is stored in the habits table. */
interface HabitRow {
  id: number;
  title: string;
  color: string;
  icon: string;
  goal: string;
  current: string | null;
  created_at: string;
}

function rowToHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    title: row.title,
    color: row.color,
    icon: row.icon as IconName,
    goal: JSON.parse(row.goal),
    current: row.current ? JSON.parse(row.current) : undefined,
    createdAt: row.created_at,
  };
}

export async function getAllHabits(db: SQLiteDatabase): Promise<Habit[]> {
  const rows = await db.getAllAsync<HabitRow>("SELECT * FROM habits ORDER BY created_at");
  return rows.map(rowToHabit);
}

/** Inserts the habit and returns the id SQLite generated for it. */
export async function insertHabit(db: SQLiteDatabase, habit: Omit<Habit, "id">): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO habits (title, color, icon, goal, current, created_at)
     VALUES ($title, $color, $icon, $goal, $current, $createdAt)`,
    {
      $title: habit.title,
      $color: habit.color,
      $icon: habit.icon,
      $goal: JSON.stringify(habit.goal),
      $current: habit.current ? JSON.stringify(habit.current) : null,
      $createdAt: habit.createdAt,
    },
  );
  return result.lastInsertRowId;
}
