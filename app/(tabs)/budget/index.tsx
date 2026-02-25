import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { parseLocalDate } from '@/utils/dates';
import {
  TrendingDown,
  Receipt,
  Camera,
  UserCheck,
  ChevronRight,
  Phone,
  CalendarDays,
  CalendarRange,
  FileText,
} from 'lucide-react-native';
import { useHome } from '@/contexts/HomeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { categoryLabels, BUDGET_CATEGORY_COLORS } from '@/constants/categories';
import FloatingActionButton from '@/components/FloatingActionButton';
import ScreenHeader from '@/components/ScreenHeader';
import ExportSection from '@/components/ExportSection';
import { useBudgetSummary } from '@/hooks/useBudgetSummary';
import { mediumImpact, lightImpact } from '@/utils/haptics';
import { rowsToCSV, buildHtmlReport } from '@/utils/export';
import createStyles from '@/styles/budget';
import { BudgetItem } from '@/types';
const EXPENSE_HEADERS = [
  'Date', 'Description', 'Category', 'Amount', 'Payment Method',
  'Invoice #', 'Tax Deductible', 'Provider Name', 'Provider Phone',
  'Provider Email', 'Provider Website', 'Provider Address',
  'Provider Specialty', 'Notes', 'Appliance ID',
];

function buildExpenseRows(items: BudgetItem[], categoryLabelsMap: Record<string, string>): string[][] {
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
  return [EXPENSE_HEADERS, ...rows];
}

export default function BudgetScreen() {
  const router = useRouter();
  const { colors: c } = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const { trustedPros, refreshAll, isRefreshing } = useHome();

  const onRefresh = useCallback(async () => {
    await refreshAll();
  }, [refreshAll]);
  const {
    budgetItems,
    spentThisMonth,
    spentThisYear,
    categoryBreakdown,
    recentItems,
  } = useBudgetSummary();

  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });

  const getCSV = useCallback(() => {
    return rowsToCSV(buildExpenseRows(budgetItems, categoryLabels));
  }, [budgetItems]);

  const getHTML = useCallback(() => {
    const rows = buildExpenseRows(budgetItems, categoryLabels);
    return buildHtmlReport({
      title: 'HomeEQ Spending Report',
      headers: rows[0],
      dataRows: rows.slice(1),
      summaryItems: [
        { label: currentMonthName, value: `${spentThisMonth.toLocaleString()}` },
        { label: `${new Date().getFullYear()}`, value: `${spentThisYear.toLocaleString()}` },
      ],
      footerLabel: 'HomeEQ &mdash; Home Expense Tracker',
    });
  }, [budgetItems, currentMonthName, spentThisMonth, spentThisYear]);

  const emailSubject = `HomeEQ Spending Report - ${new Date().toLocaleDateString()}`;
  const emailBodyHtml = `<p>Please find attached the HomeEQ spending report with ${budgetItems.length} expense${budgetItems.length !== 1 ? 's' : ''}.</p><p>Total this month: <strong>${spentThisMonth.toLocaleString()}</strong><br/>Total this year: <strong>${spentThisYear.toLocaleString()}</strong></p>`;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />
        }
      >
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
                      {categoryLabels[item.category] || item.category} · {parseLocalDate(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
          <ExportSection
            getCSV={getCSV}
            getHTML={getHTML}
            filePrefix="HomeEQ_Expenses"
            entityName="expenses"
            entityCount={budgetItems.length}
            emailSubject={emailSubject}
            emailBodyHtml={emailBodyHtml}
            subtitle="Download your spending data"
            testIDPrefix="export"
          />
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
