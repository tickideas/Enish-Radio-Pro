import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, StyleSheet, Linking, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import 'react-native-reanimated';

import type { DrawerContentComponentProps } from '@react-navigation/drawer';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { COLORS, APP_CONFIG, API_ENDPOINTS } from '@/constants/radio';
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext';

type MenuItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  type: 'internal' | 'external' | 'action';
  target: string;
  icon?: string | null;
  order?: number | null;
};

const RATE_APP_ACTION = 'rate_app';

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: 'default-home', title: 'Home', type: 'internal', target: 'index', icon: 'home', order: 0 },
  { id: 'default-about', title: 'About', type: 'internal', target: 'about', icon: 'information-circle', order: 1 },
  { id: 'default-privacy', title: 'Privacy Policy', type: 'internal', target: 'privacy', icon: 'lock-closed', order: 2 },
  { id: 'default-settings', title: 'Settings', type: 'internal', target: 'settings', icon: 'settings', order: 3 },
  { id: 'default-sleep', title: 'Sleep Timer', type: 'internal', target: 'sleep-timer', icon: 'moon', order: 4 },
  { id: 'default-rate', title: 'Rate App', type: 'action', target: RATE_APP_ACTION, icon: 'star', order: 5 },
];

const normalizeOrder = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return 0;
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AudioPlayerProvider>
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
              headerShown: false,
              drawerIcon: ({ color, size }) => (
                <Ionicons name="home" size={size} color={color} />
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
            name="sleep-timer"
            options={{
              title: 'Sleep Timer',
              drawerLabel: 'Sleep Timer',
              drawerIcon: ({ color, size }) => (
                <Ionicons name="moon" size={size} color={color} />
              ),
            }}
          />
        </Drawer>
        <StatusBar style="auto" />
      </AudioPlayerProvider>
    </ThemeProvider>
  );
}

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU_ITEMS);
  const [menuLoading, setMenuLoading] = useState(true);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [socialLoading, setSocialLoading] = useState(true);

  const loadMenuItems = useCallback(async () => {
    setMenuLoading(true);
    let resolved = false;
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.MENU_ITEMS}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        const activeItems: MenuItem[] = data.data
          .filter((item: any) => item && (item.isActive ?? true))
          .map((item: any, index: number): MenuItem => ({
            id: item.id ?? `menu-${index}`,
            title:
              typeof item.title === 'string' && item.title.trim().length > 0
                ? item.title.trim()
                : 'Menu Item',
            subtitle:
              typeof item.subtitle === 'string' && item.subtitle.trim().length > 0
                ? item.subtitle.trim()
                : null,
            type: ['internal', 'external', 'action'].includes(item.type) ? item.type : 'internal',
            target: typeof item.target === 'string' ? item.target.trim() : '',
            icon: typeof item.icon === 'string' ? item.icon.trim() : null,
            order: normalizeOrder(item.order),
          }))
          .filter((item) => item.target)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        if (activeItems.length > 0) {
          setMenuItems(activeItems);
          resolved = true;
        }
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
    } finally {
      if (!resolved) {
        setMenuItems(DEFAULT_MENU_ITEMS);
      }
      setMenuLoading(false);
    }
  }, []);

  const loadSocialLinks = useCallback(async () => {
    setSocialLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.SOCIAL_LINKS}/active`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        const sortedLinks = [...data.data].sort(
          (a: any, b: any) => normalizeOrder(a.order) - normalizeOrder(b.order)
        );
        setSocialLinks(sortedLinks);
      } else {
        setSocialLinks([]);
      }
    } catch (error) {
      console.error('Error loading social links:', error);
      setSocialLinks([]);
    } finally {
      setSocialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenuItems();
    loadSocialLinks();
  }, [loadMenuItems, loadSocialLinks]);

  const handleSocialLink = useCallback(async (url: string) => {
    if (!url) {
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unable to open link', 'Please try again later.');
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('Unable to open link', 'Please try again later.');
    }
  }, []);

  const { navigation, state } = props;
  const routeNames = state?.routeNames ?? [];
  const activeRouteName = routeNames[state.index] ?? 'index';
  const borderColor = isDark ? COLORS.BORDER_DARK : COLORS.BORDER;
  const textColor = isDark ? COLORS.TEXT_DARK : COLORS.TEXT;
  const subtitleColor = isDark ? 'rgba(255,255,255,0.7)' : COLORS.TEXT_SECONDARY;

  const handleMenuItemPress = useCallback(
    async (item: MenuItem) => {
      const target = typeof item.target === 'string' ? item.target.trim() : '';
      if (!target) {
        return;
      }

      navigation.closeDrawer();

      if (item.type === 'internal') {
        if (routeNames.includes(target)) {
          navigation.navigate(target as never);
        } else {
          Alert.alert('Screen unavailable', 'This screen is not available yet.');
        }
        return;
      }

      if (item.type === 'external') {
        await handleSocialLink(target);
        return;
      }

      if (item.type === 'action') {
        if (target === RATE_APP_ACTION) {
          Alert.alert('Rate App', 'Rate functionality will be implemented soon.');
        } else {
          Alert.alert('Action unavailable', 'This action is not available yet.');
        }
      }
    },
    [handleSocialLink, navigation, routeNames]
  );

  const getSocialIconName = (platform: string): string => {
    const iconMap: Record<string, string> = {
      facebook: 'logo-facebook',
      twitter: 'logo-twitter',
      instagram: 'logo-instagram',
      youtube: 'logo-youtube',
      tiktok: 'logo-tiktok',
      linkedin: 'logo-linkedin',
      website: 'globe',
    };
    return iconMap[platform.toLowerCase()] ?? 'link';
  };

  return (
    <View
      style={[styles.drawerContainer, { backgroundColor: isDark ? COLORS.BACKGROUND_DARK : COLORS.BACKGROUND }]}
    >
      {/* Header */}
      <View style={styles.drawerHeader}>
        <Text style={[styles.appTitle, { color: textColor }]}>{APP_CONFIG.NAME}</Text>
        <Text style={[styles.appVersion, { color: textColor, opacity: 0.7 }]}>
          {`Version ${APP_CONFIG.VERSION}`}
        </Text>
      </View>

      {/* Navigation Items */}
      <View style={styles.navigationSection}>
        {menuLoading && (
          <ActivityIndicator size="small" color={COLORS.PRIMARY} style={styles.menuLoadingIndicator} />
        )}
        {menuItems.length === 0 ? (
          <Text style={[styles.noMenuItemsText, { color: subtitleColor }]}>No menu items available</Text>
        ) : (
          menuItems.map((item) => {
            const iconName =
              typeof item.icon === 'string' && item.icon.length > 0 ? item.icon : 'menu';
            const subtitle =
              typeof item.subtitle === 'string' && item.subtitle.length > 0 ? item.subtitle : null;
            const isInternal = item.type === 'internal';
            const routeExists = isInternal ? routeNames.includes(item.target) : false;
            const isDisabled = isInternal && !routeExists;
            const isActive = isInternal && activeRouteName === item.target;

            const itemStyles = [
              styles.navItem,
              { borderBottomColor: borderColor },
              isActive && {
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                borderBottomWidth: 0,
                borderRadius: 8,
                paddingHorizontal: 10,
              },
            ];

            if (isDisabled) {
              itemStyles.push(styles.navItemDisabled);
            }

            return (
              <TouchableOpacity
                key={item.id}
                style={itemStyles}
                onPress={() => handleMenuItemPress(item)}
                disabled={isDisabled}
              >
                <Ionicons
                  name={iconName as any}
                  size={24}
                  color={isDisabled ? (isDark ? COLORS.BORDER_DARK : COLORS.BORDER) : COLORS.PRIMARY}
                />
                <View style={styles.navTextContainer}>
                  <Text
                    style={[
                      styles.navText,
                      { color: textColor },
                      isActive && styles.navTextActive,
                    ]}
                  >
                    {item.title}
                  </Text>
                  {subtitle ? (
                    <Text style={[styles.navSubtitle, { color: subtitleColor }]}>{subtitle}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Social Links Section */}
      <View style={styles.socialSection}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Follow Us</Text>
        {socialLoading ? (
          <ActivityIndicator size="small" color={COLORS.PRIMARY} style={{ marginTop: 10 }} />
        ) : socialLinks.length > 0 ? (
          <View style={styles.socialLinks}>
            {socialLinks.map((link) => (
              <TouchableOpacity
                key={link.id}
                style={styles.socialLink}
                onPress={() => handleSocialLink(link.url)}
              >
                <Ionicons name={getSocialIconName(link.platform) as any} size={24} color={COLORS.PRIMARY} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={[styles.noLinksText, { color: subtitleColor }]}>No social links available</Text>
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
  navItemDisabled: {
    opacity: 0.6,
  },
  navTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  navText: {
    fontSize: 16,
  },
  navTextActive: {
    fontWeight: '700',
  },
  navSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  menuLoadingIndicator: {
    marginBottom: 10,
  },
  noMenuItemsText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
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
