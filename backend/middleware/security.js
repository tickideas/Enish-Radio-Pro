/**
 * Enhanced Security Middleware for Enish Radio Pro Backend
 * Implements comprehensive security headers, rate limiting, and input validation
 */

import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { cors } from 'hono/cors'
import { z } from 'zod'

// Enhanced Security Headers Configuration
export const securityHeaders = secureHeaders({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.enishradio.com", "wss:", "ws:"],
      mediaSrc: ["'self'", "https:", "blob:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  xFrameOptions: { action: 'deny' },
  xContentTypeOptions: { nosniff: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    payment: [],
  },
})

// Enhanced Rate Limiting Configuration
export const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  const rateMap = new Map()
  
  return async (c, next) => {
    try {
      const ip = c.req.header('x-forwarded-for') || 
                 c.req.header('x-real-ip') || 
                 c.req.raw?.socket?.remoteAddress || 
                 'unknown'
      
      const now = Date.now()
      const record = rateMap.get(ip) || { start: now, count: 0, requests: [] }
      
      // Clean old requests
      record.requests = record.requests.filter(time => now - time < windowMs)
      
      if (record.requests.length >= max) {
        return c.json({ 
          error: 'Too many requests from this IP, please try again later.',
          retryAfter: Math.ceil((record.requests[0] + windowMs - now) / 1000)
        }, 429)
      }
      
      record.requests.push(now)
      rateMap.set(ip, record)
      
      // Set rate limit headers
      c.header('X-RateLimit-Limit', max.toString())
      c.header('X-RateLimit-Remaining', (max - record.requests.length).toString())
      c.header('X-RateLimit-Reset', new Date(record.requests[0] + windowMs).toISOString())
      
      await next()
    } catch (error) {
      console.error('Rate limiting error:', error)
      await next() // Fail open on rate limiter errors
    }
  }
}

// Stricter rate limits for different endpoint types
export const apiRateLimiter = createRateLimiter(15 * 60 * 1000, 100) // 100 requests per 15 minutes
export const authRateLimiter = createRateLimiter(15 * 60 * 1000, 5) // 5 auth attempts per 15 minutes
export const uploadRateLimiter = createRateLimiter(60 * 60 * 1000, 10) // 10 uploads per hour

// Input Validation Schemas using Zod
export const validationSchemas = {
  // Auth endpoints
  login: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(100)
  }),
  
  register: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(100),
    role: z.enum(['admin', 'moderator']).optional()
  }),
  
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters').max(100)
  }),
  
  // Social links
  createSocialLink: z.object({
    platform: z.enum(['facebook', 'twitter', 'instagram', 'youtube', 'website', 'tiktok', 'linkedin']),
    url: z.string().url('Invalid URL format'),
    displayName: z.string().min(1, 'Display name is required').max(50),
    icon: z.string().min(1, 'Icon is required').max(50),
    order: z.number().int().min(0).optional(),
    isActive: z.boolean().optional()
  }),
  
  updateSocialLink: z.object({
    platform: z.enum(['facebook', 'twitter', 'instagram', 'youtube', 'website', 'tiktok', 'linkedin']).optional(),
    url: z.string().url('Invalid URL format').optional(),
    displayName: z.string().min(1, 'Display name is required').max(50).optional(),
    icon: z.string().min(1, 'Icon is required').max(50).optional(),
    order: z.number().int().min(0).optional(),
    isActive: z.boolean().optional()
  }),
  
  // Ad banners
  createAdBanner: z.object({
    title: z.string().min(1, 'Title is required').max(100),
    targetUrl: z.string().url('Invalid URL format'),
    description: z.string().max(500).optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    priority: z.number().int().min(0).max(100).optional(),
    imageUrl: z.string().url('Invalid URL format').optional(),
    cloudinaryPublicId: z.string().optional()
  }),
  
  updateAdBanner: z.object({
    title: z.string().min(1, 'Title is required').max(100).optional(),
    targetUrl: z.string().url('Invalid URL format').optional(),
    description: z.string().max(500).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    priority: z.number().int().min(0).max(100).optional(),
    isActive: z.boolean().optional(),
    imageUrl: z.string().url('Invalid URL format').optional(),
    cloudinaryPublicId: z.string().optional()
  }),
  
  // User management
  updateUser: z.object({
    role: z.enum(['admin', 'moderator']).optional(),
    isActive: z.boolean().optional(),
    email: z.string().email('Invalid email format').optional()
  }),
  
  // Analytics
  analyticsTimeframe: z.enum(['day', 'week', 'month']).optional()
}

// Input validation middleware
export const validateInput = (schema) => {
  return async (c, next) => {
    try {
      const contentType = c.req.header('content-type') || ''
      let data = {}
      
      if (contentType.includes('application/json')) {
        data = await c.req.json()
      } else if (contentType.includes('multipart/form-data')) {
        data = await c.req.parseBody()
      }
      
      const result = schema.safeParse(data)
      
      if (!result.success) {
        return c.json({
          error: 'Validation failed',
          details: result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }, 400)
      }
      
      // Add validated data to context
      c.set('validatedData', result.data)
      await next()
    } catch (error) {
      console.error('Input validation error:', error)
      return c.json({
        error: 'Invalid request data',
        details: 'Unable to parse request body'
      }, 400)
    }
  }
}

// CORS configuration
export const corsMiddleware = cors({
  origin: (origin) => {
    const allowedOrigins = [
      'http://localhost:8081',
      'http://192.168.1.80:8081',
      'exp://192.168.1.80:8081',
      'http://localhost:3000',
      'https://enishradio.com',
      'https://app.enishradio.com'
    ]
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return true
    
    return allowedOrigins.includes(origin)
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'User-Agent',
    'DNT',
    'Cache-Control',
    'X-Mx-ReqToken',
    'Keep-Alive',
    'X-Requested-With',
    'If-Modified-Since'
  ],
  exposeHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Total-Count'
  ]
})

// SQL Injection Prevention Helper
export const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input
      .replace(/[';\\]/g, '') // Remove potentially dangerous characters
      .trim()
      .substring(0, 1000) // Limit length
  }
  return input
}

// XSS Prevention Helper
export const sanitizeHtml = (input) => {
  if (typeof input !== 'string') return input
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .substring(0, 1000)
}

// File upload security validation
export const validateFileUpload = (maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp']) => {
  return async (c, next) => {
    try {
      const contentType = c.req.header('content-type') || ''
      
      if (!contentType.includes('multipart/form-data')) {
        return c.json({ error: 'Invalid content type for file upload' }, 400)
      }
      
      const body = await c.req.parseBody()
      const files = Object.values(body).filter(file => 
        typeof file === 'object' && 'name' in file && 'size' in file
      )
      
      for (const file of files) {
        // Validate file size
        if (file.size > maxSize) {
          return c.json({ 
            error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB` 
          }, 413)
        }
        
        // Validate file type
        if (!allowedTypes.includes(file.type)) {
          return c.json({ 
            error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` 
          }, 400)
        }
        
        // Validate file name
        const fileName = file.name || ''
        if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
          return c.json({ error: 'Invalid file name' }, 400)
        }
      }
      
      await next()
    } catch (error) {
      console.error('File upload validation error:', error)
      return c.json({ error: 'File upload validation failed' }, 400)
    }
  }
}

export default {
  securityHeaders,
  createRateLimiter,
  apiRateLimiter,
  authRateLimiter,
  uploadRateLimiter,
  validationSchemas,
  validateInput,
  corsMiddleware,
  sanitizeInput,
  sanitizeHtml,
  validateFileUpload
}