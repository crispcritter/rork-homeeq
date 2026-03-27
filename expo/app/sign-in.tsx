import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Home, Mail, Lock, Eye, EyeOff, ArrowRight, CloudUpload } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

type AuthMode = 'login' | 'register';

export default function SignInScreen() {
  const { login, register, isAuthenticated, pushToCloud, pullFromCloud, applyCloudData } = useAuth();
  const { colors: c } = useTheme();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isSyncing) {
      void handlePostAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handlePostAuth = useCallback(async () => {
    setIsSyncing(true);
    try {
      if (mode === 'login') {
        const cloudResult = await pullFromCloud();
        if (cloudResult?.data) {
          Alert.alert(
            'Cloud Data Found',
            'We found data saved to your account. Would you like to restore it to this device?',
            [
              {
                text: 'Keep Local Data',
                style: 'cancel',
                onPress: async () => {
                  console.log('[SignIn] User chose to keep local data, pushing to cloud');
                  await pushToCloud().catch(() => {});
                  router.back();
                },
              },
              {
                text: 'Restore Cloud Data',
                onPress: async () => {
                  console.log('[SignIn] User chose to restore cloud data');
                  await applyCloudData(cloudResult.data as Record<string, unknown>);
                  router.back();
                },
              },
            ]
          );
          setIsSyncing(false);
          return;
        }
      }

      console.log('[SignIn] Pushing local data to cloud...');
      await pushToCloud().catch((e: unknown) => {
        console.warn('[SignIn] Initial push failed:', e);
      });
    } catch (e) {
      console.warn('[SignIn] Post-auth sync error:', e);
    } finally {
      setIsSyncing(false);
    }
    router.back();
  }, [mode, pullFromCloud, pushToCloud, applyCloudData]);

  const handleSubmit = useCallback(() => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert('Missing Info', 'Please enter your email and password.');
      return;
    }

    if (mode === 'register') {
      if (trimmedPassword.length < 6) {
        Alert.alert('Password Too Short', 'Password must be at least 6 characters.');
        return;
      }
      if (trimmedPassword !== confirmPassword.trim()) {
        Alert.alert('Passwords Don\'t Match', 'Please make sure your passwords match.');
        return;
      }
      register.mutate({ email: trimmedEmail, password: trimmedPassword });
    } else {
      login.mutate({ email: trimmedEmail, password: trimmedPassword });
    }
  }, [email, password, confirmPassword, mode, login, register]);

  const isSubmitting = login.isPending || register.isPending || isSyncing;
  const errorMessage = login.error?.message || register.error?.message;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          title: '',
          headerTransparent: true,
          headerBackTitle: 'Back',
          headerTintColor: c.primary,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.headerSection,
            { opacity: fadeIn, transform: [{ translateY: slideUp }] },
          ]}
        >
          <View style={[styles.blob1, { backgroundColor: `${c.primary}10` }]} />
          <View style={[styles.blob2, { backgroundColor: `${c.primary}08` }]} />

          <View style={[styles.iconCircle, { backgroundColor: `${c.primary}15`, borderColor: `${c.primary}25` }]}>
            <Home size={32} color={c.primary} strokeWidth={1.8} />
          </View>
          <Text style={[styles.brandTitle, { color: c.text }]}>
            Home<Text style={[styles.brandBold, { color: c.primary }]}>EQ</Text>
          </Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            {mode === 'login'
              ? 'Sign in to sync across devices'
              : 'Create an account to get started'}
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.formSection,
            { opacity: fadeIn, transform: [{ translateY: slideUp }] },
          ]}
        >
          {errorMessage && (
            <View style={[styles.errorBanner, { backgroundColor: c.dangerLight }]}>
              <Text style={[styles.errorText, { color: c.danger }]}>{errorMessage}</Text>
            </View>
          )}

          <View style={[styles.inputContainer, { backgroundColor: c.surface, borderColor: c.borderLight }]}>
            <Mail size={18} color={c.textTertiary} />
            <TextInput
              style={[styles.input, { color: c.text }]}
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor={c.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              editable={!isSubmitting}
              testID="sign-in-email"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: c.surface, borderColor: c.borderLight }]}>
            <Lock size={18} color={c.textTertiary} />
            <TextInput
              ref={passwordRef}
              style={[styles.input, { color: c.text }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={c.textTertiary}
              secureTextEntry={!showPassword}
              returnKeyType={mode === 'register' ? 'next' : 'go'}
              onSubmitEditing={() =>
                mode === 'register' ? confirmRef.current?.focus() : handleSubmit()
              }
              editable={!isSubmitting}
              testID="sign-in-password"
            />
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {showPassword ? (
                <EyeOff size={18} color={c.textTertiary} />
              ) : (
                <Eye size={18} color={c.textTertiary} />
              )}
            </TouchableOpacity>
          </View>

          {mode === 'register' && (
            <View style={[styles.inputContainer, { backgroundColor: c.surface, borderColor: c.borderLight }]}>
              <Lock size={18} color={c.textTertiary} />
              <TextInput
                ref={confirmRef}
                style={[styles.input, { color: c.text }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                placeholderTextColor={c.textTertiary}
                secureTextEntry={!showPassword}
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
                editable={!isSubmitting}
                testID="sign-in-confirm-password"
              />
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: c.primary },
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
            testID="sign-in-submit"
          >
            {isSubmitting ? (
              <View style={styles.submitButtonContent}>
                <ActivityIndicator size="small" color={c.white} />
                <Text style={[styles.submitButtonText, { color: c.white }]}>
                  {isSyncing ? 'Syncing...' : mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </Text>
              </View>
            ) : (
              <View style={styles.submitButtonContent}>
                {mode === 'login' ? (
                  <ArrowRight size={20} color={c.white} />
                ) : (
                  <CloudUpload size={20} color={c.white} />
                )}
                <Text style={[styles.submitButtonText, { color: c.white }]}>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => {
              setMode((prev) => (prev === 'login' ? 'register' : 'login'));
              login.reset();
              register.reset();
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, { color: c.textSecondary }]}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            </Text>
            <Text style={[styles.toggleLink, { color: c.primary }]}>
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.featureSection}>
          <View style={styles.featureRow}>
            <View style={[styles.featureDot, { backgroundColor: c.primary }]} />
            <Text style={[styles.featureText, { color: c.textSecondary }]}>
              Sync your data across all your devices
            </Text>
          </View>
          <View style={styles.featureRow}>
            <View style={[styles.featureDot, { backgroundColor: c.primary }]} />
            <Text style={[styles.featureText, { color: c.textSecondary }]}>
              Secure cloud backup of your home data
            </Text>
          </View>
          <View style={styles.featureRow}>
            <View style={[styles.featureDot, { backgroundColor: c.primary }]} />
            <Text style={[styles.featureText, { color: c.textSecondary }]}>
              Share access with household members
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
    overflow: 'visible',
  },
  blob1: {
    position: 'absolute',
    top: -height * 0.08,
    right: -width * 0.2,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
  },
  blob2: {
    position: 'absolute',
    bottom: -height * 0.04,
    left: -width * 0.25,
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: width * 0.275,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '300',
    letterSpacing: 1,
    marginBottom: 8,
  },
  brandBold: {
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
  },
  formSection: {
    marginBottom: 32,
  },
  errorBanner: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    padding: 0,
    margin: 0,
  },
  submitButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 14,
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  featureSection: {
    gap: 14,
    paddingHorizontal: 8,
    marginTop: 'auto' as const,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
});
