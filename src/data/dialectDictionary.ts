// Arabic Dialect Dictionary for MCQ Distractors and Word Ordering
// Compiled from common words in Lebanese, Syrian, Emirati, and Saudi dialects

export interface DialectWord {
  arabic: string;
  latin: string;
  meaning: string;
  category: 'verb' | 'noun' | 'adjective' | 'pronoun' | 'adverb' | 'preposition' | 'particle';
}

export const dialectDictionary = {
  lebanese: [
    // Pronouns
    { arabic: 'أنا', latin: 'ana', meaning: 'I', category: 'pronoun' as const },
    { arabic: 'إنت', latin: 'inte', meaning: 'you (m)', category: 'pronoun' as const },
    { arabic: 'إنتي', latin: 'inti', meaning: 'you (f)', category: 'pronoun' as const },
    { arabic: 'هو', latin: 'huwwe', meaning: 'he', category: 'pronoun' as const },
    { arabic: 'هي', latin: 'hiyye', meaning: 'she', category: 'pronoun' as const },
    { arabic: 'نحنا', latin: 'nehna', meaning: 'we', category: 'pronoun' as const },
    
    // Verbs
    { arabic: 'بدي', latin: 'biddi', meaning: 'I want', category: 'verb' as const },
    { arabic: 'بده', latin: 'biddo', meaning: 'he wants', category: 'verb' as const },
    { arabic: 'بدها', latin: 'bidda', meaning: 'she wants', category: 'verb' as const },
    { arabic: 'بدك', latin: 'biddak', meaning: 'you want', category: 'verb' as const },
    { arabic: 'بروح', latin: 'bruh', meaning: 'I go', category: 'verb' as const },
    { arabic: 'بيجي', latin: 'biji', meaning: 'he comes', category: 'verb' as const },
    { arabic: 'بقول', latin: 'b2ul', meaning: 'I say', category: 'verb' as const },
    { arabic: 'بشوف', latin: 'bshuf', meaning: 'I see', category: 'verb' as const },
    { arabic: 'بعرف', latin: 'ba3ref', meaning: 'I know', category: 'verb' as const },
    { arabic: 'بحب', latin: 'bheb', meaning: 'I love', category: 'verb' as const },
    
    // Nouns
    { arabic: 'بيت', latin: 'bayt', meaning: 'house', category: 'noun' as const },
    { arabic: 'ولد', latin: 'walad', meaning: 'boy', category: 'noun' as const },
    { arabic: 'بنت', latin: 'bint', meaning: 'girl', category: 'noun' as const },
    { arabic: 'أكل', latin: 'akel', meaning: 'food', category: 'noun' as const },
    { arabic: 'مي', latin: 'mayy', meaning: 'water', category: 'noun' as const },
    { arabic: 'شغل', latin: 'shoghl', meaning: 'work', category: 'noun' as const },
    
    // Adjectives
    { arabic: 'كبير', latin: 'kbir', meaning: 'big', category: 'adjective' as const },
    { arabic: 'صغير', latin: 'zghir', meaning: 'small', category: 'adjective' as const },
    { arabic: 'حلو', latin: 'helw', meaning: 'nice/sweet', category: 'adjective' as const },
    { arabic: 'منيح', latin: 'mnih', meaning: 'good', category: 'adjective' as const },
    { arabic: 'سخن', latin: 'sukhn', meaning: 'hot', category: 'adjective' as const },
    { arabic: 'بارد', latin: 'bared', meaning: 'cold', category: 'adjective' as const },
    
    // Adverbs/Particles
    { arabic: 'كتير', latin: 'ktir', meaning: 'very/a lot', category: 'adverb' as const },
    { arabic: 'شوي', latin: 'shway', meaning: 'a little', category: 'adverb' as const },
    { arabic: 'هيك', latin: 'heek', meaning: 'like this', category: 'adverb' as const },
    { arabic: 'هلق', latin: 'hal2', meaning: 'now', category: 'adverb' as const },
    { arabic: 'بكرا', latin: 'bukra', meaning: 'tomorrow', category: 'adverb' as const },
    { arabic: 'امبارح', latin: 'mbereh', meaning: 'yesterday', category: 'adverb' as const },
    
    // Questions
    { arabic: 'شو', latin: 'shu', meaning: 'what', category: 'particle' as const },
    { arabic: 'وين', latin: 'wayn', meaning: 'where', category: 'particle' as const },
    { arabic: 'كيف', latin: 'kif', meaning: 'how', category: 'particle' as const },
    { arabic: 'ليش', latin: 'laysh', meaning: 'why', category: 'particle' as const },
    { arabic: 'مين', latin: 'min', meaning: 'who', category: 'particle' as const },
    
    // Common expressions
    { arabic: 'يلا', latin: 'yalla', meaning: 'let\'s go', category: 'particle' as const },
    { arabic: 'خلاص', latin: 'khalas', meaning: 'finished/enough', category: 'particle' as const },
    { arabic: 'ماشي', latin: 'mashi', meaning: 'okay/fine', category: 'particle' as const },
  ],

  syrian: [
    // Similar to Lebanese with slight variations
    { arabic: 'كثير', latin: 'ktir', meaning: 'very/a lot', category: 'adverb' as const },
    { arabic: 'شوية', latin: 'shwayye', meaning: 'a little', category: 'adverb' as const },
    { arabic: 'هدا', latin: 'hada', meaning: 'this (m)', category: 'pronoun' as const },
    { arabic: 'هدي', latin: 'hadi', meaning: 'this (f)', category: 'pronoun' as const },
    { arabic: 'بعرف', latin: 'ba3ref', meaning: 'I know', category: 'verb' as const },
    { arabic: 'بحكي', latin: 'bahki', meaning: 'I speak', category: 'verb' as const },
    { arabic: 'منيح', latin: 'mnih', meaning: 'good', category: 'adjective' as const },
    { arabic: 'زلمة', latin: 'zalame', meaning: 'man', category: 'noun' as const },
    { arabic: 'مرا', latin: 'mara', meaning: 'woman', category: 'noun' as const },
  ],

  emirati: [
    // Gulf dialect variations
    { arabic: 'وايد', latin: 'wayd', meaning: 'very/a lot', category: 'adverb' as const },
    { arabic: 'شوي', latin: 'shway', meaning: 'a little', category: 'adverb' as const },
    { arabic: 'جي', latin: 'chi', meaning: 'like this', category: 'adverb' as const },
    { arabic: 'هني', latin: 'hni', meaning: 'here', category: 'adverb' as const },
    { arabic: 'ويه', latin: 'wayh', meaning: 'there', category: 'adverb' as const },
    { arabic: 'شلون', latin: 'shlon', meaning: 'how', category: 'particle' as const },
    { arabic: 'شنو', latin: 'shinu', meaning: 'what', category: 'particle' as const },
    { arabic: 'منو', latin: 'minu', meaning: 'who', category: 'particle' as const },
    { arabic: 'أبا', latin: 'aba', meaning: 'I want', category: 'verb' as const },
    { arabic: 'تبا', latin: 'taba', meaning: 'you want', category: 'verb' as const },
    { arabic: 'يبا', latin: 'yaba', meaning: 'he wants', category: 'verb' as const },
    { arabic: 'زين', latin: 'zayn', meaning: 'good/nice', category: 'adjective' as const },
    { arabic: 'حار', latin: 'harr', meaning: 'hot', category: 'adjective' as const },
    { arabic: 'باچر', latin: 'bachar', meaning: 'tomorrow', category: 'adverb' as const },
    { arabic: 'الحين', latin: 'alhin', meaning: 'now', category: 'adverb' as const },
  ],

  saudi: [
    // Saudi dialect variations
    { arabic: 'كثير', latin: 'kathir', meaning: 'very/a lot', category: 'adverb' as const },
    { arabic: 'شوي', latin: 'shway', meaning: 'a little', category: 'adverb' as const },
    { arabic: 'كذا', latin: 'kida', meaning: 'like this', category: 'adverb' as const },
    { arabic: 'هنا', latin: 'hina', meaning: 'here', category: 'adverb' as const },
    { arabic: 'هناك', latin: 'hinak', meaning: 'there', category: 'adverb' as const },
    { arabic: 'كيف', latin: 'kayf', meaning: 'how', category: 'particle' as const },
    { arabic: 'إيش', latin: 'aysh', meaning: 'what', category: 'particle' as const },
    { arabic: 'مين', latin: 'min', meaning: 'who', category: 'particle' as const },
    { arabic: 'متى', latin: 'mata', meaning: 'when', category: 'particle' as const },
    { arabic: 'أبي', latin: 'abi', meaning: 'I want', category: 'verb' as const },
    { arabic: 'تبي', latin: 'tabi', meaning: 'you want', category: 'verb' as const },
    { arabic: 'يبي', latin: 'yabi', meaning: 'he wants', category: 'verb' as const },
    { arabic: 'زين', latin: 'zayn', meaning: 'good/nice', category: 'adjective' as const },
    { arabic: 'حار', latin: 'harr', meaning: 'hot', category: 'adjective' as const },
    { arabic: 'بكرة', latin: 'bukra', meaning: 'tomorrow', category: 'adverb' as const },
    { arabic: 'الحين', latin: 'alhin', meaning: 'now', category: 'adverb' as const },
  ]
};

// Helper function to get word bank for a specific dialect
export const getDialectWordBank = (dialectKey: string): string[] => {
  const dict = dialectDictionary[dialectKey as keyof typeof dialectDictionary] || dialectDictionary.lebanese;
  return dict.map(word => word.arabic);
};

// Helper function to get words by category
export const getWordsByCategory = (dialectKey: string, category: DialectWord['category']): string[] => {
  const dict = dialectDictionary[dialectKey as keyof typeof dialectDictionary] || dialectDictionary.lebanese;
  return dict.filter(word => word.category === category).map(word => word.arabic);
};

// Helper function to find similar words (same category, different meaning)
export const getSimilarWords = (dialectKey: string, targetWord: string): string[] => {
  const dict = dialectDictionary[dialectKey as keyof typeof dialectDictionary] || dialectDictionary.lebanese;
  const targetEntry = dict.find(word => word.arabic === targetWord);
  
  if (!targetEntry) return [];
  
  return dict
    .filter(word => word.category === targetEntry.category && word.arabic !== targetWord)
    .map(word => word.arabic);
};