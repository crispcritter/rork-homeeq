import { useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { LightColors, DarkColors, ColorScheme, PaletteId, palettes } from '@/constants/colors';

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'home_theme_mode';
const PALETTE_STORAGE_KEY = 'home_color_palette';

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

  const paletteQuery = useQuery({
    queryKey: ['colorPalette'],
    queryFn: async (): Promise<PaletteId> => {
      const stored = await AsyncStorage.getItem(PALETTE_STORAGE_KEY);
      if (stored === 'default' || stored === 'richBlue' || stored === 'deepGrey') {
        return stored;
      }
      return 'default';
    },
  });

  const themeMode: ThemeMode = themeModeQuery.data ?? 'system';
  const paletteId: PaletteId = paletteQuery.data ?? 'default';

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemScheme]);

  const colors: ColorScheme = useMemo(() => {
    const palette = palettes[paletteId];
    return isDark ? palette.dark : palette.light;
  }, [isDark, paletteId]);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    console.log('[Theme] Setting theme mode to:', mode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    queryClient.setQueryData(['themeMode'], mode);
  }, [queryClient]);

  const setPalette = useCallback(async (id: PaletteId) => {
    console.log('[Theme] Setting color palette to:', id);
    await AsyncStorage.setItem(PALETTE_STORAGE_KEY, id);
    queryClient.setQueryData(['colorPalette'], id);
  }, [queryClient]);

  return {
    themeMode,
    isDark,
    colors,
    paletteId,
    setThemeMode,
    setPalette,
    isLoading: themeModeQuery.isLoading || paletteQuery.isLoading,
  };
});
