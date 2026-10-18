import { Pressable, StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/constants/theme";

interface ColorPickerProps {
  options: string[];
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ options, value, onChange }: ColorPickerProps) {
  return (
    <View style={styles.row}>
      {options.map((color) => {
        const selected = color === value;
        return (
          <Pressable
            key={color}
            onPress={() => onChange(color)}
            style={[styles.ring, selected && { borderColor: color }]}
            accessibilityRole="button"
            accessibilityLabel={`Color ${color}`}
            accessibilityState={{ selected }}
          >
            <View style={[styles.swatch, { backgroundColor: color }]} />
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
  ring: {
    padding: 3,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.background,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
  },
});
