# Enish Radio Pro - Admin Interface Documentation

## Overview

The Enish Radio Pro admin interface provides a comprehensive web-based dashboard for managing all aspects of the radio application. This interface is completely separate from the mobile app and provides full CRUD operations for all content and user management.

## Access

### URL
- Admin Login: `https://your-domain.com/admin/`
- Admin Dashboard: `https://your-domain.com/admin/dashboard.html`

### Requirements
- Admin account with valid credentials
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection

## Features

### 1. Dashboard Overview
- **Social Links**: View and manage social media links
- **Menu Items**: Configure app navigation menu items
- **Ad Banners**: Manage advertising content and track performance
- **Stream Metadata**: Control what's currently playing and manage track history
- **User Management**: Manage admin users and their permissions
- **Analytics**: View comprehensive statistics and reporting

### 2. Social Links Management
- **Add New Links**: Create new social media links with platform, display name, URL, and icon
- **Edit Existing Links**: Update link information and status
- **Delete Links**: Remove social links
- **Status Control**: Enable/disable links without deleting them
- **Reordering**: Drag and drop to reorder links (planned feature)

### 3. Menu Items Management
- **Add Menu Items**: Create new navigation menu items with title, subtitle, icon, and target
- **Type Control**: Choose between internal screens, external links, or custom actions
- **Edit Items**: Update menu item information and configuration
- **Delete Items**: Remove menu items
- **Status Control**: Enable/disable items without deleting them
- **Order Management**: Set display order for menu items

### 4. Ad Banner Management
- **Create Ads**: Add new advertising banners with images, URLs, and targeting
- **Image Upload**: Automatic Cloudinary integration for image hosting
- **Performance Tracking**: View click statistics and engagement
- **Scheduling**: Set start/end dates for ad campaigns
- **Priority Control**: Set ad priority levels
- **Status Management**: Enable/disable ads

### 5. Stream Metadata Management
- **Add Tracks**: Manually add tracks to the stream
- **Live Control**: Mark tracks as currently playing
- **Track History**: View playback history
- **Metadata Editing**: Update track information
- **Source Integration**: Support for multiple data sources

### 6. User Management
- **User Roles**: Admin and Moderator roles
- **Account Status**: Enable/disable user accounts
- **Role Assignment**: Change user permissions
- **Account Deletion**: Remove users (with safety checks)
- **Last Login Tracking**: Monitor user activity

### 7. Analytics & Reporting
- **Social Media Stats**: Total and active link counts
- **Menu Items Stats**: Total and active menu items
- **Ad Performance**: Click tracking and engagement metrics
- **Stream Data**: Track counts and active streams
- **Historical Data**: View trends over time
- **Export Capabilities**: Data export functionality (planned)

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/verify` - Token verification
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/users` - Get all users (admin only)
- `PUT /api/auth/users/:id/role` - Update user role (admin only)
- `PUT /api/auth/users/:id/status` - Update user status (admin only)
- `DELETE /api/auth/users/:id` - Delete user (admin only)

### Social Links
- `GET /api/social-links/admin` - Get all social links
- `POST /api/social-links` - Create new social link
- `PUT /api/social-links/:id` - Update social link
- `DELETE /api/social-links/:id` - Delete social link

### Menu Items
- `GET /api/menu-items` - Get all active menu items (public)
- `GET /api/menu-items/admin` - Get all menu items (admin only)
- `GET /api/menu-items/:id` - Get single menu item (admin only)
- `POST /api/menu-items` - Create new menu item (admin only)
- `PUT /api/menu-items/:id` - Update menu item (admin only)
- `PUT /api/menu-items/order` - Bulk update menu item ordering (admin only)
- `DELETE /api/menu-items/:id` - Delete menu item (admin only)

### Ad Banners
- `GET /api/ads/admin` - Get all ad banners
- `POST /api/ads` - Create new ad banner
- `PUT /api/ads/:id` - Update ad banner
- `DELETE /api/ads/:id` - Delete ad banner
- `POST /api/ads/:id/click` - Track ad clicks

### Stream Metadata
- `GET /api/stream/metadata/admin` - Get all stream metadata
- `POST /api/stream/metadata` - Create new stream metadata
- `PUT /api/stream/metadata/:id` - Update stream metadata
- `DELETE /api/stream/metadata/:id` - Delete stream metadata
- `POST /api/stream/metadata/:id/end` - End current track

### Analytics
- `GET /api/analytics/overview` - Get basic analytics overview
- `GET /api/analytics/ad-clicks` - Get ad click analytics
- `GET /api/analytics/stream-history` - Get stream history

## Security

### Authentication
- JWT tokens with 24-hour expiration
- Role-based access control (Admin/Moderator)
- Secure password hashing with bcrypt
- Rate limiting on authentication endpoints

### Authorization
- Admin middleware protects all admin endpoints
- Role verification for sensitive operations
- CSRF protection on forms
- Input validation and sanitization

### Data Protection
- HTTPS required for all admin operations
- Secure token storage in localStorage
- Automatic token expiration handling
- Session management

## Technical Requirements

### Backend Dependencies
- Node.js 20+
- Hono (Node runtime)
- PostgreSQL
- Drizzle ORM
- JWT for authentication
- Bcrypt for password hashing
- Cloudinary for image hosting (optional)

### Frontend Features
- Responsive design for desktop and tablet
- Real-time data updates
- Modal-based forms for data entry
- Toast notifications for user feedback
- Loading states for better UX
- Error handling and validation

## Setup Instructions

### 1. Environment Variables
```bash
# Backend .env
JWT_SECRET=your-super-secret-jwt-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
NODE_ENV=production
```

### 2. Database Setup
```bash
# Ensure DATABASE_URL is set in backend/.env
# Optionally run seed script to create an admin user
node backend/scripts/seedAdmin.js
```

### 3. Admin User Creation
```javascript
// Use the auth/register endpoint or seed script
{
  "email": "admin@enishradio.com",
  "password": "your-secure-password",
  "role": "admin"
}
```

## Troubleshooting

### Common Issues

1. **Login Fails**
   - Check email/password combination
   - Ensure user account is active
   - Verify JWT_SECRET matches between requests

2. **API Calls Return 401**
   - Check if token has expired (24-hour limit)
   - Verify Authorization header format: `Bearer <token>`
   - Ensure user has required role permissions

3. **Image Upload Fails**
   - Verify Cloudinary credentials
   - Check file size limits (5MB max)
   - Ensure file is a valid image format

4. **Database Connection Errors**
   - Verify PostgreSQL connection string
   - Check database permissions
   - Ensure database is running

### Error Codes

- `401`: Authentication required or invalid token
- `403`: Insufficient permissions for requested operation
- `404`: Resource not found
- `422`: Validation error in request data
- `500`: Internal server error

## Support

For technical issues or questions:
- Check server logs for detailed error messages
- Verify all environment variables are set correctly
- Ensure database migrations have been run
- Test API endpoints with tools like Postman

## Updates and Maintenance

### Regular Tasks
- Monitor admin user activity
- Review ad performance metrics
- Update social media links as needed
- Clean up old stream metadata periodically
- Backup database regularly

### Security Updates
- Rotate JWT_SECRET periodically
- Update admin passwords regularly
- Monitor for unauthorized access attempts
- Keep dependencies up to date

---

*This documentation is for version 1.0 of the Enish Radio Pro admin interface. Features and endpoints may change in future versions.*