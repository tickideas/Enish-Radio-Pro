import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { COLORS, APP_CONFIG, API_ENDPOINTS } from '@/constants/radio';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Drawer
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? COLORS.BACKGROUND_DARK : COLORS.PRIMARY,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          drawerType: 'slide',
          drawerStyle: {
            width: 280,
            backgroundColor: colorScheme === 'dark' ? COLORS.BACKGROUND_DARK : COLORS.BACKGROUND,
          },
        }}
        drawerContent={(props) => <CustomDrawerContent {...props} />}
      >
        <Drawer.Screen
          name="index"
          options={{
            title: 'Home',
            drawerLabel: 'Home',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="sleep-timer"
          options={{
            title: 'Sleep Timer',
            drawerLabel: 'Sleep Timer',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="moon" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            title: 'Settings',
            drawerLabel: 'Settings',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="privacy"
          options={{
            title: 'Privacy Policy',
            drawerLabel: 'Privacy Policy',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="lock-closed" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="about"
          options={{
            title: 'About',
            drawerLabel: 'About',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="information-circle" size={size} color={color} />
            ),
          }}
        />
      </Drawer>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

function CustomDrawerContent(props: any) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSocialLinks();
  }, []);

  const loadSocialLinks = async () => {
    try {
      setLoading(true);
      // Use the public endpoint for active social links
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.SOCIAL_LINKS}/active`);
      const data = await response.json();
      if (data.success && data.data) {
        // Sort by order
        const sortedLinks = data.data.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        setSocialLinks(sortedLinks);
      }
    } catch (error) {
      console.error('Error loading social links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLink = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        console.error('Cannot open URL:', url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  const getIconName = (platform: string): any => {
    const iconMap: { [key: string]: any } = {
      facebook: 'logo-facebook',
      twitter: 'logo-twitter',
      instagram: 'logo-instagram',
      youtube: 'logo-youtube',
      tiktok: 'logo-tiktok',
      linkedin: 'logo-linkedin',
      website: 'globe',
    };
    return iconMap[platform.toLowerCase()] || 'link';
  };

  return (
    <View style={[styles.drawerContainer, { backgroundColor: isDark ? COLORS.BACKGROUND_DARK : COLORS.BACKGROUND }]}>
      {/* Header */}
      <View style={styles.drawerHeader}>
        <Text style={[styles.appTitle, { color: isDark ? COLORS.TEXT_DARK : COLORS.TEXT }]}>
          {APP_CONFIG.NAME}
        </Text>
        <Text style={[styles.appVersion, { color: isDark ? COLORS.TEXT_DARK : COLORS.TEXT, opacity: 0.7 }]}>
          Version 1.0.0
        </Text>
      </View>

      {/* Navigation Items */}
      <View style={styles.navigationSection}>
        <TouchableOpacity
          style={[styles.navItem, { borderBottomColor: isDark ? COLORS.BORDER_DARK : COLORS.BORDER }]}
          onPress={() => props.navigation.navigate('index')}
        >
          <Ionicons name="home" size={24} color={COLORS.PRIMARY} />
          <Text style={[styles.navText, { color: isDark ? COLORS.TEXT_DARK : COLORS.TEXT }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, { borderBottomColor: isDark ? COLORS.BORDER_DARK : COLORS.BORDER }]}
          onPress={() => props.navigation.navigate('sleep-timer')}
        >
          <Ionicons name="moon" size={24} color={COLORS.PRIMARY} />
          <Text style={[styles.navText, { color: isDark ? COLORS.TEXT_DARK : COLORS.TEXT }]}>Sleep Timer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, { borderBottomColor: isDark ? COLORS.BORDER_DARK : COLORS.BORDER }]}
          onPress={() => props.navigation.navigate('settings')}
        >
          <Ionicons name="settings" size={24} color={COLORS.PRIMARY} />
          <Text style={[styles.navText, { color: isDark ? COLORS.TEXT_DARK : COLORS.TEXT }]}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, { borderBottomColor: isDark ? COLORS.BORDER_DARK : COLORS.BORDER }]}
          onPress={() => props.navigation.navigate('privacy')}
        >
          <Ionicons name="lock-closed" size={24} color={COLORS.PRIMARY} />
          <Text style={[styles.navText, { color: isDark ? COLORS.TEXT_DARK : COLORS.TEXT }]}>Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, { borderBottomColor: isDark ? COLORS.BORDER_DARK : COLORS.BORDER }]}
          onPress={() => props.navigation.navigate('about')}
        >
          <Ionicons name="information-circle" size={24} color={COLORS.PRIMARY} />
          <Text style={[styles.navText, { color: isDark ? COLORS.TEXT_DARK : COLORS.TEXT }]}>About</Text>
        </TouchableOpacity>
      </View>

      {/* Social Links Section */}
      <View style={styles.socialSection}>
        <Text style={[styles.sectionTitle, { color: isDark ? COLORS.TEXT_DARK : COLORS.TEXT }]}>
          Follow Us
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.PRIMARY} style={{ marginTop: 10 }} />
        ) : socialLinks.length > 0 ? (
          <View style={styles.socialLinks}>
            {socialLinks.map((link) => (
              <TouchableOpacity
                key={link.id}
                style={styles.socialLink}
                onPress={() => handleSocialLink(link.url)}
              >
                <Ionicons name={getIconName(link.platform)} size={24} color={COLORS.PRIMARY} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={[styles.noLinksText, { color: isDark ? COLORS.TEXT_DARK : COLORS.TEXT, opacity: 0.6 }]}>
            No social links available
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    padding: 20,
  },
  drawerHeader: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  appVersion: {
    fontSize: 14,
  },
  navigationSection: {
    marginBottom: 30,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  navText: {
    fontSize: 16,
    marginLeft: 15,
  },
  socialSection: {
    marginTop: 'auto',
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  socialLink: {
    padding: 10,
  },
  noLinksText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
});
