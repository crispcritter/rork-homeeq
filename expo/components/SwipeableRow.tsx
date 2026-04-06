import React, { useRef, useCallback, useMemo } from 'react';
import {
  View,
  Animated,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { lightImpact } from '@/utils/haptics';

export interface SwipeAction {
  icon: React.ReactNode;
  label: string;
  color: string;
  onPress: () => void;
  testID?: string;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  actionWidth?: number;
  onFullSwipeLeft?: () => void;
  onFullSwipeRight?: () => void;
  enabled?: boolean;
}

const ACTION_WIDTH = 72;
const FULL_SWIPE_THRESHOLD = 0.6;
const SWIPE_VELOCITY_THRESHOLD = 0.3;
const SNAP_THRESHOLD = 0.4;

function SwipeableRow({
  children,
  leftActions = [],
  rightActions = [],
  actionWidth = ACTION_WIDTH,
  onFullSwipeLeft,
  onFullSwipeRight,
  enabled = true,
}: SwipeableRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);
  const currentOffset = useRef(0);
  const hasTriggeredHaptic = useRef(false);

  const leftWidth = leftActions.length * actionWidth;
  const rightWidth = rightActions.length * actionWidth;

  const resetPosition = useCallback(() => {
    isOpen.current = false;
    currentOffset.current = 0;
    hasTriggeredHaptic.current = false;
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 12,
    }).start();
  }, [translateX]);

  const snapToLeft = useCallback(() => {
    isOpen.current = true;
    currentOffset.current = leftWidth;
    Animated.spring(translateX, {
      toValue: leftWidth,
      useNativeDriver: true,
      tension: 100,
      friction: 12,
    }).start();
  }, [translateX, leftWidth]);

  const snapToRight = useCallback(() => {
    isOpen.current = true;
    currentOffset.current = -rightWidth;
    Animated.spring(translateX, {
      toValue: -rightWidth,
      useNativeDriver: true,
      tension: 100,
      friction: 12,
    }).start();
  }, [translateX, rightWidth]);

  const panResponder = useMemo(() => {
    if (!enabled || Platform.OS === 'web') {
      return PanResponder.create({});
    }

    return PanResponder.create({
      onMoveShouldSetPanResponder: (_e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const { dx, dy } = gestureState;
        if (Math.abs(dx) < 8) return false;
        if (Math.abs(dy) > Math.abs(dx)) return false;
        const hasLeft = leftActions.length > 0;
        const hasRight = rightActions.length > 0;
        if (dx > 0 && !hasLeft && !isOpen.current) return false;
        if (dx < 0 && !hasRight && !isOpen.current) return false;
        return true;
      },
      onPanResponderGrant: () => {
        hasTriggeredHaptic.current = false;
        translateX.setOffset(currentOffset.current);
        translateX.setValue(0);
      },
      onPanResponderMove: (_e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        let newVal = gestureState.dx;

        const maxRight = leftWidth > 0 ? leftWidth * 1.2 : 0;
        const maxLeft = rightWidth > 0 ? -rightWidth * 1.2 : 0;

        const totalVal = currentOffset.current + newVal;

        if (totalVal > maxRight) {
          newVal = maxRight - currentOffset.current;
        } else if (totalVal < maxLeft) {
          newVal = maxLeft - currentOffset.current;
        }

        if (!hasTriggeredHaptic.current) {
          const absTotal = Math.abs(currentOffset.current + newVal);
          if (absTotal > actionWidth * 0.5) {
            hasTriggeredHaptic.current = true;
            lightImpact();
          }
        }

        translateX.setValue(newVal);
      },
      onPanResponderRelease: (_e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        translateX.flattenOffset();
        const finalValue = currentOffset.current + gestureState.dx;
        const velocity = gestureState.vx;

        if (finalValue > 0 && leftActions.length > 0) {
          if (finalValue > leftWidth * FULL_SWIPE_THRESHOLD && onFullSwipeRight) {
            Animated.timing(translateX, {
              toValue: leftWidth * 1.5,
              duration: 200,
              useNativeDriver: true,
            }).start(() => {
              onFullSwipeRight();
              resetPosition();
            });
            return;
          }

          if (finalValue > leftWidth * SNAP_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD) {
            snapToLeft();
          } else {
            resetPosition();
          }
        } else if (finalValue < 0 && rightActions.length > 0) {
          if (Math.abs(finalValue) > rightWidth * FULL_SWIPE_THRESHOLD && onFullSwipeLeft) {
            Animated.timing(translateX, {
              toValue: -rightWidth * 1.5,
              duration: 200,
              useNativeDriver: true,
            }).start(() => {
              onFullSwipeLeft();
              resetPosition();
            });
            return;
          }

          if (Math.abs(finalValue) > rightWidth * SNAP_THRESHOLD || velocity < -SWIPE_VELOCITY_THRESHOLD) {
            snapToRight();
          } else {
            resetPosition();
          }
        } else {
          resetPosition();
        }
      },
      onPanResponderTerminate: () => {
        translateX.flattenOffset();
        resetPosition();
      },
    });
  }, [enabled, leftActions.length, rightActions.length, leftWidth, rightWidth, actionWidth, translateX, resetPosition, snapToLeft, snapToRight, onFullSwipeLeft, onFullSwipeRight]);

  const handleActionPress = useCallback((action: SwipeAction) => {
    resetPosition();
    setTimeout(() => {
      action.onPress();
    }, 150);
  }, [resetPosition]);

  const leftActionsOpacity = useMemo(
    () =>
      translateX.interpolate({
        inputRange: [0, leftWidth * 0.3, leftWidth],
        outputRange: [0, 0.5, 1],
        extrapolate: 'clamp',
      }),
    [translateX, leftWidth]
  );

  const rightActionsOpacity = useMemo(
    () =>
      translateX.interpolate({
        inputRange: [-rightWidth, -rightWidth * 0.3, 0],
        outputRange: [1, 0.5, 0],
        extrapolate: 'clamp',
      }),
    [translateX, rightWidth]
  );

  if (Platform.OS === 'web' || (!enabled && leftActions.length === 0 && rightActions.length === 0)) {
    return <View>{children}</View>;
  }

  return (
    <View style={styles.container}>
      {leftActions.length > 0 && (
        <Animated.View
          style={[
            styles.actionsContainer,
            styles.leftActionsContainer,
            { opacity: leftActionsOpacity, width: leftWidth },
          ]}
        >
          {leftActions.map((action, index) => (
            <TouchableOpacity
              key={`left-${index}`}
              style={[styles.actionButton, { backgroundColor: action.color, width: actionWidth }]}
              onPress={() => handleActionPress(action)}
              activeOpacity={0.8}
              testID={action.testID}
            >
              {action.icon}
              <Text style={styles.actionLabel} numberOfLines={1}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}

      {rightActions.length > 0 && (
        <Animated.View
          style={[
            styles.actionsContainer,
            styles.rightActionsContainer,
            { opacity: rightActionsOpacity, width: rightWidth },
          ]}
        >
          {rightActions.map((action, index) => (
            <TouchableOpacity
              key={`right-${index}`}
              style={[styles.actionButton, { backgroundColor: action.color, width: actionWidth }]}
              onPress={() => handleActionPress(action)}
              activeOpacity={0.8}
              testID={action.testID}
            >
              {action.icon}
              <Text style={styles.actionLabel} numberOfLines={1}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}

      <Animated.View
        style={[styles.content, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    zIndex: 1,
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    zIndex: 0,
  },
  leftActionsContainer: {
    left: 0,
  },
  rightActionsContainer: {
    right: 0,
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
});

export default React.memo(SwipeableRow);
