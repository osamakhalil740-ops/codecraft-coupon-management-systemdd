/**
 * Application Configuration Constants
 * 
 * Centralized configuration management with environment variable validation
 */

import { logger } from '../utils/logger';

/**
 * Validate required environment variables
 */
function validateEnvVar(varName: string, fallback?: string): string {
  const value = process.env[varName];
  
  if (!value) {
    if (fallback) {
      logger.warn(`${varName} not set, using fallback: ${fallback}`);
      return fallback;
    }
    throw new Error(
      `Required environment variable ${varName} is not set. ` +
      `Please check your .env file or environment configuration.`
    );
  }
  
  return value;
}

/**
 * Application mode
 */
export const IS_DEV = process.env.NODE_ENV === 'development';
export const IS_PROD = process.env.NODE_ENV === 'production';
export const MODE = process.env.NODE_ENV || 'development';

/**
 * Application Version
 */
export const APP_VERSION = '2.0.0';

/**
 * Monitoring Configuration
 */
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || '';
export const ANALYTICS_ENABLED = IS_PROD;

/**
 * Super Admin Configuration
 * SECURITY: These emails should be set via environment variable
 * Supports multiple emails separated by comma
 */
const ADMIN_EMAIL_STRING = validateEnvVar(
  'VITE_ADMIN_EMAIL',
  IS_DEV ? 'admin@kobonz.site' : undefined
);

export const SUPER_ADMIN_EMAIL = ADMIN_EMAIL_STRING; // Keep for backward compatibility
export const SUPER_ADMIN_EMAILS = ADMIN_EMAIL_STRING
  .split(',')
  .map(email => email.trim())
  .filter(email => email.length > 0);

/**
 * Check if an email is a super admin
 */
export const isSuperAdmin = (email: string): boolean => {
  return SUPER_ADMIN_EMAILS.some(adminEmail => 
    adminEmail.toLowerCase() === email.toLowerCase()
  );
};

/**
 * GeoNames API Configuration
 */
export const GEONAMES_USERNAME = validateEnvVar(
  'VITE_GEONAMES_USERNAME',
  IS_DEV ? 'demo' : undefined
);

/**
 * Application URLs
 */
export const APP_URL = IS_PROD 
  ? 'https://kobonz.site' 
  : window.location.origin;

/**
 * Coupon Configuration
 */
export const COUPON_CONFIG = {
  CREATION_COST: 50, // Credits required to create a coupon
  DEFAULT_MAX_USES: 100,
  DEFAULT_VALIDITY_DAYS: 30,
  DEFAULT_DISCOUNT_PERCENTAGE: 10,
  DEFAULT_AFFILIATE_COMMISSION: 5,
  DEFAULT_CUSTOMER_REWARD: 10,
} as const;

/**
 * Credit System Configuration
 */
export const CREDIT_CONFIG = {
  STANDARD_SIGNUP_BONUS: 1000,
  REFERRED_SIGNUP_BONUS: 5000,
  REFERRER_BONUS: 10000, // Bonus when referred user redeems first coupon
  MIN_CREDIT_REQUEST: 100,
  MAX_CREDIT_REQUEST: 100000,
  CREDIT_REQUEST_INCREMENT: 100, // Must be multiple of this
} as const;

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  DEBOUNCE_DELAY: 300, // ms for search inputs
  AUTO_REFRESH_INTERVAL: 300000, // 5 minutes
  MAX_TOAST_DURATION: 5000, // ms
  PAGINATION_SIZE: 20,
  MAX_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

/**
 * Firebase Configuration
 * Note: These are public and safe to expose in client-side code
 */
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBg-9a8Qv7yohzmPQyPHi8zcKWrCxOp_hg",
  authDomain: "effortless-coupon-management.firebaseapp.com",
  projectId: "effortless-coupon-management",
  storageBucket: "effortless-coupon-management.firebasestorage.app",
  messagingSenderId: "674509917896",
  appId: "1:674509917896:web:4dab684ec72dff301adffd",
  measurementId: "G-5T0WC2L3JD"
} as const;

/**
 * Feature Flags
 * Toggle features on/off without code changes
 */
export const FEATURES = {
  ENABLE_OFFLINE_MODE: true,
  ENABLE_REAL_TIME_TRACKING: true,
  ENABLE_ANALYTICS: IS_PROD,
  ENABLE_ERROR_REPORTING: IS_PROD,
  ENABLE_DEBUG_LOGS: IS_DEV,
  ENABLE_LOCATION_CACHING: true,
} as const;

/**
 * API Rate Limits
 */
export const RATE_LIMITS = {
  COUPON_CLICK_THROTTLE: 1000, // 1 click per second
  API_CALL_THROTTLE: 500, // General API throttle
  SEARCH_DEBOUNCE: 300, // Search input debounce
} as const;

/**
 * Validation Limits
 */
export const VALIDATION_LIMITS = {
  COUPON_TITLE_MIN: 3,
  COUPON_TITLE_MAX: 100,
  COUPON_DESC_MIN: 10,
  COUPON_DESC_MAX: 500,
  USER_NAME_MIN: 2,
  USER_NAME_MAX: 100,
  PASSWORD_MIN: 6,
  PASSWORD_MAX: 128,
  MAX_USES_MIN: 1,
  MAX_USES_MAX: 10000,
  DISCOUNT_VALUE_MIN: 0.01,
  DISCOUNT_VALUE_MAX: 99999,
} as const;

/**
 * Export all configuration as a single object for easy access
 */
export const CONFIG = {
  MODE,
  IS_DEV,
  IS_PROD,
  SUPER_ADMIN_EMAIL,
  GEONAMES_USERNAME,
  APP_URL,
  COUPON: COUPON_CONFIG,
  CREDIT: CREDIT_CONFIG,
  UI: UI_CONFIG,
  FIREBASE: FIREBASE_CONFIG,
  FEATURES,
  RATE_LIMITS,
  VALIDATION: VALIDATION_LIMITS,
} as const;

// Log configuration in development
if (IS_DEV) {
  logger.debug('Application Configuration', {
    mode: MODE,
    superAdmins: SUPER_ADMIN_EMAILS,
    geonames: GEONAMES_USERNAME ? 'Configured' : 'Not configured',
    features: FEATURES,
  });
}
