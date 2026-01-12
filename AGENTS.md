# Enish Radio Pro - Agent Guidelines

This document provides comprehensive guidelines for AI coding agents working on the Enish Radio Pro project. It covers project overview, build commands, code style standards, and usage notes to ensure consistency across development.

## Project Overview

**Enish Radio Pro** is a cross-platform radio streaming application with a custom backend management system. The project consists of:

- **Mobile App**: Expo/React Native application for Android and iOS
- **Backend API**: Node.js/Hono server with PostgreSQL database
- **Admin Panel**: Web-based interface for content management

### Technology Stack

#### Mobile App (Expo/React Native)
- **Core**: React Native 0.81.5, Expo SDK 54
- **Navigation**: React Navigation 7.x (Drawer, Stack, Tabs)
- **UI Components**: React Native Elements, React Native Reanimated
- **Audio**: Expo Audio 1.0.13, expo-av 16.0.7
- **State Management**: React Context + Custom Hooks
- **Storage**: AsyncStorage 2.2.0
- **HTTP Client**: Axios 1.12.2
- **Animations**: React Native Reanimated 4.1.1
- **Icons**: @expo/vector-icons 15.0.3, react-native-vector-icons 10.3.0
- **TypeScript**: Strict mode enabled (TypeScript 5.9.2)
- **Router**: Expo Router 6.0.13
- **Build System**: EAS CLI 16.24.1

#### Backend
- **Runtime**: Node.js 20+
- **Framework**: Hono 4.6.8 (Node runtime)
- **Database**: PostgreSQL with Drizzle ORM 0.44.7
- **Authentication**: JWT + bcryptjs 3.0.2
- **File Storage**: Cloudinary 2.8.0 integration
- **Security**: Secure Headers (hono/secure-headers), CORS, Rate Limiting
- **Logging**: Hono logger
- **Development**: Nodemon 3.1.10 for hot reload
- **Server**: @hono/node-server 1.13.0

### Project Structure

```
Enish-Radio-Pro/
├── backend/                 # Node.js Hono API server
│   ├── drizzle/            # Database schema and models
│   │   ├── schema.js        # Drizzle ORM table definitions
│   │   ├── db.js           # Database connection and pool
│   │   └── models/         # Data models (User, SocialLink, AdBanner)
│   ├── routes/             # API route handlers (legacy)
│   ├── middleware/         # Authentication and security
│   ├── public/             # Static files and admin panel
│   │   └── admin/          # Admin dashboard HTML/CSS/JS
│   ├── scripts/            # Database utilities
│   │   ├── createSchema.js # Database schema creation
│   │   ├── seedDatabase.js # Test data seeding
│   │   └── seedAdmin.js    # Admin user creation
│   ├── server.hono.js      # Main Hono server (current)
│   ├── server.js           # Legacy Express server
│   └── test-admin-interface.js # Admin interface testing
├── mobile-app/             # Expo React Native application
│   ├── app/                # Main application components (Expo Router)
│   │   ├── _layout.tsx     # Root layout with navigation
│   │   ├── index.tsx       # Home screen with audio player
│   │   ├── settings.tsx    # Settings screen
│   │   ├── sleep-timer.tsx # Sleep timer functionality
│   │   ├── about.tsx       # About screen
│   │   └── privacy.tsx     # Privacy policy screen
│   ├── components/         # Reusable UI components
│   ├── constants/          # App configuration and constants
│   │   ├── env.ts          # Environment configuration
│   │   ├── env.development.ts # Development API URLs
│   │   └── env.production.ts  # Production API URLs
│   ├── hooks/              # Custom React hooks
│   │   └── useAudioPlayer.ts # Audio player state management
│   ├── contexts/           # React contexts
│   │   └── AudioPlayerContext.tsx # Audio player context
│   ├── services/           # API clients and utilities
│   ├── assets/             # Images and static assets
│   └── app.json            # Expo app configuration
└── AGENTS.md              # This guidelines document
```

## Build and Test Commands

### Mobile App Commands

#### Development
```bash
# Install dependencies
npm install

# Start development server
npm start                    # Expo development server
npm run android           # Start on Android device/emulator
npm run ios               # Start on iOS simulator/device
npm run web               # Start web version

# Reset project (moves starter code to app-example)
npm run reset-project
```

#### Testing
```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate test coverage report
npm run test:coverage
```

#### Building and Deployment
```bash
# Development build
npm run build:dev

# Preview build
npm run build:preview

# Production build
npm run build:prod

# Submit to app stores
npm run submit:android    # Submit to Google Play
npm run submit:ios        # Submit to App Store
```

#### Linting
```bash
# Run ESLint
npm run lint
```

### Backend Commands

#### Development
```bash
# Install dependencies
npm install

# Start development server (with nodemon)
npm run dev

# Start production server
npm start
```

#### Database Management
```bash
# Create database schema
npm run create-schema

# Seed database with test data
npm run seed

# Seed admin user
node scripts/seedAdmin.js
```

#### Testing
```bash
# Run admin interface tests
npm run test:admin

# Run admin interface tests with CI variables
npm run test:admin:ci
```

#### Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Required variables:
# - DATABASE_URL: PostgreSQL connection string
# - JWT_SECRET: JWT signing secret
# - CLOUDINARY_*: Cloudinary credentials
# - PORT: Server port (default: 3000)
```

## Code Style Guidelines

### Import Formatting

#### Mobile App (TypeScript/React)
```typescript
// 1. External libraries first
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// 2. Expo libraries
import { Image } from 'expo-image';
import { useColorScheme } from '@/hooks/use-color-scheme';

// 3. Internal modules (grouped by type)
import { COLORS, API_ENDPOINTS } from '@/constants/radio';
import { ThemedView } from '@/components/themed-view';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

// 4. Assets
import { ImageAssets } from '@/assets/images';
```

#### Backend (JavaScript/Node.js)
```javascript
// 1. Standard library imports
import path from 'path';
import { fileURLToPath } from 'url';

// 2. External dependencies (Hono)
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { cors } from 'hono/cors';

// 3. Internal modules (grouped by directory)
import { testConnection, syncSchema } from './drizzle/db.js';
import UserModel from './drizzle/models/User.js';
// Hono routes are defined in `server.hono.js`
```

### Type Guidelines

#### Mobile App (TypeScript)
- **Strict Mode**: All TypeScript files must use strict mode (configured in tsconfig.json)
- **Type Imports**: Use type-only imports when possible
- **Component Props**: Always define prop interfaces
- **API Responses**: Create type definitions for all API responses
- **Environment Config**: Use TypeScript-based environment configuration (no .env files)
- **Path Aliases**: Use `@/*` path alias for imports from project root

```typescript
// Good: Type-only import
import type { PropsWithChildren } from 'react';

// Good: Component props interface
interface AudioPlayerProps {
  streamUrl: string;
  onPlay: () => void;
  onPause: () => void;
}

// Good: API response type
interface SocialLink {
  id: string;
  platform: 'facebook' | 'twitter' | 'instagram' | 'youtube' | 'website';
  url: string;
  displayName: string;
  icon: string;
  active: boolean;
  order: number;
}
```

#### Backend (JavaScript with JSDoc)
- **JSDoc Comments**: Use JSDoc for function parameters and return types
- **Type Checking**: Enable TypeScript checking in VS Code for JavaScript files
- **Schema Validation**: Use Drizzle ORM schema for type validation
- **Database Models**: Use Drizzle ORM model classes for data access
- **Error Handling**: Standardized error response format with consistent JSON shape

```javascript
/**
 * Create a new social link
 * @param {Object} socialLinkData - Social link data
 * @param {string} socialLinkData.platform - Platform name
 * @param {string} socialLinkData.url - Valid URL
 * @param {string} socialLinkData.displayName - Display name
 * @param {string} socialLinkData.icon - Icon identifier
 * @returns {Promise<Object>} Created social link
 */
async function createSocialLink(socialLinkData) {
  // Implementation
}
```

### Naming Conventions

#### General Rules
- **Camel Case**: Use camelCase for variables, functions, and methods
- **Pascal Case**: Use PascalCase for React components and classes
- **Constants**: Use UPPER_SNAKE_CASE for constants
- **Files**: Use kebab-case for file names

#### Mobile App
```typescript
// Components: PascalCase
const AudioPlayer = () => { ... };
const SocialLinkItem = () => { ... };

// Variables: camelCase
const currentTrack = null;
const isPlaying = false;

// Constants: UPPER_SNAKE_CASE
const MAX_BUFFER_SIZE = 12000;
const RECONNECT_DELAY = 2000;

// Files: kebab-case
// components/audio-player.tsx
// hooks/use-audio-player.ts
// constants/radio.ts
```

#### Backend
```javascript
// Models: PascalCase
class UserModel { ... }
class SocialLinkModel { ... }

// Routes: camelCase
const socialLinksRoutes = express.Router();

// Variables: camelCase
const dbConnection = null;
const isHealthy = true;

// Constants: UPPER_SNAKE_CASE
const JWT_SECRET = process.env.JWT_SECRET;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
```

### Error Handling

#### Mobile App
- **Try-Catch Blocks**: Use try-catch for async operations
- **Error Boundaries**: Implement error boundaries for critical components
- **User Feedback**: Show user-friendly error messages
- **Logging**: Log errors to console in development

```typescript
// Good: Comprehensive error handling
const loadSocialLinks = async () => {
  try {
    const response = await api.get('/social-links');
    setSocialLinks(response.data);
  } catch (error) {
    console.error('Error loading social links:', error);
    Alert.alert('Error', 'Failed to load social links. Please try again.');
  }
};

// Good: Custom error types
class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NetworkError';
  }
}
```

#### Backend
- **Consistent Error Format**: Use standardized error response format
- **HTTP Status Codes**: Use appropriate HTTP status codes
- **Error Logging**: Log all errors with context
- **Graceful Degradation**: Handle database and external service failures

```javascript
// Good: Standardized error response
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

// Good: Database error handling
try {
  const result = await UserModel.create(userData);
  res.status(201).json(result);
} catch (error) {
  console.error('Error creating user:', error);
  if (error.code === '23505') { // PostgreSQL unique constraint violation
    return res.status(409).json({ error: 'User already exists' });
  }
  res.status(500).json({ error: 'Failed to create user' });
}
```

#### Error Response Format
Both frontend and backend should use consistent error response formats:

```json
{
  "error": "User-friendly error message",
  "code": "ERROR_CODE",
  "details": "Additional error details (development only)"
}
```

## Usage Notes

### Development Workflow

1. **Environment Setup**
   - Set up both mobile app and backend development environments
   - Configure environment variables for local development
   - Ensure PostgreSQL is running for backend development

2. **Code Changes**
   - Follow the established import and naming conventions
   - Write tests for new features
   - Update documentation when making significant changes
   - Use feature branches for development

3. **Testing**
   - Run linting before committing code
   - Test both mobile app and backend changes
   - Verify admin panel functionality
   - Test on multiple device sizes and orientations

### Deployment Considerations

#### Mobile App Deployment
- **Environment Variables**: Use different API endpoints for development and production
- **App Store Guidelines**: Follow Apple App Store and Google Play guidelines
- **Over-the-Air Updates**: Expo allows OTA updates without app store review
- **Build Profiles**: Use different build profiles for development, preview, and production

#### Backend Deployment
- **Environment Variables**: Never commit sensitive data to version control
- **Database Migrations**: Test migrations in staging before production
- **Health Checks**: Implement proper health check endpoints (available at `/api/health`)
- **Security Headers**: Configure security headers and CORS properly
- **Rate Limiting**: Adjust rate limits based on expected traffic (currently 100 req/15min per IP)
- **Database Schema**: Uses Drizzle ORM with PostgreSQL enums for type safety

### Database Schema

The application uses **Drizzle ORM** with PostgreSQL and defines the following tables:

#### Core Tables

**Users Table** (`users`)
- `id` (UUID, Primary Key): Unique user identifier
- `email` (VARCHAR): User email (unique)
- `password` (VARCHAR): Hashed password
- `role` (ENUM): User role ('admin', 'moderator')
- `isActive` (BOOLEAN): Account status
- `lastLogin` (TIMESTAMP): Last login timestamp
- `createdAt`, `updatedAt` (TIMESTAMP): Audit timestamps

**Social Links Table** (`socialLinks`)
- `id` (UUID, Primary Key): Unique link identifier
- `platform` (ENUM): Social platform ('facebook', 'twitter', 'instagram', 'youtube', 'website', 'tiktok', 'linkedin')
- `url` (VARCHAR): Social media URL
- `displayName` (VARCHAR): Display name for the link
- `icon` (VARCHAR): Icon identifier
- `isActive` (BOOLEAN): Link visibility status
- `order` (INTEGER): Display order
- `createdAt`, `updatedAt` (TIMESTAMP): Audit timestamps

**Ad Banners Table** (`adBanners`)
- `id` (UUID, Primary Key): Unique banner identifier
- `title` (VARCHAR): Banner title
- `imageUrl` (VARCHAR): Cloudinary image URL
- `cloudinaryPublicId` (VARCHAR): Cloudinary public ID for deletion
- `targetUrl` (VARCHAR): Click-through URL
- `description` (TEXT): Optional description
- `isActive` (BOOLEAN): Banner visibility status
- `startDate`, `endDate` (TIMESTAMP): Campaign duration
- `clickCount`, `impressionCount` (INTEGER): Analytics counters
- `priority` (INTEGER): Display priority
- `createdAt`, `updatedAt` (TIMESTAMP): Audit timestamps

#### Key Features
- **PostgreSQL Enums**: Used for `user_role`, `social_link_platform`, and `stream_source` for type safety
- **UUID Primary Keys**: All tables use UUID primary keys with `defaultRandom()`
- **Timestamps**: All tables include `createdAt` and `updatedAt` audit fields
- **Soft Deletes**: Uses `isActive` boolean flags for soft deletion
- **Unique Constraints**: Email uniqueness for users, platform uniqueness for social links

### API Integration

#### Base URLs and Environment Configuration

The mobile app uses a TypeScript-based environment configuration system that automatically selects the correct API endpoint based on the build mode:

```typescript
// Mobile app environment configuration
// Located in: mobile-app/constants/env.ts

// Development (npm start, npm run android/ios)
- Uses: mobile-app/constants/env.development.ts
- API URL: http://192.168.1.80:3000/api (local network IP)
- Debug mode: ON
- Analytics: OFF

// Production (EAS builds, npm run build:prod)
- Uses: mobile-app/constants/env.production.ts
- API URL: https://api.enishradio.com/api
- API URL: https://enish-radio-api.toovy.tech/api
- Analytics: ON
```

**Important**: For local development, update `env.development.ts` with your computer's network IP address:

```bash
# Find your IP address
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
```

Then update `mobile-app/constants/env.development.ts`:
```typescript
export const DEVELOPMENT_API_URL = 'http://YOUR_IP_ADDRESS:3000/api';
```

**Note**: Do not use `.env` files for React Native/Expo apps. The TypeScript-based configuration works natively without extra dependencies and provides type safety.

#### Backend API Structure

The backend uses Hono framework with the following API structure:

```
/api/
├── health              # Health check endpoint
├── auth/               # Authentication routes
│   ├── login          # User login
│   ├── register       # User registration (admin only)
│   ├── verify         # Token verification
│   ├── refresh        # Token refresh
│   └── users          # User management (admin only)
├── social-links/       # Social media links management
│   ├── active         # Public active social links
│   └── admin          # Admin management routes
├── ads/               # Advertisement banner management
│   ├── admin          # Admin management routes
│   └── :id/click      # Click tracking
└── analytics/         # Analytics and reporting
    ├── overview       # Dashboard overview data
    └── ad-clicks      # Ad click analytics
```

**Key Features**:
- JWT-based authentication with role-based access control
- Rate limiting (100 requests per 15-minute window per IP)
- Cloudinary integration for image uploads
- Comprehensive error handling with standardized JSON responses
- Admin dashboard at `/admin/` for content management

#### Authentication
- **JWT Tokens**: Backend uses JWT for authentication
- **Admin Access**: Admin panel requires authentication
- **Token Refresh**: Implement token refresh logic in mobile app
- **Error Handling**: Handle 401/403 responses appropriately

### Performance Considerations

#### Mobile App
- **Image Optimization**: Use Expo Image with proper sizing
- **Audio Buffering**: Implement efficient audio buffering
- **Memory Management**: Clean up audio resources properly
- **Network Requests**: Cache API responses when appropriate

#### Backend
- **Database Indexing**: Ensure proper database indexing
- **Rate Limiting**: Implement rate limiting for API endpoints
- **File Uploads**: Use Cloudinary for image storage and optimization
- **Caching**: Consider Redis caching for frequently accessed data

### Security Guidelines

#### Mobile App
- **HTTPS Only**: Use HTTPS for all API communications
- **Input Validation**: Validate all user inputs
- **Secure Storage**: Use secure storage for sensitive data
- **Code Obfuscation**: Consider code obfuscation for production builds

#### Backend
- **Input Sanitization**: Sanitize all incoming data
- **Password Security**: Use bcrypt with appropriate salt rounds
- **JWT Security**: Use secure JWT signing and proper expiration
- **CORS Configuration**: Configure CORS for specific origins only
- **Rate Limiting**: Implement rate limiting to prevent abuse

### Monitoring and Logging

#### Mobile App
- **Error Tracking**: Implement error tracking (e.g., Sentry)
- **Analytics**: Track user interactions and app performance
- **Crash Reporting**: Set up crash reporting for production
- **Performance Monitoring**: Monitor app startup and audio performance

#### Backend
- **Application Logging**: Use structured logging with appropriate levels
- **Database Monitoring**: Monitor database performance and connections
- **Health Checks**: Implement comprehensive health check endpoints
- **Security Monitoring**: Monitor for suspicious activity and failed login attempts

---

## Recent Updates (December 24, 2025)

### Backend Code Review & Optimization Complete

A comprehensive code review was conducted on the backend with the following results:

#### Dependencies Updated to Latest Versions
All backend dependencies have been updated to their latest versions:
- **Hono**: 4.6.8 → 4.11.1
- **Drizzle ORM**: 0.44.7 → 0.45.1
- **@hono/node-server**: 1.13.0 → 1.19.7
- **rate-limiter-flexible**: 2.4.2 → 9.0.1 (major version)
- **zod**: 3.22.4 → 4.2.1 (major version)
- **axios**: 1.7.2 → 1.13.2
- **winston**: 3.11.0 → 3.19.0
- **jsonwebtoken**: 9.0.2 → 9.0.3
- **bcryptjs**: 3.0.2 → 3.0.3
- **nodemon**: 3.1.10 → 3.1.11
- **hono-rate-limiter**: 0.3.0 → 0.5.1

#### Critical Issues Fixed

1. **JWT Secret Validation** (Security - HIGH)
   - Enforces `JWT_SECRET` environment variable at startup
   - Server will not run without it (prevents production vulnerabilities)
   - All hardcoded secret fallbacks removed

2. **User Count Query Bug** (Data Integrity - HIGH)
   - Fixed `countByRole()` method in User model
   - Now uses proper SQL COUNT aggregation instead of result.length
   - Enables correct admin deletion validation

3. **Rate Limiting Memory Leak** (Performance - MEDIUM)
   - Added automatic cleanup of rate limit entries every 5 minutes
   - Capped tracked IPs at 10,000 to prevent memory exhaustion
   - Prevents unbounded growth in high-traffic scenarios

#### Additional Improvements

4. **Input Validation Framework** (Data Integrity - MEDIUM)
   - New `utils/validation.js` module with reusable validators
   - Functions: `isValidEmail()`, `isValidUrl()`, `isValidDateRange()`
   - Applied to all authentication and content creation endpoints

5. **Cloudinary Image Cleanup** (Data Management - MEDIUM)
   - Ads now properly delete associated images from Cloudinary
   - Prevents orphaned images and storage waste

6. **CORS Configuration** (Security - MEDIUM)
   - CORS origins now configurable via `CORS_ORIGINS` environment variable
   - Supports different origins per environment (dev vs production)

7. **Environment Variable Validation** (Reliability - MEDIUM)
   - Validates all required environment variables at startup
   - Provides clear error messages if variables are missing
   - Gracefully exits with informative feedback

8. **Impression Tracking Endpoint** (Feature - LOW)
   - Added `POST /api/ads/:id/impression` endpoint
   - Complements existing click tracking for analytics

#### New Files Created

- `backend/utils/validation.js` - Centralized input validation utilities
- `backend/REVIEW_FINDINGS.md` - Detailed findings for all 15 issues identified
- `backend/CODE_REVIEW_FIXES_SUMMARY.md` - Implementation details of each fix
- `backend/DEPLOYMENT_CHECKLIST.md` - Pre-deployment verification checklist
- `backend/REVIEW_INDEX.md` - Complete index of review documentation

#### Issues Identified for Future Work

- Race condition in admin deletion (requires database transactions)
- SQL injection vulnerability in MenuItem.js (requires Drizzle DDL migration)
- No pagination on list endpoints (scalability concern)
- JWT token refresh age limit (security enhancement)

#### Important Notes for Agents

1. **Environment Variables**: The backend now requires `JWT_SECRET` to be set. Update your local `.env` file:
   ```bash
   JWT_SECRET=your-development-secret-key
   ```

2. **Validation**: All user inputs (email, URLs, dates) are now validated. Ensure your integration tests account for validation error responses (400 status).

3. **Dependency Updates**: Two major version updates were applied:
   - `rate-limiter-flexible` 9.0.1 - Check breaking changes if directly using this library
   - `zod` 4.2.1 - Prepare for Zod schema updates in future work

4. **New Utilities**: Use `utils/validation.js` functions for any new input validation needs rather than creating custom validators.

5. **Documentation**: Review `backend/CODE_REVIEW_FIXES_SUMMARY.md` before making changes to authentication or data handling logic.

#### Testing Status

✅ Server runs successfully with all fixes applied  
✅ Database connection verified  
✅ Health check endpoint responds correctly  
✅ All critical authentication flows working  
✅ No regressions in existing functionality  

---

*This document should be updated as the project evolves. All agents working on this codebase should follow these guidelines to maintain consistency and code quality.*