# Database Schema Documentation

## Overview
The database stores comprehensive translation data for Darija to various Arabic dialects, with rich metadata for effective language learning.

## Core Schema Structure

### Phrase Object
```typescript
interface Phrase {
  id: string;                    // Unique identifier (e.g., "greet_001")
  darija: string;                 // Original Darija phrase in Arabic script
  darija_latin: string;           // Romanized transliteration
  literal_english: string;        // Literal English translation
  
  translations: {
    lebanese: Translation;
    syrian: Translation;
    emirati: Translation;
    saudi: Translation;
    egyptian: Translation;         // Added for wider coverage
    formal_msa: Translation;
  };
  
  category: Category;
  subcategory?: string;
  difficulty: Difficulty;
  tags: string[];
  
  usage: {
    formality: Formality;
    frequency: Frequency;
    context: string[];            // Situations where used
    gender_specific?: GenderNote;
    age_appropriate?: string;
  };
  
  cultural_notes?: string;
  common_mistakes?: string[];
  related_phrases?: string[];     // IDs of related phrases
  
  audio?: {
    darija?: string;              // Audio file path/URL
    lebanese?: string;
    syrian?: string;
    gulf?: string;
  };
  
  examples?: Example[];
  
  metadata: {
    date_added: string;
    last_updated: string;
    source_references: string[];
    validated: boolean;
    reviewer_notes?: string;
  };
}
```

### Translation Object
```typescript
interface Translation {
  phrase: string;                 // Translated phrase in Arabic script
  latin: string;                  // Romanized version
  literal: string;                // Literal English meaning
  usage_note?: string;            // Dialect-specific usage notes
  alternatives?: string[];        // Alternative ways to say it
  formality_shift?: string;       // If formality differs from original
}
```

### Example Object
```typescript
interface Example {
  darija: string;
  darija_latin: string;
  translation: string;
  context: string;
  dialect_variations?: {
    [dialect: string]: string;
  };
}
```

### Gender Note Object
```typescript
interface GenderNote {
  male_form?: string;
  female_form?: string;
  mixed_group?: string;
  notes: string;
}
```

## Enumerations

### Category
```typescript
enum Category {
  GREETINGS = "greetings",
  DAILY_ESSENTIALS = "daily_essentials",
  SOCIAL = "social",
  EMOTIONS = "emotions",
  SHOPPING = "shopping",
  FOOD_DINING = "food_dining",
  DIRECTIONS = "directions",
  TRANSPORTATION = "transportation",
  WORKPLACE = "workplace",
  EMERGENCY = "emergency",
  HEALTH = "health",
  FAMILY = "family",
  TIME_DATE = "time_date",
  NUMBERS = "numbers",
  WEATHER = "weather",
  TECHNOLOGY = "technology",
  CULTURAL = "cultural",
  RELIGIOUS = "religious",
  IDIOMS = "idioms",
  SLANG = "slang"
}
```

### Difficulty
```typescript
enum Difficulty {
  BEGINNER = "beginner",         // A1-A2
  INTERMEDIATE = "intermediate", // B1-B2
  ADVANCED = "advanced"          // C1-C2
}
```

### Formality
```typescript
enum Formality {
  VERY_FORMAL = "very_formal",   // Official/written
  FORMAL = "formal",              // Professional
  NEUTRAL = "neutral",            // Standard
  INFORMAL = "informal",          // Casual
  VERY_INFORMAL = "very_informal" // Slang/intimate
}
```

### Frequency
```typescript
enum Frequency {
  ESSENTIAL = "essential",        // Daily use
  VERY_HIGH = "very_high",       // Multiple times per week
  HIGH = "high",                  // Weekly
  MEDIUM = "medium",              // Monthly
  LOW = "low",                    // Occasionally
  RARE = "rare"                   // Specialized
}
```

## Database File Structure

```
database/
├── phrases/
│   ├── beginner/
│   │   ├── greetings.json
│   │   ├── daily_essentials.json
│   │   ├── numbers.json
│   │   └── ...
│   ├── intermediate/
│   │   ├── social.json
│   │   ├── shopping.json
│   │   ├── workplace.json
│   │   └── ...
│   └── advanced/
│       ├── idioms.json
│       ├── cultural.json
│       ├── formal.json
│       └── ...
├── index.json                    // Master index of all phrases
├── categories.json               // Category metadata
├── progress_checkpoints/         // Backup snapshots
│   ├── checkpoint_001.json
│   ├── checkpoint_002.json
│   └── ...
└── validation/
    ├── sources.json             // Source reference data
    └── review_log.json          // Validation history
```

## Sample Entry

```json
{
  "id": "greet_001",
  "darija": "السلام عليكم",
  "darija_latin": "ssalamu 3alaykum",
  "literal_english": "peace be upon you",
  
  "translations": {
    "lebanese": {
      "phrase": "مرحبا",
      "latin": "marhaba",
      "literal": "hello",
      "usage_note": "More common than religious greeting in casual settings",
      "alternatives": ["السلام عليكم", "هاي"]
    },
    "syrian": {
      "phrase": "مرحبا",
      "latin": "marhaba",
      "literal": "hello",
      "usage_note": "Same as Lebanese"
    },
    "emirati": {
      "phrase": "السلام عليكم",
      "latin": "as-salāmu ʿalaykum",
      "literal": "peace be upon you",
      "usage_note": "Formal greeting, very common",
      "alternatives": ["مرحبا", "صباح الخير"]
    },
    "saudi": {
      "phrase": "السلام عليكم",
      "latin": "as-salāmu ʿalaykum",
      "literal": "peace be upon you",
      "usage_note": "Standard greeting"
    },
    "egyptian": {
      "phrase": "أهلاً",
      "latin": "ahlan",
      "literal": "welcome/hello",
      "usage_note": "Very common informal greeting",
      "alternatives": ["السلام عليكم", "إزيك"]
    },
    "formal_msa": {
      "phrase": "السلام عليكم",
      "latin": "as-salāmu ʿalaykum",
      "literal": "peace be upon you",
      "usage_note": "Universal formal greeting"
    }
  },
  
  "category": "greetings",
  "subcategory": "meeting",
  "difficulty": "beginner",
  "tags": ["essential", "religious", "formal", "universal"],
  
  "usage": {
    "formality": "neutral",
    "frequency": "essential",
    "context": ["meeting someone", "entering a room", "phone calls", "formal letters"],
    "age_appropriate": "all ages"
  },
  
  "cultural_notes": "Religious greeting used across all Arabic-speaking countries. In Morocco, very common regardless of religious observance. In Lebanon/Syria, 'marhaba' is more common in casual settings.",
  
  "common_mistakes": [
    "Forgetting to wait for response 'wa ʿalaykum as-salām'",
    "Using with non-Muslims might be unexpected in some regions"
  ],
  
  "related_phrases": ["greet_002", "greet_003", "farewell_001"],
  
  "examples": [
    {
      "darija": "السلام عليكم، كيفاش؟",
      "darija_latin": "ssalamu 3alaykum, kifash?",
      "translation": "Hello, how are you?",
      "context": "Greeting a friend"
    }
  ],
  
  "metadata": {
    "date_added": "2025-01-15",
    "last_updated": "2025-01-15",
    "source_references": ["harrell_dict", "peace_corps_morocco", "lingualism_lebanese"],
    "validated": true
  }
}
```

## Indexing Strategy

### Primary Index
```json
{
  "total_phrases": 523,
  "by_category": {
    "greetings": ["greet_001", "greet_002", ...],
    "daily_essentials": ["daily_001", "daily_002", ...]
  },
  "by_difficulty": {
    "beginner": ["greet_001", "daily_001", ...],
    "intermediate": ["social_001", "work_001", ...],
    "advanced": ["idiom_001", "formal_001", ...]
  },
  "by_frequency": {
    "essential": ["greet_001", "daily_001", ...],
    "very_high": ["social_001", "food_001", ...]
  }
}
```

## Query Optimization

### Search Indices
- Full-text search on: darija, darija_latin, all translations
- Category filtering
- Difficulty filtering
- Tag-based search
- Formality filtering
- Related phrase navigation

### Performance Considerations
- Lazy load audio files
- Paginate large result sets
- Cache frequently accessed phrases
- Index all searchable fields
- Compress JSON for production

## Version Control

### Schema Versioning
```json
{
  "schema_version": "1.0.0",
  "compatible_versions": ["1.0.x"],
  "migration_required": false
}
```

### Change Log Format
```json
{
  "version": "1.0.1",
  "date": "2025-01-15",
  "changes": [
    "Added Egyptian dialect",
    "Enhanced cultural notes",
    "Fixed transliteration consistency"
  ]
}
```

## Validation Rules

### Required Fields
- id, darija, darija_latin
- At least 3 dialect translations
- category, difficulty
- formality, frequency

### Validation Checks
- Unique IDs
- Valid category enum values
- Consistent transliteration system
- No empty translations
- Valid date formats
- Source references exist

## Export Formats

### Learning App Format
Optimized for the React application with only necessary fields.

### Research Format
Complete data with all metadata for linguistic analysis.

### Public API Format
Sanitized version without internal notes or source references.

## Maintenance Guidelines

### Regular Updates
- Weekly: Add new phrases
- Monthly: Review and validate
- Quarterly: Schema evaluation
- Yearly: Major version update

### Quality Metrics
- Completion rate per category
- Validation percentage
- Source diversity score
- User feedback integration