import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Home, Users, CheckCircle, XCircle, ArrowRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

type InviteState = 'loading' | 'valid' | 'invalid' | 'joining' | 'success' | 'error';

interface InviteInfo {
  householdName: string;
  ownerEmail: string;
  memberCount: number;
}

export default function JoinHouseholdScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { isAuthenticated, getInviteInfo, joinHousehold, pullFromCloud, applyCloudData } = useAuth();
  const { colors: c } = useTheme();

  const [state, setState] = useState<InviteState>('loading');
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleIn = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleIn, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!code) {
      setState('invalid');
      setErrorMessage('No invite code provided.');
      return;
    }

    if (!isAuthenticated) {
      router.replace('/sign-in');
      return;
    }

    void fetchInviteInfo(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, isAuthenticated]);

  const fetchInviteInfo = useCallback(async (inviteCode: string) => {
    setState('loading');
    try {
      const result = await getInviteInfo(inviteCode);
      if (result.valid) {
        setInviteInfo({
          householdName: result.householdName,
          ownerEmail: result.ownerEmail,
          memberCount: result.memberCount,
        });
        setState('valid');
      } else {
        setState('invalid');
        setErrorMessage(result.reason);
      }
    } catch (e) {
      console.error('[JoinHousehold] Failed to fetch invite info:', e);
      setState('invalid');
      setErrorMessage('Failed to verify invite. Please try again.');
    }
  }, [getInviteInfo]);

  const handleJoin = useCallback(async () => {
    if (!code) return;
    setState('joining');
    try {
      await joinHousehold(code);
      setState('success');

      const cloudResult = await pullFromCloud();
      if (cloudResult?.data) {
        await applyCloudData(cloudResult.data as Record<string, unknown>);
        console.log('[JoinHousehold] Applied household data to device');
      }

      setTimeout(() => {
        router.replace('/');
      }, 1500);
    } catch (e: any) {
      console.error('[JoinHousehold] Failed to join:', e);
      setState('error');
      setErrorMessage(e?.message ?? 'Failed to join household.');
    }
  }, [code, joinHousehold, pullFromCloud, applyCloudData]);

  const renderContent = () => {
    if (state === 'loading') {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={[styles.loadingText, { color: c.textSecondary }]}>
            Verifying invite...
          </Text>
        </View>
      );
    }

    if (state === 'invalid' || state === 'error') {
      return (
        <View style={styles.centerContent}>
          <View style={[styles.iconCircle, { backgroundColor: c.dangerLight }]}>
            <XCircle size={36} color={c.danger} />
          </View>
          <Text style={[styles.title, { color: c.text }]}>
            {state === 'error' ? 'Failed to Join' : 'Invalid Invite'}
          </Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            {errorMessage}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: c.surface, borderWidth: 1, borderColor: c.borderLight }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { color: c.text }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (state === 'success') {
      return (
        <View style={styles.centerContent}>
          <View style={[styles.iconCircle, { backgroundColor: c.successLight }]}>
            <CheckCircle size={36} color={c.success} />
          </View>
          <Text style={[styles.title, { color: c.text }]}>Welcome!</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            You've joined {inviteInfo?.householdName}. Syncing data...
          </Text>
        </View>
      );
    }

    if (state === 'joining') {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={[styles.loadingText, { color: c.textSecondary }]}>
            Joining household...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.centerContent}>
        <View style={[styles.iconCircle, { backgroundColor: c.primaryLight }]}>
          <Users size={36} color={c.primary} />
        </View>
        <Text style={[styles.title, { color: c.text }]}>
          Join Household
        </Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          You've been invited to collaborate on
        </Text>

        <View style={[styles.householdCard, { backgroundColor: c.surface, borderColor: c.borderLight }]}>
          <View style={[styles.householdIcon, { backgroundColor: c.primaryLight }]}>
            <Home size={22} color={c.primary} />
          </View>
          <View style={styles.householdCardContent}>
            <Text style={[styles.householdName, { color: c.text }]}>
              {inviteInfo?.householdName}
            </Text>
            <Text style={[styles.householdMeta, { color: c.textTertiary }]}>
              Managed by {inviteInfo?.ownerEmail}
            </Text>
            <Text style={[styles.householdMeta, { color: c.textTertiary }]}>
              {inviteInfo?.memberCount} {inviteInfo?.memberCount === 1 ? 'member' : 'members'}
            </Text>
          </View>
        </View>

        <Text style={[styles.disclaimer, { color: c.textTertiary }]}>
          By joining, you'll share appliances, tasks, budget, and home data with all household members.
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: c.primary }]}
          onPress={handleJoin}
          activeOpacity={0.8}
          testID="join-household-button"
        >
          <ArrowRight size={20} color={c.white} />
          <Text style={[styles.buttonText, { color: c.white }]}>Join Household</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={[styles.secondaryButtonText, { color: c.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Stack.Screen
        options={{
          title: '',
          headerTransparent: true,
          headerBackTitle: 'Back',
          headerTintColor: c.primary,
        }}
      />
      <Animated.View
        style={[
          styles.animatedContainer,
          { opacity: fadeIn, transform: [{ scale: scaleIn }] },
        ]}
      >
        {renderContent()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  centerContent: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 16,
  },
  householdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 18,
    gap: 14,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
  },
  householdIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  householdCardContent: {
    flex: 1,
  },
  householdName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  householdMeta: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  disclaimer: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 28,
    paddingHorizontal: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
