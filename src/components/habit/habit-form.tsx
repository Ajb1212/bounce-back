import { useState, type ReactNode } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { ChipGroup } from "@/components/form/chip-group";
import { ColorPicker } from "@/components/form/color-picker";
import { Field } from "@/components/form/field";
import { IconPicker } from "@/components/form/icon-picker";
import { ProgressionFields } from "@/components/habit/progression-fields";
import { ReminderFields } from "@/components/habit/reminder-fields";
import { TargetFields } from "@/components/habit/target-fields";
import { HABIT_COLORS, HABIT_ICONS } from "@/constants/habit-options";
import { colors, radius, spacing } from "@/constants/theme";
import { useHabits } from "@/context/habits-context";
import { useKeyboardHeight } from "@/hooks/use-keyboard-height";
import { describeCurrent, describeGoal, describeReminder } from "@/lib/format";
import {
  buildCurrent,
  buildGoal,
  buildReminder,
  draftsFromHabit,
  effectiveTarget,
  NEW_HABIT_DRAFTS,
  progressionBounds,
} from "@/lib/habit-draft";
import { stackCandidates } from "@/lib/stacking";
import { ensureNotificationPermission } from "@/notifications/reminders";
import type { GoalType, Habit, HabitInput, IconName } from "@/types/habit";

interface HabitFormProps {
  /** The habit being edited. Leave out to create a new one. */
  initial?: Habit;
  submitLabel: string;
  /** Saves the habit. If it throws, the form shows an error and keeps what the user typed. */
  onSubmit: (input: HabitInput) => Promise<void>;
}

/** The create and edit screens share this form. It only reads `initial` when it first appears. */
export function HabitForm({ initial, submitLabel, onSubmit }: HabitFormProps) {
  const { habits } = useHabits();
  const start = initial ? draftsFromHabit(initial) : NEW_HABIT_DRAFTS;
  const candidates = stackCandidates(habits, initial?.id ?? null);
  const keyboardHeight = useKeyboardHeight();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [color, setColor] = useState(initial?.color ?? HABIT_COLORS[0]);
  const [icon, setIcon] = useState<IconName>(initial?.icon ?? HABIT_ICONS[0]);

  const [goalType, setGoalType] = useState<GoalType>(start.goalType);
  const [goalDraft, setGoalDraft] = useState(start.goal);
  const [afterHabitId, setAfterHabitId] = useState(start.afterHabitId);

  const [hasCurrent, setHasCurrent] = useState(start.hasCurrent);
  const [currentDraft, setCurrentDraft] = useState(start.current);
  const [hasProgression, setHasProgression] = useState(start.hasProgression);
  const [progressionDraft, setProgressionDraft] = useState(start.progression);
  const [reminderDraft, setReminderDraft] = useState(start.reminder);

  const unit = goalDraft.amount.unit;
  const goal = buildGoal(goalType, goalDraft, afterHabitId);
  const bounds = progressionBounds(goalType, goalDraft, currentDraft);
  const progressionTarget = effectiveTarget(progressionDraft, bounds);
  const goalFrequency = goal?.type === "count" ? goal.frequency : null;
  const current =
    goal && hasCurrent
      ? buildCurrent(goal, goalDraft, currentDraft, hasProgression ? progressionDraft : null)
      : undefined;
  const reminderResult = buildReminder(goal, reminderDraft, new Date());
  const [isSaving, setIsSaving] = useState(false);
  const canSave = title.trim() !== "" && goal !== null && !reminderResult.error && !isSaving;

  async function handleReminderToggle(enabled: boolean) {
    if (enabled) {
      let allowed = false;
      try {
        allowed = await ensureNotificationPermission();
      } catch (error) {
        console.error("Failed to check notification permission", error);
      }
      if (!allowed) {
        Alert.alert(
          "Notifications are off",
          "To get reminders, allow notifications for this app in your phone's settings.",
        );
        return;
      }
    }
    setReminderDraft({ ...reminderDraft, enabled });
  }

  async function handleSave() {
    if (!canSave || !goal) return;
    setIsSaving(true);
    try {
      await onSubmit({ title: title.trim(), color, icon, goal, current, reminder: reminderResult.reminder });
    } catch (error) {
      console.error("Failed to save habit", error);
      Alert.alert("Couldn't save the habit", "Please try again.");
      setIsSaving(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      // iOS makes room for the keyboard by itself (automaticallyAdjustKeyboardInsets).
      // Android draws the app behind the keyboard, so add the keyboard's height as space
      // at the bottom; that way the end of the form can always be scrolled above it.
      contentContainerStyle={[
        styles.content,
        Platform.OS === "android" && { paddingBottom: CONTENT_BOTTOM_PADDING + keyboardHeight },
      ]}
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
              { value: "count", label: "On a schedule" },
              { value: "stack", label: "After a habit", disabled: candidates.length === 0 },
            ]}
            value={goalType}
            onChange={setGoalType}
          />
          {candidates.length === 0 ? (
            <Text style={styles.note}>“After a habit” becomes available once you have another habit.</Text>
          ) : null}
        </Field>

        {goalType === "stack" ? (
          <Field label="After which habit" hint="Repeats whenever that habit does.">
            <ChipGroup
              options={candidates.map((h) => ({ value: h.id, label: h.title }))}
              value={afterHabitId}
              onChange={setAfterHabitId}
            />
          </Field>
        ) : null}

        <TargetFields type={goalType} draft={goalDraft} onChange={setGoalDraft} mode="goal" unit={unit} />
      </Section>

      <Section
        title="Current"
        subtitle="Optional. Where you are today, if you already do this."
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
              goalFrequency={goalFrequency ?? undefined}
            />
            {/* When current equals the goal there is nothing to progress. */}
            {progressionTarget ? (
              <>
                <ToggleRow
                  label="Progress gradually toward the goal"
                  value={hasProgression}
                  onChange={setHasProgression}
                />
                {hasProgression ? (
                  <ProgressionFields
                    target={progressionTarget}
                    unit={unit}
                    goalFrequency={goalFrequency}
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

      {goal?.type === "count" ? (
        <Section title="Reminders" subtitle="Optional. Get a notification when it's time.">
          <ToggleRow label="Remind me" value={reminderDraft.enabled} onChange={handleReminderToggle} />
          {reminderDraft.enabled ? (
            <ReminderFields frequency={goal.frequency} draft={reminderDraft} onChange={setReminderDraft} />
          ) : null}
          {reminderResult.error ? <Text style={styles.note}>{reminderResult.error}</Text> : null}
        </Section>
      ) : null}

      <Section title="Summary">
        <Text style={styles.summary}>
          <Text style={styles.summaryLabel}>Goal: </Text>
          {goal ? describeGoal(goal, habits) : "pick a habit to stack after"}
        </Text>
        {current ? (
          <Text style={styles.summary}>
            <Text style={styles.summaryLabel}>Current: </Text>
            {describeCurrent(current)}
          </Text>
        ) : null}
        {reminderResult.reminder ? (
          <Text style={styles.summary}>
            <Text style={styles.summaryLabel}>Reminders: </Text>
            {describeReminder(reminderResult.reminder)}
          </Text>
        ) : null}
      </Section>

      <Pressable
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        disabled={!canSave}
        onPress={handleSave}
        accessibilityRole="button"
      >
        <Text style={styles.saveButtonText}>{isSaving ? "Saving…" : submitLabel}</Text>
      </Pressable>
      {title.trim() === "" ? <Text style={styles.note}>Add a title to save the habit.</Text> : null}
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

const CONTENT_BOTTOM_PADDING = spacing.xl * 2;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: CONTENT_BOTTOM_PADDING,
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
