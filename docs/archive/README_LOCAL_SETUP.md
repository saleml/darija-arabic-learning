# Local Development Setup

## Running Locally (without Supabase)

The app now supports running fully locally using localStorage instead of Supabase.

### Setup:

1. **Use the local environment file**:
   - The `.env.local` file is already configured to use placeholder values
   - This will trigger the localStorage fallback mode

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Clear browser data for fresh testing**:
   - Visit: http://localhost:5173/clear-and-test.html
   - Click "Clear Everything & Reload"

### Features in Local Mode:

✅ **User Authentication**:
- Sign up with any email/password
- Login/logout functionality
- Password validation (8+ chars, uppercase, lowercase, numbers, special chars)
- Demo account: demo@example.com / Demo123!

✅ **Language Preferences**:
- Language selection on signup
- Source and target language dropdowns in header
- Preferences persist in localStorage

✅ **Data Persistence**:
- User progress saved locally
- Quiz scores tracked
- Language preferences saved

⚠️ **Limitations**:
- No email confirmation (accounts work immediately)
- No password reset emails (feature shows success but doesn't send email)
- Data only persists in current browser
- No sync across devices

### Chrome Password Manager

For Chrome to offer to save passwords:

1. The form needs proper attributes (already added):
   - `autocomplete="email"` on email field
   - `autocomplete="new-password"` for signup
   - `autocomplete="current-password"` for login

2. Chrome may not prompt in some cases:
   - If you've previously declined to save for this site
   - In incognito mode (depends on settings)
   - If Chrome password saving is disabled

To force Chrome to prompt:
1. Go to Chrome Settings → Passwords
2. Make sure "Offer to save passwords" is ON
3. Remove any existing saved passwords for localhost:5173
4. Try signing up with a new account

### Testing the Full Flow:

1. **Clear storage**: http://localhost:5173/clear-and-test.html
2. **Sign up**: Create a new account
3. **Select languages**: Choose source and target languages
4. **Check features**:
   - Language dropdowns in header
   - TranslationHub shows phrases in source language
   - Quiz defaults to your selected languages
   - Progress is saved locally

### Switching Between Local and Supabase:

- **For local development**: Use `.env.local` (already configured)
- **For Supabase**: Rename `.env` to `.env.local` and add real credentials
- The app automatically detects which mode to use

### Troubleshooting:

If features aren't showing:
1. Check browser console for errors
2. Clear all browser data and try again
3. Make sure you're using the latest code
4. Verify localStorage is enabled in your browser