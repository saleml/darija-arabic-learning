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

export function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerkAuth();
  
  const [user, setUser] = useState<AuthContextType['user'] | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState('darija');
  const [targetLanguage, setTargetLanguage] = useState('lebanese');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (clerkUser) {
      // Get user metadata
      const metadata = clerkUser.unsafeMetadata as any || {};
      
      setUser({
        id: clerkUser.id,
        name: metadata.fullName || clerkUser.firstName || clerkUser.username || 'User',
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        avatarUrl: metadata.avatarUrl || clerkUser.imageUrl
      });
      
      setSourceLanguage(metadata.sourceLanguage || 'darija');
      setTargetLanguage(metadata.targetLanguage || 'lebanese');
      
      // Sync with Supabase for quiz data
      syncWithSupabase(clerkUser.id, clerkUser.primaryEmailAddress?.emailAddress || '');
    } else {
      setUser(null);
    }
    
    setIsLoading(false);
  }, [clerkUser, isLoaded]);

  const syncWithSupabase = async (userId: string, email: string) => {
    // Check if user profile exists in Supabase
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!existingProfile) {
      // Create profile in Supabase for quiz tracking
      await supabase.from('user_profiles').insert({
        id: userId,
        email: email,
        full_name: clerkUser?.firstName || 'User',
        source_language: 'darija',
        target_language: 'lebanese',
        daily_goal: 10,
        streak_days: 0,
        total_study_time: 0
      });
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
    if (!clerkUser) return;

    // Update Clerk user metadata
    const metadata: any = {};
    if (updates.name) metadata.fullName = updates.name;
    if (updates.avatarUrl) metadata.avatarUrl = updates.avatarUrl;
    if (updates.sourceLanguage) metadata.sourceLanguage = updates.sourceLanguage;
    if (updates.targetLanguage) metadata.targetLanguage = updates.targetLanguage;

    await clerkUser.update({
      unsafeMetadata: {
        ...clerkUser.unsafeMetadata,
        ...metadata
      }
    });

    // Update local state immediately
    if (updates.name || updates.avatarUrl) {
      setUser(prev => prev ? {
        ...prev,
        name: updates.name || prev.name,
        avatarUrl: updates.avatarUrl || prev.avatarUrl
      } : null);
    }
    
    if (updates.sourceLanguage) setSourceLanguage(updates.sourceLanguage);
    if (updates.targetLanguage) setTargetLanguage(updates.targetLanguage);

    // Also update Supabase for consistency
    if (clerkUser.id) {
      await supabase.from('user_profiles').update({
        full_name: updates.name,
        avatar_url: updates.avatarUrl,
        source_language: updates.sourceLanguage,
        target_language: updates.targetLanguage,
        updated_at: new Date().toISOString()
      }).eq('id', clerkUser.id);
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
    throw new Error('useAuth must be used within ClerkAuthProvider');
  }
  return context;
};