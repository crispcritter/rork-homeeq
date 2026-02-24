import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  TrendingDown,
  TrendingUp,
  Receipt,
  Camera,
  UserCheck,
  ChevronRight,
  Phone,
  Pencil,
} from 'lucide-react-native';
import { useHome } from '@/contexts/HomeContext';
import Colors from '@/constants/colors';
import { categoryLabels, BUDGET_CATEGORY_COLORS } from '@/constants/categories';
import FloatingActionButton from '@/components/FloatingActionButton';
import ScreenHeader from '@/components/ScreenHeader';
import BudgetEditModal from '@/components/BudgetEditModal';
import { useBudgetSummary } from '@/hooks/useBudgetSummary';
import { mediumImpact, lightImpact } from '@/utils/haptics';
import styles from '@/styles/budget';

export default function BudgetScreen() {
  const router = useRouter();
  const { trustedPros, setMonthlyBudget } = useHome();
  const {
    budgetItems,
    monthlyBudget,
    totalSpent,
    budgetProgress,
    remaining,
    budgetColor,
    budgetPercentUsed,
    categoryBreakdown,
    recentItems,
  } = useBudgetSummary();

  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: budgetProgress,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [budgetProgress]);

  const openEditModal = useCallback(() => {
    setEditModalVisible(true);
    mediumImpact();
  }, []);

  const handleSaveBudget = useCallback((amount: number) => {
    setMonthlyBudget(amount);
    console.log('[BudgetScreen] Monthly budget updated to:', amount);
  }, [setMonthlyBudget]);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ScreenHeader title="Spending" subtitle="Track your home expenses" />

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>This month</Text>
              <Text style={[styles.heroAmount, { color: budgetColor }]}>${totalSpent.toLocaleString()}</Text>
            </View>
            <View style={styles.heroPercentBadge}>
              <Text style={[styles.heroPercentText, { color: budgetColor }]}>{budgetPercentUsed}%</Text>
              <Text style={styles.heroPercentSub}>used</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBg}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: budgetColor,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressSpent}>${totalSpent.toLocaleString()} spent</Text>
              <TouchableOpacity
                onPress={openEditModal}
                activeOpacity={0.6}
                style={styles.budgetEditBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.progressTotal}>${monthlyBudget.toLocaleString()} budget</Text>
                <Pencil size={10} color={Colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <View style={[styles.heroStatIcon, { backgroundColor: Colors.dangerLight }]}>
                <TrendingDown size={14} color={Colors.danger} />
              </View>
              <Text style={styles.heroStatLabel}>Spent</Text>
              <Text style={styles.heroStatValue}>${totalSpent.toLocaleString()}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <View style={[styles.heroStatIcon, { backgroundColor: Colors.successLight }]}>
                <TrendingUp size={14} color={Colors.success} />
              </View>
              <Text style={styles.heroStatLabel}>Left</Text>
              <Text style={styles.heroStatValue}>${remaining.toLocaleString()}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <View style={[styles.heroStatIcon, { backgroundColor: Colors.primaryLight }]}>
                <Receipt size={14} color={Colors.primary} />
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
                <ChevronRight size={14} color={Colors.primary} />
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
                      <Phone size={10} color={Colors.textTertiary} />
                      <Text style={styles.proPhone} numberOfLines={1}>{pro.phone}</Text>
                    </View>
                  )}
                  <View style={styles.proExpenseBadge}>
                    <Receipt size={10} color={Colors.primary} />
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
                <Receipt size={24} color={Colors.primary} />
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
                <View style={[styles.expenseDot, { backgroundColor: BUDGET_CATEGORY_COLORS[item.category] || Colors.textTertiary }]} />
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseDesc}>{item.description}</Text>
                  <View style={styles.expenseMeta}>
                    <Text style={styles.expenseCategory}>
                      {categoryLabels[item.category] || item.category} · {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                    <View style={styles.expenseBadges}>
                      {item.receiptImages && item.receiptImages.length > 0 && (
                        <View style={styles.expenseBadge}>
                          <Camera size={10} color={Colors.primary} />
                        </View>
                      )}
                      {item.provider && (
                        <View style={[styles.expenseBadge, { backgroundColor: '#E8F0FE' }]}>
                          <UserCheck size={10} color="#4A7FBF" />
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

        <View style={{ height: 90 }} />
      </ScrollView>

      <BudgetEditModal
        visible={editModalVisible}
        currentBudget={monthlyBudget}
        onSave={handleSaveBudget}
        onClose={() => setEditModalVisible(false)}
      />

      <FloatingActionButton
        onPress={() => {
          mediumImpact();
          router.push('/add-expense' as any);
        }}
        color={Colors.accent}
        testID="budget-add-expense"
      />
    </View>
  );
}
