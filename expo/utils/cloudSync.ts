import { QueryClient } from '@tanstack/react-query';
import { Appliance, MaintenanceTask, BudgetItem, HomeProfile, TrustedPro } from '@/types';
import { DEFAULT_PROFILE } from '@/constants/defaultProfile';
import { RecommendedGroup, recommendedGroups as defaultRecommendedGroups } from '@/mocks/recommendedItems';
import { trpcClient } from '@/lib/trpc';

export function gatherSyncPayload(queryClient: QueryClient) {
  return {
    appliances: queryClient.getQueryData<Appliance[]>(['appliances']) ?? [],
    tasks: queryClient.getQueryData<MaintenanceTask[]>(['tasks']) ?? [],
    budgetItems: queryClient.getQueryData<BudgetItem[]>(['budgetItems']) ?? [],
    monthlyBudget: queryClient.getQueryData<number>(['monthlyBudget']) ?? 1500,
    homeProfile: queryClient.getQueryData<HomeProfile>(['homeProfile']) ?? DEFAULT_PROFILE,
    recommendedGroups: queryClient.getQueryData<RecommendedGroup[]>(['recommendedGroups']) ?? defaultRecommendedGroups,
    trustedPros: queryClient.getQueryData<TrustedPro[]>(['trustedPros']) ?? [],
    sectionsDefaultOpen: queryClient.getQueryData<boolean>(['sectionsDefaultOpen']) ?? true,
  };
}

export async function pushSyncPayload(queryClient: QueryClient) {
  const payload = gatherSyncPayload(queryClient);
  return trpcClient.sync.push.mutate(payload);
}
