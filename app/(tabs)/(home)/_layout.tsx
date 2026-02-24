import { Stack } from "expo-router";
import React from "react";
import Colors from "@/constants/colors";
import { useHome } from "@/contexts/HomeContext";

export default function HomeLayout() {
  const { homeProfile } = useHome();
  const title = homeProfile.nickname || 'My Home';

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
        options={{
          title,
        }}
      />
    </Stack>
  );
}
