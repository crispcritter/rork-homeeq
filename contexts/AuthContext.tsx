import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import createContextHook from '@nkzw/create-context-hook';
import { trpcClient, AUTH_TOKEN_KEY } from '@/lib/trpc';

export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const restoreSession = async () => {
      try {
        const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        if (!token) {
          console.log('[Auth] No stored token found');
          if (!cancelled && mountedRef.current) setIsLoading(false);
          return;
        }

        console.log('[Auth] Found stored token, validating...');
        const me = await trpcClient.auth.me.query();
        if (!cancelled && mountedRef.current) {
          setUser(me);
          console.log('[Auth] Session restored for:', me.email);
        }
      } catch {
        console.log('[Auth] Stored session invalid, clearing token');
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY).catch(() => {});
        if (!cancelled && mountedRef.current) {
          setUser(null);
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      console.log('[Auth] Login attempt:', input.email);
      const result = await trpcClient.auth.login.mutate(input);
      return result;
    },
    onSuccess: async (data) => {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, data.token);
      setUser(data.user);
      console.log('[Auth] Login successful:', data.user.email);
    },
    onError: (error) => {
      console.error('[Auth] Login failed:', error.message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      console.log('[Auth] Register attempt:', input.email);
      const result = await trpcClient.auth.register.mutate(input);
      return result;
    },
    onSuccess: async (data) => {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, data.token);
      setUser(data.user);
      console.log('[Auth] Registration successful:', data.user.email);
    },
    onError: (error) => {
      console.error('[Auth] Registration failed:', error.message);
    },
  });

  const signOut = useCallback(async () => {
    try {
      await trpcClient.auth.logout.mutate();
    } catch (e) {
      console.warn('[Auth] Logout API call failed (continuing anyway):', e);
    }
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY).catch(() => {});
    setUser(null);
    setSyncStatus('idle');
    setLastSyncedAt(null);
    console.log('[Auth] User signed out');
  }, []);

  const pushToCloud = useCallback(async () => {
    if (!user) return;

    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const { STORAGE_KEYS, loadFromStorage, loadMonthlyBudget } = await import('@/contexts/storage');
    const { DEFAULT_PROFILE } = await import('@/constants/defaultProfile');
    const { recommendedGroups: defaultGroups } = await import('@/mocks/recommendedItems');

    setSyncStatus('syncing');
    try {
      const [appliances, tasks, budgetItems, monthlyBudget, homeProfile, recommendedGroups, trustedPros] = await Promise.all([
        loadFromStorage(STORAGE_KEYS.appliances, []),
        loadFromStorage(STORAGE_KEYS.tasks, []),
        loadFromStorage(STORAGE_KEYS.budgetItems, []),
        loadMonthlyBudget(),
        loadFromStorage(STORAGE_KEYS.homeProfile, DEFAULT_PROFILE),
        loadFromStorage(STORAGE_KEYS.recommendedItems, defaultGroups),
        loadFromStorage(STORAGE_KEYS.trustedPros, []),
      ]);

      let sectionsDefaultOpen = true;
      try {
        const stored = await AsyncStorage.getItem('home_sections_default_open');
        if (stored !== null) sectionsDefaultOpen = stored === 'true';
      } catch {}

      const result = await trpcClient.sync.push.mutate({
        appliances: appliances as any[],
        tasks: tasks as any[],
        budgetItems: budgetItems as any[],
        monthlyBudget,
        homeProfile,
        recommendedGroups: recommendedGroups as any[],
        trustedPros: trustedPros as any[],
        sectionsDefaultOpen,
      });

      if (mountedRef.current) {
        setSyncStatus('synced');
        setLastSyncedAt(result.updatedAt);
      }
      console.log('[Auth] Push to cloud complete');
      return result;
    } catch (error) {
      console.error('[Auth] Push to cloud failed:', error);
      if (mountedRef.current) setSyncStatus('error');
      throw error;
    }
  }, [user]);

  const pullFromCloud = useCallback(async () => {
    if (!user) return null;

    setSyncStatus('syncing');
    try {
      const result = await trpcClient.sync.pull.query();
      if (mountedRef.current) {
        setSyncStatus(result.data ? 'synced' : 'idle');
        setLastSyncedAt(result.updatedAt);
      }
      console.log('[Auth] Pull from cloud complete, has data:', !!result.data);
      return result;
    } catch (error) {
      console.error('[Auth] Pull from cloud failed:', error);
      if (mountedRef.current) setSyncStatus('error');
      throw error;
    }
  }, [user]);

  const applyCloudData = useCallback(async (data: Record<string, unknown>) => {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const { STORAGE_KEYS } = await import('@/contexts/storage');

    console.log('[Auth] Applying cloud data to local storage...');

    const syncData = data as {
      appliances?: unknown[];
      tasks?: unknown[];
      budgetItems?: unknown[];
      monthlyBudget?: number;
      homeProfile?: unknown;
      recommendedGroups?: unknown[];
      trustedPros?: unknown[];
      sectionsDefaultOpen?: boolean;
    };

    if (syncData.appliances) {
      await AsyncStorage.setItem(STORAGE_KEYS.appliances, JSON.stringify(syncData.appliances));
    }
    if (syncData.tasks) {
      await AsyncStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(syncData.tasks));
    }
    if (syncData.budgetItems) {
      await AsyncStorage.setItem(STORAGE_KEYS.budgetItems, JSON.stringify(syncData.budgetItems));
    }
    if (syncData.monthlyBudget !== undefined) {
      await AsyncStorage.setItem(STORAGE_KEYS.monthlyBudget, syncData.monthlyBudget.toString());
    }
    if (syncData.homeProfile) {
      await AsyncStorage.setItem(STORAGE_KEYS.homeProfile, JSON.stringify(syncData.homeProfile));
    }
    if (syncData.recommendedGroups) {
      await AsyncStorage.setItem(STORAGE_KEYS.recommendedItems, JSON.stringify(syncData.recommendedGroups));
    }
    if (syncData.trustedPros) {
      await AsyncStorage.setItem(STORAGE_KEYS.trustedPros, JSON.stringify(syncData.trustedPros));
    }
    if (syncData.sectionsDefaultOpen !== undefined) {
      await AsyncStorage.setItem(STORAGE_KEYS.sectionsDefaultOpen, syncData.sectionsDefaultOpen.toString());
    }

    const queryKeys = ['appliances', 'tasks', 'budgetItems', 'monthlyBudget', 'homeProfile', 'recommendedGroups', 'trustedPros', 'sectionsDefaultOpen'];
    queryKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));

    console.log('[Auth] Cloud data applied and queries invalidated');
  }, [queryClient]);

  return useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login: loginMutation,
    register: registerMutation,
    signOut,
    syncStatus,
    lastSyncedAt,
    pushToCloud,
    pullFromCloud,
    applyCloudData,
  }), [user, isLoading, loginMutation, registerMutation, signOut, syncStatus, lastSyncedAt, pushToCloud, pullFromCloud, applyCloudData]);
});
