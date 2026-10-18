import { StyleSheet, Text, View } from "react-native";

import { ChipGroup } from "@/components/form/chip-group";
import { Stepper } from "@/components/form/stepper";
import { colors, spacing } from "@/constants/theme";
import type { Interval, Period } from "@/types/habit";

interface IntervalInputProps {
  value: Interval;
  onChange: (value: Interval) => void;
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "day", label: "Days" },
  { value: "week", label: "Weeks" },
  { value: "month", label: "Months" },
];

/** "every [N] [days | weeks | months]" */
export function IntervalInput({ value, onChange }: IntervalInputProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Every</Text>
        <Stepper value={value.every} min={1} max={365} onChange={(every) => onChange({ ...value, every })} />
      </View>
      <ChipGroup options={PERIOD_OPTIONS} value={value.period} onChange={(period) => onChange({ ...value, period })} />
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
    width: 56,
    fontSize: 15,
    color: colors.muted,
  },
});
