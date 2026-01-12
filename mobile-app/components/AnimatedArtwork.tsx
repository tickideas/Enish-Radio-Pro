import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Dimensions,
  PanResponder,
  DimensionValue,
} from 'react-native';
import { COLORS } from '@/constants/radio';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface AnimatedArtworkProps {
  artworkUrl?: string;
  isPlaying: boolean;
  size?: number;
  onTogglePlay?: () => void;
}

export default function AnimatedArtwork({
  artworkUrl,
  isPlaying,
  size = Math.min(width * 0.5, height * 0.3),
  onTogglePlay,
}: AnimatedArtworkProps) {
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Animation values
  const glowValue = useRef(new Animated.Value(0)).current;
  const vinylRotateValue = useRef(new Animated.Value(0)).current;
  const shineValue = useRef(new Animated.Value(0)).current;
  const tonearmValue = useRef(new Animated.Value(0)).current; // 0 = resting, 1 = playing
  const reflectionValue = useRef(new Animated.Value(0)).current;
  const grooveShimmerValue = useRef(new Animated.Value(0)).current;

  // Track manual rotation for interactive spin
  const lastRotation = useRef(0);
  const currentRotation = useRef(0);

  // Pan responder for interactive vinyl spinning
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Stop automatic rotation when user touches
        lastRotation.current = currentRotation.current;
      },
      onPanResponderMove: (_, gestureState) => {
        // Calculate rotation based on finger movement
        const { dx } = gestureState;

        // Update rotation
        currentRotation.current = lastRotation.current + dx * 0.5;
        vinylRotateValue.setValue(currentRotation.current / 360);
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Calculate velocity to give momentum effect
        const velocity = Math.sqrt(
          gestureState.vx * gestureState.vx + gestureState.vy * gestureState.vy
        );

        if (velocity < 0.5) {
          // If slow movement, treat as a tap to toggle play
          if (onTogglePlay) {
            onTogglePlay();
          }
        }

        // Resume automatic rotation if playing
        lastRotation.current = currentRotation.current;
      },
    })
  ).current;

  // Vinyl rotation animation (when playing)
  useEffect(() => {
    if (isPlaying) {
      // Continue from current value and add 1 for next rotation
      const startValue = currentRotation.current / 360;
      vinylRotateValue.setValue(startValue);

      // Create a looping rotation animation
      const rotateAnimation = Animated.loop(
        Animated.timing(vinylRotateValue, {
          toValue: startValue + 1,
          duration: 3000, // 3 seconds for one full rotation (33 RPM-ish feel)
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();

      return () => rotateAnimation.stop();
    }
  }, [isPlaying, vinylRotateValue]);

  // Glow animation (when playing)
  useEffect(() => {
    if (isPlaying) {
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(glowValue, {
            toValue: 0,
            duration: 2000,
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

  // Shine animation (continuous light reflection)
  useEffect(() => {
    const shineAnimation = Animated.loop(
      Animated.timing(shineValue, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    );
    shineAnimation.start();

    return () => shineAnimation.stop();
  }, [shineValue]);

  // Reflection animation (sweeping light effect)
  useEffect(() => {
    const reflectionAnimation = Animated.loop(
      Animated.timing(reflectionValue, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: true,
      })
    );
    reflectionAnimation.start();

    return () => reflectionAnimation.stop();
  }, [reflectionValue]);

  // Groove shimmer animation (subtle iridescent effect on grooves)
  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(grooveShimmerValue, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(grooveShimmerValue, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
        }),
      ])
    );
    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [grooveShimmerValue]);

  // Tonearm animation (swing in when playing, swing out when paused)
  useEffect(() => {
    Animated.spring(tonearmValue, {
      toValue: isPlaying ? 1 : 0,
      friction: 10,
      tension: 35,
      useNativeDriver: true,
    }).start();
  }, [isPlaying, tonearmValue]);

  // Reset image error when artwork changes
  useEffect(() => {
    if (artworkUrl) {
      setImageLoading(true);
      setImageError(false);
    }
  }, [artworkUrl]);

  const vinylRotate = vinylRotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.6],
  });

  const shineRotate = shineValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shineOpacity = shineValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.1, 0.3, 0.1],
  });

  const tonearmRotate = tonearmValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['-85deg', '-15deg'], // Rest position completely outside disc
  });

  const tonearmTranslateX = tonearmValue.interpolate({
    inputRange: [0, 1],
    outputRange: [55, -40], // Push further right at rest to be clear of disc
  });

  const tonearmTranslateY = tonearmValue.interpolate({
    inputRange: [0, 1],
    outputRange: [20, -15], // Adjust vertical position for natural arc
  });

  const reflectionRotate = reflectionValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const reflectionOpacity = reflectionValue.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0.05, 0.2, 0.05, 0.15, 0.05],
  });

  const grooveShimmerColor = grooveShimmerValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['rgba(255, 255, 255, 0.03)', 'rgba(178, 34, 52, 0.08)', 'rgba(31, 168, 160, 0.06)'],
  });

  // Dynamic turntable base styles
  const dynamicStyles = {
    turntableBase: {
      position: 'absolute' as const,
      width: size + 60,
      height: size + 60,
      borderRadius: (size + 60) / 2,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 15,
      zIndex: -5,
    },
    turntableBaseGradient: {
      position: 'absolute' as const,
      width: '100%' as DimensionValue,
      height: '100%' as DimensionValue,
      borderRadius: (size + 60) / 2,
    },
    woodGrainOverlay: {
      position: 'absolute' as const,
      width: '100%' as DimensionValue,
      height: '100%' as DimensionValue,
      borderRadius: (size + 60) / 2,
      overflow: 'hidden' as const,
    },
    woodGrain: {
      position: 'absolute' as const,
      left: '15%' as DimensionValue,
      right: '15%' as DimensionValue,
      height: 2,
      backgroundColor: '#654321',
      borderRadius: 1,
    },
    turntableBaseEdge: {
      position: 'absolute' as const,
      width: '95%' as DimensionValue,
      height: '95%' as DimensionValue,
      borderRadius: (size + 60) / 2,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderTopColor: 'rgba(255, 255, 255, 0.2)',
      borderLeftColor: 'rgba(255, 255, 255, 0.15)',
    },
  };

  return (
    <View style={styles.container}>
      {/* Realistic Turntable Base */}
      <View style={dynamicStyles.turntableBase}>
        <LinearGradient
          colors={['#8B4513', '#A0522D', '#8B4513', '#654321']}
          style={dynamicStyles.turntableBaseGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        {/* Wood grain effect */}
        <View style={dynamicStyles.woodGrainOverlay}>
          {[...Array(8)].map((_, i) => (
            <View
              key={i}
              style={[
                dynamicStyles.woodGrain,
                {
                  top: `${15 + (i * 10)}%` as DimensionValue,
                  opacity: 0.1 + (i % 3) * 0.05,
                },
              ]}
            />
          ))}
        </View>
        {/* Base edge highlight */}
        <View style={dynamicStyles.turntableBaseEdge} />
      </View>

      {/* Ambient glow effect - enhanced with brand colors */}
      {isPlaying && (
        <>
          <Animated.View
            style={[
              styles.glowContainer,
              {
                width: size + 80,
                height: size + 80,
                opacity: glowOpacity,
              },
            ]}
          >
            <LinearGradient
              colors={[COLORS.PRIMARY + '50', COLORS.SECONDARY + '30', COLORS.YELLOW + '20', 'transparent']}
              style={styles.gradientGlow}
              start={{ x: 0.5, y: 0.5 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>
          {/* Secondary glow layer for depth */}
          <Animated.View
            style={[
              styles.glowContainer,
              {
                width: size + 40,
                height: size + 40,
                opacity: glowOpacity.interpolate({
                  inputRange: [0.2, 0.6],
                  outputRange: [0.4, 0.8],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={[COLORS.SECONDARY + '40', COLORS.PRIMARY + '30', 'transparent']}
              style={styles.gradientGlow}
              start={{ x: 0.3, y: 0.3 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>
        </>
      )}

      {/* Main vinyl container */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.vinylContainer,
          {
            width: size,
            height: size,
            transform: [{ rotate: vinylRotate }],
          },
        ]}
      >
        {/* Vinyl disc background (black) */}
        <View style={styles.vinylDisc}>
          {/* Radial gradient for depth */}
          <View style={styles.vinylDepthGradient}>
            <LinearGradient
              colors={['#2a2a2a', '#1a1a1a', '#0a0a0a', '#000000']}
              style={styles.depthGradientInner}
              start={{ x: 0.5, y: 0.5 }}
              end={{ x: 1, y: 1 }}
            />
          </View>

          {/* Enhanced vinyl grooves with shimmer effect */}
          {[...Array(30)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.vinylGroove,
                {
                  width: `${96 - i * 2.8}%`,
                  height: `${96 - i * 2.8}%`,
                  borderColor: grooveShimmerColor,
                  opacity: 0.2 + (i % 4) * 0.05,
                },
              ]}
            />
          ))}

          {/* Primary reflection sweep */}
          <Animated.View
            style={[
              styles.vinylReflection,
              {
                opacity: reflectionOpacity,
                transform: [{ rotate: reflectionRotate }],
              },
            ]}
          >
            <LinearGradient
              colors={[
                'transparent',
                COLORS.PRIMARY + '15',
                COLORS.SECONDARY + '20',
                COLORS.YELLOW + '10',
                'transparent',
              ]}
              style={styles.reflectionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>

          {/* Secondary shine effect */}
          <Animated.View
            style={[
              styles.vinylShine,
              {
                opacity: shineOpacity,
                transform: [{ rotate: shineRotate }],
              },
            ]}
          >
            <LinearGradient
              colors={[
                'transparent',
                'rgba(255, 255, 255, 0.1)',
                'rgba(255, 255, 255, 0.2)',
                'rgba(255, 255, 255, 0.1)',
                'transparent',
              ]}
              style={styles.shineGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>

          {/* Edge highlight for 3D effect */}
          <View style={styles.vinylEdgeHighlight} />
        </View>

        {/* Center label with artwork */}
        <View style={[styles.centerLabel, { width: size * 0.45, height: size * 0.45 }]}>
          {/* Decorative outer ring with brand colors */}
          <View style={styles.labelOuterRing}>
            <LinearGradient
              colors={[COLORS.PRIMARY, COLORS.ACCENT, COLORS.SECONDARY, COLORS.YELLOW, COLORS.PRIMARY]}
              style={styles.labelRingGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </View>

          {/* Label background */}
          <View style={styles.labelBackground}>
            {/* Subtle gradient overlay for depth */}
            <View style={styles.labelGradientOverlay}>
              <LinearGradient
                colors={['rgba(253, 252, 251, 0.95)', 'rgba(255, 248, 240, 0.98)', 'rgba(253, 252, 251, 1)']}
                style={styles.labelGradientInner}
                start={{ x: 0.5, y: 0.5 }}
                end={{ x: 1, y: 1 }}
              />
            </View>

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
                    <ActivityIndicator size="large" color={COLORS.PRIMARY} />
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
              </View>
            )}
          </View>

          {/* Center spindle hole with metallic effect */}
          <View style={styles.spindleHole}>
            <LinearGradient
              colors={['#4a4a4a', '#2a2a2a', '#1a1a1a']}
              style={styles.spindleHoleGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.spindleHoleInner}>
              <View style={styles.spindleHighlight} />
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Tonearm - Enhanced with metallic effects */}
      <Animated.View
        style={[
          styles.tonearmContainer,
          {
            right: -size * 0.05,
            top: size * 0.15,
            transform: [
              { translateX: tonearmTranslateX },
              { translateY: tonearmTranslateY },
              { rotate: tonearmRotate },
            ],
          },
        ]}
        pointerEvents="none"
      >
        {/* Tonearm base/pivot with gradient */}
        <View style={styles.tonearmBase}>
          <LinearGradient
            colors={['#3a3a3a', '#2a2a2a', '#1a1a1a']}
            style={styles.tonearmBaseGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.tonearmPivot}>
            <LinearGradient
              colors={[COLORS.ACCENT, COLORS.PRIMARY]}
              style={styles.tonearmPivotGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </View>
          {/* Highlight for metallic effect */}
          <View style={styles.tonearmBaseHighlight} />
        </View>

        {/* Tonearm arm with metallic gradient */}
        <View style={styles.tonearmArm}>
          <LinearGradient
            colors={['#4a4a4a', '#3a3a3a', '#2a2a2a']}
            style={styles.tonearmArmGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          {/* Metallic shine on arm */}
          <View style={styles.tonearmArmShine} />

          {/* Headshell (the part that holds the needle) */}
          <View style={styles.tonearmHeadshell}>
            <LinearGradient
              colors={['#5a5a5a', '#4a4a4a', '#3a3a3a']}
              style={styles.tonearmHeadshellGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            {/* Cartridge with brand color accent */}
            <View style={styles.tonearmCartridge}>
              <LinearGradient
                colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                style={styles.tonearmCartridgeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </View>
            {/* Needle/Stylus with metallic effect */}
            <View style={styles.tonearmNeedle}>
              <LinearGradient
                colors={['#aaa', '#888', '#666']}
                style={styles.tonearmNeedleGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
            </View>
          </View>
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
  vinylContainer: {
    borderRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
  },
  vinylDisc: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#000000',
  },
  vinylDepthGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    overflow: 'hidden',
  },
  depthGradientInner: {
    width: '100%',
    height: '100%',
    borderRadius: 1000,
  },
  vinylGroove: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 0.5,
  },
  vinylReflection: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    overflow: 'hidden',
  },
  reflectionGradient: {
    width: '200%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: '-50%',
  },
  vinylShine: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    overflow: 'hidden',
  },
  shineGradient: {
    width: '200%',
    height: '200%',
    position: 'absolute',
    top: '-50%',
    left: '-50%',
  },
  vinylEdgeHighlight: {
    position: 'absolute',
    width: '98%',
    height: '98%',
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    borderLeftColor: 'rgba(255, 255, 255, 0.05)',
  },
  centerLabel: {
    borderRadius: 1000,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 15,
    overflow: 'visible',
    position: 'relative',
  },
  labelOuterRing: {
    position: 'absolute',
    width: '106%',
    height: '106%',
    borderRadius: 1000,
    overflow: 'hidden',
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
  },
  labelRingGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 1000,
  },
  labelBackground: {
    width: '92%',
    height: '92%',
    borderRadius: 1000,
    overflow: 'hidden',
    backgroundColor: COLORS.BACKGROUND,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
  },
  labelGradientOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    overflow: 'hidden',
    zIndex: -1,
  },
  labelGradientInner: {
    width: '100%',
    height: '100%',
    borderRadius: 1000,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
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
  spindleHole: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 8,
    overflow: 'hidden',
  },
  spindleHoleGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  spindleHoleInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  spindleHighlight: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    position: 'absolute',
    top: 3,
    left: 3,
  },
  tonearmContainer: {
    position: 'absolute',
    width: 140,
    height: 120,
    zIndex: 10,
  },
  tonearmBase: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    right: 20,
    top: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
    overflow: 'hidden',
  },
  tonearmBaseGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  tonearmBaseHighlight: {
    position: 'absolute',
    top: 2,
    left: 3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  tonearmPivot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  tonearmPivotGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  tonearmArm: {
    position: 'absolute',
    width: 105,
    height: 7,
    right: 34,
    top: 20.5,
    borderRadius: 3.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
    overflow: 'hidden',
  },
  tonearmArmGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 3.5,
  },
  tonearmArmShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderTopLeftRadius: 3.5,
    borderTopRightRadius: 3.5,
  },
  tonearmHeadshell: {
    position: 'absolute',
    left: -2,
    top: -5,
    width: 22,
    height: 16,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  tonearmHeadshellGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  tonearmCartridge: {
    width: 10,
    height: 10,
    borderRadius: 2,
    overflow: 'hidden',
    shadowColor: COLORS.SECONDARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 2,
  },
  tonearmCartridgeGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  tonearmNeedle: {
    position: 'absolute',
    bottom: -8,
    left: 6,
    width: 3,
    height: 12,
    borderRadius: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 3,
  },
  tonearmNeedleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 1.5,
  },
});
