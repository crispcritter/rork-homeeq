import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { generateId } from '@/utils/id';
import { Image } from 'expo-image';
import {
  Plus,
  Search,
  MapPin,
  Shield,
  ChevronRight,
  Check,
  WifiOff,
} from 'lucide-react-native';
import { useHome } from '@/contexts/HomeContext';
import { useTheme } from '@/contexts/ThemeContext';

import PressableCard from '@/components/PressableCard';
import SwipeableRow from '@/components/SwipeableRow';
import FloatingActionButton from '@/components/FloatingActionButton';
import ScreenHeader from '@/components/ScreenHeader';
import RecommendedChecklist from '@/components/RecommendedChecklist';
import { CATEGORY_AVATARS } from '@/constants/categories';
import { getWarrantyStatus } from '@/utils/dates';
import { Trash2, Pencil } from 'lucide-react-native';
import { lightImpact, warningNotification } from '@/utils/haptics';
import { rowsToCSV, buildHtmlReport } from '@/utils/export';
import createStyles from '@/styles/appliances';
import ExportSection from '@/components/ExportSection';
import { RecommendedItem } from '@/mocks/recommendedItems';
import { Appliance } from '@/types';
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
    deleteAppliance,
    customRecommendedGroups,
    addRecommendedItem,
    removeRecommendedItem,
    duplicateRecommendedItem,
    syncRecommendedItem,
    trustedPros,
    isError,
    refreshAll,
    isRefreshing,
  } = useHome();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('name');

  useEffect(() => {
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 150);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search]);

  const filtered = useMemo(() => {
    const lowerSearch = debouncedSearch.toLowerCase();
    const list = appliances.filter(
      (a) =>
        a.name.toLowerCase().includes(lowerSearch) ||
        a.brand.toLowerCase().includes(lowerSearch) ||
        a.category.toLowerCase().includes(lowerSearch) ||
        (a.location || '').toLowerCase().includes(lowerSearch) ||
        (a.model || '').toLowerCase().includes(lowerSearch) ||
        (a.serialNumber || '').toLowerCase().includes(lowerSearch)
    );

    const withWarranty = list.map((a) => ({
      appliance: a,
      warranty: getWarrantyStatus(a.warrantyExpiry ?? ''),
    }));

    const warrantyOrder: Record<string, number> = { 'Expiring Soon': 0, 'Covered': 1, 'Expired': 2, 'Unknown': 3 };

    withWarranty.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.appliance.name || '').localeCompare(b.appliance.name || '');
        case 'category': {
          const catA = categoryLabels[a.appliance.category] || a.appliance.category || '';
          const catB = categoryLabels[b.appliance.category] || b.appliance.category || '';
          const catCmp = catA.localeCompare(catB);
          return catCmp !== 0 ? catCmp : (a.appliance.name || '').localeCompare(b.appliance.name || '');
        }
        case 'location': {
          const locA = a.appliance.location || 'zzz';
          const locB = b.appliance.location || 'zzz';
          const locCmp = locA.localeCompare(locB);
          return locCmp !== 0 ? locCmp : (a.appliance.name || '').localeCompare(b.appliance.name || '');
        }
        case 'warranty': {
          const oA = warrantyOrder[a.warranty.label] ?? 4;
          const oB = warrantyOrder[b.warranty.label] ?? 4;
          if (oA !== oB) return oA - oB;
          return (b.warranty.daysLeft ?? -Infinity) - (a.warranty.daysLeft ?? -Infinity);
        }
        default:
          return 0;
      }
    });

    return withWarranty;
  }, [appliances, debouncedSearch, sortBy]);

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
      (item.hasWarranty || item.warrantyExpiry) ? 'Yes' : 'No',
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
    router.push('/add-appliance');
  }, [router]);

  const handleAddRecommendedItem = useCallback((item: RecommendedItem) => {
    const newAppliance: Appliance = {
      id: generateId('appliance'),
      name: item.name,
      brand: '',
      model: '',
      serialNumber: '',
      category: item.category,
      purchaseDate: undefined,
      warrantyExpiry: undefined,
      notes: '',
      location: item.location,
    };
    addAppliance(newAppliance);
  }, [addAppliance]);

  const handleAppliancePress = useCallback((id: string) => {
    lightImpact();
    router.push({ pathname: '/appliance/[id]', params: { id } });
  }, [router]);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="My Items"
        subtitle={`${appliances.length} ${appliances.length === 1 ? 'item' : 'items'} tracked`}
      />

      {isError && (
        <TouchableOpacity
          style={[styles.errorBanner, { backgroundColor: c.warningLight }]}
          onPress={refreshAll}
          activeOpacity={0.7}
        >
          <WifiOff size={16} color={c.warning} />
          <View style={styles.errorBannerContent}>
            <Text style={[styles.errorBannerTitle, { color: c.warning }]}>Couldn't load some data</Text>
            <Text style={[styles.errorBannerSubtitle, { color: c.warning }]}>Tap to retry</Text>
          </View>
          <ChevronRight size={14} color={c.warning} />
        </TouchableOpacity>
      )}

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Search size={16} color={c.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, brand, type, location..."
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
                <Text style={[styles.sortChipText, active && { color: c.primary, fontWeight: '600' }]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshAll} tintColor={c.primary} colors={[c.primary]} />
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
          filtered.map(({ appliance, warranty }) => {
            const avatarColor = CATEGORY_AVATARS[appliance.category] || c.textTertiary;
            return (
              <SwipeableRow
                key={appliance.id}
                rightActions={[
                  {
                    icon: <Pencil size={20} color="#FFFFFF" />,
                    label: 'Edit',
                    color: '#3B82F6',
                    onPress: () => {
                      lightImpact();
                      router.push({ pathname: '/edit-appliance', params: { id: appliance.id } });
                    },
                  },
                  {
                    icon: <Trash2 size={20} color="#FFFFFF" />,
                    label: 'Delete',
                    color: c.danger ?? '#DC2626',
                    onPress: () => {
                      Alert.alert(
                        'Remove Item',
                        `Remove "${appliance.name}"? This can't be undone.`,
                        [
                          { text: 'Keep it', style: 'cancel' },
                          {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: () => {
                              warningNotification();
                              deleteAppliance(appliance.id);
                            },
                          },
                        ]
                      );
                    },
                  },
                ]}
              >
              <PressableCard
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
                      <View style={[styles.warrantyChip, { backgroundColor: c[warranty.colorKey] + '18' }]}>
                        <Shield size={10} color={c[warranty.colorKey]} />
                        <Text style={[styles.chipText, { color: c[warranty.colorKey] }]}>{warranty.label}</Text>
                      </View>
                    </View>
                  </View>
                  <ChevronRight size={18} color={c.textTertiary} />
                </View>
              </PressableCard>
              </SwipeableRow>
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
