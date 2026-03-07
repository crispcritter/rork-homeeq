import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { Home } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface SplashAnimationProps {
  onFinish: () => void;
}

export default function SplashAnimation({ onFinish }: SplashAnimationProps) {
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
          opacity: containerOpacity,
          transform: [{ scale: containerScale }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.blob1,
          {
            opacity: blob1Opacity,
            transform: [{ scale: blob1Scale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.blob2,
          {
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
          <View style={styles.iconCircle}>
            <Home size={34} color="#5A8A60" strokeWidth={1.8} />
          </View>
        </Animated.View>

        <Animated.Text
          style={[
            styles.title,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          Home
          <Animated.Text style={styles.titleBold}>EQ</Animated.Text>
        </Animated.Text>

        <Animated.View style={[styles.line, { width: animatedLineWidth }]} />

        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          Your home, organized
        </Animated.Text>
      </View>

      <Animated.Text style={[styles.footer, { opacity: subtitleOpacity }]}>
        Smart home management
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FAF8F5',
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
    backgroundColor: 'rgba(90, 138, 96, 0.07)',
  },
  blob2: {
    position: 'absolute',
    bottom: -height * 0.08,
    left: -width * 0.3,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(90, 138, 96, 0.05)',
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
    backgroundColor: 'rgba(90, 138, 96, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(90, 138, 96, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 38,
    color: '#2D2926',
    fontWeight: '300' as const,
    letterSpacing: 1,
  },
  titleBold: {
    fontWeight: '700' as const,
    color: '#C4826D',
  },
  line: {
    height: 1.5,
    backgroundColor: '#C4826D',
    borderRadius: 1,
    marginTop: 12,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 13,
    color: '#5A8A60',
    fontWeight: '400' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    fontSize: 11,
    color: '#AEA69D',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
});
