# Backend Deployment Checklist

After code review and fixes, use this checklist before deploying to production.

## Pre-Deployment

### Environment Variables
- [ ] Set `JWT_SECRET` to a strong, random value (min 32 characters)
- [ ] Set `NODE_ENV=production`
- [ ] Configure `CLOUDINARY_CLOUD_NAME`
- [ ] Configure `CLOUDINARY_API_KEY`
- [ ] Configure `CLOUDINARY_API_SECRET`
- [ ] Set `DATABASE_URL` to production database
- [ ] Configure `CORS_ORIGINS` with comma-separated allowed domains
- [ ] Set `PORT` (default 3000)
- [ ] Verify database SSL certificates configured if needed

### Database
- [ ] Verify PostgreSQL 13+ is running
- [ ] Create production database and user
- [ ] Run schema creation: `npm run create-schema`
- [ ] Verify all tables created successfully
- [ ] Create initial admin user: `node scripts/seedAdmin.js`
- [ ] Test database connection
- [ ] Verify backups are configured

### Security Review
- [ ] Verify JWT_SECRET is never logged or exposed
- [ ] Confirm CORS origins are restrictive (not wildcards)
- [ ] Check firewall rules for port access
- [ ] Enable HTTPS for all API endpoints
- [ ] Review Cloudinary API credentials are secure
- [ ] Verify environment variables not in git history

### Code Validation
- [ ] Run all tests: `npm test`
- [ ] Check code style: `npm run lint` (if available)
- [ ] Verify no console.log statements in production code
- [ ] Review error messages don't expose sensitive info

### Application Startup
- [ ] Test server startup: `npm start`
- [ ] Verify health endpoint responds: `GET /api/health`
- [ ] Confirm database connection successful
- [ ] Check rate limiting works
- [ ] Test authentication flow (login/verify/refresh)

### Monitoring & Logging
- [ ] Configure centralized logging (e.g., CloudWatch, ELK)
- [ ] Set up performance monitoring
- [ ] Configure alerts for error rates
- [ ] Enable uptime monitoring
- [ ] Configure backup alerting

### Post-Deployment Verification
- [ ] Health check endpoint returns 200
- [ ] Admin panel is accessible
- [ ] Authentication works (login creates valid token)
- [ ] Social links endpoint returns data
- [ ] Ad banners endpoint returns active ads
- [ ] Menu items endpoint returns items
- [ ] Rate limiting rejects requests over limit
- [ ] CORS headers present for allowed origins
- [ ] Errors don't expose stack traces in production

## Recent Fixes to Verify

### 1. JWT Secret Validation
- [ ] Server exits if `JWT_SECRET` not set
- [ ] All JWT operations use configured secret
- [ ] No fallback to hardcoded secret

### 2. Rate Limiting
- [ ] Rate limit cleanup timer running
- [ ] Doesn't accumulate unlimited IP entries
- [ ] Returns 429 status when limit exceeded

### 3. User Count Logic
- [ ] Admin deletion prevented when only 1 admin
- [ ] User count endpoint returns correct number
- [ ] Admin count validation works reliably

### 4. Input Validation
- [ ] Invalid emails rejected
- [ ] Invalid URLs rejected
- [ ] Invalid date ranges rejected
- [ ] Error messages clear and helpful

### 5. Cloudinary Integration
- [ ] Ad images upload successfully
- [ ] Images delete from Cloudinary on ad removal
- [ ] No orphaned images in Cloudinary
- [ ] Cloudinary deletion errors logged but don't break flow

### 6. Environment Configuration
- [ ] CORS origins configurable via env var
- [ ] Fallback CORS origins work in production
- [ ] Required env vars checked at startup

## Rollback Plan

If issues occur post-deployment:

1. Check logs for specific errors
2. Verify all environment variables set correctly
3. Test database connectivity
4. Verify JWT_SECRET hasn't changed
5. Restart server: `npm start`
6. If database issues: Review migration status
7. Contact development team with logs

## Monitoring Post-Deployment

Daily:
- [ ] Check error logs for exceptions
- [ ] Verify health endpoint responds
- [ ] Confirm database backups completed

Weekly:
- [ ] Review API performance metrics
- [ ] Check rate limiting effectiveness
- [ ] Verify backup integrity

Monthly:
- [ ] Audit user accounts and roles
- [ ] Review Cloudinary storage usage
- [ ] Check for security vulnerabilities

---

**Last Updated**: December 24, 2025  
**Backend Version**: 1.0.0  
**Hono Version**: 4.11.1  
**Node Version**: 20+
