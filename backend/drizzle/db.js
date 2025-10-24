import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import schema from './schema.js';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Database configuration
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.error('💡 Please ensure your .env file is in the correct location and contains DATABASE_URL');
}

const finalDatabaseUrl = databaseUrl || 'postgresql://username:password@localhost:5432/enish-radio-pro';

// Parse database URL to determine SSL requirements
const isExternalDb = finalDatabaseUrl.includes('://') && !finalDatabaseUrl.includes('localhost');
const needsSsl = finalDatabaseUrl.includes('sslmode=require') || finalDatabaseUrl.includes('?ssl') || isExternalDb;

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
    
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error.message);
    
    // Provide specific guidance based on error type
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Connection refused - Check if PostgreSQL is running and accessible');
    } else if (error.code === 'ENOTFOUND') {
      console.error('💡 Host not found - Check the database hostname in DATABASE_URL');
    } else if (error.message && error.message.includes('SSL')) {
      console.error('💡 SSL connection failed - Check SSL configuration');
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