import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors, radius, spacing } from "@/constants/theme";

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

/** A number input with − and + buttons. The number can also be typed directly. */
export function Stepper({ value, onChange, min = 0, max = 9999, step = 1, suffix }: StepperProps) {
  // The text is kept separately so the field can be empty while the user is typing.
  const [text, setText] = useState(String(value));
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    // The value changed from outside (e.g. the buttons), so show it.
    setLastValue(value);
    setText(String(value));
  }

  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  function handleChangeText(next: string) {
    const digits = next.replace(/[^0-9]/g, "");
    setText(digits);
    if (digits !== "") onChange(clamp(Number(digits)));
  }

  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.button, value <= min && styles.buttonDisabled]}
        disabled={value <= min}
        onPress={() => onChange(clamp(value - step))}
        accessibilityLabel="Decrease"
      >
        <Text style={styles.buttonText}>−</Text>
      </Pressable>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={handleChangeText}
        onBlur={() => setText(String(value))}
        keyboardType="number-pad"
        selectTextOnFocus
      />
      <Pressable
        style={[styles.button, value >= max && styles.buttonDisabled]}
        disabled={value >= max}
        onPress={() => onChange(clamp(value + step))}
        accessibilityLabel="Increase"
      >
        <Text style={styles.buttonText}>+</Text>
      </Pressable>
      {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 20,
    color: colors.text,
  },
  input: {
    minWidth: 56,
    height: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    textAlign: "center",
    fontSize: 16,
    color: colors.text,
  },
  suffix: {
    fontSize: 15,
    color: colors.muted,
  },
});
