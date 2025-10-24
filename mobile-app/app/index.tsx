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

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const audioPlayer = useAudioPlayerContext();

  // Trigger auto-play when component mounts
  useEffect(() => {
    // This will be handled by the audio player hook automatically
    // but we can add additional app launch logic here if needed
  }, []);

  // Handle image loading state changes
  useEffect(() => {
    if (audioPlayer.metadata.artwork) {
      setImageLoading(true);
      setImageError(false);
    } else {
      setImageLoading(false);
      setImageError(false);
    }
  }, [audioPlayer.metadata.artwork]);

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
        {/* Album Art / Visualizer */}
        <View style={styles.albumArtContainer}>
          <View style={styles.albumArt}>
            {audioPlayer.metadata.artwork && !imageError ? (
              <>
                <Image 
                  source={{ uri: audioPlayer.metadata.artwork }} 
                  style={styles.albumArtImage}
                  resizeMode="cover"
                  onLoad={() => setImageLoading(false)}
                  onLoadStart={() => setImageLoading(true)}
                  onError={() => {
                    setImageError(true);
                    setImageLoading(false);
                  }}
                />
                {imageLoading && (
                  <View style={styles.imageLoadingOverlay}>
                    <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                  </View>
                )}
              </>
            ) : (
              <>
                <Ionicons 
                  name="radio" 
                  size={width * 0.2} 
                  color={COLORS.PRIMARY} 
                  style={styles.radioIcon}
                />
                {audioPlayer.isPlaying && (
                  <View style={styles.playingIndicator}>
                    <View style={[styles.bar, { height: 20 }]} />
                    <View style={[styles.bar, { height: 35 }]} />
                    <View style={[styles.bar, { height: 25 }]} />
                    <View style={[styles.bar, { height: 40 }]} />
                    <View style={[styles.bar, { height: 30 }]} />
                  </View>
                )}
              </>
            )}
          </View>
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
            {audioPlayer.isBuffering && (
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
    color: COLORS.PRIMARY,
    marginBottom: 2,
  },
  tagline: {
    fontSize: Math.min(16, width * 0.04),
    color: COLORS.TEXT,
    opacity: 0.7,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.02,
    justifyContent: 'space-between',
  },
  albumArtContainer: {
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  albumArt: {
    width: Math.min(width * 0.5, height * 0.3),
    height: Math.min(width * 0.5, height * 0.3),
    borderRadius: 15,
    backgroundColor: COLORS.CARD,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
  albumArtImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },
  radioIcon: {
    marginBottom: height * 0.01,
  },
  playingIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 30,
    position: 'absolute',
    bottom: 15,
  },
  bar: {
    width: 3,
    backgroundColor: COLORS.PRIMARY,
    marginHorizontal: 1.5,
    borderRadius: 1.5,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  trackTitle: {
    fontSize: Math.min(20, width * 0.05),
    fontWeight: 'bold',
    color: COLORS.TEXT,
    textAlign: 'center',
    marginBottom: 3,
  },
  trackArtist: {
    fontSize: Math.min(16, width * 0.04),
    color: COLORS.TEXT,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 2,
  },
  trackAlbum: {
    fontSize: Math.min(14, width * 0.035),
    color: COLORS.TEXT,
    opacity: 0.6,
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
    padding: 10,
    borderRadius: 25,
    backgroundColor: COLORS.CARD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderStyle: 'dashed',
    marginTop: 'auto',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  adText: {
    color: COLORS.TEXT,
    opacity: 0.6,
    fontSize: Math.min(14, width * 0.035),
    fontWeight: '500',
  },
});
