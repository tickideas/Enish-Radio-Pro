const express = require('express');
const { Sequelize } = require('sequelize');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import database and models
const sequelize = require('./config/database');
const User = require('./models/User');
const SocialLink = require('./models/SocialLink');
const AdBanner = require('./models/AdBanner');
const StreamMetadata = require('./models/StreamMetadata');

// Import routes
const socialLinksRoutes = require('./routes/socialLinks');
const adBannersRoutes = require('./routes/adBanners');
const streamMetadataRoutes = require('./routes/streamMetadata');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
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

// File upload middleware for ad banners
const multer = require('multer');
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Database connection
sequelize.authenticate()
.then(() => console.log('Connected to PostgreSQL database'))
.catch(err => console.error('PostgreSQL connection error:', err));

// Sync database models
sequelize.sync({ force: false })
.then(() => console.log('Database models synchronized'))
.catch(err => console.error('Database sync error:', err));

// Routes
app.use('/api/social-links', socialLinksRoutes);
app.use('/api/ads', adBannersRoutes);
app.use('/api/stream/metadata', streamMetadataRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
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
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;