import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { cors } from 'hono/cors'
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
import MenuItemModel from './drizzle/models/MenuItem.js'

// Utilities
import { isValidEmail, isValidUrl, isValidDateRange } from './utils/validation.js'

// Load env
dotenv.config()

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET']
if (process.env.NODE_ENV === 'production') {
    requiredEnvVars.push('CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET')
}

const missingVars = requiredEnvVars.filter(v => !process.env[v])
if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`)
    process.exit(1)
}

const app = new Hono()

const PORT = parseInt(process.env.PORT || '3000', 10)
const NODE_ENV = process.env.NODE_ENV || 'development'
const JWT_SECRET = process.env.JWT_SECRET

// Configure CORS origins
const corsOrigins = NODE_ENV === 'production'
    ? (process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['https://enishradio.com'])
    : ['http://localhost:8081', 'http://192.168.1.80:8081', 'exp://192.168.1.80:8081', 'http://localhost:3000']

// Global middleware
app.use('*', logger())
app.use('*', secureHeaders())
app.use(
    '/api/*',
    cors({
        origin: corsOrigins,
        credentials: true,
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
    })
)

// Note: Hono's c.req.parseBody() will parse multipart/form-data on supported runtimes.

// Error handler (consistent JSON shape)
app.onError((err, c) => {
    console.error('Unhandled error:', err)
    return c.json(
        {
            error: 'Something went wrong!',
            message: NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
        },
        500
    )
})

// Simple in-memory rate limiting (basic protection)
const rateMap = new Map()
const RATE_WINDOW_MS = 15 * 60 * 1000
const RATE_MAX = 100
const MAX_IPS_TRACKED = 10000 // Prevent memory leak

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now()
    for (const [ip, rec] of rateMap.entries()) {
        if (now - rec.start > RATE_WINDOW_MS) {
            rateMap.delete(ip)
        }
    }
    // If still too many IPs, remove oldest entries
    if (rateMap.size > MAX_IPS_TRACKED) {
        const ipsToDelete = Array.from(rateMap.entries())
            .sort((a, b) => a[1].start - b[1].start)
            .slice(0, Math.ceil(MAX_IPS_TRACKED * 0.1))
            .map(([ip]) => ip)
        ipsToDelete.forEach(ip => rateMap.delete(ip))
    }
}, 5 * 60 * 1000)

app.use('/api/*', async (c, next) => {
    try {
        const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || c.req.raw?.socket?.remoteAddress || 'unknown'
        const now = Date.now()
        const rec = rateMap.get(ip) || { start: now, count: 0 }
        if (now - rec.start > RATE_WINDOW_MS) {
            rec.start = now
            rec.count = 0
        }
        rec.count += 1
        rateMap.set(ip, rec)
        if (rec.count > RATE_MAX) {
            return c.json({ error: 'Too many requests from this IP, please try again later.' }, 429)
        }
        await next()
    } catch (e) {
        await next()
    }
})

// Helpers
const json = async (c) => {
    try {
        return await c.req.json()
    } catch {
        return {}
    }
}

const getAuthUser = async (c) => {
    try {
        const authHeader = c.req.header('authorization') || ''
        if (!authHeader.startsWith('Bearer ')) return null
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, JWT_SECRET)
        const user = await UserModel.findById(decoded.id)
        if (!user || !user.isActive) return null
        return { id: user.id, email: user.email, role: user.role }
    } catch (e) {
        return null
    }
}

const requireAuth = () => async (c, next) => {
    const user = await getAuthUser(c)
    if (!user) return c.json({ error: 'Access denied. No token provided or invalid.' }, 401)
    c.set('user', user)
    await next()
}

const requireAdmin = () => async (c, next) => {
    const user = await getAuthUser(c)
    if (!user) return c.json({ error: 'Access denied. No token provided or invalid.' }, 401)
    if (user.role !== 'admin') return c.json({ error: 'Access denied. Admin privileges required.' }, 403)
    c.set('user', user)
    await next()
}

const MENU_ITEM_TYPES = ['internal', 'external', 'action']

// Static files
// Serve everything in /public at its path, and specifically map /admin and /admin/*
app.use('/admin/*', serveStatic({ root: './public' }))
app.get('/admin', (c) => c.redirect('/admin/'))
app.get('/admin/', serveStatic({ path: './public/admin/index.html' }))

    // Initialize database connection (non-blocking)
    ; (async () => {
        try {
            const connected = await testConnection()
            if (connected) await syncSchema()
        } catch (e) {
            console.error('Database initialization error:', e)
        }
    })()

// Health check
app.get('/api/health', async (c) => {
    try {
        const result = await pool.query('SELECT 1 as health_check')
        const isDbConnected = result?.rows?.[0]?.health_check === 1
        let userCount = 0
        if (isDbConnected) {
            userCount = await UserModel.countByRole('admin', true)
        }
        const conn = pool.options || {}
        return c.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            database: {
                status: isDbConnected ? 'connected' : 'disconnected',
                userCount,
                connectionDetails: {
                    host: conn.host || 'external',
                    port: conn.port,
                    ssl: !!conn.ssl,
                },
            },
        })
    } catch (error) {
        console.error('Health check error:', error)
        return c.json(
            {
                status: 'ERROR',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                database: {
                    status: 'disconnected',
                    error: error.message,
                    errorCode: error.code,
                },
            },
            500
        )
    }
})

// ===== Auth Routes =====
app.post('/api/auth/login', async (c) => {
    try {
        const { email, password } = await json(c)
        if (!email || !password) return c.json({ success: false, error: 'Email and password are required' }, 400)
        if (!isValidEmail(email)) return c.json({ success: false, error: 'Invalid email format' }, 400)

        const user = await UserModel.findByEmail(email)
        if (!user) return c.json({ success: false, error: 'Invalid credentials' }, 401)

        const isMatch = await UserModel.comparePassword(password, user.password)
        if (!isMatch) return c.json({ success: false, error: 'Invalid credentials' }, 401)

        await UserModel.updateLastLogin(user.id)

        const payload = { id: user.id, email: user.email, role: user.role }
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })

        return c.json({ success: true, token, user: payload })
    } catch (error) {
        console.error('Login error:', error)
        return c.json({ success: false, error: 'Server error during login' }, 500)
    }
})

app.post('/api/auth/register', requireAdmin(), async (c) => {
    try {
        const { email, password, role = 'admin' } = await json(c)
        if (!email || !password) return c.json({ success: false, error: 'Email and password are required' }, 400)
        if (!isValidEmail(email)) return c.json({ success: false, error: 'Invalid email format' }, 400)

        const existingUser = await UserModel.findByEmail(email)
        if (existingUser) return c.json({ success: false, error: 'User with this email already exists' }, 400)

        await UserModel.create({ email, password, role })
        return c.json({ success: true, message: 'User registered successfully' }, 201)
    } catch (error) {
        console.error('Registration error:', error)
        return c.json({ success: false, error: 'Server error during registration' }, 500)
    }
})

app.post('/api/auth/change-password', requireAdmin(), async (c) => {
    try {
        const { currentPassword, newPassword } = await json(c)
        const user = c.get('user')
        if (!currentPassword || !newPassword) return c.json({ success: false, error: 'Current password and new password are required' }, 400)

        const found = await UserModel.findById(user.id)
        if (!found) return c.json({ success: false, error: 'User not found' }, 404)

        const isMatch = await UserModel.comparePassword(currentPassword, found.password)
        if (!isMatch) return c.json({ success: false, error: 'Current password is incorrect' }, 401)

        const bcrypt = await import('bcryptjs')
        const hashed = await bcrypt.default.hash(newPassword, 12)
        await UserModel.updatePassword(user.id, hashed)

        return c.json({ success: true, message: 'Password changed successfully' })
    } catch (error) {
        console.error('Change password error:', error)
        return c.json({ success: false, error: 'Server error during password change' }, 500)
    }
})

app.get('/api/auth/verify', async (c) => {
    try {
        const authHeader = c.req.header('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) return c.json({ success: false, error: 'No token provided' }, 401)
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, JWT_SECRET)
        const user = await UserModel.findById(decoded.id)
        if (!user) return c.json({ success: false, error: 'User not found' }, 401)
        return c.json({ success: true, user: { id: user.id, email: user.email, role: user.role } })
    } catch (error) {
        console.error('Token verification error:', error)
        if (error.name === 'JsonWebTokenError') return c.json({ success: false, error: 'Token is not valid' }, 401)
        if (error.name === 'TokenExpiredError') return c.json({ success: false, error: 'Token expired' }, 401)
        return c.json({ success: false, error: 'Server error during token verification' }, 500)
    }
})

app.post('/api/auth/refresh', async (c) => {
    try {
        const authHeader = c.req.header('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) return c.json({ success: false, error: 'No token provided' }, 401)
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true })
        const user = await UserModel.findById(decoded.id)
        if (!user || !user.isActive) return c.json({ success: false, error: 'User not found or inactive' }, 401)

        const newToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' })
        return c.json({ success: true, token: newToken })
    } catch (error) {
        console.error('Token refresh error:', error)
        return c.json({ success: false, error: 'Server error during token refresh' }, 500)
    }
})

app.get('/api/auth/users', requireAdmin(), async (c) => {
    try {
        const users = await UserModel.findAll()
        return c.json({ success: true, users })
    } catch (error) {
        console.error('Get users error:', error)
        return c.json({ success: false, error: 'Server error while fetching users' }, 500)
    }
})

app.put('/api/auth/users/:id/role', requireAdmin(), async (c) => {
    try {
        const { id } = c.req.param()
        const { role } = await json(c)
        if (!role || !['admin', 'moderator'].includes(role)) return c.json({ success: false, error: 'Role is required and must be either "admin" or "moderator"' }, 400)

        const user = await UserModel.findById(id)
        if (!user) return c.json({ success: false, error: 'User not found' }, 404)

        await UserModel.update(id, { role })
        return c.json({ success: true, message: 'User role updated successfully', user: { id: user.id, email: user.email, role } })
    } catch (error) {
        console.error('Update user role error:', error)
        return c.json({ success: false, error: 'Server error while updating user role' }, 500)
    }
})

app.put('/api/auth/users/:id/status', requireAdmin(), async (c) => {
    try {
        const { id } = c.req.param()
        const { isActive } = await json(c)
        if (typeof isActive !== 'boolean') return c.json({ success: false, error: 'isActive status is required and must be a boolean' }, 400)

        const user = await UserModel.findById(id)
        if (!user) return c.json({ success: false, error: 'User not found' }, 404)

        if (!isActive && user.role === 'admin') {
            const adminCount = await UserModel.countByRole('admin', true)
            if (adminCount <= 1) return c.json({ success: false, error: 'Cannot disable the last active admin user' }, 400)
        }

        await UserModel.update(id, { isActive })
        return c.json({ success: true, message: 'User status updated successfully', user: { id: user.id, email: user.email, isActive } })
    } catch (error) {
        console.error('Update user status error:', error)
        return c.json({ success: false, error: 'Server error while updating user status' }, 500)
    }
})

app.delete('/api/auth/users/:id', requireAdmin(), async (c) => {
    try {
        const { id } = c.req.param()
        const user = await UserModel.findById(id)
        if (!user) return c.json({ success: false, error: 'User not found' }, 404)

        if (user.role === 'admin') {
            const adminCount = await UserModel.countByRole('admin', true)
            if (adminCount <= 1) return c.json({ success: false, error: 'Cannot delete the last active admin user' }, 400)
        }

        await UserModel.delete(id)
        return c.json({ success: true, message: 'User deleted successfully' })
    } catch (error) {
        console.error('Delete user error:', error)
        return c.json({ success: false, error: 'Server error while deleting user' }, 500)
    }
})

// ===== Social Links =====
app.get('/api/social-links', async (c) => {
    try {
        const socialLinks = await SocialLinkModel.getAll()
        return c.json({ success: true, data: socialLinks, count: socialLinks.length })
    } catch (error) {
        console.error('Error fetching social links:', error)
        return c.json({ success: false, error: 'Failed to fetch social links' }, 500)
    }
})

app.get('/api/social-links/active', async (c) => {
    try {
        const socialLinks = await SocialLinkModel.getActive()
        return c.json({ success: true, data: socialLinks, count: socialLinks.length })
    } catch (error) {
        console.error('Error fetching active social links:', error)
        return c.json({ success: false, error: 'Failed to fetch active social links' }, 500)
    }
})

app.get('/api/social-links/admin', requireAdmin(), async (c) => {
    try {
        const socialLinks = await SocialLinkModel.getAll()
        return c.json({ success: true, data: socialLinks, count: socialLinks.length })
    } catch (error) {
        console.error('Error fetching social links for admin:', error)
        return c.json({ success: false, error: 'Failed to fetch social links for admin dashboard' }, 500)
    }
})

app.get('/api/social-links/platform/:platform', requireAdmin(), async (c) => {
    try {
        const { platform } = c.req.param()
        const socialLink = await SocialLinkModel.findByPlatform(platform)
        if (!socialLink) return c.json({ success: false, error: 'Social link not found' }, 404)
        return c.json({ success: true, data: socialLink })
    } catch (error) {
        console.error('Error fetching social link by platform:', error)
        return c.json({ success: false, error: 'Failed to fetch social link' }, 500)
    }
})

app.get('/api/social-links/:id', requireAdmin(), async (c) => {
    try {
        const { id } = c.req.param()
        const socialLink = await SocialLinkModel.findById(id)
        if (!socialLink) return c.json({ success: false, error: 'Social link not found' }, 404)
        return c.json({ success: true, data: socialLink })
    } catch (error) {
        console.error('Error fetching social link:', error)
        return c.json({ success: false, error: 'Failed to fetch social link' }, 500)
    }
})

app.post('/api/social-links', requireAdmin(), async (c) => {
    try {
        const { platform, url, displayName, icon, order = 0 } = await json(c)
        if (!platform || !url || !displayName || !icon) return c.json({ success: false, error: 'Missing required fields: platform, url, displayName, icon' }, 400)
        if (!isValidUrl(url)) return c.json({ success: false, error: 'Invalid URL format' }, 400)

        const existing = await SocialLinkModel.findByPlatform(platform)
        if (existing) return c.json({ success: false, error: 'Social link for this platform already exists' }, 400)

        const socialLink = await SocialLinkModel.create({ platform, url, displayName, icon, order })
        return c.json({ success: true, data: socialLink, message: 'Social link created successfully' }, 201)
    } catch (error) {
        console.error('Error creating social link:', error)
        return c.json({ success: false, error: 'Failed to create social link' }, 500)
    }
})

app.put('/api/social-links/:id', requireAdmin(), async (c) => {
    try {
        const { id } = c.req.param()
        const { platform, url, displayName, icon, isActive, order } = await json(c)
        const current = await SocialLinkModel.findById(id)
        if (!current) return c.json({ success: false, error: 'Social link not found' }, 404)

        if (platform && platform !== current.platform) {
            const existing = await SocialLinkModel.findByPlatform(platform)
            if (existing) return c.json({ success: false, error: 'Social link for this platform already exists' }, 400)
        }
        if (url && !isValidUrl(url)) return c.json({ success: false, error: 'Invalid URL format' }, 400)

        const updateData = {}
        if (platform) updateData.platform = platform
        if (url) updateData.url = url
        if (displayName) updateData.displayName = displayName
        if (icon) updateData.icon = icon
        if (isActive !== undefined) updateData.isActive = isActive
        if (order !== undefined) updateData.order = order

        const updated = await SocialLinkModel.update(id, updateData)
        return c.json({ success: true, data: updated, message: 'Social link updated successfully' })
    } catch (error) {
        console.error('Error updating social link:', error)
        return c.json({ success: false, error: 'Failed to update social link' }, 500)
    }
})

app.put('/api/social-links/order', requireAdmin(), async (c) => {
    try {
        const { links } = await json(c)
        if (!Array.isArray(links) || links.length === 0) return c.json({ success: false, error: 'Links array is required' }, 400)
        for (const link of links) {
            if (!link.id || typeof link.order !== 'number') return c.json({ success: false, error: 'Each link must have id and order properties' }, 400)
        }
        await SocialLinkModel.updateOrder(links)
        return c.json({ success: true, message: 'Social link order updated successfully' })
    } catch (error) {
        console.error('Error updating social link order:', error)
        return c.json({ success: false, error: 'Failed to update social link order' }, 500)
    }
})

app.delete('/api/social-links/:id', requireAdmin(), async (c) => {
    try {
        const { id } = c.req.param()
        const existing = await SocialLinkModel.findById(id)
        if (!existing) return c.json({ success: false, error: 'Social link not found' }, 404)
        await SocialLinkModel.delete(id)
        return c.json({ success: true, message: 'Social link deleted successfully' })
    } catch (error) {
        console.error('Error deleting social link:', error)
        return c.json({ success: false, error: 'Failed to delete social link' }, 500)
    }
})

// ===== Menu Items =====
app.get('/api/menu-items', async (c) => {
    try {
        const items = await MenuItemModel.getActive()
        return c.json({ success: true, data: items, count: items.length })
    } catch (error) {
        console.error('Error fetching menu items:', error)
        return c.json({ success: false, error: 'Failed to fetch menu items' }, 500)
    }
})

app.get('/api/menu-items/admin', requireAdmin(), async (c) => {
    try {
        const items = await MenuItemModel.getAll()
        return c.json({ success: true, data: items, count: items.length })
    } catch (error) {
        console.error('Error fetching menu items for admin:', error)
        return c.json({ success: false, error: 'Failed to fetch menu items for admin dashboard' }, 500)
    }
})

app.get('/api/menu-items/:id', requireAdmin(), async (c) => {
    try {
        const { id } = c.req.param()
        const menuItem = await MenuItemModel.findById(id)
        if (!menuItem) return c.json({ success: false, error: 'Menu item not found' }, 404)
        return c.json({ success: true, data: menuItem })
    } catch (error) {
        console.error('Error fetching menu item:', error)
        return c.json({ success: false, error: 'Failed to fetch menu item' }, 500)
    }
})

app.post('/api/menu-items', requireAdmin(), async (c) => {
    try {
        const { title, subtitle, type = 'internal', target, icon = 'menu', isActive = true, order = 0 } = await json(c)
        if (!title || !target) {
            return c.json({ success: false, error: 'Missing required fields: title, target' }, 400)
        }
        if (!MENU_ITEM_TYPES.includes(type)) {
            return c.json({ success: false, error: `Invalid type. Expected one of: ${MENU_ITEM_TYPES.join(', ')}` }, 400)
        }

        const cleanPayload = {
            title: typeof title === 'string' ? title.trim() : title,
            subtitle: typeof subtitle === 'string' && subtitle.trim().length > 0 ? subtitle.trim() : null,
            type,
            target: typeof target === 'string' ? target.trim() : target,
            icon: typeof icon === 'string' && icon.trim().length > 0 ? icon.trim() : 'menu',
            isActive: isActive !== false,
            order: Number.isFinite(order) ? order : parseInt(order, 10) || 0
        }

        const created = await MenuItemModel.create(cleanPayload)
        return c.json({ success: true, data: created, message: 'Menu item created successfully' }, 201)
    } catch (error) {
        console.error('Error creating menu item:', error)
        return c.json({ success: false, error: 'Failed to create menu item' }, 500)
    }
})

app.put('/api/menu-items/:id', requireAdmin(), async (c) => {
    try {
        const { id } = c.req.param()
        const existing = await MenuItemModel.findById(id)
        if (!existing) return c.json({ success: false, error: 'Menu item not found' }, 404)

        const { title, subtitle, type, target, icon, isActive, order } = await json(c)
        const updateData = {}
        if (title !== undefined) updateData.title = typeof title === 'string' ? title.trim() : title
        if (subtitle !== undefined) {
            updateData.subtitle = typeof subtitle === 'string' && subtitle.trim().length > 0 ? subtitle.trim() : null
        }
        if (type !== undefined) {
            if (!MENU_ITEM_TYPES.includes(type)) {
                return c.json({ success: false, error: `Invalid type. Expected one of: ${MENU_ITEM_TYPES.join(', ')}` }, 400)
            }
            updateData.type = type
        }
        if (target !== undefined) updateData.target = typeof target === 'string' ? target.trim() : target
        if (icon !== undefined) {
            updateData.icon = typeof icon === 'string' && icon.trim().length > 0 ? icon.trim() : 'menu'
        }
        if (isActive !== undefined) updateData.isActive = !!isActive
        if (order !== undefined) updateData.order = Number.isFinite(order) ? order : parseInt(order, 10) || 0

        if (Object.keys(updateData).length === 0) {
            return c.json({ success: false, error: 'No valid fields provided for update' }, 400)
        }

        const updated = await MenuItemModel.update(id, updateData)
        return c.json({ success: true, data: updated, message: 'Menu item updated successfully' })
    } catch (error) {
        console.error('Error updating menu item:', error)
        return c.json({ success: false, error: 'Failed to update menu item' }, 500)
    }
})

app.put('/api/menu-items/order', requireAdmin(), async (c) => {
    try {
        const { items } = await json(c)
        if (!Array.isArray(items) || items.length === 0) {
            return c.json({ success: false, error: 'Items array is required' }, 400)
        }

        for (const item of items) {
            if (!item.id || typeof item.order !== 'number') {
                return c.json({ success: false, error: 'Each item must include id and order' }, 400)
            }
        }

        await MenuItemModel.updateOrder(items)
        return c.json({ success: true, message: 'Menu item order updated successfully' })
    } catch (error) {
        console.error('Error updating menu item order:', error)
        return c.json({ success: false, error: 'Failed to update menu item order' }, 500)
    }
})

app.delete('/api/menu-items/:id', requireAdmin(), async (c) => {
    try {
        const { id } = c.req.param()
        const existing = await MenuItemModel.findById(id)
        if (!existing) return c.json({ success: false, error: 'Menu item not found' }, 404)
        await MenuItemModel.delete(id)
        return c.json({ success: true, message: 'Menu item deleted successfully' })
    } catch (error) {
        console.error('Error deleting menu item:', error)
        return c.json({ success: false, error: 'Failed to delete menu item' }, 500)
    }
})

// ===== Ad Banners =====
app.get('/api/ads', async (c) => {
    try {
        const adBanners = await AdBannerModel.getActive()
        return c.json({ success: true, data: adBanners, count: adBanners.length })
    } catch (error) {
        console.error('Error fetching ad banners:', error)
        return c.json({ success: false, error: 'Failed to fetch ad banners' }, 500)
    }
})

app.get('/api/ads/admin', requireAdmin(), async (c) => {
    try {
        const adBanners = await AdBannerModel.getAll()
        return c.json({ success: true, data: adBanners, count: adBanners.length })
    } catch (error) {
        console.error('Error fetching ad banners:', error)
        return c.json({ success: false, error: 'Failed to fetch ad banners' }, 500)
    }
})

app.get('/api/ads/:id', requireAdmin(), async (c) => {
    try {
        const { id } = c.req.param()
        const adBanner = await AdBannerModel.findById(id)
        if (!adBanner) return c.json({ success: false, error: 'Ad banner not found' }, 404)
        return c.json({ success: true, data: adBanner })
    } catch (error) {
        console.error('Error fetching ad banner:', error)
        return c.json({ success: false, error: 'Failed to fetch ad banner' }, 500)
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

app.post('/api/ads', requireAdmin(), async (c) => {
    try {
        const contentType = c.req.header('content-type') || ''

        let title, targetUrl, description, startDate, endDate, priority, imageUrl = '', cloudinaryPublicId = ''

        if (contentType.includes('multipart/form-data')) {
            const body = await c.req.parseBody()
            title = body.title
            targetUrl = body.targetUrl
            description = body.description
            startDate = body.startDate
            endDate = body.endDate
            priority = body.priority ? parseInt(body.priority, 10) : 0

            const file = body.image
            if (file && typeof file === 'object' && 'name' in file) {
                // Size limit 5MB
                if (file.size && file.size > 5 * 1024 * 1024) {
                    return c.json({ success: false, error: 'File too large (max 5MB)' }, 413)
                }
                try {
                    const result = await uploadToCloudinary(file)
                    imageUrl = result.secure_url
                    cloudinaryPublicId = result.public_id
                } catch (err) {
                    console.error('Image upload error:', err)
                    return c.json({ success: false, error: 'Failed to upload image' }, 500)
                }
            }
        } else {
            const body = await json(c)
            title = body.title
            targetUrl = body.targetUrl
            description = body.description
            startDate = body.startDate
            endDate = body.endDate
            priority = body.priority ?? 0
            imageUrl = body.imageUrl || ''
            cloudinaryPublicId = body.cloudinaryPublicId || ''
        }

        if (!title || !targetUrl || !startDate || !endDate) return c.json({ success: false, error: 'Missing required fields: title, targetUrl, startDate, endDate' }, 400)
        if (!isValidUrl(targetUrl)) return c.json({ success: false, error: 'Invalid target URL format' }, 400)
        if (!isValidDateRange(startDate, endDate)) return c.json({ success: false, error: 'End date must be after start date' }, 400)

        const adBanner = await AdBannerModel.create({
            title,
            imageUrl,
            cloudinaryPublicId,
            targetUrl,
            description,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            priority: priority || 0,
        })
        return c.json({ success: true, data: adBanner, message: 'Ad banner created successfully' }, 201)
    } catch (error) {
        console.error('Error creating ad banner:', error)
        return c.json({ success: false, error: 'Failed to create ad banner' }, 500)
    }
})

app.put('/api/ads/:id', requireAdmin(), async (c) => {
    try {
        const { id } = c.req.param()
        const adBanner = await AdBannerModel.findById(id)
        if (!adBanner) return c.json({ success: false, error: 'Ad banner not found' }, 404)

        const contentType = c.req.header('content-type') || ''
        let title, targetUrl, description, startDate, endDate, priority, isActive, imageUrl, cloudinaryPublicId

        if (contentType.includes('multipart/form-data')) {
            const body = await c.req.parseBody()
            title = body.title
            targetUrl = body.targetUrl
            description = body.description
            startDate = body.startDate
            endDate = body.endDate
            priority = body.priority !== undefined ? parseInt(body.priority, 10) : undefined
            isActive = body.isActive !== undefined ? body.isActive === 'true' || body.isActive === true : undefined

            const file = body.image
            if (file && typeof file === 'object' && 'name' in file) {
                // Delete old image first if exists
                if (adBanner.cloudinaryPublicId) {
                    await new Promise((resolve) => {
                        cloudinary.uploader.destroy(adBanner.cloudinaryPublicId, () => resolve())
                    })
                }
                // Size limit 5MB
                if (file.size && file.size > 5 * 1024 * 1024) {
                    return c.json({ success: false, error: 'File too large (max 5MB)' }, 413)
                }
                try {
                    const result = await uploadToCloudinary(file)
                    imageUrl = result.secure_url
                    cloudinaryPublicId = result.public_id
                } catch (err) {
                    console.error('Image upload error:', err)
                    return c.json({ success: false, error: 'Failed to upload image' }, 500)
                }
            }
        } else {
            const body = await json(c)
            title = body.title
            targetUrl = body.targetUrl
            description = body.description
            startDate = body.startDate
            endDate = body.endDate
            priority = body.priority
            isActive = body.isActive
            imageUrl = body.imageUrl
            cloudinaryPublicId = body.cloudinaryPublicId
        }

        const updateData = {}
        if (title) updateData.title = title
        if (targetUrl) {
            if (!isValidUrl(targetUrl)) return c.json({ success: false, error: 'Invalid target URL format' }, 400)
            updateData.targetUrl = targetUrl
        }
        if (description) updateData.description = description
        if (startDate) updateData.startDate = new Date(startDate)
        if (endDate) updateData.endDate = new Date(endDate)

        // Validate date range if both dates are provided
        if ((startDate || endDate) && (adBanner.startDate || startDate) && (adBanner.endDate || endDate)) {
            const finalStart = startDate ? new Date(startDate) : adBanner.startDate
            const finalEnd = endDate ? new Date(endDate) : adBanner.endDate
            if (!isValidDateRange(finalStart, finalEnd)) return c.json({ success: false, error: 'End date must be after start date' }, 400)
        }

        if (priority !== undefined) updateData.priority = priority
        if (isActive !== undefined) updateData.isActive = isActive
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl
        if (cloudinaryPublicId !== undefined) updateData.cloudinaryPublicId = cloudinaryPublicId

        const updated = await AdBannerModel.update(id, updateData)
        return c.json({ success: true, data: updated, message: 'Ad banner updated successfully' })
    } catch (error) {
        console.error('Error updating ad banner:', error)
        return c.json({ success: false, error: 'Failed to update ad banner' }, 500)
    }
})

app.delete('/api/ads/:id', requireAdmin(), async (c) => {
    try {
        const { id } = c.req.param()
        const adBanner = await AdBannerModel.findById(id)
        if (!adBanner) return c.json({ success: false, error: 'Ad banner not found' }, 404)

        // Delete from Cloudinary if image exists
        if (adBanner.cloudinaryPublicId) {
            try {
                await new Promise((resolve, reject) => {
                    cloudinary.uploader.destroy(adBanner.cloudinaryPublicId, (error, result) => {
                        if (error) reject(error)
                        else resolve(result)
                    })
                })
            } catch (cloudinaryError) {
                console.error('Cloudinary deletion warning (continuing):', cloudinaryError)
            }
        }

        await AdBannerModel.delete(id)
        return c.json({ success: true, message: 'Ad banner deleted successfully' })
    } catch (error) {
        console.error('Error deleting ad banner:', error)
        return c.json({ success: false, error: 'Failed to delete ad banner' }, 500)
    }
})

app.post('/api/ads/:id/click', async (c) => {
    try {
        const { id } = c.req.param()
        const adBanner = await AdBannerModel.findById(id)
        if (!adBanner) return c.json({ success: false, error: 'Ad banner not found' }, 404)
        await AdBannerModel.incrementClick(id)
        return c.json({ success: true, message: 'Click tracked successfully' })
    } catch (error) {
        console.error('Error tracking ad click:', error)
        return c.json({ success: false, error: 'Failed to track click' }, 500)
    }
})

app.post('/api/ads/:id/impression', async (c) => {
    try {
        const { id } = c.req.param()
        const adBanner = await AdBannerModel.findById(id)
        if (!adBanner) return c.json({ success: false, error: 'Ad banner not found' }, 404)
        await AdBannerModel.incrementImpression(id)
        return c.json({ success: true, message: 'Impression tracked successfully' })
    } catch (error) {
        console.error('Error tracking ad impression:', error)
        return c.json({ success: false, error: 'Failed to track impression' }, 500)
    }
})

// ===== Analytics =====
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

        const totalMenuItems = await MenuItemModel.getAll()
        const activeMenuItems = totalMenuItems.filter((item) => item.isActive)

        const totalAds = await AdBannerModel.getAll()
        const activeAds = totalAds.filter((a) => a.isActive)
        const totalClicks = totalAds.reduce((sum, a) => sum + a.clickCount, 0)

        const weeklyClicks = totalAds.filter((a) => a.createdAt >= startOfWeek).reduce((sum, a) => sum + a.clickCount, 0)
        const monthlyClicks = totalAds.filter((a) => a.createdAt >= startOfMonth).reduce((sum, a) => sum + a.clickCount, 0)

        return c.json({
            success: true,
            data: {
                socialLinks: { total: totalSocialLinks.length, active: activeSocialLinks.length },
                menuItems: { total: totalMenuItems.length, active: activeMenuItems.length },
                ads: { total: totalAds.length, active: activeAds.length, totalClicks, weeklyClicks, monthlyClicks },
                generatedAt: new Date().toISOString(),
            },
        })
    } catch (error) {
        console.error('Error fetching analytics:', error)
        return c.json({ success: false, error: 'Failed to fetch analytics data' }, 500)
    }
})

app.get('/api/analytics/ad-clicks', requireAdmin(), async (c) => {
    try {
        const url = new URL(c.req.url)
        const timeframe = url.searchParams.get('timeframe') || 'week'
        let startDate = new Date()
        switch (timeframe) {
            case 'day':
                startDate.setHours(startDate.getHours() - 24)
                break
            case 'week':
                startDate.setDate(startDate.getDate() - 7)
                break
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1)
                break
            default:
                startDate.setDate(startDate.getDate() - 7)
        }

        const allAds = await AdBannerModel.getAll()
        const filteredAds = allAds.filter((ad) => ad.createdAt >= startDate)
        const sortedAds = filteredAds.sort((a, b) => b.clickCount - a.clickCount)

        return c.json({
            success: true,
            data: sortedAds.map((ad) => ({ id: ad.id, title: ad.title, clickCount: ad.clickCount, createdAt: ad.createdAt })),
            timeframe,
        })
    } catch (error) {
        console.error('Error fetching ad clicks analytics:', error)
        return c.json({ success: false, error: 'Failed to fetch ad clicks analytics' }, 500)
    }
})

// 404 for API
app.all('/api/*', (c) => c.json({ error: 'Route not found' }, 404))

// Start server
serve({ fetch: app.fetch, port: PORT })
console.log(`Hono server running on port ${PORT} (${NODE_ENV})`)
