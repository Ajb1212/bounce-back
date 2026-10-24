import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "@/constants/theme";

interface ToggleGridProps<T extends number> {
  options: { value: T; label: string; accessibilityLabel?: string }[];
  selected: T[];
  onChange: (selected: T[]) => void;
}

/** Round buttons where any number can be switched on, e.g. weekdays or days of the month. */
export function ToggleGrid<T extends number>({ options, selected, onChange }: ToggleGridProps<T>) {
  function toggle(value: T) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  return (
    <View style={styles.grid}>
      {options.map((option) => {
        const isOn = selected.includes(option.value);
        return (
          <Pressable
            key={option.value}
            onPress={() => toggle(option.value)}
            style={[styles.cell, isOn && styles.cellOn]}
            accessibilityRole="checkbox"
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            accessibilityState={{ checked: isOn }}
          >
            <Text style={[styles.label, isOn && styles.labelOn]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  cell: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  cellOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: 14,
    color: colors.text,
  },
  labelOn: {
    color: colors.onPrimary,
    fontWeight: "600",
  },
});
