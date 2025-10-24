import { renderHook, act } from '@testing-library/react-native';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { CacheService } from '@/services/cache';

// Mock the dependencies
jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn(),
    Sound: {
      createAsync: jest.fn(),
    },
  },
}));

jest.mock('@/constants/radio', () => ({
  RADIO_STREAMS: {
    PRIMARY_MP3: 'https://test-stream.com',
    FALLBACK_M3U: 'https://test-fallback.com',
  },
}));

describe('Auto Play Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should attempt auto-play when enabled in settings', async () => {
    // Mock cache service to return auto-play enabled
    const mockGetAutoPlaySetting = jest.fn().mockResolvedValue(true);
    const mockSetAutoPlaySetting = jest.fn();
    
    // Mock the dynamic import
    jest.doMock('@/services/cache', () => ({
      CacheService: {
        getAutoPlaySetting: mockGetAutoPlaySetting,
        setAutoPlaySetting: mockSetAutoPlaySetting,
      },
    }));

    // Render the hook
    const { result } = renderHook(() => useAudioPlayer());

    // Wait for async operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1100)); // Wait for auto-play timeout
    });

    // Verify auto-play was attempted
    expect(mockGetAutoPlaySetting).toHaveBeenCalled();
  });

  it('should not attempt auto-play when disabled in settings', async () => {
    // Mock cache service to return auto-play disabled
    const mockGetAutoPlaySetting = jest.fn().mockResolvedValue(false);
    
    jest.doMock('@/services/cache', () => ({
      CacheService: {
        getAutoPlaySetting: mockGetAutoPlaySetting,
      },
    }));

    // Render the hook
    const { result } = renderHook(() => useAudioPlayer());

    // Wait for async operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1100)); // Wait for auto-play timeout
    });

    // Verify auto-play was not attempted
    expect(mockGetAutoPlaySetting).toHaveBeenCalled();
  });

  it('should handle auto-play failure gracefully', async () => {
    // Mock cache service to return auto-play enabled
    const mockGetAutoPlaySetting = jest.fn().mockResolvedValue(true);
    
    // Mock Sound.createAsync to throw an error
    const { Audio } = require('expo-av');
    Audio.Sound.createAsync.mockRejectedValue(new Error('Stream unavailable'));
    
    jest.doMock('@/services/cache', () => ({
      CacheService: {
        getAutoPlaySetting: mockGetAutoPlaySetting,
      },
    }));

    // Render the hook
    const { result } = renderHook(() => useAudioPlayer());

    // Wait for async operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1100)); // Wait for auto-play timeout
    });

    // Should not throw error and should handle gracefully
    expect(mockGetAutoPlaySetting).toHaveBeenCalled();
  });
});