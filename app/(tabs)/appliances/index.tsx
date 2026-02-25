import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  Plus,
  Search,
  MapPin,
  Shield,
  ChevronRight,
  Download,
  ChevronDown,
  ChevronUp,
  Mail,
  FileDown,
  Share2,
  Printer,
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
import { lightImpact, mediumImpact, successNotification } from '@/utils/haptics';
import { File, Paths } from 'expo-file-system';
import { shareAsync, isAvailableAsync } from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import * as Print from 'expo-print';
import { RecommendedItem } from '@/mocks/recommendedItems';
import { Appliance } from '@/types';

function escapeCSVField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

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
  } = useHome();
  const [search, setSearch] = useState('');
  const [exportExpanded, setExportExpanded] = useState<boolean>(false);
  const exportAnim = useRef(new Animated.Value(0)).current;
  const { trustedPros } = useHome();

  const filtered = appliances.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.brand.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
  );

  const toggleExport = useCallback(() => {
    lightImpact();
    const toValue = exportExpanded ? 0 : 1;
    setExportExpanded(!exportExpanded);
    Animated.timing(exportAnim, {
      toValue,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [exportExpanded, exportAnim]);

  const getLinkedProName = useCallback((applianceId: string): string => {
    const pro = trustedPros.find((p) => (p.linkedApplianceIds ?? []).includes(applianceId));
    return pro?.name ?? '';
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
      getLinkedProName(item.id),
    ]);
    return [headers, ...rows];
  }, [getLinkedProName]);

  const generateCSV = useCallback((items: Appliance[]): string => {
    const allRows = buildItemRows(items);
    return allRows.map((row) => row.map(escapeCSVField).join(',')).join('\r\n');
  }, [buildItemRows]);

  const buildHtmlTable = useCallback((items: Appliance[]): string => {
    const rows = buildItemRows(items);
    const headers = rows[0];
    const dataRows = rows.slice(1);
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body { font-family: -apple-system, Helvetica Neue, Arial, sans-serif; padding: 24px; color: #1a1a2e; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .subtitle { color: #6b7280; font-size: 13px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #1a1a2e; color: #fff; padding: 8px 10px; text-align: left; font-weight: 600; }
  td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #f9fafb; }
  .footer { margin-top: 16px; font-size: 10px; color: #9ca3af; text-align: center; }
</style>
</head>
<body>
  <h1>HomeEQ Items Report</h1>
  <p class="subtitle">Generated ${dateStr} &bull; ${dataRows.length} item${dataRows.length !== 1 ? 's' : ''}</p>
  <table>
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${dataRows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>
  <p class="footer">HomeEQ &mdash; Home Item Tracker</p>
</body>
</html>`;
  }, [buildItemRows]);

  const handleEmail = useCallback(async () => {
    mediumImpact();
    if (appliances.length === 0) {
      Alert.alert('No Data', 'There are no items to email yet.');
      return;
    }
    try {
      const csvContent = generateCSV(appliances);
      const fileName = `HomeEQ_Items_${new Date().toISOString().split('T')[0]}.csv`;
      if (Platform.OS === 'web') {
        const mailtoBody = encodeURIComponent(`HomeEQ Items Report\n\n${csvContent}`);
        const mailtoSubject = encodeURIComponent(`HomeEQ Items Report - ${new Date().toLocaleDateString()}`);
        window.open(`mailto:?subject=${mailtoSubject}&body=${mailtoBody}`, '_blank');
        successNotification();
        return;
      }
      const file = new File(Paths.cache, fileName);
      file.write(csvContent);
      console.log('[Email] CSV file written to:', file.uri);
      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Mail Unavailable', 'No email account is configured on this device.');
        return;
      }
      await MailComposer.composeAsync({
        subject: `HomeEQ Items Report - ${new Date().toLocaleDateString()}`,
        body: `<p>Please find attached the HomeEQ items report with ${appliances.length} item${appliances.length !== 1 ? 's' : ''}.</p>`,
        isHtml: true,
        attachments: [file.uri],
      });
      successNotification();
      console.log('[Email] Mail composer opened successfully');
    } catch (e: any) {
      console.error('[Email] Error:', e?.message || e);
      Alert.alert('Email Error', 'Something went wrong while preparing the email.');
    }
  }, [appliances, generateCSV]);

  const handlePDF = useCallback(async () => {
    mediumImpact();
    if (appliances.length === 0) {
      Alert.alert('No Data', 'There are no items to export yet.');
      return;
    }
    try {
      const html = buildHtmlTable(appliances);
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        }
        successNotification();
        return;
      }
      const { uri } = await Print.printToFileAsync({ html });
      console.log('[PDF] File saved to:', uri);
      const canShare = await isAvailableAsync();
      if (canShare) {
        await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        successNotification();
      } else {
        Alert.alert('PDF Ready', 'PDF saved but sharing is not available on this device.');
      }
    } catch (e: any) {
      console.error('[PDF] Error:', e?.message || e);
      Alert.alert('PDF Error', 'Something went wrong while creating the PDF.');
    }
  }, [appliances, buildHtmlTable]);

  const handleCSV = useCallback(async () => {
    mediumImpact();
    if (appliances.length === 0) {
      Alert.alert('No Data', 'There are no items to export yet.');
      return;
    }
    try {
      const csvContent = generateCSV(appliances);
      const fileName = `HomeEQ_Items_${new Date().toISOString().split('T')[0]}.csv`;
      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        successNotification();
        console.log('[CSV] Web download triggered');
        return;
      }
      const file = new File(Paths.cache, fileName);
      file.write(csvContent);
      console.log('[CSV] File written to:', file.uri);
      const canShare = await isAvailableAsync();
      if (canShare) {
        await shareAsync(file.uri, { UTI: 'public.comma-separated-values-text', mimeType: 'text/csv' });
        successNotification();
      } else {
        Alert.alert('CSV Ready', 'CSV saved but sharing is not available on this device.');
      }
    } catch (e: any) {
      console.error('[CSV] Error:', e?.message || e);
      Alert.alert('CSV Error', 'Something went wrong while creating the CSV.');
    }
  }, [appliances, generateCSV]);

  const handlePrint = useCallback(async () => {
    mediumImpact();
    if (appliances.length === 0) {
      Alert.alert('No Data', 'There are no items to print yet.');
      return;
    }
    try {
      const html = buildHtmlTable(appliances);
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        }
        return;
      }
      await Print.printAsync({ html });
      successNotification();
      console.log('[Print] Print dialog opened successfully');
    } catch (e: any) {
      console.error('[Print] Error:', e?.message || e);
      Alert.alert('Print Error', 'Something went wrong while printing.');
    }
  }, [appliances, buildHtmlTable]);

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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
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
                      <Text style={[styles.cardImageText, { color: avatarColor }]}>{appliance.name[0]}</Text>
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

        <View style={styles.exportSection}>
          <TouchableOpacity
            style={styles.exportHeader}
            onPress={toggleExport}
            activeOpacity={0.7}
            testID="items-export-toggle"
          >
            <View style={styles.exportHeaderLeft}>
              <View style={[styles.exportHeaderIcon, { backgroundColor: c.primaryLight }]}>
                <Download size={18} color={c.primary} />
              </View>
              <View>
                <Text style={styles.exportHeaderTitle}>Export</Text>
                <Text style={styles.exportHeaderSubtitle}>Download your items data</Text>
              </View>
            </View>
            {exportExpanded ? (
              <ChevronUp size={20} color={c.textTertiary} />
            ) : (
              <ChevronDown size={20} color={c.textTertiary} />
            )}
          </TouchableOpacity>

          {exportExpanded && (
            <View style={styles.exportGrid}>
              <TouchableOpacity
                style={styles.exportGridItem}
                onPress={handleEmail}
                activeOpacity={0.7}
                testID="items-export-email"
              >
                <View style={[styles.exportGridIcon, { backgroundColor: '#EEF2FF' }]}>
                  <Mail size={22} color="#4F46E5" />
                </View>
                <Text style={styles.exportGridTitle}>Email</Text>
                <Text style={styles.exportGridDesc}>Send as attachment</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exportGridItem}
                onPress={handlePDF}
                activeOpacity={0.7}
                testID="items-export-pdf"
              >
                <View style={[styles.exportGridIcon, { backgroundColor: '#FEF2F2' }]}>
                  <FileDown size={22} color="#DC2626" />
                </View>
                <Text style={styles.exportGridTitle}>PDF</Text>
                <Text style={styles.exportGridDesc}>Save or share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exportGridItem}
                onPress={handleCSV}
                activeOpacity={0.7}
                testID="items-export-csv"
              >
                <View style={[styles.exportGridIcon, { backgroundColor: '#FFF7ED' }]}>
                  <Share2 size={22} color="#EA580C" />
                </View>
                <Text style={styles.exportGridTitle}>CSV</Text>
                <Text style={styles.exportGridDesc}>Spreadsheet data</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exportGridItem}
                onPress={handlePrint}
                activeOpacity={0.7}
                testID="items-export-print"
              >
                <View style={[styles.exportGridIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Printer size={22} color="#16A34A" />
                </View>
                <Text style={styles.exportGridTitle}>Print</Text>
                <Text style={styles.exportGridDesc}>AirPrint</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

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
    paddingVertical: 12,
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
