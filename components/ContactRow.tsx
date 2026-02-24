import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { ExternalLink } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface ContactRowProps {
  icon: React.ReactNode;
  text: string;
  url?: string;
  onPress?: () => void;
  numberOfLines?: number;
}

function ContactRow({ icon, text, url, onPress, numberOfLines }: ContactRowProps) {
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
        <Text style={[styles.text, styles.linkText]} numberOfLines={numberOfLines}>
          {text}
        </Text>
        <ExternalLink size={14} color={Colors.textTertiary} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.row}>
      {icon}
      <Text style={styles.text} numberOfLines={numberOfLines}>
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
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  linkText: {
    color: '#4A7FBF',
  },
});

export default React.memo(ContactRow);
