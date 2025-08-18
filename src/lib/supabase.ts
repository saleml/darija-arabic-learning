import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('Missing Supabase environment variables!');
  logger.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  logger.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
  throw new Error('Missing Supabase credentials. Please check your .env file.');
}

logger.log('Initializing Supabase with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

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
  is_mastered: boolean;
  correct_count: number;
  incorrect_count: number;
  last_reviewed: string;
  next_review: string | null;
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