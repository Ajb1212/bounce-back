import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "@/constants/theme";

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  hint: {
    fontSize: 13,
    color: colors.muted,
  },
  content: {
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
});
