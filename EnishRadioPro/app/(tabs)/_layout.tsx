import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Tabs, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { COLORS, APP_CONFIG } from '@/constants/radio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const adminToken = await AsyncStorage.getItem('adminToken');
        setIsAdmin(!!adminToken);
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colorScheme === 'dark' ? COLORS.BACKGROUND_DARK : COLORS.BACKGROUND,
          },
          tabBarActiveTintColor: COLORS.PRIMARY,
          tabBarInactiveTintColor: colorScheme === 'dark' ? COLORS.TEXT_DARK : COLORS.TEXT,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name="home" size={size} color={focused ? COLORS.PRIMARY : color} />
            ),
            headerRight: () => (
              isAdmin ? (
                <TouchableOpacity
                  style={styles.adminButton}
                  onPress={() => router.push('/admin/login')}
                >
                  <Ionicons name="settings-outline" size={20} color={COLORS.PRIMARY} />
                </TouchableOpacity>
              ) : null
            ),
          }}
        />
        <Tabs.Screen
          name="sleep-timer"
          options={{
            title: 'Sleep Timer',
            tabBarLabel: 'Sleep Timer',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name="moon" size={size} color={focused ? COLORS.PRIMARY : color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarLabel: 'Settings',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name="settings" size={size} color={focused ? COLORS.PRIMARY : color} />
            ),
          }}
        />
        <Tabs.Screen
          name="privacy"
          options={{
            title: 'Privacy Policy',
            tabBarLabel: 'Privacy',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name="lock-closed" size={size} color={focused ? COLORS.PRIMARY : color} />
            ),
          }}
        />
        <Tabs.Screen
          name="about"
          options={{
            title: 'About',
            tabBarLabel: 'About',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name="information-circle" size={size} color={focused ? COLORS.PRIMARY : color} />
            ),
          }}
        />
      </Tabs>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  adminButton: {
    padding: 8,
    marginRight: 15,
  },
});
