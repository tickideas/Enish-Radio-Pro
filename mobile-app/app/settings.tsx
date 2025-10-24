import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import { COLORS, APP_CONFIG } from '@/constants/radio';

export default function SettingsScreen() {
  const audioPlayer = useAudioPlayerContext();
  const [notifications, setNotifications] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [highQuality, setHighQuality] = useState(false);

  // Load initial auto-play setting from cache
  useEffect(() => {
    const loadAutoPlaySetting = async () => {
      try {
        const { CacheService } = await import('@/services/cache');
        const savedAutoPlay = await CacheService.getAutoPlaySetting();
        setAutoPlay(savedAutoPlay);
      } catch (error) {
        console.error('Error loading auto-play setting:', error);
      }
    };
    loadAutoPlaySetting();
  }, []);

  // Save auto-play setting when changed
  useEffect(() => {
    const saveAutoPlaySetting = async () => {
      try {
        const { CacheService } = await import('@/services/cache');
        await CacheService.setAutoPlaySetting(autoPlay);
      } catch (error) {
        console.error('Error saving auto-play setting:', error);
        Alert.alert('Error', 'Failed to save auto-play setting');
      }
    };
    saveAutoPlaySetting();
  }, [autoPlay]);

  const handleShareApp = () => {
    // Will be implemented with react-native-share
    Alert.alert('Share App', 'Share functionality will be implemented soon.');
  };

  const handleRateApp = () => {
    // Will be implemented with react-native-rate
    Alert.alert('Rate App', 'Rate functionality will be implemented soon.');
  };

  const handleContactSupport = () => {
    Linking.openURL(`mailto:${APP_CONFIG.SUPPORT_EMAIL}`);
  };

  const handleVisitWebsite = () => {
    Linking.openURL(APP_CONFIG.WEBSITE);
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the app cache? This will remove saved preferences.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            // Clear cache logic here
            Alert.alert('Cache Cleared', 'App cache has been cleared successfully.');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="settings" size={40} color={COLORS.PRIMARY} />
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Audio Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto Play</Text>
              <Text style={styles.settingDescription}>
                Automatically start playing when app opens
              </Text>
            </View>
            <Switch
              value={autoPlay}
              onValueChange={setAutoPlay}
              trackColor={{ false: COLORS.BORDER, true: COLORS.PRIMARY }}
              thumbColor={autoPlay ? COLORS.PRIMARY : COLORS.TEXT}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>High Quality Audio</Text>
              <Text style={styles.settingDescription}>
                Use higher quality audio stream (may use more data)
              </Text>
            </View>
            <Switch
              value={highQuality}
              onValueChange={setHighQuality}
              trackColor={{ false: COLORS.BORDER, true: COLORS.PRIMARY }}
              thumbColor={highQuality ? COLORS.PRIMARY : COLORS.TEXT}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Volume: {Math.round(audioPlayer.volume * 100)}%</Text>
              <Text style={styles.settingDescription}>
                Adjust the playback volume
              </Text>
            </View>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive notifications about new features
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: COLORS.BORDER, true: COLORS.PRIMARY }}
              thumbColor={notifications ? COLORS.PRIMARY : COLORS.TEXT}
            />
          </View>
        </View>

        {/* App Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Actions</Text>
          
          <TouchableOpacity style={styles.actionItem} onPress={handleShareApp}>
            <Ionicons name="share-social" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.actionText}>Share App</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT} opacity={0.5} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={handleRateApp}>
            <Ionicons name="star" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.actionText}>Rate App</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT} opacity={0.5} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={handleClearCache}>
            <Ionicons name="trash" size={24} color={COLORS.ACCENT} />
            <Text style={[styles.actionText, { color: COLORS.ACCENT }]}>Clear Cache</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT} opacity={0.5} />
          </TouchableOpacity>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.actionItem} onPress={handleContactSupport}>
            <Ionicons name="mail" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.actionText}>Contact Support</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT} opacity={0.5} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={handleVisitWebsite}>
            <Ionicons name="globe" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.actionText}>Visit Website</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT} opacity={0.5} />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>{APP_CONFIG.VERSION}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Developer</Text>
            <Text style={styles.infoValue}>Enish Radio Team</Text>
          </View>

          <TouchableOpacity 
            style={styles.infoItem}
            onPress={() => Linking.openURL(APP_CONFIG.WEBSITE + '/privacy')}
          >
            <Text style={styles.infoLabel}>Privacy Policy</Text>
            <Ionicons name="open-outline" size={20} color={COLORS.PRIMARY} />
          </TouchableOpacity>
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
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginTop: 10,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: COLORS.CARD,
    borderRadius: 10,
    marginBottom: 10,
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 3,
  },
  settingDescription: {
    fontSize: 14,
    color: COLORS.TEXT,
    opacity: 0.7,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: COLORS.CARD,
    borderRadius: 10,
    marginBottom: 10,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.TEXT,
    marginLeft: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: COLORS.CARD,
    borderRadius: 10,
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
    color: COLORS.TEXT,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.TEXT,
    opacity: 0.7,
  },
});