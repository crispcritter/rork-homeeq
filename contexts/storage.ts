import AsyncStorage from '@react-native-async-storage/async-storage';
import { sampleAppliances, sampleTasks, sampleBudgetItems } from '@/mocks/data';
import type { Appliance, MaintenanceTask, BudgetItem, HomeProfile, TrustedPro } from '@/types';

type Validator<T> = (value: unknown) => value is T;

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
  sectionsDefaultOpen: 'home_sections_default_open',
} as const;

export const CURRENT_SCHEMA_VERSION = 2;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isArrayOf<T>(arr: unknown, check: (item: unknown) => item is T): arr is T[] {
  return Array.isArray(arr) && arr.every(check);
}

function isAppliance(v: unknown): v is Appliance {
  return isRecord(v) && typeof v.id === 'string' && typeof v.name === 'string' && typeof v.category === 'string';
}

function isTask(v: unknown): v is MaintenanceTask {
  return isRecord(v) && typeof v.id === 'string' && typeof v.title === 'string' && typeof v.status === 'string';
}

function isBudgetItem(v: unknown): v is BudgetItem {
  return isRecord(v) && typeof v.id === 'string' && typeof v.category === 'string' && typeof v.amount === 'number';
}

function isHomeProfile(v: unknown): v is HomeProfile {
  return isRecord(v) && typeof v.id === 'string' && typeof v.nickname === 'string' && typeof v.homeType === 'string';
}

function isTrustedPro(v: unknown): v is TrustedPro {
  return isRecord(v) && typeof v.id === 'string' && typeof v.name === 'string' && typeof v.specialty === 'string';
}

const validators: Record<string, Validator<unknown>> = {
  [STORAGE_KEYS.appliances]: ((v: unknown) => isArrayOf(v, isAppliance)) as Validator<unknown>,
  [STORAGE_KEYS.tasks]: ((v: unknown) => isArrayOf(v, isTask)) as Validator<unknown>,
  [STORAGE_KEYS.budgetItems]: ((v: unknown) => isArrayOf(v, isBudgetItem)) as Validator<unknown>,
  [STORAGE_KEYS.homeProfile]: isHomeProfile as Validator<unknown>,
  [STORAGE_KEYS.trustedPros]: ((v: unknown) => isArrayOf(v, isTrustedPro)) as Validator<unknown>,
  [STORAGE_KEYS.recommendedItems]: ((v: unknown) => Array.isArray(v)) as Validator<unknown>,
};

type MigrationFn = () => Promise<void>;

function migrateStringToNumeric(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return isNaN(value) ? null : value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const parsed = Number(trimmed);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

const NUMERIC_PROFILE_FIELDS = [
  'yearBuilt',
  'squareFootage',
  'lotSize',
  'bedrooms',
  'bathrooms',
  'stories',
  'roofAge',
  'hoaAmount',
] as const;

const migrations: Record<number, MigrationFn> = {
  2: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.homeProfile);
    if (raw) {
      try {
        const profile = JSON.parse(raw) as Record<string, unknown>;
        for (const field of NUMERIC_PROFILE_FIELDS) {
          if (field in profile) {
            profile[field] = migrateStringToNumeric(profile[field]);
          }
        }
        await AsyncStorage.setItem(STORAGE_KEYS.homeProfile, JSON.stringify(profile));
        console.log('[Migration] v2: Converted HomeProfile numeric fields from string to number|null');
      } catch (e) {
        console.error('[Migration] v2 HomeProfile migration failed:', e);
      }
    }
  },
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
      const parsed: unknown = JSON.parse(data);
      const validator = validators[key];
      if (validator && !validator(parsed)) {
        console.warn(`[Storage] Type validation failed for key "${key}", returning fallback`);
        return fallback;
      }
      return parsed as T;
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
