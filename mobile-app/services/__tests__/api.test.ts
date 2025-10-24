import ApiService from '../api';
import CacheService from '../cache';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
  multiGet: jest.fn(),
}));

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        data: { success: true, token: 'test-token', user: { id: '1', email: 'test@example.com' } }
      };
      
      // Mock the axios post method
      const mockAxios = require('axios');
      mockAxios.create().post.mockResolvedValue(mockResponse);
      
      const result = await ApiService.login('test@example.com', 'password');
      
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle login error', async () => {
      const mockError = {
        response: { status: 401, data: { error: 'Invalid credentials' } }
      };
      
      // Mock the axios post method to reject
      const mockAxios = require('axios');
      mockAxios.create().post.mockRejectedValue(mockError);
      
      await expect(ApiService.login('test@example.com', 'wrong-password')).rejects.toEqual(mockError);
    });
  });

  describe('Social Links', () => {
    it('should get social links', async () => {
      const mockLinks = [
        { id: '1', platform: 'facebook', url: 'https://facebook.com/enishradio', title: 'Facebook' }
      ];
      
      const mockAxios = require('axios');
      mockAxios.create().get.mockResolvedValue({ data: mockLinks });
      
      const result = await ApiService.getSocialLinks();
      
      expect(result).toEqual(mockLinks);
    });

    it('should create social link', async () => {
      const newLink = { platform: 'twitter', url: 'https://twitter.com/enishradio', title: 'Twitter' };
      const mockResponse = { data: { ...newLink, id: '2' } };
      
      const mockAxios = require('axios');
      mockAxios.create().post.mockResolvedValue(mockResponse);
      
      const result = await ApiService.createSocialLink(newLink);
      
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Ad Banners', () => {
    it('should get ad banners', async () => {
      const mockBanners = [
        { id: '1', title: 'Test Ad', imageUrl: 'https://example.com/ad.jpg', targetUrl: 'https://example.com' }
      ];
      
      const mockAxios = require('axios');
      mockAxios.create().get.mockResolvedValue({ data: mockBanners });
      
      const result = await ApiService.getAdBanners();
      
      expect(result).toEqual(mockBanners);
    });
  });

  describe('Stream Metadata', () => {
    it('should get stream metadata', async () => {
      const mockMetadata = [
        { id: '1', title: 'Test Track', artist: 'Test Artist', startTime: '2024-01-01T00:00:00Z' }
      ];
      
      const mockAxios = require('axios');
      mockAxios.create().get.mockResolvedValue({ data: mockMetadata });
      
      const result = await ApiService.getStreamMetadata();
      
      expect(result).toEqual(mockMetadata);
    });
  });
});

describe('CacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set and get cache item', async () => {
    const testData = { id: '1', name: 'Test Item' };
    
    await CacheService.set('test-key', testData);
    const result = await CacheService.get('test-key');
    
    expect(result).toEqual(testData);
  });

  it('should return null for expired cache', async () => {
    const testData = { id: '1', name: 'Test Item' };
    const expiredTTL = 1; // 1ms, will be expired immediately
    
    await CacheService.set('test-key', testData, expiredTTL);
    const result = await CacheService.get('test-key');
    
    expect(result).toBeNull();
  });

  it('should remove cache item', async () => {
    const testData = { id: '1', name: 'Test Item' };
    
    await CacheService.set('test-key', testData);
    await CacheService.remove('test-key');
    const result = await CacheService.get('test-key');
    
    expect(result).toBeNull();
  });

  it('should clear all cache', async () => {
    await CacheService.set('test-key-1', { id: '1' });
    await CacheService.set('test-key-2', { id: '2' });
    
    await CacheService.clear();
    
    const result1 = await CacheService.get('test-key-1');
    const result2 = await CacheService.get('test-key-2');
    
    expect(result1).toBeNull();
    expect(result2).toBeNull();
  });
});