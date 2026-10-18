import { router } from "expo-router";
import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { ChipGroup } from "@/components/form/chip-group";
import { ColorPicker } from "@/components/form/color-picker";
import { Field } from "@/components/form/field";
import { IconPicker } from "@/components/form/icon-picker";
import { ProgressionFields } from "@/components/habit/progression-fields";
import { TargetFields } from "@/components/habit/target-fields";
import { HABIT_COLORS, HABIT_ICONS } from "@/constants/habit-options";
import { colors, radius, spacing } from "@/constants/theme";
import { useHabits } from "@/context/habits-context";
import { describeCurrent, describeGoal } from "@/lib/format";
import {
  buildCurrent,
  buildGoal,
  DEFAULT_PROGRESSION,
  DEFAULT_TARGET,
  progressionBounds,
} from "@/lib/habit-draft";
import type { GoalType, IconName } from "@/types/habit";

export default function NewHabitScreen() {
  const { habits, addHabit } = useHabits();

  const [title, setTitle] = useState("");
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [icon, setIcon] = useState<IconName>(HABIT_ICONS[0]);

  const [goalType, setGoalType] = useState<GoalType>("count");
  const [goalDraft, setGoalDraft] = useState(DEFAULT_TARGET);
  const [afterHabitId, setAfterHabitId] = useState<string | null>(null);

  const [hasCurrent, setHasCurrent] = useState(false);
  const [currentDraft, setCurrentDraft] = useState(DEFAULT_TARGET);
  const [hasProgression, setHasProgression] = useState(false);
  const [progressionDraft, setProgressionDraft] = useState(DEFAULT_PROGRESSION);

  const unit = goalDraft.amount.unit;
  const goal = buildGoal(goalType, goalDraft, afterHabitId);
  const bounds = progressionBounds(goalType, goalDraft, currentDraft, progressionDraft.timeDirection);
  const current =
    goal && hasCurrent
      ? buildCurrent(goal, goalDraft, currentDraft, hasProgression ? progressionDraft : null)
      : undefined;
  const canSave = title.trim() !== "" && goal !== null;

  function handleSave() {
    if (!canSave || !goal) return;
    addHabit({ title: title.trim(), color, icon, goal, current });
    router.back();
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <Section title="Basics">
        <Field label="Title">
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Drink water"
            placeholderTextColor={colors.muted}
            returnKeyType="done"
          />
        </Field>
        <Field label="Color">
          <ColorPicker options={HABIT_COLORS} value={color} onChange={setColor} />
        </Field>
        <Field label="Icon">
          <IconPicker options={HABIT_ICONS} value={icon} color={color} onChange={setIcon} />
        </Field>
      </Section>

      <Section title="Goal" subtitle="Where you want to get to.">
        <Field label="Type">
          <ChipGroup
            options={[
              { value: "count", label: "Count" },
              { value: "time", label: "At a time" },
              { value: "stack", label: "After a habit", disabled: habits.length === 0 },
            ]}
            value={goalType}
            onChange={setGoalType}
          />
          {habits.length === 0 ? (
            <Text style={styles.note}>“After a habit” becomes available once you have another habit.</Text>
          ) : null}
        </Field>

        {goalType === "stack" ? (
          <Field label="After which habit" hint="Repeats whenever that habit does.">
            <ChipGroup
              options={habits.map((h) => ({ value: h.id, label: h.title }))}
              value={afterHabitId}
              onChange={setAfterHabitId}
            />
          </Field>
        ) : null}

        <TargetFields type={goalType} draft={goalDraft} onChange={setGoalDraft} mode="goal" unit={unit} />
      </Section>

      <Section
        title="Current"
        subtitle="Optional. Where you are today, if you already do this. Repeats on the same schedule as the goal."
      >
        <ToggleRow label="I already do this" value={hasCurrent} onChange={setHasCurrent} />
        {hasCurrent ? (
          <>
            <TargetFields
              type={goalType}
              draft={currentDraft}
              onChange={setCurrentDraft}
              mode="current"
              unit={unit}
            />
            {/* When current equals the goal there is nothing to progress. */}
            {bounds.direction ? (
              <>
                <ToggleRow
                  label="Progress gradually toward the goal"
                  value={hasProgression}
                  onChange={setHasProgression}
                />
                {hasProgression ? (
                  <ProgressionFields
                    type={goalType}
                    unit={unit}
                    bounds={bounds}
                    draft={progressionDraft}
                    onChange={setProgressionDraft}
                  />
                ) : null}
              </>
            ) : (
              <Text style={styles.note}>You are already at the goal.</Text>
            )}
          </>
        ) : null}
      </Section>

      <Section title="Summary">
        <Text style={styles.summary}>
          <Text style={styles.summaryLabel}>Goal: </Text>
          {goal ? describeGoal(goal, habits) : "pick a habit to stack after"}
        </Text>
        {current ? (
          <Text style={styles.summary}>
            <Text style={styles.summaryLabel}>Current: </Text>
            {goal ? describeCurrent(current, goal) : null}
          </Text>
        ) : null}
      </Section>

      <Pressable
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        disabled={!canSave}
        onPress={handleSave}
        accessibilityRole="button"
      >
        <Text style={styles.saveButtonText}>Create habit</Text>
      </Pressable>
      {title.trim() === "" ? <Text style={styles.note}>Add a title to create the habit.</Text> : null}
    </ScrollView>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  sectionSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: colors.muted,
  },
  textInput: {
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontSize: 16,
    color: colors.text,
  },
  note: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  summary: {
    fontSize: 15,
    color: colors.text,
  },
  summaryLabel: {
    fontWeight: "600",
  },
  saveButton: {
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.onPrimary,
  },
});
