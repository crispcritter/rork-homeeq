import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface FloatingActionButtonProps {
  onPress: () => void;
  color?: string;
  testID?: string;
}

function FloatingActionButton({ onPress, color, testID }: FloatingActionButtonProps) {
  const { colors: c } = useTheme();
  const fabAnim = useRef(new Animated.Value(0)).current;
  const btnColor = color ?? c.primary;

  useEffect(() => {
    Animated.spring(fabAnim, {
      toValue: 1,
      delay: 400,
      useNativeDriver: true,
      speed: 12,
      bounciness: 8,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.fabContainer, {
      transform: [{ scale: fabAnim }],
      opacity: fabAnim,
    }]}>
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: btnColor, shadowColor: btnColor }]}
        onPress={onPress}
        activeOpacity={0.85}
        testID={testID}
      >
        <Plus size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
});

export default React.memo(FloatingActionButton);
