import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Common translations based on patterns
const commonGreetings: Record<string, Record<string, string>> = {
  'السلام عليكم': {
    lebanese_arabic: 'مرحبا',
    syrian_arabic: 'مرحبا',
    emirati_arabic: 'السلام عليكم',
    saudi_arabic: 'السلام عليكم',
    formal_msa_arabic: 'السلام عليكم'
  },
  'صباح الخير': {
    lebanese_arabic: 'صباح الخير',
    syrian_arabic: 'صباح الخير',
    emirati_arabic: 'صباح الخير',
    saudi_arabic: 'صباح الخير',
    formal_msa_arabic: 'صباح الخير'
  },
  'مساء الخير': {
    lebanese_arabic: 'مسا الخير',
    syrian_arabic: 'مسا الخير',
    emirati_arabic: 'مساء الخير',
    saudi_arabic: 'مساء الخير',
    formal_msa_arabic: 'مساء الخير'
  }
};

// Word replacements for dialect variations
const dialectReplacements = {
  lebanese: {
    'واش': 'شو',
    'كيفاش': 'كيف',
    'منين': 'من وين',
    'فين': 'وين',
    'شحال': 'قديش',
    'بزاف': 'كتير',
    'دابا': 'هلق',
    'نقدر': 'فيني',
    'بغيت': 'بدي',
    'عندي': 'عندي',
    'معايا': 'معي',
    'ديال': 'تبع',
    'هاد': 'هيدا',
    'هادي': 'هيدي',
    'شنو': 'شو',
    'علاش': 'ليش'
  },
  syrian: {
    'واش': 'شو',
    'كيفاش': 'كيف',
    'منين': 'من وين',
    'فين': 'وين',
    'شحال': 'قديش',
    'بزاف': 'كتير',
    'دابا': 'هلأ',
    'نقدر': 'بقدر',
    'بغيت': 'بدي',
    'عندي': 'عندي',
    'معايا': 'معي',
    'ديال': 'تبع',
    'هاد': 'هادا',
    'هادي': 'هاي',
    'شنو': 'شو',
    'علاش': 'ليش'
  },
  emirati: {
    'واش': 'شو',
    'كيفاش': 'كيف',
    'منين': 'من وين',
    'فين': 'وين',
    'شحال': 'كم',
    'بزاف': 'وايد',
    'دابا': 'الحين',
    'نقدر': 'أقدر',
    'بغيت': 'أبغي',
    'عندي': 'عندي',
    'معايا': 'وياي',
    'ديال': 'مال',
    'هاد': 'هذا',
    'هادي': 'هذي',
    'شنو': 'شو',
    'علاش': 'ليش'
  },
  saudi: {
    'واش': 'ايش',
    'كيفاش': 'كيف',
    'منين': 'من وين',
    'فين': 'وين',
    'شحال': 'كم',
    'بزاف': 'كثير',
    'دابا': 'الحين',
    'نقدر': 'أقدر',
    'بغيت': 'أبغى',
    'عندي': 'عندي',
    'معايا': 'معي',
    'ديال': 'حق',
    'هاد': 'هذا',
    'هادي': 'هذي',
    'شنو': 'ايش',
    'علاش': 'ليش'
  },
  msa: {
    'واش': 'هل',
    'كيفاش': 'كيف',
    'منين': 'من أين',
    'فين': 'أين',
    'شحال': 'كم',
    'بزاف': 'كثير',
    'دابا': 'الآن',
    'نقدر': 'أستطيع',
    'بغيت': 'أريد',
    'عندي': 'لدي',
    'معايا': 'معي',
    'ديال': 'الخاص بـ',
    'هاد': 'هذا',
    'هادي': 'هذه',
    'شنو': 'ما',
    'علاش': 'لماذا'
  }
};

function generateTranslation(darija: string, dialect: keyof typeof dialectReplacements): string {
  let translation = darija;
  const replacements = dialectReplacements[dialect];
  
  // Apply word replacements
  for (const [darijaWord, dialectWord] of Object.entries(replacements)) {
    // Use word boundaries to avoid partial replacements
    const regex = new RegExp(`\\b${darijaWord}\\b`, 'g');
    translation = translation.replace(regex, dialectWord);
  }
  
  return translation;
}

async function generateMissingTranslations() {
  console.log('Fetching phrases with missing translations...');
  
  // Get all phrases
  const { data: phrases, error } = await supabase
    .from('phrases')
    .select('*');
  
  if (error) {
    console.error('Error fetching phrases:', error);
    return;
  }
  
  if (!phrases) {
    console.log('No phrases found');
    return;
  }
  
  console.log(`Found ${phrases.length} total phrases`);
  
  let updated = 0;
  
  for (const phrase of phrases) {
    const updates: any = {};
    
    // Check if it's a common greeting
    if (commonGreetings[phrase.darija]) {
      const translations = commonGreetings[phrase.darija];
      if (!phrase.lebanese_arabic) updates.lebanese_arabic = translations.lebanese_arabic;
      if (!phrase.syrian_arabic) updates.syrian_arabic = translations.syrian_arabic;
      if (!phrase.emirati_arabic) updates.emirati_arabic = translations.emirati_arabic;
      if (!phrase.saudi_arabic) updates.saudi_arabic = translations.saudi_arabic;
      if (!phrase.formal_msa_arabic) updates.formal_msa_arabic = translations.formal_msa_arabic;
    } else {
      // Generate translations based on patterns
      if (!phrase.lebanese_arabic) {
        updates.lebanese_arabic = generateTranslation(phrase.darija, 'lebanese');
      }
      if (!phrase.syrian_arabic) {
        updates.syrian_arabic = generateTranslation(phrase.darija, 'syrian');
      }
      if (!phrase.emirati_arabic) {
        updates.emirati_arabic = generateTranslation(phrase.darija, 'emirati');
      }
      if (!phrase.saudi_arabic) {
        updates.saudi_arabic = generateTranslation(phrase.darija, 'saudi');
      }
      if (!phrase.formal_msa_arabic) {
        updates.formal_msa_arabic = generateTranslation(phrase.darija, 'msa');
      }
    }
    
    // Only update if there are missing translations
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('phrases')
        .update(updates)
        .eq('id', phrase.id);
      
      if (updateError) {
        console.error(`Error updating phrase ${phrase.id}:`, updateError);
      } else {
        updated++;
        console.log(`Updated ${phrase.id} with ${Object.keys(updates).length} translations`);
      }
    }
  }
  
  console.log(`\nComplete! Updated ${updated} phrases with missing translations`);
  
  // Verify the updates
  const { data: updatedPhrases } = await supabase
    .from('phrases')
    .select('id, lebanese_arabic, syrian_arabic, emirati_arabic, saudi_arabic, formal_msa_arabic')
    .limit(5);
  
  console.log('\nSample of updated phrases:');
  console.log(updatedPhrases);
}

// Additional common phrases and their translations
const additionalTranslations: Record<string, Record<string, string>> = {
  'شكرا': {
    lebanese_arabic: 'شكرا',
    syrian_arabic: 'شكرا',
    emirati_arabic: 'شكرا',
    saudi_arabic: 'شكرا',
    formal_msa_arabic: 'شكراً'
  },
  'عفاك': {
    lebanese_arabic: 'من فضلك',
    syrian_arabic: 'لو سمحت',
    emirati_arabic: 'لو سمحت',
    saudi_arabic: 'لو سمحت',
    formal_msa_arabic: 'من فضلك'
  },
  'سمح ليا': {
    lebanese_arabic: 'عفواً',
    syrian_arabic: 'عفواً',
    emirati_arabic: 'سامحني',
    saudi_arabic: 'سامحني',
    formal_msa_arabic: 'عذراً'
  },
  'بسلامة': {
    lebanese_arabic: 'مع السلامة',
    syrian_arabic: 'مع السلامة',
    emirati_arabic: 'في أمان الله',
    saudi_arabic: 'مع السلامة',
    formal_msa_arabic: 'وداعاً'
  },
  'مبروك': {
    lebanese_arabic: 'مبروك',
    syrian_arabic: 'مبروك',
    emirati_arabic: 'مبروك',
    saudi_arabic: 'مبارك',
    formal_msa_arabic: 'تهانينا'
  }
};

// Merge additional translations
Object.assign(commonGreetings, additionalTranslations);

// Run the script
generateMissingTranslations().catch(console.error);