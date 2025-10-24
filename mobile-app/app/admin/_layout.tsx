import { Stack } from 'expo-router';
import { COLORS } from '@/constants/radio';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.CARD,
        },
        headerTintColor: COLORS.TEXT,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: 'Admin Login',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="social-links"
        options={{
          title: 'Social Links',
        }}
      />
      <Stack.Screen
        name="ad-banners"
        options={{
          title: 'Ad Banners',
        }}
      />
      <Stack.Screen
        name="stream-metadata"
        options={{
          title: 'Stream Metadata',
        }}
      />
      <Stack.Screen
        name="user-management"
        options={{
          title: 'User Management',
        }}
      />
      <Stack.Screen
        name="analytics"
        options={{
          title: 'Analytics',
        }}
      />
    </Stack>
  );
}