import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Platform, Pressable, StyleSheet, Text } from "react-native";

import { colors, radius, spacing } from "@/constants/theme";
import { formatTime } from "@/lib/format";
import type { TimeOfDay } from "@/types/habit";

interface TimeFieldProps {
  value: TimeOfDay;
  onChange: (value: TimeOfDay) => void;
}

function toDate({ hour, minute }: TimeOfDay): Date {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

function fromDate(date: Date): TimeOfDay {
  return { hour: date.getHours(), minute: date.getMinutes() };
}

/** A 24-hour time, picked with the phone's own time picker. */
export function TimeField({ value, onChange }: TimeFieldProps) {
  if (Platform.OS === "ios") {
    // iOS shows a compact button that opens the picker; the en_GB locale makes it 24-hour.
    return (
      <DateTimePicker
        value={toDate(value)}
        mode="time"
        display="compact"
        locale="en_GB"
        onValueChange={(_event, date) => onChange(fromDate(date))}
        style={styles.iosPicker}
      />
    );
  }

  // Android opens the picker as a dialog, so the field itself is just a button.
  return (
    <Pressable
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={`Time ${formatTime(value)}. Tap to change.`}
      onPress={() =>
        DateTimePickerAndroid.open({
          value: toDate(value),
          mode: "time",
          is24Hour: true,
          onValueChange: (_event, date) => onChange(fromDate(date)),
        })
      }
    >
      <Text style={styles.text}>{formatTime(value)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    minWidth: 80,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
    color: colors.text,
  },
  iosPicker: {
    alignSelf: "flex-start",
  },
});
