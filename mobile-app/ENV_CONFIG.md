# Environment Configuration for Enish Radio Pro Mobile App

This app uses a simple environment configuration system that automatically selects the correct API endpoint based on whether the app is running in development or production mode.

## File Structure

```
mobile-app/constants/
├── env.ts                 # Main config - auto-selects dev or prod
├── env.development.ts     # Development settings
└── env.production.ts      # Production settings
```

## How It Works

- **Development Mode** (`npm start`, `npm run android`, `npm run ios`):
  - Uses `env.development.ts`
  - API URL: `http://192.168.1.80:3000/api` (your local network)
  - Debug mode enabled
  - Analytics disabled

- **Production Mode** (when building with EAS or creating release builds):
  - Uses `env.production.ts`
  - API URL: `https://api.enishradio.com/api`
  - Debug mode disabled
  - Analytics enabled

## Updating Configuration

### For Development (Local Testing)

Edit `mobile-app/constants/env.development.ts`:

```typescript
export const DEVELOPMENT_API_URL = 'http://YOUR_IP_ADDRESS:3000/api';
```

**Note**: Your IP address may change when you reconnect to WiFi. To find it:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
```

### For Production (Deployed Backend)

Edit `mobile-app/constants/env.production.ts`:

```typescript
export const PRODUCTION_API_URL = 'https://your-actual-domain.com/api';
```

## Building for Production

### Using EAS Build (Expo Application Services)

1. **Preview Build** (for testing production mode):
   ```bash
   npm run build:preview
   ```

2. **Production Build**:
   ```bash
   npm run build:prod
   ```

3. **Submit to App Stores**:
   ```bash
   npm run submit:android
   npm run submit:ios
   ```

These commands are already configured in your `package.json` and will automatically use the production environment settings.

### Local Production Build

If you want to test production mode locally without EAS:

```bash
# Android
npx expo run:android --variant release

# iOS
npx expo run:ios --configuration Release
```

## Adding More Environment Variables

To add additional environment-specific settings:

1. Add to `env.development.ts`:
   ```typescript
   export const DEVELOPMENT_CONFIG = {
     API_URL: DEVELOPMENT_API_URL,
     ANALYTICS_ENABLED: false,
     DEBUG_MODE: true,
     NEW_FEATURE_FLAG: true, // Add your new config here
   };
   ```

2. Add the same to `env.production.ts`:
   ```typescript
   export const PRODUCTION_CONFIG = {
     API_URL: PRODUCTION_API_URL,
     ANALYTICS_ENABLED: true,
     DEBUG_MODE: false,
     NEW_FEATURE_FLAG: false, // Production value
   };
   ```

3. Export it in `env.ts`:
   ```typescript
   export const NEW_FEATURE_FLAG = ENV_CONFIG.NEW_FEATURE_FLAG;
   ```

4. Use it anywhere in your app:
   ```typescript
   import { NEW_FEATURE_FLAG } from '@/constants/env';
   
   if (NEW_FEATURE_FLAG) {
     // Show new feature
   }
   ```

## Why Not Use .env Files?

React Native doesn't support `.env` files natively like Node.js does. While you can use packages like `react-native-dotenv` or `expo-constants`, the TypeScript approach we're using is:

- ✅ Simpler (no extra dependencies)
- ✅ Type-safe (TypeScript autocomplete)
- ✅ Works with Expo's build system out of the box
- ✅ Easy to understand and maintain
- ✅ No risk of accidentally committing secrets (everything is in code)

## Security Note

⚠️ **Important**: Never store API keys, secrets, or sensitive credentials in the mobile app code. These files are bundled with your app and can be extracted by users.

For sensitive configuration:
- Use your backend API to provide them (after authentication)
- Or use Expo's secure store: `expo-secure-store`

## Current Configuration

**Development**: 
- API: `http://192.168.1.80:3000/api`
- Debug: ON
- Analytics: OFF

**Production**: 
- API: `https://api.enishradio.com/api`
- Debug: OFF
- Analytics: ON

---

*Auto-selected based on `__DEV__` flag (React Native built-in)*
