import { useState, useEffect } from 'react';
import { Book, Brain, Trophy, Globe, Star, TrendingUp, Menu, X, LogOut, Keyboard } from 'lucide-react';
import TranslationHub from './components/TranslationHub';
import QuizSystem from './components/QuizSystem';
import ProgressTracker from './components/ProgressTracker';
import CulturalCards from './components/CulturalCards';
import AuthForm from './components/AuthForm';
import { useAuth } from './contexts/AuthContext';
import { Phrase, UserProgress } from './types';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import NotificationToast, { Notification } from './components/NotificationToast';
import beginnerPhrases from '../database/beginner_phrases.json';
import intermediatePhrases from '../database/intermediate_phrases.json';
import advancedPhrases from '../database/advanced_phrases.json';
import sentencesData from '../database/sentences_daily_conversations.json';

type TabType = 'hub' | 'quiz' | 'progress' | 'culture';

function App() {
  const { user, logout, login, signup, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('hub');
  const [allPhrases, setAllPhrases] = useState<Phrase[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);

  // Load phrases once on mount, independent of user
  useEffect(() => {
    console.log('[App] Loading phrases from database files...');
    
    // Convert sentences to phrase format with fallback properties
    const sentencesAsPhrases = sentencesData.sentences.map((sent: any) => ({
      id: sent.id,
      darija: sent.darija,
      darija_latin: sent.darija_latin || sent.transliteration || '',
      literal_english: sent.english || sent.literal_english || '',
      english: sent.english || '',  // Add this for compatibility
      transliteration: sent.darija_latin || '',  // Add this for compatibility
      translations: sent.translations,
      category: sent.context || 'daily_conversations',
      difficulty: sent.difficulty || 'beginner',
      tags: [sent.context || 'conversation'],
      usage: {
        formality: 'neutral' as const,
        frequency: 'high' as const,
        context: [sent.context || 'daily']
      },
      cultural_notes: '',
      common_mistakes: []
    }));

    const phrases = [
      ...beginnerPhrases.phrases,
      ...intermediatePhrases.phrases,
      ...advancedPhrases.phrases,
      ...sentencesAsPhrases
    ] as Phrase[];
    console.log('[App] Total phrases loaded:', phrases.length);
    setAllPhrases(phrases);
  }, []); // Empty dependency array - load once

  // Handle user progress separately
  useEffect(() => {
    console.log('[App] User changed:', user?.email);

    if (user) {
      const savedProgress = localStorage.getItem(`userProgress_${user.id}`);
      if (savedProgress) {
        setUserProgress(JSON.parse(savedProgress));
      } else {
        const initialProgress: UserProgress = {
          userId: user.id,
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
        setUserProgress(initialProgress);
        localStorage.setItem(`userProgress_${user.id}`, JSON.stringify(initialProgress));
      }
    }
  }, [user]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    '1': () => setActiveTab('hub'),
    '2': () => setActiveTab('quiz'),
    '3': () => setActiveTab('progress'),
    '4': () => setActiveTab('culture'),
    '?': () => setShowKeyboardHelp(!showKeyboardHelp),
    'cmd+k': () => {
      const search = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (search) search.focus();
    },
    'escape': () => {
      setMobileMenuOpen(false);
      setShowKeyboardHelp(false);
    }
  });

  const updateProgress = (newProgress: UserProgress) => {
    if (user) {
      const prevLearned = userProgress?.phrasesLearned.length || 0;
      const newLearned = newProgress.phrasesLearned.length;
      
      if (newLearned > prevLearned) {
        setNotification({
          id: Date.now().toString(),
          type: 'success',
          message: `Great job! ${newLearned} phrases mastered!`,
          duration: 3000
        });
      }
      
      setUserProgress(newProgress);
      localStorage.setItem(`userProgress_${user.id}`, JSON.stringify(newProgress));
    }
  };

  const stats = {
    totalPhrases: allPhrases.length,
    learned: userProgress?.phrasesLearned.length || 0,
    inProgress: userProgress?.phrasesInProgress.length || 0,
    streak: userProgress?.streakDays || 0
  };

  if (isLoading) {
    console.log('[App] Showing loading state');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('[App] No user, showing auth form');
    return <AuthForm onLogin={login} onSignup={signup} />;
  }

  console.log('[App] Rendering main app for user:', user.email);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <NotificationToast 
        notification={notification} 
        onDismiss={() => setNotification(null)} 
      />
      
      {/* Keyboard Shortcuts Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-slide-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span>Translation Hub</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">1</kbd>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Practice Quiz</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">2</kbd>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Progress</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">3</kbd>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Cultural Context</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">4</kbd>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Search</span>
                <div>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">⌘</kbd>
                  <span className="mx-1">+</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">K</kbd>
                </div>
              </div>
              <div className="flex justify-between py-2">
                <span>Show this help</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">?</kbd>
              </div>
            </div>
            <button
              onClick={() => setShowKeyboardHelp(false)}
              className="mt-6 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-red-600 p-2 rounded-lg">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Darija → Arabic Learning</h1>
                <p className="text-sm text-gray-600">Master Levantine & Gulf dialects</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => setShowKeyboardHelp(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors tooltip"
                data-tooltip="Keyboard shortcuts"
              >
                <Keyboard className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="font-semibold">{stats.streak} day streak</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-blue-500" />
                <span className="font-semibold">{stats.learned}/{stats.totalPhrases} mastered</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="font-semibold">{stats.totalPhrases > 0 ? Math.round((stats.learned / stats.totalPhrases) * 100) : 0}% progress</span>
              </div>
              <div className="flex items-center space-x-4 border-l pl-4">
                <span className="text-sm text-gray-600">Welcome, {user?.email || 'User'}</span>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold">{stats.streak} day streak</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">{stats.learned}/{stats.totalPhrases} mastered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">{stats.totalPhrases > 0 ? Math.round((stats.learned / stats.totalPhrases) * 100) : 0}% progress</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <nav className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-1 overflow-x-auto">
              <button
                onClick={() => setActiveTab('hub')}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-all transform hover:scale-105 ${
                  activeTab === 'hub'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Book className="h-5 w-5" />
                <span className="font-medium">Translation Hub</span>
              </button>
              
              <button
                onClick={() => setActiveTab('quiz')}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-all transform hover:scale-105 ${
                  activeTab === 'quiz'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Brain className="h-5 w-5" />
                <span className="font-medium">Practice Quiz</span>
              </button>
              
              <button
                onClick={() => setActiveTab('progress')}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-all transform hover:scale-105 ${
                  activeTab === 'progress'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <TrendingUp className="h-5 w-5" />
                <span className="font-medium">Progress</span>
              </button>
              
              <button
                onClick={() => setActiveTab('culture')}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-all transform hover:scale-105 ${
                  activeTab === 'culture'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Globe className="h-5 w-5" />
                <span className="font-medium">Cultural Context</span>
              </button>
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'hub' && (
          <TranslationHub 
            phrases={allPhrases} 
            userProgress={userProgress}
            onUpdateProgress={updateProgress}
          />
        )}
        {activeTab === 'quiz' && (
          <QuizSystem 
            phrases={allPhrases}
            userProgress={userProgress}
            onUpdateProgress={updateProgress}
          />
        )}
        {activeTab === 'progress' && (
          <ProgressTracker 
            userProgress={userProgress}
            totalPhrases={allPhrases.length}
            onUpdateProgress={updateProgress}
          />
        )}
        {activeTab === 'culture' && (
          <CulturalCards 
            phrases={allPhrases}
            userProgress={userProgress}
            onUpdateProgress={updateProgress}
          />
        )}
      </main>

      <footer className="bg-gray-800 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-3">About</h3>
              <p className="text-gray-400 text-sm">
                Comprehensive learning platform for Moroccan Darija speakers to master Levantine and Gulf Arabic dialects.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Features</h3>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• 400+ authentic sentences</li>
                <li>• 5 dialect variations</li>
                <li>• Spaced repetition system</li>
                <li>• Cultural context notes</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Progress Stats</h3>
              <div className="text-gray-400 text-sm space-y-1">
                <p>Total study time: {Math.round((userProgress?.totalStudyTime || 0) / 60)} minutes</p>
                <p>Average quiz score: {userProgress?.quizScores.length ? 
                  Math.round(userProgress.quizScores.reduce((acc, s) => acc + (s.score/s.total)*100, 0) / userProgress.quizScores.length) : 0}%</p>
                <p>Daily goal: {userProgress?.preferences.dailyGoal || 10} phrases</p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
            <p>© 2025 Darija-Arabic Learning Platform. Built with ❤️ for language learners.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;