# Coolify Deployment Guide - Enish Radio Pro Backend

This guide will walk you through deploying the Enish Radio Pro backend to Coolify.

## Prerequisites

1. **Coolify Instance**: A running Coolify instance (self-hosted or cloud)
2. **PostgreSQL Database**: Either use Coolify's managed PostgreSQL or an external database
3. **Cloudinary Account**: For image uploads (get free account at https://cloudinary.com)
4. **Domain Name** (optional but recommended): For production deployment

## Step 1: Prepare Your Database

### Option A: Using Coolify's Managed PostgreSQL

1. In Coolify dashboard, go to **Databases**
2. Click **+ New Database**
3. Select **PostgreSQL**
4. Configure:
   - Name: `enish-radio-db`
   - Version: `16` (or latest stable)
   - Database Name: `enish_radio_pro`
   - Username: `enish_user`
   - Password: (generate a strong password)
5. Click **Create**
6. Wait for the database to be ready
7. Copy the **Internal Connection String** (will look like: `postgresql://enish_user:password@enish-radio-db:5432/enish_radio_pro`)

### Option B: Using External Database (Supabase, Neon, etc.)

1. Get your database connection string
2. Ensure it includes `?sslmode=require` for SSL connections
3. Example: `postgresql://user:pass@host:port/db?sslmode=require`

## Step 2: Deploy Backend Application to Coolify

### Method 1: Deploy from GitHub Repository

1. **Connect Repository**:
   - In Coolify, go to **Projects**
   - Click **+ New Resource** → **Application**
   - Select **GitHub** as source
   - Authenticate and select your repository: `tickideas/Enish-Radio-Pro`
   - Branch: `main`

2. **Configure Application**:
   - **Name**: `enish-radio-backend`
   - **Type**: `Docker`
   - **Build Pack**: `Dockerfile`
   - **Dockerfile Location**: `backend/Dockerfile`
   - **Docker Context**: `backend/`
   - **Port**: `3000`

3. **Set Environment Variables**:
   Click on **Environment Variables** and add:

   ```env
   # Database Configuration
   DATABASE_URL=postgresql://enish_user:YOUR_PASSWORD@enish-radio-db:5432/enish_radio_pro
   
   # JWT Secret (generate a strong random string)
   JWT_SECRET=<generate-a-strong-random-secret-here>
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   
   # Server Configuration
   PORT=3000
   NODE_ENV=production
   
   # CORS Origins (comma-separated)
   ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
   ```

   **Important Notes**:
   - Generate a strong JWT secret using: `openssl rand -base64 32`
   - If using Coolify's managed PostgreSQL, use the internal connection string
   - Update `ALLOWED_ORIGINS` with your actual frontend domain(s)

4. **Configure Health Check**:
   - Health Check Path: `/api/health`
   - Health Check Port: `3000`
   - Health Check Interval: `30s`

5. **Set up Domain** (Optional but recommended):
   - Go to **Domains** section
   - Add your domain: `api.yourdomain.com`
   - Enable **HTTPS** (Let's Encrypt)
   - Enable **Force HTTPS**

6. **Deploy**:
   - Click **Deploy**
   - Monitor the build logs
   - Wait for deployment to complete

### Method 2: Deploy from Docker Image (Alternative)

If you prefer to build locally and push to a registry:

```bash
# Build the Docker image
cd backend
docker build -t yourusername/enish-radio-backend:latest .

# Push to Docker Hub
docker push yourusername/enish-radio-backend:latest

# In Coolify:
# - Select "Docker Image" as source
# - Image: yourusername/enish-radio-backend:latest
# - Configure environment variables as above
```

## Step 3: Initialize Database Schema

After the first deployment, you need to create the database schema:

1. **Access Application Shell**:
   - In Coolify, go to your application
   - Click on **Execute Command**
   - Run: `npm run create-schema`

2. **Create Admin User**:
   - Run: `node scripts/seedAdmin.js`
   - Or manually create admin via the API (see below)

## Step 4: Verify Deployment

1. **Check Health Endpoint**:
   ```bash
   curl https://api.yourdomain.com/api/health
   ```
   
   Expected response:
   ```json
   {
     "status": "OK",
     "timestamp": "2025-10-30T...",
     "version": "1.0.0",
     "database": {
       "status": "connected",
       "userCount": 0
     }
   }
   ```

2. **Access Admin Panel**:
   - Navigate to: `https://api.yourdomain.com/admin/`
   - Login with admin credentials

## Step 5: Configure Mobile App

Update your mobile app's production environment configuration:

```typescript
// mobile-app/constants/env.production.ts
export const PRODUCTION_API_URL = 'https://api.yourdomain.com/api';
export const DEBUG_MODE = false;
export const ENABLE_ANALYTICS = true;
```

## Coolify-Specific Configuration

### Resource Limits (Optional)

In Coolify, you can set resource limits:

- **CPU Limit**: `1.0` (1 core)
- **Memory Limit**: `512Mi` (512 MB)
- **Memory Reservation**: `256Mi` (256 MB)

These can be adjusted based on your traffic and server capacity.

### Persistent Volumes (Optional)

If you need to store files locally (not using Cloudinary):

1. Go to **Volumes** section
2. Add a volume:
   - Source: `/data`
   - Destination: `/app/uploads`

### Auto-Deployment

Enable auto-deployment for continuous delivery:

1. Go to **Settings** → **Deployment**
2. Enable **Auto Deploy on Git Push**
3. Optionally set **Auto Deploy Branch** to `main`

## Monitoring and Logs

### View Application Logs

In Coolify:
- Go to your application
- Click on **Logs**
- Real-time logs will be displayed

### Set up Alerts (Optional)

Coolify can send notifications:
1. Go to **Settings** → **Notifications**
2. Configure email/Slack/Discord webhooks
3. Enable alerts for:
   - Deployment failures
   - Application crashes
   - Health check failures

## Troubleshooting

### Database Connection Issues

If you see database connection errors:

1. **Check connection string**:
   ```bash
   # In Coolify shell
   echo $DATABASE_URL
   ```

2. **Test database connectivity**:
   ```bash
   # In Coolify shell
   node -e "const {Pool} = require('pg'); new Pool({connectionString: process.env.DATABASE_URL}).query('SELECT 1').then(() => console.log('Connected')).catch(e => console.error(e))"
   ```

3. **Common issues**:
   - Wrong database host (use internal hostname for Coolify databases)
   - Missing SSL configuration for external databases
   - Firewall blocking connections

### Build Failures

1. **Check Dockerfile syntax**:
   ```bash
   docker build -t test-build -f backend/Dockerfile backend/
   ```

2. **Clear build cache** in Coolify:
   - Go to application settings
   - Click **Clear Build Cache**
   - Redeploy

### Application Crashes

1. **Check logs** for error messages
2. **Verify environment variables** are set correctly
3. **Check resource limits** (may need more memory)
4. **Test locally** with docker-compose:
   ```bash
   cd backend
   docker-compose up
   ```

### CORS Issues

If mobile app can't connect:

1. **Update ALLOWED_ORIGINS** in environment variables:
   ```env
   ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
   ```

2. **Check frontend domain** is included
3. **Redeploy** application after changes

## Security Best Practices

1. **Use Strong Secrets**:
   - Generate JWT_SECRET with: `openssl rand -base64 32`
   - Never commit secrets to Git
   - Rotate secrets periodically

2. **Enable HTTPS**:
   - Always use HTTPS in production
   - Enable "Force HTTPS" in Coolify

3. **Database Security**:
   - Use strong database passwords
   - Enable SSL for external databases
   - Restrict database access to application only

4. **Regular Updates**:
   - Keep Node.js image updated
   - Update dependencies regularly
   - Monitor security advisories

## Backup Strategy

### Database Backups

Coolify provides automated backups for managed databases:
1. Go to your PostgreSQL database
2. Enable **Automated Backups**
3. Set backup schedule (daily recommended)
4. Configure retention period

### Manual Backup

```bash
# Create backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore backup
psql $DATABASE_URL < backup-20251030.sql
```

## Scaling Considerations

### Horizontal Scaling

For high traffic, you can scale horizontally:
1. Deploy multiple instances of the backend
2. Use Coolify's load balancer
3. Ensure database can handle concurrent connections

### Vertical Scaling

Increase resources in Coolify:
- CPU: 2+ cores
- Memory: 1GB+ RAM

## Cost Optimization

1. **Resource Limits**: Set appropriate limits to avoid over-provisioning
2. **Database Optimization**: Use connection pooling (already configured)
3. **Image Optimization**: Use Cloudinary for image hosting (saves storage)
4. **Log Retention**: Configure log rotation to save disk space

## Additional Resources

- [Coolify Documentation](https://coolify.io/docs)
- [Hono Framework](https://hono.dev)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don't_Do_This)
- [Docker Security](https://docs.docker.com/engine/security/)

## Support

If you encounter issues:
1. Check Coolify logs and application logs
2. Review this deployment guide
3. Check the main AGENTS.md for project structure
4. Test locally with docker-compose before deploying

---

**Deployment Checklist**:
- [ ] PostgreSQL database created and accessible
- [ ] Cloudinary account set up
- [ ] All environment variables configured
- [ ] Domain configured (optional)
- [ ] HTTPS enabled
- [ ] Database schema created
- [ ] Admin user created
- [ ] Health check passing
- [ ] Admin panel accessible
- [ ] Mobile app configured with production API URL
- [ ] Backups enabled
