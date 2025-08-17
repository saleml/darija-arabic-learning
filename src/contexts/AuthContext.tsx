import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, UserProfile } from '../lib/supabase';
import { UserProgress } from '../types';
import { getRandomAvatar } from '../components/AvatarSelector';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  lastLogin: string;
}

interface AuthContextType {
  user: User | null;
  userProgress: UserProgress | null;
  sourceLanguage: string;
  targetLanguage: string;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string, avatarUrl?: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserProgress: (progress: UserProgress) => Promise<void>;
  updateLanguagePreferences: (source: string, target: string) => Promise<void>;
  saveQuizAttempt: (quizData: any) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState<string>('darija');
  const [targetLanguage, setTargetLanguage] = useState<string>('lebanese');
  const [isLoading, setIsLoading] = useState(true);



  const loadUserProgressLocal = (userId: string) => {
    const progressKey = `userProgress_${userId}`;
    const storedProgress = localStorage.getItem(progressKey);
    
    if (storedProgress) {
      setUserProgress(JSON.parse(storedProgress));
    } else {
      // Initialize new progress for user
      const newProgress: UserProgress = {
        userId,
        phrasesLearned: [],
        phrasesInProgress: [],
        quizScores: [],
        spacedRepetition: [],
        streakDays: 0,
        lastActiveDate: new Date().toISOString(),
        totalStudyTime: 0,
        preferences: {
          targetDialect: 'all',
          dailyGoal: 10,
          soundEnabled: true,
          theme: 'light'
        }
      };
      setUserProgress(newProgress);
      localStorage.setItem(progressKey, JSON.stringify(newProgress));
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isInitialized = false;
    
    // Check for existing session
    const initializeAuth = async () => {
      console.log('[AuthContext] Initializing authentication...');
      
      // Check localStorage first for local development
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('[AuthContext] Found stored user:', userData.email);
          setUser(userData);
          loadUserProgressLocal(userData.id);
          
          // Load language preferences
          if (userData.sourceLanguage) setSourceLanguage(userData.sourceLanguage);
          if (userData.targetLanguage) setTargetLanguage(userData.targetLanguage);
          
          isInitialized = true;
          setIsLoading(false);
          return;
        } catch (e) {
          console.error('[AuthContext] Error parsing stored user:', e);
          localStorage.removeItem('currentUser'); // Clear corrupted data
        }
      }
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error && error.message?.includes('Please set up Supabase')) {
          // No localStorage fallback - Supabase only
          console.log('[AuthContext] Supabase not available');
          isInitialized = true;
          setIsLoading(false);
          return;
        }
        
        if (error) {
          console.error('[AuthContext] Error getting session:', error);
          isInitialized = true;
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          console.log('[AuthContext] Found existing session for:', session.user.email);
          await handleUserSession(session.user);
        } else {
          console.log('[AuthContext] No existing session found');
        }
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
        // No localStorage fallback
        console.log('[AuthContext] Initialization failed');
      } finally {
        isInitialized = true;
        setIsLoading(false);
      }
    };

    // Set a timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (!isInitialized) {
        console.warn('[AuthContext] Authentication timeout - showing landing page');
        setIsLoading(false);
        setUser(null);
      }
    }, 5000); // 5 second timeout

    initializeAuth();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      console.log('[AuthContext] Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        await handleUserSession(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserProgress(null);
      }
    });
    
    // Cleanup function
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const handleUserSession = async (supabaseUser: SupabaseUser) => {
    try {
      // Get user profile from database
      let { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('[AuthContext] Error fetching profile:', profileError);
        return;
      }

      // If profile doesn't exist, create it
      if (!profile) {
        console.log('[AuthContext] No profile found, creating one...');
        const newProfile = {
          id: supabaseUser.id,
          email: supabaseUser.email,
          full_name: supabaseUser.user_metadata?.full_name || '',
          avatar_url: supabaseUser.user_metadata?.avatar_url || getRandomAvatar(),
          source_language: 'darija',  // Default source language
          target_language: 'lebanese', // Default target language
          preferred_dialect: 'lebanese', // Keep for backward compatibility
          daily_goal: 10,
          streak_days: 0,
          total_study_time: 0
        };
        
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert(newProfile);

        if (createError) {
          console.error('[AuthContext] Error creating profile on login:', createError);
        } else {
          console.log('[AuthContext] Profile created successfully on login');
          profile = newProfile; // Use the newly created profile
        }
      }

      // Create user object
      const userData: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: profile?.full_name || supabaseUser.user_metadata?.full_name || 'User',
        avatarUrl: profile?.avatar_url || getRandomAvatar(),
        createdAt: supabaseUser.created_at,
        lastLogin: new Date().toISOString()
      };

      setUser(userData);
      await loadUserProgress(supabaseUser.id, profile);
      
    } catch (error) {
      console.error('[AuthContext] Error handling user session:', error);
    }
  };

  const loadUserProgress = async (userId: string, profile?: UserProfile) => {
    try {
      // Get phrase progress for spaced repetition
      const { data: phraseProgressData } = await supabase
        .from('phrase_progress')
        .select('*')
        .eq('user_id', userId);

      // Get recent quiz scores
      const { data: quizScoresData } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      // Convert to UserProgress format (maintaining compatibility with existing code)
      const spacedRepetition = phraseProgressData?.map((p: any) => ({
        phraseId: p.phrase_id,
        interval: p.interval_days,
        repetitions: p.correct_attempts,
        easeFactor: p.ease_factor,
        nextReviewDate: p.next_review,
        lastReviewDate: p.last_reviewed
      })) || [];

      const quizScores = quizScoresData?.map((q: any) => ({
        date: q.created_at,
        score: q.score,
        total: q.total_questions,
        difficulty: q.difficulty,
        timeSpent: q.time_spent
      })) || [];

      // Count learned phrases (those marked as mastered)
      const learnedPhrases = phraseProgressData?.filter((p: any) => p.status === 'mastered').map((p: any) => p.phrase_id) || [];
      const inProgressPhrases = phraseProgressData?.filter((p: any) => p.status === 'learning' || p.status === 'practicing').map((p: any) => p.phrase_id) || [];

      const userProgress: UserProgress = {
        userId,
        phrasesLearned: learnedPhrases,
        phrasesInProgress: inProgressPhrases,
        quizScores,
        spacedRepetition,
        streakDays: profile?.streak_days || 0,
        lastActiveDate: new Date().toISOString(),
        totalStudyTime: profile?.total_study_time || 0,
        preferences: {
          targetDialect: (profile?.target_language === 'darija' ? 'all' : profile?.target_language) || profile?.preferred_dialect || 'all',
          dailyGoal: profile?.daily_goal || 10,
          soundEnabled: true,
          theme: 'light'
        }
      };

      // Set language preferences
      if (profile) {
        setSourceLanguage(profile.source_language || 'darija');
        setTargetLanguage(profile.target_language || profile.preferred_dialect || 'lebanese');
      }

      setUserProgress(userProgress);
    } catch (error) {
      console.error('[AuthContext] Error loading user progress:', error);
      
      // Fallback to basic progress if database fails
      const basicProgress: UserProgress = {
        userId,
        phrasesLearned: [],
        phrasesInProgress: [],
        quizScores: [],
        spacedRepetition: [],
        streakDays: 0,
        lastActiveDate: new Date().toISOString(),
        totalStudyTime: 0,
        preferences: {
          targetDialect: 'all',
          dailyGoal: 10,
          soundEnabled: true,
          theme: 'light'
        }
      };
      setUserProgress(basicProgress);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('[AuthContext] Login attempt for:', email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('[AuthContext] Login error:', error.message);
        return false;
      }

      if (data?.user) {
        console.log('[AuthContext] Login successful for:', data.user.email);
        // Wait a bit for the auth state to update
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
      }

      return false;
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      return false;
    }
  };


  const signup = async (email: string, password: string, name: string, avatarUrl?: string): Promise<boolean> => {
    console.log('[AuthContext] Signup attempt for:', email, name);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            avatar_url: avatarUrl || getRandomAvatar()
          }
        }
      });

      if (error) {
        console.error('[AuthContext] Signup error:', error.message);
        console.error('[AuthContext] Full error object:', error);
        
        // Check for specific error types
        if (error.message?.includes('already registered')) {
          console.log('[AuthContext] User already exists in Supabase');
        }
        return false;
      }

      if (data.user) {
        console.log('[AuthContext] Signup successful for:', data.user.email);
        console.log('[AuthContext] Email confirmation required:', data.user.email_confirmed_at === null);
        
        // Note: Profile creation will fail if email is not confirmed due to RLS policies
        // The profile will be created automatically when the user confirms their email
        // and logs in for the first time
        
        if (data.user.email_confirmed_at === null) {
          console.log('[AuthContext] User needs to confirm email before profile can be created');
        } else {
          // Try to create profile if email is already confirmed (shouldn't happen on signup)
          const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({
              id: data.user.id,
              email: data.user.email,
              full_name: name,
              avatar_url: avatarUrl || getRandomAvatar(),
              preferred_dialect: 'all',
              daily_goal: 10,
              streak_days: 0,
              total_study_time: 0
            });

          if (profileError) {
            console.error('[AuthContext] Error creating profile:', profileError);
            console.error('[AuthContext] This is expected if email is not confirmed');
          } else {
            console.log('[AuthContext] User profile created successfully');
          }
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('[AuthContext] Signup error:', error);
      return false;
    }
  };


  const resetPassword = async (email: string): Promise<boolean> => {
    console.log('[AuthContext] Password reset request for:', email);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error && error.message?.includes('Please set up Supabase')) {
        // Fallback to localStorage - just check if email exists
        return false;
      }

      if (error) {
        console.error('[AuthContext] Password reset error:', error.message);
        return false;
      }

      console.log('[AuthContext] Password reset email sent successfully');
      return true;
    } catch (error) {
      console.error('[AuthContext] Password reset error:', error);
      return false;
    }
  };


  const deleteAccount = async (): Promise<boolean> => {
    if (!user) return false;
    
    console.log('[AuthContext] Account deletion request for:', user.email);
    
    try {
      // For real Supabase implementation - delete user data first, then account
      // Delete user's data (this will cascade due to foreign key constraints)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', user.id);

      if (profileError && !profileError.message?.includes('Please set up Supabase')) {
        console.error('[AuthContext] Error deleting profile:', profileError);
        return false;
      }

      // For real Supabase, you'd need to call a backend function to delete the auth user
      // Since we can't delete auth users from the client side in Supabase
      console.log('[AuthContext] User data deleted, account deletion would need server-side implementation');

      // For localStorage fallback
      if (profileError?.message?.includes('Please set up Supabase')) {
        return deleteAccountLocal();
      }

      // Sign out after successful deletion
      await logout();
      return true;
    } catch (error) {
      console.error('[AuthContext] Account deletion error:', error);
      return deleteAccountLocal();
    }
  };

  const deleteAccountLocal = (): boolean => {
    if (!user) return false;
    
    console.log('[AuthContext] Local account deletion for:', user.email);
    
    // Remove user from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.filter((u: any) => u.id !== user.id);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    // Remove user progress
    localStorage.removeItem(`userProgress_${user.id}`);
    localStorage.removeItem('currentUser');
    
    // Clear current session
    setUser(null);
    setUserProgress(null);
    
    console.log('[AuthContext] Local account deletion successful');
    return true;
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('[AuthContext] Logging out...');
      
      // Clear local state first
      setUser(null);
      setUserProgress(null);
      setSourceLanguage('darija');
      setTargetLanguage('lebanese');
      localStorage.removeItem('currentUser');
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[AuthContext] Logout error:', error);
      } else {
        console.log('[AuthContext] Logout successful');
      }
      
      // Force reload to clear any cached state
      window.location.href = '/';
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
      // Even if error, clear local state
      setUser(null);
      setUserProgress(null);
      window.location.href = '/';
    }
  };

  const updateUserProgress = async (progress: UserProgress): Promise<void> => {
    if (!user) return;
    
    try {
      setUserProgress(progress);

      // Update streak logic
      const today = new Date().toDateString();
      const lastActive = new Date(progress.lastActiveDate).toDateString();
      let newStreakDays = progress.streakDays;
      
      if (today !== lastActive) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (yesterday.toDateString() === lastActive) {
          newStreakDays += 1;
        } else {
          newStreakDays = 1;
        }
      }

      // Try to update Supabase first, fallback to localStorage
      try {
        // Update user profile with streak and study time
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            streak_days: newStreakDays,
            total_study_time: progress.totalStudyTime,
            preferred_dialect: progress.preferences.targetDialect,
            daily_goal: progress.preferences.dailyGoal,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (profileError && !profileError.message?.includes('Please set up Supabase')) {
          console.error('[AuthContext] Error updating profile:', profileError);
        }

        // Update spaced repetition data
        for (const item of progress.spacedRepetition) {
          const { error: phraseError } = await supabase
            .from('phrase_progress')
            .upsert({
              user_id: user.id,
              phrase_id: item.phraseId,
              status: progress.phrasesLearned.includes(item.phraseId) ? 'mastered' : 
                     progress.phrasesInProgress.includes(item.phraseId) ? 'practicing' : 'learning',
              correct_attempts: item.repetitions,
              total_attempts: item.repetitions + 1, // Simplified
              last_reviewed: item.lastReviewDate,
              next_review: item.nextReviewDate,
              ease_factor: item.easeFactor,
              interval_days: item.interval,
              updated_at: new Date().toISOString()
            });

          if (phraseError && !phraseError.message?.includes('Please set up Supabase')) {
            console.error('[AuthContext] Error updating phrase progress:', phraseError);
          }
        }
      } catch (supabaseError) {
        console.log('[AuthContext] Supabase not available, using localStorage fallback');
      }

      // Always update localStorage as backup
      const progressKey = `userProgress_${user.id}`;
      const updatedProgress = { ...progress, streakDays: newStreakDays };
      localStorage.setItem(progressKey, JSON.stringify(updatedProgress));

    } catch (error) {
      console.error('[AuthContext] Error updating user progress:', error);
    }
  };

  const updateLanguagePreferences = async (source: string, target: string): Promise<void> => {
    if (!user) {
      console.warn('[AuthContext] Cannot update language preferences - no user logged in');
      return;
    }
    
    try {
      console.log('[AuthContext] Updating language preferences for user:', user.id);
      console.log('[AuthContext] New values - source:', source, 'target:', target);
      
      // Update state immediately for UI responsiveness
      setSourceLanguage(source);
      setTargetLanguage(target);
      
      // Get the current session to ensure we have the right user ID
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.error('[AuthContext] No active session found');
        return;
      }
      
      // Update in database
      console.log('[AuthContext] Sending update to Supabase for user:', session.user.id);
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          source_language: source,
          target_language: target,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id)
        .select()
        .single();

      if (error) {
        console.error('[AuthContext] ❌ Error updating language preferences:', error.message);
        console.error('[AuthContext] Full error details:', JSON.stringify(error, null, 2));
        
        // Try to check if profile exists
        const { data: profile, error: fetchError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (fetchError) {
          console.error('[AuthContext] Could not fetch profile:', fetchError);
        } else {
          console.log('[AuthContext] Current profile:', profile);
        }
      } else {
        console.log('[AuthContext] ✅ Language preferences updated successfully!');
        console.log('[AuthContext] Updated profile:', data);
      }
      
      // Update localStorage fallback
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        userData.sourceLanguage = source;
        userData.targetLanguage = target;
        localStorage.setItem('currentUser', JSON.stringify(userData));
      }
      
      // Update userProgress preferences
      if (userProgress) {
        const updatedProgress = {
          ...userProgress,
          preferences: {
            ...userProgress.preferences,
            targetDialect: target === 'all' ? 'all' : target as any
          }
        };
        setUserProgress(updatedProgress);
      }
    } catch (error) {
      console.error('[AuthContext] Error updating language preferences:', error);
    }
  };

  const saveQuizAttempt = async (quizData: any): Promise<void> => {
    if (!user) {
      console.log('[AuthContext] No user logged in, cannot save quiz attempt');
      return;
    }
    
    try {
      console.log('[AuthContext] Saving quiz attempt for user:', user.email);
      
      const { error } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_type: quizData.quizType || 'multiple-choice',
          score: quizData.score || 0,
          total_questions: quizData.totalQuestions || 0,
          difficulty: quizData.difficulty || 'beginner',
          target_dialect: quizData.targetDialect || 'all',
          time_spent: quizData.timeSpent || 0,
          questions: quizData.questions || []
        });

      if (error && !error.message?.includes('Please set up Supabase')) {
        console.error('[AuthContext] Error saving quiz attempt:', error);
      } else {
        console.log('[AuthContext] Quiz attempt saved successfully');
      }
    } catch (error) {
      console.error('[AuthContext] Error saving quiz attempt:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProgress,
      sourceLanguage,
      targetLanguage,
      login,
      signup,
      resetPassword,
      deleteAccount,
      logout,
      updateUserProgress,
      updateLanguagePreferences,
      saveQuizAttempt,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};