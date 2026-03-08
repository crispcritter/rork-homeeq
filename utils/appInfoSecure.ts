import * as SecureStore from 'expo-secure-store';

const APP_PW_PREFIX = 'appinfo_pw_';

function keyFor(applianceId: string): string {
  if (!applianceId || !applianceId.trim()) {
    throw new Error('[AppInfoSecure] applianceId must be a non-empty string');
  }
  return `${APP_PW_PREFIX}${applianceId}`;
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
