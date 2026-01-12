import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated,
  Image
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

interface AnimatedSplashScreenProps {
  onAnimationComplete: () => void;
}

// Keep the native splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function AnimatedSplashScreen({ onAnimationComplete }: AnimatedSplashScreenProps) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Start all animations
    const startAnimations = () => {
      // Logo animations (scale, fade, and rotate)
      const logoAnimation = Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]);

      // Text animations (fade in and slide up)
      const textAnimation = Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          delay: 500,
          useNativeDriver: true,
        }),
        Animated.spring(textY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          delay: 500,
          useNativeDriver: true,
        }),
      ]);

      // Start all animations
      Animated.sequence([
        Animated.delay(300), // Small delay before starting
        Animated.parallel([
          logoAnimation,
          textAnimation,
        ]),
      ]).start();

      // Complete animation after 3 seconds
      setTimeout(() => {
        onAnimationComplete();
      }, 3000);
    };

    startAnimations();
  }, [scaleAnim, fadeAnim, rotateAnim, textOpacity, textY, onAnimationComplete]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const textStyle = {
    opacity: textOpacity,
    transform: [{ translateY: textY }],
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              transform: [
                { scale: scaleAnim },
                { rotate: spin },
              ],
            },
          ]}
        >
          <Image
            source={require('@/assets/images/splash-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.textContainer, textStyle]}>
        <Text style={styles.appName}>Enish Radio Pro</Text>
        <Text style={styles.tagline}>Your Music, Everywhere</Text>
        
        <View style={styles.loadingContainer}>
          <Animated.View style={[styles.loadingDot, styles.dot1]} />
          <Animated.View style={[styles.loadingDot, styles.dot2]} />
          <Animated.View style={[styles.loadingDot, styles.dot3]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E6F4FE',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 40,
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginHorizontal: 3,
  },
  dot1: {
    opacity: 0.3,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 1,
  },
});
