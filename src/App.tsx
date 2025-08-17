import { useState, useEffect } from 'react';
import { Book, Brain, Trophy, Globe, Star, TrendingUp, Menu, X, LogOut, Keyboard } from 'lucide-react';
import TranslationHub from './components/TranslationHub';
import QuizSystem from './components/QuizSystem';
import ProgressTracker from './components/ProgressTracker';
import CulturalCards from './components/CulturalCards';
import AuthForm from './components/AuthForm';
import LanguageSetup from './components/LanguageSetup';
import LanguageSelector from './components/LanguageSelector';
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
  const { 
    user, 
    logout, 
    login, 
    signup, 
    resetPassword, 
    isLoading,
    sourceLanguage,
    targetLanguage,
    updateLanguagePreferences
  } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('hub');
  const [allPhrases, setAllPhrases] = useState<Phrase[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [showLanguageSetup, setShowLanguageSetup] = useState(false);

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
            targetDialect: targetLanguage === 'all' ? 'all' : targetLanguage as any,
            dailyGoal: 10,
            soundEnabled: true,
            theme: 'light'
          }
        };
        setUserProgress(initialProgress);
        localStorage.setItem(`userProgress_${user.id}`, JSON.stringify(initialProgress));
        
        // Check if this is a new user who needs language setup
        const hasSetupLanguages = localStorage.getItem(`languages_setup_${user.id}`);
        if (!hasSetupLanguages) {
          setShowLanguageSetup(true);
        }
      }
    }
  }, [user, sourceLanguage, targetLanguage]);

  // Keyboard shortcuts (disabled when auth form is open)
  useKeyboardShortcuts(!user && showAuthForm ? {} : {
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
      if (showAuthForm) setShowAuthForm(false);
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
    console.log('[App] No user, showing landing page');
    
    if (showAuthForm) {
      return <AuthForm onLogin={login} onSignup={signup} onPasswordReset={resetPassword} onClose={() => setShowAuthForm(false)} />;
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="text-center">
              {/* Logo and Title */}
              <div className="flex justify-center items-center mb-8">
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 rounded-2xl shadow-xl">
                  <Globe className="h-12 w-12 text-white" />
                </div>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Master Arabic
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Dialects
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Master all Arabic dialects - <strong>Darija</strong>, <strong>Lebanese</strong>, <strong>Syrian</strong>, <strong>Emirati</strong>, and <strong>Saudi</strong>. 
                Learn from any dialect to any other with AI-powered spaced repetition and cultural context.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <button
                  onClick={() => setShowAuthForm(true)}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                >
                  <Star className="h-5 w-5" />
                  Start Learning Free
                </button>
                <button
                  onClick={() => {
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-8 py-4 bg-white text-gray-700 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl border-2 border-gray-200 hover:border-blue-300 transform hover:scale-105 transition-all duration-200"
                >
                  Learn More
                </button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">400+</div>
                  <div className="text-gray-600">Authentic Phrases</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">4</div>
                  <div className="text-gray-600">Arabic Dialects</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">AI</div>
                  <div className="text-gray-600">Smart Learning</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Features Section */}
        <div id="features" className="py-16 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Why Choose Our Platform?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Built for Arabic speakers who want to communicate fluently across all dialects and regions
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="bg-blue-600 p-3 rounded-xl w-fit mb-4">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Quizzes</h3>
                <p className="text-gray-600">
                  AI-powered multiple choice and word ordering exercises that adapt to your learning pace
                </p>
              </div>
              
              {/* Feature 2 */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="bg-purple-600 p-3 rounded-xl w-fit mb-4">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Spaced Repetition</h3>
                <p className="text-gray-600">
                  Review phrases at optimal intervals for long-term memory retention and fluency
                </p>
              </div>
              
              {/* Feature 3 */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="bg-green-600 p-3 rounded-xl w-fit mb-4">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Cultural Context</h3>
                <p className="text-gray-600">
                  Learn not just words, but cultural nuances and appropriate usage in different situations
                </p>
              </div>
              
              {/* Feature 4 */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="bg-red-600 p-3 rounded-xl w-fit mb-4">
                  <Book className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Translation Hub</h3>
                <p className="text-gray-600">
                  Instant translation between Darija and 4 major Arabic dialects with pronunciation guides
                </p>
              </div>
              
              {/* Feature 5 */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="bg-yellow-600 p-3 rounded-xl w-fit mb-4">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Progress Tracking</h3>
                <p className="text-gray-600">
                  Monitor your learning journey with detailed analytics and achievement milestones
                </p>
              </div>
              
              {/* Feature 6 */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="bg-indigo-600 p-3 rounded-xl w-fit mb-4">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Daily Streaks</h3>
                <p className="text-gray-600">
                  Build consistent learning habits with daily goals and streak tracking for motivation
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Testimonials Section */}
        <div className="py-16 lg:py-24 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                What Learners Say
              </h2>
              <p className="text-xl text-gray-600">
                Join thousands of Moroccans mastering Arabic dialects
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  "Finally! As a Moroccan working in Dubai, this app helped me communicate naturally with my Emirati colleagues."
                </p>
                <div className="font-semibold text-gray-900">Ahmed M.</div>
                <div className="text-sm text-gray-500">Business Professional</div>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  "The cultural context notes are incredible. I now understand when to use formal vs casual expressions in Lebanese."
                </p>
                <div className="font-semibold text-gray-900">Fatima Z.</div>
                <div className="text-sm text-gray-500">University Student</div>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  "The spaced repetition system works perfectly. I'm retaining phrases much better than traditional study methods."
                </p>
                <div className="font-semibold text-gray-900">Youssef K.</div>
                <div className="text-sm text-gray-500">Language Enthusiast</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="py-16 lg:py-24 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready to Connect Across the Arab World?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of Moroccans who've expanded their Arabic fluency
            </p>
            <button
              onClick={() => setShowAuthForm(true)}
              className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 mx-auto"
            >
              <Star className="h-5 w-5" />
              Start Your Journey Now
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-red-600 p-2 rounded-lg">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xl font-bold">Arabic Dialects Hub</span>
                </div>
                <p className="text-gray-400">
                  Empowering Arabic speakers to communicate across all dialects with confidence and cultural awareness.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Features</h3>
                <ul className="text-gray-400 space-y-2">
                  <li>• 400+ Authentic Phrases</li>
                  <li>• 4 Arabic Dialects</li>
                  <li>• AI-Powered Learning</li>
                  <li>• Cultural Context</li>
                  <li>• Progress Tracking</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Dialects Covered</h3>
                <ul className="text-gray-400 space-y-2">
                  <li>🇱🇧 Lebanese Arabic</li>
                  <li>🇸🇾 Syrian Arabic</li>
                  <li>🇦🇪 Emirati Arabic</li>
                  <li>🇸🇦 Saudi Arabic</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
              <p>© 2025 Darija-Arabic Learning Platform. Built with ❤️ for language learners.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  console.log('[App] Rendering main app for user:', user.email);
  
  // Show language setup for new users
  if (showLanguageSetup) {
    return (
      <LanguageSetup
        initialSource={sourceLanguage}
        initialTarget={targetLanguage}
        onComplete={(source, target) => {
          updateLanguagePreferences(source, target);
          localStorage.setItem(`languages_setup_${user.id}`, 'true');
          setShowLanguageSetup(false);
        }}
      />
    );
  }
  
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
                <h1 className="text-2xl font-bold text-gray-900">Arabic Dialects Hub</h1>
                <p className="text-sm text-gray-600">Learn & translate between all Arabic dialects</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              {/* Language Selectors */}
              <div className="flex items-center gap-3">
                <LanguageSelector
                  value={sourceLanguage}
                  onChange={(lang) => updateLanguagePreferences(lang, targetLanguage)}
                  label="From"
                  excludeLanguage={targetLanguage}
                />
                <span className="text-gray-400">→</span>
                <LanguageSelector
                  value={targetLanguage}
                  onChange={(lang) => updateLanguagePreferences(sourceLanguage, lang)}
                  label="To"
                  excludeLanguage={sourceLanguage}
                  includeAll={true}
                />
              </div>
              
              <div className="border-l border-gray-300 h-8"></div>
              
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
                {/* Language Selectors for Mobile */}
                <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                  <LanguageSelector
                    value={sourceLanguage}
                    onChange={(lang) => updateLanguagePreferences(lang, targetLanguage)}
                    label="From"
                    excludeLanguage={targetLanguage}
                  />
                  <span className="text-gray-400">→</span>
                  <LanguageSelector
                    value={targetLanguage}
                    onChange={(lang) => updateLanguagePreferences(sourceLanguage, lang)}
                    label="To"
                    excludeLanguage={sourceLanguage}
                    includeAll={true}
                  />
                </div>
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
            sourceLanguage={sourceLanguage}
            targetLanguage={targetLanguage}
          />
        )}
        {activeTab === 'quiz' && (
          <QuizSystem 
            phrases={allPhrases}
            userProgress={userProgress}
            onUpdateProgress={updateProgress}
            sourceLanguage={sourceLanguage}
            targetLanguage={targetLanguage}
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
                Comprehensive learning platform to master and translate between all Arabic dialects.
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