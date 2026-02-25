import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { ExternalLink } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ContactRowProps {
  icon: React.ReactNode;
  text: string;
  url?: string;
  onPress?: () => void;
  numberOfLines?: number;
}

function ContactRow({ icon, text, url, onPress, numberOfLines }: ContactRowProps) {
  const { colors: c } = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (url) {
      Linking.openURL(url).catch(() => {
        console.log('[ContactRow] Could not open URL:', url);
      });
    }
  };

  const isClickable = !!onPress || !!url;

  if (isClickable) {
    return (
      <TouchableOpacity style={styles.row} onPress={handlePress} activeOpacity={0.7}>
        {icon}
        <Text style={[styles.text, { color: c.primary }]} numberOfLines={numberOfLines}>
          {text}
        </Text>
        <ExternalLink size={14} color={c.textTertiary} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.row}>
      {icon}
      <Text style={[styles.text, { color: c.textSecondary }]} numberOfLines={numberOfLines}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 17,
  },
  linkText: {},
});

export default React.memo(ContactRow);
