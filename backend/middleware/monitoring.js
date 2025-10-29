/**
 * Error Tracking and Performance Monitoring Middleware
 * Implements comprehensive logging, error tracking, and performance monitoring
 */

import { Hono } from 'hono'
import { logger } from 'hono/logger'
import fs from 'fs/promises'
import path from 'path'

// Performance Monitoring Metrics
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: new Map(),
      errors: new Map(),
      responseTimes: [],
      memoryUsage: [],
      activeConnections: 0
    }
    
    // Start memory monitoring
    this.startMemoryMonitoring()
  }

  startMemoryMonitoring() {
    setInterval(() => {
      const usage = process.memoryUsage()
      this.metrics.memoryUsage.push({
        timestamp: Date.now(),
        rss: usage.rss,
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external
      })
      
      // Keep only last 100 measurements
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100)
      }
    }, 30000) // Every 30 seconds
  }

  recordRequest(method, path, statusCode, responseTime) {
    const key = `${method} ${path}`
    const record = this.metrics.requests.get(key) || { 
      count: 0, 
      errors: 0, 
      avgResponseTime: 0,
      statusCodes: new Map()
    }
    
    record.count++
    record.statusCodes.set(statusCode, (record.statusCodes.get(statusCode) || 0) + 1)
    
    // Update average response time
    record.avgResponseTime = (record.avgResponseTime * (record.count - 1) + responseTime) / record.count
    
    if (statusCode >= 400) {
      record.errors++
    }
    
    this.metrics.requests.set(key, record)
    
    // Record response time
    this.metrics.responseTimes.push({
      timestamp: Date.now(),
      method,
      path,
      statusCode,
      responseTime
    })
    
    // Keep only last 1000 response times
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes = this.metrics.responseTimes.slice(-1000)
    }
  }

  recordError(error, context = {}) {
    const errorKey = error.name || 'UnknownError'
    const record = this.metrics.errors.get(errorKey) || { count: 0, examples: [] }
    
    record.count++
    
    // Store last 5 error examples for debugging
    if (record.examples.length < 5) {
      record.examples.push({
        timestamp: Date.now(),
        message: error.message,
        stack: error.stack,
        context
      })
    }
    
    this.metrics.errors.set(errorKey, record)
  }

  getMetrics() {
    const now = Date.now()
    const recentRequests = this.metrics.responseTimes.filter(r => now - r.timestamp < 3600000) // Last hour
    
    const avgResponseTime = recentRequests.length > 0 
      ? recentRequests.reduce((sum, r) => sum + r.responseTime, 0) / recentRequests.length
      : 0
    
    const errorRate = recentRequests.length > 0
      ? recentRequests.filter(r => r.statusCode >= 400).length / recentRequests.length
      : 0
    
    return {
      uptime: process.uptime(),
      timestamp: now,
      requests: {
        total: Array.from(this.metrics.requests.values()).reduce((sum, r) => sum + r.count, 0),
        averageResponseTime: Math.round(avgResponseTime),
        errorRate: Math.round(errorRate * 100) / 100,
        endpoints: Object.fromEntries(this.metrics.requests)
      },
      errors: Object.fromEntries(this.metrics.errors),
      memory: this.getMemoryStats(),
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cpuUsage: process.cpuUsage(),
        loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0]
      }
    }
  }

  getMemoryStats() {
    const usage = process.memoryUsage()
    const recent = this.metrics.memoryUsage.slice(-5)
    const avgHeapUsage = recent.length > 0 
      ? recent.reduce((sum, m) => sum + m.heapUsed, 0) / recent.length
      : usage.heapUsed
    
    return {
      current: usage,
      averageHeapUsage: Math.round(avgHeapUsage),
      heapUsagePercent: Math.round((usage.heapUsed / usage.heapTotal) * 100)
    }
  }

  async generateReport() {
    const metrics = this.getMetrics()
    const report = {
      generatedAt: new Date().toISOString(),
      ...metrics,
      recommendations: this.generateRecommendations(metrics)
    }
    
    return report
  }

  generateRecommendations(metrics) {
    const recommendations = []
    
    // Response time recommendations
    if (metrics.requests.averageResponseTime > 1000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Average response time is above 1 second. Consider optimizing database queries or adding caching.',
        action: 'Optimize slow endpoints and add database indexes'
      })
    }
    
    // Error rate recommendations
    if (metrics.requests.errorRate > 0.05) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        message: 'Error rate is above 5%. Review error logs and fix common issues.',
        action: 'Investigate high-error endpoints and implement better error handling'
      })
    }
    
    // Memory usage recommendations
    if (metrics.memory.heapUsagePercent > 80) {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        message: 'Memory usage is above 80%. Consider optimizing memory usage or increasing heap size.',
        action: 'Profile memory usage and implement proper cleanup'
      })
    }
    
    return recommendations
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor()

// Request ID generator
const generateRequestId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Enhanced request logging middleware
export const requestLogger = logger((message, ...args) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    message,
    args: args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
    )
  }
  
  // Write to application log file
  logToFile('application.log', logEntry)
})

// Error tracking middleware
export const errorTracker = async (c, next) => {
  const startTime = Date.now()
  const requestId = generateRequestId()
  
  // Add request ID to headers for tracking
  c.header('X-Request-ID', requestId)
  c.set('requestId', requestId)
  c.set('startTime', startTime)
  
  try {
    await next()
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    // Log the error
    console.error(`[${requestId}] Error:`, error)
    
    // Record error in performance monitor
    performanceMonitor.recordError(error, {
      requestId,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      responseTime
    })
    
    // Log to file
    await logToFile('errors.log', {
      timestamp: new Date().toISOString(),
      requestId,
      level: 'error',
      message: error.message,
      stack: error.stack,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      responseTime,
      headers: Object.fromEntries(c.req.raw.headers.entries())
    })
    
    // Don't expose internal errors in production
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
    
    // Return consistent error response
    c.status(500)
    return c.json({
      error: 'Something went wrong!',
      message,
      requestId,
      timestamp: new Date().toISOString()
    })
  }
}

// Performance tracking middleware
export const performanceTracker = async (c, next) => {
  const startTime = Date.now()
  
  try {
    await next()
  } finally {
    const responseTime = Date.now() - startTime
    
    // Record request metrics
    performanceMonitor.recordRequest(
      c.req.method,
      c.req.path,
      c.res.status,
      responseTime
    )
    
    // Add performance headers
    c.header('X-Response-Time', `${responseTime}ms`)
    c.header('X-Request-ID', c.get('requestId'))
    
    // Log slow requests
    if (responseTime > 1000) {
      console.warn(`[${c.get('requestId')}] Slow request: ${c.req.method} ${c.req.path} took ${responseTime}ms`)
      
      await logToFile('performance.log', {
        timestamp: new Date().toISOString(),
        level: 'warning',
        requestId: c.get('requestId'),
        method: c.req.method,
        path: c.req.path,
        responseTime,
        status: c.res.status
      })
    }
  }
}

// Health check with detailed system information
export const detailedHealthCheck = async (c) => {
  try {
    const metrics = performanceMonitor.getMetrics()
    const dbHealth = await checkDatabaseHealth()
    
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.round(process.uptime()),
      database: dbHealth,
      metrics: {
        requests: metrics.requests,
        memory: metrics.memory,
        system: metrics.system
      },
      alerts: generateHealthAlerts(metrics, dbHealth)
    }
    
    // If there are critical issues, return 503
    const hasCriticalIssues = healthData.alerts.some(alert => alert.severity === 'critical')
    const statusCode = hasCriticalIssues ? 503 : 200
    
    return c.json(healthData, statusCode)
  } catch (error) {
    console.error('Health check error:', error)
    return c.json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    }, 503)
  }
}

// Database health check
async function checkDatabaseHealth() {
  try {
    const { pool } = await import('../drizzle/db.js')
    const result = await pool.query('SELECT 1 as health_check')
    const isConnected = result?.rows?.[0]?.health_check === 1
    
    return {
      status: isConnected ? 'connected' : 'disconnected',
      responseTime: Date.now(), // This would be actual query time in real implementation
      connectionDetails: {
        host: pool.options?.host || 'unknown',
        port: pool.options?.port || 'unknown'
      }
    }
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    }
  }
}

// Generate health alerts
function generateHealthAlerts(metrics, dbHealth) {
  const alerts = []
  
  // Memory usage alert
  if (metrics.memory.heapUsagePercent > 85) {
    alerts.push({
      type: 'memory',
      severity: metrics.memory.heapUsagePercent > 95 ? 'critical' : 'warning',
      message: `High memory usage: ${metrics.memory.heapUsagePercent}%`,
      value: metrics.memory.heapUsagePercent
    })
  }
  
  // Error rate alert
  if (metrics.requests.errorRate > 0.1) {
    alerts.push({
      type: 'errors',
      severity: 'warning',
      message: `High error rate: ${(metrics.requests.errorRate * 100).toFixed(2)}%`,
      value: metrics.requests.errorRate
    })
  }
  
  // Database connectivity alert
  if (dbHealth.status !== 'connected') {
    alerts.push({
      type: 'database',
      severity: 'critical',
      message: 'Database connection failed',
      value: dbHealth.status
    })
  }
  
  // Response time alert
  if (metrics.requests.averageResponseTime > 2000) {
    alerts.push({
      type: 'performance',
      severity: 'warning',
      message: `High response time: ${metrics.requests.averageResponseTime}ms`,
      value: metrics.requests.averageResponseTime
    })
  }
  
  return alerts
}

// File logging utility
async function logToFile(filename, data) {
  try {
    const logDir = './logs'
    await fs.mkdir(logDir, { recursive: true })
    const logPath = path.join(logDir, filename)
    const logEntry = JSON.stringify(data) + '\n'
    
    await fs.appendFile(logPath, logEntry)
  } catch (error) {
    console.error('Failed to write to log file:', error)
  }
}

// Metrics endpoint for monitoring tools
export const metricsEndpoint = async (c) => {
  const format = c.req.query('format') || 'json'
  
  if (format === 'json') {
    const metrics = await performanceMonitor.generateReport()
    return c.json(metrics)
  }
  
  if (format === 'prometheus') {
    const metrics = performanceMonitor.getMetrics()
    const prometheusMetrics = generatePrometheusMetrics(metrics)
    c.header('Content-Type', 'text/plain')
    return c.text(prometheusMetrics)
  }
  
  return c.json({ error: 'Unsupported format' }, 400)
}

// Generate Prometheus metrics
function generatePrometheusMetrics(metrics) {
  const lines = []
  
  // HTTP metrics
  lines.push(`# HELP http_requests_total Total number of HTTP requests`)
  lines.push(`# TYPE http_requests_total counter`)
  lines.push(`http_requests_total{method="GET",endpoint="/"} ${metrics.requests.total}`)
  
  // Response time metrics
  lines.push(`# HELP http_request_duration_seconds HTTP request duration in seconds`)
  lines.push(`# TYPE http_request_duration_seconds histogram`)
  lines.push(`http_request_duration_seconds_bucket{le="0.1"} 0`)
  lines.push(`http_request_duration_seconds_bucket{le="0.5"} 0`)
  lines.push(`http_request_duration_seconds_bucket{le="1.0"} 0`)
  lines.push(`http_request_duration_seconds_bucket{le="+Inf"} ${metrics.requests.total}`)
  lines.push(`http_request_duration_seconds_sum ${metrics.requests.averageResponseTime / 1000}`)
  lines.push(`http_request_duration_seconds_count ${metrics.requests.total}`)
  
  // Memory metrics
  lines.push(`# HELP nodejs_heap_used_bytes Used heap size in bytes`)
  lines.push(`# TYPE nodejs_heap_used_bytes gauge`)
  lines.push(`nodejs_heap_used_bytes ${metrics.memory.current.heapUsed}`)
  
  return lines.join('\n')
}

// Cleanup function for graceful shutdown
export const cleanup = async () => {
  console.log('Performing cleanup...')
  
  // Generate final report
  try {
    const report = await performanceMonitor.generateReport()
    await logToFile('final-report.json', report)
    console.log('Final performance report generated')
  } catch (error) {
    console.error('Failed to generate final report:', error)
  }
}

export default {
  performanceMonitor,
  requestLogger,
  errorTracker,
  performanceTracker,
  detailedHealthCheck,
  metricsEndpoint,
  cleanup,
  generateRequestId
}