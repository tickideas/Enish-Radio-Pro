/**
 * Advanced Audio Controls Component
 * Implements enhanced audio features, effects, and quality controls
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import { errorTracker } from '@/services/performance';
import { COLORS } from '@/constants/radio';

const { height } = Dimensions.get('window');

interface AudioPreset {
  id: string;
  name: string;
  bass: number;
  mid: number;
  treble: number;
  loudness: boolean;
  spatialAudio: boolean;
}

interface AdvancedAudioControlsProps {
  isVisible: boolean;
  onClose: () => void;
}

export const AdvancedAudioControls: React.FC<AdvancedAudioControlsProps> = ({
  isVisible,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'eq' | 'effects' | 'quality'>('eq');
  const [audioQuality, setAudioQuality] = useState<'auto' | 'low' | 'medium' | 'high'>('auto');
  const [bassBoost, setBassBoost] = useState(50);
  const [midRange, setMidRange] = useState(50);
  const [treble, setTreble] = useState(50);
  const [loudnessComp, setLoudnessComp] = useState(false);
  const [spatialAudio, setSpatialAudio] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const audioPlayer = useAudioPlayerContext();

  // Audio presets
  const audioPresets: AudioPreset[] = [
    { id: 'flat', name: 'Flat', bass: 50, mid: 50, treble: 50, loudness: false, spatialAudio: false },
    { id: 'pop', name: 'Pop', bass: 60, mid: 55, treble: 65, loudness: true, spatialAudio: false },
    { id: 'rock', name: 'Rock', bass: 70, mid: 45, treble: 70, loudness: true, spatialAudio: false },
    { id: 'jazz', name: 'Jazz', bass: 45, mid: 60, treble: 55, loudness: false, spatialAudio: true },
    { id: 'classical', name: 'Classical', bass: 40, mid: 55, treble: 75, loudness: false, spatialAudio: true },
    { id: 'bass_boost', name: 'Bass Boost', bass: 80, mid: 50, treble: 45, loudness: true, spatialAudio: false },
    { id: 'vocal', name: 'Vocal', bass: 40, mid: 70, treble: 60, loudness: false, spatialAudio: false },
  ];

  // Animation effects
  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isVisible]);

  // Handle preset selection
  const handlePresetSelect = (preset: AudioPreset) => {
    try {
      setSelectedPreset(preset.id);
      setBassBoost(preset.bass);
      setMidRange(preset.mid);
      setTreble(preset.treble);
      setLoudnessComp(preset.loudness);
      setSpatialAudio(preset.spatialAudio);
      
      // Apply preset effects
      applyAudioEffects({
        bass: preset.bass / 100,
        mid: preset.mid / 100,
        treble: preset.treble / 100,
        loudness: preset.loudness,
        spatial: preset.spatialAudio
      });
    } catch (_error) {
      errorTracker.logError('Failed to apply audio preset', 'audio', 'medium');
      Alert.alert('Error', 'Failed to apply audio preset');
    }
  };

  // Apply audio effects
  const applyAudioEffects = async (effects: {
    bass?: number;
    mid?: number;
    treble?: number;
    loudness?: boolean;
    spatial?: boolean;
  }) => {
    try {
      // In a real implementation, these would control actual audio processing
      // For now, we simulate the effects through the context
      if (effects.bass !== undefined) {
        const volumeAdjustment = 1 + (effects.bass - 0.5) * 0.2;
        audioPlayer.setVolume(audioPlayer.volume * volumeAdjustment);
      }
      
      if (effects.loudness !== undefined) {
        // Apply loudness compensation
        console.log(`Loudness compensation: ${effects.loudness ? 'enabled' : 'disabled'}`);
      }
      
      if (effects.spatial !== undefined) {
        // Apply spatial audio
        console.log(`Spatial audio: ${effects.spatial ? 'enabled' : 'disabled'}`);
      }

      // Audio effects applied successfully
    } catch (_error) {
      errorTracker.logError('Failed to apply audio effects', 'audio', 'medium');
    }
  };

  // Handle quality change
  const handleQualityChange = async (quality: typeof audioQuality) => {
    try {
      setAudioQuality(quality);
      
      // In a real implementation, this would trigger a stream change
      console.log(`Audio quality changed to: ${quality}`);
      
      // Quality change applied successfully
    } catch (_error) {
      errorTracker.logError('Failed to change audio quality', 'audio', 'medium');
    }
  };

  // Handle individual control changes
  const handleBassChange = (value: number) => {
    setBassBoost(value);
    applyAudioEffects({ bass: value / 100 });
  };

  const handleMidChange = (value: number) => {
    setMidRange(value);
    applyAudioEffects({ mid: value / 100 });
  };

  const handleTrebleChange = (value: number) => {
    setTreble(value);
    applyAudioEffects({ treble: value / 100 });
  };

  const handleLoudnessToggle = () => {
    const newState = !loudnessComp;
    setLoudnessComp(newState);
    applyAudioEffects({ loudness: newState });
  };

  const handleSpatialAudioToggle = () => {
    const newState = !spatialAudio;
    setSpatialAudio(newState);
    applyAudioEffects({ spatial: newState });
  };

  // Render EQ controls
  const renderEqualizer = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Equalizer</Text>
      
      {/* Presets */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsContainer}>
        {audioPresets.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            style={[
              styles.presetButton,
              selectedPreset === preset.id && styles.presetButtonActive
            ]}
            onPress={() => handlePresetSelect(preset)}
          >
            <Text style={[
              styles.presetButtonText,
              selectedPreset === preset.id && styles.presetButtonTextActive
            ]}>
              {preset.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* EQ Controls */}
      <View style={styles.eqContainer}>
        {/* Bass */}
        <View style={styles.eqSlider}>
          <View style={styles.eqLabelRow}>
            <Text style={styles.eqLabel}>Bass</Text>
            <Text style={styles.eqValue}>{bassBoost}%</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={bassBoost}
            onValueChange={handleBassChange}
            minimumTrackTintColor={COLORS.PRIMARY}
            maximumTrackTintColor={COLORS.BORDER}
            thumbTintColor={COLORS.PRIMARY}
          />
        </View>

        {/* Mid */}
        <View style={styles.eqSlider}>
          <View style={styles.eqLabelRow}>
            <Text style={styles.eqLabel}>Mid</Text>
            <Text style={styles.eqValue}>{midRange}%</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={midRange}
            onValueChange={handleMidChange}
            minimumTrackTintColor={COLORS.PRIMARY}
            maximumTrackTintColor={COLORS.BORDER}
            thumbTintColor={COLORS.PRIMARY}
          />
        </View>

        {/* Treble */}
        <View style={styles.eqSlider}>
          <View style={styles.eqLabelRow}>
            <Text style={styles.eqLabel}>Treble</Text>
            <Text style={styles.eqValue}>{treble}%</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={treble}
            onValueChange={handleTrebleChange}
            minimumTrackTintColor={COLORS.PRIMARY}
            maximumTrackTintColor={COLORS.BORDER}
            thumbTintColor={COLORS.PRIMARY}
          />
        </View>
      </View>
    </View>
  );

  // Render effects controls
  const renderEffects = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Audio Effects</Text>
      
      {/* Loudness Compensation */}
      <View style={styles.effectRow}>
        <View style={styles.effectInfo}>
          <Text style={styles.effectTitle}>Loudness Compensation</Text>
          <Text style={styles.effectDescription}>Enhances dynamic range for better listening</Text>
        </View>
        <TouchableOpacity
          style={[styles.toggleButton, loudnessComp && styles.toggleButtonActive]}
          onPress={handleLoudnessToggle}
        >
          <Ionicons
            name={loudnessComp ? 'toggle' : 'toggle-outline'}
            size={32}
            color={loudnessComp ? COLORS.PRIMARY : COLORS.TEXT}
          />
        </TouchableOpacity>
      </View>

      {/* Spatial Audio */}
      <View style={styles.effectRow}>
        <View style={styles.effectInfo}>
          <Text style={styles.effectTitle}>Spatial Audio</Text>
          <Text style={styles.effectDescription}>Creates immersive 3D audio experience</Text>
        </View>
        <TouchableOpacity
          style={[styles.toggleButton, spatialAudio && styles.toggleButtonActive]}
          onPress={handleSpatialAudioToggle}
        >
          <Ionicons
            name={spatialAudio ? 'toggle' : 'toggle-outline'}
            size={32}
            color={spatialAudio ? COLORS.PRIMARY : COLORS.TEXT}
          />
        </TouchableOpacity>
      </View>

      {/* Reset Button */}
      <TouchableOpacity style={styles.resetButton} onPress={() => {
        handlePresetSelect(audioPresets[0]); // Reset to flat
      }}>
        <Ionicons name="refresh" size={20} color={COLORS.PRIMARY} />
        <Text style={styles.resetButtonText}>Reset to Defaults</Text>
      </TouchableOpacity>
    </View>
  );

  // Render quality controls
  const renderQualityControls = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Audio Quality</Text>
      
      <Text style={styles.qualityDescription}>
        Choose audio quality based on your connection and preferences
      </Text>

      {/* Quality Options */}
      {[
        { value: 'auto', label: 'Auto', description: 'Automatically adjust quality' },
        { value: 'high', label: 'High', description: 'Best quality (requires fast connection)' },
        { value: 'medium', label: 'Medium', description: 'Balanced quality and performance' },
        { value: 'low', label: 'Low', description: 'Save data on slow connections' },
      ].map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.qualityOption,
            audioQuality === option.value && styles.qualityOptionActive
          ]}
          onPress={() => handleQualityChange(option.value as typeof audioQuality)}
        >
          <View style={styles.qualityInfo}>
            <Text style={[
              styles.qualityLabel,
              audioQuality === option.value && styles.qualityLabelActive
            ]}>
              {option.label}
            </Text>
            <Text style={[
              styles.qualityDescription,
              audioQuality === option.value && styles.qualityDescriptionActive
            ]}>
              {option.description}
            </Text>
          </View>
          {audioQuality === option.value && (
            <Ionicons name="checkmark-circle" size={24} color={COLORS.PRIMARY} />
          )}
        </TouchableOpacity>
      ))}

      {/* Current Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Current Status:</Text>
        <Text style={styles.statusValue}>
          {audioQuality === 'auto' ? 'Automatically adjusting' : 
           audioQuality === 'high' ? 'High Quality (256kbps)' :
           audioQuality === 'medium' ? 'Medium Quality (128kbps)' :
           'Low Quality (64kbps)'}
        </Text>
      </View>
    </View>
  );

  if (!isVisible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim
        }
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Audio Settings</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={COLORS.TEXT} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { id: 'eq', label: 'Equalizer', icon: 'musical-notes' },
          { id: 'effects', label: 'Effects', icon: 'flash' },
          { id: 'quality', label: 'Quality', icon: 'settings' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              activeTab === tab.id && styles.tabButtonActive
            ]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.id ? COLORS.PRIMARY : COLORS.TEXT}
            />
            <Text style={[
              styles.tabLabel,
              activeTab === tab.id && styles.tabLabelActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'eq' && renderEqualizer()}
        {activeTab === 'effects' && renderEffects()}
        {activeTab === 'quality' && renderQualityControls()}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.BACKGROUND,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT,
  },
  closeButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: COLORS.CARD,
  },
  tabLabel: {
    fontSize: 14,
    color: COLORS.TEXT,
    marginLeft: 4,
  },
  tabLabelActive: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: 16,
  },
  presetsContainer: {
    marginBottom: 20,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: COLORS.CARD,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  presetButtonActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  presetButtonText: {
    fontSize: 14,
    color: COLORS.TEXT,
  },
  presetButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  eqContainer: {
    marginTop: 10,
  },
  eqSlider: {
    marginBottom: 20,
  },
  eqLabel: {
    fontSize: 16,
    color: COLORS.TEXT,
  },
  eqLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  eqValue: {
    fontSize: 14,
    color: COLORS.TEXT,
    fontWeight: '500',
  },
  effectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  effectInfo: {
    flex: 1,
  },
  effectTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT,
    marginBottom: 4,
  },
  effectDescription: {
    fontSize: 12,
    color: COLORS.TEXT,
    opacity: 0.7,
  },
  toggleButton: {
    padding: 8,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.CARD,
    borderRadius: 8,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 20,
    borderRadius: 8,
    backgroundColor: COLORS.CARD,
  },
  resetButtonText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    marginLeft: 8,
  },
  qualityDescription: {
    fontSize: 14,
    color: COLORS.TEXT,
    opacity: 0.7,
    marginBottom: 16,
  },
  qualityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: COLORS.CARD,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  qualityOptionActive: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY + '10',
  },
  qualityInfo: {
    flex: 1,
  },
  qualityLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT,
    marginBottom: 4,
  },
  qualityLabelActive: {
    color: COLORS.PRIMARY,
  },
  qualityDescriptionActive: {
    color: COLORS.PRIMARY,
    opacity: 0.8,
  },
  statusContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: COLORS.CARD,
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: COLORS.TEXT,
    opacity: 0.7,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.PRIMARY,
  },
});