import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS } from '@/constants/radio';

const { width } = Dimensions.get('window');

interface AnimatedWaveformProps {
  isPlaying: boolean;
  barCount?: number;
  barWidth?: number;
  barSpacing?: number;
  minHeight?: number;
  maxHeight?: number;
  color?: string;
}

export default function AnimatedWaveform({
  isPlaying,
  barCount = 30,
  barWidth = 2.5,
  barSpacing = 2,
  minHeight = 3,
  maxHeight = 40,
  color = COLORS.PRIMARY,
}: AnimatedWaveformProps) {
  const animatedValues = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(minHeight))
  ).current;

  useEffect(() => {
    if (isPlaying) {
      // Create staggered animations for each bar
      const animations = animatedValues.map((animValue, index) => {
        const randomDuration = 300 + Math.random() * 400; // 300-700ms
        const delay = index * 30; // Stagger by 30ms

        return Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: minHeight + Math.random() * (maxHeight - minHeight),
              duration: randomDuration,
              delay: delay,
              useNativeDriver: false,
            }),
            Animated.timing(animValue, {
              toValue: minHeight + Math.random() * (maxHeight - minHeight) * 0.5,
              duration: randomDuration,
              useNativeDriver: false,
            }),
          ])
        );
      });

      // Start all animations
      Animated.parallel(animations).start();
    } else {
      // Reset to minimum height when not playing
      Animated.parallel(
        animatedValues.map((animValue) =>
          Animated.timing(animValue, {
            toValue: minHeight,
            duration: 300,
            useNativeDriver: false,
          })
        )
      ).start();
    }
  }, [isPlaying, animatedValues, minHeight, maxHeight]);

  return (
    <View style={styles.container}>
      {animatedValues.map((animValue, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              width: barWidth,
              height: animValue,
              backgroundColor: color,
              marginHorizontal: barSpacing / 2,
              opacity: isPlaying ? 0.7 + Math.random() * 0.3 : 0.3,
            },
          ]}
        />
      ))}
    </View>
  );
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
