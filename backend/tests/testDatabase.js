// Test database utilities and helpers

const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const fs = require('fs');
const path = require('path');

class TestDatabase {
  constructor() {
    this.pool = null;
    this.db = null;
    this.isInitialized = false;
    this.client = null;
  }

  // Get connection string for test database
  getConnectionString() {
    return process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/enish_radio_test';
  }

  // Initialize test database connection
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Create connection pool
      this.pool = new Pool({
        connectionString: this.getConnectionString(),
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Initialize Drizzle
      this.db = drizzle(this.pool);

      // Test connection
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      console.log('✅ Test database connected:', result.rows[0].now);
      client.release();

      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize test database:', error);
      throw error;
    }
  }

  // Begin transaction for test isolation
  async beginTransaction() {
    await this.ensureInitialized();
    this.client = await this.pool.connect();
    await this.client.query('BEGIN');
  }

  // Rollback transaction
  async rollbackTransaction() {
    if (this.client) {
      try {
        await this.client.query('ROLLBACK');
      } catch (error) {
        console.warn('Warning: Failed to rollback transaction:', error.message);
      } finally {
        this.client.release();
        this.client = null;
      }
    }
  }

  // Clean up all test data
  async cleanup() {
    if (!this.isInitialized) return;

    try {
      // Disable foreign key constraints temporarily
      await this.execute('SET session_replication_role = replica;');

      // Clean tables in reverse dependency order
      const tables = [
        'analytics_events',
        'ad_banners',
        'social_links',
        'user_sessions',
        'users',
      ];

      for (const table of tables) {
        await this.execute(`DELETE FROM ${table}`);
      }

      // Re-enable foreign key constraints
      await this.execute('SET session_replication_role = DEFAULT;');

      console.log('✅ Test database cleaned');
    } catch (error) {
      console.error('❌ Failed to clean test database:', error);
      throw error;
    }
  }

  // Execute SQL query
  async execute(query, params = []) {
    await this.ensureInitialized();
    
    if (this.client) {
      return await this.client.query(query, params);
    } else {
      return await this.pool.query(query, params);
    }
  }

  // Get database instance
  async getDb() {
    await this.ensureInitialized();
    return this.db;
  }

  // Insert test data
  async insert(table, data) {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
    const result = await this.execute(query, values);
    return result.rows[0];
  }

  // Update test data
  async update(table, data, whereClause, whereParams = []) {
    const setClause = Object.keys(data)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
    
    const values = [...Object.values(data), ...whereParams];
    const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING *`;
    const result = await this.execute(query, values);
    return result.rows[0];
  }

  // Delete test data
  async delete(table, whereClause, whereParams = []) {
    const query = `DELETE FROM ${table} WHERE ${whereClause} RETURNING *`;
    const result = await this.execute(query, whereParams);
    return result.rows;
  }

  // Get test data by ID
  async getById(table, id) {
    const query = `SELECT * FROM ${table} WHERE id = $1`;
    const result = await this.execute(query, [id]);
    return result.rows[0] || null;
  }

  // Get all test data
  async getAll(table, conditions = []) {
    let query = `SELECT * FROM ${table}`;
    let params = [];
    let paramIndex = 1;

    if (conditions.length > 0) {
      const whereClause = conditions
        .map(([column, operator]) => `${column} $${paramIndex++}`)
        .join(' AND ');
      
      query += ` WHERE ${whereClause}`;
      params = conditions.map(([, value]) => value);
    }

    const result = await this.execute(query, params);
    return result.rows;
  }

  // Count records in table
  async count(table, conditions = []) {
    let query = `SELECT COUNT(*) as count FROM ${table}`;
    let params = [];
    let paramIndex = 1;

    if (conditions.length > 0) {
      const whereClause = conditions
        .map(([column, operator]) => `${column} $${paramIndex++}`)
        .join(' AND ');
      
      query += ` WHERE ${whereClause}`;
      params = conditions.map(([, value]) => value);
    }

    const result = await this.execute(query, params);
    return parseInt(result.rows[0].count, 10);
  }

  // Check if record exists
  async exists(table, whereClause, whereParams = []) {
    const query = `SELECT 1 FROM ${table} WHERE ${whereClause} LIMIT 1`;
    const result = await this.execute(query, whereParams);
    return result.rows.length > 0;
  }

  // Wait for database to be ready
  async waitForConnection(maxAttempts = 30, delay = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.execute('SELECT 1');
        console.log(`✅ Test database ready after ${attempt} attempts`);
        return;
      } catch (error) {
        console.log(`⏳ Waiting for database... (attempt ${attempt}/${maxAttempts})`);
        if (attempt === maxAttempts) {
          throw new Error('Database connection timeout');
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Create test user
  async createTestUser(overrides = {}) {
    const userData = {
      email: overrides.email || `test-${Date.now()}@example.com`,
      password: overrides.password || '$2b$10$test.hash.for.password.testing',
      role: overrides.role || 'user',
      isActive: overrides.isActive !== undefined ? overrides.isActive : true,
    };

    return await this.insert('users', userData);
  }

  // Create test social link
  async createTestSocialLink(overrides = {}) {
    const linkData = {
      platform: overrides.platform || 'facebook',
      url: overrides.url || `https://facebook.com/test-${Date.now()}`,
      displayName: overrides.displayName || 'Test Facebook Page',
      icon: overrides.icon || 'logo-facebook',
      isActive: overrides.isActive !== undefined ? overrides.isActive : true,
      order: overrides.order || 1,
    };

    return await this.insert('social_links', linkData);
  }

  // Create test ad banner
  async createTestAdBanner(overrides = {}) {
    const bannerData = {
      title: overrides.title || `Test Banner ${Date.now()}`,
      imageUrl: overrides.imageUrl || 'https://example.com/banner.jpg',
      cloudinaryPublicId: overrides.cloudinaryPublicId || `test-banner-${Date.now()}`,
      targetUrl: overrides.targetUrl || 'https://example.com',
      description: overrides.description || 'Test ad banner description',
      isActive: overrides.isActive !== undefined ? overrides.isActive : true,
      startDate: overrides.startDate || new Date(),
      endDate: overrides.endDate || new Date(Date.now() + 86400000),
      clickCount: overrides.clickCount || 0,
      impressionCount: overrides.impressionCount || 0,
      priority: overrides.priority || 1,
    };

    return await this.insert('ad_banners', bannerData);
  }

  // Ensure database is initialized
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  // Close database connection
  async close() {
    if (this.client) {
      this.client.release();
      this.client = null;
    }
    
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    
    this.db = null;
    this.isInitialized = false;
  }

  // Get database health status
  async getHealthStatus() {
    try {
      const start = Date.now();
      const result = await this.execute('SELECT NOW() as now, version() as version');
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        responseTime,
        timestamp: result.rows[0].now,
        version: result.rows[0].version,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }
}

// Create singleton instance
const testDatabase = new TestDatabase();

module.exports = testDatabase;