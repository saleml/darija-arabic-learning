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
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserProgress: (progress: UserProgress) => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);

  // localStorage fallback for local development
  const initializeLocalStorage = () => {
    console.log('[AuthContext] Initializing localStorage fallback...');
    
    // Initialize demo account if it doesn't exist
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (!users.some((u: any) => u.email === 'demo@example.com')) {
      const demoUser = {
        id: 'demo_user',
        email: 'demo@example.com',
        password: 'demo123',
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
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error && error.message?.includes('Please set up Supabase')) {
          // Fallback to localStorage for local development
          console.log('[AuthContext] Using localStorage fallback for local development');
          initializeLocalStorage();
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
        initializeLocalStorage();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
      const spacedRepetition = phraseProgressData?.map(p => ({
        phraseId: p.phrase_id,
        interval: p.interval_days,
        repetitions: p.correct_attempts,
        easeFactor: p.ease_factor,
        nextReviewDate: p.next_review,
        lastReviewDate: p.last_reviewed
      })) || [];

      const quizScores = quizScoresData?.map(q => ({
        date: q.created_at,
        score: q.score,
        total: q.total_questions,
        difficulty: q.difficulty,
        timeSpent: q.time_spent
      })) || [];

      // Count learned phrases (those marked as mastered)
      const learnedPhrases = phraseProgressData?.filter(p => p.status === 'mastered').map(p => p.phrase_id) || [];
      const inProgressPhrases = phraseProgressData?.filter(p => p.status === 'learning' || p.status === 'practicing').map(p => p.phrase_id) || [];

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
          targetDialect: profile?.preferred_dialect || 'all',
          dailyGoal: profile?.daily_goal || 10,
          soundEnabled: true,
          theme: 'light'
        }
      };

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

  const loginLocal = (email: string, password: string): boolean => {
    console.log('[AuthContext] Local login attempt for:', email);
    
    // Get all users from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Find user with matching email and password
    const user = users.find((u: any) => 
      u.email === email && u.password === password
    );
    
    if (user) {
      console.log('[AuthContext] User found:', user.email);
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
    
    console.log('[AuthContext] Local login failed - user not found');
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
        return signupLocal(email, password, name);
      }

      if (error) {
        console.error('[AuthContext] Signup error:', error.message);
        return false;
      }

      if (data.user) {
        console.log('[AuthContext] Signup successful for:', data.user.email);
        
        // Create user profile (will be handled by the database trigger)
        // But let's also create it manually to ensure it exists
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
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('[AuthContext] Signup error:', error);
      return signupLocal(email, password, name);
    }
  };

  const signupLocal = (email: string, password: string, name: string): boolean => {
    console.log('[AuthContext] Local signup attempt for:', email, name);
    
    // Get existing users
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if email already exists
    if (users.some((u: any) => u.email === email)) {
      console.log('[AuthContext] Local signup failed - email already exists');
      return false;
    }
    
    // Create new user
    const newUser = {
      id: `user_${Date.now()}`,
      email,
      password, // In production, this should be hashed
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
    
    console.log('[AuthContext] Local signup successful');
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

  return (
    <AuthContext.Provider value={{
      user,
      userProgress,
      login,
      signup,
      logout,
      updateUserProgress,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};