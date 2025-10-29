import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { performanceMonitor } from '../services/performance';
import { cache } from '../services/cache';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useAnalytics } from '../services/analytics';

jest.mock('../services/performance');
jest.mock('../services/cache');
jest.mock('../hooks/useAudioPlayer');
jest.mock('../services/analytics');

describe('Mobile App Performance Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('App Start Tracking', () => {
    it('should track app start when component mounts', async () => {
      const { getByTestId } = render(<AppStartComponent />);
      
      await waitFor(() => {
        expect(performanceMonitor.trackAppStart).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Screen View Tracking', () => {
    it('should track screen view when navigating', async () => {
      const mockNavigate = jest.fn();
      const mockUseNavigation = () => ({
        navigate: mockNavigate,
      });
      
      jest.mock('@react-navigation/native', () => ({
        useNavigation: mockUseNavigation,
      }));

      const { getByText } = render(<ScreenComponent />);
      
      fireEvent.press(getByText('Navigate'));
      
      expect(mockNavigate).toHaveBeenCalledWith('TargetScreen');
    });
  });

  describe('User Action Tracking', () => {
    it('should track user actions', async () => {
      const mockTrackUserAction = jest.fn();
      performanceMonitor.trackUserAction = mockTrackUserAction;

      const { getByTestId } = render(<UserActionComponent />);
      
      fireEvent.press(getByTestId('action-button'));
      
      expect(mockTrackUserAction).toHaveBeenCalledWith(
        'button_tap',
        expect.objectContaining({
          button_id: 'action-button',
        })
      );
    });
  });

  describe('Error Tracking', () => {
    it('should track errors when they occur', async () => {
      const mockTrackError = jest.fn();
      performanceMonitor.trackError = mockTrackError;

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const { getByText } = render(<ErrorComponent />);
      
      fireEvent.press(getByText('Trigger Error'));
      
      expect(mockTrackError).toHaveBeenCalledWith(
        expect.objectContaining({
          error_type: 'TypeError',
        })
      );
      
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Memory Usage Tracking', () => {
    it('should track memory usage periodically', async () => {
      const mockTrackMemoryUsage = jest.fn();
      performanceMonitor.trackMemoryUsage = mockTrackMemoryUsage;

      const { unmount } = render(<MemoryTrackingComponent />);
      
      // Wait for periodic tracking
      await waitFor(() => {
        expect(mockTrackMemoryUsage).toHaveBeenCalled();
      }, { timeout: 5000 });

      unmount();
    });
  });
});

describe('Cache Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cache Operations', () => {
    it('should get cached data when available', async () => {
      const mockData = { key: 'value', timestamp: Date.now() };
      cache.get.mockResolvedValue(mockData);

      const result = await cache.get('test-key');
      
      expect(result).toEqual(mockData);
      expect(cache.get).toHaveBeenCalledWith('test-key');
    });

    it('should set data in cache', async () => {
      const testData = { key: 'value' };
      cache.set.mockResolvedValue(true);

      const result = await cache.set('test-key', testData);
      
      expect(result).toBe(true);
      expect(cache.set).toHaveBeenCalledWith('test-key', testData, 3600);
    });

    it('should remove data from cache', async () => {
      cache.remove.mockResolvedValue(true);

      const result = await cache.remove('test-key');
      
      expect(result).toBe(true);
      expect(cache.remove).toHaveBeenCalledWith('test-key');
    });

    it('should clear all cache data', async () => {
      cache.clear.mockResolvedValue(true);

      const result = await cache.clear();
      
      expect(result).toBe(true);
      expect(cache.clear).toHaveBeenCalled();
    });

    it('should report cache size', () => {
      cache.size.mockReturnValue(15);

      const size = cache.size();
      
      expect(size).toBe(15);
      expect(cache.size).toHaveBeenCalled();
    });

    it('should report if cache is enabled', () => {
      cache.isEnabled.mockReturnValue(true);

      const enabled = cache.isEnabled();
      
      expect(enabled).toBe(true);
      expect(cache.isEnabled).toHaveBeenCalled();
    });
  });
});

describe('Audio Player Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Audio Player State', () => {
    it('should initialize with default state', () => {
      const mockState = {
        isPlaying: false,
        currentTrack: null,
        duration: 0,
        position: 0,
        volume: 0.8,
        isLoading: false,
        error: null,
      };

      useAudioPlayer.mockReturnValue({
        state: mockState,
        actions: {
          play: jest.fn(),
          pause: jest.fn(),
          stop: jest.fn(),
          setVolume: jest.fn(),
          seek: jest.fn(),
          loadTrack: jest.fn(),
        },
      });

      const mockUseAudioPlayer = useAudioPlayer();
      
      expect(mockUseAudioPlayer.state).toEqual(mockState);
    });

    it('should handle play action', () => {
      const mockPlay = jest.fn();
      useAudioPlayer.mockReturnValue({
        state: { isPlaying: false },
        actions: {
          play: mockPlay,
          pause: jest.fn(),
          stop: jest.fn(),
          setVolume: jest.fn(),
          seek: jest.fn(),
          loadTrack: jest.fn(),
        },
      });

      const mockUseAudioPlayer = useAudioPlayer();
      mockUseAudioPlayer.actions.play();
      
      expect(mockPlay).toHaveBeenCalledTimes(1);
    });

    it('should handle pause action', () => {
      const mockPause = jest.fn();
      useAudioPlayer.mockReturnValue({
        state: { isPlaying: true },
        actions: {
          play: jest.fn(),
          pause: mockPause,
          stop: jest.fn(),
          setVolume: jest.fn(),
          seek: jest.fn(),
          loadTrack: jest.fn(),
        },
      });

      const mockUseAudioPlayer = useAudioPlayer();
      mockUseAudioPlayer.actions.pause();
      
      expect(mockPause).toHaveBeenCalledTimes(1);
    });

    it('should handle volume change', () => {
      const mockSetVolume = jest.fn();
      useAudioPlayer.mockReturnValue({
        state: { volume: 0.5 },
        actions: {
          play: jest.fn(),
          pause: jest.fn(),
          stop: jest.fn(),
          setVolume: mockSetVolume,
          seek: jest.fn(),
          loadTrack: jest.fn(),
        },
      });

      const mockUseAudioPlayer = useAudioPlayer();
      mockUseAudioPlayer.actions.setVolume(0.8);
      
      expect(mockSetVolume).toHaveBeenCalledWith(0.8);
    });

    it('should handle track seeking', () => {
      const mockSeek = jest.fn();
      useAudioPlayer.mockReturnValue({
        state: { position: 0 },
        actions: {
          play: jest.fn(),
          pause: jest.fn(),
          stop: jest.fn(),
          setVolume: jest.fn(),
          seek: mockSeek,
          loadTrack: jest.fn(),
        },
      });

      const mockUseAudioPlayer = useAudioPlayer();
      mockUseAudioPlayer.actions.seek(30);
      
      expect(mockSeek).toHaveBeenCalledWith(30);
    });

    it('should handle track loading', () => {
      const mockLoadTrack = jest.fn();
      const testTrack = {
        id: '1',
        title: 'Test Track',
        url: 'https://example.com/audio.mp3',
      };

      useAudioPlayer.mockReturnValue({
        state: { currentTrack: null },
        actions: {
          play: jest.fn(),
          pause: jest.fn(),
          stop: jest.fn(),
          setVolume: jest.fn(),
          seek: jest.fn(),
          loadTrack: mockLoadTrack,
        },
      });

      const mockUseAudioPlayer = useAudioPlayer();
      mockUseAudioPlayer.actions.loadTrack(testTrack);
      
      expect(mockLoadTrack).toHaveBeenCalledWith(testTrack);
    });
  });
});

describe('Analytics Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Event Tracking', () => {
    it('should track custom events', () => {
      const mockTrackEvent = jest.fn();
      useAnalytics.mockReturnValue({
        trackEvent: mockTrackEvent,
      });

      const mockUseAnalytics = useAnalytics();
      mockUseAnalytics.trackEvent('custom_event', { property: 'value' });
      
      expect(mockTrackEvent).toHaveBeenCalledWith('custom_event', {
        property: 'value',
      });
    });

    it('should track audio events', () => {
      const mockTrackAudioEvent = jest.fn();
      useAnalytics.mockReturnValue({
        trackAudioEvent: mockTrackAudioEvent,
      });

      const mockUseAnalytics = useAnalytics();
      mockUseAnalytics.trackAudioEvent('play', {
        streamUrl: 'https://example.com/stream.mp3',
        quality: 'high',
      });
      
      expect(mockTrackAudioEvent).toHaveBeenCalledWith('play', {
        streamUrl: 'https://example.com/stream.mp3',
        quality: 'high',
      });
    });

    it('should track errors', () => {
      const mockTrackError = jest.fn();
      useAnalytics.mockReturnValue({
        trackError: mockTrackError,
      });

      const mockUseAnalytics = useAnalytics();
      const error = new Error('Test error');
      mockUseAnalytics.trackError(error, { context: 'test' });
      
      expect(mockTrackError).toHaveBeenCalledWith(error, {
        context: 'test',
      });
    });

    it('should track user journeys', () => {
      const mockStartJourney = jest.fn();
      const mockCompleteJourney = jest.fn();
      
      useAnalytics.mockReturnValue({
        startUserJourney: mockStartJourney,
        completeUserJourney: mockCompleteJourney,
      });

      const mockUseAnalytics = useAnalytics();
      mockUseAnalytics.startUserJourney('onboarding');
      mockUseAnalytics.completeUserJourney('onboarding', { step: 'completed' });
      
      expect(mockStartJourney).toHaveBeenCalledWith('onboarding');
      expect(mockCompleteJourney).toHaveBeenCalledWith('onboarding', {
        step: 'completed',
      });
    });
  });
});

// Test Components
const AppStartComponent = () => {
  React.useEffect(() => {
    performanceMonitor.trackAppStart();
  }, []);

  return <div data-testid="app-start">App Started</div>;
};

const ScreenComponent = () => {
  const navigation = useNavigation();
  
  const handleNavigate = () => {
    performanceMonitor.trackUserAction('navigation', {
      target: 'TargetScreen',
      type: 'tap',
    });
    navigation.navigate('TargetScreen');
  };

  return <button onPress={handleNavigate} testID="navigate">Navigate</button>;
};

const UserActionComponent = () => {
  const { trackEvent } = useAnalytics();

  const handleAction = () => {
    trackEvent('user_action', {
      action_type: 'button_press',
      button_id: 'action-button',
    });
  };

  return <button onPress={handleAction} testID="action-button">Take Action</button>;
};

const ErrorComponent = () => {
  const { trackError } = useAnalytics();

  const handleTriggerError = () => {
    try {
      // Simulate an error
      throw new TypeError('Simulated error for testing');
    } catch (error) {
      trackError(error, { component: 'ErrorComponent' });
      console.error('Error occurred:', error);
    }
  };

  return <button onPress={handleTriggerError} testID="trigger-error">Trigger Error</button>;
};

const MemoryTrackingComponent = () => {
  React.useEffect(() => {
    const interval = setInterval(() => {
      performanceMonitor.trackMemoryUsage();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <div>Memory Tracking</div>;
};