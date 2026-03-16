import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function PrivacyPolicyScreen() {
  const { colors: c } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Stack.Screen options={{ title: 'Privacy Policy' }} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.lastUpdated, { color: c.textTertiary }]}>
          Last updated: March 2026
        </Text>

        <Text style={[styles.heading, { color: c.text }]}>1. Information We Collect</Text>
        <Text style={[styles.body, { color: c.textSecondary }]}>
          HomeEQ collects information you provide directly, including your email address when you create an account, and home-related data you enter into the app such as appliances, maintenance tasks, budget items, and home profile details. This data is stored locally on your device and optionally synced to our cloud service when you sign in.
        </Text>

        <Text style={[styles.heading, { color: c.text }]}>2. How We Use Your Information</Text>
        <Text style={[styles.body, { color: c.textSecondary }]}>
          We use your information to provide and improve the HomeEQ service, including syncing your data across devices, managing household memberships, and delivering app functionality. We do not sell your personal data to third parties.
        </Text>

        <Text style={[styles.heading, { color: c.text }]}>3. Data Storage & Security</Text>
        <Text style={[styles.body, { color: c.textSecondary }]}>
          Your data is stored locally on your device using secure storage mechanisms. When you opt into cloud sync, your data is transmitted securely and stored on our servers. Passwords are hashed using PBKDF2 with SHA-256 and are never stored in plaintext. Sensitive credentials such as app passwords are stored using the device's secure keychain.
        </Text>

        <Text style={[styles.heading, { color: c.text }]}>4. Third-Party Services</Text>
        <Text style={[styles.body, { color: c.textSecondary }]}>
          HomeEQ may use the following third-party services:{'\n'}
          {'\u2022'} RevenueCat for subscription management{'\n'}
          {'\u2022'} Apple App Store for payment processing{'\n'}
          {'\n'}
          These services have their own privacy policies governing the use of your information.
        </Text>

        <Text style={[styles.heading, { color: c.text }]}>5. Data Deletion</Text>
        <Text style={[styles.body, { color: c.textSecondary }]}>
          You can delete your account and all associated cloud data at any time from the Home Profile screen. Local data can be reset using the "Reset All Data" option. Upon account deletion, all server-side data including your profile, sync data, household memberships, and sessions are permanently removed.
        </Text>

        <Text style={[styles.heading, { color: c.text }]}>6. Children's Privacy</Text>
        <Text style={[styles.body, { color: c.textSecondary }]}>
          HomeEQ is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13.
        </Text>

        <Text style={[styles.heading, { color: c.text }]}>7. Changes to This Policy</Text>
        <Text style={[styles.body, { color: c.textSecondary }]}>
          We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy within the app. Your continued use of the app after changes constitutes acceptance of the updated policy.
        </Text>

        <Text style={[styles.heading, { color: c.text }]}>8. Contact Us</Text>
        <Text style={[styles.body, { color: c.textSecondary }]}>
          If you have any questions about this privacy policy, please contact us through the app's support channels.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  lastUpdated: {
    fontSize: 13,
    marginBottom: 24,
  },
  heading: {
    fontSize: 17,
    fontWeight: '700' as const,
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 4,
  },
});
