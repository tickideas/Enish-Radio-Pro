import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys
const CACHE_KEYS = {
  SOCIAL_LINKS: 'cache_social_links',
  AD_BANNERS: 'cache_ad_banners',
  STREAM_METADATA: 'cache_stream_metadata',
  USER_PROFILE: 'cache_user_profile',
  ANALYTICS: 'cache_analytics',
};

// Default cache TTL in milliseconds
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheService {
  // Get data from cache
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cachedItem = await AsyncStorage.getItem(key);
      if (!cachedItem) {
        return null;
      }

      const { data, timestamp, ttl }: CacheItem<T> = JSON.parse(cachedItem);
      
      // Check if cache is still valid
      if (Date.now() - timestamp > ttl) {
        // Cache expired, remove it
        await AsyncStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error(`Error getting cache for key ${key}:`, error);
      return null;
    }
  }

  // Set data in cache with optional TTL
  static async set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): Promise<void> {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.error(`Error setting cache for key ${key}:`, error);
    }
  }

  // Remove data from cache
  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing cache for key ${key}:`, error);
    }
  }

  // Clear all cache
  static async clear(): Promise<void> {
    try {
      const keys = Object.values(CACHE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Check if cache exists and is valid
  static async isValid(key: string): Promise<boolean> {
    try {
      const cachedItem = await AsyncStorage.getItem(key);
      if (!cachedItem) {
        return false;
      }

      const { timestamp, ttl }: CacheItem<any> = JSON.parse(cachedItem);
      return Date.now() - timestamp <= ttl;
    } catch (error) {
      console.error(`Error checking cache validity for key ${key}:`, error);
      return false;
    }
  }

  // Get cache size (approximate, in characters)
  static async getCacheSize(): Promise<number> {
    try {
      const keys = Object.values(CACHE_KEYS);
      const items = await AsyncStorage.multiGet(keys);
      
      let totalSize = 0;
      Object.values(items).forEach(item => {
        if (item) {
          totalSize += item.length;
        }
      });
      
      return totalSize;
    } catch (error) {
      console.error('Error getting cache size:', error);
      return 0;
    }
  }

  // Get cache keys
  static getCacheKeys() {
    return { ...CACHE_KEYS };
  }
}

export default CacheService;