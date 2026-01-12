/**
 * Accessible Audio Player Component
 * Enhanced with accessibility features, improved controls, and better UX
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  AccessibilityInfo,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import { errorTracker } from '@/services/performance';
import { COLORS } from '@/constants/radio';

interface AccessibleAudioPlayerProps {
  onAccessibilityAnnouncement?: (message: string) => void;
}

export const AccessibleAudioPlayer: React.FC<AccessibleAudioPlayerProps> = ({
  onAccessibilityAnnouncement
}) => {
  const [announcementText, setAnnouncementText] = useState('');
  const [highContrast, setHighContrast] = useState(false);
  const largeText = false; // getAccessibilityScale() doesn't exist in RN
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  const audioPlayer = useAudioPlayerContext();

  // Accessibility setup
  useEffect(() => {
    // Check for accessibility preferences
    const checkAccessibilityPreferences = () => {
      AccessibilityInfo.isInvertColorsEnabled().then(setHighContrast);
    };

    checkAccessibilityPreferences();
    
    // Listen for accessibility changes
    const subscription = AccessibilityInfo.addEventListener(
      'invertColorsChanged',
      setHighContrast
    );

    return () => subscription?.remove();
  }, []);

  // Animated entrance
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Announce state changes for screen readers
  const announceStateChange = (action: string, details?: string) => {
    const message = details 
      ? `${action}. ${details}`
      : action;
    
    setAnnouncementText(message);
    onAccessibilityAnnouncement?.(message);
    
    // Clear announcement after a delay
    setTimeout(() => setAnnouncementText(''), 1000);
  };

  // Handle play/pause with accessibility
  const handlePlayPause = () => {
    try {
      audioPlayer.togglePlayPause();
      const action = audioPlayer.isPlaying ? 'Paused' : 'Playing';
      const status = audioPlayer.isLoading ? 'Loading' : audioPlayer.error ? 'Error' : 'Ready';
      announceStateChange(`${action} radio stream`, `Status: ${status}`);
    } catch (_error) {
      errorTracker.logError('Play/pause failed', 'audio', 'medium');
      Alert.alert('Error', 'Unable to control playback');
    }
  };

  // Handle volume change with accessibility
  const handleVolumeChange = (newVolume: number) => {
    try {
      audioPlayer.setVolume(newVolume);
      const volumePercent = Math.round(newVolume * 100);
      announceStateChange('Volume changed', `Volume is now ${volumePercent}%`);
    } catch (_error) {
      errorTracker.logError('Volume change failed', 'audio', 'low');
    }
  };

  // Enhanced retry functionality
  const handleRetry = () => {
    try {
      audioPlayer.retryConnection();
      announceStateChange('Retrying connection', 'Attempting to reconnect to radio stream');
    } catch (_error) {
      errorTracker.logError('Retry failed', 'audio', 'medium');
    }
  };

  // Get icon based on playback state
  const getPlaybackIcon = () => {
    if (audioPlayer.isLoading) return 'hourglass';
    if (audioPlayer.error) return 'alert-circle';
    return audioPlayer.isPlaying ? 'pause-circle' : 'play-circle';
  };

  // Get playback state for accessibility
  const getPlaybackState = () => {
    if (audioPlayer.isLoading) return 'Loading';
    if (audioPlayer.error) return 'Error';
    return audioPlayer.isPlaying ? 'Playing' : 'Paused';
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        highContrast && styles.highContrast,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}
      accessible={true}
      accessibilityLabel="Audio player controls"
      accessibilityRole="adjustable"
      accessibilityHint="Use to control radio playback"
    >
      {/* Hidden announcement for screen readers */}
      <Text style={styles.announcement} accessibilityLiveRegion="polite">
        {announcementText}
      </Text>

      {/* Main player interface */}
      <View style={styles.playerContent}>
        {/* Track information with accessibility */}
        <View style={styles.trackInfo}>
          <Text 
            style={[styles.trackTitle, largeText && styles.largeTitle]}
            accessibilityLabel="Current track"
            accessibilityRole="text"
          >
            {audioPlayer.metadata.title || 'Enish Radio Live'}
          </Text>
          <Text 
            style={[styles.trackArtist, largeText && styles.largeArtist]}
            accessibilityLabel="Artist information"
            accessibilityRole="text"
          >
            {audioPlayer.metadata.artist || '24/7 Music Stream'}
          </Text>
          
          {/* Playback status */}
          <Text 
            style={styles.playbackStatus}
            accessibilityLabel={`Playback status: ${getPlaybackState()}`}
            accessibilityRole="text"
          >
            {getPlaybackState()}
          </Text>
        </View>

        {/* Enhanced controls with accessibility */}
        <View style={styles.controlsContainer}>
          {/* Volume controls */}
          <View style={styles.volumeControls}>
            <TouchableOpacity
              style={[styles.controlButton, highContrast && styles.highContrastButton]}
              onPress={() => handleVolumeChange(Math.max(0, audioPlayer.volume - 0.1))}
              accessibilityLabel="Decrease volume"
              accessibilityHint="Reduces audio volume by 10%"
              accessibilityRole="button"
            >
              <Ionicons 
                name="volume-low" 
                size={24} 
                color={highContrast ? COLORS.TEXT : COLORS.PRIMARY} 
              />
            </TouchableOpacity>

            {/* Volume indicator */}
            <View style={styles.volumeIndicator}>
              <View style={styles.volumeBar}>
                <View 
                  style={[
                    styles.volumeFill, 
                    { width: `${audioPlayer.volume * 100}%` },
                    highContrast && styles.highContrastVolumeFill
                  ]} 
                />
              </View>
              <Text 
                style={[styles.volumeText, largeText && styles.largeVolumeText]}
                accessibilityLabel={`Volume level: ${Math.round(audioPlayer.volume * 100)}%`}
              >
                {Math.round(audioPlayer.volume * 100)}%
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.controlButton, highContrast && styles.highContrastButton]}
              onPress={() => handleVolumeChange(Math.min(1, audioPlayer.volume + 0.1))}
              accessibilityLabel="Increase volume"
              accessibilityHint="Increases audio volume by 10%"
              accessibilityRole="button"
            >
              <Ionicons 
                name="volume-high" 
                size={24} 
                color={highContrast ? COLORS.TEXT : COLORS.PRIMARY} 
              />
            </TouchableOpacity>
          </View>

          {/* Main playback controls */}
          <View style={styles.playbackControls}>
            <TouchableOpacity
              style={[styles.mainButton, highContrast && styles.highContrastButton]}
              onPress={handlePlayPause}
              accessibilityLabel={audioPlayer.isPlaying ? 'Pause' : 'Play'}
              accessibilityHint={audioPlayer.isPlaying ? 'Pause the radio stream' : 'Start playing the radio stream'}
              accessibilityRole="button"
              disabled={audioPlayer.isLoading}
            >
              <Ionicons
                name={getPlaybackIcon() as any}
                size={48}
                color={audioPlayer.error ? '#FF6B6B' : (highContrast ? COLORS.TEXT : COLORS.PRIMARY)}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Error handling with accessibility */}
        {audioPlayer.error && (
          <View style={styles.errorContainer}>
            <Text 
              style={styles.errorText}
              accessibilityLabel={`Error: ${audioPlayer.error}`}
              accessibilityRole="alert"
            >
              {audioPlayer.error}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, highContrast && styles.highContrastButton]}
              onPress={handleRetry}
              accessibilityLabel="Retry connection"
              accessibilityHint="Attempts to reconnect to the radio stream"
              accessibilityRole="button"
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading indicator with accessibility */}
        {audioPlayer.isLoading && (
          <Text 
            style={styles.loadingText}
            accessibilityLabel="Loading radio stream"
            accessibilityRole="alert"
          >
            Connecting...
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  highContrast: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  largeText: {
    fontSize: 18,
  },
  largeTitle: {
    fontSize: 24,
  },
  largeArtist: {
    fontSize: 20,
  },
  largeVolumeText: {
    fontSize: 16,
  },
  announcement: {
    position: 'absolute',
    left: -10000,
    width: 1,
    height: 1,
    overflow: 'hidden',
  },
  playerContent: {
    alignItems: 'center',
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  trackTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    textAlign: 'center',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 16,
    color: COLORS.TEXT,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 4,
  },
  playbackStatus: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '500',
    textAlign: 'center',
  },
  controlsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  volumeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  controlButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: COLORS.BACKGROUND,
  },
  highContrastButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
  },
  volumeIndicator: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'center',
  },
  volumeBar: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.BORDER,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  volumeFill: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 3,
  },
  highContrastVolumeFill: {
    backgroundColor: '#FFFFFF',
  },
  volumeText: {
    fontSize: 12,
    color: COLORS.TEXT,
    textAlign: 'center',
  },
  playbackControls: {
    alignItems: 'center',
  },
  mainButton: {
    padding: 4,
    borderRadius: 32,
  },
  errorContainer: {
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});