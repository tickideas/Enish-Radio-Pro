import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/radio';

export interface UserPreferences {
  autoPlayEnabled: boolean;
}

export class CacheService {
  /**
   * Get user preferences from storage
   */
  static async getUserPreferences(): Promise<UserPreferences> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (stored) {
        return JSON.parse(stored);
      }
      // Return default preferences
      return {
        autoPlayEnabled: true, // Default to auto-play enabled
      };
    } catch (error) {
      console.error('Error loading user preferences:', error);
      return {
        autoPlayEnabled: true, // Fallback to auto-play enabled
      };
    }
  }

  /**
   * Save user preferences to storage
   */
  static async saveUserPreferences(preferences: UserPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify(preferences)
      );
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  }

  /**
   * Get auto-play setting
   */
  static async getAutoPlaySetting(): Promise<boolean> {
    const preferences = await this.getUserPreferences();
    return preferences.autoPlayEnabled;
  }

  /**
   * Set auto-play setting
   */
  static async setAutoPlaySetting(enabled: boolean): Promise<void> {
    const preferences = await this.getUserPreferences();
    preferences.autoPlayEnabled = enabled;
    await this.saveUserPreferences(preferences);
  }

  /**
   * Clear all cached data
   */
  static async clearCache(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get cache keys for different data types
   */
  static getCacheKeys() {
    return {
      SOCIAL_LINKS: 'social_links',
      AD_BANNERS: 'ad_banners',
      STREAM_METADATA: 'stream_metadata',
      AUTH_VERIFY: 'auth_verify',
      HEALTH_CHECK: 'health_check',
    };
  }

  /**
   * Remove specific cache key
   */
  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing cache key:', error);
    }
  }
}