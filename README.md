# Darija Arabic Learning Platform 🇲🇦

A comprehensive learning platform for Moroccan Darija speakers to master Levantine and Gulf Arabic dialects.

## 🚀 **NOW LIVE WITH REAL DATABASE!**

✅ **Production Ready** with Supabase authentication and cloud database  
✅ **Local Development** works offline with localStorage fallback  
✅ **Smart Quiz System** with intelligent MCQ distractors  
✅ **Word Ordering** with challenging distractor words  
✅ **Real User Tracking** and analytics

## Features

### 📚 Extensive Phrase Database
- **550+ carefully researched phrases and sentences** (152 phrases + 400 sentences)
- Three difficulty levels: Beginner, Intermediate, Advanced
- **5 dialect variations**: Lebanese, Syrian, Emirati, Saudi, and Formal MSA
- **Rich cultural context** and usage notes for each phrase
- **Categories**: Greetings, Daily Essentials, Social, Emotions, Shopping, Food, Directions, and more

### 🎯 Interactive Learning Tools

#### Translation Hub
- Smart search with Arabic script and transliteration support
- Advanced filtering by category, difficulty, and dialect
- Visual progress tracking for learned phrases
- Expandable cards with full dialect comparisons

#### Quiz System
- Multiple choice and fill-in-the-blank exercises
- Spaced repetition algorithm for optimal retention
- Progress tracking and performance analytics
- Customizable difficulty and dialect focus

#### Progress Tracker
- Comprehensive learning statistics
- Achievement system with milestones
- Daily goals and streak tracking
- Export progress data for backup

#### Cultural Context Cards
- In-depth cultural insights for 10+ topics
- Regional differences explained
- Practical tips for real-world usage
- Example phrases with context

## User Authentication

### Features
- User registration and login system
- Progress tracking per user account
- Demo account available for testing: **demo@example.com** / **demo123**
- Secure localStorage persistence

## Getting Started

### Prerequisites
- Node.js 16+ and npm

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd darija-arabic-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage Guide

### For Learners

1. **Start with the Translation Hub**: Browse phrases by category or search for specific terms
2. **Mark phrases as learned**: Track your progress as you master each phrase
3. **Take quizzes regularly**: Use the spaced repetition system for better retention
4. **Review cultural cards**: Understand the context behind language differences
5. **Set daily goals**: Maintain consistency with achievable targets

### Learning Path Recommendations

#### Beginner (Month 1)
- Focus on greetings and daily essentials
- Learn 5-10 phrases per day
- Take practice quizzes daily
- Review cultural context for social situations

#### Intermediate (Month 2)
- Expand to practical situations and emotions
- Increase to 10-15 phrases per day
- Use spaced repetition for review
- Focus on dialect-specific variations

#### Advanced (Month 3+)
- Master idioms and formal language
- Practice with mixed dialect quizzes
- Focus on cultural nuances
- Aim for conversational fluency

## Technical Details

### Built With
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Local Storage** for progress persistence

### Project Structure
```
darija-arabic-app/
├── src/
│   ├── components/       # React components
│   ├── types/            # TypeScript definitions
│   └── App.tsx          # Main application
├── database/            # JSON phrase databases
├── docs/               # Documentation
└── public/             # Static assets
```

### Database Schema
Each phrase includes:
- Original Darija with transliteration
- Translations for 5+ Arabic dialects
- Usage context and formality levels
- Cultural notes and common mistakes
- Tags for easy categorization

## Spaced Repetition Algorithm

The app uses a modified SM-2 algorithm:
- Initial interval: 1 day
- Correct answer: interval × ease factor (2.5)
- Incorrect answer: reset to 1 day
- Ease factor adjusts based on performance

## Progress Data

Your learning progress is automatically saved to browser local storage:
- Learned phrases
- Quiz scores
- Streak days
- Study time
- Personal preferences

Export your data anytime from the Progress Tracker settings.

## Language Coverage

### Dialects Included
- 🇲🇦 **Moroccan Darija** (source language)
- 🇱🇧 **Lebanese Arabic**
- 🇸🇾 **Syrian Arabic**
- 🇦🇪 **Emirati Arabic**
- 🇸🇦 **Saudi Arabic**
- 📚 **Modern Standard Arabic (MSA)**

### Phrase Categories
- Greetings & Farewells
- Daily Essentials
- Numbers & Time
- Family & Relationships
- Food & Dining
- Shopping & Commerce
- Directions & Transportation
- Workplace Communication
- Health & Emergency
- Emotions & Feelings
- Weather & Environment
- Technology & Modern Life
- Cultural Expressions
- Idioms & Proverbs
- Formal & Professional

## Contributing

This project is open for improvements:
1. Report issues or suggest features
2. Add new phrases with proper validation
3. Improve translations or cultural notes
4. Enhance the UI/UX
5. Add audio pronunciations

## Future Enhancements

- [ ] Native speaker audio recordings
- [ ] Offline PWA support
- [ ] User accounts with cloud sync
- [ ] Conversation practice mode
- [ ] Writing system practice
- [ ] Community phrase submissions
- [ ] Mobile app versions
- [ ] API for third-party integration

## License

This project is for educational purposes. Please respect intellectual property when using phrase data.

## Acknowledgments

- Linguistic research from various academic sources
- Cultural insights from native speakers
- Open-source language learning communities

---

**Made with ❤️ for bridging Arabic dialects**