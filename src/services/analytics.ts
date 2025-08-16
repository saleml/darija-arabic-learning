import { supabase } from '../lib/supabase';

export interface QuizAnalytics {
  totalAttempts: number;
  averageScore: number;
  topStreak: number;
  favoriteDialect: string;
  totalStudyTime: number;
  progressThisWeek: number;
}

export class AnalyticsService {
  
  // Track quiz completion
  static async trackQuizCompletion(
    userId: string,
    quizType: 'multiple-choice' | 'word-order' | 'spaced',
    score: number,
    totalQuestions: number,
    difficulty: string,
    targetDialect: string,
    timeSpent: number,
    questions: any[]
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: userId,
          quiz_type: quizType,
          score,
          total_questions: totalQuestions,
          difficulty,
          target_dialect: targetDialect,
          time_spent: timeSpent,
          questions
        });

      if (error) {
        console.error('Error tracking quiz completion:', error);
      }
    } catch (error) {
      console.error('Error tracking quiz completion:', error);
    }
  }

  // Track study session
  static async trackStudySession(
    userId: string,
    sessionType: 'quiz' | 'review' | 'browse',
    durationMinutes: number,
    phrasesStudied: number,
    accuracyPercentage?: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: userId,
          session_type: sessionType,
          duration_minutes: durationMinutes,
          phrases_studied: phrasesStudied,
          accuracy_percentage: accuracyPercentage
        });

      if (error) {
        console.error('Error tracking study session:', error);
      }
    } catch (error) {
      console.error('Error tracking study session:', error);
    }
  }

  // Get user analytics
  static async getUserAnalytics(userId: string): Promise<QuizAnalytics | null> {
    try {
      // Get quiz attempts
      const { data: quizData, error: quizError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId);

      if (quizError) {
        console.error('Error fetching quiz analytics:', quizError);
        return null;
      }

      // Get study sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', userId);

      if (sessionError) {
        console.error('Error fetching session analytics:', sessionError);
      }

      // Calculate analytics
      const totalAttempts = quizData?.length || 0;
      const averageScore = totalAttempts > 0 
        ? (quizData?.reduce((sum: number, q: any) => sum + (q.score / q.total_questions * 100), 0) || 0) / totalAttempts
        : 0;

      // Calculate dialect preference
      const dialectCounts: Record<string, number> = {};
      quizData?.forEach((q: any) => {
        dialectCounts[q.target_dialect] = (dialectCounts[q.target_dialect] || 0) + 1;
      });
      const favoriteDialect = Object.keys(dialectCounts).reduce((a, b) => 
        dialectCounts[a] > dialectCounts[b] ? a : b, 'all');

      // Total study time from sessions
      const totalStudyTime = sessionData?.reduce((sum: number, s: any) => sum + s.duration_minutes, 0) || 0;

      // Progress this week (sessions in last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const progressThisWeek = sessionData?.filter((s: any) => 
        new Date(s.created_at) > weekAgo
      ).reduce((sum: number, s: any) => sum + s.phrases_studied, 0) || 0;

      return {
        totalAttempts,
        averageScore: Math.round(averageScore),
        topStreak: 0, // TODO: Calculate from consecutive days
        favoriteDialect,
        totalStudyTime,
        progressThisWeek
      };

    } catch (error) {
      console.error('Error getting user analytics:', error);
      return null;
    }
  }

  // Get leaderboard data
  static async getLeaderboard(limit: number = 10): Promise<Array<{
    userId: string;
    userName: string;
    averageScore: number;
    totalAttempts: number;
  }> | null> {
    try {
      // This would require a more complex query with user profiles
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return null;
    }
  }

  // Export user data (GDPR compliance)
  static async exportUserData(userId: string): Promise<any> {
    try {
      const [quizData, sessionData, progressData, profileData] = await Promise.all([
        supabase.from('quiz_attempts').select('*').eq('user_id', userId),
        supabase.from('study_sessions').select('*').eq('user_id', userId),
        supabase.from('phrase_progress').select('*').eq('user_id', userId),
        supabase.from('user_profiles').select('*').eq('id', userId).single()
      ]);

      return {
        profile: profileData.data,
        quiz_attempts: quizData.data,
        study_sessions: sessionData.data,
        phrase_progress: progressData.data,
        exported_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      return null;
    }
  }
}