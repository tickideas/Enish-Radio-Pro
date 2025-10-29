import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSleepTimer } from '@/hooks/useSleepTimer';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import { COLORS } from '@/constants/radio';

export default function SleepTimerScreen() {
  const audioPlayer = useAudioPlayerContext();
  const sleepTimer = useSleepTimer(() => {
    audioPlayer.stop();
    Alert.alert('Sleep Timer', 'Radio stopped automatically.');
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="moon" size={60} color={COLORS.PRIMARY} />
          <Text style={styles.title}>Sleep Timer</Text>
          <Text style={styles.subtitle}>Set a timer to automatically stop the radio</Text>
        </View>

        {/* Current Timer Display */}
        <View style={styles.timerDisplay}>
          <Text style={styles.timerText}>
            {sleepTimer.isActive 
              ? sleepTimer.formatTime(sleepTimer.remainingTime)
              : '00:00'
            }
          </Text>
          
          {sleepTimer.isActive && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${sleepTimer.getProgress()}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(sleepTimer.getProgress())}% Complete
              </Text>
            </View>
          )}
        </View>

        {/* Timer Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[
              styles.mainButton,
              sleepTimer.isActive && !sleepTimer.isPaused && styles.pauseButton,
              sleepTimer.isPaused && styles.resumeButton
            ]}
            onPress={sleepTimer.toggleTimer}
          >
            <Ionicons 
              name={
                !sleepTimer.isActive 
                  ? 'play' 
                  : sleepTimer.isPaused 
                    ? 'play' 
                    : 'pause'
              } 
              size={30} 
              color="white" 
            />
            <Text style={styles.mainButtonText}>
              {!sleepTimer.isActive 
                ? 'Start Timer' 
                : sleepTimer.isPaused 
                  ? 'Resume' 
                  : 'Pause'
              }
            </Text>
          </TouchableOpacity>

          {sleepTimer.isActive && (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={sleepTimer.stopTimer}
            >
              <Ionicons name="stop" size={24} color={COLORS.ACCENT} />
              <Text style={styles.stopButtonText}>Stop</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Timer Options */}
        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Quick Set Timer</Text>
          <View style={styles.optionsGrid}>
            {sleepTimer.availableOptions.map((minutes) => (
              <TouchableOpacity
                key={minutes}
                style={[
                  styles.optionButton,
                  sleepTimer.selectedMinutes === minutes && styles.optionButtonSelected,
                  sleepTimer.isActive && styles.optionButtonDisabled
                ]}
                onPress={() => sleepTimer.selectMinutes(minutes)}
                disabled={sleepTimer.isActive}
              >
                <Text style={[
                  styles.optionText,
                  sleepTimer.selectedMinutes === minutes && styles.optionTextSelected,
                  sleepTimer.isActive && styles.optionTextDisabled
                ]}>
                  {minutes}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>How it works:</Text>
          <Text style={styles.instructionsText}>
            1. Select a duration from the quick options above
          </Text>
          <Text style={styles.instructionsText}>
            2. Tap Start Timer to begin countdown
          </Text>
          <Text style={styles.instructionsText}>
            3. Radio will automatically stop when timer ends
          </Text>
          <Text style={styles.instructionsText}>
            4. You can pause or stop the timer anytime
          </Text>
        </View>

        {/* Status Message */}
        {sleepTimer.isActive && (
          <View style={styles.statusMessage}>
            <Ionicons 
              name={sleepTimer.isPaused ? 'pause-circle' : 'time'} 
              size={20} 
              color={COLORS.PRIMARY} 
            />
            <Text style={styles.statusText}>
              {sleepTimer.isPaused 
                ? 'Timer is paused' 
                : 'Timer is running...'
              }
            </Text>
          </View>
        )}
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
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginTop: 15,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT,
    opacity: 0.7,
    textAlign: 'center',
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: 40,
    padding: 30,
    backgroundColor: COLORS.CARD,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.BORDER,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.TEXT,
    opacity: 0.7,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    gap: 20,
  },
  mainButton: {
    backgroundColor: COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 160,
    justifyContent: 'center',
  },
  pauseButton: {
    backgroundColor: COLORS.ACCENT,
  },
  resumeButton: {
    backgroundColor: '#4CAF50',
  },
  mainButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.ACCENT,
  },
  stopButtonText: {
    color: COLORS.ACCENT,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  optionsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 20,
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
  },
  optionButton: {
    backgroundColor: COLORS.CARD,
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  optionButtonDisabled: {
    opacity: 0.5,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.TEXT,
    fontWeight: 'bold',
  },
  optionTextSelected: {
    color: 'white',
  },
  optionTextDisabled: {
    color: COLORS.TEXT,
  },
  instructions: {
    backgroundColor: COLORS.CARD,
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 15,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.TEXT,
    opacity: 0.8,
    marginBottom: 8,
    lineHeight: 20,
  },
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.CARD,
    padding: 15,
    borderRadius: 15,
    gap: 10,
  },
  statusText: {
    fontSize: 16,
    color: COLORS.TEXT,
    fontStyle: 'italic',
  },
});