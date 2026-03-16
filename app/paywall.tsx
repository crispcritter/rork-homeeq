import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Check,
  Sparkles,
  Home,
  ClipboardList,
  DollarSign,
  Users,
  Crown,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PurchasesPackage } from 'react-native-purchases';
import * as Haptics from 'expo-haptics';

const FEATURES = [
  { icon: Home, label: 'Unlimited appliances & items' },
  { icon: ClipboardList, label: 'Unlimited maintenance tasks' },
  { icon: DollarSign, label: 'Full budget tracking' },
  { icon: Users, label: 'Unlimited trusted pros' },
  { icon: Sparkles, label: 'All future premium features' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { colors: c } = useTheme();
  const {
    monthlyPackage,
    annualPackage,
    purchase,
    restore,
    isPurchasing,
    isRestoring,
    isLoadingOfferings,
    isPro,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const featureAnims = useRef(FEATURES.map(() => new Animated.Value(0))).current;
  const cardScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    featureAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: 200 + i * 80,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim, slideAnim, cardScale, featureAnims]);

  useEffect(() => {
    if (isPro) {
      Alert.alert('You\'re a Pro!', 'You already have HomeEQ Pro.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }, [isPro, router]);

  const getPackagePrice = useCallback((pkg: PurchasesPackage | null) => {
    if (!pkg) return '—';
    return pkg.product.priceString;
  }, []);

  const getMonthlyEquivalent = useCallback(() => {
    if (!annualPackage) return '';
    const annual = annualPackage.product.price;
    const monthly = annual / 12;
    const currencyCode = annualPackage.product.currencyCode || 'USD';
    if (currencyCode === 'USD') return `$${monthly.toFixed(2)}/mo`;
    return `${monthly.toFixed(2)} ${currencyCode}/mo`;
  }, [annualPackage]);

  const getSavingsPercentage = useCallback(() => {
    if (!monthlyPackage || !annualPackage) return 0;
    const monthlyAnnual = monthlyPackage.product.price * 12;
    const annualPrice = annualPackage.product.price;
    return Math.round(((monthlyAnnual - annualPrice) / monthlyAnnual) * 100);
  }, [monthlyPackage, annualPackage]);

  const handlePurchase = useCallback(async () => {
    const pkg = selectedPlan === 'annual' ? annualPackage : monthlyPackage;
    if (!pkg) {
      Alert.alert('Error', 'Selected plan is not available. Please try again.');
      return;
    }
    try {
      if (Platform.OS !== 'web') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      await purchase(pkg);
      Alert.alert('Welcome to Pro!', 'You\'ve unlocked all HomeEQ features.', [
        { text: 'Let\'s Go', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      if (!e?.userCancelled) {
        Alert.alert('Purchase Failed', e?.message ?? 'Something went wrong. Please try again.');
      }
    }
  }, [selectedPlan, annualPackage, monthlyPackage, purchase, router]);

  const handleRestore = useCallback(async () => {
    try {
      const info = await restore();
      const hasEntitlement = typeof info.entitlements.active['HomeEQ Pro'] !== 'undefined';
      if (hasEntitlement) {
        Alert.alert('Restored!', 'Your Pro subscription has been restored.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('No Subscription Found', 'We couldn\'t find an active subscription to restore.');
      }
    } catch {
      Alert.alert('Restore Failed', 'Something went wrong. Please try again.');
    }
  }, [restore, router]);

  const savings = getSavingsPercentage();

  const gradientColors = [c.primary, c.primaryDark] as const;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <LinearGradient
          colors={[gradientColors[0], gradientColors[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            testID="paywall-close"
          >
            <View style={styles.closeButtonInner}>
              <X size={20} color="#fff" />
            </View>
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.heroContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <Crown size={36} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>Unlock HomeEQ Pro</Text>
            <Text style={styles.heroSubtitle}>
              Take full control of your home maintenance
            </Text>
          </Animated.View>
        </LinearGradient>

        <Animated.View
          style={[
            styles.featuresSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          <View style={[styles.featuresCard, { backgroundColor: c.surface }]}>
            <Text style={[styles.featuresTitle, { color: c.text }]}>
              Everything you need
            </Text>
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Animated.View
                  key={feature.label}
                  style={[
                    styles.featureRow,
                    {
                      opacity: featureAnims[index],
                      transform: [
                        {
                          translateX: featureAnims[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [-20, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={[styles.featureIconCircle, { backgroundColor: c.primaryLight }]}>
                    <Icon size={16} color={c.primary} />
                  </View>
                  <Text style={[styles.featureLabel, { color: c.text }]}>
                    {feature.label}
                  </Text>
                  <Check size={16} color={c.success} />
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {isLoadingOfferings ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={c.primary} size="large" />
            <Text style={[styles.loadingText, { color: c.textSecondary }]}>
              Loading plans...
            </Text>
          </View>
        ) : (
          <Animated.View
            style={[
              styles.plansSection,
              {
                opacity: fadeAnim,
                transform: [{ scale: cardScale }],
              },
            ]}
          >
            <View style={styles.plansRow}>
              <TouchableOpacity
                style={[
                  styles.planCard,
                  { backgroundColor: c.surface, borderColor: c.borderLight },
                  selectedPlan === 'monthly' && {
                    borderColor: c.primary,
                    backgroundColor: c.primaryLight,
                  },
                ]}
                onPress={() => setSelectedPlan('monthly')}
                activeOpacity={0.8}
                testID="plan-monthly"
              >
                <View style={[
                  styles.planRadio,
                  { borderColor: selectedPlan === 'monthly' ? c.primary : c.border },
                ]}>
                  {selectedPlan === 'monthly' && (
                    <View style={[styles.planRadioInner, { backgroundColor: c.primary }]} />
                  )}
                </View>
                <Text style={[styles.planLabel, { color: c.textSecondary }]}>Monthly</Text>
                <Text style={[styles.planPrice, { color: c.text }]}>
                  {getPackagePrice(monthlyPackage)}
                </Text>
                <Text style={[styles.planPeriod, { color: c.textTertiary }]}>per month</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.planCard,
                  { backgroundColor: c.surface, borderColor: c.borderLight },
                  selectedPlan === 'annual' && {
                    borderColor: c.primary,
                    backgroundColor: c.primaryLight,
                  },
                ]}
                onPress={() => setSelectedPlan('annual')}
                activeOpacity={0.8}
                testID="plan-annual"
              >
                {savings > 0 && (
                  <View style={[styles.savingsBadge, { backgroundColor: c.primary }]}>
                    <Text style={styles.savingsBadgeText}>Save {savings}%</Text>
                  </View>
                )}
                <View style={[
                  styles.planRadio,
                  { borderColor: selectedPlan === 'annual' ? c.primary : c.border },
                ]}>
                  {selectedPlan === 'annual' && (
                    <View style={[styles.planRadioInner, { backgroundColor: c.primary }]} />
                  )}
                </View>
                <Text style={[styles.planLabel, { color: c.textSecondary }]}>Annual</Text>
                <Text style={[styles.planPrice, { color: c.text }]}>
                  {getPackagePrice(annualPackage)}
                </Text>
                <Text style={[styles.planPeriod, { color: c.textTertiary }]}>per year</Text>
                {annualPackage && (
                  <Text style={[styles.planEquivalent, { color: c.primary }]}>
                    {getMonthlyEquivalent()}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.subscribeButton, { backgroundColor: c.primary }]}
              onPress={handlePurchase}
              disabled={isPurchasing}
              activeOpacity={0.85}
              testID="subscribe-button"
            >
              {isPurchasing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.subscribeButtonText}>
                  Subscribe Now
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestore}
              disabled={isRestoring}
              activeOpacity={0.6}
              testID="restore-purchases"
            >
              {isRestoring ? (
                <ActivityIndicator color={c.textTertiary} size="small" />
              ) : (
                <Text style={[styles.restoreText, { color: c.textTertiary }]}>
                  Restore Purchases
                </Text>
              )}
            </TouchableOpacity>

            <Text style={[styles.legalText, { color: c.textTertiary }]}>
              Payment will be charged to your account. Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period.
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  closeButton: {
    position: 'absolute' as const,
    top: 52,
    right: 20,
    zIndex: 10,
  },
  closeButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  heroContent: {
    alignItems: 'center' as const,
    paddingTop: 16,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#fff',
    textAlign: 'center' as const,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginTop: -16,
  },
  featuresCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  featuresTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  featureRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 10,
  },
  featureIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  featureLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500' as const,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center' as const,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  plansSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  plansRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  planCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 2,
    padding: 16,
    alignItems: 'center' as const,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  savingsBadge: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    left: 0,
    paddingVertical: 4,
    alignItems: 'center' as const,
  },
  savingsBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  planRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 20,
    marginBottom: 10,
  },
  planRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  planLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  planPeriod: {
    fontSize: 12,
    marginTop: 2,
  },
  planEquivalent: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginTop: 6,
  },
  subscribeButton: {
    marginTop: 24,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
  restoreButton: {
    marginTop: 16,
    alignItems: 'center' as const,
    paddingVertical: 8,
  },
  restoreText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  legalText: {
    fontSize: 11,
    textAlign: 'center' as const,
    lineHeight: 16,
    marginTop: 12,
    paddingHorizontal: 8,
  },
});
