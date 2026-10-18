import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/constants/theme";
import type { IconName } from "@/types/habit";

interface IconPickerProps {
  options: IconName[];
  value: IconName;
  color: string;
  onChange: (icon: IconName) => void;
}

export function IconPicker({ options, value, color, onChange }: IconPickerProps) {
  return (
    <View style={styles.grid}>
      {options.map((icon) => {
        const selected = icon === value;
        return (
          <Pressable
            key={icon}
            onPress={() => onChange(icon)}
            style={[styles.cell, selected && { backgroundColor: color, borderColor: color }]}
            accessibilityRole="button"
            accessibilityLabel={`Icon ${icon}`}
            accessibilityState={{ selected }}
          >
            <Ionicons name={icon} size={22} color={selected ? colors.onPrimary : colors.text} />
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
    gap: spacing.sm,
  },
  cell: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
});
