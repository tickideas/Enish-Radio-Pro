import { useState, useEffect, useRef, useCallback } from 'react';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS, AVPlaybackStatus } from 'expo-av';
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

  const soundRef = useRef<Audio.Sound | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);
  const autoPlayAttemptedRef = useRef(false);
  const autoPlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const metadataIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } catch (error) {
        console.error('Error cleaning up audio:', error);
      }
    }
  }, []);

  const updateState = useCallback((updates: Partial<AudioPlayerState>) => {
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error('Error setting up audio mode:', error);
      }
    };

    setupAudio();

    return () => {
      isMountedRef.current = false;
      clearAllTimers();
      void cleanup();
    };
  }, [cleanup, clearAllTimers]);

  const loadAndPlay = useCallback(async (streamUrl: string) => {
    if (!isMountedRef.current) return;

    try {
      updateState({ isLoading: true, error: null, isBuffering: true });

      await cleanup();

      const { sound } = await Audio.Sound.createAsync(
        { uri: streamUrl },
        {
          shouldPlay: true,
          isLooping: true,
          volume: state.volume,
        },
        (status: AVPlaybackStatus) => {
          if (!isMountedRef.current) return;

          if (status.isLoaded) {
            updateState({
              isPlaying: status.isPlaying || false,
              isBuffering: status.isBuffering || false,
            });
          } else {
            if ('error' in status && status.error) {
              updateState({
                error: `Playback error: ${status.error}`,
                isLoading: false,
                isBuffering: false,
                isPlaying: false,
              });
            }
          }
        }
      );

      if (!isMountedRef.current) {
        await sound.unloadAsync();
        return;
      }

      soundRef.current = sound;
      reconnectAttemptsRef.current = 0;

      updateState({ 
        isPlaying: true, 
        isLoading: false, 
        isBuffering: false,
        error: null 
      });

    } catch (error) {
      console.error('Error loading stream:', error);
      if (isMountedRef.current) {
        updateState({ 
          error: 'Failed to load radio stream', 
          isLoading: false,
          isBuffering: false 
        });
      }
    }
  }, [state.volume, cleanup, updateState]);

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
      if (soundRef.current) {
        await soundRef.current.playAsync();
        updateState({ isPlaying: true });
      } else {
        await loadAndPlay(RADIO_STREAMS.PRIMARY_MP3);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      updateState({ error: 'Failed to play audio' });
    }
  }, [loadAndPlay, updateState]);

  const pause = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        updateState({ isPlaying: false });
      }
    } catch (error) {
      console.error('Error pausing audio:', error);
      updateState({ error: 'Failed to pause audio' });
    }
  }, [updateState]);

  const stop = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        updateState({ isPlaying: false });
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
      updateState({ error: 'Failed to stop audio' });
    }
  }, [updateState]);

  const setVolume = useCallback(async (volume: number) => {
    try {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      updateState({ volume: clampedVolume });
      
      if (soundRef.current) {
        await soundRef.current.setVolumeAsync(clampedVolume);
      }
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  }, [updateState]);

  const retryConnection = useCallback(async () => {
    if (reconnectAttemptsRef.current >= AUDIO_CONFIG.RECONNECT_ATTEMPTS) {
      updateState({ 
        error: 'Max reconnection attempts reached. Please check your connection.' 
      });
      return;
    }

    reconnectAttemptsRef.current++;
    updateState({ isLoading: true, error: null });

    const streamUrl = reconnectAttemptsRef.current === 1 
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
              duration: 0
            }
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
              duration: 0
            }
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
