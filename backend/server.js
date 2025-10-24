// DEPRECATED: This Express server has been superseded by Hono (see server.hono.js)
// Kept for reference during migration. Use `npm start` or `npm run dev` to run the Hono server.
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import Drizzle database and models
import { testConnection, syncSchema } from './drizzle/db.js';
import UserModel from './drizzle/models/User.js';
import SocialLinkModel from './drizzle/models/SocialLink.js';
import AdBannerModel from './drizzle/models/AdBanner.js';
import StreamMetadataModel from './drizzle/models/StreamMetadata.js';

// Import routes
import socialLinksRoutes from './routes/socialLinks.js';
import adBannersRoutes from './routes/adBanners.js';
import streamMetadataRoutes from './routes/streamMetadata.js';
import authRoutes from './routes/auth.js';
import analyticsRoutes from './routes/analytics.js';

// Configure dotenv
dotenv.config();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for admin dashboard
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://enishradio.com']
    : ['http://localhost:8081', 'exp://192.168.1.100:8081'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files for admin dashboard
app.use(express.static('public'));

// File upload middleware for ad banners
import multer from 'multer';
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Database connection
async function initializeDatabase() {
  try {
    const connected = await testConnection();
    if (connected) {
      console.log('Connected to PostgreSQL database with Drizzle ORM');
      
      // Sync database schema
      const synced = await syncSchema();
      if (synced) {
        console.log('Database models synchronized');
      }
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Initialize database
initializeDatabase();

// Routes
app.use('/api/social-links', socialLinksRoutes);
app.use('/api/ads', adBannersRoutes);
app.use('/api/stream/metadata', streamMetadataRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);

// Admin dashboard redirect
app.get('/admin', (req, res) => {
  res.redirect('/admin/');
});

// Admin dashboard root
app.get('/admin/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'admin', 'index.html'));
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection with a simple query using Drizzle
    const dbTest = await db.execute('SELECT 1 as health_check');
    const isDbConnected = dbTest[0]?.health_check === 1;
    
    let userCount = 0;
    if (isDbConnected) {
      // Test application models
      userCount = await UserModel.countByRole('admin', true);
    }
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: {
        status: isDbConnected ? 'connected' : 'disconnected',
        userCount,
        connectionDetails: {
          host: pool.options.host || 'external',
          port: pool.options.port,
          ssl: !!pool.options.ssl
        }
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: {
        status: 'disconnected',
        error: error.message,
        errorCode: error.code
      }
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Export for potential use in tests
export default app;