import { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';

interface AuthContextType {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  } | null;
  sourceLanguage: string;
  targetLanguage: string;
  isLoading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (updates: {
    name?: string;
    avatarUrl?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerkAuth();
  
  const [user, setUser] = useState<AuthContextType['user'] | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState('darija');
  const [targetLanguage, setTargetLanguage] = useState('lebanese');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {

    // Wait for Clerk to load
    if (!isLoaded) {

      return;
    }

    // Add a timeout to ensure loading completes even if something goes wrong
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {

        setIsLoading(false);
      }
    }, 5000); // 5 second timeout

    if (clerkUser) {

      // Get metadata from unsafeMetadata (where we store it client-side)
      const unsafeMetadata = clerkUser.unsafeMetadata as {
        sourceLanguage?: string;
        targetLanguage?: string;
        avatarUrl?: string;
        fullName?: string;
        avatarId?: number;
      } | undefined;
      
      // Also check publicMetadata in case it was set server-side
      const publicMetadata = clerkUser.publicMetadata as {
        sourceLanguage?: string;
        targetLanguage?: string;
        avatarUrl?: string;
        fullName?: string;
      } | undefined;
      
      // Merge metadata (prefer unsafe over public since that's what we update)
      const metadata = { ...publicMetadata, ...unsafeMetadata };

      // Set user data from Clerk
      const userData = {
        id: clerkUser.id,
        name: metadata?.fullName || clerkUser.firstName || clerkUser.username || 'User',
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        avatarUrl: metadata?.avatarUrl || clerkUser.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${clerkUser.id}`
      };
      
      // Set languages from metadata
      if (metadata?.sourceLanguage) {
        setSourceLanguage(metadata.sourceLanguage);
      }
      if (metadata?.targetLanguage) {
        setTargetLanguage(metadata.targetLanguage);
      }

      setUser(userData);
      
      // Set loading to false immediately
      setIsLoading(false);
      clearTimeout(loadingTimeout);

    } else {

      setUser(null);
      setIsLoading(false);
      clearTimeout(loadingTimeout);
      console.log('[AuthContext] Loading complete (no user)');
    }

    return () => clearTimeout(loadingTimeout);
  }, [clerkUser, isLoaded]);

  const signOut = async () => {

    await clerkSignOut();
    setUser(null);
    window.location.href = '/';
  };

  const updateProfile = async (updates: {
    name?: string;
    avatarUrl?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
  }) => {
    if (!user || !clerkUser) {

      return;
    }

    // Update local state immediately for instant feedback
    if (updates.name !== undefined || updates.avatarUrl !== undefined) {
      setUser(prev => prev ? {
        ...prev,
        name: updates.name !== undefined ? updates.name : prev.name,
        avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : prev.avatarUrl
      } : null);
    }
    
    if (updates.sourceLanguage !== undefined) setSourceLanguage(updates.sourceLanguage);
    if (updates.targetLanguage !== undefined) setTargetLanguage(updates.targetLanguage);

    // Update Clerk metadata - THIS IS THE ONLY PLACE DATA IS STORED
    try {
      const metadataUpdate: any = {};
      
      if (updates.name !== undefined) {
        metadataUpdate.fullName = updates.name;
      }
      if (updates.avatarUrl !== undefined) {
        metadataUpdate.avatarUrl = updates.avatarUrl;
      }
      if (updates.sourceLanguage !== undefined) {
        metadataUpdate.sourceLanguage = updates.sourceLanguage;
      }
      if (updates.targetLanguage !== undefined) {
        metadataUpdate.targetLanguage = updates.targetLanguage;
      }
      
      if (Object.keys(metadataUpdate).length > 0) {

        // Get current metadata to preserve any other fields
        const currentUnsafeMetadata = clerkUser.unsafeMetadata || {};
        
        // Update Clerk user - use unsafeMetadata for client-side updates
        try {
          const result = await clerkUser.update({
            unsafeMetadata: {
              ...currentUnsafeMetadata,
              ...metadataUpdate
            }
          });

        } catch (updateError: any) {

          throw updateError;
        }

      }
      
    } catch (error) {

      // Revert local state on error
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      sourceLanguage,
      targetLanguage,
      isLoading,
      signOut,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};