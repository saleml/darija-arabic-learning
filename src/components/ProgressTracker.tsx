import { useState, useMemo } from 'react';
import { TrendingUp, Trophy, Target, Clock, Calendar, Award, BarChart3, Flame, BookOpen, Star } from 'lucide-react';
import { UserProgress } from '../types';

interface Props {
  userProgress: UserProgress | null;
  totalPhrases: number;
  onUpdateProgress: (progress: UserProgress) => void;
}

export default function ProgressTracker({ userProgress, totalPhrases, onUpdateProgress }: Props) {
  const [view, setView] = useState<'overview' | 'achievements' | 'settings' | 'debug'>('overview');

  const stats = useMemo(() => {
    if (!userProgress) {
      return {
        learned: 0,
        remaining: totalPhrases,
        percentage: 0,
        averageScore: 0,
        totalQuizzes: 0,
        studyHours: 0,
        dailyStreak: 0,
        bestStreak: 0,
        phrasesPerDay: 0
      };
    }

    const learned = userProgress.phrasesLearned.length;
    const remaining = totalPhrases - learned;
    const percentage = Math.round((learned / totalPhrases) * 100);
    
    const averageScore = userProgress.quizScores.length > 0
      ? Math.round(
          userProgress.quizScores.reduce((acc, s) => acc + (s.score / s.total) * 100, 0) / 
          userProgress.quizScores.length
        )
      : 0;
    
    const studyMinutes = Math.round(userProgress.totalStudyTime / 60);
    const studyHours = Math.floor(studyMinutes / 60);
    const remainingMinutes = studyMinutes % 60;
    const studyTimeDisplay = studyHours > 0 ? `${studyHours}h ${remainingMinutes}m` : `${studyMinutes}m`;
    
    const today = new Date().toDateString();
    const lastActive = new Date(userProgress.lastActiveDate).toDateString();
    const dailyStreak = today === lastActive ? userProgress.streakDays : 0;
    
    const daysActive = userProgress.quizScores.length > 0 
      ? Math.ceil((Date.now() - new Date(userProgress.quizScores[0].date).getTime()) / (1000 * 60 * 60 * 24))
      : 1;
    const phrasesPerDay = Math.round(learned / daysActive * 10) / 10;

    return {
      learned,
      remaining,
      percentage,
      averageScore,
      totalQuizzes: userProgress.quizScores.length,
      studyHours,
      studyTimeDisplay,
      dailyStreak,
      bestStreak: userProgress.streakDays,
      phrasesPerDay
    };
  }, [userProgress, totalPhrases]);

  const achievements = [
    { 
      id: 'first_phrase', 
      name: 'First Steps', 
      description: 'Learn your first phrase', 
      icon: Star,
      earned: stats.learned >= 1,
      progress: Math.min(stats.learned, 1),
      target: 1
    },
    { 
      id: 'ten_phrases', 
      name: 'Getting Started', 
      description: 'Learn 10 phrases', 
      icon: BookOpen,
      earned: stats.learned >= 10,
      progress: Math.min(stats.learned, 10),
      target: 10
    },
    { 
      id: 'fifty_phrases', 
      name: 'Making Progress', 
      description: 'Learn 50 phrases', 
      icon: TrendingUp,
      earned: stats.learned >= 50,
      progress: Math.min(stats.learned, 50),
      target: 50
    },
    { 
      id: 'hundred_phrases', 
      name: 'Century Club', 
      description: 'Learn 100 phrases', 
      icon: Trophy,
      earned: stats.learned >= 100,
      progress: Math.min(stats.learned, 100),
      target: 100
    },
    { 
      id: 'week_streak', 
      name: 'Week Warrior', 
      description: '7 day learning streak', 
      icon: Flame,
      earned: stats.dailyStreak >= 7,
      progress: Math.min(stats.dailyStreak, 7),
      target: 7
    },
    { 
      id: 'perfect_quiz', 
      name: 'Perfect Score', 
      description: 'Get 100% on a quiz', 
      icon: Award,
      earned: userProgress?.quizScores.some(s => s.score === s.total) || false,
      progress: userProgress?.quizScores.some(s => s.score === s.total) ? 1 : 0,
      target: 1
    }
  ];

  const updateDailyGoal = (newGoal: number) => {
    if (!userProgress) return;
    
    onUpdateProgress({
      ...userProgress,
      preferences: {
        ...userProgress.preferences,
        dailyGoal: newGoal
      }
    });
  };

  const updateTargetDialect = (dialect: 'lebanese' | 'syrian' | 'emirati' | 'saudi' | 'all') => {
    if (!userProgress) return;
    
    onUpdateProgress({
      ...userProgress,
      preferences: {
        ...userProgress.preferences,
        targetDialect: dialect
      }
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 sm:h-6 w-5 sm:w-6 text-blue-500" />
            Your Progress
          </h2>
          <div className="flex gap-1 sm:gap-2 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setView('overview')}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-base whitespace-nowrap ${view === 'overview' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setView('achievements')}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-base whitespace-nowrap ${view === 'achievements' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            >
              Achievements
            </button>
            <button
              onClick={() => setView('settings')}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-base whitespace-nowrap ${view === 'settings' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            >
              Settings
            </button>
            <button
              onClick={() => setView('debug')}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-base whitespace-nowrap ${view === 'debug' ? 'bg-red-500 text-white' : 'bg-gray-100'}`}
            >
              Debug
            </button>
          </div>
        </div>

        {view === 'overview' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-sm sm:text-lg font-semibold">Overall Progress</h3>
                <span className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div title="Phrases you've successfully mastered by answering correctly in a quiz">
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.learned}</p>
                  <p className="text-xs sm:text-sm text-gray-600 cursor-help">Mastered</p>
                </div>
                <div title="Phrases you haven't mastered yet">
                  <p className="text-xl sm:text-2xl font-bold text-gray-400">{stats.remaining}</p>
                  <p className="text-xs sm:text-sm text-gray-600 cursor-help">Not Mastered</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 cursor-help" title="Your average score across all quizzes you've taken">
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <Trophy className="h-4 sm:h-5 w-4 sm:w-5 text-yellow-500" />
                  <span className="text-xs sm:text-base font-semibold">Quiz Score</span>
                </div>
                <p className="text-lg sm:text-2xl font-bold">{stats.averageScore}%</p>
                <p className="text-[10px] sm:text-sm text-gray-600">Avg ({stats.totalQuizzes} quiz)</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 cursor-help" title="Number of consecutive days you've practiced. Keep it up to maintain your streak!">
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <Flame className="h-4 sm:h-5 w-4 sm:w-5 text-orange-500" />
                  <span className="text-xs sm:text-base font-semibold">Streak</span>
                </div>
                <p className="text-lg sm:text-2xl font-bold">{stats.dailyStreak} days</p>
                <p className="text-[10px] sm:text-sm text-gray-600">Best: {stats.bestStreak}d</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 cursor-help" title="Total hours you've spent learning and practicing">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">Study Time</span>
                </div>
                <p className="text-2xl font-bold">{stats.studyTimeDisplay}</p>
                <p className="text-sm text-gray-600">Total time invested</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 cursor-help" title="Your target number of phrases to learn each day">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">Daily Goal</span>
                </div>
                <p className="text-2xl font-bold">{userProgress?.preferences.dailyGoal || 10}</p>
                <p className="text-sm text-gray-600">Phrases per day</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 cursor-help" title="Your average learning speed based on historical data">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  <span className="font-semibold">Learning Rate</span>
                </div>
                <p className="text-2xl font-bold">{stats.phrasesPerDay}</p>
                <p className="text-sm text-gray-600">Phrases per day (avg)</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 cursor-help" title="Estimated days to complete all phrases at your current learning pace">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="h-5 w-5 text-indigo-500" />
                  <span className="font-semibold">Est. Completion</span>
                </div>
                <p className="text-2xl font-bold">
                  {stats.phrasesPerDay > 0 ? Math.ceil(stats.remaining / stats.phrasesPerDay) : '∞'} days
                </p>
                <p className="text-sm text-gray-600">At current pace</p>
              </div>
            </div>

            {userProgress && userProgress.quizScores.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {userProgress.quizScores.slice(-7).reverse().map((score, idx) => {
                    const date = new Date(score.date);
                    const percentage = Math.round((score.score / score.total) * 100);
                    
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-sm">
                            <p className="font-medium">{date.toLocaleDateString()}</p>
                            <p className="text-gray-600">{score.difficulty || 'Mixed'} quiz</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold">{percentage}%</p>
                            <p className="text-sm text-gray-600">{score.score}/{score.total}</p>
                          </div>
                          <div className={`w-2 h-8 rounded ${percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'achievements' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement) => {
                const Icon = achievement.icon;
                const progressPercentage = (achievement.progress / achievement.target) * 100;
                
                return (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      achievement.earned 
                        ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${achievement.earned ? 'bg-yellow-400' : 'bg-gray-300'}`}>
                        <Icon className={`h-6 w-6 ${achievement.earned ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{achievement.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                        {!achievement.earned && (
                          <>
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500">
                              {achievement.progress} / {achievement.target}
                            </p>
                          </>
                        )}
                        {achievement.earned && (
                          <p className="text-sm text-yellow-600 font-medium">✓ Earned!</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Achievement Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-purple-600">
                    {achievements.filter(a => a.earned).length}
                  </p>
                  <p className="text-sm text-gray-600">Earned</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-400">
                    {achievements.filter(a => !a.earned).length}
                  </p>
                  <p className="text-sm text-gray-600">Remaining</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-pink-600">
                    {Math.round((achievements.filter(a => a.earned).length / achievements.length) * 100)}%
                  </p>
                  <p className="text-sm text-gray-600">Complete</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-yellow-500">
                    {achievements.filter(a => a.earned && a.icon === Trophy).length}
                  </p>
                  <p className="text-sm text-gray-600">Trophies</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'settings' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Learning Preferences</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Goal (phrases per day)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={userProgress?.preferences.dailyGoal || 10}
                      onChange={(e) => updateDailyGoal(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="w-12 text-center font-semibold">
                      {userProgress?.preferences.dailyGoal || 10}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Focus Dialect
                  </label>
                  <select
                    value={userProgress?.preferences.targetDialect || 'all'}
                    onChange={(e) => updateTargetDialect(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Dialects</option>
                    <option value="lebanese">Lebanese</option>
                    <option value="syrian">Syrian</option>
                    <option value="emirati">Emirati</option>
                    <option value="saudi">Saudi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sound Effects
                  </label>
                  <button
                    onClick={() => {
                      if (!userProgress) return;
                      onUpdateProgress({
                        ...userProgress,
                        preferences: {
                          ...userProgress.preferences,
                          soundEnabled: !userProgress.preferences.soundEnabled
                        }
                      });
                    }}
                    className={`px-4 py-2 rounded-lg ${
                      userProgress?.preferences.soundEnabled 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-300 text-gray-700'
                    }`}
                  >
                    {userProgress?.preferences.soundEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Data Management</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const data = JSON.stringify(userProgress, null, 2);
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `progress_${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                  }}
                  className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Export Progress Data
                </button>
                
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
                      const newProgress: UserProgress = {
                        userId: 'user_' + Date.now(),
                        phrasesLearned: [],
                        phrasesInProgress: [],
                        quizScores: [],
                        spacedRepetition: [],
                        streakDays: 0,
                        lastActiveDate: new Date().toISOString(),
                        totalStudyTime: 0,
                        preferences: userProgress?.preferences || {
                          targetDialect: 'all',
                          dailyGoal: 10,
                          soundEnabled: true,
                          theme: 'light'
                        }
                      };
                      onUpdateProgress(newProgress);
                    }
                  }}
                  className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Reset All Progress
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'debug' && (
          <div>Debug view removed</div>
        )}
      </div>
    </div>
  );
}
