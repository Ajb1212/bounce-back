import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { HabitForm } from "@/components/habit/habit-form";
import { colors, spacing } from "@/constants/theme";
import { useHabits } from "@/context/habits-context";

/** The file name [id] makes this the screen for /habit/1, /habit/2, …; the number arrives as `id`. */
export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { habits, isLoading, updateHabit } = useHabits();
  const habit = habits.find((h) => h.id === Number(id));

  if (isLoading) return null;
  if (!habit) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>This habit no longer exists.</Text>
      </View>
    );
  }

  return (
    <HabitForm
      // The form only reads `initial` once, so a different habit needs a fresh form.
      key={habit.id}
      initial={habit}
      submitLabel="Save changes"
      onSubmit={async (input) => {
        await updateHabit(habit.id, input);
        router.back();
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  message: {
    fontSize: 15,
    color: colors.muted,
  },
});
