import { Stack } from "expo-router";
import React from "react";
import Colors from "@/constants/colors";

export default function AppliancesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.primary,
        headerTitleStyle: { color: Colors.text, fontWeight: '700' as const },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "Appliances" }}
      />
    </Stack>
  );
}
