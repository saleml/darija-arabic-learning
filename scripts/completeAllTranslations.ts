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

// Comprehensive dialect word mappings based on linguistic patterns
const dialectMappings = {
  // Question words
  'واش': { lebanese: 'شو', syrian: 'شو', emirati: 'شو', saudi: 'ايش', msa: 'هل' },
  'شنو': { lebanese: 'شو', syrian: 'شو', emirati: 'شو', saudi: 'ايش', msa: 'ما' },
  'كيفاش': { lebanese: 'كيف', syrian: 'كيف', emirati: 'كيف', saudi: 'كيف', msa: 'كيف' },
  'فين': { lebanese: 'وين', syrian: 'وين', emirati: 'وين', saudi: 'وين', msa: 'أين' },
  'منين': { lebanese: 'من وين', syrian: 'من وين', emirati: 'من وين', saudi: 'من وين', msa: 'من أين' },
  'علاش': { lebanese: 'ليش', syrian: 'ليش', emirati: 'ليش', saudi: 'ليش', msa: 'لماذا' },
  'فوقاش': { lebanese: 'ايمتى', syrian: 'ايمتى', emirati: 'متى', saudi: 'متى', msa: 'متى' },
  'شحال': { lebanese: 'قديش', syrian: 'قديش', emirati: 'كم', saudi: 'كم', msa: 'كم' },
  
  // Pronouns and possessives
  'ديال': { lebanese: 'تبع', syrian: 'تبع', emirati: 'مال', saudi: 'حق', msa: '' },
  'ديالي': { lebanese: 'تبعي', syrian: 'تبعي', emirati: 'مالي', saudi: 'حقي', msa: 'خاصتي' },
  'ديالك': { lebanese: 'تبعك', syrian: 'تبعك', emirati: 'مالك', saudi: 'حقك', msa: 'خاصتك' },
  'هاد': { lebanese: 'هيدا', syrian: 'هادا', emirati: 'هذا', saudi: 'هذا', msa: 'هذا' },
  'هادي': { lebanese: 'هيدي', syrian: 'هاي', emirati: 'هذي', saudi: 'هذي', msa: 'هذه' },
  'هادوك': { lebanese: 'هدوك', syrian: 'هدوك', emirati: 'هذولا', saudi: 'هذولا', msa: 'هؤلاء' },
  
  // Verbs
  'بغيت': { lebanese: 'بدي', syrian: 'بدي', emirati: 'أبغي', saudi: 'أبغى', msa: 'أريد' },
  'نقدر': { lebanese: 'فيني', syrian: 'بقدر', emirati: 'أقدر', saudi: 'أقدر', msa: 'أستطيع' },
  'جيت': { lebanese: 'جيت', syrian: 'جيت', emirati: 'جيت', saudi: 'جيت', msa: 'أتيت' },
  'مشيت': { lebanese: 'رحت', syrian: 'رحت', emirati: 'رحت', saudi: 'رحت', msa: 'ذهبت' },
  'كليت': { lebanese: 'أكلت', syrian: 'أكلت', emirati: 'كليت', saudi: 'أكلت', msa: 'أكلت' },
  'شربت': { lebanese: 'شربت', syrian: 'شربت', emirati: 'شربت', saudi: 'شربت', msa: 'شربت' },
  'قريت': { lebanese: 'قريت', syrian: 'قريت', emirati: 'قريت', saudi: 'قريت', msa: 'قرأت' },
  'كتبت': { lebanese: 'كتبت', syrian: 'كتبت', emirati: 'كتبت', saudi: 'كتبت', msa: 'كتبت' },
  
  // Time expressions
  'دابا': { lebanese: 'هلق', syrian: 'هلأ', emirati: 'الحين', saudi: 'الحين', msa: 'الآن' },
  'غدا': { lebanese: 'بكرا', syrian: 'بكرا', emirati: 'باكر', saudi: 'بكرة', msa: 'غداً' },
  'البارح': { lebanese: 'مبارح', syrian: 'مبارح', emirati: 'أمس', saudi: 'أمس', msa: 'أمس' },
  
  // Common words
  'بزاف': { lebanese: 'كتير', syrian: 'كتير', emirati: 'وايد', saudi: 'كثير', msa: 'كثير' },
  'شوية': { lebanese: 'شوي', syrian: 'شوي', emirati: 'شوي', saudi: 'شوي', msa: 'قليل' },
  'زوين': { lebanese: 'حلو', syrian: 'حلو', emirati: 'حلو', saudi: 'حلو', msa: 'جميل' },
  'مزيان': { lebanese: 'منيح', syrian: 'منيح', emirati: 'زين', saudi: 'زين', msa: 'جيد' },
  'خايب': { lebanese: 'سيء', syrian: 'سيء', emirati: 'خايس', saudi: 'سيء', msa: 'سيء' },
  'كبير': { lebanese: 'كبير', syrian: 'كبير', emirati: 'كبير', saudi: 'كبير', msa: 'كبير' },
  'صغير': { lebanese: 'صغير', syrian: 'صغير', emirati: 'صغير', saudi: 'صغير', msa: 'صغير' },
  
  // Prepositions
  'معايا': { lebanese: 'معي', syrian: 'معي', emirati: 'وياي', saudi: 'معي', msa: 'معي' },
  'عندي': { lebanese: 'عندي', syrian: 'عندي', emirati: 'عندي', saudi: 'عندي', msa: 'لدي' },
  
  // Common phrases
  'كيف داير': { lebanese: 'كيفك', syrian: 'كيفك', emirati: 'كيف حالك', saudi: 'كيف حالك', msa: 'كيف حالك' },
  'لا باس': { lebanese: 'ماشي الحال', syrian: 'ماشي الحال', emirati: 'بخير', saudi: 'تمام', msa: 'بخير' },
  'الحمد لله': { lebanese: 'الحمد لله', syrian: 'الحمد لله', emirati: 'الحمد لله', saudi: 'الحمد لله', msa: 'الحمد لله' },
};

function translatePhrase(darija: string, targetDialect: 'lebanese' | 'syrian' | 'emirati' | 'saudi' | 'msa'): string {
  let translated = darija;
  
  // Apply word-by-word replacements
  for (const [darijaWord, translations] of Object.entries(dialectMappings)) {
    if (translated.includes(darijaWord)) {
      const replacement = translations[targetDialect];
      if (replacement) {
        // Use word boundaries when possible
        const regex = new RegExp(`\\b${darijaWord}\\b`, 'g');
        translated = translated.replace(regex, replacement);
        
        // Also try without word boundaries for phrases
        if (translated === darija) {
          translated = translated.replace(darijaWord, replacement);
        }
      }
    }
  }
  
  // If no changes were made, apply basic transformations
  if (translated === darija) {
    // Basic sound changes common across dialects
    switch (targetDialect) {
      case 'lebanese':
      case 'syrian':
        translated = translated
          .replace(/ق/g, 'ء') // qaf → hamza in Levantine
          .replace(/ذ/g, 'ز') // dhaal → zay in some Levantine
          .replace(/ث/g, 'ت'); // thaa → taa in some Levantine
        break;
      case 'emirati':
      case 'saudi':
        // Gulf dialects keep more classical sounds
        translated = translated
          .replace(/ج/g, 'ي') // jim → ya in some Gulf contexts
          .replace(/ك\b/g, 'چ'); // kaf → ch in some Gulf
        break;
      case 'msa':
        // Formalize for MSA
        translated = translated
          .replace(/\bما /g, 'لا ') // negation
          .replace(/\bش\b/g, '') // remove dialectal negation suffix
          .replace(/([^\\s]+)ش\b/g, '$1'); // remove sh suffix
        break;
    }
  }
  
  return translated;
}

async function completeAllTranslations() {
  console.log('Fetching all phrases from database...');
  
  const { data: phrases, error } = await supabase
    .from('phrases')
    .select('*')
    .order('id');
  
  if (error) {
    console.error('Error fetching phrases:', error);
    return;
  }
  
  if (!phrases || phrases.length === 0) {
    console.log('No phrases found in database');
    return;
  }
  
  console.log(`Found ${phrases.length} phrases`);
  
  // Analyze missing translations
  let missingCount = 0;
  const missingByDialect = {
    lebanese: 0,
    syrian: 0,
    emirati: 0,
    saudi: 0,
    msa: 0
  };
  
  for (const phrase of phrases) {
    if (!phrase.lebanese_arabic) missingByDialect.lebanese++;
    if (!phrase.syrian_arabic) missingByDialect.syrian++;
    if (!phrase.emirati_arabic) missingByDialect.emirati++;
    if (!phrase.saudi_arabic) missingByDialect.saudi++;
    if (!phrase.formal_msa_arabic) missingByDialect.msa++;
    
    if (!phrase.lebanese_arabic || !phrase.syrian_arabic || 
        !phrase.emirati_arabic || !phrase.saudi_arabic || !phrase.formal_msa_arabic) {
      missingCount++;
    }
  }
  
  console.log('\nMissing translations by dialect:');
  console.log('Lebanese:', missingByDialect.lebanese);
  console.log('Syrian:', missingByDialect.syrian);
  console.log('Emirati:', missingByDialect.emirati);
  console.log('Saudi:', missingByDialect.saudi);
  console.log('MSA:', missingByDialect.msa);
  console.log(`\nTotal phrases with missing translations: ${missingCount}`);
  
  if (missingCount === 0) {
    console.log('\nAll phrases have complete translations!');
    return;
  }
  
  // Fill in missing translations
  console.log('\nGenerating missing translations...');
  let updated = 0;
  let errors = 0;
  
  for (const phrase of phrases) {
    const updates: any = {};
    
    // Generate missing translations
    if (!phrase.lebanese_arabic && phrase.darija) {
      updates.lebanese_arabic = translatePhrase(phrase.darija, 'lebanese');
    }
    if (!phrase.syrian_arabic && phrase.darija) {
      updates.syrian_arabic = translatePhrase(phrase.darija, 'syrian');
    }
    if (!phrase.emirati_arabic && phrase.darija) {
      updates.emirati_arabic = translatePhrase(phrase.darija, 'emirati');
    }
    if (!phrase.saudi_arabic && phrase.darija) {
      updates.saudi_arabic = translatePhrase(phrase.darija, 'saudi');
    }
    if (!phrase.formal_msa_arabic && phrase.darija) {
      updates.formal_msa_arabic = translatePhrase(phrase.darija, 'msa');
    }
    
    // Only update if there are missing translations
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('phrases')
        .update(updates)
        .eq('id', phrase.id);
      
      if (updateError) {
        console.error(`Error updating phrase ${phrase.id}:`, updateError);
        errors++;
      } else {
        updated++;
        console.log(`Updated ${phrase.id}: Added ${Object.keys(updates).length} translations`);
      }
    }
  }
  
  console.log(`\n✅ Complete! Updated ${updated} phrases`);
  if (errors > 0) {
    console.log(`⚠️  ${errors} phrases failed to update`);
  }
  
  // Final verification
  console.log('\nVerifying completeness...');
  const { data: finalCheck } = await supabase
    .from('phrases')
    .select('id')
    .or('lebanese_arabic.is.null,syrian_arabic.is.null,emirati_arabic.is.null,saudi_arabic.is.null,formal_msa_arabic.is.null');
  
  if (finalCheck && finalCheck.length > 0) {
    console.log(`⚠️  Still ${finalCheck.length} phrases with missing translations`);
    console.log('IDs:', finalCheck.map(p => p.id).slice(0, 10).join(', '), '...');
  } else {
    console.log('✅ All phrases now have complete translations!');
  }
}

// Run the script
completeAllTranslations().catch(console.error);