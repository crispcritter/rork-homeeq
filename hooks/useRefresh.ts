import { useCallback } from 'react';
import { useHome } from '@/contexts/HomeContext';

export function useRefresh() {
  const { refreshAll, isRefreshing } = useHome();

  const onRefresh = useCallback(async () => {
    await refreshAll();
  }, [refreshAll]);

  return { onRefresh, isRefreshing };
}
