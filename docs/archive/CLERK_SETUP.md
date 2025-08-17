# Clerk Setup Instructions

## 1. Create Clerk Account
1. Go to https://dashboard.clerk.com
2. Sign up for free account
3. Create new application called "Arabic Dialects Hub"

## 2. Get Your API Keys
In Clerk Dashboard:
1. Go to "API Keys" section
2. Copy your Publishable Key (starts with `pk_`)
3. Add to `.env` file:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

## 3. Configure Sign-in Methods
In Clerk Dashboard > User & Authentication:
1. Enable Email address
2. Enable Google OAuth (optional)
3. Enable Username (optional)

## 4. Set Profile Fields
In Clerk Dashboard > User & Authentication > Email, Phone, Username:
1. Add these custom fields to User Metadata:
   - `sourceLanguage` (string)
   - `targetLanguage` (string)
   - `avatarUrl` (string)
   - `fullName` (string)

## 5. Configure Appearance (Optional)
In Clerk Dashboard > Customization:
1. Set primary color to match your brand
2. Upload logo if desired

## 6. Production Setup
When ready for production:
1. Upgrade to production instance
2. Add production domain to allowed origins
3. Update environment variables with production keys