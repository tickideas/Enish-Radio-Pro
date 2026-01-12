import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAudioPlayer } from '../useAudioPlayer';

// Mock expo-audio
const mockPlay = jest.fn();
const mockPause = jest.fn();
const mockSeekTo = jest.fn();
const mockReplace = jest.fn();

const mockPlayer = {
  play: mockPlay,
  pause: mockPause,
  seekTo: mockSeekTo,
  replace: mockReplace,
  release: jest.fn(),
  volume: 1.0,
  loop: false,
};

const mockStatus = {
  playing: false,
  isLoaded: true,
  isBuffering: false,
  currentTime: 0,
  duration: 0,
};

jest.mock('expo-audio', () => ({
  useAudioPlayer: jest.fn(() => mockPlayer),
  useAudioPlayerStatus: jest.fn(() => mockStatus),
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  setIsAudioActiveAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock cache service
jest.mock('@/services/cache', () => ({
  CacheService: {
    getAutoPlaySetting: jest.fn().mockResolvedValue(false),
  },
}));

// Mock radio constants
jest.mock('@/constants/radio', () => ({
  RADIO_STREAMS: {
    PRIMARY_MP3: 'https://example.com/stream.mp3',
    FALLBACK_M3U: 'https://example.com/fallback.m3u',
  },
  AUDIO_CONFIG: {
    RECONNECT_ATTEMPTS: 3,
    RECONNECT_DELAY: 1000,
  },
}));

// Mock RadioKing service
jest.mock('@/services/radioKing', () => ({
  RadioKingService: {
    getCurrentTrack: jest.fn().mockResolvedValue({
      success: true,
      data: {
        title: 'Test Track',
        artist: 'Test Artist',
      },
    }),
    convertToAppFormat: jest.fn().mockReturnValue({
      title: 'Test Track',
      artist: 'Test Artist',
      album: '',
      artwork: '',
      duration: 0,
    }),
  },
}));

describe('useAudioPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockStatus.playing = false;
    mockStatus.isLoaded = true;
    mockStatus.isBuffering = false;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useAudioPlayer());

      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.volume).toBe(1.0);
      expect(result.current.isBuffering).toBe(false);
      expect(result.current.metadata).toEqual({});
    });
  });

  describe('Play/Pause Controls', () => {
    it('should toggle play state', async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await result.current.play();
      });

      expect(result.current.isPlaying).toBe(true);
    });

    it('should pause when playing', async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await result.current.play();
      });

      await act(async () => {
        await result.current.pause();
      });

      expect(result.current.isPlaying).toBe(false);
      expect(mockPause).toHaveBeenCalled();
    });

    it('should toggle play/pause correctly', async () => {
      const { result } = renderHook(() => useAudioPlayer());

      // Start playing
      await act(async () => {
        await result.current.togglePlayPause();
      });

      expect(result.current.isPlaying).toBe(true);

      // Pause
      await act(async () => {
        await result.current.togglePlayPause();
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it('should stop playback', async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await result.current.play();
      });

      await act(async () => {
        await result.current.stop();
      });

      expect(result.current.isPlaying).toBe(false);
      expect(mockPause).toHaveBeenCalled();
      expect(mockSeekTo).toHaveBeenCalledWith(0);
    });
  });

  describe('Volume Control', () => {
    it('should set volume correctly', async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await result.current.setVolume(0.5);
      });

      expect(result.current.volume).toBe(0.5);
    });

    it('should clamp volume to 0-1 range', async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await result.current.setVolume(1.5);
      });

      expect(result.current.volume).toBe(1);

      await act(async () => {
        await result.current.setVolume(-0.5);
      });

      expect(result.current.volume).toBe(0);
    });

    it('should update player volume when playing', async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await result.current.play();
      });

      await act(async () => {
        await result.current.setVolume(0.7);
      });

      expect(mockPlayer.volume).toBe(0.7);
    });
  });

  describe('Error Handling', () => {
    it('should handle playback errors', async () => {
      mockReplace.mockImplementationOnce(() => {
        throw new Error('Network error');
      });

      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await result.current.play();
      });

      expect(result.current.error).toBe('Failed to load radio stream');
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Retry Connection', () => {
    it('should attempt reconnection', async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await result.current.retryConnection();
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on unmount', async () => {
      const { result, unmount } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await result.current.play();
      });

      unmount();
    });

    it('should cleanup resources when cleanup is called', async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await result.current.play();
      });

      await act(async () => {
        await result.current.cleanup();
      });
    });
  });
});
