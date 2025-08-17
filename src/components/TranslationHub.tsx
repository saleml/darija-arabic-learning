import { useState, useMemo, useRef, useEffect } from 'react';
import { RefreshCw, Globe, ChevronDown, ChevronUp, Star, Sparkles, Award, Copy, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Phrase, UserProgress } from '../types';
import TranslationDisplay from './TranslationDisplay';

interface Props {
  phrases: Phrase[];
  userProgress: UserProgress | null;
  onUpdateProgress: (progress: Partial<UserProgress>) => void;
  onMarkAsLearned?: (phraseId: string) => void;
  onMarkAsInProgress?: (phraseId: string) => void;
  sourceLanguage?: string;
  targetLanguage?: string;
}

export default function TranslationHub({ phrases, userProgress, onUpdateProgress, onMarkAsLearned, sourceLanguage = 'darija' }: Props) {
  const [showMastered, setShowMastered] = useState(false);
  const [currentPhrases, setCurrentPhrases] = useState<Phrase[]>([]);
  const [expandedPhrases, setExpandedPhrases] = useState<Set<string>>(new Set());
  const [copiedPhraseId, setCopiedPhraseId] = useState<string | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState<string | null>(null);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts when component unmounts
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);

  // Get unmastered and mastered phrases
  const unmasteredPhrases = useMemo(() => {
    if (!phrases) return [];
    // If no userProgress yet (new user), all phrases are unmastered
    if (!userProgress) return phrases;
    return phrases.filter(p => !userProgress.phrasesLearned.includes(p.id));
  }, [phrases, userProgress]);

  const masteredPhrases = useMemo(() => {
    if (!phrases) return [];
    // If no userProgress yet (new user), no phrases are mastered
    if (!userProgress) return [];
    // Only return phrases that actually exist in the current phrase list
    return phrases.filter(p => userProgress.phrasesLearned.includes(p.id));
  }, [phrases, userProgress]);

  // Function to get 3 random unmastered phrases
  const getRandomPhrases = () => {
    if (unmasteredPhrases.length === 0) return [];
    
    // Better randomization using Fisher-Yates shuffle
    const shuffled = [...unmasteredPhrases];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled.slice(0, 3);
  };

  // Initialize with 3 random phrases
  useEffect(() => {
    if (!showMastered && unmasteredPhrases.length > 0) {
      setCurrentPhrases(getRandomPhrases());
    }
  }, [unmasteredPhrases.length]); // Only re-run when unmasteredPhrases changes

  // Update displayed phrases when toggle changes
  useEffect(() => {
    if (showMastered) {
      setCurrentPhrases(masteredPhrases);
    } else {
      setCurrentPhrases(getRandomPhrases());
    }
  }, [showMastered]);

  const refreshPhrases = () => {
    if (!showMastered) {
      setCurrentPhrases(getRandomPhrases());
    }
  };

  const togglePhrase = (phraseId: string) => {
    const newExpanded = new Set(expandedPhrases);
    if (newExpanded.has(phraseId)) {
      newExpanded.delete(phraseId);
    } else {
      newExpanded.add(phraseId);
    }
    setExpandedPhrases(newExpanded);
  };

  // Removed markAsInProgress - we only track mastered/not mastered

  const markAsLearned = async (phraseId: string) => {
    if (!userProgress) {

      return;
    }

    // Check if already learned to prevent duplicate calls
    if (userProgress.phrasesLearned.includes(phraseId)) {

      return;
    }
    
    // Show success animation immediately
    setShowSuccessAnimation(phraseId);
    
    // Clear any existing timeout for this phrase
    const existingTimeout = timeoutRefs.current.get(phraseId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Set new timeout and store reference
    const newTimeout = setTimeout(() => setShowSuccessAnimation(null), 2000);
    timeoutRefs.current.set(phraseId, newTimeout);
    
    try {
      if (onMarkAsLearned) {
        // Use the Supabase-connected function
        console.log('Marking as learned via onMarkAsLearned:', phraseId);
        await onMarkAsLearned(phraseId);
        // Don't call onUpdateProgress here - let onMarkAsLearned handle it
      } else {
        console.log('Marking as learned via local update:', phraseId);
        // Fallback to local update
        const newProgress = {
          ...userProgress,
          phrasesLearned: [...userProgress.phrasesLearned, phraseId],
          phrasesInProgress: userProgress.phrasesInProgress.filter(id => id !== phraseId)
        };
        onUpdateProgress(newProgress);
      }
    } catch (error) {

      // Clear success animation on error
      setShowSuccessAnimation(null);
      // Clear timeout on error
      const timeout = timeoutRefs.current.get(phraseId);
      if (timeout) {
        clearTimeout(timeout);
        timeoutRefs.current.delete(phraseId);
      }
      // TODO: Show error notification to user
    }
  };

  const copyToClipboard = async (text: string, phraseId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPhraseId(phraseId);
      setTimeout(() => setCopiedPhraseId(null), 2000);
    } catch (err) {

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
                <span>{masteredPhrases.length} Mastered</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span>{unmasteredPhrases.length} To Explore</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {phrases.length > 0 ? Math.round((masteredPhrases.length / phrases.length) * 100) : 0}%
            </div>
            <div className="text-sm opacity-90">Complete</div>
          </div>
        </div>
        <div className="mt-4 bg-white/20 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-white h-full transition-all duration-500 ease-out"
            style={{ width: `${phrases.length > 0 ? (masteredPhrases.length / phrases.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowMastered(!showMastered)}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                showMastered 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showMastered ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              {showMastered ? 'Showing Mastered' : 'Show Mastered'}
            </button>
            
            {!showMastered && unmasteredPhrases.length > 3 && (
              <button
                onClick={refreshPhrases}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all flex items-center gap-2 font-medium"
              >
                <RefreshCw className="h-5 w-5" />
                Show me 3 other phrases I haven't mastered
              </button>
            )}
          </div>

          <div className="text-sm text-gray-600">
            {showMastered ? (
              <span>Showing <span className="font-bold text-green-600">{masteredPhrases.length}</span> mastered phrases</span>
            ) : (
              <span>Showing <span className="font-bold text-blue-600">3</span> random unmastered phrases</span>
            )}
          </div>
        </div>

        {/* Message when all phrases are mastered */}
        {unmasteredPhrases.length === 0 && !showMastered && (
          <div className="text-center py-12 text-gray-500">
            <Award className="h-16 w-16 mx-auto mb-4 text-gold-500" />
            <h3 className="text-xl font-bold mb-2">Congratulations! 🎉</h3>
            <p>You've mastered all phrases! Toggle "Show Mastered" to review them.</p>
          </div>
        )}

        {/* Phrase Cards */}
        <div className="space-y-4">
          {currentPhrases.map((phrase, index) => {
            const isExpanded = expandedPhrases.has(phrase.id);
            const isLearned = userProgress?.phrasesLearned.includes(phrase.id);
            
            return (
              <div
                key={phrase.id}
                className={`border rounded-lg transition-all card-hover animate-slide-in ${
                  isLearned ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
                } ${
                  showSuccessAnimation === phrase.id ? 'animate-pulse-once' : ''
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
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
                        <span className="text-xl font-bold arabic-text rtl">{(() => {
                          let value = '';
                          
                          if (sourceLanguage === 'darija') {
                            value = phrase.darija;
                          } else {
                            const translation = phrase.translations?.[sourceLanguage as keyof typeof phrase.translations];
                            if (translation) {
                              if (typeof translation === 'string') {
                                value = translation;
                              } else if (translation && typeof translation === 'object' && 'phrase' in translation) {
                                value = translation.phrase || '';
                              }
                            } else {
                              // Fallback to darija if translation not found
                              value = phrase.darija;
                            }
                          }
                          
                          // Debug check
                          if (!value) {
                            console.warn('Empty value for phrase:', phrase.id, 'sourceLanguage:', sourceLanguage);
                          }
                          if (typeof value === 'object') {
                            console.error('Object being rendered:', value, 'for phrase:', phrase.id);
                            return phrase.darija || 'Error';
                          }
                          return value || phrase.darija || '';
                        })()}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const textToCopy = sourceLanguage === 'darija' ? phrase.darija :
                              sourceLanguage === 'lebanese' && phrase.translations?.lebanese ? 
                                (typeof phrase.translations.lebanese === 'string' ? phrase.translations.lebanese : 
                                 (phrase.translations.lebanese?.phrase || '')) :
                              sourceLanguage === 'syrian' && phrase.translations?.syrian ? 
                                (typeof phrase.translations.syrian === 'string' ? phrase.translations.syrian : 
                                 (phrase.translations.syrian?.phrase || '')) :
                              sourceLanguage === 'emirati' && phrase.translations?.emirati ? 
                                (typeof phrase.translations.emirati === 'string' ? phrase.translations.emirati : 
                                 (phrase.translations.emirati?.phrase || '')) :
                              sourceLanguage === 'saudi' && phrase.translations?.saudi ? 
                                (typeof phrase.translations.saudi === 'string' ? phrase.translations.saudi : 
                                 (phrase.translations.saudi?.phrase || '')) :
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
                        <span className="text-lg text-gray-700">{(() => {
                          let value = '';
                          
                          if (sourceLanguage === 'darija') {
                            value = phrase.darija_latin || '';
                          } else {
                            const translation = phrase.translations?.[sourceLanguage as keyof typeof phrase.translations];
                            if (translation && typeof translation === 'object' && 'latin' in translation) {
                              value = translation.latin || '';
                            }
                          }
                          
                          // Always fallback to darija_latin if no latin found
                          if (!value) {
                            value = phrase.darija_latin || '';
                          }
                          
                          if (typeof value === 'object') {
                            console.error('Object in latin:', value, 'for phrase:', phrase.id);
                            return '';
                          }
                          return value;
                        })()}</span>
                        {isLearned && (
                          <div className="flex items-center gap-1" title="Mastered by answering correctly in quiz">
                            <Star className="h-5 w-5 text-yellow-500 fill-current animate-pulse-once" />
                            <span className="text-xs text-yellow-600 font-semibold">Mastered!</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-gray-600">{phrase.literal_english || ''}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(phrase.difficulty)}`}>
                          {typeof phrase.difficulty === 'object' ? JSON.stringify(phrase.difficulty) : (phrase.difficulty || 'beginner')}
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
                      
                      {isLearned ? (
                        <div className="flex items-center gap-2 text-green-600" title="You've mastered this phrase!">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-semibold">Mastered</span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsLearned(phrase.id);
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105 btn-press flex items-center gap-2"
                          title="Click if you already know this phrase from before"
                        >
                          <Star className="h-4 w-4" />
                          Mark as Already Mastered - I know this already
                        </button>
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