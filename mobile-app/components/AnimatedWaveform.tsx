import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS } from '@/constants/radio';

interface AnimatedWaveformProps {
  isPlaying: boolean;
  barCount?: number;
  barWidth?: number;
  barSpacing?: number;
  minHeight?: number;
  maxHeight?: number;
  multiColor?: boolean;
}

const EQUALIZER_COLORS = [
  COLORS.EQUALIZER_RED,
  COLORS.EQUALIZER_TEAL,
  COLORS.EQUALIZER_YELLOW,
  COLORS.EQUALIZER_BLACK,
];

export default function AnimatedWaveform({
  isPlaying,
  barCount = 12,
  barWidth = 4,
  barSpacing = 3,
  minHeight = 4,
  maxHeight = 36,
  multiColor = true,
}: AnimatedWaveformProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(progress, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(progress, {
            toValue: 0,
            duration: 800,
            useNativeDriver: false,
          }),
        ])
      );
      animationRef.current.start();
    } else {
      animationRef.current?.stop();
      Animated.timing(progress, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }

    return () => {
      animationRef.current?.stop();
      progress.stopAnimation();
    };
  }, [isPlaying, progress]);

  const bars = Array.from({ length: barCount }, (_, i) => {
    const phase = (i / barCount) * Math.PI;
    const multiplier = 0.4 + Math.sin(phase) * 0.6;

    const barHeight = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [minHeight, minHeight + (maxHeight - minHeight) * multiplier],
    });

    const barColor = multiColor
      ? EQUALIZER_COLORS[i % EQUALIZER_COLORS.length]
      : COLORS.PRIMARY;

    return (
      <Animated.View
        key={i}
        style={[
          styles.bar,
          {
            width: barWidth,
            height: barHeight,
            backgroundColor: barColor,
            marginHorizontal: barSpacing / 2,
            opacity: isPlaying ? 0.9 : 0.4,
          },
        ]}
      />
    );
  });

  return <View style={styles.container}>{bars}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  bar: {
    borderRadius: 2,
  },
});
