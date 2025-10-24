import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/radio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService, { handleApiError } from '@/services/api';

interface DashboardStats {
  totalSocialLinks: number;
  activeAdBanners: number;
  totalUsers: number;
  recentTracks: number;
}

export default function AdminDashboardScreen({ navigation }: any) {
  const [stats, setStats] = useState<DashboardStats>({
    totalSocialLinks: 0,
    activeAdBanners: 0,
    totalUsers: 0,
    recentTracks: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadUserData();
    fetchDashboardStats();
  }, []);

  const loadUserData = async () => {
    try {
      const userStr = await AsyncStorage.getItem('adminUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.email || 'Admin');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('adminToken');
      
      // Fetch stats from multiple endpoints
      const [socialLinksRes, adsRes, usersRes, metadataRes] = await Promise.all([
        axios.get('http://localhost:3000/api/social-links/admin', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:3000/api/ads/admin', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:3000/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:3000/api/stream/metadata/admin', {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);

      setStats({
        totalSocialLinks: socialLinksRes.data.length || 0,
        activeAdBanners: adsRes.data.filter((ad: any) => ad.isActive).length || 0,
        totalUsers: 1, // This would come from a users endpoint
        recentTracks: metadataRes.data.length || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('adminToken');
              await AsyncStorage.removeItem('adminUser');
              navigation.replace('AdminLogin');
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      id: 'social-links',
      title: 'Social Links',
      description: 'Manage social media links',
      icon: 'link-outline',
      count: stats.totalSocialLinks,
      onPress: () => navigation.navigate('SocialLinks'),
    },
    {
      id: 'ad-banners',
      title: 'Ad Banners',
      description: 'Manage advertisement banners',
      icon: 'image-outline',
      count: stats.activeAdBanners,
      onPress: () => navigation.navigate('AdBanners'),
    },
    {
      id: 'stream-metadata',
      title: 'Stream Metadata',
      description: 'Manage track information',
      icon: 'musical-notes-outline',
      count: stats.recentTracks,
      onPress: () => navigation.navigate('StreamMetadata'),
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage admin users',
      icon: 'people-outline',
      count: stats.totalUsers,
      onPress: () => navigation.navigate('UserManagement'),
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View app analytics',
      icon: 'bar-chart-outline',
      count: null,
      onPress: () => navigation.navigate('Analytics'),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.TEXT} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchDashboardStats} />
        }
      >
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalSocialLinks}</Text>
            <Text style={styles.statLabel}>Social Links</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.activeAdBanners}</Text>
            <Text style={styles.statLabel}>Active Ads</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.recentTracks}</Text>
            <Text style={styles.statLabel}>Recent Tracks</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Management</Text>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon as any} size={24} color={COLORS.PRIMARY} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemDescription}>{item.description}</Text>
                </View>
              </View>
              <View style={styles.menuItemRight}>
                {item.count !== null && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{item.count}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color={COLORS.TEXT} />
              </View>
            </TouchableOpacity>
          ))}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: COLORS.CARD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.TEXT,
    opacity: 0.7,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.CARD,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.TEXT,
    opacity: 0.7,
  },
  menuContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.CARD,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.PRIMARY + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 2,
  },
  menuItemDescription: {
    fontSize: 14,
    color: COLORS.TEXT,
    opacity: 0.7,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  countText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});