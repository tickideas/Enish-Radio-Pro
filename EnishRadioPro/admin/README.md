# Enish Radio Pro Admin Panel

This directory contains the admin panel implementation for Enish Radio Pro, providing a comprehensive management interface for radio station operations.

## Features

### Authentication
- Secure login system with JWT tokens
- Automatic token refresh
- Session management

### Dashboard
- Overview statistics
- Quick access to all management sections
- Real-time data updates

### Social Links Management
- Add, edit, and delete social media links
- Support for multiple platforms (Facebook, Twitter, Instagram, YouTube, Website)
- Reordering functionality
- Active/inactive status toggle

### Ad Banner Management
- Create and manage advertisement banners
- Image upload functionality
- Click and impression tracking
- Active/inactive status toggle
- Start and end date scheduling

### Stream Metadata Management
- Track currently playing songs
- Manage song information (title, artist, album)
- Track duration and play history
- End current track functionality

### User Management
- Create and manage admin users
- Role-based access control (Admin, Moderator)
- User status management
- Last login tracking

### Analytics Dashboard
- Listener statistics
- Geographic distribution
- Popular tracks reporting
- Ad performance metrics
- Daily listener trends

## Technical Implementation

### Architecture
- React Native with Expo Router
- TypeScript for type safety
- Modular component structure
- Service layer for API calls
- Custom hooks for state management

### API Integration
- Centralized API service with error handling
- Automatic retry logic
- Request/response interceptors
- Authentication token management

### Caching Strategy
- AsyncStorage for offline data
- TTL-based cache invalidation
- Selective caching for read-only operations
- Cache size management

### Error Handling
- Custom error handling hook
- Network error detection
- Retry logic with exponential backoff
- User-friendly error messages
- Error reporting for analytics

### Performance Monitoring
- Memory usage tracking
- App state monitoring
- Device information collection
- Performance metrics storage
- Analytics integration

## File Structure

```
admin/
├── _layout.tsx          # Navigation layout for admin screens
├── login.tsx            # Admin login screen
├── dashboard.tsx         # Main dashboard with statistics
├── social-links.tsx       # Social links management
├── ad-banners.tsx        # Ad banner management
├── stream-metadata.tsx    # Stream metadata management
├── user-management.tsx    # User management
└── analytics.tsx          # Analytics dashboard
```

## Services

### API Service (`/services/api.ts`)
- Centralized API calls
- Authentication handling
- Error handling and retry logic
- Request/response interceptors
- Cache integration

### Cache Service (`/services/cache.ts`)
- AsyncStorage wrapper
- TTL-based cache invalidation
- Cache size management
- Selective caching strategies

### Performance Service (`/services/performance.ts`)
- Memory usage tracking
- App state monitoring
- Device information collection
- Performance metrics storage

### Error Handler Hook (`/hooks/useErrorHandler.ts`)
- Centralized error handling
- Retry logic with exponential backoff
- Error type classification
- User-friendly error messages

## Testing

### Unit Tests (`/services/__tests__/api.test.ts`)
- API service testing
- Cache service testing
- Mock implementations
- Error handling validation

### Test Configuration
- Jest configuration for React Native
- Mock setup for AsyncStorage and Alert
- Coverage reporting
- Test environment setup

## Security Considerations

1. **Authentication**
   - JWT tokens with expiration
   - Secure token storage
   - Automatic token refresh
   - Session invalidation on logout

2. **API Security**
   - Request interceptors for auth headers
   - HTTPS enforcement in production
   - Input validation and sanitization
   - Rate limiting considerations

3. **Data Protection**
   - Sensitive data encryption
   - Secure storage practices
   - Data access logging
   - User permission validation

## Performance Optimizations

1. **Caching Strategy**
   - Selective caching for read-only operations
   - TTL-based cache invalidation
   - Cache size management
   - Offline data availability

2. **Network Optimization**
   - Request batching where possible
   - Connection pooling
   - Request deduplication
   - Automatic retry with exponential backoff

3. **Memory Management**
   - Component unmounting cleanup
   - Image optimization and caching
   - Memory leak prevention
   - Performance monitoring

## Usage Instructions

1. **Installation**
   ```bash
   npm install
   ```

2. **Running the App**
   ```bash
   npm start
   ```

3. **Building for Production**
   ```bash
   npm run build:prod
   ```

4. **Submitting to App Stores**
   ```bash
   npm run submit:android  # For Google Play Store
   npm run submit:ios       # For Apple App Store
   ```

## Future Enhancements

1. **Real-time Updates**
   - WebSocket integration for live data
   - Push notifications for admin alerts
   - Real-time collaboration features

2. **Advanced Analytics**
   - Custom report generation
   - Data export functionality
   - Predictive analytics
   - A/B testing framework

3. **Enhanced Security**
   - Two-factor authentication
   - IP-based access restrictions
   - Audit logging
   - Role-based permissions

## Troubleshooting

### Common Issues

1. **Login Problems**
   - Check network connectivity
   - Verify backend server status
   - Clear stored authentication data
   - Check token expiration

2. **Data Loading Issues**
   - Verify API endpoints are accessible
   - Check cache invalidation
   - Review error logs
   - Test with network debugging tools

3. **Performance Issues**
   - Monitor memory usage
   - Check for memory leaks
   - Review component unmounting
   - Optimize image sizes

### Debug Mode

Enable debug mode by setting environment variable:
```bash
EXPO_DEBUG=1 npm start
```

This will provide additional logging and performance metrics.