import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  TrendingDown,
  Receipt,
  Camera,
  UserCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Phone,
  CalendarDays,
  CalendarRange,
  Download,
  FileSpreadsheet,
  FileText,
  Table,
  Share2,
} from 'lucide-react-native';
import { useHome } from '@/contexts/HomeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { categoryLabels, BUDGET_CATEGORY_COLORS } from '@/constants/categories';
import FloatingActionButton from '@/components/FloatingActionButton';
import ScreenHeader from '@/components/ScreenHeader';
import { useBudgetSummary } from '@/hooks/useBudgetSummary';
import { mediumImpact, lightImpact, successNotification } from '@/utils/haptics';
import createStyles from '@/styles/budget';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

function generateCSV(items: any[], categoryLabelsMap: Record<string, string>): string {
  const headers = ['Date', 'Description', 'Category', 'Amount', 'Payment Method', 'Invoice #', 'Tax Deductible', 'Provider', 'Notes'];
  const rows = items.map((item) => [
    item.date,
    `"${(item.description || '').replace(/"/g, '""')}"`,
    categoryLabelsMap[item.category] || item.category,
    item.amount.toFixed(2),
    item.paymentMethod || '',
    item.invoiceNumber || '',
    item.taxDeductible ? 'Yes' : 'No',
    item.provider?.name || '',
    `"${(item.notes || '').replace(/"/g, '""')}"`,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export default function BudgetScreen() {
  const router = useRouter();
  const { colors: c } = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const { trustedPros } = useHome();
  const {
    budgetItems,
    spentThisMonth,
    spentThisYear,
    categoryBreakdown,
    recentItems,
  } = useBudgetSummary();

  const [exportExpanded, setExportExpanded] = useState<boolean>(false);
  const exportAnim = useRef(new Animated.Value(0)).current;

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

  const handleExport = useCallback(async (format: 'csv' | 'excel' | 'google-sheets' | 'apple-numbers') => {
    mediumImpact();

    if (budgetItems.length === 0) {
      Alert.alert('No Data', 'There are no expenses to export yet.');
      return;
    }

    const csvContent = generateCSV(budgetItems, categoryLabels);
    const fileName = `HomeEQ_Expenses_${new Date().toISOString().split('T')[0]}`;

    if (Platform.OS === 'web') {
      try {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${fileName}.csv`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        successNotification();
        Alert.alert('Exported', `Your expenses have been downloaded as ${fileName}.csv`);
      } catch (e) {
        console.error('[Export] Web export error:', e);
        Alert.alert('Error', 'Could not export file on this platform.');
      }
      return;
    }

    try {
      const fileUri = `${FileSystem.cacheDirectory}${fileName}.csv`;
      console.log('[Export] Writing file to:', fileUri);
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      console.log('[Export] File written successfully');

      const canShare = await Sharing.isAvailableAsync();
      console.log('[Export] Sharing available:', canShare);
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: `Export Expenses (${format.toUpperCase()})`,
          UTI: format === 'apple-numbers' ? 'com.apple.numbers.tables' : 'public.comma-separated-values-text',
        });
        successNotification();
        console.log('[Export] Shared successfully as', format);
      } else {
        Alert.alert('Export Ready', 'File saved to cache. Sharing is not available on this device.');
      }
    } catch (e: any) {
      console.error('[Export] Error:', e?.message || e);
      Alert.alert('Export Error', 'Something went wrong while exporting. Please try again.');
    }
  }, [budgetItems]);

  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ScreenHeader title="Spending" subtitle="Track your home expenses" />

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroStatBlock}>
              <View style={[styles.heroStatIconWrap, { backgroundColor: c.dangerLight }]}>
                <CalendarDays size={16} color={c.danger} />
              </View>
              <Text style={styles.heroLabel}>{currentMonthName}</Text>
              <Text style={[styles.heroAmount, { color: c.text }]}>${spentThisMonth.toLocaleString()}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStatBlock}>
              <View style={[styles.heroStatIconWrap, { backgroundColor: c.primaryLight }]}>
                <CalendarRange size={16} color={c.primary} />
              </View>
              <Text style={styles.heroLabel}>{new Date().getFullYear()}</Text>
              <Text style={[styles.heroAmount, { color: c.text }]}>${spentThisYear.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <View style={[styles.heroStatIcon, { backgroundColor: c.dangerLight }]}>
                <TrendingDown size={14} color={c.danger} />
              </View>
              <Text style={styles.heroStatLabel}>This Month</Text>
              <Text style={styles.heroStatValue}>${spentThisMonth.toLocaleString()}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <View style={[styles.heroStatIcon, { backgroundColor: c.primaryLight }]}>
                <Receipt size={14} color={c.primary} />
              </View>
              <Text style={styles.heroStatLabel}>Expenses</Text>
              <Text style={styles.heroStatValue}>{budgetItems.length}</Text>
            </View>
          </View>
        </View>

        {trustedPros.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trusted Pros</Text>
              <TouchableOpacity
                onPress={() => {
                  lightImpact();
                  router.push('/trusted-pros' as any);
                }}
                activeOpacity={0.7}
                style={styles.seeAllBtn}
              >
                <Text style={styles.seeAllText}>See all</Text>
                <ChevronRight size={14} color={c.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.prosRow}
            >
              {trustedPros.slice(0, 6).map((pro) => (
                <TouchableOpacity
                  key={pro.id}
                  style={styles.proCard}
                  onPress={() => {
                    lightImpact();
                    router.push(`/provider/${pro.id}` as any);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.proAvatar}>
                    <Text style={styles.proAvatarText}>
                      {pro.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.proName} numberOfLines={1}>{pro.name}</Text>
                  <Text style={styles.proSpecialty} numberOfLines={1}>{pro.specialty}</Text>
                  {pro.phone && (
                    <View style={styles.proPhoneRow}>
                      <Phone size={10} color={c.textTertiary} />
                      <Text style={styles.proPhone} numberOfLines={1}>{pro.phone}</Text>
                    </View>
                  )}
                  <View style={styles.proExpenseBadge}>
                    <Receipt size={10} color={c.primary} />
                    <Text style={styles.proExpenseCount}>
                      {pro.expenseIds.length} {pro.expenseIds.length === 1 ? 'job' : 'jobs'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {categoryBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Where it's going</Text>
            <View style={styles.categoryCard}>
              {categoryBreakdown.map((cat, idx) => (
                <View key={cat.category} style={[styles.categoryRow, idx < categoryBreakdown.length - 1 && styles.categoryRowBorder]}>
                  <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryLabel}>{categoryLabels[cat.category] || cat.category}</Text>
                    <View style={styles.categoryBarContainer}>
                      <View
                        style={[
                          styles.categoryBar,
                          { width: `${cat.percentage}%`, backgroundColor: cat.color },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={styles.categoryAmount}>${cat.amount}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent expenses</Text>
          </View>
          {recentItems.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Receipt size={24} color={c.primary} />
              </View>
              <Text style={styles.emptyText}>No expenses logged yet</Text>
              <Text style={styles.emptySubtext}>Tap + to record your first expense</Text>
            </View>
          ) : (
            recentItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.expenseRow}
                onPress={() => {
                  lightImpact();
                  router.push(`/expense/${item.id}` as any);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.expenseDot, { backgroundColor: BUDGET_CATEGORY_COLORS[item.category] || c.textTertiary }]} />
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseDesc}>{item.description}</Text>
                  <View style={styles.expenseMeta}>
                    <Text style={styles.expenseCategory}>
                      {categoryLabels[item.category] || item.category} · {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                    <View style={styles.expenseBadges}>
                      {item.receiptImages && item.receiptImages.length > 0 && (
                        <View style={styles.expenseBadge}>
                          <Camera size={10} color={c.primary} />
                        </View>
                      )}
                      {item.provider && (
                        <View style={[styles.expenseBadge, { backgroundColor: c.primaryLight }]}>
                          <UserCheck size={10} color={c.primary} />
                        </View>
                      )}
                      {item.taxDeductible && (
                        <View style={[styles.expenseBadge, { backgroundColor: c.successLight }]}>
                          <FileText size={10} color={c.success} />
                        </View>
                      )}
                    </View>
                  </View>
                  {item.provider && (
                    <Text style={styles.expenseProvider}>{item.provider.name}</Text>
                  )}
                </View>
                <View style={styles.expenseRight}>
                  <Text style={styles.expenseAmount}>-${item.amount}</Text>
                  {item.paymentMethod && (
                    <Text style={styles.expensePayment}>{item.paymentMethod}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.exportHeader}
            onPress={toggleExport}
            activeOpacity={0.7}
            testID="export-toggle"
          >
            <View style={styles.exportHeaderLeft}>
              <View style={[styles.exportHeaderIcon, { backgroundColor: c.primaryLight }]}>
                <Download size={18} color={c.primary} />
              </View>
              <View>
                <Text style={styles.exportHeaderTitle}>Export</Text>
                <Text style={styles.exportHeaderSubtitle}>Download your spending data</Text>
              </View>
            </View>
            {exportExpanded ? (
              <ChevronUp size={20} color={c.textTertiary} />
            ) : (
              <ChevronDown size={20} color={c.textTertiary} />
            )}
          </TouchableOpacity>

          {exportExpanded && (
            <View style={styles.exportOptions}>
              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => handleExport('csv')}
                activeOpacity={0.7}
                testID="export-csv"
              >
                <View style={[styles.exportOptionIcon, { backgroundColor: c.successLight }]}>
                  <FileText size={20} color={c.success} />
                </View>
                <View style={styles.exportOptionInfo}>
                  <Text style={styles.exportOptionTitle}>CSV</Text>
                  <Text style={styles.exportOptionDesc}>Universal spreadsheet format</Text>
                </View>
                <Share2 size={16} color={c.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => handleExport('excel')}
                activeOpacity={0.7}
                testID="export-excel"
              >
                <View style={[styles.exportOptionIcon, { backgroundColor: '#E8F5E9' }]}>
                  <FileSpreadsheet size={20} color="#2E7D32" />
                </View>
                <View style={styles.exportOptionInfo}>
                  <Text style={styles.exportOptionTitle}>Excel</Text>
                  <Text style={styles.exportOptionDesc}>Open in Microsoft Excel</Text>
                </View>
                <Share2 size={16} color={c.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => handleExport('google-sheets')}
                activeOpacity={0.7}
                testID="export-google-sheets"
              >
                <View style={[styles.exportOptionIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Table size={20} color="#1565C0" />
                </View>
                <View style={styles.exportOptionInfo}>
                  <Text style={styles.exportOptionTitle}>Google Sheets</Text>
                  <Text style={styles.exportOptionDesc}>Open in Google Sheets</Text>
                </View>
                <Share2 size={16} color={c.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => handleExport('apple-numbers')}
                activeOpacity={0.7}
                testID="export-apple-numbers"
              >
                <View style={[styles.exportOptionIcon, { backgroundColor: '#FFF3E0' }]}>
                  <FileSpreadsheet size={20} color="#E65100" />
                </View>
                <View style={styles.exportOptionInfo}>
                  <Text style={styles.exportOptionTitle}>Apple Numbers</Text>
                  <Text style={styles.exportOptionDesc}>Open in Numbers on iOS/Mac</Text>
                </View>
                <Share2 size={16} color={c.textTertiary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      <FloatingActionButton
        onPress={() => {
          mediumImpact();
          router.push('/add-expense' as any);
        }}
        color={c.accent}
        testID="budget-add-expense"
      />
    </View>
  );
}
