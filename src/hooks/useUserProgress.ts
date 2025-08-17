import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { UserProgress } from '../types';
import { logger } from '../utils/logger';
import { getProgressService } from '../services/progressService';

export function useUserProgress() {
  const { user } = useUser();
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const progressService = getProgressService();

  // Load progress using the service
  useEffect(() => {
    if (!user) {

      setIsLoading(false);
      return;
    }

    const loadProgress = async () => {

      try {
        const progress = await progressService.getUserProgress(user.id);
        console.log('[useUserProgress] Loaded progress:', {
          userId: progress?.userId,
          masteredCount: progress?.phrasesLearned?.length || 0,
          phrasesLearned: progress?.phrasesLearned?.slice(0, 5) || [],
          totalQuizzes: progress?.quizScores?.length || 0
        });
        setUserProgress(progress);
      } catch (error) {

      } finally {
        setIsLoading(false);
        setSessionStartTime(Date.now());
      }
    };
    
    loadProgress();
  }, [user, progressService]);

  const updateProgress = useCallback(async (updates: Partial<UserProgress>) => {
    if (!user || !userProgress) return;
    
    try {
      await progressService.updateProgress(user.id, updates);
      const updatedProgress = {
        ...userProgress,
        ...updates,
        lastActiveDate: new Date().toISOString()
      };
      setUserProgress(updatedProgress);
      logger.log('[useUserProgress] Updated progress', updates);
    } catch (error) {
      logger.error('[useUserProgress] Failed to update progress', error);
    }
  }, [userProgress, user, progressService]);

  const addQuizScore = useCallback(async (
    score: number, 
    total: number, 
    correctPhraseIds: string[] = [], 
    incorrectPhraseIds: string[] = [],
    options?: {
      difficulty?: string;
      quizType?: string;
      sourceDialect?: string;
      targetDialect?: string;
    }
  ) => {
    if (!user) return;
    
    try {
      await progressService.addQuizScore(
        user.id,
        score,
        total,
        correctPhraseIds,
        incorrectPhraseIds,
        {
          ...options,
          timeSpent: Math.floor((Date.now() - sessionStartTime) / 1000)
        }
      );
      
      // Reload progress
      const updatedProgress = await progressService.getUserProgress(user.id);
      setUserProgress(updatedProgress);
      
      logger.log('[useUserProgress] Added quiz score');
    } catch (error) {
      logger.error('[useUserProgress] Failed to add quiz score', error);
    }
  }, [user, sessionStartTime, progressService]);

  const markPhraseAsLearned = useCallback(async (phraseId: string) => {
    if (!user) {

      return;
    }

    // Optimistic update first - update UI immediately
    if (userProgress && !userProgress.phrasesLearned.includes(phraseId)) {
      const optimisticProgress = {
        ...userProgress,
        phrasesLearned: [...userProgress.phrasesLearned, phraseId],
        phrasesInProgress: userProgress.phrasesInProgress.filter(id => id !== phraseId),
        lastActiveDate: new Date().toISOString()
      };
      setUserProgress(optimisticProgress);

    }
    
    try {

      await progressService.markPhraseAsKnown(user.id, phraseId);

      // Small delay to ensure Supabase has committed the change
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('[useUserProgress] Reloading progress from service (force refresh)...');
      const updatedProgress = await progressService.getUserProgress(user.id, true); // Force refresh

      console.log('  - Contains our phrase?', updatedProgress?.phrasesLearned?.includes(phraseId));
      
      setUserProgress(updatedProgress);

    } catch (error) {

      // Revert optimistic update on error
      if (userProgress) {
        setUserProgress(userProgress);

      }

      throw error; // Re-throw to let UI components handle the error
    }
  }, [user, progressService, userProgress]);

  const markPhraseAsInProgress = useCallback(async (phraseId: string) => {
    if (!user || !userProgress) return;
    
    if (!userProgress.phrasesInProgress.includes(phraseId) && 
        !userProgress.phrasesLearned.includes(phraseId)) {
      try {
        await progressService.updateProgress(user.id, {
          phrasesInProgress: [...userProgress.phrasesInProgress, phraseId]
        });
        
        // Update local state
        const updatedProgress = {
          ...userProgress,
          phrasesInProgress: [...userProgress.phrasesInProgress, phraseId],
          lastActiveDate: new Date().toISOString()
        };
        setUserProgress(updatedProgress);
        
        logger.log('[useUserProgress] Marked phrase as in progress', phraseId);
      } catch (error) {
        logger.error('[useUserProgress] Failed to mark phrase as in progress', error);
      }
    }
  }, [userProgress, user, progressService]);

  const updateStudyTime = useCallback(async () => {
    if (!user || !userProgress) return;
    
    const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
    
    try {
      await progressService.updateProgress(user.id, {
        totalStudyTime: userProgress.totalStudyTime + sessionDuration
      });
      
      setSessionStartTime(Date.now());
      logger.log('[useUserProgress] Updated study time', sessionDuration);
    } catch (error) {
      logger.error('[useUserProgress] Failed to update study time', error);
    }
  }, [userProgress, sessionStartTime, user, progressService]);

  // Auto-save study time every 60 seconds
  useEffect(() => {
    if (!userProgress) return;
    
    const interval = setInterval(() => {
      updateStudyTime();
    }, 60000); // 60 seconds
    
    return () => clearInterval(interval);
  }, [updateStudyTime, userProgress]);

  // Save study time when component unmounts
  useEffect(() => {
    return () => {
      if (userProgress) {
        updateStudyTime();
      }
    };
  }, [updateStudyTime, userProgress]);

  const refreshProgress = useCallback(async () => {
    if (!user) return;

    try {
      const updatedProgress = await progressService.getUserProgress(user.id, true);

      setUserProgress(updatedProgress);
    } catch (error) {

    }
  }, [user, progressService]);

  return {
    userProgress,
    isLoading,
    updateProgress,
    addQuizScore,
    markPhraseAsLearned,
    markPhraseAsInProgress,
    updateStudyTime,
    refreshProgress
  };
}