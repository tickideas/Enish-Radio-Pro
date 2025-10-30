# Coolify Deployment Checklist

Print this checklist and check off items as you complete them.

## Pre-Deployment Preparation

### Local Testing
- [ ] Docker is installed and running
- [ ] Ran `./coolify-setup.sh` and tested locally
- [ ] Built Docker image successfully
- [ ] Tested with docker-compose (full stack)
- [ ] Verified health endpoint works locally
- [ ] Reviewed all deployment documentation

### Credentials & Configuration
- [ ] Generated JWT secret (`openssl rand -base64 32`)
- [ ] Created Cloudinary account
- [ ] Obtained Cloudinary credentials:
  - [ ] Cloud Name
  - [ ] API Key
  - [ ] API Secret
- [ ] Prepared database connection details
- [ ] Determined domain name for API
- [ ] Reviewed `.env.coolify` template

### Documentation Review
- [ ] Read `DEPLOYMENT_SUMMARY.md`
- [ ] Read `DEPLOYMENT_QUICKSTART.md`
- [ ] Reviewed `COOLIFY_DEPLOYMENT.md`
- [ ] Understand `ARCHITECTURE_DIAGRAM.md`

---

## Coolify Setup

### Database Configuration
- [ ] Logged into Coolify dashboard
- [ ] Created new PostgreSQL database:
  - [ ] Name: `enish-radio-db`
  - [ ] Version: PostgreSQL 16 (or latest)
  - [ ] Database: `enish_radio_pro`
  - [ ] Username: `enish_user`
  - [ ] Strong password generated
- [ ] Copied internal connection string
- [ ] Database is showing as "Running"
- [ ] Enabled automated backups
- [ ] Set backup retention (7 days minimum)

### Application Setup
- [ ] Created new Application in Coolify
- [ ] Connected to GitHub repository:
  - [ ] Repository: `tickideas/Enish-Radio-Pro`
  - [ ] Branch: `main`
  - [ ] Auto-deploy enabled (optional)
- [ ] Configured build settings:
  - [ ] Build Pack: Dockerfile
  - [ ] Docker Context: `backend/`
  - [ ] Dockerfile Location: `backend/Dockerfile`
  - [ ] Port: `3000`

### Environment Variables
Copy from `.env.coolify` and set in Coolify:

- [ ] `DATABASE_URL` (use internal connection string)
- [ ] `JWT_SECRET` (strong random secret)
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`
- [ ] `PORT=3000`
- [ ] `NODE_ENV=production`
- [ ] `ALLOWED_ORIGINS` (your frontend domains)

### Health Check Configuration
- [ ] Health check enabled
- [ ] Path: `/api/health`
- [ ] Port: `3000`
- [ ] Interval: `30s`
- [ ] Timeout: `10s`
- [ ] Start period: `5s`

### Domain & SSL (Optional but Recommended)
- [ ] Added custom domain
- [ ] DNS configured:
  - [ ] A record: `api.yourdomain.com → Coolify IP`
  - [ ] Or CNAME: `api.yourdomain.com → coolify-domain`
- [ ] SSL certificate enabled (Let's Encrypt)
- [ ] Force HTTPS enabled
- [ ] Domain shows as "Active"

### Resource Configuration
- [ ] CPU limit set: `1` core (minimum)
- [ ] Memory limit set: `512Mi` (minimum)
- [ ] Memory reservation: `256Mi`
- [ ] Persistent volumes (if needed)

---

## Deployment

### Initial Deployment
- [ ] Clicked "Deploy" button
- [ ] Monitored build logs for errors
- [ ] Build completed successfully
- [ ] Container started successfully
- [ ] Health check passing

### Database Initialization
- [ ] Opened Coolify application shell
- [ ] Ran: `npm run create-schema`
- [ ] Schema created successfully
- [ ] Ran: `node scripts/seedAdmin.js`
- [ ] Admin user created
- [ ] Noted admin credentials securely

---

## Verification & Testing

### Endpoint Testing
- [ ] Health endpoint responds:
  ```bash
  curl https://api.yourdomain.com/api/health
  ```
- [ ] Response shows:
  - [ ] `status: "OK"`
  - [ ] `database.status: "connected"`
  - [ ] Timestamp is current
- [ ] Public endpoints work:
  - [ ] `/api/social-links/active`
  - [ ] `/api/ads`
- [ ] Admin endpoints require auth (401):
  - [ ] `/api/social-links/admin`
  - [ ] `/api/ads/admin`

### Admin Panel Testing
- [ ] Accessed admin panel: `https://api.yourdomain.com/admin/`
- [ ] Login page loads
- [ ] Successfully logged in with admin credentials
- [ ] Dashboard loads correctly
- [ ] Can view social links
- [ ] Can view ad banners
- [ ] Can view analytics

### Performance Testing
- [ ] Response time < 1000ms (excellent)
- [ ] Response time < 3000ms (acceptable)
- [ ] No timeout errors
- [ ] No memory issues
- [ ] CPU usage reasonable

### Health Check Script
- [ ] Ran: `./health-check.sh -u https://api.yourdomain.com -v`
- [ ] All checks passed
- [ ] No errors reported

---

## Mobile App Integration

### Configuration Update
- [ ] Updated `mobile-app/constants/env.production.ts`:
  ```typescript
  export const PRODUCTION_API_URL = 'https://api.yourdomain.com/api';
  ```
- [ ] Committed changes to repository
- [ ] Built new production app version

### Connection Testing
- [ ] Mobile app connects to production API
- [ ] Social links load
- [ ] Ad banners display
- [ ] No CORS errors
- [ ] No authentication issues

---

## Monitoring & Maintenance

### Monitoring Setup
- [ ] Coolify monitoring enabled
- [ ] Email notifications configured
- [ ] Slack/Discord webhooks (optional)
- [ ] Alert thresholds set:
  - [ ] CPU > 80%
  - [ ] Memory > 80%
  - [ ] Disk > 80%
  - [ ] Health check failures

### Backup Verification
- [ ] Database backups enabled
- [ ] Backup schedule configured (daily)
- [ ] Backup retention set (7+ days)
- [ ] Test backup restore (optional but recommended)

### Documentation
- [ ] Environment variables documented
- [ ] Admin credentials stored securely
- [ ] Deployment notes recorded
- [ ] Team informed of deployment

---

## Security Checklist

### Application Security
- [ ] HTTPS enabled and enforced
- [ ] Strong JWT secret in use
- [ ] Strong database password in use
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] Secure headers enabled

### Access Control
- [ ] Only necessary ports exposed
- [ ] Database not publicly accessible
- [ ] Admin panel requires authentication
- [ ] No sensitive data in logs
- [ ] Environment variables not committed to Git

### Monitoring
- [ ] Failed login attempts monitored
- [ ] Unusual traffic patterns watched
- [ ] Error rates tracked
- [ ] Regular security updates planned

---

## Post-Deployment Tasks

### Immediate (Within 24 Hours)
- [ ] Monitor logs for errors
- [ ] Check resource usage
- [ ] Verify backups completed
- [ ] Test all critical endpoints
- [ ] Monitor mobile app connectivity

### Short-term (Within 1 Week)
- [ ] Review performance metrics
- [ ] Optimize resource allocation if needed
- [ ] Test disaster recovery procedure
- [ ] Document any issues encountered
- [ ] Set up external monitoring (UptimeRobot, etc.)

### Long-term (Ongoing)
- [ ] Weekly log review
- [ ] Monthly security audit
- [ ] Quarterly dependency updates
- [ ] Regular backup testing
- [ ] Performance optimization

---

## Rollback Plan (If Needed)

### Preparation
- [ ] Previous version tag noted
- [ ] Database backup available
- [ ] Rollback procedure documented

### Rollback Steps (if deployment fails)
- [ ] In Coolify, select previous deployment
- [ ] Click "Redeploy"
- [ ] Verify health endpoint
- [ ] Restore database if needed
- [ ] Notify team

---

## Success Criteria

Deployment is successful when ALL of these are checked:

- [ ] ✅ Health endpoint returns 200 OK
- [ ] ✅ Database connection is stable
- [ ] ✅ Admin panel accessible and functional
- [ ] ✅ All public APIs responding correctly
- [ ] ✅ Mobile app connects successfully
- [ ] ✅ No errors in logs (past 1 hour)
- [ ] ✅ Backups configured and working
- [ ] ✅ HTTPS enabled and working
- [ ] ✅ Resource usage within limits
- [ ] ✅ Team informed and documentation updated

---

## Notes Section

Use this space for deployment-specific notes:

**Deployment Date:** ____________________

**Database Connection String:** (store securely, not here!)

**Domain:** ____________________

**Cloudinary Cloud Name:** ____________________

**Issues Encountered:**
- 
- 
- 

**Solutions Applied:**
- 
- 
- 

**Team Members Involved:**
- 
- 
- 

**Next Review Date:** ____________________

---

## Support Contacts

**Coolify Support:** https://coolify.io/docs
**Project Repository:** https://github.com/tickideas/Enish-Radio-Pro
**Internal Documentation:** See COOLIFY_DEPLOYMENT.md

---

**Completed by:** ____________________

**Date:** ____________________

**Signature:** ____________________

---

🎉 **Congratulations on your successful deployment!** 🎉
