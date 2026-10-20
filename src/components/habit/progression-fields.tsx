import { StyleSheet, Text } from "react-native";

import { ChipGroup } from "@/components/form/chip-group";
import { Field } from "@/components/form/field";
import { IntervalInput } from "@/components/form/interval-input";
import { Stepper } from "@/components/form/stepper";
import { colors } from "@/constants/theme";
import type { ProgressionBounds, ProgressionDraft, ProgressionTarget } from "@/lib/habit-draft";
import type { Frequency, Unit } from "@/types/habit";

interface ProgressionFieldsProps {
  /** Which number actually progresses (see effectiveTarget). */
  target: ProgressionTarget;
  unit: Unit;
  /** null for stacked habits, which have no frequency of their own. */
  goalFrequency: Frequency | null;
  bounds: ProgressionBounds;
  draft: ProgressionDraft;
  onChange: (draft: ProgressionDraft) => void;
}

function stepSuffix(target: ProgressionTarget, unit: Unit, frequency: Frequency | null): string {
  if (target === "amount") return unit === "minutes" ? "min" : "times";
  switch (frequency?.kind) {
    case "everyNDays":
      return "days between times";
    case "timesPerWeek":
      return "times per week";
    case "timesPerMonth":
      return "times per month";
    case "timesInDays":
      return `times in ${frequency.days} days`;
    default:
      return "";
  }
}

export function ProgressionFields({ target, unit, goalFrequency, bounds, draft, onChange }: ProgressionFieldsProps) {
  const { direction, gap } = bounds[target];
  // Only offer a choice when both numbers differ from the goal; otherwise only one can progress.
  const canChoose = bounds.amount.direction !== null && bounds.frequency.direction !== null;

  return (
    <>
      {canChoose ? (
        <Field label="What should change">
          <ChipGroup
            options={[
              { value: "amount", label: "How much each time" },
              { value: "frequency", label: "How often" },
            ]}
            value={target}
            onChange={(next) => onChange({ ...draft, target: next })}
          />
          <Text style={styles.note}>The other one stays as it is now.</Text>
        </Field>
      ) : null}

      <Field
        label={direction === "decrease" ? "Decrease by" : "Increase by"}
        hint="Set by comparing your current state with the goal."
      >
        <Stepper
          value={Math.min(draft.value, gap)}
          min={1}
          max={gap}
          step={target === "amount" && unit === "minutes" ? 5 : 1}
          suffix={stepSuffix(target, unit, goalFrequency)}
          onChange={(value) => onChange({ ...draft, value })}
        />
        <Text style={styles.note}>Stops at the goal. At most {gap} per step.</Text>
      </Field>

      <Field label="Change how often">
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
