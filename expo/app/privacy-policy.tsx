import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Platform, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/contexts/ThemeContext';
import { ExternalLink } from 'lucide-react-native';

const PRIVACY_POLICY_URL = 'https://www.termsfeed.com/live/db252d22-eb5d-4001-9a22-06b432f061ea';

export default function PrivacyPolicyScreen() {
  const { colors: c } = useTheme();
  const router = useRouter();

  const openPrivacyPolicy = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        void Linking.openURL(PRIVACY_POLICY_URL);
      } else {
        await WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        });
      }
      if (router.canGoBack()) {
        router.back();
      }
    } catch (error) {
      console.log('Error opening privacy policy:', error);
    }
  }, [router]);

  useEffect(() => {
    void openPrivacyPolicy();
  }, [openPrivacyPolicy]);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Stack.Screen options={{ title: 'Privacy Policy' }} />
      <View style={styles.content}>
        <ActivityIndicator size="large" color={c.primary} style={styles.loader} />
        <Text style={[styles.message, { color: c.textSecondary }]}>
          Opening Privacy Policy...
        </Text>
        <Pressable
          onPress={openPrivacyPolicy}
          style={[styles.button, { backgroundColor: c.primary }]}
          testID="open-privacy-policy-button"
        >
          <ExternalLink size={18} color="#fff" />
          <Text style={styles.buttonText}>Open Privacy Policy</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loader: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
