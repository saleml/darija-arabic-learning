const { createClient } = require('@supabase/supabase-js');
const sentences = require('../database/sentences_daily_conversations.json');
const fs = require('fs');

// Read environment variables
const envContent = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL || 'https://xnkokmaccibpwxenxynh.supabase.co';
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertMissingSentences() {
  console.log('Connecting to Supabase...');
  
  // Get sentences 301-400
  const missingSentences = sentences.sentences.filter(s => {
    const num = parseInt(s.id.replace('sent_', ''));
    return num > 300 && num <= 400;
  });
  
  console.log('Found', missingSentences.length, 'missing sentences to insert');
  
  // Transform to match database structure
  const phrasesToInsert = missingSentences.map(sent => {
    // Handle mixed translation types
    const lebanese = sent.translations?.lebanese;
    const lebaneseArabic = typeof lebanese === 'string' ? lebanese : lebanese?.phrase || null;
    const lebaneseLatin = typeof lebanese === 'object' ? lebanese?.latin || null : null;
    
    const syrian = sent.translations?.syrian;
    const syrianArabic = typeof syrian === 'string' ? syrian : syrian?.phrase || null;
    const syrianLatin = typeof syrian === 'object' ? syrian?.latin || null : null;
    
    const emirati = sent.translations?.emirati;
    const emiratiArabic = typeof emirati === 'string' ? emirati : emirati?.phrase || null;
    const emiratiLatin = typeof emirati === 'object' ? emirati?.latin || null : null;
    
    const saudi = sent.translations?.saudi;
    const saudiArabic = typeof saudi === 'string' ? saudi : saudi?.phrase || null;
    const saudiLatin = typeof saudi === 'object' ? saudi?.latin || null : null;
    
    const msa = sent.translations?.msa;
    const msaArabic = typeof msa === 'string' ? msa : msa?.phrase || null;
    const msaLatin = typeof msa === 'object' ? msa?.latin || null : null;
    
    return {
      id: sent.id,
      darija: sent.darija,
      darija_latin: sent.darija_latin || sent.transliteration || null,
      literal_english: sent.english || sent.literal_english || null,
      english: sent.english || null,
      category: 'daily_essentials',
      difficulty: sent.difficulty || 'beginner',
      tags: [sent.context || 'conversation'],
      formality: 'neutral',
      frequency: 'high',
      context: [sent.context || 'daily'],
      cultural_notes: '',
      lebanese_arabic: lebaneseArabic,
      lebanese_latin: lebaneseLatin,
      syrian_arabic: syrianArabic,
      syrian_latin: syrianLatin,
      emirati_arabic: emiratiArabic,
      emirati_latin: emiratiLatin,
      saudi_arabic: saudiArabic,
      saudi_latin: saudiLatin,
      formal_msa_arabic: msaArabic,
      formal_msa_latin: msaLatin
    };
  });
  
  // Insert in batches of 20
  const batchSize = 20;
  let inserted = 0;
  
  for (let i = 0; i < phrasesToInsert.length; i += batchSize) {
    const batch = phrasesToInsert.slice(i, i + batchSize);
    
    console.log(`Inserting batch ${Math.floor(i/batchSize) + 1}...`);
    
    const { data, error } = await supabase
      .from('phrases')
      .insert(batch);
    
    if (error) {
      console.error('Error inserting batch:', error);
      console.error('Failed on IDs:', batch.map(b => b.id));
    } else {
      inserted += batch.length;
      console.log(`✓ Inserted ${batch.length} sentences (total: ${inserted})`);
    }
  }
  
  // Verify final count
  const { count } = await supabase
    .from('phrases')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n✅ Complete! Total phrases in database: ${count}`);
  console.log('Expected: 552 (152 beginner + 100 intermediate + 100 advanced + 300 old sentences + 100 new sentences)');
}

insertMissingSentences().catch(console.error);