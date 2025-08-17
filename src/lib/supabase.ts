import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we have real Supabase credentials or placeholder values
const isPlaceholder = !supabaseUrl || 
                     !supabaseAnonKey || 
                     supabaseUrl.includes('placeholder') || 
                     supabaseAnonKey.includes('placeholder');

// Create mock or real Supabase client
let supabaseClient: any;

if (isPlaceholder) {
  console.warn('⚠️ Using placeholder Supabase credentials. Set up real Supabase project for full functionality.');
  
  // Create a mock Supabase client for local development
  supabaseClient = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null }, error: { message: 'Please set up Supabase credentials' } }),
      signUp: () => Promise.resolve({ data: { user: null }, error: { message: 'Please set up Supabase credentials' } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { code: 'MOCK' } }) }) }),
      insert: () => Promise.resolve({ error: null }),
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
      upsert: () => Promise.resolve({ error: null })
    })
  };
} else {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
  }
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseClient;

// Database types
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  source_language: 'darija' | 'lebanese' | 'syrian' | 'emirati' | 'saudi';
  target_language: 'darija' | 'lebanese' | 'syrian' | 'emirati' | 'saudi' | 'all';
  preferred_dialect: 'lebanese' | 'syrian' | 'emirati' | 'saudi' | 'all'; // Keep for backward compatibility
  daily_goal: number;
  streak_days: number;
  total_study_time: number;
  created_at: string;
  updated_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_type: 'multiple-choice' | 'word-order' | 'spaced';
  score: number;
  total_questions: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'all';
  target_dialect: string;
  time_spent: number;
  questions: any[];
  created_at: string;
}

export interface PhraseProgress {
  id: string;
  user_id: string;
  phrase_id: string;
  status: 'learning' | 'practicing' | 'mastered';
  correct_attempts: number;
  total_attempts: number;
  last_reviewed: string;
  next_review: string;
  ease_factor: number;
  interval_days: number;
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  session_type: 'quiz' | 'review' | 'browse';
  duration_minutes: number;
  phrases_studied: number;
  accuracy_percentage: number;
  created_at: string;
}