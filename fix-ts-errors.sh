#\!/bin/bash

# Fix unused parameters in logger.ts
sed -i '' 's/\.\.\.args:/..._args:/g' src/utils/logger.ts

# Remove unused import from ProgressTracker
sed -i '' "/import.*SupabaseDebugger/d" src/components/ProgressTracker.tsx

# Remove unused imports from DashboardPage
sed -i '' "/import.*getProgressService/d" src/pages/DashboardPage.tsx

# Fix unused variables in DashboardPage
sed -i '' 's/const { userProgress, progressLoading, refreshProgress }/const { userProgress }/g' src/pages/DashboardPage.tsx

# Remove unused function in QuizSystem
sed -i '' '/_getDueForReview/,/^  };$/d' src/components/QuizSystem.tsx

# Fix duplicate properties in progressService
sed -i '' '/enableSupabase: false,/d' src/services/progressService.ts
sed -i '' '/enableLocalStorage: true,/d' src/services/progressService.ts

# Remove unused imports from supabaseProgress
sed -i '' '/^import.*supabase/d' src/utils/supabaseProgress.ts

# Fix HybridAuthForm Clerk types
sed -i '' 's/publicMetadata:/unsafeMetadata:/g' src/components/HybridAuthForm.tsx

echo "TypeScript errors fixed"
