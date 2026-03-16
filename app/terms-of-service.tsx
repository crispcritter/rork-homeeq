import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function TermsOfServiceScreen() {
  const { colors: c } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Stack.Screen options={{ title: 'Terms of Service' }} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.lastUpdated, { color: c.textTertiary }]}>
          Last updated: March 2026
        </Text>

        <Text style={[styles.heading, { color: c.text }]}>1. Acceptance of Terms</Text>
        <Text style={[styles.body, { color: c.textSecondary }]}>
          By downloading, installing, or using HomeEQ ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.
        </Text>

        <Text style={[styles.heading, { color: c.text }]}>2. Description of Service</Text>
        <Text style={[styles.body, { color: c.textSecondary }]}>
          HomeEQ is a home maintenance management application that helps you track appliances, schedule maintenance tasks, manage home-related expenses, and organize trusted service providers. The App may be used for free with limited features, or with a paid subscription ("HomeEQ Pro") for full access.
        </Text>

        <Text style={[styles.heading, { color: c.text }]}>3. Subscriptions & Payments</Text>
        <Text style={[styles.body, { color: c.textSecondary }]}>
          HomeEQ Pro is available as a monthly or annual auto-renewing subscription. Payment is charged to your Apple ID account at confirmation of purchase. Your subscription automatically renews unless cancelled at least 24 hours before the end of the current billing period. You can manage and cancel your subscription in your device's Settings {'>'} Apple ID {'>'} Subscriptions.
        </Text>

        <Text style={[styles.heading, { color: c.text }]}>4. User Accounts</Text>
        <Text style={[styles.body, { color: c.textSecondary }]}>
          You may create an account to enable cloud sync and household sharing features. You are responsible for maintaining the security of your account credentials. You may delete your account at any time from the Home Profile screen, which will permanently remove all associated cloud data.
        </Text>

        <Text style={[styles.heading, { color: c.text }]}>5. User Content</Text>
        <Text style={[styles.body, { color: c.textSecondary }]}>
          You retain ownership of all data you enter into the App, including appliance information, task details, expense records, and home profile data. We do not claim ownership of your content. You are solely responsible for the accuracy of information you enter.
        </Text>

        <Text style={[styles.heading, { color: c.text }]}>6. Acceptable Use</Text>
        <Text style={[styles.body, { color: c.textSecondary }]}>
          You agree to use the App only for its intended purpose of home management. You agree not to:{'\n'}
          {'\u2022'} Attempt to reverse engineer or modify the App{'\n'}
          {'\u2022'} Use the App to store or transmit malicious content{'\n'}
          {'\u2022'} Violate any applicable laws or regulations{'\n'}
          {'\u2022'} Interfere with or disrupt the App's services
        </Text>

        <Text style={[styles.heading, { color: c.text }]}>7. Disclaimer of Warranties</Text>
        <Text style={[styles.body, { color: c.textSecondary }]}>
          The App is provided "as is" without warranties of any kind. HomeEQ does not guarantee that maintenance recommendations, schedules, or cost estimates are accurate or complete. Always consult qualified professionals for home maintenance and repair decisions.
        </Text>

        <Text style={[styles.heading, { color: c.text }]}>8. Limitation of Liability</Text>
        <Text style={[styles.body, { color: c.textSecondary }]}>
          To the maximum extent permitted by law, HomeEQ shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the App, including but not limited to property damage resulting from reliance on App recommendations.
        </Text>

        <Text style={[styles.heading, { color: c.text }]}>9. Termination</Text>
        <Text style={[styles.body, { color: c.textSecondary }]}>
          We reserve the right to suspend or terminate your access to the App at any time for violation of these terms. You may stop using the App at any time and delete your account.
        </Text>

        <Text style={[styles.heading, { color: c.text }]}>10. Changes to Terms</Text>
        <Text style={[styles.body, { color: c.textSecondary }]}>
          We may update these terms from time to time. Continued use of the App after changes constitutes acceptance of the revised terms.
        </Text>

        <Text style={[styles.heading, { color: c.text }]}>11. Contact</Text>
        <Text style={[styles.body, { color: c.textSecondary }]}>
          If you have any questions about these Terms of Service, please contact us through the App's support channels.
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
