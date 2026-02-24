import React from 'react';
import { useHome } from '@/contexts/HomeContext';
import ApplianceForm from '@/components/appliance-form/ApplianceForm';
import { Appliance } from '@/types';

export default function AddApplianceScreen() {
  const { addAppliance } = useHome();

  return (
    <ApplianceForm
      mode="add"
      onSave={(appliance: Appliance) => addAppliance(appliance)}
    />
  );
}
