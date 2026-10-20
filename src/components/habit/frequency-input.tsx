import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ChipGroup } from "@/components/form/chip-group";
import { Stepper } from "@/components/form/stepper";
import { colors, spacing } from "@/constants/theme";
import type { FrequencyDraft } from "@/lib/habit-draft";
import type { Frequency, FrequencyKind } from "@/types/habit";

const KIND_OPTIONS: { value: FrequencyKind; label: string }[] = [
  { value: "daily", label: "Every day" },
  { value: "everyNDays", label: "Every N days" },
  { value: "timesPerWeek", label: "Times per week" },
  { value: "timesPerMonth", label: "Times per month" },
  { value: "timesInDays", label: "Times in N days" },
];

interface FrequencyInputProps {
  value: FrequencyDraft;
  onChange: (value: FrequencyDraft) => void;
  /**
   * For the current state: the goal's frequency. The kind is then fixed to the goal's,
   * and for "times in N days" the N days too; only the number of times can change.
   */
  lockedTo?: Frequency;
}

export function FrequencyInput({ value, onChange, lockedTo }: FrequencyInputProps) {
  const kind = lockedTo?.kind ?? value.kind;
  const set = (patch: Partial<FrequencyDraft>) => onChange({ ...value, ...patch });

  return (
    <View style={styles.container}>
      {lockedTo ? null : <ChipGroup options={KIND_OPTIONS} value={kind} onChange={(next) => set({ kind: next })} />}

      {kind === "everyNDays" ? (
        <Row label="Every">
          <Stepper value={value.everyDays} min={2} onChange={(everyDays) => set({ everyDays })} suffix="days" />
        </Row>
      ) : null}

      {kind === "timesPerWeek" ? (
        <Stepper value={value.perWeek} min={1} onChange={(perWeek) => set({ perWeek })} suffix="times per week" />
      ) : null}

      {kind === "timesPerMonth" ? (
        <Stepper value={value.perMonth} min={1} onChange={(perMonth) => set({ perMonth })} suffix="times per month" />
      ) : null}

      {kind === "timesInDays" ? (
        <>
          <Stepper value={value.times} min={1} onChange={(times) => set({ times })} suffix="times" />
          {lockedTo?.kind === "timesInDays" ? (
            <Text style={styles.fixed}>in {lockedTo.days} days, same as the goal</Text>
          ) : (
            <Row label="In">
              <Stepper value={value.inDays} min={1} onChange={(inDays) => set({ inDays })} suffix="days" />
            </Row>
          )}
        </>
      ) : null}
    </View>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  label: {
    width: 44,
    fontSize: 15,
    color: colors.muted,
  },
  fixed: {
    fontSize: 15,
    color: colors.muted,
  },
});
