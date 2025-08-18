import { useState, useMemo, useEffect } from 'react';
import { Brain, Check, X, Trophy, Target, TrendingUp, ChevronRight, BookOpen, Star, Award, Flame, RefreshCw, Home } from 'lucide-react';
import { Phrase, UserProgress, SpacedRepetitionItem } from '../types';
import { getDialectWordBank, getSimilarWords } from '../data/dialectDictionary';
import { useUserProgress } from '../hooks/useUserProgress';
import { AnalyticsService } from '../services/analytics';
import { supabaseProgress } from '../utils/supabaseProgress';
import { useUser } from '@clerk/clerk-react';

interface Props {
  phrases: Phrase[];
  sourceLanguage?: string;
  targetLanguage?: string;
  onUpdateProgress?: (progress: Partial<UserProgress>) => void;
}

type QuizType = 'multiple-choice' | 'word-order';

interface QuizQuestion {
  phrase: Phrase;
  type: QuizType;
  options?: string[];
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export default function QuizSystem({ phrases, sourceLanguage = 'darija', targetLanguage = 'lebanese' }: Props) {
  const { user } = useUser();
  const { 
    userProgress, 
    addQuizScore, 
    markPhraseAsLearned,
    updateProgress,
    refreshProgress
  } = useUserProgress();
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [quizType, setQuizType] = useState<QuizType>('multiple-choice');
  const [difficulty, setDifficulty] = useState<string>('all');
  const [quizLength, setQuizLength] = useState<number>(10);
  const [sourceDialect, setSourceDialect] = useState<string>(sourceLanguage);
  const [targetDialect, setTargetDialect] = useState<string>(targetLanguage === 'all' ? 'lebanese' : targetLanguage);
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  const [quizEndTime, setQuizEndTime] = useState<number | null>(null);
  const [quizComplete, setQuizComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [perfectScore, setPerfectScore] = useState(false);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [isNavigatingToHub, setIsNavigatingToHub] = useState(false);
  
  // Early return if no phrases loaded yet - AFTER all hooks
  if (!phrases || phrases.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-600">
          <p className="text-lg mb-2">Loading phrases...</p>
          <p className="text-sm">If this persists, please refresh the page.</p>
        </div>
      </div>
    );
  }

  // Update targetDialect when targetLanguage changes from header
  useEffect(() => {
    if (targetLanguage !== 'all' && targetLanguage !== targetDialect) {
      setTargetDialect(targetLanguage);
    }
  }, [targetLanguage]);

  const eligiblePhrases = useMemo(() => {
    return phrases.filter(p => {
      const matchesDifficulty = difficulty === 'all' || p.difficulty === difficulty;
      return matchesDifficulty;
    });
  }, [phrases, difficulty]);


  // Build word replacement dictionary combining database words with dialect word bank
  const buildWordReplacementDict = (allPhrases: Phrase[], targetDialectKey: string): Map<string, string[]> => {
    const wordDict = new Map<string, string[]>();
    
    // Add words from phrases
    allPhrases.forEach(phrase => {
      const translation = phrase.translations?.[targetDialectKey as keyof typeof phrase.translations];
      if (translation) {
        const arabicText = typeof translation === 'string' ? translation : translation?.phrase || '';
        if (arabicText && typeof arabicText === 'string') {
          const words = arabicText.split(' ').filter(w => w.length > 0);
          words.forEach(word => {
            const key = word.substring(0, Math.min(2, word.length));
            if (!wordDict.has(key)) {
              wordDict.set(key, []);
            }
            const existing = wordDict.get(key)!;
            if (!existing.includes(word)) {
              existing.push(word);
            }
          });
        }
      }
    });
    
    // Add common dialect words
    const dialectWords = getDialectWordBank(targetDialectKey);
    dialectWords.forEach(word => {
      const key = word.substring(0, Math.min(2, word.length));
      if (!wordDict.has(key)) {
        wordDict.set(key, []);
      }
      const existing = wordDict.get(key)!;
      if (!existing.includes(word)) {
        existing.push(word);
      }
    });
    
    return wordDict;
  };

  // Generate distractors by replacing 1-2 words with valid alternatives
  const generateCloseDistractors = (correctAnswer: string, correctPhrase: Phrase, allPhrases: Phrase[], targetDialectKey: string): string[] => {
    const distractors: string[] = [];
    if (typeof correctAnswer !== 'string') {
      console.error('generateCloseDistractors: correctAnswer is not a string', correctAnswer);
      return [];
    }
    const words = correctAnswer.split(' ').filter(w => w.length > 0);
    
    if (words.length < 2) return []; // Need at least 2 words to modify
    
    // Build replacement dictionary
    const wordDict = buildWordReplacementDict(allPhrases, targetDialectKey);
    
    // Strategy 1: Replace 1 word with a similar valid word from dictionary
    for (let i = 0; i < words.length && distractors.length < 3; i++) {
      const wordToReplace = words[i];
      
      // First try to find similar words (same category) from dictionary
      const similarWords = getSimilarWords(targetDialectKey, wordToReplace);
      if (similarWords.length > 0) {
        const replacement = similarWords[Math.floor(Math.random() * similarWords.length)];
        const newWords = [...words];
        newWords[i] = replacement;
        const distractor = newWords.join(' ');
        if (!distractors.includes(distractor) && distractor !== correctAnswer) {
          distractors.push(distractor);
          continue;
        }
      }
      
      // Fallback: use word bank with similarity matching
      const key = wordToReplace.substring(0, Math.min(2, wordToReplace.length));
      const candidates = wordDict.get(key) || [];
      
      const validReplacements = candidates.filter(candidate => 
        candidate !== wordToReplace && 
        Math.abs(candidate.length - wordToReplace.length) <= 2
      );
      
      if (validReplacements.length > 0) {
        const replacement = validReplacements[Math.floor(Math.random() * validReplacements.length)];
        const newWords = [...words];
        newWords[i] = replacement;
        const distractor = newWords.join(' ');
        if (!distractors.includes(distractor) && distractor !== correctAnswer) {
          distractors.push(distractor);
        }
      }
    }
    
    // Strategy 2: Find phrases from database that share n-1 words
    allPhrases.forEach(phrase => {
      if (distractors.length >= 3) return;
      
      let otherText = '';
      if (targetDialectKey === 'darija') {
        otherText = phrase.darija;
      } else {
        const translation = phrase.translations?.[targetDialectKey as keyof typeof phrase.translations];
        if (translation) {
          otherText = typeof translation === 'string' ? translation : translation?.phrase || '';
        }
      }
      
      if (otherText && typeof otherText === 'string' && otherText !== correctAnswer) {
        const otherWords = otherText.split(' ').filter(w => w.length > 0);
        
        // Check if this phrase shares n-1 or n-2 words with correct answer
        if (Math.abs(otherWords.length - words.length) <= 1) {
          const sharedWords = words.filter(w => otherWords.includes(w));
          const minShared = Math.max(1, words.length - 2); // At least n-2 words shared
          
          if (sharedWords.length >= minShared && !distractors.includes(otherText)) {
            distractors.push(otherText);
          }
        }
      }
    });
    
    // Strategy 3: Swap word order (keeping most words the same)
    if (words.length >= 3 && distractors.length < 3) {
      // Swap two adjacent words
      for (let i = 0; i < words.length - 1; i++) {
        const swappedWords = [...words];
        [swappedWords[i], swappedWords[i + 1]] = [swappedWords[i + 1], swappedWords[i]];
        const distractor = swappedWords.join(' ');
        if (!distractors.includes(distractor) && distractor !== correctAnswer) {
          distractors.push(distractor);
          break;
        }
      }
    }
    
    // Strategy 4: Use common word substitutions from the same semantic field
    if (distractors.length < 3) {
      // Find phrases with same category/tags for semantic substitutions
      const semanticPhrases = allPhrases.filter(p => 
        p.category === correctPhrase?.category || 
        (p.tags && correctPhrase?.tags && p.tags.some(tag => correctPhrase.tags.includes(tag)))
      );
      
      semanticPhrases.forEach(phrase => {
        if (distractors.length >= 3) return;
        
        let semanticText = '';
        if (targetDialectKey === 'darija') {
          semanticText = phrase.darija;
        } else {
          const translation = phrase.translations?.[targetDialectKey as keyof typeof phrase.translations];
          if (translation) {
            semanticText = typeof translation === 'string' ? translation : translation?.phrase || '';
          }
        }
        
        if (semanticText && typeof semanticText === 'string' && semanticText !== correctAnswer) {
          const semanticWords = semanticText.split(' ');
          
          // Try replacing one word with a semantic alternative
          for (let i = 0; i < words.length; i++) {
            if (semanticWords.length > i && semanticWords[i] !== words[i]) {
              const newWords = [...words];
              newWords[i] = semanticWords[i];
              const distractor = newWords.join(' ');
              if (!distractors.includes(distractor) && distractor !== correctAnswer) {
                distractors.push(distractor);
                break;
              }
            }
          }
        }
      });
    }
    
    return distractors.slice(0, 3);
  };
  
  // Main smart distractor function using the new close distractor approach
  const generateSmartDistractors = (correctPhrase: Phrase, targetDialectKey: string, allPhrases: Phrase[]): string[] => {
    let correct = '';
    
    if (targetDialectKey === 'darija') {
      correct = correctPhrase.darija;
    } else {
      const translation = correctPhrase.translations?.[targetDialectKey as keyof typeof correctPhrase.translations];
      if (!translation) {
        return [];
      }
      correct = typeof translation === 'string' ? translation : translation?.phrase || '';
    }
    
    if (!correct) return [];
    
    // Use the new close distractor generation
    return generateCloseDistractors(correct, correctPhrase, allPhrases, targetDialectKey);
  };

  const generateQuizQuestions = (count: number = 10): QuizQuestion[] => {
    const questions: QuizQuestion[] = [];
    
    const availablePhrases = eligiblePhrases;
    
    if (availablePhrases.length === 0) {
      return [];
    }

    const shuffled = [...availablePhrases].sort(() => Math.random() - 0.5);
    const selectedPhrases = shuffled.slice(0, Math.min(count, shuffled.length));

    selectedPhrases.forEach((phrase) => {
      
      if (quizType === 'multiple-choice') {
        const dialects = ['darija', 'lebanese', 'syrian', 'emirati', 'saudi'].filter(d => d !== sourceDialect);
        const targetDialectKey = targetDialect === 'all' 
          ? dialects[Math.floor(Math.random() * dialects.length)]
          : targetDialect;

        // Handle Darija as target (it's not in translations, it's the main field)
        let correct = '';
        if (targetDialectKey === 'darija') {
          correct = phrase.darija;
        } else {
          const translation = phrase.translations?.[targetDialectKey as keyof typeof phrase.translations];
          if (!translation) {
            return;
          }
          // Always use Arabic text (phrase), not latin
          correct = typeof translation === 'string' ? translation : translation?.phrase || '';
        }
        if (!correct) {
          return;
        }
        
        // Use smart distractor generation for better quiz quality
        const distractors = generateSmartDistractors(phrase, targetDialectKey, eligiblePhrases);
        
        // If we don't have enough smart distractors, add some random ones
        if (distractors.length < 3) {
          const otherPhrases = eligiblePhrases.filter(p => p.id !== phrase.id);
          const shuffled = [...otherPhrases].sort(() => Math.random() - 0.5);
          
          for (const otherPhrase of shuffled) {
            if (distractors.length >= 3) break;
            
            let otherArabic = '';
            if (targetDialectKey === 'darija') {
              otherArabic = otherPhrase.darija;
            } else {
              const otherTrans = otherPhrase.translations?.[targetDialectKey as keyof typeof otherPhrase.translations];
              if (otherTrans) {
                otherArabic = typeof otherTrans === 'string' ? otherTrans : otherTrans?.phrase || '';
              }
            }
            if (otherArabic && otherArabic !== correct && !distractors.includes(otherArabic)) {
              distractors.push(otherArabic);
            }
          }
        }
        
        const options = [correct, ...distractors].filter(Boolean);

        questions.push({
          phrase,
          type: 'multiple-choice',
          options: options.sort(() => Math.random() - 0.5),
          correctAnswer: correct
        });
      } else if (quizType === 'word-order') {
        const dialects = ['darija', 'lebanese', 'syrian', 'emirati', 'saudi'].filter(d => d !== sourceDialect);
        const targetDialectKey = targetDialect === 'all' 
          ? dialects[Math.floor(Math.random() * dialects.length)]
          : targetDialect;
        
        // Handle Darija as target (it's not in translations, it's the main field)
        let arabicText = '';
        if (targetDialectKey === 'darija') {
          arabicText = phrase.darija;
        } else {
          const translation = phrase.translations[targetDialectKey as keyof typeof phrase.translations];
          arabicText = typeof translation === 'string' 
            ? translation 
            : translation?.phrase || '';
        }
        
        if (arabicText && typeof arabicText === 'string') {
          // Split the Arabic phrase into words and shuffle them
          const words = arabicText.split(' ').filter(w => w.length > 0);
          const shuffledWords = [...words].sort(() => Math.random() - 0.5);
          
          // Add 3-5 distractor words that shouldn't be chosen
          const dialectWords = getDialectWordBank(targetDialectKey);
          const distractorWords: string[] = [];
          
          // Get words that are NOT in the correct answer
          const availableDistractors = dialectWords.filter(w => !words.includes(w));
          
          // Add 3-5 random distractors
          const numDistractors = Math.min(5, Math.max(3, availableDistractors.length));
          for (let i = 0; i < numDistractors && i < availableDistractors.length; i++) {
            const randomDistractor = availableDistractors[Math.floor(Math.random() * availableDistractors.length)];
            if (!distractorWords.includes(randomDistractor)) {
              distractorWords.push(randomDistractor);
            }
          }
          
          // Combine correct words with distractors and shuffle
          const allWordsForQuiz = [...shuffledWords, ...distractorWords].sort(() => Math.random() - 0.5);
          
          questions.push({
            phrase,
            type: 'word-order',
            options: allWordsForQuiz,
            correctAnswer: arabicText
          });
        }
      }
    });

    return questions;
  };

  const startQuiz = () => {
    console.log('🎯 Quiz Start Button Clicked!');
    console.log('📊 Quiz Configuration:', {
      phrasesCount: phrases?.length || 0,
      phrasesAvailable: !!phrases,
      eligiblePhrasesCount: eligiblePhrases?.length || 0,
      difficulty,
      quizLength,
      quizType,
      sourceDialect,
      targetDialect
    });
    
    // Extra validation
    if (!phrases || phrases.length === 0) {
      console.error('❌ No phrases loaded at all!');
      alert('Phrases are not loaded. Please refresh the page and try again.');
      return;
    }
    
    if (eligiblePhrases.length === 0) {
      console.error('❌ No eligible phrases after filtering!', {
        totalPhrases: phrases.length,
        difficulty
      });
      alert(`No phrases match your criteria (difficulty: ${difficulty}). Try selecting "All Levels" difficulty.`);
      return;
    }
    
    const questions = generateQuizQuestions(quizLength);
    
    if (!questions || questions.length === 0) {
      console.error('❌ Failed to generate questions!', {
        eligiblePhrases: eligiblePhrases.length,
        difficulty,
        quizLength
      });
      alert('Could not generate quiz questions. Please try again with different settings.');
      return;
    }
    
    console.log('✅ Quiz successfully started with', questions.length, 'questions');
    
    setCurrentQuiz(questions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizComplete(false);
    setShowAnswer(false);
    setQuizStartTime(Date.now());
    setQuizEndTime(null);
    
    // Initialize word order state if first question is word-order
    if (questions[0]?.type === 'word-order') {
      setSelectedWords([]);
      setAvailableWords(questions[0].options || []);
    }
    
  };

  const handleAnswer = (answer: string) => {

    const currentQuestion = currentQuiz[currentQuestionIndex];

    currentQuestion.userAnswer = answer;
    currentQuestion.isCorrect = answer === currentQuestion.correctAnswer;

    // IMMEDIATE UI UPDATE - Show feedback right away

    setShowAnswer(true);
    
    if (currentQuestion.isCorrect) {

      setScore(score + 1);
      setStreak(streak + 1);
      updateSpacedRepetition(currentQuestion.phrase.id, true);
      
      // BACKGROUND PROGRESS UPDATE - Don't block UI
      if (user && markPhraseAsLearned) {
        // Run in background without blocking UI
        markPhraseAsLearned(currentQuestion.phrase.id)
          .then(() => {

          })
          .catch(error => {

          });
      }
    } else {

      setStreak(0);
      updateSpacedRepetition(currentQuestion.phrase.id, false);
      
      // Don't update phrase progress for incorrect answers - we only track mastered phrases
      // Incorrect answers don't affect mastery status
    }
  };

  const updateSpacedRepetition = (phraseId: string, correct: boolean) => {
    if (!userProgress) return;
    
    const existingItem = userProgress.spacedRepetition.find(item => item.phraseId === phraseId);
    
    if (existingItem) {
      const newEaseFactor = correct 
        ? Math.min(existingItem.easeFactor + 0.1, 2.5)
        : Math.max(existingItem.easeFactor - 0.2, 1.3);
      
      const newInterval = correct
        ? existingItem.interval * existingItem.easeFactor
        : 1;
      
      const newRepetitions = correct ? existingItem.repetitions + 1 : 0;
      
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + Math.round(newInterval));
      
      const updatedItem: SpacedRepetitionItem = {
        ...existingItem,
        interval: newInterval,
        repetitions: newRepetitions,
        easeFactor: newEaseFactor,
        nextReviewDate: nextReviewDate.toISOString(),
        lastReviewDate: new Date().toISOString()
      };
      
      const newSpacedRepetition = userProgress.spacedRepetition.map(item =>
        item.phraseId === phraseId ? updatedItem : item
      );
      
      updateProgress({
        spacedRepetition: newSpacedRepetition
      });
    } else {
      const newItem: SpacedRepetitionItem = {
        phraseId,
        interval: correct ? 1 : 0,
        repetitions: correct ? 1 : 0,
        easeFactor: 2.5,
        nextReviewDate: new Date(Date.now() + (correct ? 86400000 : 0)).toISOString(),
        lastReviewDate: new Date().toISOString()
      };
      
      updateProgress({
        spacedRepetition: [...userProgress.spacedRepetition, newItem]
      });
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < currentQuiz.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setShowAnswer(false);
      
      // Reset word order state for next question
      if (currentQuiz[nextIndex]?.type === 'word-order') {
        setSelectedWords([]);
        setAvailableWords(currentQuiz[nextIndex].options || []);
      }
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {

    // Stop the timer
    const endTime = Date.now();
    setQuizEndTime(endTime);
    
    setQuizComplete(true);
    setPerfectScore(score === currentQuiz.length);
    
    if (user && userProgress) {
      const timeSpent = Math.round((endTime - quizStartTime) / 1000);
      
      // Collect correct and incorrect phrase IDs
      const correctPhraseIds: string[] = [];
      const incorrectPhraseIds: string[] = [];
      
      currentQuiz.forEach(question => {
        if (question.isCorrect) {
          correctPhraseIds.push(question.phrase.id);
        } else {
          incorrectPhraseIds.push(question.phrase.id);
        }
      });
      
      // Only update phrases that were answered correctly as mastered
      // We don't track incorrect answers as they don't affect mastery
      const updatePromises = correctPhraseIds.map(phraseId => 
        supabaseProgress.updatePhraseProgress(user.id, phraseId, true)
      );
      
      if (updatePromises.length > 0) {
        try {
          await Promise.all(updatePromises);

        } catch (_error) {

        }
      }
      
      // Add quiz score with all the details
      await addQuizScore(
        score,
        currentQuiz.length,
        correctPhraseIds,
        incorrectPhraseIds,
        {
          difficulty,
          quizType,
          sourceDialect,
          targetDialect
        }
      );
      
      // Track in analytics if available
      if (typeof AnalyticsService !== 'undefined' && AnalyticsService.trackQuizCompletion) {
        await AnalyticsService.trackQuizCompletion(
          user.id,
          quizType,
          score,
          currentQuiz.length,
          difficulty,
          targetDialect,
          timeSpent,
          currentQuiz.map(q => ({
            phrase_id: q.phrase.id,
            question_type: q.type,
            user_answer: q.userAnswer,
            correct_answer: q.correctAnswer,
            is_correct: q.isCorrect
          }))
        );
      }
      
      // Create the quiz score object
      const newQuizScore = {
        date: new Date().toISOString(),
        score,
        total: currentQuiz.length,
        difficulty,
        timeSpent
      };
      
      updateProgress({
        quizScores: [...userProgress.quizScores, newQuizScore],
        totalStudyTime: userProgress.totalStudyTime + timeSpent
      });
    }
  };

  const currentQuestion = currentQuiz?.[currentQuestionIndex];

  return (
    <div className="space-y-6">
      {!currentQuiz || !currentQuiz.length || quizComplete ? (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-500" />
            Quiz Settings
          </h2>
          
          {quizComplete && (
            <div className={`mb-6 p-6 rounded-lg animate-slide-in ${
              perfectScore 
                ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300' 
                : 'bg-gradient-to-r from-blue-50 to-indigo-50'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">
                  {perfectScore ? '🎉 Perfect Score!' : 'Quiz Complete!'}
                </h3>
                {perfectScore ? (
                  <Award className="h-8 w-8 text-yellow-500 animate-pulse" />
                ) : (
                  <Trophy className="h-8 w-8 text-yellow-500" />
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Score</p>
                  <p className="text-2xl font-bold flex items-center gap-2">
                    {score}/{currentQuiz.length}
                    {perfectScore && <Star className="h-5 w-5 text-yellow-500 animate-pulse" />}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Percentage</p>
                  <p className="text-2xl font-bold">{Math.round((score/currentQuiz.length) * 100)}%</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Time</p>
                  <p className="text-2xl font-bold">{quizEndTime ? Math.round((quizEndTime - quizStartTime) / 1000) : 0}s</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Streak</p>
                  <p className="text-2xl font-bold">{userProgress?.streakDays || 0} days</p>
                </div>
              </div>
              
              {/* Quiz Completion Action Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {

                    setCurrentQuiz([]);
                    setCurrentQuestionIndex(0);
                    setScore(0);
                    setQuizComplete(false);
                    setShowAnswer(false);
                    setSelectedWords([]);
                    setAvailableWords([]);
                    setQuizEndTime(null);
                    // Refresh progress in background, don't wait
                    if (refreshProgress) {
                      refreshProgress().catch(err => {
                        console.error('Failed to refresh progress:', err);
                      });
                    }
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 btn-press flex items-center justify-center gap-2 shadow-lg"
                >
                  <RefreshCw className="h-5 w-5" />
                  Take Another Quiz
                </button>
                
                <button
                  onClick={async () => {

                    setIsNavigatingToHub(true);
                    
                    // Quick refresh with timeout
                    if (refreshProgress) {
                      const refreshPromise = refreshProgress();
                      const timeoutPromise = new Promise(resolve => setTimeout(resolve, 1000));
                      
                      try {
                        // Wait for refresh or timeout after 1 second
                        await Promise.race([refreshPromise, timeoutPromise]);

                      } catch (err) {

                      }
                    }
                    
                    // Navigate
                    window.location.href = '/hub';
                  }}
                  disabled={isNavigatingToHub}
                  className={`flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg transition-all transform hover:scale-105 btn-press flex items-center justify-center gap-2 shadow-lg ${
                    isNavigatingToHub ? 'opacity-75 cursor-wait' : 'hover:from-blue-600 hover:to-purple-700'
                  }`}
                >
                  {isNavigatingToHub ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Loading Hub...
                    </>
                  ) : (
                    <>
                      <Home className="h-5 w-5" />
                      View Progress in Hub
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Type</label>
              <p className="text-xs text-gray-500 mb-3">Choose the type of quiz</p>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="quizType"
                    value="multiple-choice"
                    checked={quizType === 'multiple-choice'}
                    onChange={(e) => setQuizType(e.target.value as QuizType)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Multiple Choice</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="quizType"
                    value="word-order"
                    checked={quizType === 'word-order'}
                    onChange={(e) => setQuizType(e.target.value as QuizType)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Word Ordering</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <p className="text-xs text-gray-500 mb-3">Select difficulty level</p>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="difficulty"
                    value="all"
                    checked={difficulty === 'all'}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span>All Levels</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="difficulty"
                    value="beginner"
                    checked={difficulty === 'beginner'}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Beginner</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="difficulty"
                    value="intermediate"
                    checked={difficulty === 'intermediate'}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Intermediate</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="difficulty"
                    value="advanced"
                    checked={difficulty === 'advanced'}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Advanced</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Length</label>
              <p className="text-xs text-gray-500 mb-3">Number of questions</p>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="quizLength"
                    value="2"
                    checked={quizLength === 2}
                    onChange={(e) => setQuizLength(parseInt(e.target.value))}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Short (2 questions)</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="quizLength"
                    value="5"
                    checked={quizLength === 5}
                    onChange={(e) => setQuizLength(parseInt(e.target.value))}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Medium (5 questions)</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="quizLength"
                    value="10"
                    checked={quizLength === 10}
                    onChange={(e) => setQuizLength(parseInt(e.target.value))}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Long (10 questions)</span>
                </label>
              </div>
            </div>
          </div>
            
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Source Dialect Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source Dialect
                </label>
                <p className="text-xs text-gray-500 mb-3">Choose which dialect to translate from</p>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="sourceDialect"
                      value="darija"
                      checked={sourceDialect === 'darija'}
                      onChange={(e) => setSourceDialect(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      Darija 🇲🇦
                      {sourceLanguage === 'darija' && (
                        <span className="ml-2 text-xs font-semibold text-green-600">(your source)</span>
                      )}
                    </span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="sourceDialect"
                      value="lebanese"
                      checked={sourceDialect === 'lebanese'}
                      onChange={(e) => setSourceDialect(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      Lebanese 🇱🇧
                      {sourceLanguage === 'lebanese' && (
                        <span className="ml-2 text-xs font-semibold text-green-600">(your source)</span>
                      )}
                    </span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="sourceDialect"
                      value="syrian"
                      checked={sourceDialect === 'syrian'}
                      onChange={(e) => setSourceDialect(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      Syrian 🇸🇾
                      {sourceLanguage === 'syrian' && (
                        <span className="ml-2 text-xs font-semibold text-green-600">(your source)</span>
                      )}
                    </span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="sourceDialect"
                      value="emirati"
                      checked={sourceDialect === 'emirati'}
                      onChange={(e) => setSourceDialect(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      Emirati 🇦🇪
                      {sourceLanguage === 'emirati' && (
                        <span className="ml-2 text-xs font-semibold text-green-600">(your source)</span>
                      )}
                    </span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="sourceDialect"
                      value="saudi"
                      checked={sourceDialect === 'saudi'}
                      onChange={(e) => setSourceDialect(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      Saudi 🇸🇦
                      {sourceLanguage === 'saudi' && (
                        <span className="ml-2 text-xs font-semibold text-green-600">(your source)</span>
                      )}
                    </span>
                  </label>
                </div>
              </div>

              {/* Target Dialect Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Dialect
                </label>
                <p className="text-xs text-gray-500 mb-3">Choose which dialect to translate to</p>
                <div className="space-y-2">
                  {sourceDialect !== 'lebanese' && (
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="targetDialect"
                      value="lebanese"
                      checked={targetDialect === 'lebanese'}
                      onChange={(e) => setTargetDialect(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      Lebanese 🇱🇧
                      {targetLanguage === 'lebanese' && (
                        <span className="ml-2 text-xs font-semibold text-blue-600">(your target)</span>
                      )}
                    </span>
                  </label>
                )}
                {sourceDialect !== 'syrian' && (
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="targetDialect"
                      value="syrian"
                      checked={targetDialect === 'syrian'}
                      onChange={(e) => setTargetDialect(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      Syrian 🇸🇾
                      {targetLanguage === 'syrian' && (
                        <span className="ml-2 text-xs font-semibold text-blue-600">(your target)</span>
                      )}
                    </span>
                  </label>
                )}
                {sourceDialect !== 'emirati' && (
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="targetDialect"
                      value="emirati"
                      checked={targetDialect === 'emirati'}
                      onChange={(e) => setTargetDialect(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      Emirati 🇦🇪
                      {targetLanguage === 'emirati' && (
                        <span className="ml-2 text-xs font-semibold text-blue-600">(your target)</span>
                      )}
                    </span>
                  </label>
                )}
                {sourceDialect !== 'saudi' && (
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="targetDialect"
                      value="saudi"
                      checked={targetDialect === 'saudi'}
                      onChange={(e) => setTargetDialect(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      Saudi 🇸🇦
                      {targetLanguage === 'saudi' && (
                        <span className="ml-2 text-xs font-semibold text-blue-600">(your target)</span>
                      )}
                    </span>
                  </label>
                )}
                {sourceDialect !== 'darija' && (
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="targetDialect"
                      value="darija"
                      checked={targetDialect === 'darija'}
                      onChange={(e) => setTargetDialect(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      Darija 🇲🇦
                      {targetLanguage === 'darija' && (
                        <span className="ml-2 text-xs font-semibold text-blue-600">(your target)</span>
                      )}
                    </span>
                  </label>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex gap-4">
            <button
              onClick={startQuiz}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 btn-press flex items-center justify-center gap-2 shadow-lg"
            >
              <Target className="h-5 w-5" />
              Start Quiz
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6 h-[calc(100vh-120px)] sm:h-auto overflow-y-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-6 gap-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full">
              <h2 className="text-base sm:text-xl font-bold">Q{currentQuestionIndex + 1}/{currentQuiz.length}</h2>
              <div className="flex gap-0.5 sm:gap-1">
                {currentQuiz.map((q, idx) => (
                  <div
                    key={idx}
                    className={`w-6 sm:w-8 h-1.5 sm:h-2 rounded-full transition-all ${
                      idx < currentQuestionIndex 
                        ? (q.isCorrect ? 'bg-green-500' : 'bg-red-500')
                        : idx === currentQuestionIndex 
                        ? 'bg-blue-500 animate-pulse' 
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {streak > 2 && (
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame className="h-4 sm:h-5 w-4 sm:w-5 animate-pulse" />
                  <span className="text-sm sm:text-base font-bold">{streak}</span>
                </div>
              )}
              <div className="text-sm sm:text-lg font-semibold whitespace-nowrap">Score: {score}/{currentQuestionIndex}</div>
            </div>
          </div>
          
          {currentQuestion && (
            <div className="space-y-3 sm:space-y-6">
              <div className="p-3 sm:p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg animate-fade-in">
                <div className="text-center">
                  <p className="text-xs sm:text-base text-gray-600 mb-1 sm:mb-2 flex items-center justify-center gap-1 sm:gap-2">
                    <BookOpen className="h-3 sm:h-4 w-3 sm:w-4" />
                    Translate from {sourceDialect === 'darija' ? 'Darija' : sourceDialect.charAt(0).toUpperCase() + sourceDialect.slice(1)}:
                  </p>
                  <p className="text-xl sm:text-3xl font-bold arabic-text rtl mb-1 sm:mb-2">{
                    sourceDialect === 'darija' ? currentQuestion.phrase.darija :
                    sourceDialect === 'lebanese' && currentQuestion.phrase.translations?.lebanese ? 
                      (typeof currentQuestion.phrase.translations.lebanese === 'string' ? currentQuestion.phrase.translations.lebanese : currentQuestion.phrase.translations.lebanese.phrase) :
                    sourceDialect === 'syrian' && currentQuestion.phrase.translations?.syrian ?
                      (typeof currentQuestion.phrase.translations.syrian === 'string' ? currentQuestion.phrase.translations.syrian : currentQuestion.phrase.translations.syrian.phrase) :
                    sourceDialect === 'emirati' && currentQuestion.phrase.translations?.emirati ?
                      (typeof currentQuestion.phrase.translations.emirati === 'string' ? currentQuestion.phrase.translations.emirati : currentQuestion.phrase.translations.emirati.phrase) :
                    sourceDialect === 'saudi' && currentQuestion.phrase.translations?.saudi ?
                      (typeof currentQuestion.phrase.translations.saudi === 'string' ? currentQuestion.phrase.translations.saudi : currentQuestion.phrase.translations.saudi.phrase) :
                    currentQuestion.phrase.darija
                  }</p>
                  <p className="text-sm sm:text-xl text-gray-700">{
                    sourceDialect === 'darija' ? currentQuestion.phrase.darija_latin :
                    sourceDialect === 'lebanese' && currentQuestion.phrase.translations?.lebanese && typeof currentQuestion.phrase.translations.lebanese === 'object' ? 
                      currentQuestion.phrase.translations.lebanese.latin :
                    sourceDialect === 'syrian' && currentQuestion.phrase.translations?.syrian && typeof currentQuestion.phrase.translations.syrian === 'object' ?
                      currentQuestion.phrase.translations.syrian.latin :
                    sourceDialect === 'emirati' && currentQuestion.phrase.translations?.emirati && typeof currentQuestion.phrase.translations.emirati === 'object' ?
                      currentQuestion.phrase.translations.emirati.latin :
                    sourceDialect === 'saudi' && currentQuestion.phrase.translations?.saudi && typeof currentQuestion.phrase.translations.saudi === 'object' ?
                      currentQuestion.phrase.translations.saudi.latin :
                    currentQuestion.phrase.darija_latin
                  }</p>
                  <p className="text-xs sm:text-base text-gray-500 mt-1 sm:mt-2">"{currentQuestion.phrase.literal_english}"</p>
                  <div className="mt-2 sm:mt-4 flex justify-center gap-1 sm:gap-2">
                    {currentQuestion.phrase.tags?.slice(0, 3).map(tag => (
                      <span key={tag} className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/80 text-gray-600 rounded-full text-[10px] sm:text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {currentQuestion.type === 'multiple-choice' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-h-[30vh] sm:max-h-none overflow-y-auto">
                  {currentQuestion.options?.map((option, idx) => {
                    const isSelected = currentQuestion.userAnswer === option;
                    const isCorrect = option === currentQuestion.correctAnswer;
                    const showResult = showAnswer;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => !showAnswer && handleAnswer(option)}
                        disabled={showAnswer}
                        className={`p-2 sm:p-4 border-2 rounded-lg transition-all btn-press text-sm sm:text-base ${
                          showResult && isCorrect ? 'border-green-500 bg-green-50 animate-pulse-once' :
                          showResult && isSelected && !isCorrect ? 'border-red-500 bg-red-50 animate-shake' :
                          isSelected ? 'border-blue-500 bg-blue-50' :
                          'border-gray-200 hover:border-blue-400 hover:bg-blue-50/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-left flex-1">
                            <span className="text-base sm:text-xl arabic-text rtl block">{option}</span>
                            {/* Find and show the Latin transliteration for this option */}
                            {(() => {
                              // Try to find transliteration for this option
                              // We need to search through all phrases to find which one has this Arabic text
                              
                              // Check all phrases for matching Arabic text
                              for (const p of phrases) {
                                // Check the target dialect that was used for this quiz
                                const trans = p.translations?.[targetDialect as keyof typeof p.translations];
                                if (trans) {
                                  const arabicText = typeof trans === 'string' ? trans : trans?.phrase;
                                  if (arabicText === option && typeof trans === 'object' && trans.latin) {
                                    return <span className="text-sm text-gray-600 mt-1 block">({trans.latin})</span>;
                                  }
                                }
                              }
                              
                              // If not found in target dialect, check all dialects (for distractors)
                              const allDialects = ['darija', 'lebanese', 'syrian', 'emirati', 'saudi'];
                              const dialects = allDialects; // Define dialects for use below
                              for (const p of phrases) {
                                for (const dialect of allDialects) {
                                  const trans = p.translations?.[dialect as keyof typeof p.translations];
                                  if (trans) {
                                    const arabicText = typeof trans === 'string' ? trans : trans?.phrase;
                                    if (arabicText === option && typeof trans === 'object' && trans.latin) {
                                      return <span className="text-sm text-gray-600 mt-1 block">({trans.latin})</span>;
                                    }
                                  }
                                }
                              }
                              
                              // If no exact match, try to find partial matches or similar words
                              const optionWords = typeof option === 'string' ? option.split(' ') : [];
                              for (const p of phrases) {
                                for (const dialect of dialects) {
                                  const trans = p.translations?.[dialect as keyof typeof p.translations];
                                  if (trans && typeof trans === 'object' && trans.latin) {
                                    const arabicText = trans.phrase || '';
                                    const arabicWords = typeof arabicText === 'string' ? arabicText.split(' ') : [];
                                    
                                    // Check if most words match
                                    const matchingWords = optionWords.filter(word => arabicWords.includes(word));
                                    if (matchingWords.length >= Math.max(1, optionWords.length - 1)) {
                                      return <span className="text-sm text-gray-600 mt-1 block">({trans.latin})</span>;
                                    }
                                  }
                                }
                              }
                              
                              return null;
                            })()}
                          </div>
                          {showResult && isCorrect && <Check className="h-5 w-5 text-green-500" />}
                          {showResult && isSelected && !isCorrect && <X className="h-5 w-5 text-red-500" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              
              {currentQuestion.type === 'word-order' && (
                <div className="space-y-4">
                  {/* Selected words area */}
                  <div className="p-4 bg-blue-50 rounded-lg min-h-[80px]">
                    <p className="text-sm text-gray-600 mb-2">Your answer (click words to remove):</p>
                    <div className="flex flex-wrap gap-2 arabic-text rtl">
                      {selectedWords.length === 0 ? (
                        <p className="text-gray-400">Click words below to build your answer...</p>
                      ) : (
                        selectedWords.map((word, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedWords(selectedWords.filter((_, i) => i !== idx));
                              setAvailableWords([...availableWords, word]);
                            }}
                            className="px-3 py-2 bg-white border-2 border-blue-300 rounded-lg hover:bg-blue-100 transition-colors text-lg"
                            disabled={showAnswer}
                          >
                            {word}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                  
                  {/* Available words area */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Available words (click to add):</p>
                    <div className="flex flex-wrap gap-2 arabic-text rtl">
                      {availableWords.map((word, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedWords([...selectedWords, word]);
                            setAvailableWords(availableWords.filter((_, i) => i !== idx));
                          }}
                          className="px-3 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-lg"
                          disabled={showAnswer}
                        >
                          {word}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Submit button */}
                  {!showAnswer && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const answer = selectedWords.join(' ');
                          handleAnswer(answer);
                        }}
                        className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        disabled={selectedWords.length === 0}
                      >
                        Check Answer
                      </button>
                      <button
                        onClick={() => {
                          setSelectedWords([]);
                          setAvailableWords(currentQuestion.options || []);
                        }}
                        className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {showAnswer && (
                <div className={`p-2 sm:p-4 rounded-lg animate-slide-in ${
                  currentQuestion.isCorrect 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
                    : 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200'
                }`}>
                  <div className="flex items-start gap-1 sm:gap-2">
                    {currentQuestion.isCorrect ? (
                      <Check className="h-4 sm:h-6 w-4 sm:w-6 text-green-500 mt-0.5 animate-success flex-shrink-0" />
                    ) : (
                      <X className="h-4 sm:h-6 w-4 sm:w-6 text-red-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm sm:text-lg">
                        {currentQuestion.isCorrect 
                          ? 'Excellent!'
                          : 'Not quite!'}
                      </p>
                      {!currentQuestion.isCorrect && (
                        <p className="text-xs sm:text-base text-gray-700 mt-0.5 sm:mt-1 break-all">
                          Answer: <span className="font-semibold">{currentQuestion.correctAnswer}</span>
                        </p>
                      )}
                      {currentQuestion.isCorrect && streak > 2 && (
                        <p className="text-orange-600 mt-1 flex items-center gap-1">
                          <Flame className="h-4 w-4" />
                          You're on fire! {streak} correct in a row!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {showAnswer && (
                <div className="flex justify-end mt-2 sm:mt-4">
                  <button
                    onClick={nextQuestion}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all btn-press flex items-center gap-1 sm:gap-2 shadow-lg text-sm sm:text-base"
                  >
                    {currentQuestionIndex < currentQuiz.length - 1 ? 'Next' : 'Finish'}
                    <ChevronRight className="h-4 sm:h-5 w-4 sm:w-5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {userProgress && userProgress.quizScores.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Recent Performance
          </h3>
          <div className="space-y-2">
            {userProgress.quizScores.slice(-5).reverse().map((score, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{new Date(score.date).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">{score.difficulty || 'Mixed'} difficulty</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{Math.round((score.score/score.total) * 100)}%</p>
                  <p className="text-sm text-gray-600">{score.score}/{score.total}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}