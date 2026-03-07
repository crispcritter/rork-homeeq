export function redirectSystemPath({
  path,
}: { path: string; initial: boolean }) {
  if (path.includes('/join/')) {
    const code = path.split('/join/').pop()?.split('?')[0]?.trim();
    if (code) {
      console.log('[DeepLink] Invite code detected:', code);
      return `/join-household?code=${code}`;
    }
  }

  return '/';
}
