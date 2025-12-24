# Backend Code Review Findings

## Critical Issues Found

### 1. **JWT Secret Fallback in Production** ❌
**Location**: `server.hono.js` (lines 95, 194, 247, 268)
**Severity**: HIGH - Security Risk
**Issue**: Using fallback JWT secret `'your-secret-key'` if `JWT_SECRET` is not set. This will expose production to attacks.
**Fix**: Enforce JWT_SECRET at startup.

### 2. **Vulnerable Rate Limiting Implementation** ❌
**Location**: `server.hono.js` (lines 57-79)
**Severity**: MEDIUM - Performance
**Issue**: In-memory rate limiting can be:
- Memory leak (no cleanup)
- Not suitable for distributed systems
- Can reach max IP addresses causing performance degradation
**Fix**: Implement time-window cleanup and cap the rateMap size.

### 3. **Race Condition in User Count Validation** ❌
**Location**: `server.hono.js` (lines 312-314, 331-333)
**Severity**: MEDIUM - Logic Bug
**Issue**: Between checking `adminCount <= 1` and updating, another request could delete the other admin.
**Fix**: Use database transaction or check again before update.

### 4. **Incorrect User Count Logic** ❌
**Location**: `drizzle/models/User.js` (line 148)
**Severity**: HIGH - Data Accuracy
**Issue**: `countByRole()` returns `result.length` instead of actual count.
```javascript
// Current (WRONG):
return result.length;  // Always returns 1 because query returns 1 row with count property

// Should be:
return result[0]?.count || 0;
```

### 5. **Missing Input Validation** ❌
**Location**: `server.hono.js` - Multiple routes
**Severity**: MEDIUM - Data Integrity
**Issue**: No validation for:
- Email format before database operations
- URL format validation for social links and ad targets
- Date validation for ad banners (endDate < startDate)
**Fix**: Add schema validation using Zod.

### 6. **Incomplete Cloudinary Deletion** ⚠️
**Location**: `server.hono.js` (lines 807-809)
**Severity**: MEDIUM - Data Cleanup
**Issue**: DELETE endpoint doesn't delete Cloudinary image.
**Fix**: Implement Cloudinary deletion.

### 7. **No Impression Tracking Endpoint** ⚠️
**Location**: Missing route
**Severity**: LOW - Feature Gap
**Issue**: `incrementImpression()` method exists but no endpoint to call it.
**Fix**: Add `/api/ads/:id/impression` endpoint.

### 8. **Drizzle 0.45.1 Migration Issue** ⚠️
**Location**: `drizzle/db.js` (lines 76-86)
**Severity**: MEDIUM - Maintenance
**Issue**: `syncSchema()` is now a placeholder. Drizzle now requires proper migrations.
**Fix**: Either use `drizzle-kit` for migrations or document the manual approach.

### 9. **No SQL Injection Prevention in Custom SQL** ❌
**Location**: `drizzle/models/MenuItem.js` (lines 36-57)
**Severity**: HIGH - Security
**Issue**: Using string templates in SQL without parameterization.
**Fix**: Use Drizzle's DDL API instead.

### 10. **JWT Token Not Validated for Expiration on Refresh** ⚠️
**Location**: `server.hono.js` (line 264)
**Severity**: MEDIUM - Security
**Issue**: `ignoreExpiration: true` means expired tokens can be refreshed indefinitely.
**Fix**: Add expiration check with reasonable grace period.

### 11. **No CORS Configuration for Production** ⚠️
**Location**: `server.hono.js` (line 35)
**Severity**: MEDIUM - Security
**Issue**: Hardcoded single domain for production. Should support environment config.
**Fix**: Make CORS origins configurable.

### 12. **Missing Environment Variable Validation** ❌
**Location**: `server.hono.js`, `server.hono.js`, `drizzle/db.js`
**Severity**: MEDIUM - Reliability
**Issue**: No validation for required env vars at startup (CLOUDINARY_*, JWT_SECRET, DATABASE_URL).
**Fix**: Add startup validation.

### 13. **Order By Clause Issues** ⚠️
**Location**: `server.hono.js` (line 16)
**Severity**: MEDIUM - Query Optimization
**Issue**: `orderBy(adBanners.priority, adBanners.createdAt)` - Drizzle requires `.orderBy()` chain.
**Fix**: Use proper Drizzle syntax.

### 14. **No Pagination Support** ⚠️
**Location**: All list endpoints
**Severity**: LOW - Scalability
**Issue**: No pagination for lists (social links, ads, menu items). Could return thousands of records.
**Fix**: Add limit/offset query parameters.

### 15. **Inconsistent Error Response Format** ⚠️
**Location**: Multiple endpoints
**Severity**: LOW - API Consistency
**Issue**: Some responses use `success` field, others don't consistently include `message`.
**Fix**: Standardize all error responses.

---

## Issues to Fix (Ordered by Severity)

1. ✅ Fix User count logic (HIGH)
2. ✅ Add JWT secret validation (HIGH)
3. ✅ Remove SQL injection vulnerability in MenuItem (HIGH)
4. ✅ Fix rate limiting memory leak (MEDIUM)
5. ✅ Add email/URL validation (MEDIUM)
6. ✅ Fix race condition in admin count check (MEDIUM)
7. ✅ Add environment variable validation (MEDIUM)
8. ✅ Implement Cloudinary deletion (MEDIUM)
9. ✅ Fix JWT refresh logic (MEDIUM)
10. ✅ Make CORS configurable (MEDIUM)

