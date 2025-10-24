import { pgTable, serial, uuid, varchar, text, integer, boolean, date, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Define enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'moderator']);
export const socialLinkPlatformEnum = pgEnum('social_link_platform', ['facebook', 'twitter', 'instagram', 'youtube', 'website', 'tiktok', 'linkedin']);
export const streamSourceEnum = pgEnum('stream_source', ['radioking', 'manual', 'api']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('admin'),
  isActive: boolean('is_active').notNull().default(true),
  lastLogin: timestamp('last_login', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// Social Links table
export const socialLinks = pgTable('social_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  platform: socialLinkPlatformEnum('platform').notNull().unique(),
  url: varchar('url', { length: 500 }).notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  icon: varchar('icon', { length: 50 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// Ad Banners table
export const adBanners = pgTable('ad_banners', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  imageUrl: varchar('image_url', { length: 500 }).notNull(),
  cloudinaryPublicId: varchar('cloudinary_public_id', { length: 255 }),
  targetUrl: varchar('target_url', { length: 500 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  clickCount: integer('click_count').notNull().default(0),
  impressionCount: integer('impression_count').notNull().default(0),
  priority: integer('priority').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});



// Export all tables for convenience
export const schema = {
  users,
  socialLinks,
  adBanners
};

export default schema;