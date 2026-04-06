import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';

const ENTITLEMENT_ID = 'HomeEQ Pro';
const FREE_APPLIANCE_LIMIT = 3;
const FREE_TASK_LIMIT = 5;

function getRCToken() {
  if (__DEV__ || Platform.OS === 'web')
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY,
  });
}

let rcConfigured = false;

function configureRC() {
  if (rcConfigured) return;
  const apiKey = getRCToken();
  if (!apiKey) {
    console.warn('[Subscription] No RevenueCat API key found');
    return;
  }
  try {
    Purchases.configure({ apiKey });
    if (__DEV__) {
      void Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
    rcConfigured = true;
    console.log('[Subscription] RevenueCat configured');
  } catch (e) {
    console.error('[Subscription] Failed to configure RevenueCat:', e);
  }
}

configureRC();

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);

  const customerInfoQuery = useQuery<CustomerInfo | null>({
    queryKey: ['rc_customerInfo'],
    queryFn: async () => {
      if (!rcConfigured) {
        console.log('[Subscription] RevenueCat not configured, skipping customer info fetch');
        return null;
      }
      try {
        const info = await Purchases.getCustomerInfo();
        console.log('[Subscription] Customer info fetched:', JSON.stringify(info.entitlements.active));
        return info;
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error('[Subscription] Failed to get customer info:', message);
        return null;
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: rcConfigured ? 2 : 0,
  });

  const offeringsQuery = useQuery<PurchasesOffering | null>({
    queryKey: ['rc_offerings'],
    queryFn: async () => {
      if (!rcConfigured) {
        console.log('[Subscription] RevenueCat not configured, skipping offerings fetch');
        return null;
      }
      try {
        const offerings = await Purchases.getOfferings();
        console.log('[Subscription] Offerings fetched:', offerings.current?.identifier);
        return offerings.current ?? null;
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error('[Subscription] Failed to get offerings:', message);
        return null;
      }
    },
    staleTime: 1000 * 60 * 10,
    retry: rcConfigured ? 2 : 0,
  });

  const isPro = useMemo(() => {
    const info = customerInfoQuery.data;
    if (!info) return false;
    return typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
  }, [customerInfoQuery.data]);

  const offering = useMemo(() => offeringsQuery.data ?? null, [offeringsQuery.data]);

  const monthlyPackage = useMemo(
    () => offering?.monthly ?? null,
    [offering],
  );

  const annualPackage = useMemo(
    () => offering?.annual ?? null,
    [offering],
  );

  const purchaseMutation = useMutation({
    mutationFn: async (pkg: PurchasesPackage) => {
      console.log('[Subscription] Purchasing package:', pkg.identifier);
      const result = await Purchases.purchasePackage(pkg);
      return result;
    },
    onSuccess: (result) => {
      console.log('[Subscription] Purchase success:', result.customerInfo.entitlements.active);
      queryClient.setQueryData(['rc_customerInfo'], result.customerInfo);
    },
    onError: (error: unknown) => {
      if (error && typeof error === 'object' && 'userCancelled' in error && (error as { userCancelled?: boolean }).userCancelled) {
        console.log('[Subscription] User cancelled purchase');
      } else {
        console.error('[Subscription] Purchase failed:', error);
      }
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      console.log('[Subscription] Restoring purchases...');
      const info = await Purchases.restorePurchases();
      return info;
    },
    onSuccess: (info) => {
      console.log('[Subscription] Restore success:', info.entitlements.active);
      queryClient.setQueryData(['rc_customerInfo'], info);
    },
    onError: (error) => {
      console.error('[Subscription] Restore failed:', error);
    },
  });

  const purchase = useCallback(
    (pkg: PurchasesPackage) => purchaseMutation.mutateAsync(pkg),
    [purchaseMutation],
  );

  const restore = useCallback(
    () => restoreMutation.mutateAsync(),
    [restoreMutation],
  );

  const canAddAppliance = useCallback(
    (currentCount: number) => isPro || currentCount < FREE_APPLIANCE_LIMIT,
    [isPro],
  );

  const canAddTask = useCallback(
    (currentCount: number) => isPro || currentCount < FREE_TASK_LIMIT,
    [isPro],
  );

  useEffect(() => {
    if (!rcConfigured) return;
    const listener = async (info: CustomerInfo) => {
      console.log('[Subscription] Customer info updated via listener');
      queryClient.setQueryData(['rc_customerInfo'], info);
    };
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [queryClient]);

  return useMemo(
    () => ({
      isPro,
      offering,
      monthlyPackage,
      annualPackage,
      selectedPackage,
      setSelectedPackage,
      purchase,
      restore,
      isPurchasing: purchaseMutation.isPending,
      isRestoring: restoreMutation.isPending,
      purchaseError: purchaseMutation.error,
      restoreError: restoreMutation.error,
      isLoadingOfferings: offeringsQuery.isLoading,
      isLoadingCustomerInfo: customerInfoQuery.isLoading,
      canAddAppliance,
      canAddTask,
      FREE_APPLIANCE_LIMIT,
      FREE_TASK_LIMIT,
    }),
    [
      isPro, offering, monthlyPackage, annualPackage,
      selectedPackage, purchase, restore,
      purchaseMutation.isPending, restoreMutation.isPending,
      purchaseMutation.error, restoreMutation.error,
      offeringsQuery.isLoading, customerInfoQuery.isLoading,
      canAddAppliance, canAddTask,
    ],
  );
});
