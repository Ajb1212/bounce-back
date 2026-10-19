import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";

import { HabitsProvider } from "@/context/habits-context";
import { migrateDbIfNeeded } from "@/db/migrations";

export default function RootLayout() {
  return (
    // Opens the database and runs migrations before anything below renders.
    <SQLiteProvider databaseName="bounce-back.db" onInit={migrateDbIfNeeded}>
      <HabitsProvider>
        <Stack>
          <Stack.Screen name="index" options={{ title: "Bounce Back" }} />
          <Stack.Screen name="new-habit" options={{ title: "New habit", presentation: "modal" }} />
        </Stack>
      </HabitsProvider>
    </SQLiteProvider>
  );
}
