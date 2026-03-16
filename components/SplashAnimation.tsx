import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions, useColorScheme } from 'react-native';
import { Home } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface SplashAnimationProps {
  onFinish: () => void;
}

export default function SplashAnimation({ onFinish }: SplashAnimationProps) {
  const systemScheme = useColorScheme();
  const isDark = systemScheme === 'dark';

  const bg = isDark ? '#141211' : '#FAF8F5';
  const primaryColor = isDark ? '#6FA876' : '#5A8A60';
  const accentColor = isDark ? '#D49A87' : '#C4826D';
  const textColor = isDark ? '#EDE8E3' : '#2D2926';
  const subtextColor = isDark ? '#9E9790' : '#AEA69D';
  const blobColor1 = isDark ? 'rgba(111, 168, 118, 0.07)' : 'rgba(90, 138, 96, 0.07)';
  const blobColor2 = isDark ? 'rgba(111, 168, 118, 0.05)' : 'rgba(90, 138, 96, 0.05)';
  const iconBg = isDark ? 'rgba(111, 168, 118, 0.1)' : 'rgba(90, 138, 96, 0.1)';
  const iconBorder = isDark ? 'rgba(111, 168, 118, 0.18)' : 'rgba(90, 138, 96, 0.18)';
  const iconScale = useRef(new Animated.Value(0.3)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(18)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const containerScale = useRef(new Animated.Value(1)).current;
  const blob1Opacity = useRef(new Animated.Value(0)).current;
  const blob2Opacity = useRef(new Animated.Value(0)).current;
  const blob1Scale = useRef(new Animated.Value(0.8)).current;
  const blob2Scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(blob1Opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(blob2Opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(blob1Scale, { toValue: 1, tension: 20, friction: 8, useNativeDriver: true }),
      Animated.spring(blob2Scale, { toValue: 1, tension: 18, friction: 9, useNativeDriver: true }),
    ]).start();

    const anim = Animated.sequence([
      Animated.parallel([
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(lineWidth, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(containerScale, {
          toValue: 1.05,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]);
    anim.start(() => {
      onFinish();
    });
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedLineWidth = lineWidth.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 48],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          opacity: containerOpacity,
          transform: [{ scale: containerScale }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.blob1,
          {
            backgroundColor: blobColor1,
            opacity: blob1Opacity,
            transform: [{ scale: blob1Scale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.blob2,
          {
            backgroundColor: blobColor2,
            opacity: blob2Opacity,
            transform: [{ scale: blob2Scale }],
          },
        ]}
      />

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.iconWrap,
            {
              opacity: iconOpacity,
              transform: [{ scale: iconScale }],
            },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: iconBg, borderColor: iconBorder }]}>
            <Home size={34} color={primaryColor} strokeWidth={1.8} />
          </View>
        </Animated.View>

        <Animated.Text
          style={[
            styles.title,
            {
              color: textColor,
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          Home
          <Animated.Text style={[styles.titleBold, { color: primaryColor }]}>EQ</Animated.Text>
        </Animated.Text>

        <Animated.View style={[styles.line, { width: animatedLineWidth, backgroundColor: accentColor }]} />

        <Animated.Text style={[styles.subtitle, { color: primaryColor, opacity: subtitleOpacity }]}>
          Your home, organized
        </Animated.Text>
      </View>

      <Animated.Text style={[styles.footer, { color: subtextColor, opacity: subtitleOpacity }]}>
        Smart home management
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    overflow: 'hidden' as const,
  },
  blob1: {
    position: 'absolute',
    top: -height * 0.12,
    right: -width * 0.25,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
  },
  blob2: {
    position: 'absolute',
    bottom: -height * 0.08,
    left: -width * 0.3,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
  },
  content: {
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 78,
    height: 78,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 38,
    fontWeight: '300',
    letterSpacing: 1,
  },
  titleBold: {
    fontWeight: '700',
  },
  line: {
    height: 1.5,
    borderRadius: 1,
    marginTop: 12,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
});
