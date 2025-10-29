// Radio Stream Configuration
export const RADIO_STREAMS = {
  PRIMARY_MP3: 'https://play.radioking.io/enishradio',
  FALLBACK_M3U: 'https://api.radioking.io/radio/771647/listen.m3u',
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'Enish Radio Pro',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@enishradio.com',
  WEBSITE: 'https://enishradio.com',
};

// Sleep Timer Options (in minutes)
export const SLEEP_TIMER_OPTIONS = [5, 10, 15, 30, 60];

// API Endpoints
// Import the environment-specific configuration
import { API_URL } from './env';

export const API_ENDPOINTS = {
  BASE_URL: API_URL,
  SOCIAL_LINKS: '/social-links',
  AD_BANNERS: '/ads',
  STREAM_METADATA: '/stream/metadata',
};

// Storage Keys
export const STORAGE_KEYS = {
  SLEEP_TIMER: 'sleep_timer',
  USER_PREFERENCES: 'user_preferences',
  FAVORITE_TRACKS: 'favorite_tracks',
  LAST_PLAYED: 'last_played',
  AUTO_PLAY: 'auto_play_enabled',
};

// Colors
export const COLORS = {
  PRIMARY: '#1E88E5',
  SECONDARY: '#42A5F5',
  ACCENT: '#FF6B6B',
  BACKGROUND: '#FFFFFF',
  BACKGROUND_DARK: '#121212',
  TEXT: '#333333',
  TEXT_DARK: '#FFFFFF',
  CARD: '#F5F5F5',
  CARD_DARK: '#1E1E1E',
  BORDER: '#E0E0E0',
  BORDER_DARK: '#333333',
};

// Social Media Platforms
export const SOCIAL_PLATFORMS = {
  FACEBOOK: 'facebook',
  TWITTER: 'twitter',
  INSTAGRAM: 'instagram',
  YOUTUBE: 'youtube',
  WEBSITE: 'website',
};

// Audio Player Configuration
export const AUDIO_CONFIG = {
  BUFFER_SIZE: 1024,
  MAX_BUFFER_SIZE: 12000,
  FADE_DURATION: 1000, // milliseconds
  RECONNECT_ATTEMPTS: 3,
  RECONNECT_DELAY: 2000, // milliseconds
};