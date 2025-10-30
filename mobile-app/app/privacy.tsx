import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, APP_CONFIG } from '@/constants/radio';

export default function PrivacyScreen() {
  const handleContactEmail = () => {
    Linking.openURL(`mailto:${APP_CONFIG.SUPPORT_EMAIL}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="lock-closed" size={40} color={COLORS.PRIMARY} />
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.subtitle}>Last updated: October 2025</Text>
        </View>

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Introduction</Text>
          <Text style={styles.content}>
            At {APP_CONFIG.NAME}, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and protect your information when you use our mobile application.
          </Text>
        </View>

        {/* Information We Collect */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information We Collect</Text>
          
          <Text style={styles.subsectionTitle}>Audio Streaming Data</Text>
          <Text style={styles.content}>
            We stream audio content from our servers. We may collect anonymous usage statistics such as listening duration and connection quality to improve our service.
          </Text>

          <Text style={styles.subsectionTitle}>Device Information</Text>
          <Text style={styles.content}>
            We may collect device-specific information such as operating system version, device model, and unique device identifiers to ensure compatibility and provide technical support.
          </Text>

          <Text style={styles.subsectionTitle}>Usage Analytics</Text>
          <Text style={styles.content}>
            We use analytics tools to understand how our app is used, including features accessed and time spent in the app. This helps us improve user experience.
          </Text>
        </View>

        {/* How We Use Your Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How We Use Your Information</Text>
          
          <Text style={styles.bulletPoint}>• To provide and maintain our radio streaming service</Text>
          <Text style={styles.bulletPoint}>• To improve app performance and user experience</Text>
          <Text style={styles.bulletPoint}>• To provide customer support and technical assistance</Text>
          <Text style={styles.bulletPoint}>• To analyze usage patterns and optimize our service</Text>
          <Text style={styles.bulletPoint}>• To comply with legal obligations</Text>
        </View>

        {/* Data Sharing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Sharing</Text>
          <Text style={styles.content}>
            We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy:
          </Text>
          
          <Text style={styles.subsectionTitle}>Service Providers</Text>
          <Text style={styles.content}>
            We may share information with trusted third-party service providers who assist us in operating our app, conducting our business, or servicing users.
          </Text>

          <Text style={styles.subsectionTitle}>Legal Requirements</Text>
          <Text style={styles.content}>
            We may disclose your information if required by law or in good faith belief that such action is necessary to comply with legal requirements.
          </Text>
        </View>

        {/* Data Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Security</Text>
          <Text style={styles.content}>
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
          </Text>
        </View>

        {/* Data Retention */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Retention</Text>
          <Text style={styles.content}>
            We retain your personal information only as long as necessary to provide our services and comply with legal obligations. Usage data is typically retained for analytical purposes and may be anonymized over time.
          </Text>
        </View>

        {/* Your Rights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Rights</Text>
          
          <Text style={styles.bulletPoint}>• Access to your personal information</Text>
          <Text style={styles.bulletPoint}>• Correction of inaccurate information</Text>
          <Text style={styles.bulletPoint}>• Deletion of your personal information</Text>
          <Text style={styles.bulletPoint}>• Restriction of processing</Text>
          <Text style={styles.bulletPoint}>• Data portability</Text>
          <Text style={styles.bulletPoint}>• Objection to processing</Text>
        </View>

        {/* Children's Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Childrens Privacy</Text>
          <Text style={styles.content}>
            Our service is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
          </Text>
        </View>

        {/* International Users */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>International Users</Text>
          <Text style={styles.content}>
            Our service may be accessed from around the world. If you are accessing our service from outside the United States, please be aware that your information may be transferred to and processed in the United States.
          </Text>
        </View>

        {/* Changes to This Policy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Changes to This Policy</Text>
          <Text style={styles.content}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy in this app and updating the Last updated date.
          </Text>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.content}>
            If you have any questions about this Privacy Policy or our data practices, please contact us:
          </Text>
          
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Email:</Text>
            <Text style={styles.contactValue} onPress={handleContactEmail}>
              {APP_CONFIG.SUPPORT_EMAIL}
            </Text>
          </View>
          
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Website:</Text>
            <Text style={styles.contactValue}>
              {APP_CONFIG.WEBSITE}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This Privacy Policy is effective as of October 2025 and will remain in effect except with respect to any changes in its provisions in the future.
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginTop: 10,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.TEXT,
    opacity: 0.7,
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
  subsectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginTop: 15,
    marginBottom: 8,
  },
  content: {
    fontSize: 16,
    color: COLORS.TEXT,
    lineHeight: 24,
    marginBottom: 10,
  },
  bulletPoint: {
    fontSize: 16,
    color: COLORS.TEXT,
    lineHeight: 24,
    marginBottom: 5,
    marginLeft: 10,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginRight: 10,
    minWidth: 60,
  },
  contactValue: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.TEXT,
    opacity: 0.7,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});