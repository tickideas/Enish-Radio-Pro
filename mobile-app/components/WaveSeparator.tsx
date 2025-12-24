import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/radio';

const { width } = Dimensions.get('window');

interface WaveSeparatorProps {
  isAnimating?: boolean;
  height?: number;
  waveCount?: number;
}

export default function WaveSeparator({
  isAnimating = true,
  height = 24,
  waveCount = 5,
}: WaveSeparatorProps) {
  const waveAnimations = useRef(
    Array.from({ length: waveCount }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (!isAnimating) {
      waveAnimations.forEach((anim) => anim.setValue(0));
      return;
    }

    const animations = waveAnimations.map((anim, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 1200 + index * 150,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 1200 + index * 150,
            useNativeDriver: true,
          }),
        ])
      )
    );

    animations.forEach((anim, index) => {
      setTimeout(() => anim.start(), index * 200);
    });

    return () => {
      animations.forEach((anim) => anim.stop());
    };
  }, [isAnimating, waveAnimations]);

  const waves = waveAnimations.map((anim, index) => {
    const translateY = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -6],
    });

    const opacity = anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.3, 0.7, 0.3],
    });

    const scaleX = anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.95, 1.05, 0.95],
    });

    const colors = [
      [COLORS.PRIMARY, COLORS.SECONDARY],
      [COLORS.SECONDARY, COLORS.YELLOW],
      [COLORS.YELLOW, COLORS.ACCENT],
      [COLORS.ACCENT, COLORS.PRIMARY],
      [COLORS.PRIMARY, COLORS.YELLOW],
    ];

    return (
      <Animated.View
        key={index}
        style={[
          styles.waveWrapper,
          {
            transform: [{ translateY }, { scaleX }],
            opacity,
          },
        ]}
      >
        <LinearGradient
          colors={colors[index % colors.length]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.wave,
            {
              height: 2,
              width: width * (0.5 - index * 0.08),
            },
          ]}
        />
      </Animated.View>
    );
  });

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.wavesContainer}>{waves}</View>
      <View style={styles.centerDot}>
        <LinearGradient
          colors={[COLORS.YELLOW, COLORS.ACCENT]}
          style={styles.dotGradient}
        />
      </View>
      <View style={styles.wavesContainer}>{waves}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 8,
  },
  wavesContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveWrapper: {
    position: 'absolute',
  },
  wave: {
    borderRadius: 4,
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 12,
  },
  dotGradient: {
    flex: 1,
  },
});
