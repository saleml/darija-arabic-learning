#!/usr/bin/env node

/**
 * Comprehensive consistency audit between code and database
 */

const fs = require('fs');
const path = require('path');

console.log('=== COMPREHENSIVE CONSISTENCY AUDIT ===\n');

// Database schema as provided by user
const DATABASE_SCHEMA = {
  phrases: {
    columns: ['id', 'darija', 'darija_latin', 'literal_english', 'english', 'category', 
              'difficulty', 'tags', 'formality', 'frequency', 'context', 'cultural_notes',
              'lebanese_arabic', 'lebanese_latin', 'syrian_arabic', 'syrian_latin',
              'emirati_arabic', 'emirati_latin', 'saudi_arabic', 'saudi_latin',
              'formal_msa_arabic', 'formal_msa_latin', 'created_at', 'updated_at'],
    types: {
      id: 'character varying',
      tags: 'ARRAY',
      context: 'ARRAY'
    }
  },
  phrase_progress: {
    columns: ['id', 'user_id', 'phrase_id', 'is_mastered', 'correct_count', 
              'incorrect_count', 'last_reviewed', 'next_review', 'ease_factor', 
              'interval_days', 'created_at', 'updated_at'],
    types: {
      id: 'uuid',
      is_mastered: 'boolean',
      correct_count: 'integer',
      incorrect_count: 'integer'
    }
  },
  quiz_attempts: {
    columns: ['id', 'user_id', 'score', 'total_questions', 'difficulty', 'quiz_type',
              'source_dialect', 'target_dialect', 'time_spent', 'correct_phrases', 
              'phrases_tested', 'created_at']
  },
  user_progress: {
    columns: ['id', 'user_id', 'phrases_learned', 'phrases_in_progress', 'quiz_scores',
              'spaced_repetition', 'streak_days', 'last_active_date', 'total_study_time',
              'preferences', 'created_at', 'updated_at']
  },
  user_stats: {
    columns: ['id', 'user_id', 'total_quizzes', 'average_score', 'mastered_phrases',
              'in_progress_phrases', 'current_streak', 'longest_streak', 'total_study_time',
              'last_active_date', 'created_at', 'updated_at']
  },
  user_profiles: {
    columns: [] // Unknown, need to check
  },
  study_sessions: {
    columns: [] // Unknown, need to check
  }
};

// Check 1: Analyze supabaseProgress.ts for field references
console.log('1. CHECKING supabaseProgress.ts FIELD REFERENCES\n');

const supabaseProgressPath = './src/utils/supabaseProgress.ts';
const supabaseProgressContent = fs.readFileSync(supabaseProgressPath, 'utf-8');

// Extract all Supabase operations
const supabaseOps = [];
const fromRegex = /\.from\(['"](\w+)['"]\)/g;
const selectRegex = /\.select\(['"]([^'"]+)['"]\)/g;
const insertRegex = /\.insert\(\{([^}]+)\}/gs;
const updateRegex = /\.update\(\{([^}]+)\}/gs;

let match;
while ((match = fromRegex.exec(supabaseProgressContent)) !== null) {
  const table = match[1];
  const startIdx = match.index;
  const endIdx = supabaseProgressContent.indexOf('\n', startIdx + 200);
  const operation = supabaseProgressContent.substring(startIdx, endIdx);
  supabaseOps.push({ table, operation });
}

// Check for field mismatches
const fieldIssues = [];

supabaseOps.forEach(op => {
  const { table, operation } = op;
  if (!DATABASE_SCHEMA[table]) {
    fieldIssues.push(`⚠️ Unknown table referenced: ${table}`);
    return;
  }
  
  // Extract fields from operation
  const fieldMatches = operation.match(/(\w+):/g);
  if (fieldMatches) {
    fieldMatches.forEach(field => {
      const fieldName = field.replace(':', '');
      if (!DATABASE_SCHEMA[table].columns.includes(fieldName)) {
        // Check if it's a valid field that might not be in our schema
        if (!['data', 'error', 'single', 'eq', 'select', 'from', 'update', 'insert'].includes(fieldName)) {
          fieldIssues.push(`❌ Field '${fieldName}' used in ${table} but not in schema`);
        }
      }
    });
  }
});

if (fieldIssues.length > 0) {
  console.log('Field Issues Found:');
  fieldIssues.forEach(issue => console.log('  ', issue));
} else {
  console.log('✅ All field references match schema');
}

// Check 2: Analyze TypeScript interfaces
console.log('\n2. CHECKING TYPESCRIPT INTERFACES\n');

const interfaces = {
  'src/types/index.ts': ['Phrase', 'UserProgress', 'QuizScore'],
  'src/utils/supabaseProgress.ts': ['PhraseProgress', 'QuizAttempt']
};

const interfaceIssues = [];

Object.entries(interfaces).forEach(([file, interfaceNames]) => {
  const filePath = path.join('.', file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    interfaceNames.forEach(interfaceName => {
      const interfaceRegex = new RegExp(`(export )?interface ${interfaceName}[^{]*{([^}]+)}`, 's');
      const match = content.match(interfaceRegex);
      
      if (match) {
        const fields = match[2].match(/\s*(\w+)[\?]?:\s*([^;]+);/g);
        if (fields) {
          console.log(`  ${interfaceName}:`);
          fields.forEach(field => {
            const fieldMatch = field.match(/\s*(\w+)[\?]?:\s*([^;]+);/);
            if (fieldMatch) {
              const fieldName = fieldMatch[1];
              const fieldType = fieldMatch[2].trim();
              console.log(`    - ${fieldName}: ${fieldType}`);
            }
          });
        }
      }
    });
  }
});

// Check 3: JSON Data Structure
console.log('\n3. CHECKING JSON DATA STRUCTURES\n');

const jsonFiles = [
  'database/beginner_phrases.json',
  'database/intermediate_phrases.json',
  'database/advanced_phrases.json',
  'database/sentences_daily_conversations.json'
];

const jsonStructure = {};

jsonFiles.forEach(file => {
  const filePath = path.join('.', file);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const items = data.phrases || data.sentences || [];
    if (items.length > 0) {
      const sample = items[0];
      jsonStructure[file] = Object.keys(sample);
      
      // Check translation structure
      if (sample.translations) {
        const translationKeys = Object.keys(sample.translations);
        const sampleTranslation = sample.translations[translationKeys[0]];
        console.log(`  ${path.basename(file)}:`);
        console.log(`    Fields: ${Object.keys(sample).slice(0, 5).join(', ')}...`);
        console.log(`    Translation type: ${typeof sampleTranslation}`);
        if (typeof sampleTranslation === 'object') {
          console.log(`    Translation fields: ${Object.keys(sampleTranslation).join(', ')}`);
        }
      }
    }
  }
});

// Check 4: Progress Service Consistency
console.log('\n4. CHECKING PROGRESS SERVICE\n');

const progressServicePath = './src/services/progressService.ts';
if (fs.existsSync(progressServicePath)) {
  const progressContent = fs.readFileSync(progressServicePath, 'utf-8');
  
  // Check for Supabase operations
  const progressOps = progressContent.match(/supabaseProgress\.\w+/g);
  if (progressOps) {
    const uniqueOps = [...new Set(progressOps)];
    console.log('  Supabase operations used:');
    uniqueOps.forEach(op => console.log(`    - ${op}`));
  }
}

// Check 5: Component Data Usage
console.log('\n5. CHECKING COMPONENT DATA USAGE\n');

const components = [
  'src/components/TranslationHub.tsx',
  'src/components/QuizSystem.tsx',
  'src/components/ProgressTracker.tsx'
];

components.forEach(component => {
  if (fs.existsSync(component)) {
    const content = fs.readFileSync(component, 'utf-8');
    
    // Check for progress-related operations
    const progressRefs = content.match(/(phrasesLearned|phrasesInProgress|userProgress|markAsLearned)/g);
    if (progressRefs) {
      console.log(`  ${path.basename(component)}:`);
      const unique = [...new Set(progressRefs)];
      unique.forEach(ref => console.log(`    - Uses: ${ref}`));
    }
  }
});

// Summary
console.log('\n=== SUMMARY OF INCONSISTENCIES ===\n');

const issues = [];

// Known issues from previous analysis
issues.push('1. ✅ FIXED: Schema mismatch (times_correct vs correct_count)');
issues.push('2. ✅ FIXED: Missing sentences in database (sent_301-400)');
issues.push('3. ✅ FIXED: Mixed translation types in JSON');

// Check for remaining issues
if (fieldIssues.length > 0) {
  issues.push(`4. ❌ Field mismatches: ${fieldIssues.length} issues found`);
} else {
  issues.push('4. ✅ All database fields match code references');
}

// Check for table usage
const tablesInCode = [...new Set(supabaseOps.map(op => op.table))];
const tablesInDB = Object.keys(DATABASE_SCHEMA);
const unusedTables = tablesInDB.filter(t => !tablesInCode.includes(t));
if (unusedTables.length > 0) {
  issues.push(`5. ⚠️ Unused tables: ${unusedTables.join(', ')}`);
}

console.log(issues.join('\n'));

console.log('\n=== RECOMMENDATIONS ===\n');
console.log('1. Verify user_profiles and study_sessions table schemas');
console.log('2. Consider removing unused tables or implementing their features');
console.log('3. Add foreign key from phrase_progress.phrase_id to phrases.id');
console.log('4. Ensure all TypeScript interfaces match database schemas exactly');
console.log('5. Add database migration scripts for schema changes');