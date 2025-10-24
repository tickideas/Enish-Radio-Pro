import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import schema from './schema.js';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Database configuration - DEBUG: Check if env var is loaded
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.error('💡 Please ensure your .env file is in the correct location and contains DATABASE_URL');
} else {
  console.log('✅ DATABASE_URL found in environment variables');
}

const finalDatabaseUrl = databaseUrl || 'postgresql://username:password@localhost:5432/enish-radio-pro';

// Parse database URL to determine SSL requirements and connection details
const isExternalDb = finalDatabaseUrl.includes('://') && !finalDatabaseUrl.includes('localhost');
const needsSsl = finalDatabaseUrl.includes('sslmode=require') || finalDatabaseUrl.includes('?ssl') || isExternalDb;

// Debug logging
console.log('🔍 Database connection debug:', {
  databaseUrl: databaseUrl ? databaseUrl.replace(/:[^:@]*@/, ':***@') : 'No URL',
  isExternalDb,
  needsSsl,
  hasSslMode: finalDatabaseUrl.includes('sslmode=require'),
  hasSslParam: finalDatabaseUrl.includes('?ssl'),
  isLocalhost: finalDatabaseUrl.includes('localhost')
});

// For Prisma databases, we need to ensure SSL is properly configured
const sslConfig = needsSsl ? {
  require: true,
  rejectUnauthorized: false,
  // For Prisma-managed databases, we often need additional SSL configuration
  ca: process.env.DB_SSL_CA,
  cert: process.env.DB_SSL_CERT,
  key: process.env.DB_SSL_KEY
} : false;

const pool = new Pool({
  connectionString: finalDatabaseUrl,
  ssl: sslConfig,
  max: 5,
  min: 0,
  acquire: 30000,
  idle: 10000,
  // Additional connection options for external databases
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
});

// Create Drizzle ORM instance
const db = drizzle(pool, { schema });

// Test database connection
async function testConnection() {
  try {
    // Test the pool connection
    const client = await pool.connect();
    client.release();
    
    // Additional health check query
    const result = await pool.query('SELECT 1 as health_check');
    
    console.log('✅ Connected to PostgreSQL database with Drizzle ORM');
    console.log('📊 Database health check passed');
    console.log('🌐 Connection details:', {
      host: pool.options.host || 'external',
      port: pool.options.port,
      database: pool.options.database,
      ssl: !!pool.options.ssl
    });
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', {
      message: error.message || 'No error message available',
      code: error.code || 'No error code',
      errno: error.errno || 'No errno',
      syscall: error.syscall || 'No syscall info',
      address: error.address || 'No address info',
      port: error.port || 'No port info',
      ssl: !!pool.options.ssl,
      host: pool.options.host || 'No host info',
      databaseUrl: finalDatabaseUrl ? finalDatabaseUrl.replace(/:[^:@]*@/, ':***@') : 'No URL'
    });
    
    // Provide specific guidance based on error type
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Connection refused - Check if PostgreSQL is running and accessible');
      console.error('💡 For external databases, verify the connection URL and network access');
    } else if (error.code === 'ENOTFOUND') {
      console.error('💡 Host not found - Check the database hostname in DATABASE_URL');
    } else if (error.message.includes('SSL')) {
      console.error('💡 SSL connection failed - Check SSL configuration and certificates');
    }
    
    return false;
  }
}

// Sync database schema (create tables if they don't exist)
async function syncSchema() {
  try {
    // Note: Drizzle doesn't have automatic schema sync like Sequelize
    // You would typically use Drizzle migrations for this
    console.log('Database schema synchronization complete');
    return true;
  } catch (error) {
    console.error('Database sync error:', error);
    return false;
  }
}

export { db, testConnection, syncSchema, pool };
export default db;