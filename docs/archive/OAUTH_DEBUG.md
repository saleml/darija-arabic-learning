# 🔧 OAuth Debug Guide - GitHub/Google Still Not Working

## 🚨 **Current Status**
- GitHub and Google are set up in Clerk ✅
- User authorizes on GitHub/Google ✅ 
- Returns to homepage but not logged in ❌

## 🔍 **Debug Steps**

### Step 1: Check Clerk Configuration
1. **Go to Clerk Dashboard** → Your App → **Domains**
2. **Verify these domains are added:**
   ```
   http://localhost:5173
   https://localhost:5173
   ```

### Step 2: Check Social Connection Settings
1. **Clerk Dashboard** → **User & Authentication** → **Social Connections**
2. **For GitHub:**
   - Status should be ✅ **Configured**
   - Click **Settings** → verify redirect URI
   - Should be: `https://[your-clerk-subdomain].clerk.accounts.dev/v1/oauth_callback`

3. **For Google:**
   - Status should be ✅ **Configured**  
   - Click **Settings** → verify redirect URI
   - Should be: `https://[your-clerk-subdomain].clerk.accounts.dev/v1/oauth_callback`

### Step 3: Check Environment Variables
Verify your `.env` file has the correct Clerk key:
```bash
# This should be YOUR key, not the shared one
VITE_CLERK_PUBLISHABLE_KEY=pk_test_[your_actual_key]
```

### Step 4: Test Authentication Flow
1. **Open browser dev tools** (F12) → **Console** tab
2. **Clear all cookies/storage** for localhost:5173
3. **Go to** `http://localhost:5173`
4. **Click "Sign Up"** → **"Continue with GitHub"**
5. **Watch console for errors**

### Step 5: Check for Common Issues

#### Issue A: Domain Mismatch
- **Symptom:** Redirects but no login
- **Fix:** Add both `http://localhost:5173` AND `https://localhost:5173` to Clerk domains

#### Issue B: Wrong Redirect URI
- **Symptom:** OAuth error page
- **Fix:** In GitHub/Google OAuth apps, redirect URI should point to Clerk, not your app

#### Issue C: Session Not Persisting  
- **Symptom:** Briefly logged in, then logged out
- **Fix:** Check browser blocking third-party cookies

### Step 6: Manual Debug Test
Add this to your browser console when on homepage:
```javascript
// Check if Clerk is working
console.log('Clerk loaded:', window.Clerk);
console.log('Current user:', window.Clerk?.user);
```

### Step 7: Check Clerk Logs
1. **Clerk Dashboard** → **Logs**
2. **Look for failed authentication attempts**
3. **Check error messages**

## 🐛 **Most Likely Issues**

### 1. **Domain Configuration**
**Problem:** `localhost:5173` not in Clerk allowed domains
**Solution:** Add to Clerk Dashboard → Domains

### 2. **OAuth Redirect Mismatch**
**Problem:** GitHub/Google OAuth apps point to wrong URL
**Solution:** Update OAuth apps to point to Clerk callback URL

### 3. **Environment Variable**
**Problem:** Still using shared/temp Clerk key
**Solution:** Use your own publishable key from Clerk dashboard

### 4. **Browser Issues**
**Problem:** Cookies/storage blocking OAuth flow
**Solution:** Clear browser data, disable ad blockers

## 🚀 **Expected Working Flow**
1. User clicks "Continue with GitHub" 
2. Redirects to GitHub authorization
3. User clicks "Authorize"
4. Redirects to Clerk processing
5. Redirects back to your app 
6. User appears logged in ✅
7. Can access dashboard ✅

## 📋 **Debug Checklist**
- [ ] Added localhost:5173 to Clerk domains
- [ ] GitHub OAuth app points to Clerk callback URL
- [ ] Google OAuth app points to Clerk callback URL  
- [ ] Using correct VITE_CLERK_PUBLISHABLE_KEY
- [ ] Cleared browser cookies/storage
- [ ] Checked browser console for errors
- [ ] Checked Clerk dashboard logs
- [ ] Tested with incognito/private browser window

Let me know which step reveals the issue!