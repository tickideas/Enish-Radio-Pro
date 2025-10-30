import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import { COLORS, APP_CONFIG } from '@/constants/radio';
import AnimatedArtwork from '@/components/AnimatedArtwork';
import AnimatedWaveform from '@/components/AnimatedWaveform';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const [showVolumeControl, setShowVolumeControl] = useState(false);

  const audioPlayer = useAudioPlayerContext();

  // Trigger auto-play when component mounts
  useEffect(() => {
    // This will be handled by the audio player hook automatically
    // but we can add additional app launch logic here if needed
  }, []);

  const handleShareApp = () => {
    // This will be implemented with react-native-share
    Alert.alert('Share App', 'Share functionality will be implemented soon.');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>{APP_CONFIG.NAME}</Text>
        <Text style={styles.tagline}>Your Premium Radio Experience</Text>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {/* Animated Album Art / Visualizer */}
        <View style={styles.albumArtContainer}>
          <AnimatedArtwork
            artworkUrl={audioPlayer.metadata.artwork}
            isPlaying={audioPlayer.isPlaying}
            size={Math.min(width * 0.45, height * 0.25)}
          />
        </View>

        {/* Track Info with Status */}
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
          
          {/* Status Indicators - Integrated with track info */}
          <View style={styles.statusContainer}>
            {audioPlayer.isBuffering && !audioPlayer.isPlaying && (
              <View style={styles.bufferingIndicator}>
                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                <Text style={styles.statusText}>Buffering...</Text>
              </View>
            )}
            {audioPlayer.error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{audioPlayer.error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={audioPlayer.retryConnection}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Animated Waveform Visualizer */}
        <View style={styles.waveformContainer}>
          <AnimatedWaveform
            isPlaying={audioPlayer.isPlaying}
            barCount={45}
            barWidth={2.5}
            barSpacing={1.5}
            minHeight={2}
            maxHeight={32}
            multiColor={true}
          />
        </View>

        {/* Combined Player Controls and Volume */}
        <View style={styles.playerControlsRow}>
          {/* Share Button */}
          <TouchableOpacity 
            style={styles.sideButton}
            onPress={handleShareApp}
          >
            <Ionicons name="share-social" size={28} color={COLORS.PRIMARY} />
          </TouchableOpacity>

          {/* Main Play/Pause Button - Center */}
          <TouchableOpacity 
            style={styles.mainControlButton}
            onPress={audioPlayer.togglePlayPause}
            disabled={audioPlayer.isLoading}
          >
            <Ionicons
              name={audioPlayer.isPlaying ? 'pause-circle' : 'play-circle'}
              size={width * 0.18}
              color={COLORS.PRIMARY}
            />
          </TouchableOpacity>

          {/* Volume Button */}
          <TouchableOpacity 
            style={styles.sideButton}
            onPress={() => setShowVolumeControl(!showVolumeControl)}
          >
            <Ionicons 
              name={audioPlayer.volume === 0 ? 'volume-mute' : audioPlayer.volume < 0.5 ? 'volume-low' : 'volume-high'} 
              size={28} 
              color={COLORS.PRIMARY} 
            />
          </TouchableOpacity>
        </View>

        {/* Volume Control - Shows when volume button is pressed */}
        {showVolumeControl && (
          <View style={styles.volumeControlExpanded}>
            <Text style={styles.volumeLabel}>Volume: {Math.round(audioPlayer.volume * 100)}%</Text>
            <View style={styles.volumeSliderContainer}>
              <TouchableOpacity 
                style={styles.volumeSlider}
                onPress={(e) => {
                  const { locationX } = e.nativeEvent;
                  const sliderWidth = width * 0.6;
                  const newVolume = Math.max(0, Math.min(1, locationX / sliderWidth));
                  audioPlayer.setVolume(newVolume);
                }}
              >
                <View style={styles.volumeTrack}>
                  <View style={[styles.volumeFill, { width: `${audioPlayer.volume * 100}%` }]} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Ad Banner - Prominently positioned */}
        <View style={styles.adBanner}>
          <Text style={styles.adText}>Advertisement Space</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.02,
    paddingBottom: height * 0.01,
  },
  appName: {
    fontSize: Math.min(28, width * 0.07),
    fontWeight: 'bold',
    color: COLORS.ACCENT,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: Math.min(16, width * 0.04),
    color: COLORS.TEXT_SECONDARY,
    opacity: 0.85,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.02,
    justifyContent: 'space-between',
  },
  albumArtContainer: {
    alignItems: 'center',
    marginBottom: height * 0.025,
  },
  waveformContainer: {
    alignItems: 'center',
    marginBottom: height * 0.02,
    paddingHorizontal: width * 0.05,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  trackTitle: {
    fontSize: Math.min(20, width * 0.05),
    fontWeight: '700',
    color: COLORS.TEXT,
    textAlign: 'center',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: Math.min(16, width * 0.04),
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 2,
  },
  trackAlbum: {
    fontSize: Math.min(14, width * 0.035),
    color: COLORS.TEXT_SECONDARY,
    opacity: 0.7,
    textAlign: 'center',
  },
  bufferingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    fontStyle: 'italic',
    marginLeft: 5,
  },
  errorContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 5,
  },
  retryButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  playerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: height * 0.02,
    paddingHorizontal: width * 0.1,
  },
  mainControlButton: {
    padding: 5,
  },
  sideButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: COLORS.CARD,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  volumeControlExpanded: {
    alignItems: 'center',
    marginBottom: height * 0.02,
    paddingVertical: 10,
  },
  volumeLabel: {
    fontSize: 12,
    color: COLORS.TEXT,
    marginBottom: 5,
  },
  volumeSliderContainer: {
    width: width * 0.6,
  },
  volumeSlider: {
    height: 20,
    justifyContent: 'center',
  },
  volumeTrack: {
    height: 4,
    backgroundColor: COLORS.BORDER,
    borderRadius: 2,
    overflow: 'hidden',
  },
  volumeFill: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 2,
  },
  sleepTimerContainer: {
    marginBottom: height * 0.02,
  },
  adBanner: {
    backgroundColor: COLORS.CARD,
    height: Math.min(80, height * 0.1),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.BORDER,
    borderStyle: 'dashed',
    marginTop: 'auto',
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  adText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: Math.min(14, width * 0.035),
    fontWeight: '500',
  },
});
