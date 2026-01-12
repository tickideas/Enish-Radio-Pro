import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  useAudioPlayer as useExpoAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from 'expo-audio';
import { RADIO_STREAMS, AUDIO_CONFIG } from '@/constants/radio';

export interface TrackMetadata {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: string;
  duration?: number;
}

export interface AudioPlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  metadata: TrackMetadata;
  volume: number;
  isBuffering: boolean;
}

export const useAudioPlayer = () => {
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isLoading: false,
    error: null,
    metadata: {},
    volume: 1.0,
    isBuffering: false,
  });

  const player = useExpoAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);
  const autoPlayAttemptedRef = useRef(false);
  const autoPlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const metadataIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentStreamUrlRef = useRef<string | null>(null);

  const clearAllTimers = useCallback(() => {
    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current);
      autoPlayTimeoutRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (metadataIntervalRef.current) {
      clearInterval(metadataIntervalRef.current);
      metadataIntervalRef.current = null;
    }
  }, []);

  const cleanup = useCallback(async () => {
    clearAllTimers();
    currentStreamUrlRef.current = null;
  }, [clearAllTimers]);

  const updateState = useCallback((updates: Partial<AudioPlayerState>) => {
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) return;

    const isPlaying = status.playing;
    const isBuffering = status.isBuffering;

    updateState({
      isPlaying,
      isBuffering,
      isLoading: !status.isLoaded && currentStreamUrlRef.current !== null,
    });
  }, [status.playing, status.isBuffering, status.isLoaded, updateState]);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMix',
        });
      } catch (error) {
        console.error('Error setting up audio mode:', error);
      }
    };

    setupAudio();

    return () => {
      isMountedRef.current = false;
      clearAllTimers();
    };
  }, [clearAllTimers]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'inactive' || nextAppState === 'background') {
        return;
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const loadAndPlay = useCallback(async (streamUrl: string) => {
    if (!isMountedRef.current) return;

    try {
      updateState({ isLoading: true, error: null, isBuffering: true });
      currentStreamUrlRef.current = streamUrl;

      player.replace({ uri: streamUrl });
      player.loop = true;
      player.volume = state.volume;
      player.play();

      setTimeout(() => {
        if (isMountedRef.current && player.setActiveForLockScreen) {
          try {
            player.setActiveForLockScreen(true, {
              title: 'Enish Radio Live',
              artist: '24/7 Music Stream',
            });
          } catch (e) {
            console.warn('Lock screen controls not supported:', e);
          }
        }
      }, 500);

      reconnectAttemptsRef.current = 0;

      updateState({
        isPlaying: true,
        isLoading: false,
        isBuffering: false,
        error: null,
      });
    } catch (error) {
      console.error('Error loading stream:', error);
      if (isMountedRef.current) {
        updateState({
          error: 'Failed to load radio stream',
          isLoading: false,
          isBuffering: false,
        });
      }
    }
  }, [player, state.volume, updateState]);

  useEffect(() => {
    const attemptAutoPlay = async () => {
      if (autoPlayAttemptedRef.current) return;

      try {
        const { CacheService } = await import('@/services/cache');
        const autoPlayEnabled = await CacheService.getAutoPlaySetting();

        if (autoPlayEnabled && isMountedRef.current) {
          autoPlayAttemptedRef.current = true;
          autoPlayTimeoutRef.current = setTimeout(async () => {
            if (!isMountedRef.current) return;
            try {
              await loadAndPlay(RADIO_STREAMS.PRIMARY_MP3);
            } catch (error) {
              console.error('Auto-play failed:', error);
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error checking auto-play setting:', error);
      }
    };

    attemptAutoPlay();
  }, [loadAndPlay]);

  const play = useCallback(async () => {
    try {
      if (currentStreamUrlRef.current) {
        player.play();
        updateState({ isPlaying: true });
      } else {
        await loadAndPlay(RADIO_STREAMS.PRIMARY_MP3);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      updateState({ error: 'Failed to play audio' });
    }
  }, [player, loadAndPlay, updateState]);

  const pause = useCallback(async () => {
    try {
      player.pause();
      updateState({ isPlaying: false });
    } catch (error) {
      console.error('Error pausing audio:', error);
      updateState({ error: 'Failed to pause audio' });
    }
  }, [player, updateState]);

  const stop = useCallback(async () => {
    try {
      player.pause();
      player.seekTo(0);
      updateState({ isPlaying: false });
    } catch (error) {
      console.error('Error stopping audio:', error);
      updateState({ error: 'Failed to stop audio' });
    }
  }, [player, updateState]);

  const setVolume = useCallback(async (volume: number) => {
    try {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      updateState({ volume: clampedVolume });
      player.volume = clampedVolume;
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  }, [player, updateState]);

  const retryConnection = useCallback(async () => {
    if (reconnectAttemptsRef.current >= AUDIO_CONFIG.RECONNECT_ATTEMPTS) {
      updateState({
        error: 'Max reconnection attempts reached. Please check your connection.',
      });
      return;
    }

    reconnectAttemptsRef.current++;
    updateState({ isLoading: true, error: null });

    const streamUrl =
      reconnectAttemptsRef.current === 1
        ? RADIO_STREAMS.PRIMARY_MP3
        : RADIO_STREAMS.FALLBACK_M3U;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        loadAndPlay(streamUrl);
      }
    }, AUDIO_CONFIG.RECONNECT_DELAY * reconnectAttemptsRef.current);
  }, [loadAndPlay, updateState]);

  const togglePlayPause = useCallback(async () => {
    if (state.isPlaying) {
      await pause();
    } else {
      await play();
    }
  }, [state.isPlaying, play, pause]);

  useEffect(() => {
    if (metadataIntervalRef.current) {
      clearInterval(metadataIntervalRef.current);
      metadataIntervalRef.current = null;
    }

    if (!state.isPlaying || state.error) {
      return;
    }

    const fetchMetadata = async () => {
      if (!isMountedRef.current || !state.isPlaying) return;

      try {
        const { RadioKingService } = await import('@/services/radioKing');
        const response = await RadioKingService.getCurrentTrack();

        if (!isMountedRef.current) return;

        if (response.success && response.data) {
          const appFormat = RadioKingService.convertToAppFormat(response.data);
          updateState({ metadata: appFormat });
        } else {
          updateState({
            metadata: {
              title: 'Enish Radio Live',
              artist: '24/7 Music Stream',
              album: 'Live Stream',
              artwork: '',
              duration: 0,
            },
          });
        }
      } catch (error) {
        console.error('Error fetching RadioKing metadata:', error);
        if (isMountedRef.current) {
          updateState({
            metadata: {
              title: 'Enish Radio Live',
              artist: '24/7 Music Stream',
              album: 'Live Stream',
              artwork: '',
              duration: 0,
            },
          });
        }
      }
    };

    fetchMetadata();
    metadataIntervalRef.current = setInterval(fetchMetadata, 15000);

    return () => {
      if (metadataIntervalRef.current) {
        clearInterval(metadataIntervalRef.current);
        metadataIntervalRef.current = null;
      }
    };
  }, [state.isPlaying, state.error, updateState]);

  const triggerAutoPlay = useCallback(async () => {
    if (autoPlayAttemptedRef.current) return;

    try {
      autoPlayAttemptedRef.current = true;
      await loadAndPlay(RADIO_STREAMS.PRIMARY_MP3);
    } catch (error) {
      console.error('Manual auto-play failed:', error);
      updateState({ error: 'Failed to start auto-play' });
    }
  }, [loadAndPlay, updateState]);

  return {
    ...state,
    play,
    pause,
    stop,
    setVolume,
    togglePlayPause,
    retryConnection,
    cleanup,
    triggerAutoPlay,
  };
};
