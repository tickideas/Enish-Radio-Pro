import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Linking,
  Alert,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/radio';
import { ApiService } from '@/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AdBanner {
  id: string;
  _id?: string;
  title: string;
  imageUrl: string;
  targetUrl?: string;
  isActive: boolean;
  priority?: number;
}

interface AdBannerCarouselProps {
  autoScrollInterval?: number;
  height?: number;
  showIndicators?: boolean;
  borderRadius?: number;
}

export default function AdBannerCarousel({
  autoScrollInterval = 5000,
  height = 120,
  showIndicators = true,
  borderRadius = 16,
}: AdBannerCarouselProps) {
  const [banners, setBanners] = useState<AdBanner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoScrollTimer = useRef<NodeJS.Timeout | null>(null);

  const bannerWidth = SCREEN_WIDTH - 40;

  const fetchBanners = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.getPublicAdBanners();
      if (response.data && Array.isArray(response.data)) {
        const activeBanners = response.data
          .filter((banner: AdBanner) => banner.isActive)
          .sort((a: AdBanner, b: AdBanner) => (b.priority || 0) - (a.priority || 0));
        setBanners(activeBanners);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
    const refreshInterval = setInterval(fetchBanners, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [fetchBanners]);

  useEffect(() => {
    if (banners.length <= 1) return;

    const startAutoScroll = () => {
      autoScrollTimer.current = setInterval(() => {
        setCurrentIndex((prev) => {
          const nextIndex = (prev + 1) % banners.length;
          scrollViewRef.current?.scrollTo({
            x: nextIndex * bannerWidth,
            animated: true,
          });
          return nextIndex;
        });
      }, autoScrollInterval);
    };

    startAutoScroll();

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [banners.length, autoScrollInterval, bannerWidth]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / bannerWidth);
    if (index !== currentIndex && index >= 0 && index < banners.length) {
      setCurrentIndex(index);
    }
  };

  const handleScrollBeginDrag = () => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
    }
  };

  const handleScrollEndDrag = () => {
    if (banners.length <= 1) return;
    
    autoScrollTimer.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % banners.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * bannerWidth,
          animated: true,
        });
        return nextIndex;
      });
    }, autoScrollInterval);
  };

  const handleBannerPress = async (banner: AdBanner) => {
    const bannerId = banner.id || banner._id;
    
    try {
      if (bannerId) {
        await ApiService.trackAdClick(bannerId);
      }
      
      if (banner.targetUrl) {
        const canOpen = await Linking.canOpenURL(banner.targetUrl);
        if (canOpen) {
          await Linking.openURL(banner.targetUrl);
        } else {
          Alert.alert('Error', 'Cannot open this URL');
        }
      }
    } catch (error) {
      console.error('Error handling banner click:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={[styles.placeholder, { borderRadius, height: height - 16 }]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)']}
            style={styles.placeholderGradient}
          />
        </View>
      </View>
    );
  }

  if (banners.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={[styles.emptyBanner, { borderRadius, height: height - 16 }]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
            style={styles.emptyGradient}
          >
            <Ionicons name="megaphone-outline" size={28} color="rgba(255,255,255,0.3)" />
          </LinearGradient>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={bannerWidth}
        snapToAlignment="center"
        contentContainerStyle={styles.scrollContent}
      >
        {banners.map((banner, index) => (
          <TouchableOpacity
            key={banner.id || banner._id || index}
            activeOpacity={0.9}
            onPress={() => handleBannerPress(banner)}
            style={[styles.bannerWrapper, { width: bannerWidth }]}
          >
            <View style={[styles.bannerContainer, { borderRadius }]}>
              <Image
                source={{ uri: banner.imageUrl }}
                style={[styles.bannerImage, { borderRadius }]}
                contentFit="cover"
                transition={300}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.3)']}
                style={[styles.bannerOverlay, { borderRadius }]}
              />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {showIndicators && banners.length > 1 && (
        <View style={styles.indicatorContainer}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentIndex === index && styles.indicatorActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  bannerWrapper: {
    paddingHorizontal: 0,
  },
  bannerContainer: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  indicatorActive: {
    width: 18,
    backgroundColor: COLORS.YELLOW,
  },
  placeholder: {
    marginHorizontal: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  placeholderGradient: {
    flex: 1,
  },
  emptyBanner: {
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  emptyGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
