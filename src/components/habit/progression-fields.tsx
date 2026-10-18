import { ChipGroup } from "@/components/form/chip-group";
import { Field } from "@/components/form/field";
import { IntervalInput } from "@/components/form/interval-input";
import { Stepper } from "@/components/form/stepper";
import type { ProgressionDraft } from "@/lib/habit-draft";
import type { GoalType, Unit } from "@/types/habit";

interface ProgressionFieldsProps {
  type: GoalType;
  unit: Unit;
  draft: ProgressionDraft;
  onChange: (draft: ProgressionDraft) => void;
}

export function ProgressionFields({ type, unit, draft, onChange }: ProgressionFieldsProps) {
  // For time goals the progression moves the time of day, so it is always in minutes.
  const changeUnit: Unit = type === "time" ? "minutes" : unit;
  const directionOptions =
    type === "time"
      ? [
          { value: "decrease" as const, label: "Earlier" },
          { value: "increase" as const, label: "Later" },
        ]
      : [
          { value: "increase" as const, label: "Increase" },
          { value: "decrease" as const, label: "Decrease" },
        ];

  return (
    <>
      <Field label="Change by">
        <ChipGroup
          options={directionOptions}
          value={draft.direction}
          onChange={(direction) => onChange({ ...draft, direction })}
        />
        <Stepper
          value={draft.value}
          min={1}
          step={changeUnit === "minutes" ? 5 : 1}
          suffix={changeUnit === "minutes" ? "min" : "times"}
          onChange={(value) => onChange({ ...draft, value })}
        />
      </Field>
      <Field label="Change how often">
        <IntervalInput value={draft.interval} onChange={(interval) => onChange({ ...draft, interval })} />
      </Field>
    </>
  );
}
