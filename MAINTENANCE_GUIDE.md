# Maintenance Guide - Darija Arabic Learning Platform

This guide provides detailed instructions for maintaining and updating the application.

## Table of Contents
- [Phrase Management](#phrase-management)
- [User Management](#user-management)
- [Database Maintenance](#database-maintenance)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting Guide](#troubleshooting-guide)
- [Backup & Recovery](#backup--recovery)

## Phrase Management

### Adding New Phrases

#### Step 1: Choose the Right Database File
```
database/
├── beginner_phrases.json      # A1-A2 level (basic everyday phrases)
├── intermediate_phrases.json  # B1-B2 level (complex conversations)
├── advanced_phrases.json      # C1-C2 level (idioms, formal language)
└── sentences_daily_conversations.json # Full sentences for context
```

#### Step 2: Create Unique ID
Generate a unique ID using this pattern:
- Phrases: `{category}_{number}` (e.g., `greetings_046`)
- Sentences: `sent_{number}` (e.g., `sent_401`)

#### Step 3: Add Complete Phrase Structure
```json
{
  "id": "greetings_046",
  "darija": "صباح الخير",
  "darija_latin": "sbah lkhir",
  "literal_english": "morning the good",
  "english": "Good morning",
  "translations": {
    "lebanese": {
      "phrase": "صباح الخير",
      "latin": "sabah el kheir",
      "audio": null
    },
    "syrian": {
      "phrase": "صباح الخير",
      "latin": "sabah el kheir",
      "audio": null
    },
    "emirati": {
      "phrase": "صباح الخير",
      "latin": "sabah el khair",
      "audio": null
    },
    "saudi": {
      "phrase": "صباح الخير",
      "latin": "sabah al-khair",
      "audio": null
    },
    "egyptian": {
      "phrase": "صباح الخير",
      "latin": "sabah el kheir",
      "audio": null
    },
    "formal_msa": {
      "phrase": "صباح الخير",
      "latin": "sabah al-khayr",
      "audio": null
    }
  },
  "category": "greetings",
  "difficulty": "beginner",
  "tags": ["greeting", "morning", "formal"],
  "usage": {
    "formality": "neutral",
    "frequency": "high",
    "context": ["morning", "greeting", "polite"]
  },
  "cultural_notes": "Universal morning greeting across all Arabic dialects",
  "common_mistakes": ["Don't use in the evening"]
}
```

### Modifying Existing Phrases

1. **Find the phrase** by ID in the appropriate JSON file
2. **Make changes** while preserving the structure
3. **Test locally** before committing:
```bash
npm run dev
# Navigate to Translation Hub
# Search for your modified phrase
# Verify all translations display correctly
```

### Removing Phrases

1. **Delete the phrase object** from the JSON file
2. **Check for references** in user progress data
3. **Consider impact** on users who have already learned this phrase

⚠️ **Warning**: Removing phrases may cause orphaned IDs in user progress. The app handles this automatically but it's better to deprecate rather than delete.

### Bulk Operations

For bulk updates, use a script:
```javascript
// bulk-update.js
const fs = require('fs');
const file = JSON.parse(fs.readFileSync('database/beginner_phrases.json'));

// Example: Add a tag to all phrases in a category
file.phrases.forEach(phrase => {
  if (phrase.category === 'greetings') {
    phrase.tags.push('social');
  }
});

fs.writeFileSync('database/beginner_phrases.json', JSON.stringify(file, null, 2));
```

## User Management

### Clerk Dashboard Operations

#### View User Activity
1. Sign in to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Users**
3. Click on any user to view:
   - Login history
   - Metadata (source/target language)
   - Session information

#### Modify User Metadata
```javascript
// In Clerk Dashboard > Users > Select User > Metadata
{
  "publicMetadata": {
    "sourceLanguage": "darija",
    "targetLanguage": "lebanese",
    "onboardingCompleted": true
  }
}
```

#### Reset User Progress
1. Go to Supabase Dashboard
2. Navigate to Table Editor
3. Find user in `user_progress` table
4. Delete their records from:
   - `phrase_progress`
   - `quiz_attempts`
   - `user_progress`

#### Ban/Unban Users
1. Clerk Dashboard > Users
2. Select user
3. Click "Ban user" or "Delete user"

### Supabase User Operations

#### View User Progress
```sql
-- Get user's learning statistics
SELECT 
  user_id,
  COUNT(DISTINCT phrase_id) as phrases_learned,
  AVG(CASE WHEN is_mastered THEN 1 ELSE 0 END) * 100 as mastery_rate
FROM phrase_progress
WHERE user_id = 'user_xxx'
GROUP BY user_id;
```

#### Reset Specific Progress
```sql
-- Reset quiz history
DELETE FROM quiz_attempts WHERE user_id = 'user_xxx';

-- Reset phrase progress
DELETE FROM phrase_progress WHERE user_id = 'user_xxx';

-- Or reset specific phrase
DELETE FROM phrase_progress 
WHERE user_id = 'user_xxx' AND phrase_id = 'greetings_001';
```

## Database Maintenance

### Regular Maintenance Tasks

#### Weekly Tasks
1. **Check Database Size**
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

2. **Clean Old Sessions**
```sql
-- Remove quiz attempts older than 6 months
DELETE FROM quiz_attempts 
WHERE created_at < NOW() - INTERVAL '6 months';
```

3. **Analyze Tables**
```sql
ANALYZE phrase_progress;
ANALYZE quiz_attempts;
ANALYZE user_progress;
```

#### Monthly Tasks
1. **Backup Database** (see Backup section)
2. **Review Slow Queries** in Supabase Dashboard
3. **Check Index Usage**
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan;
```

### Adding Indexes for Performance
```sql
-- Index for faster phrase lookups
CREATE INDEX idx_phrase_progress_lookup 
ON phrase_progress(user_id, phrase_id);

-- Index for quiz history queries
CREATE INDEX idx_quiz_attempts_user_date 
ON quiz_attempts(user_id, created_at DESC);
```

### Data Cleanup

#### Remove Orphaned Records
```sql
-- Find and remove phrase progress for non-existent users
DELETE FROM phrase_progress 
WHERE user_id NOT IN (SELECT user_id FROM user_progress);

-- Remove duplicate phrase progress entries
DELETE FROM phrase_progress a
USING phrase_progress b
WHERE a.id < b.id
  AND a.user_id = b.user_id
  AND a.phrase_id = b.phrase_id;
```

## Performance Optimization

### Frontend Optimization

#### 1. Bundle Size Analysis
```bash
npm run build
npm run analyze  # If configured, or use webpack-bundle-analyzer
```

#### 2. Lazy Loading Components
```javascript
// Implement lazy loading for heavy components
const QuizSystem = lazy(() => import('./components/QuizSystem'));
const ProgressTracker = lazy(() => import('./components/ProgressTracker'));
```

#### 3. Image Optimization
- Convert images to WebP format
- Use appropriate sizes for different screens
- Implement lazy loading for images

### Database Optimization

#### 1. Query Optimization
```sql
-- Add EXPLAIN ANALYZE to queries to see performance
EXPLAIN ANALYZE
SELECT * FROM phrase_progress
WHERE user_id = 'user_xxx'
AND is_mastered = true;
```

#### 2. Connection Pooling
Configure in Supabase Dashboard:
- Settings > Database
- Connection Pooling Mode: Transaction
- Pool Size: 15 (adjust based on load)

#### 3. Caching Strategy
The app implements caching in `progressService.ts`:
- Cache duration: 5 minutes
- Invalidate on updates
- localStorage fallback

### Monitoring Performance

#### Key Metrics to Track
1. **Page Load Time**: Should be < 3 seconds
2. **Time to Interactive**: Should be < 5 seconds
3. **API Response Time**: Should be < 500ms
4. **Database Query Time**: Should be < 100ms

#### Tools for Monitoring
- Browser DevTools Performance tab
- Supabase Dashboard Metrics
- Google Lighthouse
- Web Vitals

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue: Users Can't Sign In
**Symptoms**: Login button doesn't work, infinite loading
**Solutions**:
1. Check Clerk status: https://status.clerk.com
2. Verify environment variables are set
3. Check browser console for errors
4. Clear browser cache and cookies
5. Verify Clerk publishable key is correct

#### Issue: Progress Not Saving
**Symptoms**: Quiz scores not recorded, phrases not marked as learned
**Solutions**:
1. Check Supabase connection:
```javascript
// Browser console
console.log(import.meta.env.VITE_SUPABASE_URL);
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);
```
2. Verify RLS policies are enabled
3. Check user_id matches between Clerk and Supabase
4. Look for errors in browser Network tab

#### Issue: Phrases Not Loading
**Symptoms**: Empty Translation Hub, no quiz questions
**Solutions**:
1. Verify JSON files exist in `/database`
2. Check for JSON syntax errors:
```bash
# Validate JSON files
npx jsonlint database/beginner_phrases.json
```
3. Check browser console for parsing errors
4. Verify file permissions

#### Issue: Count Mismatches
**Symptoms**: Different numbers in stats bar vs hub
**Solutions**:
1. This is auto-fixed by orphaned ID cleanup
2. Manual fix:
```sql
-- Find orphaned phrase IDs
SELECT phrase_id FROM phrase_progress
WHERE phrase_id NOT IN (
  -- List all valid phrase IDs from your JSON files
);
```

#### Issue: Slow Performance
**Symptoms**: Laggy UI, slow page loads
**Solutions**:
1. Check network speed
2. Reduce quiz length for testing
3. Clear browser cache
4. Check Supabase response times
5. Implement pagination for large datasets

### Debug Mode

Enable debug mode for detailed logging:
```javascript
// In src/utils/logger.ts
export const logger = {
  log: (...args: any[]) => {
    if (import.meta.env.DEV || window.DEBUG_MODE) {
      console.log(...args);
    }
  }
};

// Enable in browser console
window.DEBUG_MODE = true;
```

## Backup & Recovery

### Automated Backups

#### Supabase Backups
- Automatic daily backups (Pro plan)
- Point-in-time recovery (Pro plan)
- Manual backup via Dashboard

#### Manual Database Backup
```bash
# Export all tables
pg_dump -h your-db-host -U postgres -d your-db-name > backup_$(date +%Y%m%d).sql

# Export specific tables
pg_dump -h your-db-host -U postgres -d your-db-name \
  -t user_progress -t phrase_progress -t quiz_attempts \
  > user_data_backup_$(date +%Y%m%d).sql
```

### Phrase Database Backup

#### Git-based Backup
All phrase JSON files are version controlled:
```bash
# Create backup branch
git checkout -b backup/$(date +%Y%m%d)
git add database/*.json
git commit -m "Backup phrase database $(date +%Y%m%d)"
git push origin backup/$(date +%Y%m%d)
```

#### Local Backup Script
```bash
#!/bin/bash
# backup-phrases.sh
BACKUP_DIR="backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR
cp -r database/*.json $BACKUP_DIR/
echo "Backup created in $BACKUP_DIR"
```

### Recovery Procedures

#### Restore Database from Backup
```bash
# Restore from SQL dump
psql -h your-db-host -U postgres -d your-db-name < backup_20240815.sql
```

#### Restore Phrases from Backup
```bash
# Restore from Git
git checkout backup/20240815 -- database/

# Or restore from local backup
cp backups/20240815/*.json database/
```

#### Emergency Recovery Checklist
1. [ ] Stop the application
2. [ ] Backup current state (even if corrupted)
3. [ ] Identify last known good backup
4. [ ] Restore database
5. [ ] Restore phrase files
6. [ ] Test with a test account
7. [ ] Clear CDN cache
8. [ ] Restart application
9. [ ] Monitor for issues

## Environment Variables Reference

### Required Variables
```env
# Clerk Authentication (Required)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx

# Supabase (Required)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxx

# Optional - Development
VITE_DEBUG_MODE=true
VITE_ANALYTICS_ENABLED=false
```

### Netlify Environment Variables
Set in Netlify Dashboard > Site Settings > Environment Variables:
- All VITE_ prefixed variables from .env
- NODE_VERSION=18 (if needed)
- NPM_FLAGS="--force" (if dependency issues)

## Security Checklist

### Monthly Security Review
- [ ] Review Clerk authentication logs for suspicious activity
- [ ] Check Supabase RLS policies are still active
- [ ] Audit user permissions and roles
- [ ] Review API key usage in Supabase
- [ ] Check for unusual database queries
- [ ] Update dependencies: `npm audit fix`
- [ ] Review error logs for security issues
- [ ] Verify HTTPS is enforced
- [ ] Check for exposed sensitive data in logs

### Incident Response
1. **Detect**: Monitor logs and user reports
2. **Contain**: Disable affected features/users
3. **Investigate**: Check logs, database, user activity
4. **Remediate**: Fix vulnerability, patch system
5. **Document**: Record incident and response
6. **Review**: Update procedures to prevent recurrence

---

*Last Updated: August 2024*
*For urgent support, contact the development team*