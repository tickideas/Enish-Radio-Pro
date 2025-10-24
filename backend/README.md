# Enish Radio Pro Backend API

This is the backend API server for the Enish Radio Pro mobile application. It provides RESTful endpoints for managing social links, ad banners, stream metadata, and user authentication.

## Features

- **Authentication System**: JWT-based authentication with secure password hashing
- **Social Links Management**: CRUD operations for social media links
- **Ad Banner Management**: Upload and manage ad campaigns with Cloudinary integration
- **Stream Metadata**: Manage track information and streaming data
- **Admin Panel**: Full admin interface for content management
- **Security**: Rate limiting, CORS, helmet security headers
- **File Upload**: Cloudinary integration for image storage

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens) + bcryptjs
- **File Storage**: Cloudinary for ad banner images
- **Security**: Helmet, CORS, Express Rate Limiting
- **Validation**: Input validation and sanitization with Sequelize

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (admin only)
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/refresh` - Refresh token

### Social Links
- `GET /api/social-links` - Get all active social links (public)
- `GET /api/social-links/admin` - Get all social links (admin only)
- `GET /api/social-links/:id` - Get single social link (admin only)
- `POST /api/social-links` - Create new social link (admin only)
- `PUT /api/social-links/:id` - Update social link (admin only)
- `DELETE /api/social-links/:id` - Delete social link (admin only)
- `PUT /api/social-links/reorder` - Reorder social links (admin only)

### Ad Banners
- `GET /api/ads` - Get active ad banners (public)
- `GET /api/ads/admin` - Get all ad banners (admin only)
- `GET /api/ads/:id` - Get single ad banner (admin only)
- `POST /api/ads` - Create new ad banner (admin only)
- `PUT /api/ads/:id` - Update ad banner (admin only)
- `DELETE /api/ads/:id` - Delete ad banner (admin only)
- `POST /api/ads/:id/click` - Track ad click (public)

### Stream Metadata
- `GET /api/stream/metadata` - Get current stream metadata (public)
- `GET /api/stream/metadata/history` - Get recent metadata history (public)
- `GET /api/stream/metadata/admin` - Get all metadata (admin only)
- `GET /api/stream/metadata/:id` - Get single metadata (admin only)
- `POST /api/stream/metadata` - Create new metadata (admin only)
- `PUT /api/stream/metadata/:id` - Update metadata (admin only)
- `DELETE /api/stream/metadata/:id` - Delete metadata (admin only)
- `POST /api/stream/metadata/:id/end` - End current track (admin only)

### Health Check
- `GET /api/health` - Server health check

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Copy `.env.example` to `.env` and update with your values:
   - PostgreSQL connection string
   - JWT secret key
   - Cloudinary credentials
   - Server port and environment

3. **Database Setup**:
   - Ensure PostgreSQL is running
   - Create database: `createdb enish-radio-pro`
   - The database will be created automatically on first run

4. **Start Server**:
   ```bash
   npm start          # Production
   npm run dev        # Development with nodemon
   ```

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for development and production origins
- **Helmet**: Security headers for Express.js
- **Input Validation**: All inputs are validated and sanitized
- **Password Hashing**: bcrypt with salt rounds (12)
- **JWT Tokens**: Secure token-based authentication

## Database Models

### User Schema
- Email (unique, required)
- Password (hashed, required)
- Role (admin/moderator, default: admin)
- Active status and timestamps

### SocialLink Schema
- Platform (enum: facebook, twitter, instagram, youtube, website, tiktok, linkedin)
- URL (validated, required)
- Display name and icon (required)
- Active status and order
- Timestamps

### AdBanner Schema
- Title, image URL, target URL (required)
- Description, start/end dates, priority
- Click and impression tracking
- Cloudinary integration for image management
- Virtual fields for active status checking

### StreamMetadata Schema
- Track info: title, artist, album, artwork, duration, genre, year
- Streaming details: source, stream URL, live status
- Start/end times for tracking
- Source tracking (radioking, manual, api)

## Error Handling

All endpoints include comprehensive error handling:
- Validation errors (400)
- Authentication errors (401, 403)
- Not found errors (404)
- Server errors (500)
- Consistent JSON response format

## Development

The API includes detailed logging and error reporting for debugging. Use nodemon for development to automatically restart on file changes.

## Production Considerations

- Use environment variables for all sensitive data
- Enable HTTPS in production
- Configure proper CORS origins
- Set up monitoring and logging
- Use process managers (PM2) for production deployment