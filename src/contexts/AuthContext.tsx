import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, UserProfile } from '../lib/supabase';
import { UserProgress } from '../types';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastLogin: string;
}

interface AuthContextType {
  user: User | null;
  userProgress: UserProgress | null;
  sourceLanguage: string;
  targetLanguage: string;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
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

  // Simple hash function for localStorage (not for production use)
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'darija_salt_2025');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    const passwordHash = await hashPassword(password);
    return passwordHash === hash;
  };

  // localStorage fallback for local development
  const initializeLocalStorage = async () => {
    console.log('[AuthContext] Initializing localStorage fallback...');
    
    // Initialize demo account if it doesn't exist
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (!users.some((u: any) => u.email === 'demo@example.com')) {
      const demoPassword = await hashPassword('Demo123!');
      const demoUser = {
        id: 'demo_user',
        email: 'demo@example.com',
        password: demoPassword,
        name: 'Demo User',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      users.push(demoUser);
      localStorage.setItem('users', JSON.stringify(users));
    }

    // Check for existing session
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      loadUserProgressLocal(userData.id);
    }
  };

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
          
          setIsLoading(false);
          return;
        } catch (e) {
          console.error('[AuthContext] Error parsing stored user:', e);
        }
      }
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error && error.message?.includes('Please set up Supabase')) {
          // Fallback to localStorage for local development
          console.log('[AuthContext] Using localStorage fallback for local development');
          await initializeLocalStorage();
          setIsLoading(false);
          return;
        }
        
        if (error) {
          console.error('[AuthContext] Error getting session:', error);
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
        // Fallback to localStorage
        await initializeLocalStorage();
      } finally {
        setIsLoading(false);
      }
    };

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

    return () => subscription.unsubscribe();
  }, []);

  const handleUserSession = async (supabaseUser: SupabaseUser) => {
    try {
      // Get user profile from database
      const { data: profile, error: profileError } = await supabase
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
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: supabaseUser.id,
            email: supabaseUser.email,
            full_name: supabaseUser.user_metadata?.full_name || '',
            source_language: 'darija',  // Default source language
            target_language: 'lebanese', // Default target language
            preferred_dialect: 'lebanese', // Keep for backward compatibility
            daily_goal: 10,
            streak_days: 0,
            total_study_time: 0
          });

        if (createError) {
          console.error('[AuthContext] Error creating profile on login:', createError);
        } else {
          console.log('[AuthContext] Profile created successfully on login');
        }
      }

      // Create user object
      const userData: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: profile?.full_name || supabaseUser.user_metadata?.full_name || 'User',
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

      if (error && error.message?.includes('Please set up Supabase')) {
        // Fallback to localStorage
        return loginLocal(email, password);
      }

      if (error) {
        console.error('[AuthContext] Login error:', error.message);
        // Check if it's an email confirmation issue
        if (error.message?.includes('Email not confirmed')) {
          console.log('[AuthContext] User needs to confirm email before logging in');
        }
        return false;
      }

      if (data.user) {
        console.log('[AuthContext] Login successful for:', data.user.email);
        // Session handling will be done by the auth state change listener
        return true;
      }

      return false;
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      return loginLocal(email, password);
    }
  };

  const loginLocal = async (email: string, password: string): Promise<boolean> => {
    console.log('[AuthContext] Local login attempt for:', email);
    
    // Get all users from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Find user with matching email
    const user = users.find((u: any) => u.email === email);
    
    if (user) {
      // Verify password
      const isValidPassword = await verifyPassword(password, user.password);
      
      if (isValidPassword) {
        console.log('[AuthContext] User found and password verified:', user.email);
        const { password: _, ...userWithoutPassword } = user;
        userWithoutPassword.lastLogin = new Date().toISOString();
        
        // Update user in storage
        const updatedUsers = users.map((u: any) => 
          u.id === user.id ? { ...u, lastLogin: userWithoutPassword.lastLogin } : u
        );
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        // Set current user
        setUser(userWithoutPassword);
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        
        // Load user's progress
        loadUserProgressLocal(user.id);
        
        console.log('[AuthContext] Local login successful');
        return true;
      }
    }
    
    console.log('[AuthContext] Local login failed - user not found or invalid password');
    return false;
  };

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    console.log('[AuthContext] Signup attempt for:', email, name);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          }
        }
      });

      if (error && error.message?.includes('Please set up Supabase')) {
        // Fallback to localStorage
        console.log('[AuthContext] Supabase not configured, using localStorage');
        return signupLocal(email, password, name);
      }

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
      return signupLocal(email, password, name);
    }
  };

  const signupLocal = async (email: string, password: string, name: string): Promise<boolean> => {
    console.log('[AuthContext] Local signup attempt for:', email, name);
    
    // Get existing users
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if email already exists
    if (users.some((u: any) => u.email === email)) {
      console.log('[AuthContext] Local signup failed - email already exists');
      return false;
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create new user
    const newUser = {
      id: `user_${Date.now()}`,
      email,
      password: hashedPassword,
      name,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    console.log('[AuthContext] Creating new user:', newUser.email);
    
    // Save user
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Set current user (without password)
    const { password: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    
    // Initialize progress for new user
    loadUserProgressLocal(newUser.id);
    
    // DON'T set language setup flag for new users - they need to see the setup screen
    // localStorage.setItem(`languages_setup_${newUser.id}`, 'true'); // <- DON'T DO THIS
    
    console.log('[AuthContext] Local signup successful - user needs language setup');
    return true;
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    console.log('[AuthContext] Password reset request for:', email);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error && error.message?.includes('Please set up Supabase')) {
        // Fallback to localStorage - just check if email exists
        return resetPasswordLocal(email);
      }

      if (error) {
        console.error('[AuthContext] Password reset error:', error.message);
        return false;
      }

      console.log('[AuthContext] Password reset email sent successfully');
      return true;
    } catch (error) {
      console.error('[AuthContext] Password reset error:', error);
      return resetPasswordLocal(email);
    }
  };

  const resetPasswordLocal = (email: string): boolean => {
    console.log('[AuthContext] Local password reset check for:', email);
    
    // Get all users from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if user exists
    const userExists = users.some((u: any) => u.email === email);
    
    if (userExists) {
      console.log('[AuthContext] User found for password reset (localStorage mode)');
      // In a real app, this would send an email
      // For demo purposes, we'll just return true
      return true;
    }
    
    console.log('[AuthContext] User not found for password reset');
    return false;
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
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[AuthContext] Logout error:', error);
      }
      
      setUser(null);
      setUserProgress(null);
      localStorage.removeItem('currentUser');
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
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
      
      setSourceLanguage(source);
      setTargetLanguage(target);
      
      // Update in database
      console.log('[AuthContext] Sending update to Supabase...');
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          source_language: source,
          target_language: target,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
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