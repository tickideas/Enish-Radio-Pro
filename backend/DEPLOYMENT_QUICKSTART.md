# Coolify Deployment - Quick Reference

## Files Created

All necessary files for Coolify deployment have been created:

1. **Dockerfile** - Production-ready multi-stage Docker build
2. **docker-compose.yml** - Local testing environment
3. **.dockerignore** - Optimized Docker build context
4. **.env.coolify** - Environment variables template
5. **COOLIFY_DEPLOYMENT.md** - Comprehensive deployment guide
6. **coolify-setup.sh** - Interactive setup script
7. **README.md** - Updated with deployment section

## Quick Start Guide

### 1. Test Locally (Recommended)

Before deploying to Coolify, test the Docker build:

```bash
cd backend

# Interactive setup (choose option 1 or 2)
./coolify-setup.sh

# Or manually:
docker build -t enish-radio-backend .
docker-compose up
```

### 2. Prepare Environment Variables

Required variables for Coolify:

```env
# Database (use Coolify's internal connection string)
DATABASE_URL=postgresql://user:pass@enish-radio-db:5432/enish_radio_pro

# JWT (generate with: openssl rand -base64 32)
JWT_SECRET=your-strong-secret-here

# Cloudinary (get from https://cloudinary.com)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Server
PORT=3000
NODE_ENV=production

# CORS (your frontend domains)
ALLOWED_ORIGINS=https://yourdomain.com
```

### 3. Deploy to Coolify

**Step-by-step**:

1. **Create PostgreSQL Database** in Coolify:
   - Name: `enish-radio-db`
   - Version: PostgreSQL 16
   - Save the connection string

2. **Create Application**:
   - Source: GitHub repository
   - Repository: `tickideas/Enish-Radio-Pro`
   - Branch: `main`
   - Build path: `backend/`
   - Type: Dockerfile
   - Port: 3000

3. **Add Environment Variables**:
   - Copy from `.env.coolify`
   - Update with your values

4. **Configure Health Check**:
   - Path: `/api/health`
   - Port: 3000
   - Interval: 30s

5. **Set Domain** (optional):
   - Add: `api.yourdomain.com`
   - Enable HTTPS

6. **Deploy**:
   - Click Deploy
   - Monitor build logs

7. **Initialize Database**:
   - In Coolify shell: `npm run create-schema`
   - Create admin: `node scripts/seedAdmin.js`

8. **Verify**:
   - Test: `curl https://api.yourdomain.com/api/health`
   - Access admin: `https://api.yourdomain.com/admin/`

### 4. Update Mobile App

After successful deployment, update the mobile app:

```typescript
// mobile-app/constants/env.production.ts
export const PRODUCTION_API_URL = 'https://api.yourdomain.com/api';
```

## Important Notes

### Database Connection

- **Coolify Managed DB**: Use internal hostname (e.g., `enish-radio-db`)
- **External DB**: Use full connection string with `?sslmode=require`

### Security

- Generate JWT secret: `openssl rand -base64 32`
- Use strong database passwords
- Enable HTTPS (Let's Encrypt)
- Update CORS origins with your actual domains

### Resource Limits

Recommended starting configuration:
- **CPU**: 1 core
- **Memory**: 512MB
- **Storage**: 10GB

Adjust based on traffic.

## Troubleshooting

### Build Fails

```bash
# Test locally first
cd backend
docker build -t test .
```

### Database Connection Issues

Check:
- Connection string is correct
- Database is running
- Network connectivity
- SSL configuration (for external DBs)

### Application Crashes

Check:
- Environment variables are set
- Resource limits
- Logs in Coolify dashboard

### CORS Errors

Update `ALLOWED_ORIGINS` in Coolify environment variables.

## Endpoints to Test

After deployment:

```bash
# Health check
curl https://api.yourdomain.com/api/health

# Should return:
{
  "status": "OK",
  "timestamp": "...",
  "database": {
    "status": "connected"
  }
}
```

## Next Steps

1. ✅ Test locally with docker-compose
2. ✅ Create database in Coolify
3. ✅ Deploy application
4. ✅ Initialize database schema
5. ✅ Create admin user
6. ✅ Test endpoints
7. ✅ Access admin panel
8. ✅ Update mobile app
9. ✅ Enable backups
10. ✅ Monitor application

## Full Documentation

For complete instructions, see **[COOLIFY_DEPLOYMENT.md](./COOLIFY_DEPLOYMENT.md)**

## Support

- [Coolify Documentation](https://coolify.io/docs)
- [Hono Framework](https://hono.dev)
- Project: See AGENTS.md for architecture details
