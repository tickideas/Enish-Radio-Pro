import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import { COLORS, APP_CONFIG } from '@/constants/radio';
import NowPlayingArtwork from '@/components/NowPlayingArtwork';
import AdBannerCarousel from '@/components/AdBannerCarousel';
import { useRouter } from 'expo-router';
import { DrawerActions, useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const audioPlayer = useAudioPlayerContext();
  const router = useRouter();
  const navigation = useNavigation();

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
              accessibilityRole="button"
              accessibilityLabel="Open menu"
            >
              <Ionicons name="menu" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{APP_CONFIG.NAME}</Text>
            </View>

            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => router.push('/settings')}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
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
                      accessibilityRole="button"
                      accessibilityLabel="Retry connection"
                    >
                      <Ionicons name="refresh" size={20} color="#FFFFFF" />
                      <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View style={styles.playerControlsRow}>
                <TouchableOpacity
                  style={styles.mainControlButton}
                  onPress={audioPlayer.togglePlayPause}
                  disabled={audioPlayer.isLoading}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={audioPlayer.isPlaying ? 'Pause radio' : 'Play radio'}
                  accessibilityState={{ disabled: audioPlayer.isLoading }}
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
              </View>
            </View>
          </View>

          <View style={styles.liveIndicator}>
            <View style={[styles.liveDot, audioPlayer.isPlaying && styles.liveDotActive]} />
            <Text style={styles.liveText}>
              {audioPlayer.isPlaying ? 'LIVE' : 'PAUSED'} • {APP_CONFIG.NAME}
            </Text>
          </View>

          <View style={styles.adBannerSection}>
            <AdBannerCarousel
              height={Math.min(140, height * 0.16)}
              autoScrollInterval={6000}
              showIndicators={true}
              borderRadius={12}
            />
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
  adBannerSection: {
    width: '100%',
    marginTop: height * 0.02,
    paddingBottom: height * 0.02,
  },
});
