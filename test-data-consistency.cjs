#!/usr/bin/env node

const beginner = require('./database/beginner_phrases.json');
const intermediate = require('./database/intermediate_phrases.json');
const advanced = require('./database/advanced_phrases.json');
const sentences = require('./database/sentences_daily_conversations.json');

console.log('=== DATA CONSISTENCY CHECK ===\n');

// Check for duplicate IDs
const allIds = [
  ...beginner.phrases.map(p => p.id),
  ...intermediate.phrases.map(p => p.id),
  ...advanced.phrases.map(p => p.id),
  ...sentences.sentences.map(s => s.id)
];

const idCounts = {};
allIds.forEach(id => {
  idCounts[id] = (idCounts[id] || 0) + 1;
});

const duplicates = Object.entries(idCounts).filter(([id, count]) => count > 1);
console.log(`✓ ID Check: ${duplicates.length === 0 ? 'PASSED' : 'FAILED'}`);
if (duplicates.length > 0) {
  console.log(`  Found ${duplicates.length} duplicate IDs`);
  console.log(`  First 5:`, duplicates.slice(0, 5));
}

// Check translation consistency
console.log('\n=== TRANSLATION STRUCTURE ===\n');

function checkTranslations(items, source) {
  let stringCount = 0;
  let objectCount = 0;
  let mixedItems = [];

  items.forEach(item => {
    if (item.translations) {
      const types = new Set();
      ['lebanese', 'syrian', 'emirati', 'saudi', 'egyptian'].forEach(dialect => {
        if (item.translations[dialect]) {
          types.add(typeof item.translations[dialect]);
        }
      });
      
      if (types.size > 1) {
        mixedItems.push(item.id);
      }
      
      if (item.translations.lebanese) {
        if (typeof item.translations.lebanese === 'string') stringCount++;
        else if (typeof item.translations.lebanese === 'object') objectCount++;
      }
    }
  });

  console.log(`${source}:`);
  console.log(`  String translations: ${stringCount}`);
  console.log(`  Object translations: ${objectCount}`);
  if (mixedItems.length > 0) {
    console.log(`  ⚠️ Items with mixed types: ${mixedItems.length}`);
    console.log(`    First 3:`, mixedItems.slice(0, 3));
  }
}

checkTranslations(beginner.phrases, 'Beginner Phrases');
checkTranslations(intermediate.phrases, 'Intermediate Phrases');
checkTranslations(advanced.phrases, 'Advanced Phrases');
checkTranslations(sentences.sentences, 'Sentences');

// Check for objects in places expecting strings
console.log('\n=== FIELD TYPE VALIDATION ===\n');

function validateFields(items, source) {
  let issues = [];
  
  items.forEach(item => {
    // Check main fields
    if (typeof item.darija !== 'string') {
      issues.push(`${item.id}: darija is not string (${typeof item.darija})`);
    }
    if (item.darija_latin && typeof item.darija_latin !== 'string') {
      issues.push(`${item.id}: darija_latin is not string (${typeof item.darija_latin})`);
    }
    if (item.literal_english && typeof item.literal_english !== 'string') {
      issues.push(`${item.id}: literal_english is not string (${typeof item.literal_english})`);
    }
  });
  
  console.log(`${source}: ${issues.length === 0 ? '✓ PASSED' : '✗ FAILED'}`);
  if (issues.length > 0) {
    console.log(`  First 3 issues:`, issues.slice(0, 3));
  }
}

validateFields([...beginner.phrases, ...intermediate.phrases, ...advanced.phrases], 'Phrases');
validateFields(sentences.sentences, 'Sentences');

// Test transformation logic (simulating DashboardPage)
console.log('\n=== TRANSFORMATION TEST ===\n');

function transformSentence(sent) {
  return {
    id: sent.id,
    darija: sent.darija,
    darija_latin: sent.darija_latin || sent.transliteration || '',
    translations: {
      lebanese: sent.translations?.lebanese ? 
        (typeof sent.translations.lebanese === 'string' 
          ? { phrase: sent.translations.lebanese, latin: '', audio: null }
          : sent.translations.lebanese) 
        : undefined,
    }
  };
}

// Test transformation on mixed types
const testSentences = sentences.sentences.slice(0, 5);
testSentences.forEach(sent => {
  const transformed = transformSentence(sent);
  const lebanese = transformed.translations.lebanese;
  
  if (lebanese && typeof lebanese.phrase !== 'string' && lebanese.phrase !== undefined) {
    console.log(`✗ Transformation issue for ${sent.id}:`);
    console.log(`  Original:`, sent.translations?.lebanese);
    console.log(`  Transformed:`, lebanese);
  }
});

console.log('✓ Transformation test complete');

console.log('\n=== SUMMARY ===\n');
console.log(`Total items: ${allIds.length}`);
console.log(`Unique IDs: ${new Set(allIds).size}`);
console.log(`Duplicates: ${duplicates.length}`);
console.log('\nIf all checks pass, the app should work in production.');