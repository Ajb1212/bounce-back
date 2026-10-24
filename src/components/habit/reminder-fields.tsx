import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Field } from "@/components/form/field";
import { Stepper } from "@/components/form/stepper";
import { TimeField } from "@/components/form/time-field";
import { ToggleGrid } from "@/components/form/toggle-grid";
import { colors, radius, spacing } from "@/constants/theme";
import { WEEKDAY_NAMES } from "@/lib/format";
import type { ReminderDraft } from "@/lib/habit-draft";
import type { Frequency, ReminderSlot, TimeOfDay, Weekday } from "@/types/habit";

const WEEKDAY_OPTIONS = ([1, 2, 3, 4, 5, 6, 7] as Weekday[]).map((day) => ({
  value: day,
  label: WEEKDAY_NAMES[day][0],
  accessibilityLabel: WEEKDAY_NAMES[day],
}));

const MONTH_DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));

interface ReminderFieldsProps {
  /** The goal's frequency: it decides which fields show. */
  frequency: Frequency;
  draft: ReminderDraft;
  onChange: (draft: ReminderDraft) => void;
}

export function ReminderFields({ frequency, draft, onChange }: ReminderFieldsProps) {
  const set = (patch: Partial<ReminderDraft>) => onChange({ ...draft, ...patch });

  switch (frequency.kind) {
    case "daily":
      return (
        <Field label="Remind me at">
          <TimeField value={draft.time} onChange={(time) => set({ time })} />
        </Field>
      );

    case "timesPerWeek":
      return (
        <Field label="On these days">
          <DaySlots
            options={WEEKDAY_OPTIONS}
            slots={draft.weekDays}
            lastTime={draft.time}
            dayLabel={(day) => WEEKDAY_NAMES[day as Weekday]}
            onChange={(weekDays, time) => set({ weekDays, ...(time ? { time } : {}) })}
          />
        </Field>
      );

    case "timesPerMonth":
      return (
        <Field label="On these days of the month" hint="In shorter months, 29–31 remind you on the last day.">
          <DaySlots
            options={MONTH_DAY_OPTIONS}
            slots={draft.monthDays}
            lastTime={draft.time}
            dayLabel={(day) => `Day ${day}`}
            onChange={(monthDays, time) => set({ monthDays, ...(time ? { time } : {}) })}
          />
        </Field>
      );

    case "everyNDays":
      return (
        <Field
          label="Remind me at"
          hint={`Every ${frequency.days} days, counting from the day you turn reminders on.`}
        >
          <TimeField value={draft.time} onChange={(time) => set({ time })} />
        </Field>
      );

    case "timesInDays":
      return (
        <CycleSlots
          cycleDays={frequency.days}
          slots={draft.cycleSlots}
          lastTime={draft.time}
          onChange={(cycleSlots, time) => set({ cycleSlots, ...(time ? { time } : {}) })}
        />
      );
  }
}

interface DaySlotsProps {
  options: { value: number; label: string; accessibilityLabel?: string }[];
  slots: ReminderSlot[];
  /** The most recently picked time; newly selected days start with it. */
  lastTime: TimeOfDay;
  dayLabel: (day: number) => string;
  onChange: (slots: ReminderSlot[], lastTime?: TimeOfDay) => void;
}

/** Pick days from a grid, then a time for each picked day. */
function DaySlots({ options, slots, lastTime, dayLabel, onChange }: DaySlotsProps) {
  const sorted = [...slots].sort((a, b) => a.day - b.day);
  return (
    <>
      <ToggleGrid
        options={options}
        selected={sorted.map((slot) => slot.day)}
        onChange={(selected) =>
          // Days that stay selected keep their time.
          onChange(selected.map((day) => sorted.find((slot) => slot.day === day) ?? { day, time: lastTime }))
        }
      />
      {sorted.map((slot) => (
        <View key={slot.day} style={styles.row}>
          <Text style={styles.rowLabel}>{dayLabel(slot.day)}</Text>
          <TimeField
            value={slot.time}
            onChange={(time) => onChange(sorted.map((s) => (s.day === slot.day ? { ...s, time } : s)), time)}
          />
        </View>
      ))}
    </>
  );
}

interface CycleSlotsProps {
  cycleDays: number;
  slots: ReminderSlot[];
  lastTime: TimeOfDay;
  onChange: (slots: ReminderSlot[], lastTime?: TimeOfDay) => void;
}

/** "Day 1 at 12:00, day 4 at 20:00" within each N-day cycle. */
function CycleSlots({ cycleDays, slots, lastTime, onChange }: CycleSlotsProps) {
  const update = (index: number, slot: ReminderSlot) => onChange(slots.map((s, i) => (i === index ? slot : s)));

  return (
    <Field
      label={`Reminders in each ${cycleDays}-day cycle`}
      hint="Day 1 is the day you turn reminders on; the cycle then repeats."
    >
      {slots.map((slot, index) => (
        <View key={index} style={styles.row}>
          <Stepper
            value={Math.min(slot.day, cycleDays)}
            min={1}
            max={cycleDays}
            onChange={(day) => update(index, { ...slot, day })}
          />
          <TimeField
            value={slot.time}
            onChange={(time) => onChange(slots.map((s, i) => (i === index ? { ...s, time } : s)), time)}
          />
          <Pressable
            onPress={() => onChange(slots.filter((_, i) => i !== index))}
            style={styles.remove}
            accessibilityRole="button"
            accessibilityLabel={`Remove reminder on day ${slot.day}`}
          >
            <Ionicons name="close" size={20} color={colors.muted} />
          </Pressable>
        </View>
      ))}
      <Pressable
        onPress={() => onChange([...slots, { day: 1, time: lastTime }])}
        style={styles.add}
        accessibilityRole="button"
      >
        <Ionicons name="add" size={18} color={colors.primary} />
        <Text style={styles.addText}>Add reminder</Text>
      </Pressable>
    </Field>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.md,
  },
  rowLabel: {
    width: 56,
    fontSize: 15,
    color: colors.muted,
  },
  remove: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  add: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  addText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
});
