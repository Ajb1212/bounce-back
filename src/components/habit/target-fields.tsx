import { ChipGroup } from "@/components/form/chip-group";
import { Field } from "@/components/form/field";
import { IntervalInput } from "@/components/form/interval-input";
import { Stepper } from "@/components/form/stepper";
import { TimeInput } from "@/components/form/time-input";
import type { TargetDraft } from "@/lib/habit-draft";
import type { GoalType, Unit } from "@/types/habit";

const UNIT_OPTIONS: { value: Unit; label: string }[] = [
  { value: "times", label: "Times" },
  { value: "minutes", label: "Minutes" },
];

interface TargetFieldsProps {
  type: GoalType;
  draft: TargetDraft;
  onChange: (draft: TargetDraft) => void;
  /** The goal chooses the unit and interval; the current state reuses them. */
  mode: "goal" | "current";
  unit: Unit;
}

/** The fields shared by the goal and the current state. Which ones show depends on the goal type. */
export function TargetFields({ type, draft, onChange, mode, unit }: TargetFieldsProps) {
  const isGoal = mode === "goal";
  const showAmount = type === "count" || type === "stack";
  const showInterval = isGoal && (type === "count" || type === "time");

  return (
    <>
      {showAmount ? (
        <Field label={unit === "minutes" ? "How long" : "How many times"}>
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
      ) : null}

      {type === "time" ? (
        <Field label="At what time" hint="24-hour clock">
          <TimeInput value={draft.time} onChange={(time) => onChange({ ...draft, time })} />
        </Field>
      ) : null}

      {showInterval ? (
        <Field label="How often" hint={type === "count" ? "Every 1 day = per day" : undefined}>
          <IntervalInput value={draft.interval} onChange={(interval) => onChange({ ...draft, interval })} />
        </Field>
      ) : null}
    </>
  );
}
