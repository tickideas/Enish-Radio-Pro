import { CacheService } from '../cache';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe('CacheService Auto-Play Functionality', () => {
  const mockAsyncStorage = require('@react-native-async-storage/async-storage');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Auto-Play Settings', () => {
    it('should get default auto-play setting when no preference saved', async () => {
      // Mock AsyncStorage.getItem to return null (no saved preference)
      mockAsyncStorage.getItem.mockResolvedValue(null);
      
      const autoPlaySetting = await CacheService.getAutoPlaySetting();
      
      expect(autoPlaySetting).toBe(true); // Should default to true
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('user_preferences');
    });

    it('should save and retrieve auto-play setting', async () => {
      // First, save a setting
      await CacheService.setAutoPlaySetting(false);
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'user_preferences',
        JSON.stringify({ autoPlayEnabled: false })
      );

      // Then retrieve it
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({ autoPlayEnabled: false })
      );
      
      const autoPlaySetting = await CacheService.getAutoPlaySetting();
      
      expect(autoPlaySetting).toBe(false);
    });

    it('should handle corrupted storage data gracefully', async () => {
      // Mock corrupted JSON data
      mockAsyncStorage.getItem.mockResolvedValue('invalid-json');
      
      const autoPlaySetting = await CacheService.getAutoPlaySetting();
      
      expect(autoPlaySetting).toBe(true); // Should fallback to default
    });

    it('should clear auto-play setting when cache is cleared', async () => {
      await CacheService.clearCache();
      
      expect(mockAsyncStorage.clear).toHaveBeenCalled();
    });
  });

  describe('User Preferences Management', () => {
    it('should save user preferences with auto-play setting', async () => {
      const preferences = { autoPlayEnabled: false };
      
      await CacheService.saveUserPreferences(preferences);
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'user_preferences',
        JSON.stringify(preferences)
      );
    });

    it('should load user preferences with default values', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      
      const preferences = await CacheService.getUserPreferences();
      
      expect(preferences).toEqual({ autoPlayEnabled: true });
    });
  });
});