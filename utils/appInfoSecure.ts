import * as SecureStore from 'expo-secure-store';

// SecureStore has no enumeration API — there is no way to list all stored keys.
// If an appliance is deleted without calling deleteAppPassword (e.g. a bug in
// the delete flow), its SecureStore entry becomes an orphan that cannot be
// discovered or cleaned up. Callers that delete appliances must ensure they
// also call deleteAppPassword for the same ID.
const APP_PW_PREFIX = 'appinfo_pw_';
const SECURE_STORE_MAX_KEY_BYTES = 2048;

function keyFor(applianceId: string): string {
  if (!applianceId || !applianceId.trim()) {
    throw new Error('[AppInfoSecure] applianceId must be a non-empty string');
  }
  const key = `${APP_PW_PREFIX}${applianceId}`;
  const byteLength = new TextEncoder().encode(key).length;
  if (byteLength > SECURE_STORE_MAX_KEY_BYTES) {
    throw new Error(
      `[AppInfoSecure] SecureStore key exceeds ${SECURE_STORE_MAX_KEY_BYTES}-byte limit (got ${byteLength}): "${key.slice(0, 40)}..."`
    );
  }
  return key;
}

export async function getAppPassword(applianceId: string): Promise<string | null> {
  try {
    const value = await SecureStore.getItemAsync(keyFor(applianceId));
    console.log('[AppInfoSecure] Retrieved password for appliance:', applianceId, value ? '(present)' : '(empty)');
    return value;
  } catch (e) {
    console.error('[AppInfoSecure] Failed to read password for', applianceId, e);
    return null;
  }
}

export async function setAppPassword(applianceId: string, password: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(keyFor(applianceId), password);
    console.log('[AppInfoSecure] Saved password for appliance:', applianceId);
  } catch (e) {
    console.error('[AppInfoSecure] Failed to save password for', applianceId, e);
    throw e;
  }
}

export async function deleteAppPassword(applianceId: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(keyFor(applianceId));
    console.log('[AppInfoSecure] Deleted password for appliance:', applianceId);
  } catch (e) {
    console.error('[AppInfoSecure] Failed to delete password for', applianceId, e);
  }
}
