import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from '../drizzle/schema.js';

// Load environment variables
dotenv.config();

async function createSchema() {
  try {
    console.log('🏗️  Creating database schema...');
    
    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Create connection pool
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('sslmode=require') ? {
        require: true,
        rejectUnauthorized: false
      } : false
    });

    // Create Drizzle ORM instance
    const db = drizzle(pool, { schema });

    // Create tables manually since we don't have migrations set up
    console.log('📝 Creating tables...');
    
    // Create enum types first
    console.log('📝 Creating enum types...');
    
    // Create user_role enum if it doesn't exist
    await db.execute(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('admin', 'moderator');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create social_link_platform enum if it doesn't exist
    await db.execute(`
      DO $$ BEGIN
        CREATE TYPE social_link_platform AS ENUM ('facebook', 'twitter', 'instagram', 'youtube', 'website', 'tiktok', 'linkedin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create stream_source enum if it doesn't exist
    await db.execute(`
      DO $$ BEGIN
        CREATE TYPE stream_source AS ENUM ('radioking', 'manual', 'api');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role user_role NOT NULL DEFAULT 'admin',
        is_active BOOLEAN NOT NULL DEFAULT true,
        last_login TIMESTAMPTZ DEFAULT now(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Create social_links table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS social_links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        platform social_link_platform NOT NULL UNIQUE,
        url VARCHAR(500) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        icon VARCHAR(50) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        "order" INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Create ad_banners table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ad_banners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        cloudinary_public_id VARCHAR(255),
        target_url VARCHAR(500) NOT NULL,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        start_date TIMESTAMPTZ NOT NULL,
        end_date TIMESTAMPTZ NOT NULL,
        click_count INTEGER NOT NULL DEFAULT 0,
        impression_count INTEGER NOT NULL DEFAULT 0,
        priority INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Create stream_metadata table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS stream_metadata (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NOT NULL,
        album VARCHAR(255),
        artwork_url VARCHAR(500),
        duration INTEGER,
        genre VARCHAR(100),
        year INTEGER,
        is_live BOOLEAN NOT NULL DEFAULT true,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ,
        source stream_source NOT NULL DEFAULT 'radioking',
        stream_url VARCHAR(500),
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    console.log('✅ All tables created successfully!');
    
    // Close the connection
    await pool.end();
    console.log('🎉 Database schema creation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating schema:', error);
    process.exit(1);
  }
}

// Run the schema creation function
createSchema();