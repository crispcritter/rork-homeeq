import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { Appliance } from '@/types';

interface ApplianceChipSelectorProps {
  appliances: Appliance[];
  selectedId: string;
  onSelect: (id: string) => void;
}

function ApplianceChipSelector({ appliances, selectedId, onSelect }: ApplianceChipSelectorProps) {
  if (appliances.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <TouchableOpacity
        style={[styles.chip, !selectedId && styles.chipActive]}
        onPress={() => onSelect('')}
        activeOpacity={0.7}
      >
        <Text style={[styles.chipText, !selectedId && styles.chipTextActive]}>
          None
        </Text>
      </TouchableOpacity>
      {appliances.map((a) => (
        <TouchableOpacity
          key={a.id}
          style={[styles.chip, selectedId === a.id && styles.chipActive]}
          onPress={() => onSelect(a.id)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, selectedId === a.id && styles.chipTextActive]}>
            {a.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  chipTextActive: {
    color: Colors.white,
  },
});

export default React.memo(ApplianceChipSelector);
