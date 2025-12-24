import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/radio';

const { width, height } = Dimensions.get('window');

interface NowPlayingArtworkProps {
  artworkUrl?: string;
  isPlaying: boolean;
  size?: number;
  onTogglePlay?: () => void;
}

export default function NowPlayingArtwork({
  artworkUrl,
  isPlaying,
  size = Math.min(width * 0.75, height * 0.4),
  onTogglePlay,
}: NowPlayingArtworkProps) {
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const scaleValue = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    let scaleAnimation: Animated.CompositeAnimation | null = null;
    let glowAnimation: Animated.CompositeAnimation | null = null;

    if (isPlaying) {
      scaleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.02,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      scaleAnimation.start();

      glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.6,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.3,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      glowAnimation.start();
    } else {
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      Animated.timing(glowOpacity, {
        toValue: 0.2,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      scaleAnimation?.stop();
      glowAnimation?.stop();
    };
  }, [isPlaying, scaleValue, glowOpacity]);

  useEffect(() => {
    if (artworkUrl) {
      setImageLoading(true);
      setImageError(false);
    }
  }, [artworkUrl]);

  const handleImageLoad = () => setImageLoading(false);
  const handleImageLoadStart = () => setImageLoading(true);
  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const showFallback = !artworkUrl || imageError;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.glowContainer,
          {
            width: size + 40,
            height: size + 40,
            opacity: glowOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={[
            COLORS.PRIMARY + '60',
            COLORS.SECONDARY + '40',
            COLORS.YELLOW + '30',
            'transparent',
          ]}
          style={styles.glowGradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onTogglePlay}
        disabled={!onTogglePlay}
      >
        <Animated.View
          style={[
            styles.artworkContainer,
            {
              width: size,
              height: size,
              transform: [{ scale: scaleValue }],
            },
          ]}
        >
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.2)',
              'rgba(255, 255, 255, 0.05)',
            ]}
            style={styles.glassBorder}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <View style={styles.artworkInner}>
            {showFallback ? (
              <View style={styles.fallbackContainer}>
                <Image
                  source={require('@/assets/images/icon.png')}
                  style={styles.fallbackImage}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <>
                <Image
                  source={{ uri: artworkUrl }}
                  style={styles.artworkImage}
                  resizeMode="cover"
                  onLoad={handleImageLoad}
                  onLoadStart={handleImageLoadStart}
                  onError={handleImageError}
                />
                {imageLoading && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                  </View>
                )}
              </>
            )}
          </View>
        </Animated.View>
      </TouchableOpacity>
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
    borderRadius: 44,
  },
  glowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
  },
  artworkContainer: {
    borderRadius: 24,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  glassBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  artworkInner: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: COLORS.CARD,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  fallbackImage: {
    width: '60%',
    height: '60%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
