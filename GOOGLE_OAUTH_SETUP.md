# Google OAuth Setup Guide

## CRITICAL: Replace Demo Client ID

The current Google Client ID in `app.js` is a placeholder:
```javascript
const GOOGLE_CLIENT_ID = '1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com';
```

## Setup Real Google OAuth

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing one
3. Enable Google+ API and Google Identity Services

### 2. Configure OAuth Consent Screen
1. Go to APIs & Services > OAuth consent screen
2. Choose "External" user type
3. Fill required fields:
   - App name: "Gateways Proxy Platform"
   - User support email: admin@gateways.com
   - Developer contact: admin@gateways.com
4. Add scopes: email, profile, openid
5. Add test users if needed

### 3. Create OAuth 2.0 Credentials
1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Application type: "Web application"
4. Name: "Gateways Web Client"
5. Authorized JavaScript origins:
   - http://localhost:3000 (for testing)
   - https://yourdomain.com (production)
6. Authorized redirect URIs:
   - http://localhost:3000 (for testing)
   - https://yourdomain.com (production)

### 4. Update Client ID
Replace the placeholder in `app.js`:
```javascript
const GOOGLE_CLIENT_ID = 'YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com';
```

### 5. Domain Verification (Production)
1. Add your domain to Google Search Console
2. Verify domain ownership
3. Add domain to OAuth consent screen

## Security Notes
- Never commit real client IDs to public repositories
- Use environment variables for production
- Implement proper CSRF protection
- Validate JWT tokens server-side

## Testing
1. Serve files over HTTPS (required for production)
2. Test with authorized domains only
3. Monitor Google Cloud Console for errors

## Current Status
✅ Google Identity Services integrated
✅ JWT token parsing implemented
✅ User profile extraction working
❌ Real Client ID needed
❌ Domain verification required