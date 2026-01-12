# Bundle Optimization Guide

## Quick Wins Applied

### 1. Image Optimization
Run the optimization script:
```bash
brew install pngquant optipng  # macOS
npm run optimize:images
```

**Current image sizes (potential ~70% reduction):**
| File | Current | Target |
|------|---------|--------|
| splash-icon.png | 628KB | ~100KB |
| icon.png | 202KB | ~50KB |
| android-icon-*.png | ~218KB | ~50KB |

### 2. Bundle Analysis
Analyze your bundle to find heavy dependencies:
```bash
npm run analyze
```

## Dependency Optimizations

### Remove Unused Dependencies
Review if these are actually used:
- `expo-symbols` - Only needed for SF Symbols on iOS
- `expo-haptics` - Remove if not using haptic feedback
- `react-native-web` - Remove if not targeting web

### Replace Heavy Libraries

| Current | Lighter Alternative | Savings |
|---------|-------------------|---------|
| `axios` | `fetch` (built-in) | ~15KB |
| `uuid` | `expo-crypto.randomUUID()` | ~5KB |

### Tree Shaking
Ensure specific imports:
```typescript
// ❌ Bad - imports entire library
import { Icon } from '@expo/vector-icons';

// ✅ Good - imports only what's needed
import { Ionicons } from '@expo/vector-icons/Ionicons';
```

## EAS Build Optimizations (Applied)

- ✅ `EXPO_NO_BUNDLE_SPLITTING: false` - Enables code splitting
- ✅ `gradleCommand: :app:bundleRelease` - Uses AAB format (smaller)
- ✅ React Compiler enabled in `app.json`

## ProGuard Rules (Android)

Create `mobile-app/android/app/proguard-rules.pro`:
```proguard
# Keep React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# Remove logging in release
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
}

# Aggressive optimizations
-optimizationpasses 5
-allowaccessmodification
```

## Asset Loading Strategy

Use `expo-asset` for lazy loading:
```typescript
import { Asset } from 'expo-asset';

// Preload only critical assets
await Asset.loadAsync([
  require('./assets/images/icon.png'),
]);
```

## Expected Results

| Optimization | Estimated Savings |
|-------------|-------------------|
| Image compression | 500KB - 800KB |
| Remove unused deps | 50KB - 100KB |
| ProGuard rules | 200KB - 500KB |
| Code splitting | 100KB - 200KB |
| **Total** | **~1MB - 1.6MB** |

## Verification

After optimization, compare build sizes:
```bash
# Before
npx eas build --profile production --platform android

# Check APK/AAB size in EAS dashboard
```
