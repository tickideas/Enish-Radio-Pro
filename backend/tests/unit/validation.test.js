 import {
   isValidEmail,
   isValidUrl,
   isValidDateRange,
   sanitizeString,
   canRemoveAdmin,
 } from '../../utils/validation.js';
 
 describe('Validation Utilities', () => {
   describe('isValidEmail', () => {
     it('should return true for valid emails', () => {
       expect(isValidEmail('test@example.com')).toBe(true);
       expect(isValidEmail('user.name@domain.org')).toBe(true);
       expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
     });
 
     it('should return false for invalid emails', () => {
       expect(isValidEmail('')).toBe(false);
       expect(isValidEmail('invalid')).toBe(false);
       expect(isValidEmail('invalid@')).toBe(false);
       expect(isValidEmail('@domain.com')).toBe(false);
       expect(isValidEmail('user@.com')).toBe(false);
       expect(isValidEmail('user name@domain.com')).toBe(false);
     });
   });
 
   describe('isValidUrl', () => {
     it('should return true for valid http/https URLs', () => {
       expect(isValidUrl('https://example.com')).toBe(true);
       expect(isValidUrl('http://example.com')).toBe(true);
       expect(isValidUrl('https://sub.example.com/path?query=1')).toBe(true);
       expect(isValidUrl('http://localhost:3000')).toBe(true);
     });
 
     it('should return false for dangerous URL schemes', () => {
       expect(isValidUrl('javascript:alert(1)')).toBe(false);
       expect(isValidUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
       expect(isValidUrl('file:///etc/passwd')).toBe(false);
       expect(isValidUrl('ftp://example.com')).toBe(false);
     });
 
     it('should return false for invalid URLs', () => {
       expect(isValidUrl('')).toBe(false);
       expect(isValidUrl('not a url')).toBe(false);
       expect(isValidUrl('example.com')).toBe(false);
     });
   });
 
   describe('isValidDateRange', () => {
     it('should return true when end date is after start date', () => {
       expect(isValidDateRange('2024-01-01', '2024-12-31')).toBe(true);
       expect(isValidDateRange(new Date('2024-01-01'), new Date('2024-12-31'))).toBe(true);
     });
 
     it('should return false when end date is before or equal to start date', () => {
       expect(isValidDateRange('2024-12-31', '2024-01-01')).toBe(false);
       expect(isValidDateRange('2024-01-01', '2024-01-01')).toBe(false);
     });
 
     it('should return false for invalid dates', () => {
       expect(isValidDateRange('invalid', '2024-12-31')).toBe(false);
       expect(isValidDateRange('2024-01-01', 'invalid')).toBe(false);
       expect(isValidDateRange('invalid', 'invalid')).toBe(false);
     });
   });
 
   describe('sanitizeString', () => {
     it('should trim and remove angle brackets', () => {
       expect(sanitizeString('  hello world  ')).toBe('hello world');
       expect(sanitizeString('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
       expect(sanitizeString('hello <b>world</b>')).toBe('hello bworld/b');
     });
 
     it('should return empty string for non-strings', () => {
       expect(sanitizeString(null)).toBe('');
       expect(sanitizeString(undefined)).toBe('');
       expect(sanitizeString(123)).toBe('');
     });
   });
 
   describe('canRemoveAdmin', () => {
     it('should return true when admin count is greater than 1', () => {
       expect(canRemoveAdmin(2)).toBe(true);
       expect(canRemoveAdmin(10)).toBe(true);
     });
 
     it('should return false when admin count is 1 or less', () => {
       expect(canRemoveAdmin(1)).toBe(false);
       expect(canRemoveAdmin(0)).toBe(false);
     });
   });
 });
