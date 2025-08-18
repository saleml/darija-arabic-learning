import { UserProgress, QuizScore } from '../types';
import { logger } from './logger';
import { supabase } from './supabaseClient';

export interface QuizAttempt {
  id?: string;
  user_id: string;
  score: number;
  total_questions: number;
  quiz_type: string;
  difficulty?: string;
  source_dialect?: string;
  target_dialect?: string;
  time_spent?: number;
  phrases_tested?: string[];
  correct_phrases?: string[];
  created_at?: string;
}

export interface PhraseProgress {
  id?: string;
  user_id: string;
  phrase_id: string;
  correct_count: number;
  incorrect_count: number;
  last_reviewed: string;
  is_mastered: boolean;
  created_at?: string;
  updated_at?: string;
}

export const supabaseProgress = {
  // Save a quiz attempt
  async saveQuizAttempt(userId: string, quizData: Partial<QuizAttempt>) {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: userId,
          ...quizData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('[supabaseProgress] Failed to save quiz attempt', error);
        throw error;
      }

      logger.log('[supabaseProgress] Saved quiz attempt', data);
      return data;
    } catch (error) {
      logger.error('[supabaseProgress] Error saving quiz attempt', error);
      throw error;
    }
  },

  // Get quiz history for a user
  async getQuizHistory(userId: string, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('[supabaseProgress] Failed to get quiz history', error);
        throw error;
      }

      logger.log('[supabaseProgress] Retrieved quiz history', data?.length);
      return data || [];
    } catch (error) {
      logger.error('[supabaseProgress] Error getting quiz history', error);
      return [];
    }
  },

  // Update phrase progress (mark as mastered when answered correctly)
  async updatePhraseProgress(userId: string, phraseId: string, correct: boolean) {
    try {
      logger.log('[supabaseProgress] Updating phrase progress', { userId, phraseId, correct });
      
      // First, try to get existing progress
      const { data: existing, error: selectError } = await supabase
        .from('phrase_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('phrase_id', phraseId)
        .single();
      
      if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows found
        logger.error('[supabaseProgress] Error checking existing progress', selectError);
      }

      if (existing) {
        // Update existing progress
        const newCorrectCount = existing.correct_count + (correct ? 1 : 0);
        const newIncorrectCount = existing.incorrect_count + (correct ? 0 : 1);
        
        logger.log('[supabaseProgress] Updating existing progress', { 
          id: existing.id,
          newCorrectCount,
          newIncorrectCount,
          is_mastered: correct || existing.is_mastered
        });
        
        const { data, error } = await supabase
          .from('phrase_progress')
          .update({
            correct_count: newCorrectCount,
            incorrect_count: newIncorrectCount,
            last_reviewed: new Date().toISOString(),
            is_mastered: correct || existing.is_mastered, // Mark as mastered if answered correctly
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          logger.error('[supabaseProgress] Failed to update phrase progress', error);
          throw error;
        }

        logger.log('[supabaseProgress] Updated phrase progress', data);
        return data;
      } else {
        // Create new progress record
        logger.log('[supabaseProgress] Creating new progress record', { 
          userId, 
          phraseId, 
          is_mastered: correct 
        });
        
        const { data, error } = await supabase
          .from('phrase_progress')
          .insert({
            user_id: userId,
            phrase_id: phraseId,
            correct_count: correct ? 1 : 0,
            incorrect_count: correct ? 0 : 1,
            last_reviewed: new Date().toISOString(),
            is_mastered: correct, // Mark as mastered if answered correctly on first try
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          logger.error('[supabaseProgress] Failed to create phrase progress', error);
          throw error;
        }

        logger.log('[supabaseProgress] Created phrase progress', data);
        return data;
      }
    } catch (error) {
      logger.error('[supabaseProgress] Error updating phrase progress', error);
      throw error;
    }
  },

  // Get phrase progress for a user
  async getPhraseProgress(userId: string) {
    try {
      const { data, error } = await supabase
        .from('phrase_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        logger.error('[supabaseProgress] Failed to get phrase progress', error);
        throw error;
      }

      logger.log('[supabaseProgress] Retrieved phrase progress', data?.length);
      return data || [];
    } catch (error) {
      logger.error('[supabaseProgress] Error getting phrase progress', error);
      return [];
    }
  },

  // Get mastered phrases (answered correctly at least once)
  async getMasteredPhrases(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('phrase_progress')
        .select('phrase_id')
        .eq('user_id', userId)
        .eq('is_mastered', true);

      if (error) {
        logger.error('[supabaseProgress] Failed to get mastered phrases', error);
        throw error;
      }

      logger.log('[supabaseProgress] Retrieved mastered phrases', data?.length);
      return data?.map(item => item.phrase_id) || [];
    } catch (error) {
      logger.error('[supabaseProgress] Error getting mastered phrases', error);
      return [];
    }
  },

  // Get in-progress phrases (seen but not mastered)
  async getInProgressPhrases(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('phrase_progress')
        .select('phrase_id')
        .eq('user_id', userId)
        .eq('is_mastered', false);

      if (error) {
        logger.error('[supabaseProgress] Failed to get in-progress phrases', error);
        throw error;
      }

      logger.log('[supabaseProgress] Retrieved in-progress phrases', data?.length);
      return data?.map(item => item.phrase_id) || [];
    } catch (error) {
      logger.error('[supabaseProgress] Error getting in-progress phrases', error);
      return [];
    }
  },

  // Calculate user statistics
  async getUserStats(userId: string) {
    try {
      // Get quiz attempts
      const quizHistory = await this.getQuizHistory(userId);
      
      // Get phrase progress
      const phraseProgress = await this.getPhraseProgress(userId);
      
      // Calculate stats
      const totalQuizzes = quizHistory.length;
      const totalScore = quizHistory.reduce((sum: number, quiz: any) => sum + quiz.score, 0);
      const totalQuestions = quizHistory.reduce((sum: number, quiz: any) => sum + quiz.total_questions, 0);
      const averageScore = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
      
      const masteredPhrases = phraseProgress.filter(p => p.is_mastered).length;
      const inProgressPhrases = phraseProgress.filter(p => !p.is_mastered).length;
      
      // Calculate streak (check if user has attempted quiz today and yesterday)
      let currentStreak = 0;
      if (quizHistory.length > 0) {
        const today = new Date().toDateString();
        const lastQuizDate = new Date(quizHistory[0].created_at).toDateString();
        
        if (today === lastQuizDate) {
          currentStreak = 1;
          
          // Check for consecutive days
          let checkDate = new Date();
          for (let i = 0; i < quizHistory.length; i++) {
            const quizDate = new Date(quizHistory[i].created_at);
            const daysDiff = Math.floor((checkDate.getTime() - quizDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysDiff <= 1) {
              if (daysDiff === 1) currentStreak++;
              checkDate = quizDate;
            } else {
              break;
            }
          }
        }
      }
      
      // Calculate study time (sum of all quiz time_spent)
      const totalStudyTime = quizHistory.reduce((sum: number, quiz: any) => sum + (quiz.time_spent || 0), 0);
      
      return {
        totalQuizzes,
        averageScore,
        masteredPhrases,
        inProgressPhrases,
        currentStreak,
        totalStudyTime,
        lastActiveDate: quizHistory.length > 0 ? quizHistory[0].created_at : null
      };
    } catch (error) {
      logger.error('[supabaseProgress] Error calculating user stats', error);
      return {
        totalQuizzes: 0,
        averageScore: 0,
        masteredPhrases: 0,
        inProgressPhrases: 0,
        currentStreak: 0,
        totalStudyTime: 0,
        lastActiveDate: null
      };
    }
  }
};