/**
 * Performance Monitoring Service for Enish Radio Pro Mobile App
 * Simplified version for better compatibility
 */

interface PerformanceMetrics {
  appLaunchTime: number;
  screenLoadTimes: Record<string, number>;
  apiResponseTimes: Record<string, number>;
  timestamp: number;
}

interface ErrorEvent {
  id: string;
  message: string;
  type: 'javascript' | 'network' | 'audio' | 'user';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private startTime: number;
  private screenStartTimes: Map<string, number> = new Map();

  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      appLaunchTime: 0,
      screenLoadTimes: {},
      apiResponseTimes: {},
      timestamp: Date.now()
    };
  }

  markAppLaunchStart() {
    this.startTime = Date.now();
  }

  markAppLaunchComplete() {
    this.metrics.appLaunchTime = Date.now() - this.startTime;
    this.metrics.timestamp = Date.now();
  }

  startScreenTracking(screenName: string) {
    this.screenStartTimes.set(screenName, Date.now());
  }

  endScreenTracking(screenName: string) {
    const startTime = this.screenStartTimes.get(screenName);
    if (startTime) {
      const loadTime = Date.now() - startTime;
      this.metrics.screenLoadTimes[screenName] = loadTime;
      this.screenStartTimes.delete(screenName);
      
      if (loadTime > 1000) {
        console.warn(`Slow screen load: ${screenName} took ${loadTime}ms`);
      }
    }
  }

  trackApiCall(endpoint: string, responseTime: number, success: boolean) {
    this.metrics.apiResponseTimes[endpoint] = responseTime;
    
    if (responseTime > 3000) {
      console.warn(`Slow API call: ${endpoint} took ${responseTime}ms`);
    }
    
    if (!success) {
      console.error(`API call failed: ${endpoint}`);
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  generateReport(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics: this.metrics
    }, null, 2);
  }
}

class ErrorTracker {
  private errors: ErrorEvent[] = [];
  private maxErrors = 100;

  logError(message: string, type: ErrorEvent['type'], severity: ErrorEvent['severity'], context?: Record<string, any>) {
    const error: ErrorEvent = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      message,
      type,
      severity,
      context,
      timestamp: Date.now()
    };

    this.errors.push(error);
    
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    console.error(`[${type.toUpperCase()}] ${message}`, context);
    return error.id;
  }

  getErrors(): ErrorEvent[] {
    return [...this.errors];
  }
}

export const performanceMonitor = new PerformanceMonitor();
export const errorTracker = new ErrorTracker();

// Initialize performance tracking
performanceMonitor.markAppLaunchStart();