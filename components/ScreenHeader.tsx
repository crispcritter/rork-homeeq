import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ScreenHeaderProps {
  title: string;
  subtitle: string;
}

function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  const { colors: c } = useTheme();

  return (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: c.text }]}>{title}</Text>
      <Text style={[styles.headerSubtitle, { color: c.textSecondary }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800' as const,
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  headerSubtitle: {
    fontSize: 15,
    marginTop: 2,
    lineHeight: 21,
  },
});

export default React.memo(ScreenHeader);
