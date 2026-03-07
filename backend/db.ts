const store = new Map<string, unknown>();

export function dbGet<T>(key: string): T | undefined {
  const value = store.get(key);
  if (value === undefined) return undefined;
  return value as T;
}

export function dbSet<T>(key: string, value: T): void {
  store.set(key, value);
}

export function dbDelete(key: string): boolean {
  return store.delete(key);
}

export function dbKeys(prefix: string): string[] {
  const keys: string[] = [];
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      keys.push(key);
    }
  }
  return keys;
}

export function dbHas(key: string): boolean {
  return store.has(key);
}
