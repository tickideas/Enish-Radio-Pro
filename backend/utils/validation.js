/**
 * Input validation utilities
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 * Only allows http and https protocols for security
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
export function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols to prevent javascript:, data:, file: etc.
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate date range (endDate > startDate)
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {boolean}
 */
export function isValidDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return false;
  }
  
  return end > start;
}

/**
 * Sanitize string input
 * @param {string} input - String to sanitize
 * @returns {string}
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Validate admin count prevents deletion
 * Used to ensure at least one admin remains active
 * @param {number} adminCount - Current admin count
 * @returns {boolean}
 */
export function canRemoveAdmin(adminCount) {
  return adminCount > 1;
}
