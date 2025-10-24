import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, APP_CONFIG } from '@/constants/radio';

export default function AboutScreen() {
  const handleVisitWebsite = () => {
    Linking.openURL(APP_CONFIG.WEBSITE);
  };

  const handleContactSupport = () => {
    Linking.openURL(`mailto:${APP_CONFIG.SUPPORT_EMAIL}`);
  };

  const handleRateApp = () => {
    // Will be implemented with react-native-rate
    // For now, open app store based on platform
    Linking.openURL('https://play.google.com/store/apps/details?id=com.enishradio.pro');
  };

  const handleShareApp = () => {
    // Will be implemented with react-native-share
    console.log('Share app functionality');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* App Logo and Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="radio" size={80} color={COLORS.PRIMARY} />
          </View>
          <Text style={styles.appName}>{APP_CONFIG.NAME}</Text>
          <Text style={styles.version}>Version {APP_CONFIG.VERSION}</Text>
          <Text style={styles.tagline}>Your Premium Radio Experience</Text>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About {APP_CONFIG.NAME}</Text>
          <Text style={styles.content}>
            {APP_CONFIG.NAME} is your gateway to premium radio entertainment. 
            Stream your favorite music, talk shows, and live events with crystal-clear audio quality. 
            Our app is designed to provide the best listening experience with features like sleep timer, 
            background play, and much more.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="musical-notes" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.featureText}>High-quality audio streaming</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="moon" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.featureText}>Sleep timer functionality</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="play-circle" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.featureText}>Background playback</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="share-social" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.featureText}>Share with friends</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="star" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.featureText}>Rate and review</Text>
          </View>
        </View>

        {/* Technical Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technical Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform:</Text>
            <Text style={styles.infoValue}>iOS & Android</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Framework:</Text>
            <Text style={styles.infoValue}>React Native & Expo</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Audio Quality:</Text>
            <Text style={styles.infoValue}>High Quality (320 kbps)</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Stream Type:</Text>
            <Text style={styles.infoValue}>MP3 & M3U Support</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get Involved</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleRateApp}>
            <Ionicons name="star" size={24} color={COLORS.PRIMARY} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Rate Our App</Text>
              <Text style={styles.actionDescription}>
                Help us improve by rating your experience
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT} opacity={0.5} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShareApp}>
            <Ionicons name="share-social" size={24} color={COLORS.PRIMARY} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Share App</Text>
              <Text style={styles.actionDescription}>
                Tell your friends about {APP_CONFIG.NAME}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT} opacity={0.5} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleVisitWebsite}>
            <Ionicons name="globe" size={24} color={COLORS.PRIMARY} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Visit Website</Text>
              <Text style={styles.actionDescription}>
                Learn more about our services
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT} opacity={0.5} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleContactSupport}>
            <Ionicons name="mail" size={24} color={COLORS.PRIMARY} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Contact Support</Text>
              <Text style={styles.actionDescription}>
                Get help with any issues or questions
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT} opacity={0.5} />
          </TouchableOpacity>
        </View>

        {/* Copyright */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 {APP_CONFIG.NAME}. All rights reserved.
          </Text>
          <Text style={styles.footerText}>
            Made with ❤️ for music lovers everywhere
          </Text>
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
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.CARD,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 5,
  },
  version: {
    fontSize: 16,
    color: COLORS.TEXT,
    opacity: 0.7,
    marginBottom: 5,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.TEXT,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 15,
  },
  content: {
    fontSize: 16,
    color: COLORS.TEXT,
    lineHeight: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: COLORS.TEXT,
    marginLeft: 15,
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  infoLabel: {
    fontSize: 16,
    color: COLORS.TEXT,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.TEXT,
    fontWeight: 'bold',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: COLORS.CARD,
    borderRadius: 10,
    marginBottom: 10,
  },
  actionContent: {
    flex: 1,
    marginLeft: 15,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 3,
  },
  actionDescription: {
    fontSize: 14,
    color: COLORS.TEXT,
    opacity: 0.7,
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.TEXT,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 5,
  },
});