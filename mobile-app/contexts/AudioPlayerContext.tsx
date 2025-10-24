import React, { createContext, useContext, ReactNode } from 'react';
import { useAudioPlayer, AudioPlayerState } from '@/hooks/useAudioPlayer';

// Create the context type
interface AudioPlayerContextType extends AudioPlayerState {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  retryConnection: () => Promise<void>;
  cleanup: () => Promise<void>;
  triggerAutoPlay: () => Promise<void>;
}

// Create the context
const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

// Provider component
export const AudioPlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const audioPlayer = useAudioPlayer();

  return (
    <AudioPlayerContext.Provider value={audioPlayer}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

// Custom hook to use the audio player context
export const useAudioPlayerContext = (): AudioPlayerContextType => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useAudioPlayerContext must be used within an AudioPlayerProvider');
  }
  return context;
};
