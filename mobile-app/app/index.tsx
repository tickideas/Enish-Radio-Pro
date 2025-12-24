import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
import NowPlayingArtwork from '@/components/NowPlayingArtwork';
import AnimatedWaveform from '@/components/AnimatedWaveform';
import { ApiService } from '@/services/api';
import { useRouter } from 'expo-router';
import { DrawerActions, useNavigation } from '@react-navigation/native';

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
  const [activeBanner, setActiveBanner] = useState<AdBanner | null>(null);

  const audioPlayer = useAudioPlayerContext();
  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    const fetchAdBanners = async () => {
      try {
        const response = await ApiService.getPublicAdBanners();
        const activeAd = response.data?.find((banner: AdBanner) => banner.isActive);
        setActiveBanner(activeAd || null);
      } catch (error) {
        console.error('Error fetching ad banners:', error);
      }
    };

    fetchAdBanners();
    const interval = setInterval(fetchAdBanners, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleBannerClick = async () => {
    if (!activeBanner) return;

    try {
      await ApiService.trackAdClick(activeBanner._id);
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

  void activeBanner;
  void handleBannerClick;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={[
          COLORS.PRIMARY,
          '#8B1A2B',
          '#1A3A38',
          COLORS.SECONDARY,
          '#0D2827',
        ]}
        style={styles.gradientBackground}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      >
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
          <View style={styles.glassCard}>
            <View style={styles.glassCardInner}>
              <NowPlayingArtwork
                artworkUrl={audioPlayer.metadata.artwork}
                isPlaying={audioPlayer.isPlaying}
                size={Math.min(width * 0.55, height * 0.28)}
                onTogglePlay={audioPlayer.togglePlayPause}
              />

              <View style={styles.trackInfo}>
                <Text style={styles.trackTitle} numberOfLines={2}>
                  {audioPlayer.metadata.title || 'Enish Radio Live'}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {audioPlayer.metadata.artist || '24/7 Music Stream'}
                </Text>
                {audioPlayer.metadata.album && (
                  <Text style={styles.trackAlbum} numberOfLines={1}>
                    {audioPlayer.metadata.album}
                  </Text>
                )}
              </View>

              {(audioPlayer.isBuffering || audioPlayer.error) && (
                <View style={styles.statusContainer}>
                  {audioPlayer.isBuffering && !audioPlayer.isPlaying && (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  )}
                  {audioPlayer.error && (
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={audioPlayer.retryConnection}
                    >
                      <Ionicons name="refresh" size={20} color="#FFFFFF" />
                      <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View style={styles.playerControlsRow}>
                <TouchableOpacity
                  style={styles.sideButton}
                  onPress={() => Alert.alert('Stations', 'Station list coming soon')}
                >
                  <Ionicons name="radio-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mainControlButton}
                  onPress={audioPlayer.togglePlayPause}
                  disabled={audioPlayer.isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[COLORS.YELLOW, COLORS.ACCENT]}
                    style={styles.playButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons
                      name={audioPlayer.isPlaying ? 'pause' : 'play'}
                      size={36}
                      color="#FFFFFF"
                      style={audioPlayer.isPlaying ? {} : { marginLeft: 4 }}
                    />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sideButton}
                  onPress={audioPlayer.retryConnection}
                >
                  <Ionicons name="refresh-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.liveIndicator}>
            <View style={[styles.liveDot, audioPlayer.isPlaying && styles.liveDotActive]} />
            <Text style={styles.liveText}>
              {audioPlayer.isPlaying ? 'LIVE' : 'PAUSED'} • {APP_CONFIG.NAME}
            </Text>
          </View>

          <View style={styles.waveformContainer}>
            <AnimatedWaveform
              isPlaying={audioPlayer.isPlaying}
              barCount={12}
              barWidth={4}
              barSpacing={3}
              minHeight={4}
              maxHeight={36}
              multiColor={true}
            />
          </View>

          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={styles.bottomActionButton}
              onPress={() => router.push('/sleep-timer')}
            >
              <Ionicons name="timer-outline" size={22} color="rgba(255,255,255,0.7)" />
              <Text style={styles.bottomActionText}>Sleep</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomActionButton}
              onPress={() => Alert.alert('Share', 'Share functionality coming soon')}
            >
              <Ionicons name="share-outline" size={22} color="rgba(255,255,255,0.7)" />
              <Text style={styles.bottomActionText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomActionButton}
              onPress={() => router.push('/about')}
            >
              <Ionicons name="information-circle-outline" size={22} color="rgba(255,255,255,0.7)" />
              <Text style={styles.bottomActionText}>About</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_DARK,
  },
  gradientBackground: {
    flex: 1,
  },
  headerBar: {
    paddingTop: height * 0.06,
    paddingBottom: height * 0.015,
    paddingHorizontal: width * 0.04,
  },
  headerBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconButton: {
    padding: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    padding: 2,
    backgroundColor: 'transparent',
  },
  glassCardInner: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: height * 0.03,
    paddingHorizontal: width * 0.05,
    alignItems: 'center',
  },
  trackInfo: {
    alignItems: 'center',
    marginTop: height * 0.025,
    paddingHorizontal: width * 0.04,
    width: '100%',
  },
  trackTitle: {
    fontSize: Math.min(22, width * 0.055),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  trackArtist: {
    fontSize: Math.min(16, width * 0.04),
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 4,
  },
  trackAlbum: {
    fontSize: Math.min(14, width * 0.035),
    color: COLORS.ACCENT,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: height * 0.015,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  playerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.025,
    gap: width * 0.08,
  },
  sideButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  mainControlButton: {
    shadowColor: COLORS.YELLOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  playButtonGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: height * 0.025,
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  liveDotActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  waveformContainer: {
    alignItems: 'center',
    marginTop: height * 0.02,
    paddingVertical: height * 0.01,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: width * 0.1,
    marginTop: height * 0.03,
    paddingBottom: height * 0.02,
  },
  bottomActionButton: {
    alignItems: 'center',
    gap: 4,
  },
  bottomActionText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
});
