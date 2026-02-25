import AsyncStorage from '@react-native-async-storage/async-storage';
import { sampleAppliances, sampleTasks, sampleBudgetItems } from '@/mocks/data';

export const STORAGE_KEYS = {
  appliances: 'home_appliances',
  tasks: 'home_tasks',
  budgetItems: 'home_budget_items',
  monthlyBudget: 'home_monthly_budget',
  initialized: 'home_initialized',
  homeProfile: 'home_profile',
  recommendedItems: 'home_recommended_items',
  trustedPros: 'home_trusted_pros',
} as const;

let initPromise: Promise<void> | null = null;

export function initializeData(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const initialized = await AsyncStorage.getItem(STORAGE_KEYS.initialized);
      if (!initialized) {
        console.log('[Storage] Seeding initial data...');
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.appliances, JSON.stringify(sampleAppliances)),
          AsyncStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(sampleTasks)),
          AsyncStorage.setItem(STORAGE_KEYS.budgetItems, JSON.stringify(sampleBudgetItems)),
          AsyncStorage.setItem(STORAGE_KEYS.monthlyBudget, '1500'),
          AsyncStorage.setItem(STORAGE_KEYS.initialized, 'true'),
        ]);
        console.log('[Storage] Initial data seeded');
      }
    } catch (e) {
      console.error('[Storage] initializeData error:', e);
      initPromise = null;
    }
  })();
  return initPromise;
}

export async function resetAllData(): Promise<void> {
  console.log('[Storage] Resetting all data to defaults...');
  initPromise = null;
  await Promise.all(
    Object.values(STORAGE_KEYS).map((key) => AsyncStorage.removeItem(key))
  );
  console.log('[Storage] All data cleared, will re-seed on next load');
}

export async function loadFromStorage<T>(key: string, fallback: T): Promise<T> {
  try {
    await initializeData();
    const data = await AsyncStorage.getItem(key);
    if (!data) return fallback;
    try {
      return JSON.parse(data) as T;
    } catch (parseError) {
      console.error(`[Storage] JSON.parse failed for key "${key}", returning fallback:`, parseError);
      return fallback;
    }
  } catch (e) {
    console.error(`[Storage] loadFromStorage error for key "${key}":`, e);
    return fallback;
  }
}

export async function loadMonthlyBudget(): Promise<number> {
  try {
    await initializeData();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.monthlyBudget);
    return data ? parseFloat(data) : 1500;
  } catch (e) {
    console.error('[Storage] loadMonthlyBudget error:', e);
    return 1500;
  }
}

export async function saveToStorage(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`[Storage] saveToStorage error for key "${key}":`, e);
    throw e;
  }
}

export async function saveMonthlyBudget(amount: number): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.monthlyBudget, amount.toString());
  } catch (e) {
    console.error('[Storage] saveMonthlyBudget error:', e);
    throw e;
  }
}
