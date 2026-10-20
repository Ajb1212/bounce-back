import { ChipGroup } from "@/components/form/chip-group";
import { Field } from "@/components/form/field";
import { Stepper } from "@/components/form/stepper";
import { FrequencyInput } from "@/components/habit/frequency-input";
import type { TargetDraft } from "@/lib/habit-draft";
import type { Frequency, GoalType, Unit } from "@/types/habit";

const UNIT_OPTIONS: { value: Unit; label: string }[] = [
  { value: "times", label: "Times" },
  { value: "minutes", label: "Minutes" },
];

interface TargetFieldsProps {
  type: GoalType;
  draft: TargetDraft;
  onChange: (draft: TargetDraft) => void;
  /** The goal chooses the unit and frequency kind; the current state reuses them. */
  mode: "goal" | "current";
  unit: Unit;
  /** Required in "current" mode for count goals. */
  goalFrequency?: Frequency;
}

/** The fields shared by the goal and the current state. */
export function TargetFields({ type, draft, onChange, mode, unit, goalFrequency }: TargetFieldsProps) {
  const isGoal = mode === "goal";
  // "Every day" has no number to set, so the current state has nothing to show for it.
  const showFrequency = type === "count" && (isGoal || goalFrequency?.kind !== "daily");

  return (
    <>
      <Field label={unit === "minutes" ? "How long each time" : "How many each time"}>
        {isGoal ? (
          <ChipGroup
            options={UNIT_OPTIONS}
            value={unit}
            onChange={(next) => onChange({ ...draft, amount: { ...draft.amount, unit: next } })}
          />
        ) : null}
        <Stepper
          value={draft.amount.value}
          min={1}
          step={unit === "minutes" ? 5 : 1}
          suffix={unit === "minutes" ? "min" : "times"}
          onChange={(value) => onChange({ ...draft, amount: { ...draft.amount, value } })}
        />
      </Field>

      {showFrequency ? (
        <Field label="How often">
          <FrequencyInput
            value={draft.frequency}
            onChange={(frequency) => onChange({ ...draft, frequency })}
            lockedTo={isGoal ? undefined : goalFrequency}
          />
        </Field>
      ) : null}
    </>
  );
}
