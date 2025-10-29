// Mobile App Test Setup
import 'react-native-gesture-handler/jestSetup';

// Mock React Native modules
jest.mock('react-native', () => {
  return {
    ...jest.requireActual('react-native'),
    Alert: {
      alert: jest.fn(),
      prompt: jest.fn(),
    },
    Vibration: {
      vibrate: jest.fn(),
    },
    StyleSheet: {
      ...jest.requireActual('react-native').StyleSheet,
      flatten: jest.fn(),
      compose: jest.fn(),
    },
    Platform: {
      ...jest.requireActual('react-native').Platform,
      OS: 'ios',
    },
    Dimensions: {
      get: jest.fn(() => ({
        width: 375,
        height: 667,
        scale: 2,
        fontScale: 1,
      })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    Animated: {
      ...jest.requireActual('react-native').Animated,
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        interpolate: jest.fn(() => ({
          interpolate: jest.fn(() => ({ toJSON: () => 0 })),
        })),
      })),
      timing: jest.fn(() => ({
        start: jest.fn(),
      })),
      spring: jest.fn(() => ({
        start: jest.fn(),
      })),
      parallel: jest.fn(() => ({
        start: jest.fn(),
      })),
      sequence: jest.fn(() => ({
        start: jest.fn(),
      })),
      event: jest.fn(),
      View: jest.fn(),
      Text: jest.fn(),
      Image: jest.fn(),
      ScrollView: jest.fn(),
    },
  };
});

// Mock Expo modules
jest.mock('expo-constants', () => ({
  default: {
    platform: { os: 'ios' },
    appOwnership: 'expo',
    executionEnvironment: 'standalone',
    deviceId: 'test-device-id',
    sessionId: 'test-session-id',
    getWebViewUserAgentAsync: jest.fn(),
    getInstallationIdAsync: jest.fn(),
  },
}));

jest.mock('expo-device', () => ({
  deviceName: 'Test Device',
  platform: {
    platform: 'ios',
    ios: { model: 'iPhone', userInterfaceIdiom: 'phone', systemName: 'iOS' },
  },
}));

// Mock Expo Audio
jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn(),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    addRecordingProgressListener: jest.fn(),
    removeRecordingProgressListener: jest.fn(),
    createAsync: jest.fn(),
    PLACES: {
      Speaker: 'speaker',
      EarPiece: 'earpiece',
      SpeakerAndMicrophone: 'speakerAndMicrophone',
    },
  },
  Sound: {
    createAsync: jest.fn().mockResolvedValue({
      sound: {
        loadAsync: jest.fn(),
        unloadAsync: jest.fn(),
        playAsync: jest.fn(),
        pauseAsync: jest.fn(),
        stopAsync: jest.fn(),
        setPositionAsync: jest.fn(),
        getStatusAsync: jest.fn(),
        setRateAsync: jest.fn(),
        setVolumeAsync: jest.fn(),
      },
      status: { isLoaded: true },
    }),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/async-storage-mock')
);

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    push: jest.fn(),
    pop: jest.fn(),
    popToTop: jest.fn(),
    replace: jest.fn(),
    reset: jest.fn(),
    setParams: jest.fn(),
  }),
  useRoute: () => ({
    name: 'TestScreen',
    params: {},
    key: 'test-key',
  }),
  useFocusEffect: jest.fn(),
  useIsFocused: jest.fn().mockReturnValue(true),
}));

// Mock React Navigation Bottom Tabs
jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: jest.fn(() => ({
    Navigator: jest.fn(),
    Screen: jest.fn(),
  })),
}));

// Mock React Navigation Stack
jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: jest.fn(() => ({
    Navigator: jest.fn(),
    Screen: jest.fn(),
  })),
}));

// Mock SafeAreaView
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }),
}));

// Mock LinearGradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }) => children,
}));

// Mock Vector Icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, size, color }) => `Icon: ${name} (${size}px, ${color})`,
  MaterialIcons: ({ name, size, color }) => `Icon: ${name} (${size}px, ${color})`,
  FontAwesome: ({ name, size, color }) => `Icon: ${name} (${size}px, ${color})`,
}));

// Mock Image component
jest.mock('expo-image', () => ({
  Image: ({ children, style, ...props }) => ({
    $$typeof: Symbol.for('react.element'),
    type: 'Image',
    key: null,
    ref: null,
    props: {
      ...props,
      style,
      children,
    },
  }),
}));

// Mock Custom Modules
jest.mock('../services/performance', () => ({
  performanceMonitor: {
    trackAppStart: jest.fn(),
    trackScreenView: jest.fn(),
    trackUserAction: jest.fn(),
    trackError: jest.fn(),
    trackApiCall: jest.fn(),
    trackMemoryUsage: jest.fn(),
    getMetrics: jest.fn().mockResolvedValue({
      appStartTime: 100,
      screenViews: 10,
      errors: 0,
      memoryUsage: [],
    }),
  },
}));

jest.mock('../services/cache', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
    size: jest.fn().mockReturnValue(0),
    isEnabled: jest.fn().mockReturnValue(true),
  },
}));

// Setup global test environment
global.fetch = jest.fn();

// Custom matchers for React Native testing
expect.extend({
  toBeInstanceOf(received, constructor) {
    const isInstance = received instanceof constructor;
    if (isInstance) {
      return {
        message: () => `expected ${received} not to be instance of ${constructor.name}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be instance of ${constructor.name}`,
        pass: false,
      };
    }
  },

  toHaveStyle(received, style) {
    const styleObject = received.props?.style;
    if (!styleObject) {
      return {
        message: () => `expected element to have style but it has no style prop`,
        pass: false,
      };
    }

    const styles = Array.isArray(styleObject) ? styleObject : [styleObject];
    const hasAllStyles = Object.entries(style).every(([key, value]) => {
      return styles.some(style => style[key] === value);
    });

    if (hasAllStyles) {
      return {
        message: () => `expected element not to have style ${JSON.stringify(style)}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have style ${JSON.stringify(style)}`,
        pass: false,
      };
    }
  },

  toBeVisible(received) {
    const isVisible = received.props?.accessible !== false && 
                     received.props?.accessibilityHint !== 'hidden' &&
                     !received.props?.testID?.includes('hidden');

    if (isVisible) {
      return {
        message: () => `expected element not to be visible`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be visible`,
        pass: false,
      };
    }
  },
});

// Test utilities for mobile app testing
global.mobileTestUtils = {
  // Simulate user interactions
  simulateTap: (element) => {
    const mockEvent = {
      nativeEvent: {
        locationX: 0,
        locationY: 0,
        timestamp: Date.now(),
      },
    };
    
    if (element.props?.onPress) {
      element.props.onPress(mockEvent);
    }
    
    if (element.props?.onClick) {
      element.props.onClick(mockEvent);
    }
  },

  simulateLongPress: (element) => {
    const mockEvent = {
      nativeEvent: {
        locationX: 0,
        locationY: 0,
        timestamp: Date.now(),
      },
    };
    
    if (element.props?.onLongPress) {
      element.props.onLongPress(mockEvent);
    }
  },

  simulateGesture: (element, gestureType = 'swipe') => {
    const mockEvent = {
      nativeEvent: {
        touches: [{ identifier: 0, pageX: 0, pageY: 0 }],
        changedTouches: [{ identifier: 0, pageX: 100, pageY: 100 }],
        timestamp: Date.now(),
      },
    };
    
    if (element.props?.onGesture) {
      element.props.onGesture(mockEvent);
    }
  },

  // Mock async operations
  mockAsyncOperation: (result, delay = 100) => {
    return new Promise(resolve => {
      setTimeout(() => resolve(result), delay);
    });
  },

  mockFailedAsyncOperation: (error, delay = 100) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => reject(error), delay);
    });
  },

  // Create mock component
  createMockComponent: (type, props = {}) => ({
    $$typeof: Symbol.for('react.element'),
    type,
    key: null,
    ref: null,
    props: {
      ...props,
      children: null,
    },
  }),

  // Create mock audio player state
  createMockAudioState: (overrides = {}) => ({
    isPlaying: false,
    currentTrack: null,
    duration: 0,
    position: 0,
    volume: 0.8,
    isLoading: false,
    error: null,
    ...overrides,
  }),

  // Create mock analytics event
  createMockAnalyticsEvent: (eventType, properties = {}) => ({
    id: `mock-event-${Date.now()}`,
    timestamp: new Date(),
    eventType,
    eventName: eventType,
    properties,
    context: {
      platform: 'ios',
      appVersion: '1.0.0',
      osVersion: '15.0',
      deviceModel: 'iPhone 13',
    },
  }),
};

// Mock console for testing
global.console = {
  ...console,
  // Uncomment to silence console in tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

console.log('📱 Mobile app test environment setup complete');