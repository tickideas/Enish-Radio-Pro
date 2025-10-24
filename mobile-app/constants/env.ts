// Environment configuration
import { DEVELOPMENT_CONFIG } from './env.development';
import { PRODUCTION_CONFIG } from './env.production';

// Determine which config to use based on __DEV__ flag
const ENV_CONFIG = __DEV__ ? DEVELOPMENT_CONFIG : PRODUCTION_CONFIG;

export default ENV_CONFIG;

// Export individual values for convenience
export const API_URL = ENV_CONFIG.API_URL;
export const ANALYTICS_ENABLED = ENV_CONFIG.ANALYTICS_ENABLED;
export const DEBUG_MODE = ENV_CONFIG.DEBUG_MODE;
