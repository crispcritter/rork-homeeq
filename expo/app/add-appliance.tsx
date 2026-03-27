import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useHome } from '@/contexts/HomeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import ApplianceForm from '@/components/appliance-form/ApplianceForm';
import { Appliance } from '@/types';

export default function AddApplianceScreen() {
  const { addAppliance, appliances } = useHome();
  const { canAddAppliance } = useSubscription();
  const router = useRouter();

  useEffect(() => {
    if (!canAddAppliance(appliances.length)) {
      console.log('[AddAppliance] Free tier limit reached, redirecting to paywall');
      router.replace('/paywall');
    }
  }, [canAddAppliance, appliances.length, router]);

  if (!canAddAppliance(appliances.length)) {
    return null;
  }

  return (
    <ApplianceForm
      mode="add"
      onSave={(appliance: Appliance) => addAppliance(appliance)}
    />
  );
}
