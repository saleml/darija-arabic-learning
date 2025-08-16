export interface Translation {
  phrase: string;
  latin: string;
  literal: string;
  usage_note?: string;
  alternatives?: string[];
  formality_shift?: string;
}

export interface Phrase {
  id: string;
  darija: string;
  darija_latin: string;
  literal_english: string;
  translations: {
    lebanese: Translation;
    syrian: Translation;
    emirati: Translation;
    saudi: Translation;
    egyptian?: Translation;
    formal_msa: Translation;
  };
  category: string;
  subcategory?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  usage: {
    formality: 'very_formal' | 'formal' | 'neutral' | 'informal' | 'very_informal';
    frequency: 'essential' | 'very_high' | 'high' | 'medium' | 'low' | 'rare';
    context: string[];
    gender_specific?: {
      male_form?: string;
      female_form?: string;
      mixed_group?: string;
      notes: string;
    };
    age_appropriate?: string;
  };
  cultural_notes?: string;
  common_mistakes?: string[];
  related_phrases?: string[];
  audio?: {
    darija?: string;
    lebanese?: string;
    syrian?: string;
    gulf?: string;
  };
  examples?: Array<{
    darija: string;
    darija_latin: string;
    translation: string;
    context: string;
    dialect_variations?: Record<string, string>;
  }>;
  metadata?: {
    date_added: string;
    last_updated: string;
    source_references: string[];
    validated: boolean;
    reviewer_notes?: string;
  };
}

export interface UserProgress {
  userId: string;
  phrasesLearned: string[];
  phrasesInProgress: string[];
  quizScores: QuizScore[];
  spacedRepetition: SpacedRepetitionItem[];
  streakDays: number;
  lastActiveDate: string;
  totalStudyTime: number;
  preferences: UserPreferences;
}

export interface QuizScore {
  date: string;
  score: number;
  total: number;
  category?: string;
  difficulty?: string;
  timeSpent: number;
}

export interface SpacedRepetitionItem {
  phraseId: string;
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReviewDate: string;
  lastReviewDate: string;
}

export interface UserPreferences {
  targetDialect: 'lebanese' | 'syrian' | 'emirati' | 'saudi' | 'all';
  dailyGoal: number;
  reminderTime?: string;
  soundEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
}