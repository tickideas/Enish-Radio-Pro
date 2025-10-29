import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  AccessibilityInfo,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

interface UserExperienceMetrics {
  gestureRecognized: boolean;
  hapticFeedbackEnabled: boolean;
  reducedMotionEnabled: boolean;
  highContrastEnabled: boolean;
  largeTextEnabled: boolean;
  screenReaderActive: boolean;
}

interface MicroInteractionProps {
  children: React.ReactNode;
  type: 'press' | 'slide' | 'tap' | 'swipe';
  onGestureStart?: () => void;
  onGestureComplete?: () => void;
  hapticFeedback?: boolean;
  accessibilityLabel?: string;
}

const MicroInteraction: React.FC<MicroInteractionProps> = ({
  children,
  type,
  onGestureStart,
  onGestureComplete,
  hapticFeedback = true,
  accessibilityLabel,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handleGestureStart = () => {
    onGestureStart?.();
    
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    if (hapticFeedback) {
      // Haptic feedback would be implemented here
      console.log('Haptic feedback triggered');
    }
  };

  const handleGestureEnd = () => {
    onGestureComplete?.();
    
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleGestureCancel = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        styles.microInteraction,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
      accessibilityRole={accessibilityLabel ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handleGestureStart}
        onPressOut={handleGestureEnd}
        onPress={handleGestureEnd}
        onResponderRelease={handleGestureEnd}
        onResponderCancel={handleGestureCancel}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

interface ProgressiveDisclosureProps {
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  title: string;
  subtitle?: string;
  showExpandIndicator?: boolean;
  animationDuration?: number;
}

const ProgressiveDisclosure: React.FC<ProgressiveDisclosureProps> = ({
  children,
  isExpanded,
  onToggle,
  title,
  subtitle,
  showExpandIndicator = true,
  animationDuration = 300,
}) => {
  const heightAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const targetHeight = isExpanded ? contentHeight : 0;
    const targetRotation = isExpanded ? 1 : 0;

    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: targetHeight,
        duration: animationDuration,
        useNativeDriver: false,
      }),
      Animated.timing(rotateAnim, {
        toValue: targetRotation,
        duration: animationDuration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isExpanded, contentHeight, animationDuration]);

  const interpolateRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.progressiveDisclosure}>
      <TouchableOpacity
        style={styles.disclosureHeader}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityLabel={isExpanded ? `Collapse ${title}` : `Expand ${title}`}
      >
        <View style={styles.disclosureTitleContainer}>
          <Text style={styles.disclosureTitle}>{title}</Text>
          {subtitle && <Text style={styles.disclosureSubtitle}>{subtitle}</Text>}
        </View>
        
        {showExpandIndicator && (
          <Animated.View style={{ transform: [{ rotate: interpolateRotation }] }}>
            <Ionicons name="chevron-down" size={24} color="#666" />
          </Animated.View>
        )}
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.disclosureContent,
          {
            height: heightAnim,
            opacity: heightAnim.interpolate({
              inputRange: [0, contentHeight / 2, contentHeight],
              outputRange: [0, 0.5, 1],
            }),
          },
        ]}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setContentHeight(height);
        }}
      >
        <View style={styles.disclosureContentInner}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

interface AdaptiveFeedbackProps {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  duration?: number;
  position?: 'top' | 'bottom' | 'center';
  showProgress?: boolean;
  onDismiss?: () => void;
}

const AdaptiveFeedback: React.FC<AdaptiveFeedbackProps> = ({
  type,
  message,
  duration = 3000,
  position = 'bottom',
  showProgress = false,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    // Slide in animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    // Progress bar animation if enabled
    if (showProgress && duration > 0) {
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: duration,
        useNativeDriver: false,
      }).start();
    }

    // Auto dismiss
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: position === 'bottom' ? 100 : -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsVisible(false);
      onDismiss?.();
    });
  };

  if (!isVisible) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          colors: ['#10B981', '#059669'],
          textColor: '#065F46',
        };
      case 'warning':
        return {
          icon: 'warning',
          colors: ['#F59E0B', '#D97706'],
          textColor: '#92400E',
        };
      case 'error':
        return {
          icon: 'close-circle',
          colors: ['#EF4444', '#DC2626'],
          textColor: '#991B1B',
        };
      case 'info':
        return {
          icon: 'information-circle',
          colors: ['#3B82F6', '#2563EB'],
          textColor: '#1E40AF',
        };
    }
  };

  const config = getTypeConfig();

  const getPositionStyle = () => {
    switch (position) {
      case 'top':
        return { top: 50 };
      case 'bottom':
        return { bottom: 50 };
      case 'center':
        return { top: '50%', transform: [{ translateY: -50 }] };
    }
  };

  return (
    <Animated.View
      style={[
        styles.feedbackContainer,
        getPositionStyle(),
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <LinearGradient
        colors={config.colors}
        style={styles.feedbackGradient}
      >
        <View style={styles.feedbackContent}>
          <Ionicons name={config.icon as any} size={24} color="#fff" />
          <Text style={styles.feedbackMessage}>{message}</Text>
          <TouchableOpacity
            onPress={handleDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification"
          >
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {showProgress && (
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        )}
      </LinearGradient>
    </Animated.View>
  );
};

interface UserExperienceDashboardProps {
  metrics: UserExperienceMetrics;
  onSettingsChange: (key: keyof UserExperienceMetrics, value: boolean) => void;
}

const UserExperienceDashboard: React.FC<UserExperienceDashboardProps> = ({
  metrics,
  onSettingsChange,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('accessibility');

  const categories = [
    { id: 'accessibility', title: 'Accessibility', icon: 'accessibility' },
    { id: 'interactions', title: 'Interactions', icon: 'hand-left' },
    { id: 'feedback', title: 'Feedback', icon: 'notifications' },
    { id: 'performance', title: 'Performance', icon: 'speedometer' },
  ];

  const renderCategoryContent = () => {
    switch (selectedCategory) {
      case 'accessibility':
        return (
          <View>
            <ProgressiveDisclosure
              isExpanded={true}
              onToggle={() => {}}
              title="Visual Accessibility"
            >
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>High Contrast Mode</Text>
                <TouchableOpacity
                  style={[
                    styles.toggleSwitch,
                    metrics.highContrastEnabled && styles.toggleSwitchActive,
                  ]}
                  onPress={() => onSettingsChange('highContrastEnabled', !metrics.highContrastEnabled)}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: metrics.highContrastEnabled }}
                >
                  <View style={[
                    styles.toggleThumb,
                    metrics.highContrastEnabled && styles.toggleThumbActive,
                  ]} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Large Text</Text>
                <TouchableOpacity
                  style={[
                    styles.toggleSwitch,
                    metrics.largeTextEnabled && styles.toggleSwitchActive,
                  ]}
                  onPress={() => onSettingsChange('largeTextEnabled', !metrics.largeTextEnabled)}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: metrics.largeTextEnabled }}
                >
                  <View style={[
                    styles.toggleThumb,
                    metrics.largeTextEnabled && styles.toggleThumbActive,
                  ]} />
                </TouchableOpacity>
              </View>
            </ProgressiveDisclosure>

            <ProgressiveDisclosure
              isExpanded={false}
              onToggle={() => {}}
              title="Motor Accessibility"
            >
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Haptic Feedback</Text>
                <TouchableOpacity
                  style={[
                    styles.toggleSwitch,
                    metrics.hapticFeedbackEnabled && styles.toggleSwitchActive,
                  ]}
                  onPress={() => onSettingsChange('hapticFeedbackEnabled', !metrics.hapticFeedbackEnabled)}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: metrics.hapticFeedbackEnabled }}
                >
                  <View style={[
                    styles.toggleThumb,
                    metrics.hapticFeedbackEnabled && styles.toggleThumbActive,
                  ]} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Reduce Motion</Text>
                <TouchableOpacity
                  style={[
                    styles.toggleSwitch,
                    metrics.reducedMotionEnabled && styles.toggleSwitchActive,
                  ]}
                  onPress={() => onSettingsChange('reducedMotionEnabled', !metrics.reducedMotionEnabled)}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: metrics.reducedMotionEnabled }}
                >
                  <View style={[
                    styles.toggleThumb,
                    metrics.reducedMotionEnabled && styles.toggleThumbActive,
                  ]} />
                </TouchableOpacity>
              </View>
            </ProgressiveDisclosure>
          </View>
        );

      case 'interactions':
        return (
          <View>
            <Text style={styles.categoryDescription}>
              Customize how you interact with the app
            </Text>
            
            <MicroInteraction
              type="tap"
              hapticFeedback={metrics.hapticFeedbackEnabled}
              accessibilityLabel="Example tap interaction"
            >
              <View style={styles.interactionExample}>
                <Ionicons name="finger-print" size={32} color="#007AFF" />
                <Text style={styles.interactionText}>Tap Interaction</Text>
              </View>
            </MicroInteraction>
          </View>
        );

      case 'feedback':
        return (
          <View>
            <Text style={styles.categoryDescription}>
              Choose how the app provides feedback
            </Text>
            
            <TouchableOpacity
              style={styles.feedbackExample}
              onPress={() => {
                Alert.alert('Feedback Demo', 'This is how success feedback looks!');
              }}
            >
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.feedbackExampleText}>Show Success Feedback</Text>
            </TouchableOpacity>
          </View>
        );

      case 'performance':
        return (
          <View>
            <Text style={styles.categoryDescription}>
              Performance and optimization settings
            </Text>
            
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Gesture Recognition</Text>
              <View style={[
                styles.statusIndicator,
                metrics.gestureRecognized ? styles.statusSuccess : styles.statusInactive,
              ]} />
            </View>
            
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Screen Reader Active</Text>
              <View style={[
                styles.statusIndicator,
                metrics.screenReaderActive ? styles.statusSuccess : styles.statusInactive,
              ]} />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.dashboard}>
      <Text style={styles.dashboardTitle}>User Experience Settings</Text>
      
      {/* Category Selector */}
      <View style={styles.categorySelector}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedCategory === category.id }}
          >
            <Ionicons
              name={category.icon as any}
              size={20}
              color={selectedCategory === category.id ? '#fff' : '#666'}
            />
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category.id && styles.categoryButtonTextActive,
            ]}>
              {category.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Content */}
      <View style={styles.categoryContent}>
        {renderCategoryContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  microInteraction: {
    width: '100%',
  },
  progressiveDisclosure: {
    marginVertical: 8,
  },
  disclosureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  disclosureTitleContainer: {
    flex: 1,
  },
  disclosureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  disclosureSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  disclosureContent: {
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  disclosureContentInner: {
    padding: 16,
  },
  feedbackContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  feedbackGradient: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  feedbackContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  feedbackMessage: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginTop: 12,
  },
  dashboard: {
    flex: 1,
    backgroundColor: '#fff',
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  categorySelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    gap: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  categoryContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categoryDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  toggleSwitch: {
    width: 52,
    height: 32,
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#007AFF',
  },
  toggleThumb: {
    width: 28,
    height: 28,
    backgroundColor: '#fff',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  interactionExample: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    gap: 12,
  },
  interactionText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  feedbackExample: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    gap: 12,
  },
  feedbackExampleText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  metricLabel: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusSuccess: {
    backgroundColor: '#10B981',
  },
  statusInactive: {
    backgroundColor: '#e0e0e0',
  },
});

export {
  MicroInteraction,
  ProgressiveDisclosure,
  AdaptiveFeedback,
  UserExperienceDashboard,
};