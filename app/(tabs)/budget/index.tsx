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
  Share2,
  FileText,
  Mail,
  FileDown,
  Printer,
  Download,
} from 'lucide-react-native';
import { useHome } from '@/contexts/HomeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { categoryLabels, BUDGET_CATEGORY_COLORS } from '@/constants/categories';
import FloatingActionButton from '@/components/FloatingActionButton';
import ScreenHeader from '@/components/ScreenHeader';
import { useBudgetSummary } from '@/hooks/useBudgetSummary';
import { mediumImpact, lightImpact, successNotification } from '@/utils/haptics';
import createStyles from '@/styles/budget';
import { File, Paths } from 'expo-file-system';
import { shareAsync, isAvailableAsync } from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import * as Print from 'expo-print';
function escapeCSVField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildExpenseRows(items: any[], categoryLabelsMap: Record<string, string>): string[][] {
  const headers = [
    'Date',
    'Description',
    'Category',
    'Amount',
    'Payment Method',
    'Invoice #',
    'Tax Deductible',
    'Provider Name',
    'Provider Phone',
    'Provider Email',
    'Provider Website',
    'Provider Address',
    'Provider Specialty',
    'Notes',
    'Appliance ID',
  ];
  const rows = items.map((item) => [
    item.date || '',
    item.description || '',
    categoryLabelsMap[item.category] || item.category || '',
    item.amount != null ? item.amount.toFixed(2) : '0.00',
    item.paymentMethod || '',
    item.invoiceNumber || '',
    item.taxDeductible ? 'Yes' : 'No',
    item.provider?.name || '',
    item.provider?.phone || '',
    item.provider?.email || '',
    item.provider?.website || '',
    item.provider?.address || '',
    item.provider?.specialty || '',
    item.notes || '',
    item.applianceId || '',
  ]);
  return [headers, ...rows];
}

function generateCSV(items: any[], categoryLabelsMap: Record<string, string>): string {
  const allRows = buildExpenseRows(items, categoryLabelsMap);
  return allRows.map((row) => row.map(escapeCSVField).join(',')).join('\r\n');
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

  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });

  const buildHtmlTable = useCallback((items: any[], catLabels: Record<string, string>): string => {
    const rows = buildExpenseRows(items, catLabels);
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
  .summary { display: flex; gap: 24px; margin-bottom: 20px; }
  .summary-item { background: #f3f4f6; border-radius: 8px; padding: 12px 16px; }
  .summary-label { font-size: 11px; color: #6b7280; text-transform: uppercase; }
  .summary-value { font-size: 18px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #1a1a2e; color: #fff; padding: 8px 10px; text-align: left; font-weight: 600; }
  td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #f9fafb; }
  .footer { margin-top: 16px; font-size: 10px; color: #9ca3af; text-align: center; }
</style>
</head>
<body>
  <h1>HomeEQ Spending Report</h1>
  <p class="subtitle">Generated ${dateStr} &bull; ${dataRows.length} expense${dataRows.length !== 1 ? 's' : ''}</p>
  <div class="summary">
    <div class="summary-item"><div class="summary-label">${currentMonthName}</div><div class="summary-value">${spentThisMonth.toLocaleString()}</div></div>
    <div class="summary-item"><div class="summary-label">${new Date().getFullYear()}</div><div class="summary-value">${spentThisYear.toLocaleString()}</div></div>
  </div>
  <table>
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${dataRows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>
  <p class="footer">HomeEQ &mdash; Home Expense Tracker</p>
</body>
</html>`;
  }, [currentMonthName, spentThisMonth, spentThisYear]);

  const handleEmail = useCallback(async () => {
    mediumImpact();
    if (budgetItems.length === 0) {
      Alert.alert('No Data', 'There are no expenses to email yet.');
      return;
    }

    try {
      const csvContent = generateCSV(budgetItems, categoryLabels);
      const fileName = `HomeEQ_Expenses_${new Date().toISOString().split('T')[0]}.csv`;

      if (Platform.OS === 'web') {
        const mailtoBody = encodeURIComponent(`HomeEQ Spending Report\n\nPlease find the expense data below:\n\n${csvContent}`);
        const mailtoSubject = encodeURIComponent(`HomeEQ Spending Report - ${new Date().toLocaleDateString()}`);
        window.open(`mailto:?subject=${mailtoSubject}&body=${mailtoBody}`, '_blank');
        successNotification();
        return;
      }

      const file = new File(Paths.cache, fileName);
      file.write(csvContent);
      console.log('[Email] CSV file written to:', file.uri);

      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Mail Unavailable', 'No email account is configured on this device. Please set up an email account in Settings.');
        return;
      }

      await MailComposer.composeAsync({
        subject: `HomeEQ Spending Report - ${new Date().toLocaleDateString()}`,
        body: `<p>Please find attached the HomeEQ spending report with ${budgetItems.length} expense${budgetItems.length !== 1 ? 's' : ''}.</p><p>Total this month: <strong>${spentThisMonth.toLocaleString()}</strong><br/>Total this year: <strong>${spentThisYear.toLocaleString()}</strong></p>`,
        isHtml: true,
        attachments: [file.uri],
      });
      successNotification();
      console.log('[Email] Mail composer opened successfully');
    } catch (e: any) {
      console.error('[Email] Error:', e?.message || e);
      Alert.alert('Email Error', 'Something went wrong while preparing the email. Please try again.');
    }
  }, [budgetItems, spentThisMonth, spentThisYear]);

  const handlePDF = useCallback(async () => {
    mediumImpact();
    if (budgetItems.length === 0) {
      Alert.alert('No Data', 'There are no expenses to export yet.');
      return;
    }

    try {
      const html = buildHtmlTable(budgetItems, categoryLabels);

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
        console.log('[PDF] Shared successfully');
      } else {
        Alert.alert('PDF Ready', 'PDF has been saved but sharing is not available on this device.');
      }
    } catch (e: any) {
      console.error('[PDF] Error:', e?.message || e);
      Alert.alert('PDF Error', 'Something went wrong while creating the PDF. Please try again.');
    }
  }, [budgetItems, buildHtmlTable]);

  const handlePrint = useCallback(async () => {
    mediumImpact();
    if (budgetItems.length === 0) {
      Alert.alert('No Data', 'There are no expenses to print yet.');
      return;
    }

    try {
      const html = buildHtmlTable(budgetItems, categoryLabels);

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
      Alert.alert('Print Error', 'Something went wrong while printing. Please try again.');
    }
  }, [budgetItems, buildHtmlTable]);

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
            <View style={styles.exportGrid}>
              <TouchableOpacity
                style={styles.exportActionRow}
                onPress={handleEmail}
                activeOpacity={0.7}
                testID="export-email"
              >
                <View style={[styles.exportActionIcon, { backgroundColor: '#EEF2FF' }]}>
                  <Mail size={20} color="#4F46E5" />
                </View>
                <View style={styles.exportActionInfo}>
                  <Text style={styles.exportActionTitle}>Email</Text>
                  <Text style={styles.exportActionDesc}>Send as CSV attachment</Text>
                </View>
                <ChevronRight size={16} color={c.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exportActionRow}
                onPress={handlePDF}
                activeOpacity={0.7}
                testID="export-pdf"
              >
                <View style={[styles.exportActionIcon, { backgroundColor: '#FEF2F2' }]}>
                  <FileDown size={20} color="#DC2626" />
                </View>
                <View style={styles.exportActionInfo}>
                  <Text style={styles.exportActionTitle}>PDF</Text>
                  <Text style={styles.exportActionDesc}>Save or share as PDF</Text>
                </View>
                <ChevronRight size={16} color={c.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.exportActionRow, { borderBottomWidth: 0 }]}
                onPress={handlePrint}
                activeOpacity={0.7}
                testID="export-print"
              >
                <View style={[styles.exportActionIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Printer size={20} color="#16A34A" />
                </View>
                <View style={styles.exportActionInfo}>
                  <Text style={styles.exportActionTitle}>Print</Text>
                  <Text style={styles.exportActionDesc}>Send to AirPrint printer</Text>
                </View>
                <ChevronRight size={16} color={c.textTertiary} />
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
