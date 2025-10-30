# EAS Build Guide for Enish Radio Pro

This guide provides comprehensive instructions for building and deploying the Enish Radio Pro mobile application using Expo Application Services (EAS).

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Configuration](#project-configuration)
- [Build Profiles](#build-profiles)
- [Building Your App](#building-your-app)
- [Submitting to App Stores](#submitting-to-app-stores)
- [Environment Configuration](#environment-configuration)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Prerequisites

Before building your app with EAS, ensure you have:

### Required Accounts
- **Expo Account**: Sign up at [expo.dev](https://expo.dev)
- **Apple Developer Account** (for iOS builds): $99/year
- **Google Play Developer Account** (for Android builds): $25 one-time fee

### Development Environment
- **Node.js**: Version 18 or higher
- **npm** or **yarn**
- **Expo CLI**: Install globally with `npm install -g @expo/cli`
- **EAS CLI**: Install globally with `npm install -g eas-cli`

### System Requirements
- **macOS** (required for iOS builds)
- **Xcode** (latest version for iOS builds)
- **Android Studio** (for Android builds, optional but recommended)

## Project Configuration

Your project is already configured with EAS. Here's what you need to know:

### EAS Project Information
- **Project Name**: @0xanyi/EnishRadioPro
- **Project ID**: 3d299592-ccc7-4109-a784-4ca494d8efc0
- **App Bundle ID**: com.enishradio.pro

### Configuration Files

#### eas.json
```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "track": "production",
        "releaseStatus": "draft"
      }
    }
  }
}
```

#### app.json Key Settings
- **Bundle Identifier**: `com.enishradio.pro`
- **Version**: 1.0.0
- **Orientation**: Portrait
- **Audio Permissions**: Configured for background audio playback

## Build Profiles

### Development Profile
- **Purpose**: Testing with Expo Go
- **Distribution**: Internal (not for app stores)
- **Features**: Development client enabled
- **Use Case**: Local development and testing

### Preview Profile
- **Purpose**: Internal distribution and testing
- **Distribution**: Internal (shareable APKs/IPAs)
- **Features**: Production build without store submission
- **Use Case**: Beta testing, client reviews

### Production Profile
- **Purpose**: App store submission
- **Distribution**: App stores (Google Play, App Store)
- **Features**: Optimized for store requirements
- **Use Case**: Final releases

## Building Your App

### Initial Setup

1. **Navigate to mobile app directory**:
   ```bash
   cd mobile-app
   ```

2. **Login to Expo**:
   ```bash
   npx eas login
   ```

3. **Verify project configuration**:
   ```bash
   npx eas project:info
   ```

### Development Build

For testing with Expo Go:

```bash
# Build for both platforms
npm run build:dev

# Or build for specific platforms
npx eas build --profile development --platform android
npx eas build --profile development --platform ios
```

### Preview Build

For internal distribution:

```bash
# Build for both platforms
npm run build:preview

# Or build for specific platforms
npx eas build --profile preview --platform android
npx eas build --profile preview --platform ios
```

### Production Build

For app store submission:

```bash
# Build for both platforms
npm run build:prod

# Or build for specific platforms
npx eas build --profile production --platform android
npx eas build --profile production --platform ios
```

### Build Monitoring

Monitor your builds in real-time:

```bash
# View build status
npx eas build:list

# View specific build details
npx eas build:view <build-id>
```

## Submitting to App Stores

### Android (Google Play)

1. **Build production APK**:
   ```bash
   npx eas build --profile production --platform android
   ```

2. **Submit to Google Play**:
   ```bash
   npm run submit:android
   ```

3. **Or submit manually**:
   ```bash
   npx eas submit --platform android --profile production
   ```

### iOS (App Store)

1. **Build production IPA**:
   ```bash
   npx eas build --profile production --platform ios
   ```

2. **Submit to App Store**:
   ```bash
   npm run submit:ios
   ```

3. **Or submit manually**:
   ```bash
   npx eas submit --platform ios --profile production
   ```

## Environment Configuration

### API Endpoints

The app uses different API endpoints based on build type:

- **Development**: `http://192.168.1.80:3000/api` (local network)
- **Production**: `https://api.enishradio.com/api`

### Environment Variables

Update these files for different environments:

- `constants/env.development.ts` - Development settings
- `constants/env.production.ts` - Production settings

### Network Configuration

For local development, update the IP address in `env.development.ts`:

```bash
# Find your IP address
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
```

## Troubleshooting

### Common Issues

#### Build Failures

1. **Check build logs**:
   ```bash
   npx eas build:view <build-id>
   ```

2. **Clear build cache**:
   ```bash
   npx eas build --clear-cache
   ```

3. **Update dependencies**:
   ```bash
   npm install
   ```

#### iOS Build Issues

1. **Certificate problems**: Ensure your Apple Developer account has valid certificates
2. **Provisioning profile**: Check that bundle identifier matches your app
3. **Xcode version**: Ensure you're using a compatible Xcode version

#### Android Build Issues

1. **Keystore**: EAS manages this automatically for production builds
2. **Permissions**: Verify all required permissions are declared
3. **Build type**: Use APK for testing, AAB for production

### Network Issues

1. **API connectivity**: Verify backend is running and accessible
2. **CORS**: Ensure backend allows requests from your app
3. **SSL certificates**: Production builds require HTTPS

### Performance Issues

1. **Bundle size**: Monitor and optimize app size
2. **Image optimization**: Use Expo Image for better performance
3. **Audio streaming**: Test audio playback on various networks

## Best Practices

### Version Management

1. **Semantic versioning**: Use MAJOR.MINOR.PATCH format
2. **Version bumps**: Update version in `app.json` for each release
3. **Build numbers**: EAS manages build numbers automatically

### Testing

1. **Pre-build testing**: Run full test suite before building
2. **Device testing**: Test on physical devices, not just simulators
3. **Network testing**: Test on various network conditions

### Security

1. **Environment variables**: Never commit secrets to version control
2. **API keys**: Use secure key management
3. **Code signing**: EAS handles this automatically

### Performance

1. **Optimize images**: Use appropriate sizes and formats
2. **Minimize bundle size**: Remove unused dependencies
3. **Lazy loading**: Implement for large components

### Deployment Workflow

1. **Development → Preview → Production**
2. **Test each stage thoroughly**
3. **Keep deployment history**
4. **Document release notes**

## Quick Reference

### Most Common Commands

```bash
# Development
npm run build:dev          # Build development version
npm start                  # Start Expo dev server

# Preview
npm run build:preview      # Build preview version

# Production
npm run build:prod         # Build production version
npm run submit:android     # Submit Android to Play Store
npm run submit:ios         # Submit iOS to App Store

# Monitoring
npx eas build:list         # List all builds
npx eas project:info       # Show project info
```

### Build Times

- **Development builds**: 5-15 minutes
- **Preview builds**: 10-25 minutes
- **Production builds**: 15-40 minutes

### File Locations

- **Build artifacts**: Available in EAS dashboard
- **Configuration**: `eas.json`, `app.json`
- **Environment**: `constants/env.*.ts`
- **Assets**: `assets/images/`

---

For additional help, visit the [Expo EAS documentation](https://docs.expo.dev/build/introduction/) or check the [Enish Radio Pro project documentation](./README.md).