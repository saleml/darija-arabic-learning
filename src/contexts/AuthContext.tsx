import { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';

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
    if (!isLoaded) return;

    if (clerkUser) {
      // Set user immediately from Clerk data
      const userData = {
        id: clerkUser.id,
        name: clerkUser.firstName || clerkUser.username || 'User',
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        avatarUrl: clerkUser.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${clerkUser.id}`
      };
      setUser(userData);
      
      // Load profile from Supabase in background (non-blocking)
      loadProfileData(clerkUser.id, userData.email);
    } else {
      setUser(null);
      setIsLoading(false);
    }
  }, [clerkUser, isLoaded]);

  const loadProfileData = async (userId: string, email: string) => {
    try {
      // Try to get existing profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)  // Use email as primary identifier
        .maybeSingle();

      if (profile) {
        // Update local state with database values
        setUser(prev => prev ? {
          ...prev,
          name: profile.full_name || prev.name,
          avatarUrl: profile.avatar_url || prev.avatarUrl
        } : null);
        setSourceLanguage(profile.source_language || 'darija');
        setTargetLanguage(profile.target_language || 'lebanese');
        
        // If profile has old ID, update it
        if (profile.id !== userId) {
          await supabase
            .from('user_profiles')
            .update({ id: userId })
            .eq('email', email);
        }
      } else {
        // Create profile if doesn't exist
        await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            email: email,
            full_name: clerkUser?.firstName || 'User',
            avatar_url: clerkUser?.imageUrl,
            source_language: 'darija',
            target_language: 'lebanese',
            daily_goal: 10,
            streak_days: 0,
            total_study_time: 0
          });
      }
    } catch (error) {
      // Silently fail - app works without database
      console.error('Database sync failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
    if (!user) return;

    // Update local state immediately for instant feedback
    if (updates.name || updates.avatarUrl) {
      setUser(prev => prev ? {
        ...prev,
        name: updates.name || prev.name,
        avatarUrl: updates.avatarUrl || prev.avatarUrl
      } : null);
    }
    
    if (updates.sourceLanguage) setSourceLanguage(updates.sourceLanguage);
    if (updates.targetLanguage) setTargetLanguage(updates.targetLanguage);

    // Update database in background (non-blocking)
    try {
      const dbUpdate: any = { updated_at: new Date().toISOString() };
      
      if (updates.name !== undefined) dbUpdate.full_name = updates.name;
      if (updates.avatarUrl !== undefined) dbUpdate.avatar_url = updates.avatarUrl;
      if (updates.sourceLanguage !== undefined) dbUpdate.source_language = updates.sourceLanguage;
      if (updates.targetLanguage !== undefined) dbUpdate.target_language = updates.targetLanguage;

      await supabase
        .from('user_profiles')
        .update(dbUpdate)
        .eq('id', user.id);
    } catch (error) {
      // Silently fail - local state is already updated
      console.error('Database update failed:', error);
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