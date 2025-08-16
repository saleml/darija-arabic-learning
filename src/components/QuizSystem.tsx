import { useState, useMemo } from 'react';
import { Brain, Check, X, Trophy, Target, Clock, TrendingUp, ChevronRight, BookOpen, Star, Award, Flame } from 'lucide-react';
import { Phrase, UserProgress, QuizScore, SpacedRepetitionItem } from '../types';
import { getDialectWordBank, getSimilarWords } from '../data/dialectDictionary';
import { AnalyticsService } from '../services/analytics';

interface Props {
  phrases: Phrase[];
  userProgress: UserProgress | null;
  onUpdateProgress: (progress: UserProgress) => void;
}


type QuizType = 'multiple-choice' | 'word-order' | 'spaced';
type QuizMode = 'practice' | 'test';

interface QuizQuestion {
  phrase: Phrase;
  type: QuizType;
  options?: string[];
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export default function QuizSystem({ phrases, userProgress, onUpdateProgress }: Props) {
  // Get user from context (we'll need to pass this or get it from useAuth)
  const getUserFromAuth = () => {
    // This is a placeholder - in real implementation, get from useAuth hook
    return userProgress ? { 
      id: userProgress.userId, 
      email: 'user@example.com', 
      name: 'User' 
    } : null;
  };
  // Early return if no phrases loaded yet
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
  const [quizType, setQuizType] = useState<QuizType>('multiple-choice');
  const [quizMode, setQuizMode] = useState<QuizMode>('practice');
  const [difficulty, setDifficulty] = useState<string>('all');
  const [targetDialect, setTargetDialect] = useState<string>('all');
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [perfectScore, setPerfectScore] = useState(false);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);

  const eligiblePhrases = useMemo(() => {
    return phrases.filter(p => {
      const matchesDifficulty = difficulty === 'all' || p.difficulty === difficulty;
      return matchesDifficulty;
    });
  }, [phrases, difficulty]);

  const getDueForReview = (): Phrase[] => {
    console.log('[getDueForReview] Starting...');
    console.log('[getDueForReview] User progress exists?', !!userProgress);
    console.log('[getDueForReview] Total phrases available:', phrases.length);
    
    if (!userProgress) {
      console.log('[getDueForReview] No user progress, returning empty array');
      return [];
    }
    
    const now = new Date().toISOString();
    const dueItems = userProgress.spacedRepetition
      .filter(item => item.nextReviewDate <= now)
      .map(item => phrases.find(p => p.id === item.phraseId))
      .filter(Boolean) as Phrase[];
    
    console.log('[getDueForReview] Due items count:', dueItems.length);
    
    // If we have due items, return them
    if (dueItems.length > 0) {
      return dueItems;
    }
    
    // For new users to spaced repetition, return some starter phrases
    if (userProgress.spacedRepetition.length === 0) {
      console.log('[getDueForReview] First time user, getting starter phrases');
      
      // Filter phrases based on difficulty if needed
      const filteredPhrases = difficulty === 'all' 
        ? phrases 
        : phrases.filter(p => p.difficulty === difficulty);
      
      const starterPhrases = filteredPhrases.slice(0, 10);
      console.log('[getDueForReview] Filtered phrases:', filteredPhrases.length);
      console.log('[getDueForReview] Returning', starterPhrases.length, 'starter phrases');
      
      return starterPhrases;
    }
    
    console.log('[getDueForReview] User has history but nothing due');
    return [];
  };


  // Build word replacement dictionary combining database words with dialect word bank
  const buildWordReplacementDict = (allPhrases: Phrase[], targetDialectKey: string): Map<string, string[]> => {
    const wordDict = new Map<string, string[]>();
    
    // Add words from phrases
    allPhrases.forEach(phrase => {
      const translation = phrase.translations?.[targetDialectKey as keyof typeof phrase.translations];
      if (translation) {
        const arabicText = typeof translation === 'string' ? translation : translation?.phrase || '';
        if (arabicText) {
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
      
      const translation = phrase.translations?.[targetDialectKey as keyof typeof phrase.translations];
      if (translation) {
        const otherText = typeof translation === 'string' ? translation : translation?.phrase || '';
        if (otherText && otherText !== correctAnswer) {
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
        
        const translation = phrase.translations?.[targetDialectKey as keyof typeof phrase.translations];
        if (translation) {
          const semanticText = typeof translation === 'string' ? translation : translation?.phrase || '';
          if (semanticText && semanticText !== correctAnswer) {
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
        }
      });
    }
    
    return distractors.slice(0, 3);
  };
  
  // Main smart distractor function using the new close distractor approach
  const generateSmartDistractors = (correctPhrase: Phrase, targetDialectKey: string, allPhrases: Phrase[]): string[] => {
    const translation = correctPhrase.translations?.[targetDialectKey as keyof typeof correctPhrase.translations];
    if (!translation) {
      console.warn('[QuizSystem] No translation found for dialect:', targetDialectKey);
      return [];
    }
    
    const correct = typeof translation === 'string' ? translation : translation?.phrase || '';
    if (!correct) return [];
    
    // Use the new close distractor generation
    return generateCloseDistractors(correct, correctPhrase, allPhrases, targetDialectKey);
  };

  const generateQuizQuestions = (count: number = 10): QuizQuestion[] => {
    console.log('[QuizSystem] Generating quiz questions...');
    console.log('[QuizSystem] Quiz type:', quizType);
    console.log('[QuizSystem] Total phrases passed to component:', phrases.length);
    const questions: QuizQuestion[] = [];
    
    // For spaced repetition, use a simplified approach
    let availablePhrases: Phrase[] = [];
    if (quizType === 'spaced') {
      // For spaced repetition, just use the first 10 phrases if we're starting fresh
      const spacedRepetitionHistory = userProgress?.spacedRepetition || [];
      console.log('[QuizSystem] Spaced repetition history length:', spacedRepetitionHistory.length);
      
      if (spacedRepetitionHistory.length === 0) {
        // New user - just use first 10 phrases that match filters
        console.log('[QuizSystem] New to spaced repetition, using starter phrases');
        availablePhrases = phrases.slice(0, 10);
      } else {
        // Check for due items
        const now = new Date().toISOString();
        const dueItems = spacedRepetitionHistory
          .filter(item => item.nextReviewDate <= now)
          .map(item => phrases.find(p => p.id === item.phraseId))
          .filter(Boolean) as Phrase[];
        
        availablePhrases = dueItems.length > 0 ? dueItems : phrases.slice(0, 10);
      }
      
      console.log('[QuizSystem] Spaced repetition using:', availablePhrases.length, 'phrases');
    } else {
      availablePhrases = eligiblePhrases;
    }
    
    console.log('[QuizSystem] Available phrases for quiz:', availablePhrases.length);
    
    if (availablePhrases.length === 0) {
      console.warn('[QuizSystem] No available phrases for quiz!');
      console.warn('[QuizSystem] Total phrases:', phrases.length);
      console.warn('[QuizSystem] Eligible phrases:', eligiblePhrases.length);
      console.warn('[QuizSystem] Quiz type was:', quizType);
      console.warn('[QuizSystem] First phrase in phrases array:', phrases[0]);
      return [];
    }

    const shuffled = [...availablePhrases].sort(() => Math.random() - 0.5);
    const selectedPhrases = shuffled.slice(0, Math.min(count, shuffled.length));

    selectedPhrases.forEach((phrase, index) => {
      console.log(`[QuizSystem] Processing phrase ${index + 1}/${selectedPhrases.length}:`, phrase.id);
      
      if (quizType === 'multiple-choice') {
        const dialects = ['lebanese', 'syrian', 'emirati', 'saudi'];
        const targetDialectKey = targetDialect === 'all' 
          ? dialects[Math.floor(Math.random() * dialects.length)]
          : targetDialect;
        
        console.log('[QuizSystem] Target dialect for question:', targetDialectKey);
        
        const translation = phrase.translations?.[targetDialectKey as keyof typeof phrase.translations];
        if (!translation) {
          console.warn(`[QuizSystem] No translation found for ${targetDialectKey} in phrase ${phrase.id}, skipping...`);
          return;
        }
        
        // Always use Arabic text (phrase), not latin
        const correct = typeof translation === 'string' ? translation : translation?.phrase || '';
        if (!correct) {
          console.warn(`[QuizSystem] Empty correct answer for phrase ${phrase.id}, skipping...`);
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
            
            const otherTrans = otherPhrase.translations?.[targetDialectKey as keyof typeof otherPhrase.translations];
            if (otherTrans) {
              const otherArabic = typeof otherTrans === 'string' ? otherTrans : otherTrans?.phrase || '';
              if (otherArabic && otherArabic !== correct && !distractors.includes(otherArabic)) {
                distractors.push(otherArabic);
              }
            }
          }
        }
        
        const options = [correct, ...distractors].filter(Boolean);
        
        console.log('[QuizSystem] Question created with', options.length, 'options');
        
        questions.push({
          phrase,
          type: 'multiple-choice',
          options: options.sort(() => Math.random() - 0.5),
          correctAnswer: correct
        });
      } else if (quizType === 'word-order') {
        const dialects = ['lebanese', 'syrian', 'emirati', 'saudi'];
        const targetDialectKey = targetDialect === 'all' 
          ? dialects[Math.floor(Math.random() * dialects.length)]
          : targetDialect;
        
        const translation = phrase.translations[targetDialectKey as keyof typeof phrase.translations];
        const arabicText = typeof translation === 'string' 
          ? translation 
          : translation?.phrase || '';
        const _latinText = typeof translation === 'object' 
          ? translation?.latin || '' 
          : '';
        
        if (arabicText) {
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
    console.log('[QuizSystem] Start Quiz clicked');
    console.log('[QuizSystem] Quiz type:', quizType);
    console.log('[QuizSystem] Difficulty:', difficulty);
    console.log('[QuizSystem] Target dialect:', targetDialect);
    console.log('[QuizSystem] Total phrases available:', phrases.length);
    console.log('[QuizSystem] First 3 phrases:', phrases.slice(0, 3));
    console.log('[QuizSystem] Eligible phrases count:', eligiblePhrases.length);
    
    // For spaced repetition, check if we have phrases to review
    if (quizType === 'spaced') {
      const dueForReview = getDueForReview();
      console.log('[QuizSystem] Phrases due for review:', dueForReview.length);
      if (dueForReview.length === 0 && phrases.length === 0) {
        alert('No phrases loaded. Please refresh the page.');
        return;
      }
    }
    
    const questions = generateQuizQuestions();
    console.log('[QuizSystem] Generated questions:', questions.length);
    
    if (questions.length === 0) {
      // For spaced repetition with no questions, force use the first 10 available phrases
      if (quizType === 'spaced' && phrases.length > 0) {
        console.log('[QuizSystem] Forcing spaced repetition with available phrases');
        
        // Directly create questions from first 10 phrases
        const forcedQuestions: QuizQuestion[] = [];
        const phrasesToUse = phrases.slice(0, 10);
        
        phrasesToUse.forEach(phrase => {
          const dialects = ['lebanese', 'syrian', 'emirati', 'saudi'];
          const targetDialectKey = targetDialect === 'all' 
            ? dialects[Math.floor(Math.random() * dialects.length)]
            : targetDialect;
          
          const translation = phrase.translations?.[targetDialectKey as keyof typeof phrase.translations];
          if (translation) {
            // Always use Arabic text (phrase), not latin
            const correct = typeof translation === 'string' ? translation : translation?.phrase || '';
            if (correct) {
              // Use smart distractor generation
              const distractors = generateSmartDistractors(phrase, targetDialectKey, phrases);
              
              // If we don't have enough distractors, add from other phrases
              if (distractors.length < 3) {
                const otherPhrases = phrases.filter(p => p.id !== phrase.id);
                const shuffled = otherPhrases.sort(() => Math.random() - 0.5);
                
                for (let i = 0; i < Math.min(3, shuffled.length); i++) {
                  if (distractors.length >= 3) break;
                  const wrongPhrase = shuffled[i];
                  const wrongTranslation = wrongPhrase.translations?.[targetDialectKey as keyof typeof wrongPhrase.translations];
                  if (wrongTranslation) {
                    // Get Arabic text, not Latin
                    const wrongAnswer = typeof wrongTranslation === 'string' 
                      ? wrongTranslation 
                      : wrongTranslation?.phrase || '';
                    if (wrongAnswer && wrongAnswer !== correct && !distractors.includes(wrongAnswer)) {
                      distractors.push(wrongAnswer);
                    }
                  }
                }
              }
              
              forcedQuestions.push({
                phrase,
                type: 'multiple-choice',
                options: [correct, ...distractors.slice(0, 3)].sort(() => Math.random() - 0.5),
                correctAnswer: correct
              });
            }
          }
        });
        
        if (forcedQuestions.length > 0) {
          console.log('[QuizSystem] Created', forcedQuestions.length, 'forced questions');
          setCurrentQuiz(forcedQuestions);
          setCurrentQuestionIndex(0);
          setScore(0);
          setQuizComplete(false);
          setShowAnswer(false);
          setQuizStartTime(Date.now());
          return;
        }
      }
      
      alert('No phrases available for quiz. Try adjusting your filters.');
      return;
    }
    
    setCurrentQuiz(questions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizComplete(false);
    setShowAnswer(false);
    setQuizStartTime(Date.now());
    
    // Initialize word order state if first question is word-order
    if (questions[0]?.type === 'word-order') {
      setSelectedWords([]);
      setAvailableWords(questions[0].options || []);
    }
    
    console.log('[QuizSystem] Quiz started successfully');
  };

  const handleAnswer = (answer: string) => {
    const currentQuestion = currentQuiz[currentQuestionIndex];
    currentQuestion.userAnswer = answer;
    currentQuestion.isCorrect = answer === currentQuestion.correctAnswer;
    
    if (currentQuestion.isCorrect) {
      setScore(score + 1);
      setStreak(streak + 1);
      updateSpacedRepetition(currentQuestion.phrase.id, true);
    } else {
      setStreak(0);
      updateSpacedRepetition(currentQuestion.phrase.id, false);
    }
    
    setShowAnswer(true);
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
      
      onUpdateProgress({
        ...userProgress,
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
      
      onUpdateProgress({
        ...userProgress,
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
    setQuizComplete(true);
    setPerfectScore(score === currentQuiz.length);
    
    if (userProgress) {
      const timeSpent = Math.round((Date.now() - quizStartTime) / 1000);
      const quizScore: QuizScore = {
        date: new Date().toISOString(),
        score,
        total: currentQuiz.length,
        difficulty,
        timeSpent
      };
      
      // Track quiz completion in database
      const user = getUserFromAuth();
      if (user) {
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

        // Track study session
        await AnalyticsService.trackStudySession(
          user.id,
          'quiz',
          Math.round(timeSpent / 60),
          currentQuiz.length,
          Math.round((score / currentQuiz.length) * 100)
        );
      }
      
      onUpdateProgress({
        ...userProgress,
        quizScores: [...userProgress.quizScores, quizScore],
        totalStudyTime: userProgress.totalStudyTime + timeSpent
      });
    }
  };

  const currentQuestion = currentQuiz[currentQuestionIndex];

  return (
    <div className="space-y-6">
      {!currentQuiz.length || quizComplete ? (
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
                  <p className="text-2xl font-bold">{Math.round((Date.now() - quizStartTime) / 1000)}s</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Streak</p>
                  <p className="text-2xl font-bold">{userProgress?.streakDays || 0} days</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Type</label>
              <select
                value={quizType}
                onChange={(e) => setQuizType(e.target.value as QuizType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="word-order">Word Ordering</option>
                <option value="spaced">Spaced Repetition (Smart Review)</option>
              </select>
              {quizType === 'spaced' && userProgress?.spacedRepetition.length === 0 && (
                <p className="mt-2 text-sm text-blue-600">
                  ✨ Spaced repetition reviews phrases at optimal intervals for long-term memory!
                </p>
              )}
              {quizType === 'multiple-choice' && (
                <p className="mt-2 text-sm text-gray-600">
                  📝 Test your recognition of dialect translations
                </p>
              )}
              {quizType === 'word-order' && (
                <p className="mt-2 text-sm text-green-600">
                  🎯 Arrange words in the correct order to form the translation
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Dialect</label>
              <select
                value={targetDialect}
                onChange={(e) => setTargetDialect(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Random Mix</option>
                <option value="lebanese">Lebanese</option>
                <option value="syrian">Syrian</option>
                <option value="emirati">Emirati</option>
                <option value="saudi">Saudi</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
              <select
                value={quizMode}
                onChange={(e) => setQuizMode(e.target.value as QuizMode)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="practice">Practice (with hints)</option>
                <option value="test">Test (no hints)</option>
              </select>
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
            
            {/* Debug button - remove after testing */}
            <button
              onClick={() => {
                console.log('=== DEBUG INFO ===');
                console.log('Phrases array:', phrases);
                console.log('Phrases length:', phrases.length);
                console.log('Eligible phrases:', eligiblePhrases);
                console.log('Eligible length:', eligiblePhrases.length);
                console.log('User progress:', userProgress);
                console.log('Quiz type:', quizType);
                console.log('First phrase:', phrases[0]);
                alert(`Phrases loaded: ${phrases.length}\nEligible: ${eligiblePhrases.length}\nQuiz type: ${quizType}`);
              }}
              className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Debug Info
            </button>
            
            {quizType === 'spaced' && (
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-5 w-5" />
                <span>
                  {userProgress?.spacedRepetition.length === 0 
                    ? `${Math.min(10, phrases.length)} phrases ready to start learning`
                    : (() => {
                        const now = new Date().toISOString();
                        const dueCount = userProgress!.spacedRepetition
                          .filter(item => item.nextReviewDate <= now).length;
                        return dueCount > 0 
                          ? `${dueCount} phrases due for review`
                          : '10 phrases available for practice';
                      })()}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold">Question {currentQuestionIndex + 1} of {currentQuiz.length}</h2>
              <div className="flex gap-1">
                {currentQuiz.map((q, idx) => (
                  <div
                    key={idx}
                    className={`w-8 h-2 rounded-full transition-all ${
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
            <div className="flex items-center gap-4">
              {streak > 2 && (
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame className="h-5 w-5 animate-pulse" />
                  <span className="font-bold">{streak} streak!</span>
                </div>
              )}
              <div className="text-lg font-semibold">Score: {score}/{currentQuestionIndex}</div>
            </div>
          </div>
          
          {currentQuestion && (
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg animate-fade-in">
                <div className="text-center">
                  <p className="text-gray-600 mb-2 flex items-center justify-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Translate from Darija:
                  </p>
                  <p className="text-3xl font-bold arabic-text rtl mb-2">{currentQuestion.phrase.darija}</p>
                  <p className="text-xl text-gray-700">{currentQuestion.phrase.darija_latin}</p>
                  <p className="text-gray-500 mt-2">"{currentQuestion.phrase.literal_english}"</p>
                  <div className="mt-4 flex justify-center gap-2">
                    {currentQuestion.phrase.tags?.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-white/80 text-gray-600 rounded-full text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {currentQuestion.type === 'multiple-choice' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentQuestion.options?.map((option, idx) => {
                    const isSelected = currentQuestion.userAnswer === option;
                    const isCorrect = option === currentQuestion.correctAnswer;
                    const showResult = showAnswer;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => !showAnswer && handleAnswer(option)}
                        disabled={showAnswer}
                        className={`p-4 border-2 rounded-lg transition-all transform hover:scale-102 btn-press ${
                          showResult && isCorrect ? 'border-green-500 bg-green-50 animate-pulse-once' :
                          showResult && isSelected && !isCorrect ? 'border-red-500 bg-red-50 animate-shake' :
                          isSelected ? 'border-blue-500 bg-blue-50' :
                          'border-gray-200 hover:border-blue-400 hover:bg-blue-50/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-left flex-1">
                            <span className="text-xl arabic-text rtl block">{option}</span>
                            {/* Find and show the Latin transliteration for this option */}
                            {(() => {
                              // First check if it's the current target dialect
                              const _targetDialectKey = targetDialect === 'all' 
                                ? ['lebanese', 'syrian', 'emirati', 'saudi'][Math.floor(Math.random() * 4)]
                                : targetDialect;
                              
                              // Try to find which phrase this option belongs to
                              const allPhrases = [...phrases]; // Use all phrases, not just eligible
                              for (const p of allPhrases) {
                                // Check each dialect's translation
                                const dialects = ['lebanese', 'syrian', 'emirati', 'saudi'];
                                for (const dialect of dialects) {
                                  const trans = p.translations?.[dialect as keyof typeof p.translations];
                                  if (trans) {
                                    const arabicText = typeof trans === 'string' ? trans : trans?.phrase;
                                    if (arabicText === option && typeof trans === 'object' && trans.latin) {
                                      return <span className="text-sm text-gray-600 mt-1 block">({trans.latin})</span>;
                                    }
                                  }
                                }
                              }
                              // If no match found, return empty parentheses as placeholder
                              return <span className="text-sm text-gray-500 mt-1 block">(transliteration unavailable)</span>;
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
                <div className={`p-4 rounded-lg animate-slide-in ${
                  currentQuestion.isCorrect 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
                    : 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200'
                }`}>
                  <div className="flex items-start gap-2">
                    {currentQuestion.isCorrect ? (
                      <Check className="h-6 w-6 text-green-500 mt-0.5 animate-success" />
                    ) : (
                      <X className="h-6 w-6 text-red-500 mt-0.5" />
                    )}
                    <div>
                      <p className="font-semibold text-lg">
                        {currentQuestion.isCorrect 
                          ? ['Excellent!', 'Perfect!', 'Great job!', 'Fantastic!'][Math.floor(Math.random() * 4)]
                          : 'Not quite, but keep trying!'}
                      </p>
                      {!currentQuestion.isCorrect && (
                        <p className="text-gray-700 mt-1">
                          Correct answer: <span className="font-semibold">{currentQuestion.correctAnswer}</span>
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
                <div className="flex justify-end">
                  <button
                    onClick={nextQuestion}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 btn-press flex items-center gap-2 shadow-lg"
                  >
                    {currentQuestionIndex < currentQuiz.length - 1 ? 'Next Question' : 'Finish Quiz'}
                    <ChevronRight className="h-5 w-5" />
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