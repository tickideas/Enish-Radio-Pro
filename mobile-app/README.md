# Enish Radio Pro - Mobile Application

A sophisticated cross-platform radio streaming application built with React Native and Expo. This app provides a premium radio listening experience with advanced features including live streaming, sleep timer, and a comprehensive admin panel for content management.

## 🎵 Features

### Core Radio Features
- **Live Radio Streaming**: High-quality 24/7 music streaming with automatic reconnection
- **Audio Player**: Advanced audio controls with play/pause, volume control, and visualizer
- **Sleep Timer**: Set automatic shutdown timer for uninterrupted listening
- **Track Information**: Real-time display of current track metadata
- **Offline Functionality**: Caching and offline data availability

### Admin Panel Features
- **Dashboard**: Comprehensive statistics and real-time data overview
- **Social Links Management**: Full CRUD interface for social media links with drag-and-drop reordering
- **Ad Campaign Management**: Create and manage ad banners with image upload and performance tracking
- **Analytics Dashboard**: Listener statistics, geographic distribution, and ad performance metrics
- **User Management**: Role-based access control with admin/moderator roles

### Technical Features
- **TypeScript**: Full TypeScript support for type safety
- **Expo Router**: Modern file-based routing system
- **React Navigation**: Drawer and tab navigation
- **Performance Monitoring**: Memory usage tracking and app state monitoring
- **Error Handling**: Comprehensive error handling with retry logic
- **Caching**: AsyncStorage-based caching with TTL support

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ 
- npm or yarn
- Expo CLI
- PostgreSQL database (for backend integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Enish-Radio-Pro/mobile-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   - Update API endpoints in `constants/env.development.ts` and `constants/env.production.ts`
   - Ensure backend server is running and accessible

4. **Start development server**
   ```bash
   npm start
   ```

### Running on Devices

- **Android**: `npm run android`
- **iOS**: `npm run ios` 
- **Web**: `npm run web`
- **Expo Go**: Scan QR code from development server

## 📁 Project Structure

```
mobile-app/
├── app/
│   ├── admin/              # Admin panel screens
│   │   ├── dashboard.tsx   # Main dashboard
│   │   ├── social-links.tsx # Social media management
│   │   ├── ad-banners.tsx  # Ad campaign management
│   │   ├── analytics.tsx   # Analytics dashboard
│   │   └── user-management.tsx # User management
│   ├── index.tsx           # Main radio player screen
│   ├── settings.tsx        # App settings
│   ├── sleep-timer.tsx     # Sleep timer screen
│   ├── about.tsx          # About screen
│   ├── privacy.tsx        # Privacy policy
│   └── (tabs)/            # Tab navigation
├── components/            # Reusable UI components
├── constants/             # App configuration and constants
├── hooks/                 # Custom React hooks
├── services/              # API and utility services
├── assets/                # Images and static assets
└── scripts/               # Build and utility scripts
```

## 🛠️ Development Scripts

### Development
```bash
npm start              # Start development server
npm run android        # Start on Android device/emulator
npm run ios            # Start on iOS simulator/device
npm run web            # Start web version
```

### Testing
```bash
npm test              # Run all tests
npm run test:watch     # Watch mode for development
npm run test:coverage  # Generate test coverage report
```

### Building and Deployment
```bash
npm run build:dev      # Development build
npm run build:preview  # Preview build
npm run build:prod     # Production build
npm run submit:android # Submit to Google Play
npm run submit:ios     # Submit to App Store
```

### Linting
```bash
npm run lint          # Run ESLint
```

## 🔧 Configuration

### Environment Variables
Configure API endpoints and other settings in:
- `constants/env.development.ts` - Development environment
- `constants/env.production.ts` - Production environment

### EAS Build Configuration
The app uses Expo Application Services (EAS) for building. Configuration is in `eas.json`:
- Development builds for testing
- Preview builds for internal testing
- Production builds for app store submission

#### Notes on common EAS messages
- "Found eas-cli in your project dependencies" — We already pin the CLI via `cli.version` in `eas.json` (currently `16.24.1`). This ensures consistent builds locally and on CI.
- "No environment variables ... found for the \"production\" environment on EAS" — Informational. This project uses TypeScript-based env config (`constants/env.*.ts`) instead of EAS env vars. If you need secrets for builds, add them in the EAS dashboard or with `eas secret:create`.
- "No remote versions are configured ... Initialized versionCode with 1" — Expected on first build when `appVersionSource` is set to `remote` in `eas.json`. EAS initializes and manages app versions for you.

Optional version management commands:

```sh
# Set up remote versioning policy interactively (recommended once)
eas version:configure

# Bump versions when needed (with appVersionSource: remote)
eas version:set --platform android --auto
eas version:set --platform ios --auto

# Sync local files with remote versions (if switching strategies)
eas version:sync
```

## 🎨 Admin Panel

The mobile app includes a comprehensive admin panel for managing radio station content:

### Accessing Admin Panel
1. Navigate to the admin section from the main app
2. Authenticate with admin credentials
3. Access all management features

### Admin Features
- **Dashboard**: Real-time statistics and system health
- **Social Links**: Manage social media links with platform icons and ordering
- **Ad Management**: Create and track ad campaigns with performance metrics
- **Analytics**: Detailed listener statistics and geographic data
- **User Management**: Manage admin users and permissions

## 🔍 Testing

The app includes a comprehensive test suite:

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

Test files are located in `services/__tests__/` and cover:
- API service functionality
- Cache service operations
- Error handling scenarios

## 📦 Dependencies

### Core Libraries
- `react` & `react-native` - React Native framework
- `expo` - Expo SDK for cross-platform development
- `expo-av` - Audio and video playback
- `expo-router` - File-based routing
- `react-navigation` - Navigation system

### UI Components
- `react-native-elements` - UI component library
- `react-native-reanimated` - Animations
- `react-native-gesture-handler` - Gesture support

### Utilities
- `axios` - HTTP client for API calls
- `async-storage` - Local data storage
- `react-native-share` - Sharing functionality
- `react-native-rate` - App rating

## 🚀 Deployment

### Build Process
1. **Development Builds**: For testing on physical devices
2. **Preview Builds**: For internal testing and QA
3. **Production Builds**: For app store submission

### App Store Submission
The app supports automated submission to both iOS and Android stores:
```bash
npm run submit:ios      # Submit to App Store
npm run submit:android  # Submit to Google Play
```

## 🔒 Security

- **HTTPS**: All API communications use HTTPS
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive input sanitization
- **Secure Storage**: Encrypted storage for sensitive data

## 📊 Performance

- **Caching Strategy**: Intelligent caching with TTL-based invalidation
- **Memory Management**: Automatic cleanup and leak prevention
- **Network Optimization**: Request batching and connection pooling
- **Performance Monitoring**: Real-time performance metrics tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the coding standards
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the Enish Radio Pro application suite. Contact the project maintainers for licensing information.

## 🆘 Support

For issues and support:
- Check the [AGENTS.md](../AGENTS.md) for development guidelines
- Review the [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for technical details
- Examine the [ENV_CONFIG.md](ENV_CONFIG.md) for environment setup

---

*Enish Radio Pro - Delivering premium radio experiences across platforms*
