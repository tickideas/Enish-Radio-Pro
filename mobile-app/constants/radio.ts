// Radio Stream Configuration
export const RADIO_STREAMS = {
  PRIMARY_MP3: 'https://play.radioking.io/enishradio',
  FALLBACK_M3U: 'https://api.radioking.io/radio/771647/listen.m3u',
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'Enish Radio',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'contact@enish.co.uk',
  WEBSITE: 'https://www.enish.co.uk',
  ANDROID_PACKAGE: 'com.enishradio.pro',
  IOS_APP_ID: '123456789', // TODO: Replace with actual App Store ID when published
  PLAY_STORE_URL: 'https://play.google.com/store/apps/details?id=com.enishradio.pro',
  APP_STORE_URL: 'https://apps.apple.com/app/id123456789', // TODO: Replace with actual App Store URL
};

// Sleep Timer Options (in minutes)
export const SLEEP_TIMER_OPTIONS = [5, 10, 15, 30, 60];

// API Endpoints
// Import the environment-specific configuration
import { API_URL } from './env';

export const API_ENDPOINTS = {
  BASE_URL: API_URL,
  SOCIAL_LINKS: '/social-links',
  MENU_ITEMS: '/menu-items',
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

// Colors - Extracted from Enish Radio Brand Logo
export const COLORS = {
  // Primary brand colors from logo
  PRIMARY: '#B22234',        // Deep Red/Maroon (headphones, main accent)
  SECONDARY: '#1FA8A0',      // Teal/Cyan (equalizer bars)
  ACCENT: '#B8975A',         // Gold/Tan (ENISH text)
  YELLOW: '#FFB81C',         // Bright Yellow (equalizer bars, RADIO text)

  // Background colors
  BACKGROUND: '#FDFCFB',     // Warm off-white/cream
  BACKGROUND_DARK: '#121212',
  CARD: '#FFF8F0',           // Light cream for cards
  CARD_DARK: '#1E1E1E',

  // Text colors
  TEXT: '#1C1C1C',           // Near black
  TEXT_DARK: '#FFFFFF',
  TEXT_SECONDARY: '#6B6B6B', // Gray for secondary text

  // Border colors
  BORDER: '#E8DDD0',         // Light tan border
  BORDER_DARK: '#333333',

  // Additional brand colors from equalizer
  EQUALIZER_RED: '#B22234',
  EQUALIZER_TEAL: '#1FA8A0',
  EQUALIZER_YELLOW: '#FFB81C',
  EQUALIZER_BLACK: '#1C1C1C',
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
