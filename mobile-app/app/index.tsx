import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  Alert,
  Dimensions,
  ActivityIndicator,
  Linking,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import { COLORS, APP_CONFIG } from '@/constants/radio';
import AnimatedArtwork from '@/components/AnimatedArtwork';
import AnimatedWaveform from '@/components/AnimatedWaveform';
import { ApiService } from '@/services/api';
import { useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

interface AdBanner {
  _id: string;
  title: string;
  imageUrl: string;
  targetUrl?: string;
  isActive: boolean;
  position: number;
}

export default function HomeScreen() {
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [activeBanner, setActiveBanner] = useState<AdBanner | null>(null);
  const [isBannerLoading, setIsBannerLoading] = useState(false);

  const audioPlayer = useAudioPlayerContext();
  const router = useRouter();
  const navigation = useNavigation();

  // Fetch ad banners
  useEffect(() => {
    const fetchAdBanners = async () => {
      try {
        setIsBannerLoading(true);
        const response = await ApiService.getPublicAdBanners();
        // Get the first active banner
        const activeAd = response.data?.find((banner: AdBanner) => banner.isActive);
        setActiveBanner(activeAd || null);
      } catch (error) {
        console.error('Error fetching ad banners:', error);
        // Silently fail - no banner will be shown
      } finally {
        setIsBannerLoading(false);
      }
    };

    fetchAdBanners();

    // Refresh banners every 5 minutes
    const interval = setInterval(fetchAdBanners, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleShareApp = () => {
    // This will be implemented with react-native-share
    Alert.alert('Share App', 'Share functionality will be implemented soon.');
  };

  const handleBannerClick = async () => {
    if (!activeBanner) return;

    try {
      // Track the click
      await ApiService.trackAdClick(activeBanner._id);

      // Open the URL if it exists
      if (activeBanner.targetUrl) {
        const canOpen = await Linking.canOpenURL(activeBanner.targetUrl);
        if (canOpen) {
          await Linking.openURL(activeBanner.targetUrl);
        } else {
          Alert.alert('Error', 'Cannot open this URL');
        }
      }
    } catch (error) {
      console.error('Error handling banner click:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Main Content with Background Image and Gradient */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(178, 34, 52, 0.5)', 'rgba(184, 151, 90, 0.55)', 'rgba(31, 168, 160, 0.6)']}
          style={styles.gradientOverlay}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        >
          {/* Header Bar - Transparent Overlay */}
          <View style={styles.headerBar}>
            <View style={styles.headerBarContent}>
              <TouchableOpacity
                style={styles.headerIconButton}
                onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              >
                <Ionicons name="menu" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>{APP_CONFIG.NAME}</Text>
              </View>

              <TouchableOpacity
                style={styles.headerIconButton}
                onPress={() => router.push('/settings')}
              >
                <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.mainContent}>
            {/* Animated Album Art / Visualizer - Centered */}
            <View style={styles.albumArtContainer}>
              <AnimatedArtwork
                artworkUrl={audioPlayer.metadata.artwork}
                isPlaying={audioPlayer.isPlaying}
                size={Math.min(width * 0.58, height * 0.28)}
                onTogglePlay={audioPlayer.togglePlayPause}
              />
            </View>

            {/* Track Info - Positioned lower */}
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle}>
                {audioPlayer.metadata.title || 'Enish Radio Live'}
              </Text>
              <Text style={styles.trackArtist}>
                {audioPlayer.metadata.artist || '24/7 Music Stream'}
              </Text>
              {audioPlayer.metadata.album && (
                <Text style={styles.trackAlbum}>{audioPlayer.metadata.album}</Text>
              )}
            </View>

            {/* Status Indicators - Minimal */}
            {(audioPlayer.isBuffering || audioPlayer.error) && (
              <View style={styles.statusContainer}>
                {audioPlayer.isBuffering && !audioPlayer.isPlaying && (
                  <View style={styles.bufferingIndicator}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                )}
                {audioPlayer.error && (
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={audioPlayer.retryConnection}
                  >
                    <Ionicons name="refresh" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Spacer */}
            <View style={{ flex: 1 }} />

            {/* Animated Waveform Visualizer - At Bottom */}
            <View style={styles.waveformContainer}>
              <AnimatedWaveform
                isPlaying={audioPlayer.isPlaying}
                barCount={50}
                barWidth={3}
                barSpacing={2}
                minHeight={4}
                maxHeight={60}
                multiColor={true}
              />
            </View>

            {/* Player Controls */}
            <View style={styles.playerControlsRow}>
              {/* Radio/Station Button */}
              <TouchableOpacity
                style={styles.sideButton}
                onPress={() => {
                  // Future: Open station list
                  Alert.alert('Stations', 'Station list coming soon');
                }}
              >
                <Ionicons name="radio-outline" size={28} color={COLORS.PRIMARY} />
              </TouchableOpacity>

              {/* Main Play/Pause Button - Center */}
              <TouchableOpacity
                style={styles.mainControlButton}
                onPress={audioPlayer.togglePlayPause}
                disabled={audioPlayer.isLoading}
              >
                <View style={styles.playButtonCircle}>
                  <Ionicons
                    name={audioPlayer.isPlaying ? 'pause' : 'play'}
                    size={42}
                    color="#FFFFFF"
                  />
                </View>
              </TouchableOpacity>

              {/* Refresh Button */}
              <TouchableOpacity
                style={styles.sideButton}
                onPress={() => {
                  audioPlayer.retryConnection();
                }}
              >
                <Ionicons name="refresh-outline" size={28} color={COLORS.PRIMARY} />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  headerBar: {
    paddingTop: height * 0.06, // Status bar height
    paddingBottom: height * 0.015,
    paddingHorizontal: width * 0.04,
    backgroundColor: 'transparent',
  },
  headerBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconButton: {
    padding: 8,
    width: 40,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  gradientOverlay: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.03,
    paddingTop: height * 0.03,
  },
  albumArtContainer: {
    alignItems: 'center',
    marginTop: height * 0.02,
    marginBottom: height * 0.015,
  },
  trackInfo: {
    alignItems: 'center',
    marginTop: height * 0.04,
    paddingHorizontal: width * 0.08,
    paddingVertical: height * 0.02,
    marginHorizontal: width * 0.05,
  },
  trackTitle: {
    fontSize: Math.min(24, width * 0.06),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  trackArtist: {
    fontSize: Math.min(18, width * 0.045),
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
    opacity: 0.95,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  trackAlbum: {
    fontSize: Math.min(15, width * 0.038),
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: height * 0.01,
  },
  bufferingIndicator: {
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  waveformContainer: {
    alignItems: 'center',
    marginBottom: height * 0.025,
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.015,
    marginHorizontal: width * 0.05,
  },
  playerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.1,
    marginBottom: height * 0.015,
    marginTop: height * 0.01,
  },
  sideButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.CARD,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  mainControlButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
});
