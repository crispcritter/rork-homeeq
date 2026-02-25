import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import { HomeProvider } from "../contexts/HomeContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import Colors from "@/constants/colors";

let GestureHandlerRootView: React.ComponentType<{ style?: any; children: React.ReactNode }> = ({ children, style }) => (
  <View style={style}>{children}</View>
);

try {
  const gestureHandler = require('react-native-gesture-handler');
  if (gestureHandler?.GestureHandlerRootView) {
    GestureHandlerRootView = gestureHandler.GestureHandlerRootView;
  }
} catch (e) {
  console.log('[Layout] GestureHandlerRootView not available, using fallback');
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontWeight: '600' as const },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="add-appliance"
        options={{ presentation: "modal", title: "Add Item" }}
      />
      <Stack.Screen
        name="add-task"
        options={{ presentation: "modal", title: "New Task" }}
      />
      <Stack.Screen
        name="appliance/[id]"
        options={{ title: "Details" }}
      />
      <Stack.Screen
        name="edit-appliance"
        options={{ presentation: "fullScreenModal", title: "Edit Item" }}
      />
      <Stack.Screen
        name="edit-expense"
        options={{ presentation: "fullScreenModal", title: "Edit Expense" }}
      />
      <Stack.Screen
        name="task/[id]"
        options={{ title: "Task Details" }}
      />
      <Stack.Screen
        name="add-expense"
        options={{ presentation: "modal", title: "Log Expense" }}
      />
      <Stack.Screen
        name="expense/[id]"
        options={{ title: "Expense Details" }}
      />
      <Stack.Screen
        name="provider/[id]"
        options={{ title: "Provider" }}
      />
      <Stack.Screen
        name="trusted-pros"
        options={{ title: "Trusted Pros" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <HomeProvider>
            <RootLayoutNav />
          </HomeProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
