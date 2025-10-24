import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService, { handleApiError } from '@/services/api';

interface ErrorState {
  hasError: boolean;
  errorMessage: string | null;
  errorType: 'network' | 'server' | 'auth' | 'unknown' | null;
  isRetrying: boolean;
  retryCount: number;
}

export const useErrorHandler = () => {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    errorMessage: null,
    errorType: null,
    isRetrying: false,
    retryCount: 0,
  });

  const handleError = useCallback((error: any, showAlert: boolean = true) => {
    console.error('Error caught:', error);
    
    let errorMessage = 'An unexpected error occurred';
    let errorType: ErrorState['errorType'] = 'unknown';
    
    // Determine error type and message
    if (error?.isNetworkError) {
      errorType = 'network';
      errorMessage = 'Network error. Please check your internet connection.';
    } else if (error?.status === 401) {
      errorType = 'auth';
      errorMessage = 'Authentication failed. Please log in again.';
      // Clear stored auth tokens
      AsyncStorage.multiRemove(['adminToken', 'adminUser']);
    } else if (error?.status >= 400 && error?.status < 500) {
      errorType = 'server';
      errorMessage = error?.message || 'Server error. Please try again.';
    } else if (error?.status >= 500) {
      errorType = 'server';
      errorMessage = 'Server error. Please try again later.';
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    setErrorState({
      hasError: true,
      errorMessage,
      errorType,
      isRetrying: false,
      retryCount: errorState.retryCount,
    });
    
    if (showAlert) {
      Alert.alert('Error', errorMessage);
    }
  }, [errorState.retryCount]);

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      errorMessage: null,
      errorType: null,
      isRetrying: false,
      retryCount: 0,
    });
  }, []);

  const retryAction = useCallback(async (action: () => Promise<any>, maxRetries: number = 3) => {
    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
    }));
    
    try {
      const result = await action();
      clearError();
      return result;
    } catch (error: any) {
      if (errorState.retryCount >= maxRetries - 1) {
        // Max retries reached, show final error
        handleError(error, true);
        setErrorState(prev => ({
          ...prev,
          isRetrying: false,
        }));
        throw error;
      } else {
        // Still have retries, continue with error but don't show alert yet
        handleError(error, false);
        // Wait a bit before next retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (errorState.retryCount + 1)));
        throw error;
      }
    }
  }, [errorState.retryCount]);

  const withErrorHandling = useCallback(async <T>(
    action: () => Promise<T>,
    options?: {
      showAlert?: boolean;
      retryable?: boolean;
      maxRetries?: number;
    }
  ): Promise<T> => {
    const { showAlert = true, retryable = false, maxRetries = 3 } = options || {};
    
    try {
      return await action();
    } catch (error: any) {
      if (retryable) {
        return retryAction(() => action(), maxRetries);
      } else {
        handleError(error, showAlert);
        throw error;
      }
    }
  }, [errorState.retryCount, handleError]);

  return {
    errorState,
    handleError,
    clearError,
    retryAction,
    withErrorHandling,
  };
};