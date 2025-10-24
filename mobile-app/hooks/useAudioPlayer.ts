import { useState, useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
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

  // Initialize audio session
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
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
      cleanup();
    };
  }, []);

  // Handle auto-play on app launch
  useEffect(() => {
    const attemptAutoPlay = async () => {
      if (autoPlayAttemptedRef.current) return;
      
      try {
        const { CacheService } = await import('@/services/cache');
        const autoPlayEnabled = await CacheService.getAutoPlaySetting();
        
        if (autoPlayEnabled) {
          autoPlayAttemptedRef.current = true;
          // Small delay to ensure app is fully loaded
          setTimeout(async () => {
            try {
              await loadAndPlay(RADIO_STREAMS.PRIMARY_MP3);
            } catch (error) {
              console.error('Auto-play failed:', error);
              // Don't show error to user for auto-play failure
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error checking auto-play setting:', error);
      }
    };

    attemptAutoPlay();
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

  const loadAndPlay = useCallback(async (streamUrl: string) => {
    try {
      updateState({ isLoading: true, error: null, isBuffering: true });

      // Clean up existing sound
      await cleanup();

      // Create new sound instance
      const { sound } = await Audio.Sound.createAsync(
        { uri: streamUrl },
        {
          shouldPlay: true,
          isLooping: true,
          volume: state.volume,
        },
        (status: any) => {
          if (status.isLoaded) {
            updateState({
              isPlaying: status.isPlaying || false,
              isBuffering: status.isBuffering || false,
            });

            if ('error' in status && status.error) {
              updateState({
                error: `Playback error: ${status.error}`,
                isLoading: false,
                isBuffering: false
              });
            }
          }
        }
      );

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
      updateState({ 
        error: 'Failed to load radio stream', 
        isLoading: false,
        isBuffering: false 
      });
    }
  }, [state.volume, cleanup, updateState]);

  const play = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.playAsync();
        updateState({ isPlaying: true });
      } else {
        // Try primary stream first
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

    // Try fallback stream if primary failed
    const streamUrl = reconnectAttemptsRef.current === 1 
      ? RADIO_STREAMS.PRIMARY_MP3 
      : RADIO_STREAMS.FALLBACK_M3U;

    setTimeout(() => {
      loadAndPlay(streamUrl);
    }, AUDIO_CONFIG.RECONNECT_DELAY * reconnectAttemptsRef.current);
  }, [loadAndPlay, updateState]);

  const togglePlayPause = useCallback(async () => {
    if (state.isPlaying) {
      await pause();
    } else {
      await play();
    }
  }, [state.isPlaying, play, pause]);

  // Simulate metadata updates (in real app, this would come from API)
  useEffect(() => {
    const metadataInterval = setInterval(() => {
      if (state.isPlaying && !state.error) {
        updateState({
          metadata: {
            title: 'Current Track',
            artist: 'Enish Radio',
            album: 'Live Stream',
          }
        });
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(metadataInterval);
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