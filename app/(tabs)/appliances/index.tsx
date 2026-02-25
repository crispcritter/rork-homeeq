import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  Plus,
  Search,
  MapPin,
  Shield,
  ChevronRight,
  ArrowUpDown,
  Check,
} from 'lucide-react-native';
import { useHome } from '@/contexts/HomeContext';
import { ColorScheme } from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';
import PressableCard from '@/components/PressableCard';
import FloatingActionButton from '@/components/FloatingActionButton';
import ScreenHeader from '@/components/ScreenHeader';
import RecommendedChecklist from '@/components/RecommendedChecklist';
import { CATEGORY_AVATARS } from '@/constants/categories';
import { getWarrantyStatus } from '@/utils/dates';
import { lightImpact } from '@/utils/haptics';
import { rowsToCSV, buildHtmlReport } from '@/utils/export';
import ExportSection from '@/components/ExportSection';
import { RecommendedItem } from '@/mocks/recommendedItems';
import { Appliance, asISODateString } from '@/types';
import { categoryLabels } from '@/constants/categories';

type SortOption = 'name' | 'category' | 'location' | 'warranty';

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Type' },
  { key: 'location', label: 'Location' },
  { key: 'warranty', label: 'Warranty' },
];



export default function AppliancesScreen() {
  const router = useRouter();
  const { colors: c } = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const {
    appliances,
    addAppliance,
    customRecommendedGroups,
    addRecommendedItem,
    removeRecommendedItem,
    duplicateRecommendedItem,
    syncRecommendedItem,
    trustedPros,
    refreshAll,
    isRefreshing,
  } = useHome();

  const onRefresh = useCallback(async () => {
    await refreshAll();
  }, [refreshAll]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const filtered = useMemo(() => {
    const list = appliances.filter(
      (a) =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.brand.toLowerCase().includes(search.toLowerCase()) ||
        a.category.toLowerCase().includes(search.toLowerCase())
    );

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'category': {
          const catA = categoryLabels[a.category] || a.category || '';
          const catB = categoryLabels[b.category] || b.category || '';
          const catCmp = catA.localeCompare(catB);
          return catCmp !== 0 ? catCmp : (a.name || '').localeCompare(b.name || '');
        }
        case 'location': {
          const locA = a.location || 'zzz';
          const locB = b.location || 'zzz';
          const locCmp = locA.localeCompare(locB);
          return locCmp !== 0 ? locCmp : (a.name || '').localeCompare(b.name || '');
        }
        case 'warranty': {
          const wA = getWarrantyStatus(a.warrantyExpiry, c);
          const wB = getWarrantyStatus(b.warrantyExpiry, c);
          const order: Record<string, number> = { 'Expiring Soon': 0, 'Covered': 1, 'Expired': 2, 'Unknown': 3 };
          const oA = order[wA.label] ?? 4;
          const oB = order[wB.label] ?? 4;
          if (oA !== oB) return oA - oB;
          return wB.daysLeft - wA.daysLeft;
        }
        default:
          return 0;
      }
    });
  }, [appliances, search, sortBy, c]);

  const proNameByApplianceId = useMemo(() => {
    const map = new Map<string, string>();
    for (const pro of trustedPros) {
      for (const id of pro.linkedApplianceIds ?? []) {
        map.set(id, pro.name);
      }
    }
    return map;
  }, [trustedPros]);

  const buildItemRows = useCallback((items: Appliance[]): string[][] => {
    const headers = [
      'Name',
      'Location',
      'Purchase Date',
      'Warranty',
      'Warranty Expiration',
      'Serial Number',
      'Type',
      'Notes',
      'Trusted Pro',
    ];
    const rows = items.map((item) => [
      item.name || '',
      item.location || '',
      item.purchaseDate || '',
      item.hasWarranty ? 'Yes' : (item.warrantyExpiry ? 'Yes' : 'No'),
      item.warrantyExpiry || '',
      item.serialNumber || '',
      item.category || '',
      item.notes || '',
      proNameByApplianceId.get(item.id) ?? '',
    ]);
    return [headers, ...rows];
  }, [proNameByApplianceId]);

  const getCSV = useCallback((): string => {
    return rowsToCSV(buildItemRows(appliances));
  }, [buildItemRows, appliances]);

  const getHTML = useCallback((): string => {
    const rows = buildItemRows(appliances);
    return buildHtmlReport({
      title: 'HomeEQ Items Report',
      headers: rows[0],
      dataRows: rows.slice(1),
      footerLabel: 'HomeEQ &mdash; Home Item Tracker',
    });
  }, [buildItemRows, appliances]);

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
      purchaseDate: asISODateString(''),
      warrantyExpiry: asISODateString(''),
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
          <Search size={16} color={c.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, brand, or type..."
            placeholderTextColor={c.textTertiary}
            value={search}
            onChangeText={setSearch}
            testID="search-appliances"
          />
        </View>
      </View>

      <View style={styles.sortRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortScrollContent}>
          {SORT_OPTIONS.map((opt) => {
            const active = sortBy === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.sortChip, active && { backgroundColor: c.primary + '18', borderColor: c.primary }]}
                onPress={() => setSortBy(opt.key)}
                activeOpacity={0.7}
                testID={`sort-${opt.key}`}
              >
                {active && <Check size={12} color={c.primary} />}
                <Text style={[styles.sortChipText, active && { color: c.primary, fontWeight: '600' as const }]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />
        }
        testID="appliance-scroll"
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Search size={28} color={c.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {search ? 'No matches found' : 'Start tracking your home'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {search ? 'Try a different search term' : 'Add your first appliance or system to keep everything organized'}
            </Text>
            {!search && (
              <TouchableOpacity style={styles.emptyBtn} onPress={handleAddAppliance}>
                <Plus size={16} color={c.white} />
                <Text style={styles.emptyBtnText}>Add your first item</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filtered.map((appliance) => {
            const warranty = getWarrantyStatus(appliance.warrantyExpiry, c);
            const avatarColor = CATEGORY_AVATARS[appliance.category] || c.textTertiary;
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
                      <Text style={[styles.cardImageText, { color: avatarColor }]}>{appliance.name?.[0] ?? '?'}</Text>
                    </View>
                  )}
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{appliance.name}</Text>
                    <Text style={styles.cardBrand} numberOfLines={1}>{appliance.brand}</Text>
                    <View style={styles.cardChips}>
                      {appliance.location ? (
                        <View style={styles.chip}>
                          <MapPin size={10} color={c.textSecondary} />
                          <Text style={styles.chipText}>{appliance.location}</Text>
                        </View>
                      ) : null}
                      <View style={[styles.warrantyChip, { backgroundColor: warranty.color + '18' }]}>
                        <Shield size={10} color={warranty.color} />
                        <Text style={[styles.chipText, { color: warranty.color }]}>{warranty.label}</Text>
                      </View>
                    </View>
                  </View>
                  <ChevronRight size={18} color={c.textTertiary} />
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

        <ExportSection
          getCSV={getCSV}
          getHTML={getHTML}
          filePrefix="HomeEQ_Items"
          entityName="items"
          entityCount={appliances.length}
          emailSubject={`HomeEQ Items Report - ${new Date().toLocaleDateString()}`}
          emailBodyHtml={`<p>Please find attached the HomeEQ items report with ${appliances.length} item${appliances.length !== 1 ? 's' : ''}.</p>`}
          subtitle="Download your items data"
          testIDPrefix="items-export"
        />

        <View style={{ height: 90 }} />
      </ScrollView>

      <FloatingActionButton
        onPress={handleAddAppliance}
        color={c.primary}
        testID="add-appliance-btn"
      />
    </View>
  );
}

const createStyles = (c: ColorScheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  searchRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  sortRow: {
    paddingBottom: 8,
  },
  sortScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
    paddingVertical: 4,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  sortChipText: {
    fontSize: 13,
    color: c.textSecondary,
    fontWeight: '500' as const,
    lineHeight: 17,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: c.text,
    lineHeight: 20,
  },
  list: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: 16,
    marginBottom: 10,
    padding: 14,
    shadowColor: c.cardShadow,
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
    color: c.text,
    marginBottom: 2,
    lineHeight: 22,
  },
  cardBrand: {
    fontSize: 13,
    color: c.textSecondary,
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
    backgroundColor: c.surfaceAlt,
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
    color: c.textSecondary,
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
    backgroundColor: c.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: c.text,
    marginBottom: 6,
    textAlign: 'center',
    lineHeight: 26,
  },
  emptySubtitle: {
    fontSize: 15,
    color: c.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 21,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: c.primary,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: c.white,
    lineHeight: 20,
  },
  exportSection: {
    marginTop: 20,
    marginBottom: 8,
  },
  exportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: c.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 1,
  },
  exportHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  exportHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportHeaderTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: c.text,
    lineHeight: 21,
  },
  exportHeaderSubtitle: {
    fontSize: 12,
    color: c.textTertiary,
    lineHeight: 16,
    marginTop: 1,
  },
  exportGrid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  exportGridItem: {
    width: '48%' as any,
    backgroundColor: c.surface,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: c.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  exportGridIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  exportGridTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: c.text,
    lineHeight: 18,
    textAlign: 'center' as const,
  },
  exportGridDesc: {
    fontSize: 11,
    color: c.textTertiary,
    lineHeight: 15,
    marginTop: 2,
    textAlign: 'center' as const,
  },
});
