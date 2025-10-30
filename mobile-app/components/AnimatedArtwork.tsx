import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/radio';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface AnimatedArtworkProps {
  artworkUrl?: string;
  isPlaying: boolean;
  size?: number;
}

export default function AnimatedArtwork({
  artworkUrl,
  isPlaying,
  size = Math.min(width * 0.5, height * 0.3),
}: AnimatedArtworkProps) {
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Animation values
  const rotateValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const glowValue = useRef(new Animated.Value(0)).current;

  // Ripple animation values
  const ripple1 = useRef(new Animated.Value(0)).current;
  const ripple2 = useRef(new Animated.Value(0)).current;
  const ripple3 = useRef(new Animated.Value(0)).current;

  // Rotation animation
  useEffect(() => {
    if (isPlaying) {
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateValue, {
          toValue: 1,
          duration: 20000, // 20 seconds for one full rotation
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();

      return () => rotateAnimation.stop();
    } else {
      Animated.timing(rotateValue, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [isPlaying, rotateValue]);

  // Pulse animation
  useEffect(() => {
    if (isPlaying) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    } else {
      Animated.timing(pulseValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isPlaying, pulseValue]);

  // Glow animation
  useEffect(() => {
    if (isPlaying) {
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowValue, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(glowValue, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      );
      glowAnimation.start();

      return () => glowAnimation.stop();
    } else {
      Animated.timing(glowValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [isPlaying, glowValue]);

  // Ripple animations
  useEffect(() => {
    if (isPlaying) {
      const createRippleAnimation = (rippleValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.timing(rippleValue, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(rippleValue, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const ripple1Animation = createRippleAnimation(ripple1, 0);
      const ripple2Animation = createRippleAnimation(ripple2, 600);
      const ripple3Animation = createRippleAnimation(ripple3, 1200);

      ripple1Animation.start();
      ripple2Animation.start();
      ripple3Animation.start();

      return () => {
        ripple1Animation.stop();
        ripple2Animation.stop();
        ripple3Animation.stop();
      };
    } else {
      Animated.parallel([
        Animated.timing(ripple1, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(ripple2, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(ripple3, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isPlaying, ripple1, ripple2, ripple3]);

  // Reset image error when artwork changes
  useEffect(() => {
    if (artworkUrl) {
      setImageLoading(true);
      setImageError(false);
    }
  }, [artworkUrl]);

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const glowScale = glowValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  // Ripple interpolations
  const ripple1Scale = ripple1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });

  const ripple1Opacity = ripple1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.3, 0],
  });

  const ripple2Scale = ripple2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });

  const ripple2Opacity = ripple2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.3, 0],
  });

  const ripple3Scale = ripple3.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });

  const ripple3Opacity = ripple3.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.3, 0],
  });

  return (
    <View style={styles.container}>
      {/* Ripple effects */}
      {isPlaying && (
        <>
          <Animated.View
            style={[
              styles.ripple,
              {
                width: size * 1.1,
                height: size * 1.1,
                borderRadius: size * 0.55,
                opacity: ripple1Opacity,
                transform: [{ scale: ripple1Scale }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ripple,
              {
                width: size * 1.1,
                height: size * 1.1,
                borderRadius: size * 0.55,
                opacity: ripple2Opacity,
                transform: [{ scale: ripple2Scale }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ripple,
              {
                width: size * 1.1,
                height: size * 1.1,
                borderRadius: size * 0.55,
                opacity: ripple3Opacity,
                transform: [{ scale: ripple3Scale }],
              },
            ]}
          />
        </>
      )}

      {/* Animated glow effect */}
      {isPlaying && (
        <Animated.View
          style={[
            styles.glowContainer,
            {
              width: size + 40,
              height: size + 40,
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        >
          <LinearGradient
            colors={[COLORS.PRIMARY + '40', COLORS.PRIMARY + '10', 'transparent']}
            style={styles.gradientGlow}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      )}

      {/* Main artwork container with rotation and pulse */}
      <Animated.View
        style={[
          styles.artworkContainer,
          {
            width: size,
            height: size,
            transform: [{ rotate }, { scale: pulseValue }],
          },
        ]}
      >
        {/* Border rings for visual interest */}
        <View style={[styles.borderRing, styles.outerRing]} />
        <View style={[styles.borderRing, styles.innerRing]} />

        {/* Artwork content */}
        <View style={styles.artworkContent}>
          {artworkUrl && !imageError ? (
            <>
              <Image
                source={{ uri: artworkUrl }}
                style={styles.artworkImage}
                resizeMode="cover"
                onLoad={() => setImageLoading(false)}
                onLoadStart={() => setImageLoading(true)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
              />
              {imageLoading && (
                <View style={styles.loadingOverlay}>
                  <Image
                    source={require('@/assets/images/icon.png')}
                    style={styles.loadingPlaceholder}
                    resizeMode="contain"
                  />
                  <ActivityIndicator size="large" color={COLORS.PRIMARY} style={styles.loadingSpinner} />
                </View>
              )}
            </>
          ) : (
            <View style={styles.placeholderContainer}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.placeholderImage}
                resizeMode="contain"
              />
              {/* Small pulsing indicator when playing */}
              {isPlaying && (
                <Animated.View
                  style={[
                    styles.playingDot,
                    {
                      opacity: glowValue,
                    },
                  ]}
                />
              )}
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'transparent',
  },
  glowContainer: {
    position: 'absolute',
    borderRadius: 1000,
    overflow: 'hidden',
  },
  gradientGlow: {
    width: '100%',
    height: '100%',
    borderRadius: 1000,
  },
  artworkContainer: {
    borderRadius: 1000, // Fully circular
    backgroundColor: '#FFFFFF', // White background
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  borderRing: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 2,
  },
  outerRing: {
    width: '97%',
    height: '97%',
    borderColor: COLORS.PRIMARY + '25',
  },
  innerRing: {
    width: '92%',
    height: '92%',
    borderColor: COLORS.SECONDARY + '20',
  },
  artworkContent: {
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF', // White background for artwork
  },
  artworkImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF', // White background behind the image
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingPlaceholder: {
    width: '60%',
    height: '60%',
    opacity: 0.3,
  },
  loadingSpinner: {
    position: 'absolute',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  placeholderImage: {
    width: '70%',
    height: '70%',
  },
  playingDot: {
    position: 'absolute',
    top: '45%',
    right: '35%',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.PRIMARY,
  },
});
