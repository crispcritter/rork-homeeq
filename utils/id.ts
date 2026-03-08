import * as Crypto from 'expo-crypto';

export function generateId(prefix?: string): string {
  const uuid = Crypto.randomUUID();
  return prefix ? `${prefix}-${uuid}` : uuid;
}
