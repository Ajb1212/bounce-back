import { StyleSheet, Text, View } from "react-native";

import { Stepper } from "@/components/form/stepper";
import { colors, spacing } from "@/constants/theme";
import type { TimeOfDay } from "@/types/habit";

interface TimeInputProps {
  value: TimeOfDay;
  onChange: (value: TimeOfDay) => void;
}

/** 24-hour time, picked as hour + minute. */
export function TimeInput({ value, onChange }: TimeInputProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Hour</Text>
        <Stepper value={value.hour} min={0} max={23} onChange={(hour) => onChange({ ...value, hour })} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Minute</Text>
        <Stepper
          value={value.minute}
          min={0}
          max={59}
          step={5}
          onChange={(minute) => onChange({ ...value, minute })}
        />
      </View>
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
