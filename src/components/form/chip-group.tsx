import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "@/constants/theme";

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface ChipGroupProps<T extends string> {
  options: ChipOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
}

/** A row of pill buttons where exactly one can be selected. */
export function ChipGroup<T extends string>({ options, value, onChange }: ChipGroupProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            disabled={option.disabled}
            onPress={() => onChange(option.value)}
            style={[styles.chip, selected && styles.chipSelected, option.disabled && styles.chipDisabled]}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled: option.disabled }}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 14,
    color: colors.text,
  },
  labelSelected: {
    color: colors.onPrimary,
    fontWeight: "600",
  },
});
