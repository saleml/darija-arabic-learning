import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Book, Brain, Trophy, Globe, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TranslationHub from '../components/TranslationHub';
import QuizSystem from '../components/QuizSystem';
import ProgressTracker from '../components/ProgressTracker';
import CulturalCards from '../components/CulturalCards';
import ProfileDropdown from '../components/ProfileDropdown';
import { Phrase } from '../types';
import { logger } from '../utils/logger';
import beginnerPhrases from '../../database/beginner_phrases.json';
import intermediatePhrases from '../../database/intermediate_phrases.json';
import advancedPhrases from '../../database/advanced_phrases.json';
import sentencesData from '../../database/sentences_daily_conversations.json';

type TabType = 'hub' | 'quiz' | 'progress' | 'culture';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();
  const { user, userProgress, logout, sourceLanguage, targetLanguage, updateLanguagePreferences, updateUserProgress } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>((tab as TabType) || 'hub');
  const [allPhrases, setAllPhrases] = useState<Phrase[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Update URL when tab changes
  useEffect(() => {
    const validTabs = ['hub', 'quiz', 'progress', 'culture'];
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab as TabType);
    }
  }, [tab]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Load phrases
  useEffect(() => {
    logger.log('[Dashboard] Loading phrases from database files...');
    
    const sentencesAsPhrases = sentencesData.sentences.map((sent: any) => ({
      id: sent.id,
      darija: sent.darija,
      darija_latin: sent.darija_latin || sent.transliteration || '',
      literal_english: sent.english || sent.literal_english || '',
      english: sent.english || '',
      transliteration: sent.darija_latin || '',
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
    
    logger.log('[Dashboard] Total phrases loaded:', phrases.length);
    setAllPhrases(phrases);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleTabChange = (newTab: TabType) => {
    setActiveTab(newTab);
    navigate(`/dashboard/${newTab}`);
    setMobileMenuOpen(false);
  };

  const stats = {
    totalPhrases: allPhrases.length,
    learned: userProgress?.phrasesLearned.length || 0,
    inProgress: userProgress?.phrasesInProgress.length || 0,
    seen: (userProgress?.phrasesLearned.length || 0) + (userProgress?.phrasesInProgress.length || 0),
    streak: userProgress?.streakDays || 0
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <Globe className="h-8 w-8 text-blue-600" />
              <span className="font-bold text-xl hidden sm:block">Arabic Dialects Hub</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex gap-2 xl:gap-4">
              <button
                onClick={() => handleTabChange('hub')}
                className={`px-2 xl:px-3 py-2 rounded-lg transition-colors text-sm ${
                  activeTab === 'hub'
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Book className="inline h-4 w-4 mr-1" />
                <span className="hidden xl:inline">Translation Hub</span>
                <span className="xl:hidden">Hub</span>
              </button>
              <button
                onClick={() => handleTabChange('quiz')}
                className={`px-2 xl:px-3 py-2 rounded-lg transition-colors text-sm ${
                  activeTab === 'quiz'
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Brain className="inline h-4 w-4 mr-1" />
                Quiz
              </button>
              <button
                onClick={() => handleTabChange('progress')}
                className={`px-2 xl:px-3 py-2 rounded-lg transition-colors text-sm ${
                  activeTab === 'progress'
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Trophy className="inline h-4 w-4 mr-1" />
                Progress
              </button>
              <button
                onClick={() => handleTabChange('culture')}
                className={`px-2 xl:px-3 py-2 rounded-lg transition-colors text-sm ${
                  activeTab === 'culture'
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Globe className="inline h-4 w-4 mr-1" />
                Culture
              </button>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <ProfileDropdown
                user={user}
                sourceLanguage={sourceLanguage}
                targetLanguage={targetLanguage}
                onLogout={handleLogout}
                onLanguageChange={updateLanguagePreferences}
              />

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t">
            <div className="px-4 py-2 space-y-2">
              <button
                onClick={() => handleTabChange('hub')}
                className={`w-full text-left px-4 py-2 rounded-lg ${
                  activeTab === 'hub' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
                }`}
              >
                <Book className="inline h-4 w-4 mr-2" />
                Translation Hub
              </button>
              <button
                onClick={() => handleTabChange('quiz')}
                className={`w-full text-left px-4 py-2 rounded-lg ${
                  activeTab === 'quiz' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
                }`}
              >
                <Brain className="inline h-4 w-4 mr-2" />
                Quiz
              </button>
              <button
                onClick={() => handleTabChange('progress')}
                className={`w-full text-left px-4 py-2 rounded-lg ${
                  activeTab === 'progress' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
                }`}
              >
                <Trophy className="inline h-4 w-4 mr-2" />
                Progress
              </button>
              <button
                onClick={() => handleTabChange('culture')}
                className={`w-full text-left px-4 py-2 rounded-lg ${
                  activeTab === 'culture' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
                }`}
              >
                <Globe className="inline h-4 w-4 mr-2" />
                Culture
              </button>
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center gap-2 px-4 py-2">
                  {user.avatarUrl && (
                    <img 
                      src={user.avatarUrl} 
                      alt={user.name} 
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="inline h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.learned}</div>
              <div className="text-xs text-gray-500">Phrases Learned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.inProgress}</div>
              <div className="text-xs text-gray-500">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.streak}</div>
              <div className="text-xs text-gray-500">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.totalPhrases > 0 ? Math.round((stats.seen / stats.totalPhrases) * 100) : 0}%
              </div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === 'hub' && (
            <TranslationHub 
              phrases={allPhrases} 
              userProgress={userProgress}
              sourceLanguage={sourceLanguage}
              targetLanguage={targetLanguage}
              onUpdateProgress={updateUserProgress}
            />
          )}
          {activeTab === 'quiz' && (
            <QuizSystem 
              phrases={allPhrases} 
              userProgress={userProgress}
              targetLanguage={targetLanguage}
              onUpdateProgress={updateUserProgress}
            />
          )}
          {activeTab === 'progress' && (
            <ProgressTracker 
              userProgress={userProgress}
              totalPhrases={allPhrases.length}
              onUpdateProgress={updateUserProgress}
            />
          )}
          {activeTab === 'culture' && (
            <CulturalCards 
              phrases={allPhrases}
              userProgress={userProgress}
              onUpdateProgress={updateUserProgress}
            />
          )}
        </div>
      </main>
    </div>
  );
}