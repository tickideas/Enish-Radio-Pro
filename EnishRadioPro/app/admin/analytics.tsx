import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/radio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface AnalyticsData {
  totalListeners: number;
  activeListeners: number;
  totalPlays: number;
  averageSessionDuration: number;
  topCountries: Array<{ country: string; listeners: number }>;
  dailyStats: Array<{ date: string; listeners: number; plays: number }>;
  popularTracks: Array<{ title: string; artist: string; plays: number }>;
  adPerformance: Array<{ title: string; impressions: number; clicks: number; ctr: number }>;
}

const { width } = Dimensions.get('window');

export default function AnalyticsScreen({ navigation }: any) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalListeners: 0,
    activeListeners: 0,
    totalPlays: 0,
    averageSessionDuration: 0,
    topCountries: [],
    dailyStats: [],
    popularTracks: [],
    adPerformance: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('7d'); // 7d, 30d, 90d

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('adminToken');
      
      // Mock data for now - in real app, this would come from analytics API
      const mockData: AnalyticsData = {
        totalListeners: 15420,
        activeListeners: 342,
        totalPlays: 89340,
        averageSessionDuration: 45, // minutes
        topCountries: [
          { country: 'United States', listeners: 5234 },
          { country: 'United Kingdom', listeners: 3421 },
          { country: 'Canada', listeners: 2156 },
          { country: 'Australia', listeners: 1893 },
          { country: 'Germany', listeners: 1456 },
        ],
        dailyStats: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
          listeners: Math.floor(Math.random() * 500) + 200,
          plays: Math.floor(Math.random() * 2000) + 1000,
        })),
        popularTracks: [
          { title: 'Summer Vibes', artist: 'DJ Enish', plays: 3421 },
          { title: 'Night Drive', artist: 'Enish Radio', plays: 2890 },
          { title: 'Morning Coffee', artist: 'Enish Team', plays: 2341 },
          { title: 'Weekend Party', artist: 'DJ Mix', plays: 1987 },
          { title: 'Chill Session', artist: 'Enish Lounge', plays: 1654 },
        ],
        adPerformance: [
          { title: 'Summer Sale', impressions: 15420, clicks: 892, ctr: 5.8 },
          { title: 'New Album', impressions: 12340, clicks: 654, ctr: 5.3 },
          { title: 'App Download', impressions: 9870, clicks: 432, ctr: 4.4 },
        ],
      };

      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const periods = [
    { id: '7d', label: 'Last 7 days' },
    { id: '30d', label: 'Last 30 days' },
    { id: '90d', label: 'Last 90 days' },
  ];

  const StatCard = ({ title, value, icon, change }: any) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color={COLORS.PRIMARY} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      {change !== undefined && (
        <Text style={[styles.statChange, change >= 0 ? styles.positiveChange : styles.negativeChange]}>
          {change >= 0 ? '+' : ''}{change}%
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodButton,
                selectedPeriod === period.id && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period.id)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period.id && styles.periodButtonTextActive,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Listeners"
              value={analyticsData.totalListeners}
              icon="people-outline"
              change={12.5}
            />
            <StatCard
              title="Active Now"
              value={analyticsData.activeListeners}
              icon="radio-outline"
              change={8.2}
            />
            <StatCard
              title="Total Plays"
              value={analyticsData.totalPlays}
              icon="play-circle-outline"
              change={15.3}
            />
            <StatCard
              title="Avg. Session"
              value={`${analyticsData.averageSessionDuration}m`}
              icon="time-outline"
              change={-2.1}
            />
          </View>
        </View>

        {/* Top Countries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Countries</Text>
          {analyticsData.topCountries.map((country, index) => (
            <View key={country.country} style={styles.countryItem}>
              <View style={styles.countryRank}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <View style={styles.countryInfo}>
                <Text style={styles.countryName}>{country.country}</Text>
                <Text style={styles.countryListeners}>
                  {country.listeners.toLocaleString()} listeners
                </Text>
              </View>
              <View style={styles.countryBar}>
                <View
                  style={[
                    styles.countryBarFill,
                    {
                      width: `${(country.listeners / analyticsData.topCountries[0].listeners) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Popular Tracks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Tracks</Text>
          {analyticsData.popularTracks.map((track, index) => (
            <View key={track.title} style={styles.trackItem}>
              <View style={styles.trackRank}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <View style={styles.trackInfo}>
                <Text style={styles.trackTitle}>{track.title}</Text>
                <Text style={styles.trackArtist}>{track.artist}</Text>
              </View>
              <Text style={styles.trackPlays}>
                {track.plays.toLocaleString()} plays
              </Text>
            </View>
          ))}
        </View>

        {/* Ad Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ad Performance</Text>
          {analyticsData.adPerformance.map((ad) => (
            <View key={ad.title} style={styles.adItem}>
              <View style={styles.adInfo}>
                <Text style={styles.adTitle}>{ad.title}</Text>
                <Text style={styles.adStats}>
                  {ad.impressions.toLocaleString()} impressions • {ad.clicks.toLocaleString()} clicks
                </Text>
              </View>
              <View style={styles.adCtr}>
                <Text style={styles.ctrValue}>{ad.ctr}%</Text>
                <Text style={styles.ctrLabel}>CTR</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Daily Stats Chart Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Listeners</Text>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartPlaceholderText}>
              📊 Chart visualization would go here
            </Text>
            <Text style={styles.chartPlaceholderSubtext}>
              Showing listener trends over the selected period
            </Text>
          </View>
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
    backgroundColor: COLORS.CARD,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 15,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  periodButtonText: {
    fontSize: 12,
    color: COLORS.TEXT,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: width > 400 ? '48%' : '100%',
    backgroundColor: COLORS.CARD,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 14,
    color: COLORS.TEXT,
    marginLeft: 10,
    opacity: 0.8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 5,
  },
  statChange: {
    fontSize: 12,
    fontWeight: '500',
  },
  positiveChange: {
    color: '#4CAF50',
  },
  negativeChange: {
    color: '#F44336',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.CARD,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  countryRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.PRIMARY + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 2,
  },
  countryListeners: {
    fontSize: 14,
    color: COLORS.TEXT,
    opacity: 0.7,
  },
  countryBar: {
    width: 60,
    height: 4,
    backgroundColor: COLORS.BORDER,
    borderRadius: 2,
    overflow: 'hidden',
  },
  countryBarFill: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.CARD,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  trackRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.PRIMARY + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 14,
    color: COLORS.TEXT,
    opacity: 0.7,
  },
  trackPlays: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  adItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.CARD,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  adInfo: {
    flex: 1,
  },
  adTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 2,
  },
  adStats: {
    fontSize: 14,
    color: COLORS.TEXT,
    opacity: 0.7,
  },
  adCtr: {
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  ctrValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  ctrLabel: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    opacity: 0.8,
  },
  chartPlaceholder: {
    backgroundColor: COLORS.CARD,
    borderRadius: 10,
    padding: 40,
    alignItems: 'center',
    height: 200,
    justifyContent: 'center',
  },
  chartPlaceholderText: {
    fontSize: 24,
    marginBottom: 10,
  },
  chartPlaceholderSubtext: {
    fontSize: 14,
    color: COLORS.TEXT,
    opacity: 0.7,
    textAlign: 'center',
  },
});