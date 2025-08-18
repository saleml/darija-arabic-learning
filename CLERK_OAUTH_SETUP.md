# Clerk OAuth Setup Guide

## Critical Configuration Required in Clerk Dashboard

### 1. Go to Clerk Dashboard → Configure → Paths

Add these URLs to **"Allowed redirect URLs"**:
```
https://darija-tr.netlify.app/*
https://darija-tr.netlify.app/sso-callback
https://darija-tr.netlify.app/hub
http://localhost:5173/*
http://localhost:5173/sso-callback
http://localhost:5173/hub
```

### 2. Go to Clerk Dashboard → Configure → Domains

Add your production domain:
```
darija-tr.netlify.app
```

### 3. Go to User & Authentication → Restrictions

**IMPORTANT**: Turn OFF these settings if they're ON:
- [ ] **Bot protection** - This causes the CAPTCHA error
- [ ] **Require email verification** (for OAuth sign-ups)

### 4. Go to User & Authentication → Social Connections

For **Google**:
- ✅ Make sure it's enabled
- Check the "Callback URL" shown (should be `https://fleet-gannet-50.clerk.accounts.dev/v1/oauth_callback`)
- If using custom credentials, ensure they're correct

For **GitHub**:
- ✅ Already working (keep as is)

### 5. Environment Variables in Netlify

Go to Netlify Dashboard → Site Settings → Environment Variables

Make sure you have:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_ZmxlZXQtZ2FubmV0LTUwLmNsZXJrLmFjY291bnRzLmRldiQ
```

## The Issue

After Google OAuth, users are stuck on `fleet-gannet-50.accounts.dev` instead of being redirected back to your app. This happens when:
1. Redirect URLs aren't properly configured in Clerk
2. Bot protection is enabled (causing CAPTCHA issues)
3. The app domain isn't whitelisted

## Testing

After making these changes:
1. Clear your browser cookies for both domains
2. Try Google sign-in again
3. You should be redirected back to `https://darija-tr.netlify.app/hub` after successful auth

## Notes

- GitHub OAuth works, so the OAuth flow itself is functional
- The issue is specific to redirect configuration and possibly bot protection
- The development keys warning is normal for test instances