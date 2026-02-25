import React, { useCallback, useRef, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AlertTriangle, ChevronRight, Plus, Clock, Star, CirclePlus, Wrench, DollarSign, Search } from 'lucide-react-native';
import { useHome } from '@/contexts/HomeContext';
import { useTheme } from '@/contexts/ThemeContext';
import PressableCard from '@/components/PressableCard';
import AnimatedCard from '@/components/AnimatedCard';
import { formatRelativeDate } from '@/utils/dates';
import { getBudgetColor } from '@/utils/budget';
import { getAverageRating, formatRating } from '@/utils/ratings';
import { getPriorityColor } from '@/constants/priorities';
import { lightImpact } from '@/utils/haptics';
import createStyles from '@/styles/dashboard';

const PROVIDER_COLORS = ['#C4826D', '#5A8A60', '#B08D57', '#A08670'];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen() {
  const router = useRouter();
  const { colors: c } = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const {
    appliances,
    upcomingTasks,
    overdueTasks,
    monthlyBudget,
    totalSpent,
    isLoading,
    homeProfile,
    trustedPros,
    refreshAll,
    isRefreshing,
  } = useHome();

  const onRefresh = useCallback(async () => {
    await refreshAll();
  }, [refreshAll]);

  const budgetProgress = monthlyBudget > 0 ? Math.min(totalSpent / monthlyBudget, 1) : 0;
  const budgetBarWidth = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(budgetBarWidth, {
      toValue: budgetProgress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [budgetProgress]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = useCallback((route: string) => {
    lightImpact();
    router.push(route as any);
  }, [router]);

  const budgetColor = getBudgetColor(budgetProgress);
  const remaining = Math.max(monthlyBudget - totalSpent, 0);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Setting up your home...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />
        }
      >
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.greetingSubtitle}>
            Here's what's happening{homeProfile.nickname ? ` at ${homeProfile.nickname}` : ' at home'}
          </Text>
        </View>

        {overdueTasks.length > 0 && (
          <AnimatedCard index={0}>
            <PressableCard
              style={styles.alertBanner}
              onPress={() => handlePress('/(tabs)/schedule?filter=overdue')}
            >
              <View style={styles.alertIconWrap}>
                <AlertTriangle size={18} color={c.danger} />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>
                  {overdueTasks.length} {overdueTasks.length === 1 ? 'task' : 'tasks'} need attention
                </Text>
                <Text style={styles.alertSubtitle}>Tap to review overdue items</Text>
              </View>
              <ChevronRight size={16} color={c.danger} />
            </PressableCard>
          </AnimatedCard>
        )}

        <AnimatedCard index={1} style={styles.quickActionsGrid}>
          <View style={styles.quickAction}>
            <PressableCard
              style={[styles.quickActionInner, { backgroundColor: c.surface, shadowColor: c.cardShadow }]}
              onPress={() => handlePress('/add-appliance')}
              testID="add-appliance-quick"
            >
              <View style={[styles.quickActionIcon, { backgroundColor: c.primaryLight }]}>
                <Wrench size={18} color={c.primary} />
              </View>
              <Text style={styles.quickActionLabel}>Add item</Text>
            </PressableCard>
          </View>
          <View style={styles.quickAction}>
            <PressableCard
              style={[styles.quickActionInner, { backgroundColor: c.surface, shadowColor: c.cardShadow }]}
              onPress={() => handlePress('/add-task')}
              testID="add-task-quick"
            >
              <View style={[styles.quickActionIcon, { backgroundColor: c.accentLight }]}>
                <CirclePlus size={18} color={c.accent} />
              </View>
              <Text style={styles.quickActionLabel}>New task</Text>
            </PressableCard>
          </View>
          <View style={styles.quickAction}>
            <PressableCard
              style={[styles.quickActionInner, { backgroundColor: c.surface, shadowColor: c.cardShadow }]}
              onPress={() => handlePress('/add-expense')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: c.warningLight }]}>
                <DollarSign size={18} color={c.warning} />
              </View>
              <Text style={styles.quickActionLabel}>Log expense</Text>
            </PressableCard>
          </View>
          <View style={styles.quickAction}>
            <PressableCard
              style={[styles.quickActionInner, { backgroundColor: c.surface, shadowColor: c.cardShadow }]}
              onPress={() => handlePress('/trusted-pros')}
              testID="find-pro-quick"
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#EDE8F5' }]}>
                <Search size={18} color="#7B61A8" />
              </View>
              <Text style={styles.quickActionLabel}>Find a pro</Text>
            </PressableCard>
          </View>
        </AnimatedCard>

        <AnimatedCard index={2}>
          <PressableCard
            style={[styles.budgetCard, { backgroundColor: c.surface, shadowColor: c.cardShadow }]}
            onPress={() => handlePress('/(tabs)/budget')}
          >
            <View style={styles.budgetTop}>
              <Text style={[styles.budgetLabel, { color: c.textSecondary }]}>Monthly spending</Text>
              <View style={styles.budgetRightCol}>
                <Text style={[styles.budgetHighlight, { color: budgetColor }]}>
                  ${remaining.toLocaleString()}
                </Text>
                <Text style={[styles.budgetRightSub, { color: c.textTertiary }]}>remaining</Text>
              </View>
            </View>
            <View style={[styles.budgetBarBg, { backgroundColor: c.surfaceAlt }]}>
              <Animated.View
                style={[
                  styles.budgetBarFill,
                  {
                    backgroundColor: budgetColor,
                    width: budgetBarWidth.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <View style={styles.budgetBottom}>
              <Text style={[styles.budgetSpent, { color: c.textSecondary }]}>${totalSpent.toLocaleString()} spent</Text>
              <Text style={[styles.budgetTotal, { color: c.textTertiary }]}>of ${monthlyBudget.toLocaleString()}</Text>
            </View>
          </PressableCard>
        </AnimatedCard>

        <AnimatedCard index={3} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Coming up next</Text>
            {upcomingTasks.length > 0 && (
              <TouchableOpacity onPress={() => handlePress('/(tabs)/schedule')}>
                <Text style={[styles.seeAllText, { color: c.primary }]}>See all</Text>
              </TouchableOpacity>
            )}
          </View>
          {upcomingTasks.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: c.surface, shadowColor: c.cardShadow }]}>
              <Text style={[styles.emptyTitle, { color: c.text }]}>You're all caught up!</Text>
              <Text style={[styles.emptySubtitle, { color: c.textSecondary }]}>No upcoming tasks right now</Text>
              <TouchableOpacity
                onPress={() => handlePress('/add-task')}
                style={[styles.emptyAction, { backgroundColor: c.primaryLight }]}
                activeOpacity={0.7}
              >
                <Plus size={16} color={c.primary} />
                <Text style={[styles.emptyActionText, { color: c.primary }]}>Add a task</Text>
              </TouchableOpacity>
            </View>
          ) : (
            upcomingTasks.slice(0, 3).map((task, idx) => {
              const appliance = task.applianceId ? appliances.find((a) => a.id === task.applianceId) : null;
              return (
                <AnimatedCard key={task.id} index={4 + idx}>
                  <PressableCard style={[styles.taskCard, { backgroundColor: c.surface, shadowColor: c.cardShadow }]} onPress={() => handlePress(`/task/${task.id}`)}>
                    <View
                      style={[
                        styles.priorityIndicator,
                        { backgroundColor: getPriorityColor(task.priority) },
                      ]}
                    />
                    <View style={styles.taskContent}>
                      <Text style={[styles.taskTitle, { color: c.text }]}>{task.title}</Text>
                      <View style={styles.taskMeta}>
                        <Clock size={11} color={c.textSecondary} />
                        <Text style={[styles.taskDate, { color: c.textSecondary }]}>{formatRelativeDate(task.dueDate)}</Text>
                        {appliance && (
                          <>
                            <View style={styles.metaDot} />
                            <Text style={[styles.taskAppliance, { color: c.textTertiary }]}>{appliance.name}</Text>
                          </>
                        )}
                      </View>
                    </View>
                    {task.estimatedCost != null && task.estimatedCost > 0 && (
                      <Text style={[styles.taskCost, { color: c.text }]}>${task.estimatedCost}</Text>
                    )}
                  </PressableCard>
                </AnimatedCard>
              );
            })
          )}
        </AnimatedCard>

        <AnimatedCard index={7} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Trusted pros</Text>
            <TouchableOpacity onPress={() => handlePress('/trusted-pros')}>
              <Text style={styles.seeAllText}>{trustedPros.length > 0 ? 'See all' : 'Find pros'}</Text>
            </TouchableOpacity>
          </View>
          {trustedPros.length === 0 ? (
            <PressableCard style={[styles.emptyProviderCard, { backgroundColor: c.surface, shadowColor: c.cardShadow }]} onPress={() => handlePress('/trusted-pros')}>
              <View style={styles.emptyProviderIcon}>
                <Search size={20} color="#7B61A8" />
              </View>
              <Text style={[styles.emptyProviderTitle, { color: c.text }]}>No pros saved yet</Text>
              <Text style={[styles.emptyProviderSub, { color: c.textSecondary }]}>Add providers when logging expenses to build your list</Text>
            </PressableCard>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.providersRow}>
              {trustedPros.slice(0, 6).map((pro, idx) => {
                const avgRating = getAverageRating(pro.ratings);
                return (
                  <PressableCard
                    key={pro.id}
                    style={styles.providerCard}
                    onPress={() => handlePress(`/provider/${pro.id}`)}
                  >
                    <View style={[styles.providerAvatar, { backgroundColor: (PROVIDER_COLORS[idx % PROVIDER_COLORS.length]) + '20' }]}>
                      <Text style={[styles.providerInitial, { color: PROVIDER_COLORS[idx % PROVIDER_COLORS.length] }]}>{pro.name[0]}</Text>
                    </View>
                    <Text style={styles.providerName} numberOfLines={1}>{pro.name}</Text>
                    <Text style={styles.providerSpecialty} numberOfLines={1}>{pro.specialty}</Text>
                    {avgRating !== null && (
                      <View style={styles.ratingRow}>
                        <Star size={11} color={c.warning} fill={c.warning} />
                        <Text style={styles.ratingText}>{formatRating(avgRating)}</Text>
                      </View>
                    )}
                  </PressableCard>
                );
              })}
            </ScrollView>
          )}
        </AnimatedCard>

        <View style={{ height: 24 }} />
      </ScrollView>
    </Animated.View>
  );
}
