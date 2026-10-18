import { StyleSheet, Text } from "react-native";

import { ChipGroup } from "@/components/form/chip-group";
import { Field } from "@/components/form/field";
import { IntervalInput } from "@/components/form/interval-input";
import { Stepper } from "@/components/form/stepper";
import { colors } from "@/constants/theme";
import type { ProgressionBounds, ProgressionDraft } from "@/lib/habit-draft";
import type { Direction } from "@/lib/progression";
import type { GoalType, Unit } from "@/types/habit";

const TIME_DIRECTION_OPTIONS: { value: Direction; label: string }[] = [
  { value: "decrease", label: "Earlier" },
  { value: "increase", label: "Later" },
];

interface ProgressionFieldsProps {
  type: GoalType;
  unit: Unit;
  bounds: ProgressionBounds;
  draft: ProgressionDraft;
  onChange: (draft: ProgressionDraft) => void;
}

export function ProgressionFields({ type, unit, bounds, draft, onChange }: ProgressionFieldsProps) {
  const isTime = type === "time";
  // For time goals the progression moves the time of day, so it is always in minutes.
  const changeUnit: Unit = isTime ? "minutes" : unit;
  const label = isTime ? "Move the time" : bounds.direction === "decrease" ? "Decrease by" : "Increase by";

  return (
    <>
      <Field label={label} hint={isTime ? undefined : "Set by comparing your current state with the goal."}>
        {/* Around the clock both ways reach the goal, so for time the user picks the way. */}
        {isTime ? (
          <ChipGroup
            options={TIME_DIRECTION_OPTIONS}
            value={draft.timeDirection}
            onChange={(timeDirection) => onChange({ ...draft, timeDirection })}
          />
        ) : null}
        <Stepper
          value={Math.min(draft.value, bounds.gap)}
          min={1}
          max={bounds.gap}
          step={changeUnit === "minutes" ? 5 : 1}
          suffix={changeUnit === "minutes" ? "min" : "times"}
          onChange={(value) => onChange({ ...draft, value })}
        />
        <Text style={styles.note}>
          Stops at the goal. At most {bounds.gap} {changeUnit === "minutes" ? "min" : "times"} per step.
        </Text>
      </Field>
      <Field label="How often">
        <IntervalInput value={draft.interval} onChange={(interval) => onChange({ ...draft, interval })} />
      </Field>
    </>
  );
}

const styles = StyleSheet.create({
  note: {
    fontSize: 13,
    color: colors.muted,
  },
});
