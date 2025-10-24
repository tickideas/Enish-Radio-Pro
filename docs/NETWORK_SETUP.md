# Network Setup Guide for Enish Radio Pro

## Mobile App ↔ Backend Connection

### Current Configuration

**Your Computer's IP Address**: `192.168.1.80`

**Backend API**: Running on `http://192.168.1.80:3000`

**Mobile App**: Configured to connect to `http://192.168.1.80:3000/api`

### Quick Start

1. **Start Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```
   
2. **Start Mobile App**:
   ```bash
   cd mobile-app
   npm start
   # Then press 'a' for Android or 'i' for iOS
   ```

3. **Verify Connection**:
   - Open the app
   - Tap the hamburger menu (☰) in the top-left
   - Scroll down to "Follow Us" section
   - You should see Twitter, Instagram, and YouTube icons

### Troubleshooting

#### "Network request failed" Error

**Problem**: The mobile app can't reach the backend server.

**Solutions**:

1. **Check your IP address hasn't changed**:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
   ```
   
   If it's different from `192.168.1.80`, update:
   - `mobile-app/constants/radio.ts` - Update the `BASE_URL`
   - `backend/server.hono.js` - Update CORS origins

2. **Ensure both devices are on the same WiFi network**:
   - Your computer and phone/emulator must be on the same local network
   - Disable VPN if active
   - Check firewall settings aren't blocking port 3000

3. **Restart the backend server** after making CORS changes

4. **Clear Expo cache**:
   ```bash
   cd mobile-app
   npm start -- --clear
   ```

#### CORS Errors

If you see CORS-related errors in the console:

1. Check `backend/server.hono.js` includes your IP in the CORS origins
2. Restart the backend server
3. The CORS configuration should include:
   - `http://localhost:8081` (Expo Metro bundler)
   - `http://192.168.1.80:8081` (Your network IP)
   - `exp://192.168.1.80:8081` (Expo protocol)

#### Testing the API Manually

Test if the backend is accessible from your network:

```bash
# From your computer
curl http://192.168.1.80:3000/api/social-links/active

# Should return JSON with social links
```

### Using on Physical Device vs Emulator

**iOS Simulator**: Can use `localhost` (but network IP is more reliable)

**Android Emulator**: 
- `10.0.2.2` maps to host's `localhost`
- Or use your network IP: `192.168.1.80`

**Physical Device**: 
- **Must** use your computer's network IP: `192.168.1.80`
- Device and computer must be on same WiFi

### Production Configuration

When deploying to production, update:

```typescript
// mobile-app/constants/radio.ts
export const API_ENDPOINTS = {
  BASE_URL: __DEV__ 
    ? 'http://192.168.1.80:3000/api'  // Development
    : 'https://api.enishradio.com/api', // Production
  ...
}
```

And deploy your backend to a public server with a proper domain.

### Current Network Configuration

**Development**:
- Backend: `http://192.168.1.80:3000`
- Mobile API calls: `http://192.168.1.80:3000/api`
- Expo Metro: `http://192.168.1.80:8081`

**Production** (when deployed):
- Backend: `https://api.enishradio.com`
- Mobile API calls: `https://api.enishradio.com/api`

---

*Last updated: October 24, 2025*
*Your IP: 192.168.1.80*
