/**
 * Optimized Database Layer for Enish Radio Pro
 * Implements connection pooling, query optimization, caching, and performance monitoring
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { performanceMonitor } from '../middleware/monitoring.js';

// Connection pool configuration
const createOptimizedPool = () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // Maximum number of clients in the pool
    min: 5,  // Minimum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
    allowExitOnIdle: false,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,
    application_name: 'enish-radio-pro-backend'
  });

  // Log pool events for monitoring
  pool.on('connect', (client) => {
    client.query('SET application_name = $1', ['enish-radio-pro-backend']);
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  pool.on('remove', () => {
    console.log('Client removed from pool');
  });

  return pool;
};

// Redis cache configuration
const createRedisClient = () => {
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    family: 4, // 4 (IPv4) or 6 (IPv6)
    connectTimeout: 10000,
    commandTimeout: 5000
  });

  redis.on('connect', () => {
    console.log('Connected to Redis');
  });

  redis.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  return redis;
};

// Query cache with TTL
class QueryCache {
  constructor(redisClient) {
    this.redis = redisClient;
    this.localCache = new Map();
    this.defaultTTL = 300; // 5 minutes
  }

  async get(key) {
    try {
      // Try Redis first
      const redisValue = await this.redis.get(`cache:${key}`);
      if (redisValue) {
        return JSON.parse(redisValue);
      }

      // Fallback to local cache
      const cached = this.localCache.get(key);
      if (cached && Date.now() < cached.expires) {
        return cached.data;
      }

      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      // Fallback to local cache on Redis error
      const cached = this.localCache.get(key);
      return cached ? cached.data : null;
    }
  }

  async set(key, data, ttl = this.defaultTTL) {
    try {
      // Store in Redis with TTL
      await this.redis.setex(`cache:${key}`, ttl, JSON.stringify(data));
      
      // Store in local cache as backup
      this.localCache.set(key, {
        data,
        expires: Date.now() + (ttl * 1000)
      });

      // Clean up expired local entries periodically
      if (this.localCache.size > 1000) {
        this.cleanupLocalCache();
      }
    } catch (error) {
      console.error('Cache set error:', error);
      // Store in local cache only on Redis error
      this.localCache.set(key, {
        data,
        expires: Date.now() + (ttl * 1000)
      });
    }
  }

  async delete(key) {
    try {
      await this.redis.del(`cache:${key}`);
      this.localCache.delete(key);
    } catch (error) {
      console.error('Cache delete error:', error);
      this.localCache.delete(key);
    }
  }

  async clear() {
    try {
      const keys = await this.redis.keys('cache:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      this.localCache.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
      this.localCache.clear();
    }
  }

  cleanupLocalCache() {
    const now = Date.now();
    for (const [key, value] of this.localCache.entries()) {
      if (now >= value.expires) {
        this.localCache.delete(key);
      }
    }
  }
}

// Database performance monitoring
class DatabasePerformanceMonitor {
  constructor() {
    this.queryStats = new Map();
    this.slowQueryThreshold = 1000; // 1 second
  }

  startQuery(queryName) {
    return {
      queryName,
      startTime: process.hrtime.bigint(),
      query: null
    };
  }

  endQuery(tracker, query) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - tracker.startTime) / 1000000; // Convert to milliseconds

    // Store query statistics
    const stats = this.queryStats.get(tracker.queryName) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      minTime: Infinity,
      maxTime: 0,
      slowQueries: 0
    };

    stats.count++;
    stats.totalTime += duration;
    stats.avgTime = stats.totalTime / stats.count;
    stats.minTime = Math.min(stats.minTime, duration);
    stats.maxTime = Math.max(stats.maxTime, duration);

    if (duration > this.slowQueryThreshold) {
      stats.slowQueries++;
      console.warn(`Slow query detected: ${tracker.queryName} took ${duration}ms`);
    }

    this.queryStats.set(tracker.queryName, stats);

    // Report to performance monitor
    performanceMonitor.recordQueryExecution(tracker.queryName, duration, duration > this.slowQueryThreshold);

    return duration;
  }

  getStats() {
    return Object.fromEntries(this.queryStats);
  }
}

// Optimized database wrapper
class OptimizedDatabase {
  constructor() {
    this.pool = createOptimizedPool();
    this.redis = createRedisClient();
    this.cache = new QueryCache(this.redis);
    this.performanceMonitor = new DatabasePerformanceMonitor();
    this.db = drizzle(this.pool);
  }

  async connect() {
    try {
      await this.pool.connect();
      await this.redis.connect();
      console.log('Database and Redis connections established');
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.pool.end();
      await this.redis.quit();
      console.log('Database and Redis connections closed');
    } catch (error) {
      console.error('Error closing connections:', error);
    }
  }

  // Optimized query with performance monitoring and caching
  async query(queryName, queryFn, cacheKey = null, cacheTTL = 300) {
    const tracker = this.performanceMonitor.startQuery(queryName);
    
    try {
      // Check cache if cacheKey is provided
      if (cacheKey) {
        const cached = await this.cache.get(cacheKey);
        if (cached) {
          this.performanceMonitor.endQuery(tracker, queryFn.toString());
          return cached;
        }
      }

      // Execute query
      const result = await queryFn();

      // Cache result if cacheKey is provided
      if (cacheKey) {
        await this.cache.set(cacheKey, result, cacheTTL);
      }

      this.performanceMonitor.endQuery(tracker, queryFn.toString());
      return result;
    } catch (error) {
      this.performanceMonitor.endQuery(tracker, queryFn.toString());
      throw error;
    }
  }

  // Batch query execution
  async batchQuery(queries) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const results = [];
      for (const { name, queryFn } of queries) {
        const tracker = this.performanceMonitor.startQuery(name);
        const result = await queryFn(client);
        this.performanceMonitor.endQuery(tracker, queryFn.toString());
        results.push({ name, result });
      }

      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Connection health check
  async healthCheck() {
    try {
      const result = await this.pool.query('SELECT 1 as health_check, NOW() as timestamp');
      const redisResult = await this.redis.ping();
      
      return {
        database: {
          status: 'healthy',
          responseTime: Date.now(),
          connectionCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount
        },
        redis: {
          status: redisResult === 'PONG' ? 'healthy' : 'unhealthy',
          responseTime: Date.now()
        },
        cache: {
          status: 'operational',
          hitRate: this.calculateCacheHitRate()
        },
        performance: this.performanceMonitor.getStats()
      };
    } catch (error) {
      return {
        database: {
          status: 'error',
          error: error.message
        },
        redis: {
          status: 'error',
          error: error.message
        },
        cache: {
          status: 'error',
          error: error.message
        }
      };
    }
  }

  // Get cache statistics
  getCacheStats() {
    return {
      redis: {
        connected: this.redis.status === 'ready',
        commandsProcessed: this.redis.commandsProcessed || 0,
        instantaneousOpsPerSec: this.redis.instantaneousOpsPerSec || 0
      },
      local: {
        size: this.cache.localCache.size,
        keys: Array.from(this.cache.localCache.keys())
      }
    };
  }

  calculateCacheHitRate() {
    // This would be calculated from Redis INFO
    // For now, return a placeholder
    return 0;
  }

  // Clear all caches
  async clearCache() {
    await this.cache.clear();
  }

  // Get performance statistics
  getPerformanceStats() {
    return {
      queryStats: this.performanceMonitor.getStats(),
      connectionStats: {
        total: this.pool.totalCount,
        idle: this.pool.idleCount,
        waiting: this.pool.waitingCount
      }
    };
  }
}

// Optimized models with caching and performance monitoring
export class OptimizedUserModel {
  constructor(db) {
    this.db = db;
    this.cachePrefix = 'user';
  }

  async findByEmail(email, useCache = true) {
    const cacheKey = `${this.cachePrefix}:email:${email}`;
    
    return this.db.query('user_find_by_email', 
      () => import('./models/User.js').then(m => m.default.findByEmail(email)),
      useCache ? cacheKey : null,
      useCache ? 600 : 0 // Cache for 10 minutes
    );
  }

  async findById(id, useCache = true) {
    const cacheKey = `${this.cachePrefix}:id:${id}`;
    
    return this.db.query('user_find_by_id',
      () => import('./models/User.js').then(m => m.default.findById(id)),
      useCache ? cacheKey : null,
      useCache ? 600 : 0
    );
  }

  async findAll() {
    return this.db.query('user_find_all',
      () => import('./models/User.js').then(m => m.default.findAll()),
      `${this.cachePrefix}:all`,
      300 // Cache for 5 minutes
    );
  }

  async countByRole(role, isActive = true) {
    return this.db.query('user_count_by_role',
      async () => {
        // Optimized count query
        const client = await this.db.pool.connect();
        try {
          const result = await client.query(
            'SELECT COUNT(*) as count FROM users WHERE role = $1 AND is_active = $2',
            [role, isActive]
          );
          return parseInt(result.rows[0].count);
        } finally {
          client.release();
        }
      },
      `${this.cachePrefix}:count:${role}:${isActive}`,
      180 // Cache for 3 minutes
    );
  }

  // Cache invalidation methods
  async invalidateEmailCache(email) {
    await this.db.cache.delete(`${this.cachePrefix}:email:${email}`);
  }

  async invalidateIdCache(id) {
    await this.db.cache.delete(`${this.cachePrefix}:id:${id}`);
  }

  async invalidateAllCache() {
    await this.db.cache.delete(`${this.cachePrefix}:all`);
  }
}

export class OptimizedAnalyticsModel {
  constructor(db) {
    this.db = db;
    this.cachePrefix = 'analytics';
  }

  async getOverview(timeframe = 'week') {
    const cacheKey = `${this.cachePrefix}:overview:${timeframe}`;
    
    return this.db.query('analytics_overview',
      async () => {
        const now = new Date();
        let startDate;
        
        switch (timeframe) {
          case 'day':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        // Optimized analytics query with single query
        const client = await this.db.pool.connect();
        try {
          const result = await client.query(`
            SELECT 
              (SELECT COUNT(*) FROM social_links) as total_social_links,
              (SELECT COUNT(*) FROM social_links WHERE is_active = true) as active_social_links,
              (SELECT COUNT(*) FROM ad_banners) as total_ads,
              (SELECT COUNT(*) FROM ad_banners WHERE is_active = true) as active_ads,
              (SELECT COALESCE(SUM(click_count), 0) FROM ad_banners) as total_clicks,
              (SELECT COALESCE(SUM(click_count), 0) FROM ad_banners WHERE created_at >= $1) as timeframe_clicks
          `, [startDate]);
          
          return result.rows[0];
        } finally {
          client.release();
        }
      },
      cacheKey,
      60 // Cache for 1 minute
    );
  }

  async getAdPerformance(timeframe = 'week', limit = 10) {
    const cacheKey = `${this.cachePrefix}:ads:${timeframe}:${limit}`;
    
    return this.db.query('ads_performance',
      async () => {
        const now = new Date();
        let startDate;
        
        switch (timeframe) {
          case 'day':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        const client = await this.db.pool.connect();
        try {
          const result = await client.query(`
            SELECT 
              id, title, click_count, impression_count,
              ROUND(click_count * 100.0 / NULLIF(impression_count, 0), 2) as ctr,
              created_at
            FROM ad_banners 
            WHERE created_at >= $1 
            ORDER BY click_count DESC 
            LIMIT $2
          `, [startDate, limit]);
          
          return result.rows;
        } finally {
          client.release();
        }
      },
      cacheKey,
      120 // Cache for 2 minutes
    );
  }

  async invalidateCache() {
    await this.db.cache.delete(`${this.cachePrefix}:overview:*`);
    await this.db.cache.delete(`${this.cachePrefix}:ads:*`);
  }
}

// Export singleton instance
let dbInstance = null;

export const getOptimizedDatabase = () => {
  if (!dbInstance) {
    dbInstance = new OptimizedDatabase();
  }
  return dbInstance;
};

export default getOptimizedDatabase;