import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AVATAR_COLORS = ['#C4826D', '#5A8A60', '#B08D57', '#A08670', '#4A7FBF', '#7B61A8'];

interface ProAvatarProps {
  name: string;
  size?: number;
  colorIndex?: number;
  backgroundColor?: string;
}

function ProAvatar({ name, size = 44, colorIndex, backgroundColor }: ProAvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const bgColor = backgroundColor ?? AVATAR_COLORS[(colorIndex ?? 0) % AVATAR_COLORS.length];
  const fontSize = size * 0.4;
  const borderRadius = size / 2;

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: bgColor + '20',
        },
      ]}
    >
      <Text style={[styles.initial, { fontSize, color: bgColor }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  initial: {
    fontWeight: '700' as const,
  },
});

export default React.memo(ProAvatar);
