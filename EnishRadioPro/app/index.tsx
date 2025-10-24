import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useSleepTimer } from '@/hooks/useSleepTimer';
import { COLORS, APP_CONFIG } from '@/constants/radio';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  
  const audioPlayer = useAudioPlayer();
  const sleepTimer = useSleepTimer(() => {
    // Stop audio when sleep timer ends
    audioPlayer.stop();
    Alert.alert('Sleep Timer', 'Radio stopped automatically.');
  });

  const handleShareApp = () => {
    // This will be implemented with react-native-share
    Alert.alert('Share App', 'Share functionality will be implemented soon.');
  };

  const handleRateApp = () => {
    // This will be implemented with react-native-rate
    Alert.alert('Rate App', 'Rate functionality will be implemented soon.');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>{APP_CONFIG.NAME}</Text>
          <Text style={styles.tagline}>Your Premium Radio Experience</Text>
        </View>

        {/* Album Art / Visualizer */}
        <View style={styles.albumArtContainer}>
          <View style={styles.albumArt}>
            <Ionicons 
              name="radio" 
              size={80} 
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
          </View>
        </View>

        {/* Track Info */}
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

        {/* Player Controls */}
        <View style={styles.playerControls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={audioPlayer.togglePlayPause}
            disabled={audioPlayer.isLoading}
          >
            <Ionicons
              name={audioPlayer.isPlaying ? 'pause-circle' : 'play-circle'}
              size={80}
              color={COLORS.PRIMARY}
            />
          </TouchableOpacity>
        </View>

        {/* Status Indicators */}
        <View style={styles.statusContainer}>
          {audioPlayer.isLoading && (
            <Text style={styles.statusText}>Loading...</Text>
          )}
          {audioPlayer.isBuffering && (
            <Text style={styles.statusText}>Buffering...</Text>
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

        {/* Volume Control */}
        <View style={styles.volumeContainer}>
          <TouchableOpacity 
            style={styles.volumeButton}
            onPress={() => setShowVolumeControl(!showVolumeControl)}
          >
            <Ionicons 
              name="volume-high" 
              size={24} 
              color={COLORS.TEXT} 
            />
          </TouchableOpacity>
          
          {showVolumeControl && (
            <View style={styles.volumeSlider}>
              <Text style={styles.volumeLabel}>Volume</Text>
              {/* Volume slider will be implemented here */}
              <Text style={styles.volumeValue}>
                {Math.round(audioPlayer.volume * 100)}%
              </Text>
            </View>
          )}
        </View>

        {/* Sleep Timer */}
        <View style={styles.sleepTimerContainer}>
          <Text style={styles.sectionTitle}>Sleep Timer</Text>
          <View style={styles.timerControls}>
            <TouchableOpacity 
              style={[
                styles.timerButton,
                sleepTimer.isActive && styles.timerButtonActive
              ]}
              onPress={sleepTimer.toggleTimer}
            >
              <Text style={[
                styles.timerButtonText,
                sleepTimer.isActive && styles.timerButtonTextActive
              ]}>
                {sleepTimer.isActive 
                  ? sleepTimer.formatTime(sleepTimer.remainingTime)
                  : 'Set Timer'
                }
              </Text>
            </TouchableOpacity>
            
            {sleepTimer.isActive && (
              <TouchableOpacity 
                style={styles.stopTimerButton}
                onPress={sleepTimer.stopTimer}
              >
                <Text style={styles.stopTimerText}>Stop</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Timer Options */}
          {!sleepTimer.isActive && (
            <View style={styles.timerOptions}>
              {sleepTimer.availableOptions.map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.timerOption,
                    sleepTimer.selectedMinutes === minutes && styles.timerOptionSelected
                  ]}
                  onPress={() => sleepTimer.selectMinutes(minutes)}
                >
                  <Text style={[
                    styles.timerOptionText,
                    sleepTimer.selectedMinutes === minutes && styles.timerOptionTextSelected
                  ]}>
                    {minutes}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleShareApp}
          >
            <Ionicons name="share-social" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleRateApp}
          >
            <Ionicons name="star" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.actionButtonText}>Rate</Text>
          </TouchableOpacity>
        </View>

        {/* Ad Banner Placeholder */}
        <View style={styles.adBanner}>
          <Text style={styles.adText}>Advertisement Space</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.TEXT,
    opacity: 0.7,
  },
  albumArtContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  albumArt: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 20,
    backgroundColor: COLORS.CARD,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  radioIcon: {
    marginBottom: 10,
  },
  playingIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
    position: 'absolute',
    bottom: 20,
  },
  bar: {
    width: 4,
    backgroundColor: COLORS.PRIMARY,
    marginHorizontal: 2,
    borderRadius: 2,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  trackTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    textAlign: 'center',
    marginBottom: 5,
  },
  trackArtist: {
    fontSize: 18,
    color: COLORS.TEXT,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 5,
  },
  trackAlbum: {
    fontSize: 16,
    color: COLORS.TEXT,
    opacity: 0.6,
    textAlign: 'center',
  },
  playerControls: {
    alignItems: 'center',
    marginBottom: 30,
  },
  controlButton: {
    padding: 10,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
    minHeight: 40,
  },
  statusText: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontStyle: 'italic',
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  volumeContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  volumeButton: {
    padding: 10,
  },
  volumeSlider: {
    alignItems: 'center',
    marginTop: 10,
  },
  volumeLabel: {
    fontSize: 14,
    color: COLORS.TEXT,
    marginBottom: 5,
  },
  volumeValue: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  sleepTimerContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    textAlign: 'center',
    marginBottom: 15,
  },
  timerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  timerButton: {
    backgroundColor: COLORS.CARD,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  timerButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  timerButtonText: {
    fontSize: 16,
    color: COLORS.TEXT,
    fontWeight: 'bold',
  },
  timerButtonTextActive: {
    color: 'white',
  },
  stopTimerButton: {
    marginLeft: 10,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  stopTimerText: {
    color: 'white',
    fontWeight: 'bold',
  },
  timerOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  timerOption: {
    backgroundColor: COLORS.CARD,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    margin: 5,
  },
  timerOptionSelected: {
    backgroundColor: COLORS.PRIMARY,
  },
  timerOptionText: {
    fontSize: 14,
    color: COLORS.TEXT,
  },
  timerOptionTextSelected: {
    color: 'white',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  actionButton: {
    alignItems: 'center',
    padding: 15,
  },
  actionButtonText: {
    fontSize: 14,
    color: COLORS.TEXT,
    marginTop: 5,
  },
  adBanner: {
    backgroundColor: COLORS.CARD,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderStyle: 'dashed',
  },
  adText: {
    color: COLORS.TEXT,
    opacity: 0.5,
    fontSize: 14,
  },
});
