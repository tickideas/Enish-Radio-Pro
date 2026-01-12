import { renderHook, act } from '@testing-library/react-native';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

// Mock expo-audio
const mockPlayer = {
  play: jest.fn(),
  pause: jest.fn(),
  seekTo: jest.fn(),
  replace: jest.fn(),
  release: jest.fn(),
  volume: 1.0,
  loop: false,
};

jest.mock('expo-audio', () => ({
  useAudioPlayer: jest.fn(() => mockPlayer),
  useAudioPlayerStatus: jest.fn(() => ({
    playing: false,
    isLoaded: true,
    isBuffering: false,
    currentTime: 0,
    duration: 0,
  })),
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/services/cache', () => ({
  CacheService: {
    getAutoPlaySetting: jest.fn().mockResolvedValue(false),
  },
}));

jest.mock('@/constants/radio', () => ({
  RADIO_STREAMS: {
    PRIMARY_MP3: 'https://test-stream.com',
    FALLBACK_M3U: 'https://test-fallback.com',
  },
  AUDIO_CONFIG: {
    RECONNECT_ATTEMPTS: 3,
    RECONNECT_DELAY: 1000,
  },
}));

jest.mock('@/services/radioKing', () => ({
  RadioKingService: {
    getCurrentTrack: jest.fn().mockResolvedValue({ success: false }),
    convertToAppFormat: jest.fn(),
  },
}));

describe('Auto Play Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide triggerAutoPlay method', () => {
    const { result } = renderHook(() => useAudioPlayer());

    expect(typeof result.current.triggerAutoPlay).toBe('function');
  });

  it('should handle triggerAutoPlay correctly', async () => {
    const { result } = renderHook(() => useAudioPlayer());

    await act(async () => {
      await result.current.triggerAutoPlay();
    });

    expect(mockPlayer.replace).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(true);
  });

  it('should not trigger auto-play twice', async () => {
    const { result } = renderHook(() => useAudioPlayer());

    await act(async () => {
      await result.current.triggerAutoPlay();
    });

    mockPlayer.replace.mockClear();

    await act(async () => {
      await result.current.triggerAutoPlay();
    });

    expect(mockPlayer.replace).not.toHaveBeenCalled();
  });

  it('should handle triggerAutoPlay failure gracefully', async () => {
    mockPlayer.replace.mockImplementationOnce(() => {
      throw new Error('Stream unavailable');
    });

    const { result } = renderHook(() => useAudioPlayer());

    await act(async () => {
      await result.current.triggerAutoPlay();
    });

    expect(result.current.error).toBe('Failed to load radio stream');
  });
});
