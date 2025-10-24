import { Platform } from 'react-native';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PerformanceMetrics {
  memoryUsage: number;
  appState: AppStateStatus;
  networkType: string;
  deviceInfo: {
    brand: string;
    model: string;
    systemVersion: string;
  };
  timestamp: number;
}

class PerformanceService {
  private static listeners: Array<(metrics: PerformanceMetrics) => void> = [];
  private static currentMetrics: PerformanceMetrics | null = null;
  private static isMonitoring = false;
  private static monitoringInterval: NodeJS.Timeout | null = null;

  // Start performance monitoring
  static startMonitoring(intervalMs: number = 30000) { // Default: every 30 seconds
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    
    // Get initial metrics
    this.collectMetrics();
    
    // Set up periodic collection
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    // Listen for app state changes
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  // Stop performance monitoring
  static stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // AppState.removeEventListener doesn't exist in React Native
    // This is handled automatically when component unmounts
  }

  // Add listener for performance metrics
  static addListener(listener: (metrics: PerformanceMetrics) => void) {
    this.listeners.push(listener);
    
    // Immediately call with current metrics if available
    if (this.currentMetrics) {
      listener(this.currentMetrics);
    }
  }

  // Remove listener for performance metrics
  static removeListener(listener: (metrics: PerformanceMetrics) => void) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Collect performance metrics
  private static async collectMetrics() {
    try {
      const metrics: PerformanceMetrics = {
        memoryUsage: await this.getMemoryUsage(),
        appState: AppState.currentState,
        networkType: await this.getNetworkType(),
        deviceInfo: await this.getDeviceInfo(),
        timestamp: Date.now(),
      };

      this.currentMetrics = metrics;
      
      // Notify all listeners
      this.listeners.forEach(listener => {
        try {
          listener(metrics);
        } catch (error) {
          console.error('Error in performance listener:', error);
        }
      });

      // Store metrics for analytics
      this.storeMetrics(metrics);
    } catch (error) {
      console.error('Error collecting performance metrics:', error);
    }
  }

  // Get memory usage (approximate)
  private static async getMemoryUsage(): Promise<number> {
    try {
      // React Native doesn't provide direct memory access
      // This is a simplified approach using AsyncStorage size as a proxy
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
      
      // Return size in KB (very rough approximation)
      return Math.round(totalSize / 1024);
    } catch (error) {
      console.error('Error getting memory usage:', error);
      return 0;
    }
  }

  // Get network type
  private static async getNetworkType(): Promise<string> {
    try {
      // This would require additional libraries like @react-native-community/netinfo
      // For now, return a placeholder
      return 'unknown';
    } catch (error) {
      console.error('Error getting network type:', error);
      return 'unknown';
    }
  }

  // Get device information
  private static async getDeviceInfo() {
    try {
      const deviceInfo = {
        brand: Platform.OS === 'ios' ? 'Apple' : 'Android',
        model: Platform.OS === 'ios' ? 'iPhone' : 'Android',
        systemVersion: Platform.Version.toString(),
      };
      
      return deviceInfo;
    } catch (error) {
      console.error('Error getting device info:', error);
      return {
        brand: 'unknown',
        model: 'unknown',
        systemVersion: 'unknown',
      };
    }
  }

  // Handle app state changes
  private static handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (this.currentMetrics) {
      this.currentMetrics.appState = nextAppState;
      this.currentMetrics.timestamp = Date.now();
      
      // Notify listeners of app state change
      this.listeners.forEach(listener => {
        try {
          if (this.currentMetrics) {
            listener(this.currentMetrics);
          }
        } catch (error) {
          console.error('Error in performance listener:', error);
        }
      });
    }
  };

  // Store metrics for analytics
  private static async storeMetrics(metrics: PerformanceMetrics) {
    try {
      // Get existing metrics
      const existingMetricsStr = await AsyncStorage.getItem('performance_metrics');
      let existingMetrics: PerformanceMetrics[] = [];
      
      if (existingMetricsStr) {
        existingMetrics = JSON.parse(existingMetricsStr);
      }
      
      // Add new metrics
      existingMetrics.push(metrics);
      
      // Keep only last 100 entries to avoid storage bloat
      if (existingMetrics.length > 100) {
        existingMetrics = existingMetrics.slice(-100);
      }
      
      // Store back to AsyncStorage
      await AsyncStorage.setItem('performance_metrics', JSON.stringify(existingMetrics));
    } catch (error) {
      console.error('Error storing performance metrics:', error);
    }
  }

  // Get stored metrics for analytics
  static async getStoredMetrics(): Promise<PerformanceMetrics[]> {
    try {
      const metricsStr = await AsyncStorage.getItem('performance_metrics');
      return metricsStr ? JSON.parse(metricsStr) : [];
    } catch (error) {
      console.error('Error getting stored metrics:', error);
      return [];
    }
  }

  // Clear stored metrics
  static async clearStoredMetrics() {
    try {
      await AsyncStorage.removeItem('performance_metrics');
    } catch (error) {
      console.error('Error clearing stored metrics:', error);
    }
  }

  // Get performance summary
  static async getPerformanceSummary(): Promise<{
    avgMemoryUsage: number;
    maxMemoryUsage: number;
    appStateDistribution: Record<string, number>;
    networkTypeDistribution: Record<string, number>;
  }> {
    try {
      const metrics = await this.getStoredMetrics();
      
      if (metrics.length === 0) {
        return {
          avgMemoryUsage: 0,
          maxMemoryUsage: 0,
          appStateDistribution: {},
          networkTypeDistribution: {},
        };
      }
      
      // Calculate memory usage stats
      const memoryUsages = metrics.map(m => m.memoryUsage);
      const avgMemoryUsage = memoryUsages.reduce((sum, usage) => sum + usage, 0) / memoryUsages.length;
      const maxMemoryUsage = Math.max(...memoryUsages);
      
      // Calculate app state distribution
      const appStateDistribution: Record<string, number> = {};
      metrics.forEach(m => {
        appStateDistribution[m.appState] = (appStateDistribution[m.appState] || 0) + 1;
      });
      
      // Calculate network type distribution
      const networkTypeDistribution: Record<string, number> = {};
      metrics.forEach(m => {
        networkTypeDistribution[m.networkType] = (networkTypeDistribution[m.networkType] || 0) + 1;
      });
      
      return {
        avgMemoryUsage: Math.round(avgMemoryUsage),
        maxMemoryUsage,
        appStateDistribution,
        networkTypeDistribution,
      };
    } catch (error) {
      console.error('Error calculating performance summary:', error);
      return {
        avgMemoryUsage: 0,
        maxMemoryUsage: 0,
        appStateDistribution: {},
        networkTypeDistribution: {},
      };
    }
  }
}

export default PerformanceService;