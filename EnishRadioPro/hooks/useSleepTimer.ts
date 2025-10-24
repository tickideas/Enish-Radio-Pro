import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SLEEP_TIMER_OPTIONS, STORAGE_KEYS } from '@/constants/radio';

export interface SleepTimerState {
  isActive: boolean;
  remainingTime: number; // in seconds
  selectedMinutes: number;
  isPaused: boolean;
}

export const useSleepTimer = (onTimerEnd: () => void) => {
  const [state, setState] = useState<SleepTimerState>({
    isActive: false,
    remainingTime: 0,
    selectedMinutes: SLEEP_TIMER_OPTIONS[0],
    isPaused: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Load saved timer state on mount
  useEffect(() => {
    const loadTimerState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(STORAGE_KEYS.SLEEP_TIMER);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          if (parsedState.isActive && parsedState.remainingTime > 0) {
            setState(prev => ({
              ...prev,
              ...parsedState,
            }));
          }
        }
      } catch (error) {
        console.error('Error loading timer state:', error);
      }
    };

    loadTimerState();

    return () => {
      isMountedRef.current = false;
      clearTimer();
    };
  }, []);

  // Save timer state to storage
  const saveTimerState = useCallback(async (timerState: SleepTimerState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SLEEP_TIMER, JSON.stringify(timerState));
    } catch (error) {
      console.error('Error saving timer state:', error);
    }
  }, []);

  const updateState = useCallback((updates: Partial<SleepTimerState>) => {
    if (isMountedRef.current) {
      setState(prev => {
        const newState = { ...prev, ...updates };
        saveTimerState(newState);
        return newState;
      });
    }
  }, [saveTimerState]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback((minutes: number) => {
    clearTimer();
    
    const totalSeconds = minutes * 60;
    updateState({
      isActive: true,
      remainingTime: totalSeconds,
      selectedMinutes: minutes,
      isPaused: false,
    });

    intervalRef.current = setInterval(() => {
      setState(prev => {
        if (prev.remainingTime <= 1) {
          clearTimer();
          const finalState = {
            isActive: false,
            remainingTime: 0,
            selectedMinutes: prev.selectedMinutes,
            isPaused: false,
          };
          saveTimerState(finalState);
          
          // Trigger callback when timer ends
          if (isMountedRef.current) {
            onTimerEnd();
          }
          
          return finalState;
        }

        const newState = {
          ...prev,
          remainingTime: prev.remainingTime - 1,
        };
        
        saveTimerState(newState);
        return newState;
      });
    }, 1000);
  }, [clearTimer, updateState, saveTimerState, onTimerEnd]);

  const pauseTimer = useCallback(() => {
    clearTimer();
    updateState({ isPaused: true });
  }, [clearTimer, updateState]);

  const resumeTimer = useCallback(() => {
    if (state.remainingTime > 0) {
      updateState({ isPaused: false });
      
      intervalRef.current = setInterval(() => {
        setState(prev => {
          if (prev.remainingTime <= 1) {
            clearTimer();
            const finalState = {
              isActive: false,
              remainingTime: 0,
              selectedMinutes: prev.selectedMinutes,
              isPaused: false,
            };
            saveTimerState(finalState);
            
            if (isMountedRef.current) {
              onTimerEnd();
            }
            
            return finalState;
          }

          const newState = {
            ...prev,
            remainingTime: prev.remainingTime - 1,
          };
          
          saveTimerState(newState);
          return newState;
        });
      }, 1000);
    }
  }, [state.remainingTime, clearTimer, updateState, saveTimerState, onTimerEnd]);

  const stopTimer = useCallback(() => {
    clearTimer();
    updateState({
      isActive: false,
      remainingTime: 0,
      isPaused: false,
    });
  }, [clearTimer, updateState]);

  const toggleTimer = useCallback(() => {
    if (!state.isActive) {
      startTimer(state.selectedMinutes);
    } else if (state.isPaused) {
      resumeTimer();
    } else {
      pauseTimer();
    }
  }, [state.isActive, state.isPaused, state.selectedMinutes, startTimer, resumeTimer, pauseTimer]);

  const selectMinutes = useCallback((minutes: number) => {
    if (state.isActive) {
      Alert.alert(
        'Timer Active',
        'The timer is currently running. Stop it first to change the duration.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    updateState({ selectedMinutes: minutes });
  }, [state.isActive, updateState]);

  // Format remaining time for display
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Get progress percentage for UI
  const getProgress = useCallback((): number => {
    if (!state.isActive || state.remainingTime === 0) return 0;
    const totalTime = state.selectedMinutes * 60;
    return ((totalTime - state.remainingTime) / totalTime) * 100;
  }, [state.isActive, state.remainingTime, state.selectedMinutes]);

  return {
    ...state,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    toggleTimer,
    selectMinutes,
    formatTime,
    getProgress,
    availableOptions: SLEEP_TIMER_OPTIONS,
  };
};