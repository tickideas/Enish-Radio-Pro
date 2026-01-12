/* eslint-disable no-console */
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export interface AnalyticsEvent {
  id: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  eventType: string;
  eventName: string;
  properties: Record<string, any>;
  context: {
    platform: 'ios' | 'android';
    appVersion: string;
    osVersion: string;
    deviceModel: string;
    networkType?: string;
    screenResolution?: string;
  };
}

export interface UserMetrics {
  totalPlayTime: number;
  sessionCount: number;
  favoriteGenres: string[];
  averageSessionDuration: number;
  mostUsedFeatures: string[];
  errorCount: number;
  crashCount: number;
  lastActive: Date;
  onboardingCompleted: boolean;
  hasNotificationsEnabled: boolean;
  hasAccessibilityEnabled: boolean;
}

export interface PerformanceMetrics {
  appStartTime: number;
  apiResponseTime: Record<string, number[]>;
  audioBufferingEvents: Array<{
    timestamp: Date;
    duration: number;
    quality: string;
    streamUrl: string;
  }>;
  memoryUsage: Array<{
    timestamp: Date;
    used: number;
    total: number;
  }>;
  batteryDrain: Array<{
    timestamp: Date;
    level: number;
    isCharging: boolean;
  }>;
}

export interface BusinessMetrics {
  totalUsers: number;
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  retentionRates: {
    day1: number;
    day7: number;
    day30: number;
  };
  featureUsage: Record<string, number>;
  geographicDistribution: Record<string, number>;
  deviceDistribution: Record<string, number>;
  versionAdoption: Record<string, number>;
}

class AnalyticsService {
  private sessionId: string;
  private userId?: string;
  private eventQueue: AnalyticsEvent[] = [];
  private isOnline = true;
  private flushInterval?: ReturnType<typeof setInterval>;
  private metricsBuffer: {
    user: Partial<UserMetrics>;
    performance: Partial<PerformanceMetrics>;
  };

  constructor() {
    this.sessionId = Crypto.randomUUID();
    this.metricsBuffer = {
      user: {},
      performance: {}
    };
    
    this.initializeAnalytics();
    this.setupNetworkListener();
    this.startFlushInterval();
  }

  private async initializeAnalytics() {
    try {
      // Get user ID from storage or create anonymous ID
      const storedUserId = await AsyncStorage.getItem('analytics_user_id');
      if (storedUserId) {
        this.userId = storedUserId;
      } else {
        this.userId = `anon_${Crypto.randomUUID()}`;
        await AsyncStorage.setItem('analytics_user_id', this.userId);
      }

      // Initialize user metrics
      await this.loadUserMetrics();
      
      // Track app start
      this.trackEvent('app_start', {
        session_id: this.sessionId,
        timestamp: new Date().toISOString(),
        app_version: this.getAppVersion()
      });
    } catch (error) {
      console.warn('Analytics initialization failed:', error);
    }
  }

  private async loadUserMetrics() {
    try {
      const storedMetrics = await AsyncStorage.getItem('user_metrics');
      if (storedMetrics) {
        this.metricsBuffer.user = JSON.parse(storedMetrics);
      }
    } catch (error) {
      console.warn('Failed to load user metrics:', error);
    }
  }

  private async saveUserMetrics() {
    try {
      await AsyncStorage.setItem('user_metrics', JSON.stringify(this.metricsBuffer.user));
    } catch (error) {
      console.warn('Failed to save user metrics:', error);
    }
  }

  private setupNetworkListener() {
    // Monitor network connectivity changes
    DeviceEventEmitter.addListener('connectivityChange', (isConnected) => {
      this.isOnline = isConnected;
      if (isConnected) {
        this.flushEvents();
      }
    });
  }

  private startFlushInterval() {
    // Flush events every 30 seconds
    this.flushInterval = setInterval(() => {
      if (this.isOnline) {
        this.flushEvents();
      }
    }, 30000);
  }

  private getAppVersion(): string {
    // In a real app, this would get the actual app version
    return '1.0.0';
  }

  private createEvent(eventType: string, eventName: string, properties: Record<string, any>): AnalyticsEvent {
    return {
      id: Crypto.randomUUID(),
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId,
      eventType,
      eventName,
      properties: {
        ...properties,
        session_duration: Date.now() - (this.metricsBuffer.user as any)?.sessionStart || 0
      },
      context: {
        platform: 'ios', // This would be determined at runtime
        appVersion: this.getAppVersion(),
        osVersion: 'unknown', // This would be determined at runtime
        deviceModel: 'unknown', // This would be determined at runtime
      }
    };
  }

  public trackEvent(eventName: string, properties: Record<string, any> = {}) {
    const event = this.createEvent('user_action', eventName, properties);
    
    // Add to queue
    this.eventQueue.push(event);
    
    // Process specific event types
    this.processSpecialEvents(eventName, properties);
    
    // Flush immediately for critical events
    if (this.isCriticalEvent(eventName)) {
      this.flushEvents();
    }
  }

  private isCriticalEvent(eventName: string): boolean {
    const criticalEvents = [
      'app_crash',
      'audio_error',
      'network_error',
      'payment_error',
      'security_violation'
    ];
    return criticalEvents.includes(eventName);
  }

  private processSpecialEvents(eventName: string, properties: Record<string, any>) {
    switch (eventName) {
      case 'audio_play':
        this.updatePlayTime();
        break;
      case 'audio_pause':
        this.updatePlayTime();
        break;
      case 'feature_used':
        this.updateFeatureUsage(properties.feature_name);
        break;
      case 'app_start':
        this.updateUserSession();
        break;
      case 'onboarding_completed':
        this.metricsBuffer.user.onboardingCompleted = true;
        this.saveUserMetrics();
        break;
      case 'notifications_enabled':
        this.metricsBuffer.user.hasNotificationsEnabled = true;
        this.saveUserMetrics();
        break;
      case 'accessibility_enabled':
        this.metricsBuffer.user.hasAccessibilityEnabled = true;
        this.saveUserMetrics();
        break;
      case 'app_crash':
        this.incrementCrashCount();
        break;
    }
  }

  private updatePlayTime() {
    // This would track actual play time in a real implementation
    const currentPlayTime = this.metricsBuffer.user.totalPlayTime || 0;
    this.metricsBuffer.user.totalPlayTime = currentPlayTime + (Math.random() * 30); // Simulated
    this.saveUserMetrics();
  }

  private updateFeatureUsage(featureName: string) {
    if (!this.metricsBuffer.user.mostUsedFeatures) {
      this.metricsBuffer.user.mostUsedFeatures = [];
    }
    
    const currentCount = this.metricsBuffer.user.mostUsedFeatures.filter(f => f === featureName).length;
    if (currentCount < 5) { // Keep top 5 features
      this.metricsBuffer.user.mostUsedFeatures.push(featureName);
      this.saveUserMetrics();
    }
  }

  private updateUserSession() {
    const now = new Date();
    const lastActive = this.metricsBuffer.user.lastActive;
    
    if (lastActive) {
      const daysSinceLastActive = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastActive >= 1) {
        this.metricsBuffer.user.sessionCount = (this.metricsBuffer.user.sessionCount || 0) + 1;
      }
    } else {
      this.metricsBuffer.user.sessionCount = 1;
    }
    
    this.metricsBuffer.user.lastActive = now;
    (this.metricsBuffer.user as any).sessionStart = now.getTime();
    this.saveUserMetrics();
  }

  private incrementCrashCount() {
    this.metricsBuffer.user.crashCount = (this.metricsBuffer.user.crashCount || 0) + 1;
    this.saveUserMetrics();
  }

  // Audio-specific tracking
  public trackAudioEvent(event: string, data: {
    streamUrl?: string;
    quality?: string;
    duration?: number;
    errorType?: string;
    bufferingDuration?: number;
  }) {
    this.trackEvent(`audio_${event}`, {
      ...data,
      timestamp: new Date().toISOString()
    });

    // Track buffering events separately
    if (event === 'buffering') {
      this.recordBufferingEvent(data);
    }
  }

  private recordBufferingEvent(data: any) {
    if (!this.metricsBuffer.performance.audioBufferingEvents) {
      this.metricsBuffer.performance.audioBufferingEvents = [];
    }
    
    this.metricsBuffer.performance.audioBufferingEvents.push({
      timestamp: new Date(),
      duration: data.bufferingDuration || 0,
      quality: data.quality || 'unknown',
      streamUrl: data.streamUrl || 'unknown'
    });

    // Keep only last 100 buffering events
    if (this.metricsBuffer.performance.audioBufferingEvents.length > 100) {
      this.metricsBuffer.performance.audioBufferingEvents = 
        this.metricsBuffer.performance.audioBufferingEvents.slice(-100);
    }
  }

  // Performance tracking
  public trackPerformance(metric: string, value: number, unit: string = 'ms') {
    if (!this.metricsBuffer.performance.apiResponseTime) {
      this.metricsBuffer.performance.apiResponseTime = {};
    }
    
    if (!this.metricsBuffer.performance.apiResponseTime[metric]) {
      this.metricsBuffer.performance.apiResponseTime[metric] = [];
    }
    
    this.metricsBuffer.performance.apiResponseTime[metric].push(value);
    
    // Keep only last 100 values
    if (this.metricsBuffer.performance.apiResponseTime[metric].length > 100) {
      this.metricsBuffer.performance.apiResponseTime[metric] = 
        this.metricsBuffer.performance.apiResponseTime[metric].slice(-100);
    }
  }

  public trackMemoryUsage(used: number, total: number) {
    if (!this.metricsBuffer.performance.memoryUsage) {
      this.metricsBuffer.performance.memoryUsage = [];
    }
    
    this.metricsBuffer.performance.memoryUsage.push({
      timestamp: new Date(),
      used,
      total
    });

    // Keep only last 50 measurements
    if (this.metricsBuffer.performance.memoryUsage.length > 50) {
      this.metricsBuffer.performance.memoryUsage = 
        this.metricsBuffer.performance.memoryUsage.slice(-50);
    }
  }

  public trackBattery(level: number, isCharging: boolean) {
    if (!this.metricsBuffer.performance.batteryDrain) {
      this.metricsBuffer.performance.batteryDrain = [];
    }
    
    this.metricsBuffer.performance.batteryDrain.push({
      timestamp: new Date(),
      level,
      isCharging
    });
  }

  // User Journey Tracking
  public trackUserJourney(event: string, step: number, metadata?: Record<string, any>) {
    this.trackEvent('user_journey', {
      journey_name: event,
      step,
      ...metadata
    });
  }

  public startUserJourney(journeyName: string) {
    this.trackUserJourney(journeyName, 1, { action: 'start' });
  }

  public completeUserJourney(journeyName: string, metadata?: Record<string, any>) {
    this.trackUserJourney(journeyName, 99, { action: 'complete', ...metadata });
  }

  public abandonUserJourney(journeyName: string, step: number, reason?: string) {
    this.trackUserJourney(journeyName, step, { action: 'abandon', reason });
  }

  // Error Tracking
  public trackError(error: Error, context?: Record<string, any>) {
    const errorEvent = this.createEvent('error', 'application_error', {
      error_message: error.message,
      error_stack: error.stack,
      error_type: error.constructor.name,
      ...context
    });
    
    this.eventQueue.push(errorEvent);
    this.flushEvents(); // Flush errors immediately
  }

  public trackFatalError(error: Error, context?: Record<string, any>) {
    this.trackError(error, { 
      severity: 'fatal',
      requires_immediate_attention: true,
      ...context 
    });
  }

  // A/B Testing Support
  public getUserVariant(experimentId: string): string {
    // Simple hash-based assignment for consistent variants
    const hash = this.hashCode(`${this.userId}_${experimentId}`);
    return hash % 2 === 0 ? 'A' : 'B';
  }

  public trackExperiment(experimentId: string, variant: string, event: string, data?: Record<string, any>) {
    this.trackEvent('experiment', {
      experiment_id: experimentId,
      variant,
      event,
      ...data
    });
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Batch Processing
  private async flushEvents() {
    if (this.eventQueue.length === 0 || !this.isOnline) {
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // In a real implementation, this would send to your analytics backend
      console.log('Flushing analytics events:', events.length);
      
      // For now, just log to console in development
      if (__DEV__) {
        console.log('Analytics Events:', events);
      }
      
      // TODO: Send to analytics service like Mixpanel, Amplitude, or custom backend
      // await this.sendToAnalyticsService(events);
      
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Re-queue events if they failed to send
      this.eventQueue.unshift(...events);
    }
  }

  // Data Export
  public async exportAnalytics(): Promise<{
    user: UserMetrics;
    performance: PerformanceMetrics;
    events: AnalyticsEvent[];
  }> {
    await this.flushEvents(); // Ensure all events are processed
    
    return {
      user: this.metricsBuffer.user as UserMetrics,
      performance: this.metricsBuffer.performance as PerformanceMetrics,
      events: [...this.eventQueue]
    };
  }

  public async clearAnalytics() {
    this.eventQueue = [];
    this.metricsBuffer = {
      user: {},
      performance: {}
    };
    await AsyncStorage.removeItem('user_metrics');
    await AsyncStorage.removeItem('analytics_user_id');
  }

  // Cleanup
  public destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushEvents();
  }
}

// Singleton instance
export const analytics = new AnalyticsService();

// React hook for easy usage
export const useAnalytics = () => {
  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackAudioEvent: analytics.trackAudioEvent.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackFatalError: analytics.trackFatalError.bind(analytics),
    startUserJourney: analytics.startUserJourney.bind(analytics),
    completeUserJourney: analytics.completeUserJourney.bind(analytics),
    abandonUserJourney: analytics.abandonUserJourney.bind(analytics),
    getUserVariant: analytics.getUserVariant.bind(analytics),
    trackExperiment: analytics.trackExperiment.bind(analytics),
    exportAnalytics: analytics.exportAnalytics.bind(analytics),
    clearAnalytics: analytics.clearAnalytics.bind(analytics)
  };
};