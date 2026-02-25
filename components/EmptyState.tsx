import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

function EmptyState({ icon, title, subtitle, actionLabel, onAction, compact }: EmptyStateProps) {
  const { colors: c } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: c.surface, shadowColor: c.cardShadow }, compact && styles.containerCompact]}>
      <View style={[styles.iconWrap, { backgroundColor: c.primaryLight }, compact && styles.iconWrapCompact]}>{icon}</View>
      <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: c.textSecondary }]}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: c.primaryLight }]} onPress={onAction} activeOpacity={0.7}>
          <Text style={[styles.actionText, { color: c.primary }]}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 1,
  },
  containerCompact: {
    padding: 20,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrapCompact: {
    width: 44,
    height: 44,
    borderRadius: 14,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
    lineHeight: 22,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
  },
  actionBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 19,
  },
});

export default React.memo(EmptyState);
