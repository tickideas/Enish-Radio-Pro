import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Dimensions,
  PanResponder,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const rotateValue = useRef(new Animated.Value(0)).current;
  const glowValue = useRef(new Animated.Value(0)).current;
  const vinylRotateValue = useRef(new Animated.Value(0)).current;
  const shineValue = useRef(new Animated.Value(0)).current;
  const tonearmValue = useRef(new Animated.Value(0)).current; // 0 = resting, 1 = playing

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
      onPanResponderMove: (evt, gestureState) => {
        // Calculate rotation based on finger movement
        const { dx, dy, moveX, moveY } = gestureState;
        const centerX = width / 2;
        const centerY = height * 0.25; // Approximate center of vinyl

        // Calculate angle of movement
        const angle = Math.atan2(moveY - centerY, moveX - centerX);
        const rotation = (angle * 180) / Math.PI;

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

  // Tonearm animation (swing in when playing, swing out when paused)
  useEffect(() => {
    Animated.spring(tonearmValue, {
      toValue: isPlaying ? 1 : 0,
      friction: 8,
      tension: 40,
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
    outputRange: ['-25deg', '0deg'], // Swings from resting position to playing position
  });

  const tonearmTranslateX = tonearmValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15], // Moves inward slightly when playing
  });

  return (
    <View style={styles.container}>
      {/* Ambient glow effect */}
      {isPlaying && (
        <Animated.View
          style={[
            styles.glowContainer,
            {
              width: size + 60,
              height: size + 60,
              opacity: glowOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={[COLORS.PRIMARY + '60', COLORS.YELLOW + '40', 'transparent']}
            style={styles.gradientGlow}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
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
          {/* Vinyl grooves - multiple concentric circles */}
          {[...Array(20)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.vinylGroove,
                {
                  width: `${95 - i * 4}%`,
                  height: `${95 - i * 4}%`,
                  opacity: 0.15 + (i % 3) * 0.05,
                },
              ]}
            />
          ))}

          {/* Vinyl shine effect */}
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
              colors={['transparent', 'rgba(255, 255, 255, 0.15)', 'transparent']}
              style={styles.shineGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>
        </View>

        {/* Center label with artwork */}
        <View style={[styles.centerLabel, { width: size * 0.45, height: size * 0.45 }]}>
          {/* Label background */}
          <View style={styles.labelBackground}>
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

          {/* Center spindle hole */}
          <View style={styles.spindleHole}>
            <View style={styles.spindleHoleInner} />
          </View>
        </View>
      </Animated.View>

      {/* Tonearm */}
      <Animated.View
        style={[
          styles.tonearmContainer,
          {
            right: size * 0.15,
            top: size * 0.2,
            transform: [
              { translateX: tonearmTranslateX },
              { rotate: tonearmRotate },
            ],
          },
        ]}
        pointerEvents="none"
      >
        {/* Tonearm base/pivot */}
        <View style={styles.tonearmBase}>
          <View style={styles.tonearmPivot} />
        </View>

        {/* Tonearm arm */}
        <View style={styles.tonearmArm}>
          {/* Headshell (the part that holds the needle) */}
          <View style={styles.tonearmHeadshell}>
            {/* Cartridge */}
            <View style={styles.tonearmCartridge} />
            {/* Needle/Stylus */}
            <View style={styles.tonearmNeedle} />
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  vinylDisc: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    backgroundColor: '#1a1a1a', // Dark vinyl black
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#0a0a0a',
  },
  vinylGroove: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
  centerLabel: {
    borderRadius: 1000,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#e0e0e0',
  },
  labelBackground: {
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  spindleHoleInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#555',
  },
  tonearmContainer: {
    position: 'absolute',
    width: 120,
    height: 100,
    zIndex: 10,
  },
  tonearmBase: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    right: 0,
    top: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  tonearmPivot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
  },
  tonearmArm: {
    position: 'absolute',
    width: 90,
    height: 6,
    backgroundColor: '#3a3a3a',
    right: 12,
    top: 9,
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  tonearmHeadshell: {
    position: 'absolute',
    left: -2,
    top: -4,
    width: 20,
    height: 14,
    backgroundColor: '#4a4a4a',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  tonearmCartridge: {
    width: 8,
    height: 8,
    backgroundColor: '#666',
    borderRadius: 1,
  },
  tonearmNeedle: {
    position: 'absolute',
    bottom: -6,
    left: 6,
    width: 2,
    height: 10,
    backgroundColor: '#888',
    borderRadius: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
});
