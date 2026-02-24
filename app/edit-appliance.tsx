import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useHome } from '@/contexts/HomeContext';
import ApplianceForm from '@/components/appliance-form/ApplianceForm';
import { Appliance } from '@/types';
import { formStyles as styles } from '@/components/appliance-form/styles';

export default function EditApplianceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getApplianceById, updateAppliance } = useHome();

  const appliance = getApplianceById(id ?? '');

  if (!appliance) {
    return (
      <View style={styles.notFound}>
        <Stack.Screen options={{ title: 'Edit Item' }} />
        <Text style={styles.notFoundText}>Item not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: `Edit ${appliance.name}` }} />
      <ApplianceForm
        mode="edit"
        initialData={appliance}
        onSave={(updated: Appliance) => updateAppliance(updated)}
      />
    </>
  );
}
