import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

function SectionHeader({ title, actionLabel, onAction, icon, rightElement }: SectionHeaderProps) {
  const { colors: c } = useTheme();

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {icon}
        <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      </View>
      {rightElement}
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={[styles.actionText, { color: c.primary }]}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 19,
  },
});

export default React.memo(SectionHeader);
