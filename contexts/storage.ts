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
  schemaVersion: 'home_schema_version',
} as const;

export const CURRENT_SCHEMA_VERSION = 1;

type MigrationFn = () => Promise<void>;

const migrations: Record<number, MigrationFn> = {
  // Example migration for version 2:
  // 2: async () => {
  //   const raw = await AsyncStorage.getItem(STORAGE_KEYS.appliances);
  //   if (raw) {
  //     try {
  //       const appliances = JSON.parse(raw) as Record<string, unknown>[];
  //       const migrated = appliances.map((a) => ({
  //         ...a,
  //         newField: a.newField ?? 'default',
  //       }));
  //       await AsyncStorage.setItem(STORAGE_KEYS.appliances, JSON.stringify(migrated));
  //     } catch (e) {
  //       console.error('[Migration] v2 appliances migration failed:', e);
  //     }
  //   }
  // },
};

async function runMigrations(): Promise<void> {
  let currentVersion = 0;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.schemaVersion);
    if (stored) {
      currentVersion = parseInt(stored, 10) || 0;
    }
  } catch (e) {
    console.error('[Storage] Failed to read schema version, assuming 0:', e);
  }

  if (currentVersion >= CURRENT_SCHEMA_VERSION) {
    return;
  }

  console.log(`[Storage] Migrating from schema v${currentVersion} to v${CURRENT_SCHEMA_VERSION}`);

  for (let v = currentVersion + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
    const migrationFn = migrations[v];
    if (migrationFn) {
      try {
        console.log(`[Storage] Running migration to v${v}...`);
        await migrationFn();
        console.log(`[Storage] Migration to v${v} complete`);
      } catch (e) {
        console.error(`[Storage] Migration to v${v} failed:`, e);
      }
    }
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.schemaVersion, v.toString());
    } catch (e) {
      console.error(`[Storage] Failed to persist schema version ${v}:`, e);
    }
  }

  console.log(`[Storage] All migrations complete, now at v${CURRENT_SCHEMA_VERSION}`);
}

let initPromise: Promise<void> | null = null;
let initRetryCount = 0;
const MAX_INIT_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 500;

export function initializeData(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      await runMigrations();
      const initialized = await AsyncStorage.getItem(STORAGE_KEYS.initialized);
      if (!initialized) {
        console.log('[Storage] Seeding initial data...');
        await AsyncStorage.setItem(STORAGE_KEYS.appliances, JSON.stringify(sampleAppliances));
        await AsyncStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(sampleTasks));
        await AsyncStorage.setItem(STORAGE_KEYS.budgetItems, JSON.stringify(sampleBudgetItems));
        await AsyncStorage.setItem(STORAGE_KEYS.monthlyBudget, '1500');
        await AsyncStorage.setItem(STORAGE_KEYS.initialized, 'true');
        console.log('[Storage] Initial data seeded');
      }
      initRetryCount = 0;
    } catch (e) {
      console.error('[Storage] initializeData error:', e);
      initPromise = null;
      initRetryCount++;
      if (initRetryCount >= MAX_INIT_RETRIES) {
        console.error(`[Storage] initializeData failed ${initRetryCount} times, halting retries to prevent loop`);
        initPromise = Promise.resolve();
      } else {
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, initRetryCount - 1);
        console.warn(`[Storage] Will allow retry #${initRetryCount} after ${delay}ms backoff`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  })();
  return initPromise;
}

export async function resetAllData(): Promise<void> {
  console.log('[Storage] Resetting all data to defaults...');
  initPromise = null;
  initRetryCount = 0;
  const results = await Promise.allSettled(
    Object.values(STORAGE_KEYS)
      .filter((key) => key !== STORAGE_KEYS.schemaVersion)
      .map((key) => AsyncStorage.removeItem(key))
  );
  const failures = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
  if (failures.length > 0) {
    console.error(`[Storage] ${failures.length} key(s) failed to remove during reset:`, failures.map((f) => f.reason));
  }
  console.log('[Storage] Reset complete, will re-seed on next load');
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
