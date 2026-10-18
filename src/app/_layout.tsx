import { Stack } from "expo-router";

import { HabitsProvider } from "@/context/habits-context";

export default function RootLayout() {
  return (
    <HabitsProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: "Bounce Back" }} />
        <Stack.Screen name="new-habit" options={{ title: "New habit", presentation: "modal" }} />
      </Stack>
    </HabitsProvider>
  );
}
