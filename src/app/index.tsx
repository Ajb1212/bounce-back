import Ionicons from "@expo/vector-icons/Ionicons";
import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "@/constants/theme";
import { useHabits } from "@/context/habits-context";
import { describeGoal } from "@/lib/format";

export default function HomeScreen() {
  const { habits, isLoading } = useHabits();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {isLoading ? null : habits.length === 0 ? (
        <Text style={styles.empty}>No habits yet. Create your first one.</Text>
      ) : (
        habits.map((habit) => (
          <Link key={habit.id} href={{ pathname: "/habit/[id]", params: { id: String(habit.id) } }} asChild>
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              accessibilityRole="button"
              accessibilityHint="Opens the habit for editing"
            >
              <View style={[styles.iconBubble, { backgroundColor: habit.color }]}>
                <Ionicons name={habit.icon} size={22} color={colors.onPrimary} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{habit.title}</Text>
                <Text style={styles.cardSubtitle}>{describeGoal(habit.goal, habits)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          </Link>
        ))
      )}

      <Link href="/new-habit" asChild>
        <Pressable style={styles.button} accessibilityRole="button">
          <Ionicons name="add" size={22} color={colors.onPrimary} />
          <Text style={styles.buttonText}>New habit</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  empty: {
    marginVertical: spacing.xl,
    fontSize: 15,
    color: colors.muted,
    textAlign: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  cardPressed: {
    opacity: 0.7,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 14,
    color: colors.muted,
  },
  button: {
    flexDirection: "row",
    gap: spacing.sm,
    height: 50,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.onPrimary,
  },
});
