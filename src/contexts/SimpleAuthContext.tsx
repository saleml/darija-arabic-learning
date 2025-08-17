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

export function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerkAuth();
  
  const [user, setUser] = useState<AuthContextType['user'] | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState('darija');
  const [targetLanguage, setTargetLanguage] = useState('lebanese');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('SimpleAuthContext - isLoaded:', isLoaded, 'clerkUser:', clerkUser?.id);
    
    if (!isLoaded) {
      console.log('Clerk not loaded yet...');
      return;
    }

    if (clerkUser) {
      console.log('User signed in, loading profile...');
      loadOrCreateProfile(clerkUser.id, clerkUser.primaryEmailAddress?.emailAddress || '');
    } else {
      console.log('No user signed in');
      setUser(null);
      setIsLoading(false);
    }
  }, [clerkUser, isLoaded]);

  const loadOrCreateProfile = async (userId: string, email: string) => {
    console.log('loadOrCreateProfile called for:', userId, email);
    try {
      // Try to load existing profile from Supabase with timeout
      console.log('Fetching profile from Supabase...');
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Supabase timeout')), 5000);
      });
      
      // First try to find by Clerk ID, then by email
      const queryPromise = supabase
        .from('user_profiles')
        .select('*')
        .or(`id.eq.${userId},email.eq.${email}`)
        .limit(1)
        .maybeSingle();
      
      let profile, error;
      try {
        const result = await Promise.race([queryPromise, timeoutPromise]);
        ({ data: profile, error } = result as any);
      } catch (timeoutError) {
        console.log('Supabase query timed out, creating new profile...');
        error = timeoutError;
        profile = null;
      }
      
      console.log('Supabase response - profile:', profile, 'error:', error);

      if (error || !profile) {
        // Create new profile if doesn't exist
        const newProfile = {
          id: userId,
          email: email,
          full_name: clerkUser?.firstName || clerkUser?.username || 'User',
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          source_language: 'darija',
          target_language: 'lebanese',
          daily_goal: 10,
          streak_days: 0,
          total_study_time: 0
        };
        
        const { data: created, error: createError } = await supabase
          .from('user_profiles')
          .insert(newProfile)
          .select()
          .single();
          
        if (createError) {
          console.error('Error creating profile:', createError);
        } else {
          profile = created;
        }
      }

      if (profile) {
        // If profile exists but with old Supabase ID, update it to use Clerk ID
        if (profile.id !== userId) {
          console.log('Updating profile ID from', profile.id, 'to', userId);
          // Create new profile with Clerk ID
          const { data: newProfile } = await supabase
            .from('user_profiles')
            .upsert({
              ...profile,
              id: userId
            })
            .select()
            .single();
          profile = newProfile || profile;
        }
        
        setUser({
          id: userId,
          name: profile.full_name || 'User',
          email: profile.email,
          avatarUrl: profile.avatar_url
        });
        setSourceLanguage(profile.source_language || 'darija');
        setTargetLanguage(profile.target_language || 'lebanese');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
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

    try {
      // Build update object for Supabase
      const supabaseUpdate: any = {
        updated_at: new Date().toISOString()
      };
      
      if (updates.name !== undefined) supabaseUpdate.full_name = updates.name;
      if (updates.avatarUrl !== undefined) supabaseUpdate.avatar_url = updates.avatarUrl;
      if (updates.sourceLanguage !== undefined) supabaseUpdate.source_language = updates.sourceLanguage;
      if (updates.targetLanguage !== undefined) supabaseUpdate.target_language = updates.targetLanguage;

      console.log('Updating profile in Supabase:', supabaseUpdate);

      // Update in Supabase
      const { data, error } = await supabase
        .from('user_profiles')
        .update(supabaseUpdate)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      console.log('Profile updated successfully:', data);

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
      
    } catch (error) {
      console.error('Failed to update profile:', error);
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
    throw new Error('useAuth must be used within SimpleAuthProvider');
  }
  return context;
};