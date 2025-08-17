import { useState, useMemo } from 'react';
import { Search, Globe, ChevronDown, ChevronUp, Star, Sparkles, TrendingUp, Award, Copy, CheckCircle } from 'lucide-react';
import { Phrase, UserProgress } from '../types';
import TranslationDisplay from './TranslationDisplay';

interface Props {
  phrases: Phrase[];
  userProgress: UserProgress | null;
  onUpdateProgress: (progress: UserProgress) => void;
  sourceLanguage?: string;
  targetLanguage?: string;
}

export default function TranslationHub({ phrases, userProgress, onUpdateProgress, sourceLanguage = 'darija' }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [expandedPhrases, setExpandedPhrases] = useState<Set<string>>(new Set());
  const [copiedPhraseId, setCopiedPhraseId] = useState<string | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(phrases.map(p => p.category));
    return ['all', ...Array.from(cats)];
  }, [phrases]);

  const filteredPhrases = useMemo(() => {
    const filtered = phrases.filter(phrase => {
      const matchesSearch = searchQuery === '' || (
        phrase.darija?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phrase.darija_latin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phrase.literal_english?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phrase.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) || false
      );
      
      const matchesCategory = selectedCategory === 'all' || phrase.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'all' || phrase.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    });
    
    console.log('[TranslationHub] Filtering:', {
      total: phrases.length,
      filtered: filtered.length,
      category: selectedCategory,
      difficulty: selectedDifficulty,
      search: searchQuery
    });
    
    return filtered;
  }, [phrases, searchQuery, selectedCategory, selectedDifficulty]);

  const togglePhrase = (phraseId: string) => {
    const newExpanded = new Set(expandedPhrases);
    if (newExpanded.has(phraseId)) {
      newExpanded.delete(phraseId);
    } else {
      newExpanded.add(phraseId);
      markAsInProgress(phraseId);
    }
    setExpandedPhrases(newExpanded);
  };

  const markAsInProgress = (phraseId: string) => {
    if (!userProgress) return;
    
    if (!userProgress.phrasesInProgress.includes(phraseId) && 
        !userProgress.phrasesLearned.includes(phraseId)) {
      const newProgress = {
        ...userProgress,
        phrasesInProgress: [...userProgress.phrasesInProgress, phraseId]
      };
      onUpdateProgress(newProgress);
    }
  };

  const markAsLearned = (phraseId: string) => {
    if (!userProgress) return;
    
    const newProgress = {
      ...userProgress,
      phrasesLearned: [...userProgress.phrasesLearned, phraseId],
      phrasesInProgress: userProgress.phrasesInProgress.filter(id => id !== phraseId)
    };
    onUpdateProgress(newProgress);
    
    // Show success animation
    setShowSuccessAnimation(phraseId);
    setTimeout(() => setShowSuccessAnimation(null), 1000);
  };

  const copyToClipboard = async (text: string, phraseId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPhraseId(phraseId);
      setTimeout(() => setCopiedPhraseId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFormalityIcon = (formality: string) => {
    switch (formality) {
      case 'very_formal': return '👔';
      case 'formal': return '🎩';
      case 'neutral': return '😊';
      case 'informal': return '👋';
      case 'very_informal': return '😎';
      default: return '😊';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Progress Summary Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Your Learning Journey</h2>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                <span>{userProgress?.phrasesLearned.length || 0} Mastered</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <span>{userProgress?.phrasesInProgress.length || 0} In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span>{phrases.length - (userProgress?.phrasesLearned.length || 0)} To Explore</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {userProgress ? Math.round((userProgress.phrasesLearned.length / phrases.length) * 100) : 0}%
            </div>
            <div className="text-sm opacity-90">Complete</div>
          </div>
        </div>
        <div className="mt-4 bg-white/20 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-white h-full transition-all duration-500 ease-out"
            style={{ width: `${userProgress ? (userProgress.phrasesLearned.length / phrases.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${sourceLanguage === 'darija' ? 'Darija' : sourceLanguage.charAt(0).toUpperCase() + sourceLanguage.slice(1)}, English, or Arabic...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat.replace('_', ' ')}
                </option>
              ))}
            </select>
            
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Found <span className="font-bold text-lg text-blue-600">{filteredPhrases.length}</span> phrases
            </div>
            <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              Showing in: {sourceLanguage === 'darija' ? '🇲🇦 Darija' :
                           sourceLanguage === 'lebanese' ? '🇱🇧 Lebanese' :
                           sourceLanguage === 'syrian' ? '🇸🇾 Syrian' :
                           sourceLanguage === 'emirati' ? '🇦🇪 Emirati' :
                           sourceLanguage === 'saudi' ? '🇸🇦 Saudi' : sourceLanguage}
            </div>
          </div>
          {filteredPhrases.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Sparkles className="h-4 w-4" />
              <span>Click any card to see translations</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {filteredPhrases.map((phrase) => {
            const isExpanded = expandedPhrases.has(phrase.id);
            const isLearned = userProgress?.phrasesLearned.includes(phrase.id);
            const isInProgress = userProgress?.phrasesInProgress.includes(phrase.id);
            
            return (
              <div
                key={phrase.id}
                className={`border rounded-lg transition-all card-hover animate-slide-in ${
                  isLearned ? 'border-green-300 bg-green-50' : 
                  isInProgress ? 'border-blue-300 bg-blue-50' : 
                  'border-gray-200 bg-white'
                } ${
                  showSuccessAnimation === phrase.id ? 'animate-pulse-once' : ''
                }`}
                style={{ animationDelay: `${filteredPhrases.indexOf(phrase) * 50}ms` }}
              >
                <div
                  onClick={() => togglePhrase(phrase.id)}
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors relative"
                >
                  {showSuccessAnimation === phrase.id && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <CheckCircle className="h-16 w-16 text-green-500 animate-success" />
                    </div>
                  )}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl font-bold arabic-text rtl">{
                          sourceLanguage === 'darija' ? phrase.darija :
                          sourceLanguage === 'lebanese' && phrase.translations?.lebanese ? (typeof phrase.translations.lebanese === 'string' ? phrase.translations.lebanese : phrase.translations.lebanese.phrase) :
                          sourceLanguage === 'syrian' && phrase.translations?.syrian ? (typeof phrase.translations.syrian === 'string' ? phrase.translations.syrian : phrase.translations.syrian.phrase) :
                          sourceLanguage === 'emirati' && phrase.translations?.emirati ? (typeof phrase.translations.emirati === 'string' ? phrase.translations.emirati : phrase.translations.emirati.phrase) :
                          sourceLanguage === 'saudi' && phrase.translations?.saudi ? (typeof phrase.translations.saudi === 'string' ? phrase.translations.saudi : phrase.translations.saudi.phrase) :
                          phrase.darija
                        }</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const textToCopy = sourceLanguage === 'darija' ? phrase.darija :
                              sourceLanguage === 'lebanese' && phrase.translations?.lebanese ? (typeof phrase.translations.lebanese === 'string' ? phrase.translations.lebanese : phrase.translations.lebanese.phrase) :
                              sourceLanguage === 'syrian' && phrase.translations?.syrian ? (typeof phrase.translations.syrian === 'string' ? phrase.translations.syrian : phrase.translations.syrian.phrase) :
                              sourceLanguage === 'emirati' && phrase.translations?.emirati ? (typeof phrase.translations.emirati === 'string' ? phrase.translations.emirati : phrase.translations.emirati.phrase) :
                              sourceLanguage === 'saudi' && phrase.translations?.saudi ? (typeof phrase.translations.saudi === 'string' ? phrase.translations.saudi : phrase.translations.saudi.phrase) :
                              phrase.darija;
                            copyToClipboard(textToCopy, `${phrase.id}-ar`);
                          }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors tooltip"
                          data-tooltip="Copy Arabic"
                        >
                          {copiedPhraseId === `${phrase.id}-ar` ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                        <span className="text-gray-500">•</span>
                        <span className="text-lg text-gray-700">{
                          sourceLanguage === 'darija' ? (phrase.darija_latin || '') :
                          sourceLanguage === 'lebanese' && phrase.translations?.lebanese ? phrase.translations.lebanese.latin :
                          sourceLanguage === 'syrian' && phrase.translations?.syrian ? phrase.translations.syrian.latin :
                          sourceLanguage === 'emirati' && phrase.translations?.emirati ? phrase.translations.emirati.latin :
                          sourceLanguage === 'saudi' && phrase.translations?.saudi ? phrase.translations.saudi.latin :
                          (phrase.darija_latin || '')
                        }</span>
                        {isLearned && (
                          <div className="flex items-center gap-1">
                            <Star className="h-5 w-5 text-yellow-500 fill-current animate-pulse-once" />
                            <span className="text-xs text-yellow-600 font-semibold">Mastered!</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-gray-600">{phrase.literal_english || ''}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(phrase.difficulty)}`}>
                          {phrase.difficulty}
                        </span>
                        <span className="text-sm">{getFormalityIcon(phrase.usage?.formality || 'neutral')}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {(phrase.tags || []).slice(0, 3).map(tag => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sourceLanguage !== 'darija' && (
                        <TranslationDisplay 
                          translation={{ arabic: phrase.darija, latin: phrase.darija_latin || '' }}
                          dialectName="Darija"
                          flag="🇲🇦"
                        />
                      )}
                      
                      {sourceLanguage !== 'lebanese' && phrase.translations?.lebanese && (
                        <TranslationDisplay 
                          translation={phrase.translations.lebanese}
                          dialectName="Lebanese"
                          flag="🇱🇧"
                        />
                      )}
                      
                      {sourceLanguage !== 'syrian' && phrase.translations?.syrian && (
                        <TranslationDisplay 
                          translation={phrase.translations.syrian}
                          dialectName="Syrian"
                          flag="🇸🇾"
                        />
                      )}
                      
                      {sourceLanguage !== 'emirati' && phrase.translations?.emirati && (
                        <TranslationDisplay 
                          translation={phrase.translations.emirati}
                          dialectName="Emirati"
                          flag="🇦🇪"
                        />
                      )}
                      
                      {sourceLanguage !== 'saudi' && phrase.translations?.saudi && (
                        <TranslationDisplay 
                          translation={phrase.translations.saudi}
                          dialectName="Saudi"
                          flag="🇸🇦"
                        />
                      )}
                      
                      {phrase.translations?.formal_msa && (
                        <TranslationDisplay 
                          translation={phrase.translations.formal_msa}
                          dialectName="Formal MSA"
                          flag="📚"
                        />
                      )}
                    </div>
                    
                    {phrase.cultural_notes && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Globe className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <div className="font-semibold text-yellow-800 text-sm">Cultural Note:</div>
                            <div className="text-yellow-700 text-sm">{phrase.cultural_notes}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Usage: {phrase.usage.context.join(', ')}</span>
                      </div>
                      
                      {!isLearned ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsLearned(phrase.id);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 btn-press flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark as Learned
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-semibold">Completed</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}