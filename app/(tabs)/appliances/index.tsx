import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Plus, Search, MapPin, Shield, ChevronRight } from 'lucide-react-native';
import { useHome } from '@/contexts/HomeContext';
import Colors from '@/constants/colors';
import PressableCard from '@/components/PressableCard';
import FloatingActionButton from '@/components/FloatingActionButton';
import ScreenHeader from '@/components/ScreenHeader';
import RecommendedChecklist from '@/components/RecommendedChecklist';
import { CATEGORY_AVATARS } from '@/constants/categories';
import { getWarrantyStatus } from '@/utils/dates';
import { lightImpact } from '@/utils/haptics';
import { RecommendedItem } from '@/mocks/recommendedItems';
import { Appliance } from '@/types';

export default function AppliancesScreen() {
  const router = useRouter();
  const {
    appliances,
    addAppliance,
    customRecommendedGroups,
    addRecommendedItem,
    removeRecommendedItem,
    duplicateRecommendedItem,
    syncRecommendedItem,
  } = useHome();
  const [search, setSearch] = useState('');

  const filtered = appliances.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.brand.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddAppliance = useCallback(() => {
    lightImpact();
    router.push('/add-appliance' as any);
  }, [router]);

  const handleAddRecommendedItem = useCallback((item: RecommendedItem) => {
    const newAppliance: Appliance = {
      id: Date.now().toString(),
      name: item.name,
      brand: '',
      model: '',
      serialNumber: '',
      category: item.category,
      purchaseDate: '',
      warrantyExpiry: '',
      notes: '',
      location: item.location,
    };
    addAppliance(newAppliance);
  }, [addAppliance]);

  const handleAppliancePress = useCallback((id: string) => {
    lightImpact();
    router.push(`/appliance/${id}` as any);
  }, [router]);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="My Items"
        subtitle={`${appliances.length} ${appliances.length === 1 ? 'item' : 'items'} tracked`}
      />

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Search size={16} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, brand, or type..."
            placeholderTextColor={Colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            testID="search-appliances"
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Search size={28} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {search ? 'No matches found' : 'Start tracking your home'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {search ? 'Try a different search term' : 'Add your first appliance or system to keep everything organized'}
            </Text>
            {!search && (
              <TouchableOpacity style={styles.emptyBtn} onPress={handleAddAppliance}>
                <Plus size={16} color={Colors.white} />
                <Text style={styles.emptyBtnText}>Add your first item</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filtered.map((appliance) => {
            const warranty = getWarrantyStatus(appliance.warrantyExpiry, Colors);
            const avatarColor = CATEGORY_AVATARS[appliance.category] || Colors.textTertiary;
            return (
              <PressableCard
                key={appliance.id}
                style={styles.card}
                onPress={() => handleAppliancePress(appliance.id)}
                testID={`appliance-${appliance.id}`}
              >
                <View style={styles.cardRow}>
                  {appliance.imageUrl ? (
                    <Image source={{ uri: appliance.imageUrl }} style={styles.cardImage} contentFit="cover" />
                  ) : (
                    <View style={[styles.cardImage, styles.cardImagePlaceholder, { backgroundColor: avatarColor + '18' }]}>
                      <Text style={[styles.cardImageText, { color: avatarColor }]}>{appliance.name[0]}</Text>
                    </View>
                  )}
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{appliance.name}</Text>
                    <Text style={styles.cardBrand} numberOfLines={1}>{appliance.brand}</Text>
                    <View style={styles.cardChips}>
                      {appliance.location ? (
                        <View style={styles.chip}>
                          <MapPin size={10} color={Colors.textSecondary} />
                          <Text style={styles.chipText}>{appliance.location}</Text>
                        </View>
                      ) : null}
                      <View style={[styles.warrantyChip, { backgroundColor: warranty.color + '18' }]}>
                        <Shield size={10} color={warranty.color} />
                        <Text style={[styles.chipText, { color: warranty.color }]}>{warranty.label}</Text>
                      </View>
                    </View>
                  </View>
                  <ChevronRight size={18} color={Colors.textTertiary} />
                </View>
              </PressableCard>
            );
          })
        )}
        <RecommendedChecklist
          appliances={appliances}
          recommendedGroups={customRecommendedGroups}
          onAddItem={handleAddRecommendedItem}
          onRemoveRecommendedItem={removeRecommendedItem}
          onDuplicateRecommendedItem={duplicateRecommendedItem}
          onSyncRecommendedItem={syncRecommendedItem}
          onAddCustomRecommendedItem={addRecommendedItem}
        />

        <View style={{ height: 90 }} />
      </ScrollView>

      <FloatingActionButton
        onPress={handleAddAppliance}
        color={Colors.primary}
        testID="add-appliance-btn"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
  },
  list: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 10,
    padding: 14,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardImage: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  cardImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImageText: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
    lineHeight: 22,
  },
  cardBrand: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
    lineHeight: 17,
  },
  cardChips: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  warrantyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
    textAlign: 'center',
    lineHeight: 26,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 21,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
    lineHeight: 20,
  },
});
