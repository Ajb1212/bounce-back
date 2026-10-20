import { router } from "expo-router";

import { HabitForm } from "@/components/habit/habit-form";
import { useHabits } from "@/context/habits-context";

export default function NewHabitScreen() {
  const { addHabit } = useHabits();

  return (
    <HabitForm
      submitLabel="Create habit"
      onSubmit={async (input) => {
        await addHabit(input);
        router.back();
      }}
    />
  );
}
