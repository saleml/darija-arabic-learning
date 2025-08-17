#!/bin/bash

# Remove all localStorage-related functions from AuthContext
sed -i '' '/const hashPassword/,/^  };$/d' src/contexts/AuthContext.tsx
sed -i '' '/const verifyPassword/,/^  };$/d' src/contexts/AuthContext.tsx
sed -i '' '/const initializeLocalStorage/,/^  };$/d' src/contexts/AuthContext.tsx
sed -i '' '/const loadUserProgressLocal/,/^  };$/d' src/contexts/AuthContext.tsx
sed -i '' '/const resetPasswordLocal/,/^  };$/d' src/contexts/AuthContext.tsx
sed -i '' '/const deleteAccountLocal/,/^  };$/d' src/contexts/AuthContext.tsx

echo "Cleaned up localStorage functions"