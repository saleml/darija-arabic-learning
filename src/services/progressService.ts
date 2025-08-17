import { UserProgress, QuizScore } from '../types';
import { supabaseProgress } from '../utils/supabaseProgress';
import { logger } from '../utils/logger';

export interface ProgressServiceConfig {
  enableSupabase: boolean;
  enableLocalStorage: boolean;
  syncInterval?: number; // in milliseconds
  offlineMode?: boolean;
}

interface CachedProgress {
  data: UserProgress;
  timestamp: number;
  isDirty: boolean;
}

/**
 * Future-proof progress service that handles both local and remote storage
 * with automatic fallback, caching, and offline support
 */
export class ProgressService {
  private config: ProgressServiceConfig;
  private cache: Map<string, CachedProgress> = new Map();
  private syncQueue: Map<string, any[]> = new Map();
  private syncTimer?: NodeJS.Timeout;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly STORAGE_PREFIX = 'darija_progress_';

  constructor(config: ProgressServiceConfig) {
    this.config = {
      enableSupabase: true,
      enableLocalStorage: true,
      syncInterval: 30000, // 30 seconds default
      offlineMode: false,
      ...config
    };

    if (this.config.syncInterval && this.config.enableSupabase) {
      this.startSyncTimer();
    }

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  private startSyncTimer() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    
    this.syncTimer = setInterval(() => {
      this.syncPendingChanges();
    }, this.config.syncInterval);
  }

  private handleOnline() {
    logger.log('[ProgressService] Connection restored, syncing pending changes');
    this.config.offlineMode = false;
    this.syncPendingChanges();
  }

  private handleOffline() {
    logger.log('[ProgressService] Connection lost, entering offline mode');
    this.config.offlineMode = true;
  }

  /**
   * Get user progress with caching and fallback strategy
   */
  async getUserProgress(userId: string, forceRefresh = false): Promise<UserProgress | null> {
    try {

      // Check cache first (unless forcing refresh)
      const cached = this.cache.get(userId);
      if (!forceRefresh && cached && Date.now() - cached.timestamp < this.CACHE_DURATION && !cached.isDirty) {
        console.log('[ProgressService] Returning cached progress:', {
          masteredCount: cached.data.phrasesLearned.length,
          cacheAge: Date.now() - cached.timestamp
        });
        logger.log('[ProgressService] Returning cached progress');
        return cached.data;
      }

      let progress: UserProgress | null = null;

      // Try Supabase first if enabled and online
      if (this.config.enableSupabase && !this.config.offlineMode) {
        try {

          const [masteredPhrases, inProgressPhrases, quizHistory, stats] = await Promise.all([
            supabaseProgress.getMasteredPhrases(userId),
            supabaseProgress.getInProgressPhrases(userId),
            supabaseProgress.getQuizHistory(userId),
            supabaseProgress.getUserStats(userId)
          ]);

          const quizScores: QuizScore[] = quizHistory.map(quiz => ({
            date: quiz.created_at || new Date().toISOString(),
            score: quiz.score,
            total: quiz.total_questions,
            difficulty: quiz.difficulty,
            timeSpent: quiz.time_spent
          }));

          // Get preferences from localStorage (user-specific settings stay local)
          const preferences = this.getLocalPreferences(userId);

          progress = {
            userId,
            phrasesLearned: masteredPhrases,
            phrasesInProgress: inProgressPhrases,
            quizScores,
            spacedRepetition: [],
            streakDays: stats.currentStreak,
            lastActiveDate: stats.lastActiveDate || new Date().toISOString(),
            totalStudyTime: stats.totalStudyTime,
            preferences
          };

          // Update cache
          this.cache.set(userId, {
            data: progress,
            timestamp: Date.now(),
            isDirty: false
          });

          // Also save to localStorage as backup
          if (this.config.enableLocalStorage) {
            this.saveToLocalStorage(userId, progress);
          }

          logger.log('[ProgressService] Loaded progress from Supabase');
        } catch (error) {

          logger.error('[ProgressService] Failed to load from Supabase, falling back to localStorage', error);
          // Fall through to localStorage
        }
      }

      // Fall back to localStorage if Supabase failed or is disabled
      if (!progress && this.config.enableLocalStorage) {
        progress = this.loadFromLocalStorage(userId);
        if (progress) {
          // Update cache
          this.cache.set(userId, {
            data: progress,
            timestamp: Date.now(),
            isDirty: true // Mark as dirty since it's from localStorage
          });
          logger.log('[ProgressService] Loaded progress from localStorage');
        }
      }

      // If still no progress, initialize default
      if (!progress) {
        progress = this.initializeDefaultProgress(userId);
        this.cache.set(userId, {
          data: progress,
          timestamp: Date.now(),
          isDirty: true
        });
      }

      return progress;
    } catch (error) {
      logger.error('[ProgressService] Error getting user progress', error);
      return this.initializeDefaultProgress(userId);
    }
  }

  /**
   * Update user progress with optimistic updates and queuing
   */
  async updateProgress(userId: string, updates: Partial<UserProgress>): Promise<void> {
    try {
      // Get current progress
      const currentProgress = await this.getUserProgress(userId);
      if (!currentProgress) return;

      // Apply updates
      const updatedProgress = {
        ...currentProgress,
        ...updates,
        lastActiveDate: new Date().toISOString()
      };

      // Update cache immediately (optimistic update)
      this.cache.set(userId, {
        data: updatedProgress,
        timestamp: Date.now(),
        isDirty: true
      });

      // Save to localStorage immediately
      if (this.config.enableLocalStorage) {
        this.saveToLocalStorage(userId, updatedProgress);
      }

      // Queue for Supabase sync if enabled
      if (this.config.enableSupabase && !this.config.offlineMode) {
        this.queueForSync(userId, 'updateProgress', updates);
      }

      logger.log('[ProgressService] Updated progress', updates);
    } catch (error) {
      logger.error('[ProgressService] Error updating progress', error);
      throw error;
    }
  }

  /**
   * Add quiz score with automatic mastery tracking
   */
  async addQuizScore(
    userId: string,
    score: number,
    total: number,
    correctPhraseIds: string[],
    incorrectPhraseIds: string[],
    options?: {
      difficulty?: string;
      quizType?: string;
      sourceDialect?: string;
      targetDialect?: string;
      timeSpent?: number;
    }
  ): Promise<void> {
    try {
      // Save to Supabase if enabled
      if (this.config.enableSupabase && !this.config.offlineMode) {
        try {
          await supabaseProgress.saveQuizAttempt(userId, {
            score,
            total_questions: total,
            difficulty: options?.difficulty,
            quiz_type: options?.quizType,
            source_dialect: options?.sourceDialect,
            target_dialect: options?.targetDialect,
            time_spent: options?.timeSpent,
            correct_phrases: correctPhraseIds,
            phrases_tested: [...correctPhraseIds, ...incorrectPhraseIds]
          });

          // Update phrase progress for all answered questions
          const updatePromises = [
            ...correctPhraseIds.map(id => supabaseProgress.updatePhraseProgress(userId, id, true)),
            ...incorrectPhraseIds.map(id => supabaseProgress.updatePhraseProgress(userId, id, false))
          ];
          await Promise.all(updatePromises);

          logger.log('[ProgressService] Saved quiz score to Supabase');
        } catch (error) {
          logger.error('[ProgressService] Failed to save to Supabase, queuing for later', error);
          this.queueForSync(userId, 'addQuizScore', {
            score, total, correctPhraseIds, incorrectPhraseIds, options
          });
        }
      } else {
        // Queue for later sync
        this.queueForSync(userId, 'addQuizScore', {
          score, total, correctPhraseIds, incorrectPhraseIds, options
        });
      }

      // Update local progress
      const progress = await this.getUserProgress(userId);
      if (progress) {
        const newScore: QuizScore = {
          date: new Date().toISOString(),
          score,
          total,
          difficulty: options?.difficulty,
          timeSpent: options?.timeSpent
        };

        // Update mastered phrases (union of existing and new correct answers)
        const updatedProgress = {
          ...progress,
          quizScores: [...progress.quizScores, newScore],
          phrasesLearned: [...new Set([...progress.phrasesLearned, ...correctPhraseIds])],
          phrasesInProgress: progress.phrasesInProgress
            .filter(id => !correctPhraseIds.includes(id))
            .concat(incorrectPhraseIds.filter(id => 
              !progress.phrasesLearned.includes(id) && 
              !progress.phrasesInProgress.includes(id)
            ))
        };

        await this.updateProgress(userId, updatedProgress);
      }
    } catch (error) {
      logger.error('[ProgressService] Error adding quiz score', error);
      throw error;
    }
  }

  /**
   * Mark phrase as already known (manual mastery)
   */
  async markPhraseAsKnown(userId: string, phraseId: string): Promise<void> {
    try {

      // Invalidate cache immediately to force fresh data
      this.cache.delete(userId);

      if (this.config.enableSupabase && !this.config.offlineMode) {

        await supabaseProgress.updatePhraseProgress(userId, phraseId, true);

      } else {
        console.log('[ProgressService] ⚠️ Skipping Supabase (disabled or offline)');
      }

      // Force refresh and ensure the phrase is in the mastered list
      console.log('[ProgressService] Getting current progress (force refresh)...');
      const progress = await this.getUserProgress(userId, true); // Force refresh from Supabase

      console.log('[ProgressService] Contains target phrase?', progress?.phrasesLearned?.includes(phraseId));
      
      if (progress) {
        // Ensure the phrase is in the mastered list (defensive programming)
        const newMasteredList = [...new Set([...progress.phrasesLearned, phraseId])];
        const newInProgressList = progress.phrasesInProgress.filter(id => id !== phraseId);
        
        // Only update if there's actually a change needed
        if (newMasteredList.length !== progress.phrasesLearned.length || 
            newInProgressList.length !== progress.phrasesInProgress.length) {

          await this.updateProgress(userId, {
            phrasesLearned: newMasteredList,
            phrasesInProgress: newInProgressList
          });

        } else {

        }
      } else {

      }

    } catch (error) {

      logger.error('[ProgressService] Error marking phrase as known', error);
      throw error;
    }
  }

  /**
   * Get progress statistics
   */
  async getProgressStats(userId: string, totalPhrases: number) {
    try {
      if (this.config.enableSupabase && !this.config.offlineMode) {
        const stats = await supabaseProgress.getUserStats(userId);
        return {
          ...stats,
          totalPhrases,
          remainingPhrases: totalPhrases - stats.masteredPhrases - stats.inProgressPhrases,
          masteryPercentage: totalPhrases > 0 
            ? Math.round((stats.masteredPhrases / totalPhrases) * 100) 
            : 0
        };
      }

      // Calculate from local progress
      const progress = await this.getUserProgress(userId);
      if (!progress) {
        return {
          totalQuizzes: 0,
          averageScore: 0,
          masteredPhrases: 0,
          inProgressPhrases: 0,
          remainingPhrases: totalPhrases,
          currentStreak: 0,
          totalStudyTime: 0,
          lastActiveDate: null,
          totalPhrases,
          masteryPercentage: 0
        };
      }

      const totalQuizzes = progress.quizScores.length;
      const totalScore = progress.quizScores.reduce((sum, q) => sum + q.score, 0);
      const totalQuestions = progress.quizScores.reduce((sum, q) => sum + q.total, 0);
      const averageScore = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

      return {
        totalQuizzes,
        averageScore,
        masteredPhrases: progress.phrasesLearned.length,
        inProgressPhrases: progress.phrasesInProgress.length,
        remainingPhrases: totalPhrases - progress.phrasesLearned.length - progress.phrasesInProgress.length,
        currentStreak: progress.streakDays,
        totalStudyTime: progress.totalStudyTime,
        lastActiveDate: progress.lastActiveDate,
        totalPhrases,
        masteryPercentage: totalPhrases > 0 
          ? Math.round((progress.phrasesLearned.length / totalPhrases) * 100) 
          : 0
      };
    } catch (error) {
      logger.error('[ProgressService] Error getting progress stats', error);
      return null;
    }
  }

  // Private helper methods

  private queueForSync(userId: string, operation: string, data: any) {
    const queue = this.syncQueue.get(userId) || [];
    queue.push({ operation, data, timestamp: Date.now() });
    this.syncQueue.set(userId, queue);
  }

  private async syncPendingChanges() {
    if (this.config.offlineMode || !this.config.enableSupabase) return;

    for (const [userId, queue] of this.syncQueue.entries()) {
      if (queue.length === 0) continue;

      logger.log(`[ProgressService] Syncing ${queue.length} pending changes for user ${userId}`);
      
      const processed: number[] = [];
      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        try {
          // Process each queued operation
          switch (item.operation) {
            case 'addQuizScore':
              await this.addQuizScore(
                userId,
                item.data.score,
                item.data.total,
                item.data.correctPhraseIds,
                item.data.incorrectPhraseIds,
                item.data.options
              );
              processed.push(i);
              break;
            // Add more operations as needed
          }
        } catch (error) {
          logger.error(`[ProgressService] Failed to sync operation ${item.operation}`, error);
        }
      }

      // Remove processed items from queue
      const remainingQueue = queue.filter((_, index) => !processed.includes(index));
      this.syncQueue.set(userId, remainingQueue);
    }
  }

  private saveToLocalStorage(userId: string, progress: UserProgress) {
    try {
      const key = `${this.STORAGE_PREFIX}${userId}`;
      localStorage.setItem(key, JSON.stringify(progress));
      
      // Save preferences separately for quick access
      const prefKey = `${key}_preferences`;
      localStorage.setItem(prefKey, JSON.stringify(progress.preferences));
    } catch (error) {
      logger.error('[ProgressService] Failed to save to localStorage', error);
    }
  }

  private loadFromLocalStorage(userId: string): UserProgress | null {
    try {
      const key = `${this.STORAGE_PREFIX}${userId}`;
      const data = localStorage.getItem(key);
      if (!data) return null;
      
      return JSON.parse(data);
    } catch (error) {
      logger.error('[ProgressService] Failed to load from localStorage', error);
      return null;
    }
  }

  private getLocalPreferences(userId: string) {
    try {
      const key = `${this.STORAGE_PREFIX}${userId}_preferences`;
      const data = localStorage.getItem(key);
      if (!data) {
        return {
          targetDialect: 'all' as const,
          dailyGoal: 10,
          soundEnabled: true,
          theme: 'light' as const
        };
      }
      return JSON.parse(data);
    } catch (error) {
      return {
        targetDialect: 'all' as const,
        dailyGoal: 10,
        soundEnabled: true,
        theme: 'light' as const
      };
    }
  }

  private initializeDefaultProgress(userId: string): UserProgress {
    return {
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
  }

  // Cleanup
  destroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', () => this.handleOnline());
      window.removeEventListener('offline', () => this.handleOffline());
    }
  }
}

// Singleton instance
let progressServiceInstance: ProgressService | null = null;

export function getProgressService(config?: ProgressServiceConfig): ProgressService {
  if (!progressServiceInstance) {
    progressServiceInstance = new ProgressService(config || {
      enableSupabase: true,
      enableLocalStorage: true,
      syncInterval: 30000
    });
  }
  return progressServiceInstance;
}