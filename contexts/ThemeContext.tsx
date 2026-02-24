import { useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { LightColors, DarkColors, ColorScheme } from '@/constants/colors';

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'home_theme_mode';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const queryClient = useQueryClient();
  const systemScheme = useColorScheme();

  const themeModeQuery = useQuery({
    queryKey: ['themeMode'],
    queryFn: async (): Promise<ThemeMode> => {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
      return 'system';
    },
  });

  const themeMode: ThemeMode = themeModeQuery.data ?? 'system';

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemScheme]);

  const colors: ColorScheme = useMemo(() => {
    return isDark ? DarkColors : LightColors;
  }, [isDark]);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    console.log('[Theme] Setting theme mode to:', mode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    queryClient.setQueryData(['themeMode'], mode);
  }, [queryClient]);

  return {
    themeMode,
    isDark,
    colors,
    setThemeMode,
    isLoading: themeModeQuery.isLoading,
  };
});
