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
  reminder: string | null;
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
    reminder: row.reminder ? JSON.parse(row.reminder) : undefined,
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
    `INSERT INTO habits (title, color, icon, goal, current, reminder, created_at)
     VALUES ($title, $color, $icon, $goal, $current, $reminder, $createdAt)`,
    {
      $title: habit.title,
      $color: habit.color,
      $icon: habit.icon,
      $goal: JSON.stringify(habit.goal),
      $current: habit.current ? JSON.stringify(habit.current) : null,
      $reminder: habit.reminder ? JSON.stringify(habit.reminder) : null,
      $createdAt: habit.createdAt,
    },
  );
  return result.lastInsertRowId;
}

/** Saves the edited fields. id and created_at never change. */
export async function updateHabit(db: SQLiteDatabase, habit: Habit): Promise<void> {
  await db.runAsync(
    `UPDATE habits
     SET title = $title, color = $color, icon = $icon, goal = $goal, current = $current, reminder = $reminder
     WHERE id = $id`,
    {
      $id: habit.id,
      $title: habit.title,
      $color: habit.color,
      $icon: habit.icon,
      $goal: JSON.stringify(habit.goal),
      $current: habit.current ? JSON.stringify(habit.current) : null,
      $reminder: habit.reminder ? JSON.stringify(habit.reminder) : null,
    },
  );
}
