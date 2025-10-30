# Animated Splash Screen - Customization Guide

Your animated splash screen is now ready! Here's how to customize it:

## Features Included

✅ **Logo Animation**: Your app logo scales up and rotates smoothly  
✅ **Fade Effects**: Smooth fade-in transitions for logo and text  
✅ **Loading Dots**: Animated loading indicator at the bottom  
✅ **Custom Typography**: App name and tagline with branded colors  
✅ **Native Integration**: Properly hides the native splash screen  

## Customization Options

### 1. Animation Timing
```typescript
// In AnimatedSplashScreen.tsx - adjust these values:
duration: 800,        // Fade duration
delay: 500,          // Text delay
setTimeout: 3000,    // Total animation time
```

### 2. Colors & Styling
```typescript
// Background color
backgroundColor: '#E6F4FE'

// Text colors
appName: '#1E40AF'    // Blue
tagline: '#64748B'    // Gray
```

### 3. Animation Types
You can change animation effects in `useEffect()`:

**Bounce Effect** (replace scale animation):
```typescript
Animated.spring(scaleAnim, {
  toValue: 1,
  tension: 100,
  friction: 8,
})
```

**Rotation Speed** (change in rotateAnim):
```typescript
Animated.timing(rotateAnim, {
  toValue: 1,
  duration: 3000, // Slower rotation
  useNativeDriver: true,
})
```

### 4. Logo Size
```typescript
// In styles:
logo: {
  width: 100,   // Adjust logo size
  height: 100,
}
```

### 5. Preloading Resources
```typescript
// In _layout.tsx - add your resource loading:
const prepareApp = async () => {
  // Load fonts
  await Font.loadAsync({...});
  
  // Load images
  await Asset.loadAsync([...]);
  
  // Make API calls
  await fetchData();
};
```

## Testing

Run your app to see the animated splash screen:
```bash
npm start
```

The animation will play for 3 seconds before transitioning to your main app.

## Advanced Features

### Add Background Music
You can add a subtle sound effect to the splash screen:

```typescript
import { Audio } from 'expo-av';

// Load and play a subtle sound
const playStartupSound = async () => {
  const { sound } = await Audio.Sound.createAsync(
    require('@/assets/sounds/startup.mp3')
  );
  await sound.playAsync();
};
```

### Loading Progress
Add real loading progress:

```typescript
const [loadingProgress, setLoadingProgress] = useState(0);

// Update progress as resources load
const updateProgress = (completed: number, total: number) => {
  setLoadingProgress(completed / total);
};
```

## Notes

- The native splash screen (configured in app.json) remains until animation completes
- All animations use native drivers for smooth performance
- The component handles both light and dark themes automatically
- Animation timing ensures good UX without being too long

Enjoy your polished animated splash screen! 🎉
