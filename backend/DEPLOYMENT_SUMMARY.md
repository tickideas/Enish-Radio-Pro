# 🚀 Coolify Deployment - Complete Package

Your backend is now fully ready for Coolify deployment! All necessary files have been created and configured.

## 📦 What Was Created

### Core Deployment Files
✅ **Dockerfile** - Production-optimized multi-stage Docker build
  - Node 20 Alpine base image
  - Non-root user for security
  - Health checks configured
  - Multi-stage build for smaller image size

✅ **docker-compose.yml** - Complete local testing environment
  - PostgreSQL database included
  - Environment variables pre-configured
  - Health checks for all services
  - Volume persistence for data

✅ **.dockerignore** - Optimized build context
  - Excludes unnecessary files
  - Reduces image size
  - Faster builds

### Configuration Files
✅ **.env.coolify** - Environment variables template
  - All required variables documented
  - Clear instructions for each setting
  - Production-ready defaults

### Documentation
✅ **COOLIFY_DEPLOYMENT.md** - Complete deployment guide (8000+ words)
  - Step-by-step instructions
  - Database setup options
  - Environment configuration
  - Troubleshooting guide
  - Security best practices
  - Backup strategies
  - Scaling considerations

✅ **DEPLOYMENT_QUICKSTART.md** - Quick reference guide
  - Fast deployment checklist
  - Key commands
  - Common troubleshooting
  - Testing endpoints

✅ **README.md** - Updated with deployment section
  - Links to all guides
  - Quick start commands
  - Feature highlights

### Helper Scripts
✅ **coolify-setup.sh** - Interactive setup helper
  - Test Docker build
  - Run docker-compose
  - Generate JWT secret
  - Show deployment checklist

✅ **health-check.sh** - Comprehensive health monitoring
  - Check all endpoints
  - Database connectivity
  - Response time analysis
  - Detailed reporting

### CI/CD (Optional)
✅ **.github/workflows/backend-ci.yml** - GitHub Actions workflow
  - Automatic Docker build tests
  - Dockerfile linting
  - PR checks
  - Ready for Coolify webhooks

### Updated Files
✅ **package.json** - New deployment scripts added
  - `npm run docker:build`
  - `npm run docker:compose:up`
  - `npm run health-check`
  - And more...

## 🎯 Quick Start

### Option 1: Test Locally First (Recommended)

```bash
cd backend

# Interactive setup
./coolify-setup.sh

# Choose option 2 to test full stack with PostgreSQL
# This will start both database and backend in Docker
```

### Option 2: Direct to Coolify

1. **Create PostgreSQL Database in Coolify**
2. **Create Application** from GitHub
3. **Add Environment Variables** from `.env.coolify`
4. **Deploy** and monitor build
5. **Initialize Database** with `npm run create-schema`
6. **Verify** with health check

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Test Docker build locally (`./coolify-setup.sh`)
- [ ] Generate JWT secret (`openssl rand -base64 32`)
- [ ] Prepare Cloudinary credentials
- [ ] Prepare database (Coolify managed or external)
- [ ] Review `.env.coolify` template

### Coolify Setup
- [ ] Create PostgreSQL database
- [ ] Create application from GitHub
- [ ] Set build context to `backend/`
- [ ] Configure environment variables
- [ ] Set health check path to `/api/health`
- [ ] Configure domain (optional)
- [ ] Enable HTTPS

### Post-Deployment
- [ ] Initialize database schema
- [ ] Create admin user
- [ ] Test health endpoint
- [ ] Verify admin panel access
- [ ] Update mobile app config
- [ ] Enable database backups
- [ ] Set up monitoring

## 🔑 Critical Environment Variables

```env
# Required
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=<strong-random-secret>
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# Server
PORT=3000
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=https://yourdomain.com
```

## 🧪 Testing Commands

```bash
# Test Docker build
npm run docker:build

# Test with docker-compose
npm run docker:compose:up

# View logs
npm run docker:compose:logs

# Stop services
npm run docker:compose:down

# Health check (local)
npm run health-check

# Health check (production)
npm run health-check:prod
```

## 🏥 Health Check Endpoints

After deployment, verify these endpoints:

```bash
# Main health check
curl https://api.yourdomain.com/api/health

# Expected response:
{
  "status": "OK",
  "timestamp": "2025-10-30T...",
  "version": "1.0.0",
  "database": {
    "status": "connected",
    "userCount": 1
  }
}

# Public endpoints (should work without auth)
curl https://api.yourdomain.com/api/social-links/active
curl https://api.yourdomain.com/api/ads

# Admin endpoint (should require auth)
curl https://api.yourdomain.com/api/social-links/admin
# Expected: 401 Unauthorized
```

## 📚 Documentation Guide

1. **Start Here**: `DEPLOYMENT_QUICKSTART.md`
   - Quick reference for fast deployment

2. **Complete Guide**: `COOLIFY_DEPLOYMENT.md`
   - Comprehensive step-by-step instructions
   - Troubleshooting section
   - Best practices
   - Security guidelines

3. **Interactive Setup**: `./coolify-setup.sh`
   - Test builds before deployment
   - Generate secrets
   - View checklists

4. **Health Monitoring**: `./health-check.sh`
   - Automated health checks
   - Performance monitoring
   - Troubleshooting tool

## 🛠️ Troubleshooting Quick Reference

### Build Fails
```bash
# Test locally
cd backend
docker build -t test .
```

### Database Connection Issues
```bash
# Check in Coolify shell
echo $DATABASE_URL
node -e "require('pg').Client({connectionString:process.env.DATABASE_URL}).connect()"
```

### Application Crashes
```bash
# Check logs in Coolify dashboard
# Verify environment variables
# Check resource limits (may need more memory)
```

### CORS Errors
```bash
# Update ALLOWED_ORIGINS in Coolify
# Must include your frontend domain
# Example: https://app.yourdomain.com
```

## 🔒 Security Highlights

✅ **Multi-stage Docker build** - Minimal attack surface
✅ **Non-root user** - Container runs as non-privileged user
✅ **Health checks** - Automatic restart on failures
✅ **Rate limiting** - 100 requests/15min per IP
✅ **Secure headers** - OWASP recommended headers
✅ **SSL support** - Built-in for external databases
✅ **JWT authentication** - Secure token-based auth
✅ **Password hashing** - bcrypt with salt rounds

## 📊 Resource Recommendations

### Starter (Low Traffic)
- CPU: 1 core
- Memory: 512MB
- Storage: 10GB
- Database: Coolify managed PostgreSQL

### Production (Medium Traffic)
- CPU: 2 cores
- Memory: 1GB
- Storage: 20GB
- Database: Dedicated PostgreSQL instance

### High Availability
- Multiple backend instances
- Load balancer
- Separate database server
- Redis for caching

## 🔄 Continuous Deployment

### Option 1: Auto-deploy from GitHub
Enable in Coolify:
- Settings → Deployment
- Enable "Auto Deploy on Git Push"
- Set branch to `main`

### Option 2: GitHub Actions + Coolify Webhook
1. Enable webhook in Coolify
2. Add webhook URL to GitHub secrets
3. Workflow will trigger deployment on successful build

## 📈 Monitoring & Alerts

### Built-in Monitoring
- Coolify dashboard (real-time logs)
- Health check endpoint
- Application metrics

### Recommended External Tools
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry
- **APM**: New Relic, DataDog
- **Log Aggregation**: Papertrail, LogDNA

### Health Check Script
```bash
# Local
./health-check.sh

# Production
./health-check.sh -u https://api.yourdomain.com -v

# For monitoring systems (exit code 0 = healthy)
./health-check.sh -u https://api.yourdomain.com
```

## 🎓 Next Steps After Deployment

1. **Test All Endpoints**
   - Health check
   - Admin panel
   - Public APIs

2. **Configure Mobile App**
   - Update `env.production.ts`
   - Test API connectivity

3. **Set Up Backups**
   - Enable Coolify automated backups
   - Test restore procedure

4. **Monitor Performance**
   - Check response times
   - Monitor resource usage
   - Review error logs

5. **Plan for Scaling**
   - Monitor traffic patterns
   - Identify bottlenecks
   - Prepare scaling strategy

## 🆘 Getting Help

### Documentation
- Full deployment guide: `COOLIFY_DEPLOYMENT.md`
- Quick reference: `DEPLOYMENT_QUICKSTART.md`
- Project architecture: `../AGENTS.md`

### Testing Tools
- Interactive setup: `./coolify-setup.sh`
- Health monitoring: `./health-check.sh`
- Local stack: `docker-compose up`

### External Resources
- [Coolify Docs](https://coolify.io/docs)
- [Hono Framework](https://hono.dev)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## ✨ Success Criteria

Your deployment is successful when:

✅ Health endpoint returns 200 OK
✅ Database shows "connected" status
✅ Admin panel is accessible
✅ Social links API works
✅ Ad banners API works
✅ Mobile app can connect
✅ Admin can login
✅ Images upload to Cloudinary
✅ Backups are configured
✅ HTTPS is enabled

## 🎉 Ready to Deploy!

Everything is set up and ready. Choose your path:

**Fast Track** (30 minutes):
1. Run `./coolify-setup.sh` and test locally
2. Create database in Coolify
3. Deploy application
4. Initialize and verify

**Thorough Track** (1 hour):
1. Read `COOLIFY_DEPLOYMENT.md` completely
2. Test with docker-compose locally
3. Prepare all credentials
4. Follow step-by-step guide
5. Complete all checklist items

**Questions?** Check the troubleshooting sections in the documentation or run the health check script for diagnostics.

---

**Made with ❤️ for seamless deployment**

Happy deploying! 🚀
