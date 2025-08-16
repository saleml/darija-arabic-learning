# Deployment Guide - Darija Arabic Learning Platform

This guide walks you through deploying your app to production with Netlify + Supabase.

## Prerequisites

- GitHub account
- Netlify account (free)
- Supabase account (free)

## Step 1: Setup Supabase Database

### 1.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/login and create a new project
3. Choose a name (e.g., "darija-arabic-learning")
4. Select a region close to your users
5. Set a strong database password

### 1.2 Run Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the entire contents of `supabase/schema.sql`
3. Paste and run the SQL to create all tables and functions

### 1.3 Get Your Supabase Credentials

From your Supabase project settings:
- **Project URL**: `https://your-project-id.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsI...` (public key, safe to expose)

## Step 2: Setup Environment Variables

### 2.1 Create Local Environment File

```bash
# Copy the example and fill in your Supabase credentials
cp .env.example .env
```

Edit `.env`:
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_NAME=Darija Arabic Learning Platform
VITE_APP_VERSION=1.0.0
```

### 2.2 Test Locally

```bash
npm run dev
```

Try creating an account and taking a quiz to ensure database integration works.

## Step 3: Deploy to Netlify

### 3.1 Push to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit with Supabase integration"

# Create GitHub repository and push
git remote add origin https://github.com/your-username/darija-arabic-app.git
git branch -M main
git push -u origin main
```

### 3.2 Connect to Netlify

1. Go to [https://netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Choose GitHub and authorize
4. Select your repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18`

### 3.3 Add Environment Variables in Netlify

In your Netlify site settings → Environment variables:

```
VITE_SUPABASE_URL = https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY = your-anon-key-here
VITE_APP_NAME = Darija Arabic Learning Platform
VITE_APP_VERSION = 1.0.0
```

### 3.4 Deploy

Click "Deploy site" - Netlify will build and deploy automatically!

## Step 4: Configure Custom Domain (Optional)

### 4.1 In Netlify Dashboard

1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Enter your domain (e.g., `learn-darija.com`)

### 4.2 Update DNS

Point your domain's DNS to Netlify:
- **Type**: CNAME
- **Name**: www (or @)
- **Value**: your-site-name.netlify.app

## Step 5: Enable Authentication

### 5.1 Configure Supabase Auth

In Supabase Dashboard → Authentication → Settings:

1. **Site URL**: `https://your-domain.com` (or netlify URL)
2. **Redirect URLs**: Add your domain
3. Configure email templates (optional)
4. Enable social providers if desired (Google, GitHub, etc.)

## Step 6: Production Optimizations

### 6.1 Enable Analytics (Optional)

In `src/services/analytics.ts`, you can integrate:
- Google Analytics
- Mixpanel
- PostHog
- Or build custom dashboard with Supabase data

### 6.2 Setup Monitoring

Consider adding:
- **Sentry** for error tracking
- **LogRocket** for user session replay
- **Hotjar** for user behavior analytics

### 6.3 Performance

- Images are already optimized
- Bundle is tree-shaken
- Consider adding service worker for offline functionality

## Step 7: Backup Strategy

### 7.1 Database Backups

Supabase automatically backs up your database, but for extra safety:

```sql
-- Create a backup table
CREATE TABLE user_profiles_backup AS SELECT * FROM user_profiles;
CREATE TABLE quiz_attempts_backup AS SELECT * FROM quiz_attempts;
```

### 7.2 Code Backups

- GitHub already provides version control
- Consider automated deployments on push to `main`

## Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Ensure they start with `VITE_`
   - Redeploy after adding environment variables

2. **Authentication not working**
   - Check Site URL in Supabase matches your domain
   - Verify environment variables are set correctly

3. **Database connection issues**
   - Confirm RLS policies are set up correctly
   - Check that tables were created successfully

4. **Build fails**
   - Check Node version (use 18+)
   - Verify all dependencies are in package.json

### Getting Help

- Check browser console for errors
- Review Netlify deploy logs
- Check Supabase logs in dashboard
- Verify environment variables are correctly set

## Success! 🎉

Your Darija Arabic Learning Platform is now live with:

- ✅ Real user authentication
- ✅ Cloud database with user tracking
- ✅ Quiz analytics and progress tracking
- ✅ Automatic deployments from GitHub
- ✅ HTTPS and custom domain support
- ✅ Scalable architecture

Users can now:
- Create accounts and sign in
- Take quizzes with intelligent distractors
- Track their learning progress
- Access spaced repetition system
- View analytics and streaks

The app will automatically save all user interactions to the database for analytics and personalization!