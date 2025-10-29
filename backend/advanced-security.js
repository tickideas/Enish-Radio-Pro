// Advanced Security Enhancements Phase 2
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { RateLimiterRedis } = require('rate-limiter-flexible');

// Advanced Threat Detection System
class AdvancedThreatDetector {
  constructor() {
    this.threatPatterns = new Map();
    this.suspiciousActivities = new Map();
    this.securityEvents = [];
    this.detectionRules = [];
    
    this.initializeDetectionRules();
  }

  initializeDetectionRules() {
    // SQL Injection Detection
    this.detectionRules.push({
      name: 'sql_injection',
      pattern: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)\b)|(['"];|--|\bUNION\b)/i,
      severity: 'high',
      action: 'block',
    });

    // XSS Detection
    this.detectionRules.push({
      name: 'xss_attempt',
      pattern: /<script[^>]*>.*?<\/script>|<[^>]*on\w+\s*=|javascript:|vbscript:/i,
      severity: 'medium',
      action: 'sanitize',
    });

    // Path Traversal Detection
    this.detectionRules.push({
      name: 'path_traversal',
      pattern: /\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c/i,
      severity: 'high',
      action: 'block',
    });

    // Command Injection Detection
    this.detectionRules.push({
      name: 'command_injection',
      pattern: /[;&|`$(){}[\]\\]/,
      severity: 'high',
      action: 'block',
    });

    // Brute Force Detection
    this.detectionRules.push({
      name: 'brute_force',
      pattern: (ip, context) => {
        const attempts = this.getFailedAttempts(ip);
        return attempts > 10; // More than 10 failed attempts
      },
      severity: 'critical',
      action: 'block_ip',
    });

    // DDoS Detection
    this.detectionRules.push({
      name: 'ddos_pattern',
      pattern: (ip, context) => {
        const requests = this.getRequestCount(ip, 60000); // Last minute
        return requests > 100; // More than 100 requests per minute
      },
      severity: 'critical',
      action: 'rate_limit',
    });

    // Bot Detection
    this.detectionRules.push({
      name: 'bot_pattern',
      pattern: (ip, context) => {
        const userAgent = context.userAgent || '';
        const botPatterns = [
          /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i,
        ];
        return botPatterns.some(pattern => pattern.test(userAgent));
      },
      severity: 'low',
      action: 'challenge',
    });
  }

  // Analyze request for threats
  analyzeRequest(request, context = {}) {
    const threats = [];
    const ip = this.extractClientIP(request);
    
    for (const rule of this.detectionRules) {
      try {
        if (this.matchesRule(rule, request, context, ip)) {
          const threat = {
            type: rule.name,
            severity: rule.severity,
            action: rule.action,
            ip: ip,
            timestamp: Date.now(),
            details: this.extractThreatDetails(request, rule.name),
          };
          
          threats.push(threat);
          this.handleThreat(threat, rule);
        }
      } catch (error) {
        console.error(`Error applying detection rule ${rule.name}:`, error);
      }
    }

    return threats;
  }

  // Check if request matches detection rule
  matchesRule(rule, request, context, ip) {
    if (typeof rule.pattern === 'string') {
      // Pattern matching on various request components
      const searchStrings = [
        request.url || '',
        JSON.stringify(request.body || {}),
        request.headers?.['user-agent'] || '',
        request.headers?.['referer'] || '',
      ];
      
      return searchStrings.some(str => rule.pattern.test(str));
    } else if (typeof rule.pattern === 'function') {
      return rule.pattern(ip, context);
    }
    
    return false;
  }

  // Handle detected threat
  handleThreat(threat, rule) {
    // Log security event
    this.logSecurityEvent(threat);

    // Track suspicious activity
    this.trackSuspiciousActivity(threat.ip, threat);

    // Apply mitigation action
    this.applyMitigation(threat, rule);
  }

  // Apply mitigation action
  applyMitigation(threat, rule) {
    switch (rule.action) {
      case 'block':
        threat.mitigation = 'request_blocked';
        break;
        
      case 'block_ip':
        threat.mitigation = 'ip_blocked';
        this.blockIP(threat.ip, 3600); // Block for 1 hour
        break;
        
      case 'rate_limit':
        threat.mitigation = 'rate_limited';
        this.rateLimitIP(threat.ip, 10, 3600); // 10 requests per hour
        break;
        
      case 'challenge':
        threat.mitigation = 'challenge_required';
        break;
        
      case 'sanitize':
        threat.mitigation = 'sanitized';
        break;
    }
  }

  // Extract client IP
  extractClientIP(request) {
    return request.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
           request.headers?.['x-real-ip'] ||
           request.headers?.['cf-connecting-ip'] ||
           request.connection?.remoteAddress ||
           'unknown';
  }

  // Extract threat details for logging
  extractThreatDetails(request, threatType) {
    const details = {
      method: request.method,
      url: request.url,
      userAgent: request.headers?.['user-agent'],
      referer: request.headers?.referer,
    };

    // Add specific details based on threat type
    switch (threatType) {
      case 'sql_injection':
        details.suspiciousInput = this.extractSuspiciousInput(request);
        break;
        
      case 'xss_attempt':
        details.suspiciousScript = this.extractSuspiciousScript(request);
        break;
        
      case 'path_traversal':
        details.path = this.extractSuspiciousPath(request);
        break;
    }

    return details;
  }

  // Extract suspicious input for SQL injection
  extractSuspiciousInput(request) {
    const input = JSON.stringify(request.body || {});
    const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)\b)|(['"];|--|\bUNION\b)/ig;
    const matches = input.match(sqlPattern);
    return matches ? matches.join(', ') : null;
  }

  // Extract suspicious script for XSS
  extractSuspiciousScript(request) {
    const searchStrings = [
      request.url || '',
      JSON.stringify(request.body || {}),
    ];
    
    for (const str of searchStrings) {
      const scriptMatch = str.match(/<script[^>]*>.*?<\/script>|<[^>]*on\w+\s*=|javascript:|vbscript:/i);
      if (scriptMatch) {
        return scriptMatch[0];
      }
    }
    
    return null;
  }

  // Extract suspicious path
  extractSuspiciousPath(request) {
    const urlMatch = request.url?.match(/\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c/);
    return urlMatch ? urlMatch[0] : null;
  }

  // Track suspicious activity per IP
  trackSuspiciousActivity(ip, threat) {
    if (!this.suspiciousActivities.has(ip)) {
      this.suspiciousActivities.set(ip, []);
    }
    
    const activities = this.suspiciousActivities.get(ip);
    activities.push({
      ...threat,
      id: crypto.randomUUID(),
    });

    // Keep only last 100 activities per IP
    if (activities.length > 100) {
      this.suspiciousActivities.set(ip, activities.slice(-100));
    }
  }

  // Get failed attempts count for IP
  getFailedAttempts(ip) {
    const activities = this.suspiciousActivities.get(ip) || [];
    return activities.filter(activity => 
      activity.type === 'brute_force' && 
      Date.now() - activity.timestamp < 3600000 // Last hour
    ).length;
  }

  // Get request count for IP in time window
  getRequestCount(ip, timeWindow) {
    const activities = this.suspiciousActivities.get(ip) || [];
    const cutoff = Date.now() - timeWindow;
    return activities.filter(activity => 
      activity.timestamp > cutoff
    ).length;
  }

  // Block IP address
  blockIP(ip, duration = 3600) {
    // This would typically be implemented with Redis or database
    console.log(`Blocking IP ${ip} for ${duration} seconds`);
    
    // In production, you would:
    // 1. Add IP to blocked list in Redis
    // 2. Add to firewall rules
    // 3. Log the blocking event
  }

  // Rate limit IP address
  rateLimitIP(ip, limit, window) {
    console.log(`Rate limiting IP ${ip}: ${limit} requests per ${window} seconds`);
    
    // This would typically be implemented with Redis
    // Using rate-limiter-flexible or similar
  }

  // Log security event
  logSecurityEvent(threat) {
    this.securityEvents.push({
      id: crypto.randomUUID(),
      ...threat,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 10000 events
    if (this.securityEvents.length > 10000) {
      this.securityEvents = this.securityEvents.slice(-10000);
    }

    // Send critical alerts immediately
    if (threat.severity === 'critical') {
      this.sendSecurityAlert(threat);
    }
  }

  // Send security alert
  sendSecurityAlert(threat) {
    console.log('🚨 SECURITY ALERT:', threat);
    
    // In production, this would:
    // 1. Send email/SMS alerts
    // 2. Post to Slack/Teams
    // 3. Trigger incident response workflow
    // 4. Create ticket in security system
  }

  // Get security dashboard data
  getSecurityDashboard() {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const last7Days = now - (7 * 24 * 60 * 60 * 1000);

    const recentEvents = this.securityEvents.filter(event => event.timestamp > last24Hours);
    const weeklyEvents = this.securityEvents.filter(event => event.timestamp > last7Days);

    // Calculate statistics
    const stats = {
      totalEvents: recentEvents.length,
      criticalEvents: recentEvents.filter(e => e.severity === 'critical').length,
      highEvents: recentEvents.filter(e => e.severity === 'high').length,
      mediumEvents: recentEvents.filter(e => e.severity === 'medium').length,
      lowEvents: recentEvents.filter(e => e.severity === 'low').length,
      
      blockedIPs: new Set(recentEvents.filter(e => e.mitigation === 'ip_blocked').map(e => e.ip)).size,
      rateLimitedIPs: new Set(recentEvents.filter(e => e.mitigation === 'rate_limited').map(e => e.ip)).size,
      
      threatTypes: this.getThreatTypeDistribution(recentEvents),
      topAttackingIPs: this.getTopAttackingIPs(recentEvents),
      timeline: this.getSecurityTimeline(weeklyEvents),
    };

    return stats;
  }

  // Get threat type distribution
  getThreatTypeDistribution(events) {
    const distribution = {};
    
    events.forEach(event => {
      distribution[event.type] = (distribution[event.type] || 0) + 1;
    });
    
    return distribution;
  }

  // Get top attacking IPs
  getTopAttackingIPs(events) {
    const ipCounts = {};
    
    events.forEach(event => {
      ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1;
    });
    
    return Object.entries(ipCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));
  }

  // Get security timeline for visualization
  getSecurityTimeline(events) {
    const timeline = {};
    
    events.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      timeline[date] = (timeline[date] || 0) + 1;
    });
    
    return Object.entries(timeline)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }
}

// Advanced Authentication with JWT enhancements
class EnhancedAuthentication {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
    this.tokenExpiry = {
      access: '15m',
      refresh: '7d',
      reset: '10m',
    };
    
    this.sessions = new Map();
    this.blacklistedTokens = new Set();
    this.deviceFingerprints = new Map();
  }

  // Generate enhanced JWT token
  generateTokens(user, deviceInfo = {}) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: crypto.randomUUID(),
      deviceId: this.generateDeviceId(deviceInfo),
      issuedAt: Date.now(),
      userAgent: deviceInfo.userAgent,
      ip: deviceInfo.ip,
    };

    // Access token (short-lived)
    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.tokenExpiry.access,
      algorithm: 'HS512',
      keyid: 'v1',
    });

    // Refresh token (long-lived)
    const refreshPayload = {
      ...payload,
      type: 'refresh',
    };
    
    const refreshToken = jwt.sign(refreshPayload, this.refreshTokenSecret, {
      expiresIn: this.tokenExpiry.refresh,
      algorithm: 'HS512',
      keyid: 'v1',
    });

    // Store session
    this.storeSession(payload.sessionId, {
      userId: user.id,
      deviceId: payload.deviceId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      ip: deviceInfo.ip,
      userAgent: deviceInfo.userAgent,
    });

    return {
      accessToken,
      refreshToken,
      sessionId: payload.sessionId,
      expiresIn: this.parseExpiry(this.tokenExpiry.access),
    };
  }

  // Verify and decode JWT token
  verifyToken(token, type = 'access') {
    try {
      const secret = type === 'refresh' ? this.refreshTokenSecret : this.jwtSecret;
      const decoded = jwt.verify(token, secret, {
        algorithms: ['HS512'],
        maxAge: '7d',
      });

      // Check if token is blacklisted
      if (this.blacklistedTokens.has(token)) {
        throw new Error('Token has been revoked');
      }

      // Validate session still exists
      if (!this.sessions.has(decoded.sessionId)) {
        throw new Error('Session not found');
      }

      const session = this.sessions.get(decoded.sessionId);
      if (session.userId !== decoded.userId) {
        throw new Error('Session mismatch');
      }

      // Update last activity
      session.lastActivity = Date.now();
      this.sessions.set(decoded.sessionId, session);

      return decoded;
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  // Device-based authentication
  authenticateWithDevice(user, deviceInfo) {
    const deviceId = this.generateDeviceId(deviceInfo);
    
    // Check for suspicious device changes
    if (this.isNewDevice(user.id, deviceId, deviceInfo)) {
      // Send device verification notification
      this.sendDeviceVerification(user.email, deviceInfo);
      
      return {
        success: false,
        requiresVerification: true,
        verificationMethod: 'email',
      };
    }

    return this.generateTokens(user, deviceInfo);
  }

  // Check if this is a new device
  isNewDevice(userId, deviceId, deviceInfo) {
    const userDevices = this.deviceFingerprints.get(userId) || [];
    
    // Check if device already exists
    const existingDevice = userDevices.find(device => device.deviceId === deviceId);
    if (existingDevice) {
      // Update last seen
      existingDevice.lastSeen = Date.now();
      existingDevice.ip = deviceInfo.ip;
      return false;
    }

    // New device detected
    const newDevice = {
      deviceId,
      userAgent: deviceInfo.userAgent,
      ip: deviceInfo.ip,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
    };

    userDevices.push(newDevice);
    this.deviceFingerprints.set(userId, userDevices);

    return true;
  }

  // Generate device fingerprint
  generateDeviceId(deviceInfo) {
    const fingerprint = `${deviceInfo.userAgent || ''}|${deviceInfo.platform || ''}|${deviceInfo.screenResolution || ''}`;
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
  }

  // Send device verification
  async sendDeviceVerification(email, deviceInfo) {
    console.log(`📱 Device verification sent to ${email} for device:`, {
      userAgent: deviceInfo.userAgent,
      ip: deviceInfo.ip,
      timestamp: new Date().toISOString(),
    });

    // In production, this would send email/SMS
  }

  // Store session
  storeSession(sessionId, sessionData) {
    this.sessions.set(sessionId, sessionData);
    
    // Clean up old sessions
    if (this.sessions.size > 10000) {
      const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
      for (const [id, session] of this.sessions) {
        if (session.lastActivity < cutoff) {
          this.sessions.delete(id);
        }
      }
    }
  }

  // Parse expiry string to milliseconds
  parseExpiry(expiry) {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 15 * 60 * 1000; // Default 15 minutes
    }
  }

  // Revoke token
  revokeToken(token) {
    this.blacklistedTokens.add(token);
    
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.sessionId) {
        this.sessions.delete(decoded.sessionId);
      }
    } catch (error) {
      console.error('Error revoking token:', error);
    }
  }

  // Revoke all sessions for user
  revokeUserSessions(userId) {
    for (const [sessionId, session] of this.sessions) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
      }
    }
    
    // Invalidate device fingerprints
    this.deviceFingerprints.delete(userId);
  }

  // Get user sessions
  getUserSessions(userId) {
    const sessions = [];
    
    for (const [sessionId, session] of this.sessions) {
      if (session.userId === userId) {
        sessions.push({
          sessionId,
          ...session,
          isActive: session.lastActivity > Date.now() - (60 * 60 * 1000), // Active if seen in last hour
        });
      }
    }
    
    return sessions.sort((a, b) => b.lastActivity - a.lastActivity);
  }
}

// Enhanced encryption utilities
class EnhancedEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyDerivationRounds = 100000;
  }

  // Generate secure key from password
  deriveKey(password, salt = null) {
    const actualSalt = salt || crypto.randomBytes(32);
    return crypto.pbkdf2Sync(password, actualSalt, this.keyDerivationRounds, 32, 'sha256');
  }

  // Encrypt sensitive data
  encrypt(data, password) {
    try {
      const salt = crypto.randomBytes(32);
      const key = this.deriveKey(password, salt);
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipher(this.algorithm, key, iv);
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        salt: salt.toString('hex'),
        version: '1.0',
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  // Decrypt sensitive data
  decrypt(encryptedData, password) {
    try {
      const { encrypted, iv, authTag, salt } = encryptedData;
      const key = this.deriveKey(password, Buffer.from(salt, 'hex'));
      
      const decipher = crypto.createDecipher(this.algorithm, key, Buffer.from(iv, 'hex'));
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  // Generate secure random token
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Hash password with salt
  hashPassword(password, salt = null) {
    const actualSalt = salt || crypto.randomBytes(32);
    const hash = crypto.pbkdf2Sync(password, actualSalt, 100000, 64, 'sha512');
    return {
      hash: hash.toString('hex'),
      salt: actualSalt.toString('hex'),
    };
  }

  // Verify password
  verifyPassword(password, hash, salt) {
    const saltBuffer = Buffer.from(salt, 'hex');
    const hashBuffer = Buffer.from(hash, 'hex');
    const newHash = crypto.pbkdf2Sync(password, saltBuffer, 100000, 64, 'sha512');
    return crypto.timingSafeEqual(hashBuffer, newHash);
  }
}

// Security audit logger
class SecurityAuditLogger {
  constructor() {
    this.auditLog = [];
    this.logLevels = ['info', 'warning', 'error', 'critical'];
  }

  // Log security event
  log(eventType, details, level = 'info', userId = null, ip = null) {
    const auditEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      eventType,
      details,
      level,
      userId,
      ip,
      sessionId: details.sessionId,
    };

    this.auditLog.push(auditEntry);

    // Keep only last 50000 entries
    if (this.auditLog.length > 50000) {
      this.auditLog = this.auditLog.slice(-50000);
    }

    // Log to console for critical events
    if (level === 'critical') {
      console.error('🔒 CRITICAL SECURITY EVENT:', auditEntry);
    }

    // In production, this would send to external audit system
    this.sendToExternalAudit(auditEntry);

    return auditEntry.id;
  }

  // Send audit entry to external system
  async sendToExternalAudit(auditEntry) {
    try {
      // In production, this would send to SIEM, Splunk, or similar
      console.log('📊 Audit log entry:', auditEntry);
    } catch (error) {
      console.error('Failed to send audit log to external system:', error);
    }
  }

  // Get audit log entries
  getAuditLogs(filters = {}) {
    let logs = [...this.auditLog];

    // Apply filters
    if (filters.eventType) {
      logs = logs.filter(log => log.eventType === filters.eventType);
    }
    
    if (filters.level) {
      logs = logs.filter(log => log.level === filters.level);
    }
    
    if (filters.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }
    
    if (filters.ip) {
      logs = logs.filter(log => log.ip === filters.ip);
    }
    
    if (filters.startDate) {
      logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
    }
    
    if (filters.endDate) {
      logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
    }

    // Sort by timestamp (newest first)
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Get audit statistics
  getAuditStats() {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const last7Days = now - (7 * 24 * 60 * 60 * 1000);

    const recentLogs = this.auditLog.filter(log => new Date(log.timestamp).getTime() > last24Hours);
    const weeklyLogs = this.auditLog.filter(log => new Date(log.timestamp).getTime() > last7Days);

    return {
      totalEntries: this.auditLog.length,
      last24Hours: recentLogs.length,
      last7Days: weeklyLogs.length,
      eventsByType: this.getEventTypeStats(weeklyLogs),
      eventsByLevel: this.getEventLevelStats(weeklyLogs),
      topUsers: this.getTopUsers(weeklyLogs),
      topIPs: this.getTopIPs(weeklyLogs),
    };
  }

  // Get event type statistics
  getEventTypeStats(logs) {
    const stats = {};
    logs.forEach(log => {
      stats[log.eventType] = (stats[log.eventType] || 0) + 1;
    });
    return stats;
  }

  // Get event level statistics
  getEventLevelStats(logs) {
    const stats = {};
    logs.forEach(log => {
      stats[log.level] = (stats[log.level] || 0) + 1;
    });
    return stats;
  }

  // Get top users by audit events
  getTopUsers(logs) {
    const userStats = {};
    logs.forEach(log => {
      if (log.userId) {
        userStats[log.userId] = (userStats[log.userId] || 0) + 1;
      }
    });
    
    return Object.entries(userStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));
  }

  // Get top IPs by audit events
  getTopIPs(logs) {
    const ipStats = {};
    logs.forEach(log => {
      if (log.ip) {
        ipStats[log.ip] = (ipStats[log.ip] || 0) + 1;
      }
    });
    
    return Object.entries(ipStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));
  }
}

// Main security manager
class AdvancedSecurityManager {
  constructor() {
    this.threatDetector = new AdvancedThreatDetector();
    this.auth = new EnhancedAuthentication();
    this.encryption = new EnhancedEncryption();
    this.auditLogger = new SecurityAuditLogger();
    
    this.initializeSecurityMonitoring();
  }

  initializeSecurityMonitoring() {
    // Start periodic security monitoring
    setInterval(() => {
      this.performSecurityChecks();
    }, 60000); // Every minute

    // Clean up expired data
    setInterval(() => {
      this.cleanup();
    }, 3600000); // Every hour
  }

  // Perform security checks
  performSecurityChecks() {
    // Check for expired sessions
    this.cleanupExpiredSessions();
    
    // Generate security report
    this.generateSecurityReport();
  }

  // Clean up expired sessions
  cleanupExpiredSessions() {
    const now = Date.now();
    const expiredSessions = [];
    
    for (const [sessionId, session] of this.auth.sessions) {
      if (session.lastActivity < now - (24 * 60 * 60 * 1000)) { // 24 hours
        expiredSessions.push(sessionId);
      }
    }
    
    expiredSessions.forEach(sessionId => {
      this.auth.sessions.delete(sessionId);
    });
    
    if (expiredSessions.length > 0) {
      this.auditLogger.log('session_cleanup', {
        cleanedSessions: expiredSessions.length,
      }, 'info');
    }
  }

  // Generate comprehensive security report
  generateSecurityReport() {
    const report = {
      timestamp: new Date().toISOString(),
      threatDetection: {
        dashboard: this.threatDetector.getSecurityDashboard(),
      },
      authentication: {
        activeSessions: this.auth.sessions.size,
        deviceFingerprints: this.auth.deviceFingerprints.size,
      },
      audit: {
        stats: this.auditLogger.getAuditStats(),
      },
    };

    // Store report (in production, this would be sent to monitoring system)
    console.log('🔒 Security Report:', report);
    
    return report;
  }

  // Analyze request for security threats
  analyzeRequest(request, context = {}) {
    return this.threatDetector.analyzeRequest(request, context);
  }

  // Authenticate user
  authenticate(user, deviceInfo = {}) {
    return this.auth.authenticateWithDevice(user, deviceInfo);
  }

  // Generate tokens
  generateTokens(user, deviceInfo = {}) {
    return this.auth.generateTokens(user, deviceInfo);
  }

  // Verify token
  verifyToken(token, type = 'access') {
    return this.auth.verifyToken(token, type);
  }

  // Encrypt sensitive data
  encrypt(data, password) {
    return this.encryption.encrypt(data, password);
  }

  // Decrypt sensitive data
  decrypt(encryptedData, password) {
    return this.encryption.decrypt(encryptedData, password);
  }

  // Log security event
  logAudit(eventType, details, level = 'info', userId = null, ip = null) {
    return this.auditLogger.log(eventType, details, level, userId, ip);
  }

  // Get security dashboard
  getSecurityDashboard() {
    return {
      threats: this.threatDetector.getSecurityDashboard(),
      sessions: this.auth.sessions.size,
      audit: this.auditLogger.getAuditStats(),
    };
  }

  // Cleanup resources
  cleanup() {
    this.cleanupExpiredSessions();
    
    // Clean up old threat events
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
    this.threatDetector.securityEvents = this.threatDetector.securityEvents.filter(
      event => event.timestamp > cutoff
    );
  }
}

// Export the advanced security manager
module.exports = {
  AdvancedSecurityManager,
  AdvancedThreatDetector,
  EnhancedAuthentication,
  EnhancedEncryption,
  SecurityAuditLogger,
};