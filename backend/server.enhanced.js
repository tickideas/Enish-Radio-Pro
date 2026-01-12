/**
 * Enhanced Hono Server for Enish Radio Pro
 * Integrates advanced security, monitoring, and performance optimizations
 */

import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import cloudinary from 'cloudinary'
import { Readable } from 'node:stream'

// Drizzle DB & models
import db, { pool, testConnection, syncSchema } from './drizzle/db.js'
import UserModel from './drizzle/models/User.js'
import SocialLinkModel from './drizzle/models/SocialLink.js'
import AdBannerModel from './drizzle/models/AdBanner.js'

// Enhanced middleware
import {
  securityHeaders,
  corsMiddleware,
  apiRateLimiter,
  authRateLimiter,
  uploadRateLimiter,
  validationSchemas,
  validateInput,
  validateFileUpload
} from './middleware/security.js'

import {
  requestLogger,
  errorTracker,
  performanceTracker,
  detailedHealthCheck,
  metricsEndpoint,
  cleanup
} from './middleware/monitoring.js'

// Load environment variables
dotenv.config()

const app = new Hono()
const PORT = parseInt(process.env.PORT || '3000', 10)
const NODE_ENV = process.env.NODE_ENV || 'development'

// ===== Enhanced Global Middleware =====

// Request logging with detailed tracking
app.use('*', requestLogger)

// Security headers
app.use('*', securityHeaders)

// Enhanced CORS configuration
app.use('*', corsMiddleware)

// Performance tracking
app.use('*', performanceTracker)

// Error tracking and handling
app.use('*', errorTracker)

// API rate limiting (more restrictive for auth endpoints)
app.use('/api/auth/*', authRateLimiter)
app.use('/api/upload/*', uploadRateLimiter)
app.use('/api/*', apiRateLimiter)

// ===== Authentication Middleware =====

const getAuthUser = async (c) => {
  try {
    const authHeader = c.req.header('authorization') || ''
    if (!authHeader.startsWith('Bearer ')) return null
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await UserModel.findById(decoded.id)
    if (!user || !user.isActive) return null
    return { id: user.id, email: user.email, role: user.role }
  } catch (e) {
    return null
  }
}

const requireAuth = () => async (c, next) => {
  const user = await getAuthUser(c)
  if (!user) return c.json({ 
    error: 'Access denied. No token provided or invalid.',
    code: 'UNAUTHORIZED',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }, 401)
  c.set('user', user)
  await next()
}

const requireAdmin = () => async (c, next) => {
  const user = await getAuthUser(c)
  if (!user) return c.json({ 
    error: 'Access denied. No token provided or invalid.',
    code: 'UNAUTHORIZED',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }, 401)
  if (user.role !== 'admin') return c.json({ 
    error: 'Access denied. Admin privileges required.',
    code: 'FORBIDDEN',
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }, 403)
  c.set('user', user)
  await next()
}

// ===== Static Files & Admin Panel =====
app.use('/admin/*', serveStatic({ root: './public' }))
app.get('/admin', (c) => c.redirect('/admin/'))
app.get('/admin/', serveStatic({ path: './public/admin/index.html' }))

// ===== Enhanced Health Check =====
app.get('/api/health', detailedHealthCheck)

// ===== Metrics Endpoint =====
app.get('/api/metrics', metricsEndpoint)

// ===== Error Handler with Enhanced Context =====
app.onError((err, c) => {
  const requestId = c.get('requestId')
  console.error(`[${requestId}] Unhandled error:`, err)
  
  return c.json({
    error: 'Something went wrong!',
    message: NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    requestId,
    requestPath: c.req.path,
    requestMethod: c.req.method
  }, 500)
})

// ===== Enhanced Auth Routes with Validation =====

app.post('/api/auth/login', 
  validateInput(validationSchemas.login),
  async (c) => {
    try {
      const { email, password } = c.get('validatedData')
      const user = await UserModel.findByEmail(email)
      
      if (!user) return c.json({ 
        success: false, 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      }, 401)

      const isMatch = await UserModel.comparePassword(password, user.password)
      if (!isMatch) return c.json({ 
        success: false, 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      }, 401)

      await UserModel.updateLastLogin(user.id)

      const payload = { id: user.id, email: user.email, role: user.role }
      const token = jwt.sign(payload, process.env.JWT_SECRET, { 
        expiresIn: '24h',
        issuer: 'enish-radio-pro',
        audience: 'enish-radio-admin'
      })

      return c.json({ 
        success: true, 
        token, 
        user: payload,
        expiresIn: '24h',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Login error:', error)
      return c.json({ 
        success: false, 
        error: 'Server error during login',
        code: 'LOGIN_ERROR'
      }, 500)
    }
  }
)

app.post('/api/auth/register', 
  requireAdmin(),
  validateInput(validationSchemas.register),
  async (c) => {
    try {
      const { email, password, role = 'admin' } = c.get('validatedData')
      const user = c.get('user')

      // Only allow admins to create other admins
      if (role === 'admin' && user.role !== 'admin') {
        return c.json({ 
          success: false, 
          error: 'Only super admins can create admin users',
          code: 'INSUFFICIENT_PERMISSIONS'
        }, 403)
      }

      const existingUser = await UserModel.findByEmail(email)
      if (existingUser) return c.json({ 
        success: false, 
        error: 'User with this email already exists',
        code: 'USER_EXISTS'
      }, 400)

      await UserModel.create({ email, password, role })
      return c.json({ 
        success: true, 
        message: 'User registered successfully',
        timestamp: new Date().toISOString()
      }, 201)
    } catch (error) {
      console.error('Registration error:', error)
      return c.json({ 
        success: false, 
        error: 'Server error during registration',
        code: 'REGISTRATION_ERROR'
      }, 500)
    }
  }
)

app.post('/api/auth/change-password', 
  requireAdmin(),
  validateInput(validationSchemas.changePassword),
  async (c) => {
    try {
      const { currentPassword, newPassword } = c.get('validatedData')
      const user = c.get('user')

      const found = await UserModel.findById(user.id)
      if (!found) return c.json({ 
        success: false, 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, 404)

      const isMatch = await UserModel.comparePassword(currentPassword, found.password)
      if (!isMatch) return c.json({ 
        success: false, 
        error: 'Current password is incorrect',
        code: 'INVALID_PASSWORD'
      }, 401)

      const bcrypt = await import('bcryptjs')
      const hashed = await bcrypt.default.hash(newPassword, 12)
      await UserModel.updatePassword(user.id, hashed)

      return c.json({ 
        success: true, 
        message: 'Password changed successfully',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Change password error:', error)
      return c.json({ 
        success: false, 
        error: 'Server error during password change',
        code: 'PASSWORD_CHANGE_ERROR'
      }, 500)
    }
  }
)

app.get('/api/auth/verify', async (c) => {
  try {
    const authHeader = c.req.header('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) return c.json({ 
      success: false, 
      error: 'No token provided',
      code: 'NO_TOKEN'
    }, 401)
    
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'enish-radio-pro',
      audience: 'enish-radio-admin'
    })
    
    const user = await UserModel.findById(decoded.id)
    if (!user) return c.json({ 
      success: false, 
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    }, 401)
    
    return c.json({ 
      success: true, 
      user: { id: user.id, email: user.email, role: user.role },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Token verification error:', error)
    if (error.name === 'JsonWebTokenError') return c.json({ 
      success: false, 
      error: 'Token is not valid',
      code: 'INVALID_TOKEN'
    }, 401)
    if (error.name === 'TokenExpiredError') return c.json({ 
      success: false, 
      error: 'Token expired',
      code: 'TOKEN_EXPIRED'
    }, 401)
    return c.json({ 
      success: false, 
      error: 'Server error during token verification',
      code: 'TOKEN_VERIFICATION_ERROR'
    }, 500)
  }
})

app.post('/api/auth/refresh', async (c) => {
  try {
    const authHeader = c.req.header('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) return c.json({ 
      success: false, 
      error: 'No token provided',
      code: 'NO_TOKEN'
    }, 401)
    
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { 
      ignoreExpiration: true,
      issuer: 'enish-radio-pro',
      audience: 'enish-radio-admin'
    })
    
    const user = await UserModel.findById(decoded.id)
    if (!user || !user.isActive) return c.json({ 
      success: false, 
      error: 'User not found or inactive',
      code: 'USER_INVALID'
    }, 401)

    const newToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET, 
      { 
        expiresIn: '24h',
        issuer: 'enish-radio-pro',
        audience: 'enish-radio-admin'
      }
    )
    
    return c.json({ 
      success: true, 
      token: newToken,
      expiresIn: '24h',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    return c.json({ 
      success: false, 
      error: 'Server error during token refresh',
      code: 'TOKEN_REFRESH_ERROR'
    }, 500)
  }
})

app.get('/api/auth/users', requireAdmin(), async (c) => {
  try {
    const users = await UserModel.findAll()
    return c.json({ 
      success: true, 
      users,
      count: users.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get users error:', error)
    return c.json({ 
      success: false, 
      error: 'Server error while fetching users',
      code: 'FETCH_USERS_ERROR'
    }, 500)
  }
})

app.put('/api/auth/users/:id/role', 
  requireAdmin(),
  validateInput(validationSchemas.updateUser),
  async (c) => {
    try {
      const { id } = c.req.param()
      const { role } = c.get('validatedData')
      const user = c.get('user')

      // Prevent users from changing their own role
      if (id === user.id && role !== user.role) {
        return c.json({ 
          success: false, 
          error: 'Cannot change your own role',
          code: 'SELF_ROLE_CHANGE_FORBIDDEN'
        }, 400)
      }

      const targetUser = await UserModel.findById(id)
      if (!targetUser) return c.json({ 
        success: false, 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, 404)

      await UserModel.update(id, { role })
      return c.json({ 
        success: true, 
        message: 'User role updated successfully', 
        user: { id: targetUser.id, email: targetUser.email, role },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Update user role error:', error)
      return c.json({ 
        success: false, 
        error: 'Server error while updating user role',
        code: 'UPDATE_ROLE_ERROR'
      }, 500)
    }
  }
)

app.put('/api/auth/users/:id/status', 
  requireAdmin(),
  async (c) => {
    try {
      const { id } = c.req.param()
      const { isActive } = await c.req.json()
      const user = c.get('user')

      if (typeof isActive !== 'boolean') return c.json({ 
        success: false, 
        error: 'isActive status is required and must be a boolean',
        code: 'INVALID_STATUS'
      }, 400)

      const targetUser = await UserModel.findById(id)
      if (!targetUser) return c.json({ 
        success: false, 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, 404)

      // Prevent users from deactivating themselves
      if (id === user.id && !isActive) {
        return c.json({ 
          success: false, 
          error: 'Cannot deactivate your own account',
          code: 'SELF_DEACTIVATION_FORBIDDEN'
        }, 400)
      }

      if (!isActive && targetUser.role === 'admin') {
        const adminCount = await UserModel.countByRole('admin', true)
        if (adminCount <= 1) return c.json({ 
          success: false, 
          error: 'Cannot disable the last active admin user',
          code: 'LAST_ADMIN_PROTECTION'
        }, 400)
      }

      await UserModel.update(id, { isActive })
      return c.json({ 
        success: true, 
        message: 'User status updated successfully', 
        user: { id: targetUser.id, email: targetUser.email, isActive },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Update user status error:', error)
      return c.json({ 
        success: false, 
        error: 'Server error while updating user status',
        code: 'UPDATE_STATUS_ERROR'
      }, 500)
    }
  }
)

app.delete('/api/auth/users/:id', requireAdmin(), async (c) => {
  try {
    const { id } = c.req.param()
    const user = c.get('user')

    // Prevent users from deleting themselves
    if (id === user.id) {
      return c.json({ 
        success: false, 
        error: 'Cannot delete your own account',
        code: 'SELF_DELETION_FORBIDDEN'
      }, 400)
    }

    const targetUser = await UserModel.findById(id)
    if (!targetUser) return c.json({ 
      success: false, 
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    }, 404)

    if (targetUser.role === 'admin') {
      const adminCount = await UserModel.countByRole('admin', true)
      if (adminCount <= 1) return c.json({ 
        success: false, 
        error: 'Cannot delete the last active admin user',
        code: 'LAST_ADMIN_PROTECTION'
      }, 400)
    }

    await UserModel.delete(id)
    return c.json({ 
      success: true, 
      message: 'User deleted successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Delete user error:', error)
    return c.json({ 
      success: false, 
      error: 'Server error while deleting user',
      code: 'DELETE_USER_ERROR'
    }, 500)
  }
})

// ===== Social Links Routes with Enhanced Security =====

app.get('/api/social-links', async (c) => {
  try {
    const socialLinks = await SocialLinkModel.getActive()
    return c.json({ 
      success: true, 
      data: socialLinks, 
      count: socialLinks.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching social links:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to fetch social links',
      code: 'FETCH_SOCIAL_LINKS_ERROR'
    }, 500)
  }
})

app.get('/api/social-links/admin', requireAdmin(), async (c) => {
  try {
    const socialLinks = await SocialLinkModel.getAll()
    return c.json({ 
      success: true, 
      data: socialLinks, 
      count: socialLinks.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching social links for admin:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to fetch social links for admin dashboard',
      code: 'ADMIN_FETCH_SOCIAL_LINKS_ERROR'
    }, 500)
  }
})

app.post('/api/social-links', 
  requireAdmin(),
  validateInput(validationSchemas.createSocialLink),
  async (c) => {
    try {
      const { platform, url, displayName, icon, order = 0, isActive = true } = c.get('validatedData')

      const existing = await SocialLinkModel.findByPlatform(platform)
      if (existing) return c.json({ 
        success: false, 
        error: 'Social link for this platform already exists',
        code: 'PLATFORM_EXISTS'
      }, 400)

      const socialLink = await SocialLinkModel.create({ 
        platform, 
        url, 
        displayName, 
        icon, 
        order,
        isActive 
      })
      
      return c.json({ 
        success: true, 
        data: socialLink, 
        message: 'Social link created successfully',
        timestamp: new Date().toISOString()
      }, 201)
    } catch (error) {
      console.error('Error creating social link:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to create social link',
        code: 'CREATE_SOCIAL_LINK_ERROR'
      }, 500)
    }
  }
)

app.put('/api/social-links/:id', 
  requireAdmin(),
  validateInput(validationSchemas.updateSocialLink),
  async (c) => {
    try {
      const { id } = c.req.param()
      const updateData = c.get('validatedData')
      const current = await SocialLinkModel.findById(id)
      
      if (!current) return c.json({ 
        success: false, 
        error: 'Social link not found',
        code: 'SOCIAL_LINK_NOT_FOUND'
      }, 404)

      // Check for platform uniqueness if platform is being updated
      if (updateData.platform && updateData.platform !== current.platform) {
        const existing = await SocialLinkModel.findByPlatform(updateData.platform)
        if (existing) return c.json({ 
          success: false, 
          error: 'Social link for this platform already exists',
          code: 'PLATFORM_EXISTS'
        }, 400)
      }

      const updated = await SocialLinkModel.update(id, updateData)
      return c.json({ 
        success: true, 
        data: updated, 
        message: 'Social link updated successfully',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error updating social link:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to update social link',
        code: 'UPDATE_SOCIAL_LINK_ERROR'
      }, 500)
    }
  }
)

app.delete('/api/social-links/:id', requireAdmin(), async (c) => {
  try {
    const { id } = c.req.param()
    const existing = await SocialLinkModel.findById(id)
    if (!existing) return c.json({ 
      success: false, 
      error: 'Social link not found',
      code: 'SOCIAL_LINK_NOT_FOUND'
    }, 404)
    
    await SocialLinkModel.delete(id)
    return c.json({ 
      success: true, 
      message: 'Social link deleted successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error deleting social link:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to delete social link',
      code: 'DELETE_SOCIAL_LINK_ERROR'
    }, 500)
  }
})

// ===== Ad Banners Routes with Enhanced Security =====

app.get('/api/ads', async (c) => {
  try {
    const adBanners = await AdBannerModel.getActive()
    return c.json({ 
      success: true, 
      data: adBanners, 
      count: adBanners.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching ad banners:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to fetch ad banners',
      code: 'FETCH_ADS_ERROR'
    }, 500)
  }
})

app.get('/api/ads/admin', requireAdmin(), async (c) => {
  try {
    const adBanners = await AdBannerModel.getAll()
    return c.json({ 
      success: true, 
      data: adBanners, 
      count: adBanners.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching ad banners:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to fetch ad banners',
      code: 'ADMIN_FETCH_ADS_ERROR'
    }, 500)
  }
})

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Helper: upload a File/WebStream to Cloudinary via streaming
async function uploadToCloudinary(file) {
  return await new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'enish-radio/ads',
        transformation: [{ width: 1200, height: 400, crop: 'fill', quality: 'auto' }],
      },
      (error, result) => {
        if (error) return reject(error)
        resolve(result)
      }
    )

    try {
      // Node 20+: Convert Web ReadableStream to Node stream without buffering whole file
      const webStream = file.stream()
      const nodeStream = Readable.fromWeb(webStream)
      nodeStream.pipe(upload)
    } catch (e) {
      reject(e)
    }
  })
}

app.post('/api/ads', 
  requireAdmin(),
  validateFileUpload(),
  async (c) => {
    try {
      const contentType = c.req.header('content-type') || ''
      let data = {}

      if (contentType.includes('multipart/form-data')) {
        const body = await c.req.parseBody()
        data = {
          title: body.title,
          targetUrl: body.targetUrl,
          description: body.description,
          startDate: body.startDate,
          endDate: body.endDate,
          priority: body.priority ? parseInt(body.priority, 10) : 0
        }

        const file = body.image
        if (file && typeof file === 'object' && 'name' in file) {
          try {
            const result = await uploadToCloudinary(file)
            data.imageUrl = result.secure_url
            data.cloudinaryPublicId = result.public_id
          } catch (err) {
            console.error('Image upload error:', err)
            return c.json({ 
              success: false, 
              error: 'Failed to upload image',
              code: 'IMAGE_UPLOAD_ERROR'
            }, 500)
          }
        }
      } else {
        data = await c.req.json()
      }

      // Validate required fields
      if (!data.title || !data.targetUrl || !data.startDate || !data.endDate) {
        return c.json({ 
          success: false, 
          error: 'Missing required fields: title, targetUrl, startDate, endDate',
          code: 'MISSING_REQUIRED_FIELDS'
        }, 400)
      }

      const adBanner = await AdBannerModel.create({
        title: data.title,
        imageUrl: data.imageUrl || '',
        cloudinaryPublicId: data.cloudinaryPublicId || '',
        targetUrl: data.targetUrl,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        priority: data.priority || 0,
      })
      
      return c.json({ 
        success: true, 
        data: adBanner, 
        message: 'Ad banner created successfully',
        timestamp: new Date().toISOString()
      }, 201)
    } catch (error) {
      console.error('Error creating ad banner:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to create ad banner',
        code: 'CREATE_AD_ERROR'
      }, 500)
    }
  }
)

app.post('/api/ads/:id/click', async (c) => {
  try {
    const { id } = c.req.param()
    const adBanner = await AdBannerModel.findById(id)
    if (!adBanner) return c.json({ 
      success: false, 
      error: 'Ad banner not found',
      code: 'AD_NOT_FOUND'
    }, 404)
    
    await AdBannerModel.incrementClick(id)
    return c.json({ 
      success: true, 
      message: 'Click tracked successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error tracking ad click:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to track click',
      code: 'CLICK_TRACKING_ERROR'
    }, 500)
  }
})

// ===== Enhanced Analytics Routes =====

app.get('/api/analytics/overview', requireAdmin(), async (c) => {
  try {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    startOfMonth.setHours(0, 0, 0, 0)

    const totalSocialLinks = await SocialLinkModel.getAll()
    const activeSocialLinks = totalSocialLinks.filter((l) => l.isActive)

    const totalAds = await AdBannerModel.getAll()
    const activeAds = totalAds.filter((a) => a.isActive)
    const totalClicks = totalAds.reduce((sum, a) => sum + a.clickCount, 0)

    const weeklyClicks = totalAds.filter((a) => a.createdAt >= startOfWeek).reduce((sum, a) => sum + a.clickCount, 0)
    const monthlyClicks = totalAds.filter((a) => a.createdAt >= startOfMonth).reduce((sum, a) => sum + a.clickCount, 0)

    return c.json({
      success: true,
      data: {
        socialLinks: { 
          total: totalSocialLinks.length, 
          active: activeSocialLinks.length 
        },
        ads: { 
          total: totalAds.length, 
          active: activeAds.length, 
          totalClicks, 
          weeklyClicks, 
          monthlyClicks 
        },
        generatedAt: new Date().toISOString(),
        requestId: c.get('requestId')
      },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to fetch analytics data',
      code: 'ANALYTICS_FETCH_ERROR'
    }, 500)
  }
})

// ===== API Routes Not Found Handler =====
app.all('/api/*', (c) => c.json({ 
  error: 'Route not found', 
  code: 'ROUTE_NOT_FOUND',
  timestamp: new Date().toISOString(),
  requestId: c.get('requestId')
}, 404))

// ===== Graceful Shutdown Handling =====
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  await cleanup()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...')
  await cleanup()
  process.exit(0)
})

// ===== Database Initialization =====
;(async () => {
  try {
    console.log('Initializing database connection...')
    const connected = await testConnection()
    if (connected) {
      await syncSchema()
      console.log('Database initialization completed')
    }
  } catch (e) {
    console.error('Database initialization error:', e)
  }
})()

// ===== Start Server =====
serve({ 
  fetch: app.fetch, 
  port: PORT,
  errorHandler: (error, app) => {
    console.error('Server error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
})

console.log(`Enhanced Hono server running on port ${PORT} (${NODE_ENV})`)
console.log(`Environment: ${NODE_ENV}`)
console.log(`Admin panel: http://localhost:${PORT}/admin`)
console.log(`Health check: http://localhost:${PORT}/api/health`)
console.log(`Metrics: http://localhost:${PORT}/api/metrics`)