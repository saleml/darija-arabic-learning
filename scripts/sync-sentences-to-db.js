#!/usr/bin/env node

// Script to sync sentences from JSON to Supabase phrases table

const { createClient } = require('@supabase/supabase-js');
const sentences = require('../database/sentences_daily_conversations.json');

// Get Supabase credentials from environment or hardcode temporarily
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xnkokmaccibpwxenxynh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY_HERE';

if (!supabaseUrl || !supabaseKey || supabaseKey === 'YOUR_ANON_KEY_HERE') {
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
  console.error('Or update the script with your Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncSentences() {
  console.log('Starting sentence sync...');
  console.log(`Found ${sentences.sentences.length} sentences to sync`);

  // Transform sentences to match phrases table structure
  const phrasesToInsert = sentences.sentences.map(sent => ({
    id: sent.id,
    darija: sent.darija,
    darija_latin: sent.darija_latin || sent.transliteration || '',
    literal_english: sent.english || sent.literal_english || '',
    english: sent.english || '',
    category: 'daily_essentials',
    difficulty: sent.difficulty || 'beginner',
    tags: [sent.context || 'conversation'],
    formality: 'neutral',
    frequency: 'high',
    context: [sent.context || 'daily'],
    cultural_notes: '',
    
    // Handle translations - check if string or object
    lebanese_arabic: typeof sent.translations?.lebanese === 'string' 
      ? sent.translations.lebanese 
      : sent.translations?.lebanese?.phrase || null,
    lebanese_latin: typeof sent.translations?.lebanese === 'object'
      ? sent.translations.lebanese.latin || null
      : null,
      
    syrian_arabic: typeof sent.translations?.syrian === 'string'
      ? sent.translations.syrian
      : sent.translations?.syrian?.phrase || null,
    syrian_latin: typeof sent.translations?.syrian === 'object'
      ? sent.translations.syrian.latin || null
      : null,
      
    emirati_arabic: typeof sent.translations?.emirati === 'string'
      ? sent.translations.emirati
      : sent.translations?.emirati?.phrase || null,
    emirati_latin: typeof sent.translations?.emirati === 'object'
      ? sent.translations.emirati.latin || null
      : null,
      
    saudi_arabic: typeof sent.translations?.saudi === 'string'
      ? sent.translations.saudi
      : sent.translations?.saudi?.phrase || null,
    saudi_latin: typeof sent.translations?.saudi === 'object'
      ? sent.translations.saudi.latin || null
      : null,
      
    formal_msa_arabic: typeof sent.translations?.msa === 'string'
      ? sent.translations.msa
      : sent.translations?.msa?.phrase || null,
    formal_msa_latin: typeof sent.translations?.msa === 'object'
      ? sent.translations.msa.latin || null
      : null
  }));

  // Check which sentences already exist
  const { data: existingPhrases, error: fetchError } = await supabase
    .from('phrases')
    .select('id')
    .in('id', phrasesToInsert.map(p => p.id));

  if (fetchError) {
    console.error('Error fetching existing phrases:', fetchError);
    return;
  }

  const existingIds = new Set(existingPhrases?.map(p => p.id) || []);
  const newPhrases = phrasesToInsert.filter(p => !existingIds.has(p.id));
  const phrasesToUpdate = phrasesToInsert.filter(p => existingIds.has(p.id));

  console.log(`Found ${existingIds.size} existing sentences`);
  console.log(`Will insert ${newPhrases.length} new sentences`);
  console.log(`Will update ${phrasesToUpdate.length} existing sentences`);

  // Insert new sentences
  if (newPhrases.length > 0) {
    // Insert in batches of 50 to avoid timeouts
    const batchSize = 50;
    for (let i = 0; i < newPhrases.length; i += batchSize) {
      const batch = newPhrases.slice(i, i + batchSize);
      const { error } = await supabase
        .from('phrases')
        .insert(batch);
      
      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
      } else {
        console.log(`✓ Inserted batch ${i / batchSize + 1} (${batch.length} sentences)`);
      }
    }
  }

  // Update existing sentences if needed
  if (phrasesToUpdate.length > 0) {
    console.log('Updating existing sentences...');
    for (const phrase of phrasesToUpdate) {
      const { error } = await supabase
        .from('phrases')
        .update(phrase)
        .eq('id', phrase.id);
      
      if (error) {
        console.error(`Error updating ${phrase.id}:`, error);
      }
    }
    console.log('✓ Updated existing sentences');
  }

  // Verify final count
  const { count } = await supabase
    .from('phrases')
    .select('*', { count: 'exact', head: true });

  console.log(`\n✅ Sync complete! Total phrases in database: ${count}`);
  console.log('Expected total: 552 (452 phrases + 100 sentences)');
}

syncSentences().catch(console.error);