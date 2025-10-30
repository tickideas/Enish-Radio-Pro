# Enish Radio Pro - Coolify Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        COOLIFY PLATFORM                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │                    Load Balancer / Proxy                  │    │
│  │                     (Traefik/Caddy)                       │    │
│  │                  - HTTPS (Let's Encrypt)                  │    │
│  │                  - Domain: api.yourdomain.com             │    │
│  └──────────────────────┬────────────────────────────────────┘    │
│                         │                                          │
│                         ↓                                          │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │              Backend Application Container                │    │
│  │                  (enish-radio-backend)                    │    │
│  ├───────────────────────────────────────────────────────────┤    │
│  │                                                           │    │
│  │  Node.js 20 Alpine                                       │    │
│  │  ├─ Hono Framework (4.6.8)                              │    │
│  │  ├─ Drizzle ORM (0.44.7)                                │    │
│  │  ├─ JWT Authentication                                   │    │
│  │  ├─ Cloudinary Integration                              │    │
│  │  ├─ Rate Limiting (100/15min)                           │    │
│  │  └─ Health Checks (/api/health)                         │    │
│  │                                                           │    │
│  │  Resources:                                              │    │
│  │  - CPU: 1 core                                           │    │
│  │  - Memory: 512MB                                         │    │
│  │  - Port: 3000                                            │    │
│  │                                                           │    │
│  │  Environment Variables:                                  │    │
│  │  ├─ DATABASE_URL                                         │    │
│  │  ├─ JWT_SECRET                                           │    │
│  │  ├─ CLOUDINARY_*                                         │    │
│  │  ├─ NODE_ENV=production                                  │    │
│  │  └─ ALLOWED_ORIGINS                                      │    │
│  │                                                           │    │
│  └─────────────────────┬─────────────────────────────────────┘    │
│                        │                                           │
│                        ↓                                           │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │              PostgreSQL Database Container                │    │
│  │                    (enish-radio-db)                       │    │
│  ├───────────────────────────────────────────────────────────┤    │
│  │                                                           │    │
│  │  PostgreSQL 16 Alpine                                    │    │
│  │  ├─ Database: enish_radio_pro                           │    │
│  │  ├─ User: enish_user                                     │    │
│  │  ├─ SSL Support                                          │    │
│  │  └─ Automated Backups                                    │    │
│  │                                                           │    │
│  │  Tables:                                                  │    │
│  │  ├─ users (Authentication)                               │    │
│  │  ├─ socialLinks (Social media)                          │    │
│  │  ├─ adBanners (Advertisements)                          │    │
│  │  └─ streamMetadata (Radio info)                         │    │
│  │                                                           │    │
│  │  Volume: /var/lib/postgresql/data                        │    │
│  │                                                           │    │
│  └───────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

                                ↕
                    External Services

          ┌─────────────────────────────┐
          │   Cloudinary CDN            │
          │   (Image Storage)           │
          │   - Ad banner uploads       │
          │   - Image optimization      │
          │   - CDN delivery            │
          └─────────────────────────────┘

                                ↕
                         Mobile Clients

     ┌──────────────┐         ┌──────────────┐
     │   iOS App    │         │ Android App  │
     │  (Expo/RN)   │         │  (Expo/RN)   │
     └──────────────┘         └──────────────┘


═══════════════════════════════════════════════════════════════════

                        API ENDPOINTS

Public Endpoints (No Auth Required):
  GET  /api/health                    - Health check
  GET  /api/social-links/active       - Active social links
  GET  /api/ads                        - Active ad banners
  POST /api/ads/:id/click             - Track ad clicks
  GET  /api/stream/metadata           - Current track info

Authentication Endpoints:
  POST /api/auth/login                - User login
  POST /api/auth/verify               - Verify JWT token
  POST /api/auth/refresh              - Refresh JWT token

Admin Endpoints (Requires Auth):
  POST   /api/auth/register           - Create new user
  GET    /api/auth/users              - List all users
  
  GET    /api/social-links/admin      - All social links
  POST   /api/social-links            - Create social link
  PUT    /api/social-links/:id        - Update social link
  DELETE /api/social-links/:id        - Delete social link
  
  GET    /api/ads/admin               - All ad banners
  POST   /api/ads                     - Create ad banner
  PUT    /api/ads/:id                 - Update ad banner
  DELETE /api/ads/:id                 - Delete ad banner
  
  GET    /api/analytics/overview      - Dashboard analytics
  GET    /api/analytics/ad-clicks     - Ad click analytics

Admin Panel:
  /admin/                             - Admin dashboard UI

═══════════════════════════════════════════════════════════════════

                    DEPLOYMENT WORKFLOW

    ┌─────────────────────────────────────────────────┐
    │  1. GitHub Repository                           │
    │     tickideas/Enish-Radio-Pro                   │
    │     Branch: main                                │
    └───────────────────┬─────────────────────────────┘
                        │
                        ↓ (git push or webhook)
    ┌─────────────────────────────────────────────────┐
    │  2. Coolify Build Process                       │
    │     - Clone repository                          │
    │     - Build Docker image (backend/Dockerfile)   │
    │     - Run health checks                         │
    │     - Tag with version                          │
    └───────────────────┬─────────────────────────────┘
                        │
                        ↓ (deployment)
    ┌─────────────────────────────────────────────────┐
    │  3. Container Orchestration                     │
    │     - Stop old container (if exists)            │
    │     - Start new container                       │
    │     - Inject environment variables              │
    │     - Connect to database                       │
    │     - Register with load balancer               │
    └───────────────────┬─────────────────────────────┘
                        │
                        ↓ (verification)
    ┌─────────────────────────────────────────────────┐
    │  4. Health Check & Monitoring                   │
    │     - Check /api/health endpoint                │
    │     - Verify database connection                │
    │     - Monitor resource usage                    │
    │     - Enable traffic routing                    │
    └─────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════

                     SECURITY LAYERS

    ┌─────────────────────────────────────────────────┐
    │  Layer 1: Network Security                      │
    │  - HTTPS/TLS encryption (Let's Encrypt)         │
    │  - Firewall rules                               │
    │  - DDoS protection                              │
    └─────────────────────────────────────────────────┘
                        ↓
    ┌─────────────────────────────────────────────────┐
    │  Layer 2: Application Security                  │
    │  - CORS policy                                  │
    │  - Rate limiting (100 req/15min)                │
    │  - Secure headers (HSTS, CSP, etc.)             │
    │  - Input validation & sanitization              │
    └─────────────────────────────────────────────────┘
                        ↓
    ┌─────────────────────────────────────────────────┐
    │  Layer 3: Authentication & Authorization        │
    │  - JWT tokens (24h expiry)                      │
    │  - Role-based access (admin/moderator)          │
    │  - Password hashing (bcrypt, 12 rounds)         │
    │  - Token refresh mechanism                      │
    └─────────────────────────────────────────────────┘
                        ↓
    ┌─────────────────────────────────────────────────┐
    │  Layer 4: Database Security                     │
    │  - SSL/TLS connections                          │
    │  - Strong passwords                             │
    │  - Connection pooling                           │
    │  - Automated backups                            │
    └─────────────────────────────────────────────────┘
                        ↓
    ┌─────────────────────────────────────────────────┐
    │  Layer 5: Container Security                    │
    │  - Non-root user (nodejs:1001)                  │
    │  - Minimal base image (Alpine)                  │
    │  - Read-only filesystem (where possible)        │
    │  - Resource limits (CPU/Memory)                 │
    └─────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════

                     MONITORING POINTS

    ┌──────────────────┐     ┌──────────────────┐
    │  Health Checks   │     │  Resource Usage  │
    │  - /api/health   │     │  - CPU           │
    │  - Every 30s     │     │  - Memory        │
    │  - Auto-restart  │     │  - Disk I/O      │
    └──────────────────┘     └──────────────────┘
              ↓                       ↓
    ┌──────────────────────────────────────────┐
    │          Coolify Dashboard               │
    │  - Real-time logs                        │
    │  - Container status                      │
    │  - Performance metrics                   │
    │  - Alert configuration                   │
    └──────────────────────────────────────────┘
              ↓                       ↓
    ┌──────────────────┐     ┌──────────────────┐
    │  Application     │     │  Database        │
    │  Logs            │     │  Metrics         │
    │  - API requests  │     │  - Connections   │
    │  - Errors        │     │  - Query times   │
    │  - Performance   │     │  - Storage       │
    └──────────────────┘     └──────────────────┘

═══════════════════════════════════════════════════════════════════

                     BACKUP STRATEGY

    ┌─────────────────────────────────────────────────┐
    │  Automated Database Backups (Coolify)           │
    │  - Schedule: Daily at 2:00 AM                   │
    │  - Retention: 7 days (configurable)             │
    │  - Storage: Coolify managed or S3               │
    │  - Compression: gzip                            │
    └─────────────────────────────────────────────────┘
                        ↓
    ┌─────────────────────────────────────────────────┐
    │  Manual Backup Commands                         │
    │  pg_dump $DATABASE_URL > backup.sql             │
    │  Restore: psql $DATABASE_URL < backup.sql       │
    └─────────────────────────────────────────────────┘
                        ↓
    ┌─────────────────────────────────────────────────┐
    │  Configuration Backup                           │
    │  - Environment variables (documented)           │
    │  - Docker configs (.env.coolify)                │
    │  - Application settings                         │
    └─────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════

                    SCALING OPTIONS

  Vertical Scaling (Single Instance):
    ┌─────────────────────────────────────────────────┐
    │  Increase Resources:                            │
    │  - CPU: 1 → 2+ cores                            │
    │  - Memory: 512MB → 1GB+                         │
    │  - Database: Upgrade instance                   │
    └─────────────────────────────────────────────────┘

  Horizontal Scaling (Multiple Instances):
    ┌─────────────────────────────────────────────────┐
    │       Load Balancer (Round Robin)               │
    └───┬─────────────┬─────────────┬─────────────┬───┘
        │             │             │             │
        ↓             ↓             ↓             ↓
    ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
    │Backend │   │Backend │   │Backend │   │Backend │
    │   #1   │   │   #2   │   │   #3   │   │   #4   │
    └────────┘   └────────┘   └────────┘   └────────┘
        └─────────────┴─────────────┴─────────────┘
                        ↓
              ┌──────────────────┐
              │    PostgreSQL     │
              │  (Separate Host)  │
              └──────────────────┘

═══════════════════════════════════════════════════════════════════
