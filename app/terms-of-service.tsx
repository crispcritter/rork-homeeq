import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Platform, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/contexts/ThemeContext';
import { ExternalLink } from 'lucide-react-native';

const TERMS_URL = 'https://www.termsfeed.com/live/5f282254-5f2a-4ef0-a619-ff6b16496339';

export default function TermsOfServiceScreen() {
  const { colors: c } = useTheme();
  const router = useRouter();

  const openTerms = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        void Linking.openURL(TERMS_URL);
      } else {
        await WebBrowser.openBrowserAsync(TERMS_URL, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        });
      }
      if (router.canGoBack()) {
        router.back();
      }
    } catch (error) {
      console.log('Error opening terms of service:', error);
    }
  }, [router]);

  useEffect(() => {
    void openTerms();
  }, [openTerms]);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Stack.Screen options={{ title: 'Terms of Service' }} />
      <View style={styles.content}>
        <ActivityIndicator size="large" color={c.primary} style={styles.loader} />
        <Text style={[styles.message, { color: c.textSecondary }]}>
          Opening Terms of Service...
        </Text>
        <Pressable
          onPress={openTerms}
          style={[styles.button, { backgroundColor: c.primary }]}
          testID="open-terms-button"
        >
          <ExternalLink size={18} color="#fff" />
          <Text style={styles.buttonText}>Open Terms of Service</Text>
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
