import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import beginnerPhrases from '../database/beginner_phrases.json';
import intermediatePhrases from '../database/intermediate_phrases.json';
import advancedPhrases from '../database/advanced_phrases.json';
import sentencesData from '../database/sentences_daily_conversations.json';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface PhraseData {
  id: string;
  darija: string;
  darija_latin?: string;
  literal_english?: string;
  english?: string;
  category: string;
  difficulty: string;
  tags?: string[];
  formality?: string;
  frequency?: string;
  context?: string[];
  cultural_notes?: string;
  lebanese_arabic?: string;
  lebanese_latin?: string;
  syrian_arabic?: string;
  syrian_latin?: string;
  emirati_arabic?: string;
  emirati_latin?: string;
  saudi_arabic?: string;
  saudi_latin?: string;
  formal_msa_arabic?: string;
  formal_msa_latin?: string;
}

async function populatePhrases() {
  console.log('Starting to populate phrases table...');
  
  const allPhrases: PhraseData[] = [];
  
  // Process beginner phrases
  beginnerPhrases.phrases.forEach((phrase: any) => {
    const phraseData: PhraseData = {
      id: phrase.id,
      darija: phrase.darija,
      darija_latin: phrase.darija_latin || phrase.transliteration,
      literal_english: phrase.literal_english || phrase.english,
      english: phrase.english,
      category: phrase.category,
      difficulty: phrase.difficulty || 'beginner',
      tags: phrase.tags || [],
      formality: phrase.usage?.formality || 'neutral',
      frequency: phrase.usage?.frequency || 'medium',
      context: phrase.usage?.context || [],
      cultural_notes: phrase.cultural_notes || ''
    };
    
    // Add translations if they exist
    if (phrase.translations) {
      if (phrase.translations.lebanese) {
        phraseData.lebanese_arabic = typeof phrase.translations.lebanese === 'string' 
          ? phrase.translations.lebanese 
          : phrase.translations.lebanese.phrase;
        phraseData.lebanese_latin = typeof phrase.translations.lebanese === 'string'
          ? ''
          : phrase.translations.lebanese.latin;
      }
      if (phrase.translations.syrian) {
        phraseData.syrian_arabic = typeof phrase.translations.syrian === 'string' 
          ? phrase.translations.syrian 
          : phrase.translations.syrian.phrase;
        phraseData.syrian_latin = typeof phrase.translations.syrian === 'string'
          ? ''
          : phrase.translations.syrian.latin;
      }
      if (phrase.translations.emirati) {
        phraseData.emirati_arabic = typeof phrase.translations.emirati === 'string' 
          ? phrase.translations.emirati 
          : phrase.translations.emirati.phrase;
        phraseData.emirati_latin = typeof phrase.translations.emirati === 'string'
          ? ''
          : phrase.translations.emirati.latin;
      }
      if (phrase.translations.saudi) {
        phraseData.saudi_arabic = typeof phrase.translations.saudi === 'string' 
          ? phrase.translations.saudi 
          : phrase.translations.saudi.phrase;
        phraseData.saudi_latin = typeof phrase.translations.saudi === 'string'
          ? ''
          : phrase.translations.saudi.latin;
      }
      if (phrase.translations.formal_msa) {
        phraseData.formal_msa_arabic = typeof phrase.translations.formal_msa === 'string' 
          ? phrase.translations.formal_msa 
          : phrase.translations.formal_msa.phrase;
        phraseData.formal_msa_latin = typeof phrase.translations.formal_msa === 'string'
          ? ''
          : phrase.translations.formal_msa.latin;
      }
    }
    
    allPhrases.push(phraseData);
  });
  
  // Process intermediate phrases
  intermediatePhrases.phrases.forEach((phrase: any) => {
    const phraseData: PhraseData = {
      id: phrase.id,
      darija: phrase.darija,
      darija_latin: phrase.darija_latin || phrase.transliteration,
      literal_english: phrase.literal_english || phrase.english,
      english: phrase.english,
      category: phrase.category,
      difficulty: phrase.difficulty || 'intermediate',
      tags: phrase.tags || [],
      formality: phrase.usage?.formality || 'neutral',
      frequency: phrase.usage?.frequency || 'medium',
      context: phrase.usage?.context || [],
      cultural_notes: phrase.cultural_notes || ''
    };
    
    // Add translations if they exist
    if (phrase.translations) {
      if (phrase.translations.lebanese) {
        phraseData.lebanese_arabic = typeof phrase.translations.lebanese === 'string' 
          ? phrase.translations.lebanese 
          : phrase.translations.lebanese.phrase;
        phraseData.lebanese_latin = typeof phrase.translations.lebanese === 'string'
          ? ''
          : phrase.translations.lebanese.latin;
      }
      if (phrase.translations.syrian) {
        phraseData.syrian_arabic = typeof phrase.translations.syrian === 'string' 
          ? phrase.translations.syrian 
          : phrase.translations.syrian.phrase;
        phraseData.syrian_latin = typeof phrase.translations.syrian === 'string'
          ? ''
          : phrase.translations.syrian.latin;
      }
      if (phrase.translations.emirati) {
        phraseData.emirati_arabic = typeof phrase.translations.emirati === 'string' 
          ? phrase.translations.emirati 
          : phrase.translations.emirati.phrase;
        phraseData.emirati_latin = typeof phrase.translations.emirati === 'string'
          ? ''
          : phrase.translations.emirati.latin;
      }
      if (phrase.translations.saudi) {
        phraseData.saudi_arabic = typeof phrase.translations.saudi === 'string' 
          ? phrase.translations.saudi 
          : phrase.translations.saudi.phrase;
        phraseData.saudi_latin = typeof phrase.translations.saudi === 'string'
          ? ''
          : phrase.translations.saudi.latin;
      }
      if (phrase.translations.formal_msa || phrase.translations.msa) {
        const msa = phrase.translations.formal_msa || phrase.translations.msa;
        phraseData.formal_msa_arabic = typeof msa === 'string' 
          ? msa 
          : msa.phrase;
        phraseData.formal_msa_latin = typeof msa === 'string'
          ? ''
          : msa.latin;
      }
    }
    
    allPhrases.push(phraseData);
  });
  
  // Process advanced phrases
  advancedPhrases.phrases.forEach((phrase: any) => {
    const phraseData: PhraseData = {
      id: phrase.id,
      darija: phrase.darija,
      darija_latin: phrase.darija_latin || phrase.transliteration,
      literal_english: phrase.literal_english || phrase.english,
      english: phrase.english,
      category: phrase.category,
      difficulty: phrase.difficulty || 'advanced',
      tags: phrase.tags || [],
      formality: phrase.usage?.formality || 'neutral',
      frequency: phrase.usage?.frequency || 'medium',
      context: phrase.usage?.context || [],
      cultural_notes: phrase.cultural_notes || ''
    };
    
    // Add translations if they exist
    if (phrase.translations) {
      if (phrase.translations.lebanese) {
        phraseData.lebanese_arabic = typeof phrase.translations.lebanese === 'string' 
          ? phrase.translations.lebanese 
          : phrase.translations.lebanese.phrase;
        phraseData.lebanese_latin = typeof phrase.translations.lebanese === 'string'
          ? ''
          : phrase.translations.lebanese.latin;
      }
      if (phrase.translations.syrian) {
        phraseData.syrian_arabic = typeof phrase.translations.syrian === 'string' 
          ? phrase.translations.syrian 
          : phrase.translations.syrian.phrase;
        phraseData.syrian_latin = typeof phrase.translations.syrian === 'string'
          ? ''
          : phrase.translations.syrian.latin;
      }
      if (phrase.translations.emirati) {
        phraseData.emirati_arabic = typeof phrase.translations.emirati === 'string' 
          ? phrase.translations.emirati 
          : phrase.translations.emirati.phrase;
        phraseData.emirati_latin = typeof phrase.translations.emirati === 'string'
          ? ''
          : phrase.translations.emirati.latin;
      }
      if (phrase.translations.saudi) {
        phraseData.saudi_arabic = typeof phrase.translations.saudi === 'string' 
          ? phrase.translations.saudi 
          : phrase.translations.saudi.phrase;
        phraseData.saudi_latin = typeof phrase.translations.saudi === 'string'
          ? ''
          : phrase.translations.saudi.latin;
      }
      if (phrase.translations.formal_msa || phrase.translations.msa) {
        const msa = phrase.translations.formal_msa || phrase.translations.msa;
        phraseData.formal_msa_arabic = typeof msa === 'string' 
          ? msa 
          : msa.phrase;
        phraseData.formal_msa_latin = typeof msa === 'string'
          ? ''
          : msa.latin;
      }
    }
    
    allPhrases.push(phraseData);
  });
  
  // Process sentences/daily conversations
  sentencesData.sentences.forEach((sent: any) => {
    const phraseData: PhraseData = {
      id: sent.id,
      darija: sent.darija,
      darija_latin: sent.darija_latin || sent.transliteration || '',
      literal_english: sent.english || sent.literal_english || '',
      english: sent.english || '',
      category: sent.context || 'daily_conversations',
      difficulty: sent.difficulty || 'beginner',
      tags: [sent.context || 'conversation'],
      formality: 'neutral',
      frequency: 'high',
      context: [sent.context || 'daily'],
      cultural_notes: ''
    };
    
    // Add translations if they exist - sentences have them as plain strings
    if (sent.translations) {
      if (sent.translations.lebanese) {
        phraseData.lebanese_arabic = sent.translations.lebanese;
      }
      if (sent.translations.syrian) {
        phraseData.syrian_arabic = sent.translations.syrian;
      }
      if (sent.translations.emirati) {
        phraseData.emirati_arabic = sent.translations.emirati;
      }
      if (sent.translations.saudi) {
        phraseData.saudi_arabic = sent.translations.saudi;
      }
      if (sent.translations.msa) {
        phraseData.formal_msa_arabic = sent.translations.msa;
      }
    }
    
    allPhrases.push(phraseData);
  });
  
  console.log(`Total phrases to insert: ${allPhrases.length}`);
  
  // Insert phrases in batches
  const batchSize = 100;
  let inserted = 0;
  let errors = 0;
  
  for (let i = 0; i < allPhrases.length; i += batchSize) {
    const batch = allPhrases.slice(i, i + batchSize);
    
    try {
      const { data, error } = await supabase
        .from('phrases')
        .upsert(batch, { onConflict: 'id' });
      
      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
        errors += batch.length;
      } else {
        inserted += batch.length;
        console.log(`Inserted batch ${i / batchSize + 1} (${inserted}/${allPhrases.length})`);
      }
    } catch (err) {
      console.error(`Failed to insert batch ${i / batchSize + 1}:`, err);
      errors += batch.length;
    }
  }
  
  console.log(`\nPopulation complete!`);
  console.log(`Successfully inserted: ${inserted} phrases`);
  console.log(`Errors: ${errors} phrases`);
  
  // Verify the count
  const { count } = await supabase
    .from('phrases')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Total phrases in database: ${count}`);
}

// Run the script
populatePhrases().catch(console.error);