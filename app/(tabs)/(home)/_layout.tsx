import { Stack } from "expo-router";
import React from "react";
import { useHome } from "@/contexts/HomeContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function HomeLayout() {
  const { homeProfile } = useHome();
  const { colors } = useTheme();
  const title = homeProfile.nickname || 'My Home';

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontWeight: '700' as const },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title,
        }}
      />
    </Stack>
  );
}
