# Enish Radio Pro - Agent Guidelines

This document provides comprehensive guidelines for AI coding agents working on the Enish Radio Pro project. It covers project overview, build commands, code style standards, and usage notes to ensure consistency across development.

## Project Overview

**Enish Radio Pro** is a cross-platform radio streaming application with a custom backend management system. The project consists of:

- **Mobile App**: Expo/React Native application for Android and iOS
- **Backend API**: Node.js/Express server with PostgreSQL database
- **Admin Panel**: Web-based interface for content management

### Technology Stack

#### Mobile App (Expo/React Native)
- **Core**: React Native 0.74+, Expo SDK 54
- **Navigation**: React Navigation 6.x (Drawer, Stack, Tabs)
- **UI Components**: React Native Elements, NativeBase
- **Audio**: Expo Audio, expo-av
- **State Management**: React Context + Redux Toolkit
- **Storage**: AsyncStorage
- **HTTP Client**: Axios
- **Animations**: React Native Reanimated 3
- **Icons**: @expo/vector-icons, react-native-vector-icons
- **TypeScript**: Strict mode enabled

#### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT + bcryptjs
- **File Storage**: Cloudinary integration
- **Security**: Helmet, CORS, Express Rate Limiting
- **Logging**: Morgan
- **Development**: Nodemon for hot reload

### Project Structure

```
Enish-Radio-Pro/
├── backend/                 # Node.js Express API server
│   ├── drizzle/            # Database schema and models
│   ├── routes/             # API route handlers
│   ├── middleware/         # Authentication and security
│   ├── public/             # Static files and admin panel
│   └── scripts/            # Database utilities
├── mobile-app/             # Expo React Native application
│   ├── app/                # Main application components
│   ├── components/         # Reusable UI components
│   ├── constants/          # App configuration and constants
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API clients and utilities
│   └── assets/             # Images and static assets
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

// 2. External dependencies
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// 3. Internal modules (grouped by directory)
import { testConnection, syncSchema } from './drizzle/db.js';
import UserModel from './drizzle/models/User.js';
import { adminAuth } from './middleware/auth.js';
import socialLinksRoutes from './routes/socialLinks.js';
```

### Type Guidelines

#### Mobile App (TypeScript)
- **Strict Mode**: All TypeScript files must use strict mode
- **Type Imports**: Use type-only imports when possible
- **Component Props**: Always define prop interfaces
- **API Responses**: Create type definitions for all API responses

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
- **Schema Validation**: Use database schema for type validation

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
- **Health Checks**: Implement proper health check endpoints
- **Security Headers**: Configure security headers and CORS properly
- **Rate Limiting**: Adjust rate limits based on expected traffic

### API Integration

#### Base URLs
```typescript
// Mobile app API configuration
export const API_ENDPOINTS = {
  BASE_URL: __DEV__ ? 'http://localhost:3000/api' : 'https://api.enishradio.com/api',
  SOCIAL_LINKS: '/social-links',
  AD_BANNERS: '/ads',
  STREAM_METADATA: '/stream/metadata',
};
```

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

*This document should be updated as the project evolves. All agents working on this codebase should follow these guidelines to maintain consistency and code quality.*