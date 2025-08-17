# How to Disable Bot Protection in Clerk

The signup form is showing "Please complete all required fields" because Clerk has bot protection (CAPTCHA) enabled. 

## To Fix This:

1. **Go to Clerk Dashboard**: https://dashboard.clerk.com

2. **Navigate to User & Authentication**:
   - Click on "User & Authentication" in the left sidebar
   - Select "Attack Protection"

3. **Disable Bot Protection**:
   - Find "Bot protection" section
   - Turn OFF "Bot sign-up protection"
   - Save changes

4. **Alternative: Email/Password Settings**:
   - Go to "User & Authentication" → "Email, Phone, Username"
   - Under Email address:
     - Ensure "Email address" is enabled
     - Turn OFF "Require email verification" (if you want instant access)
     - Turn OFF "Verify at sign-up" 

5. **Clear Browser Cache**:
   - After making changes in Clerk dashboard
   - Clear your browser cache or test in incognito mode

## Why This Happens:

When using custom forms with Clerk's SDK (instead of their hosted components), CAPTCHA implementation becomes tricky. The SDK expects a CAPTCHA element but in custom forms, it's better to disable bot protection entirely or use Clerk's hosted components.

## Console Logs to Check:

When you see these in console:
- `[Auth] Missing requirements: ['captcha_challenge']` - Bot protection is enabled
- `[Auth] Missing requirements: ['email_address_verification']` - Email verification is required

## Current Workaround:

The code now:
1. Detects if CAPTCHA is required
2. Shows appropriate error message
3. Logs detailed information for debugging

Once you disable bot protection in Clerk dashboard, signup will work smoothly!