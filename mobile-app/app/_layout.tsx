import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { COLORS, APP_CONFIG } from '@/constants/radio';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Drawer
        screenOptions={{
          headerShown: false,
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

  const handleSocialLink = (platform: string) => {
    // This will be implemented with backend integration
    console.log(`Opening ${platform}`);
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
        <View style={styles.socialLinks}>
          <TouchableOpacity
            style={styles.socialLink}
            onPress={() => handleSocialLink('facebook')}
          >
            <Ionicons name="logo-facebook" size={24} color={COLORS.PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialLink}
            onPress={() => handleSocialLink('twitter')}
          >
            <Ionicons name="logo-twitter" size={24} color={COLORS.PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialLink}
            onPress={() => handleSocialLink('instagram')}
          >
            <Ionicons name="logo-instagram" size={24} color={COLORS.PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialLink}
            onPress={() => handleSocialLink('youtube')}
          >
            <Ionicons name="logo-youtube" size={24} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>
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
  },
  socialLink: {
    padding: 10,
  },
});
