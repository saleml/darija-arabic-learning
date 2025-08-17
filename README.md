# 🌍 Darija Arabic Learning Platform

A comprehensive web application designed to help Moroccan Darija speakers learn other Arabic dialects including Lebanese, Syrian, Emirati, Saudi, Egyptian, and Modern Standard Arabic (MSA).

![React](https://img.shields.io/badge/React-18.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-2.0-green)
![Clerk](https://img.shields.io/badge/Clerk-Auth-purple)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🎯 Features

### Core Learning Features
- **📚 Translation Hub**: Browse 552+ phrases with instant search across 6 Arabic dialects
- **🎯 Interactive Quiz System**: Multiple choice and word ordering questions with smart distractors
- **📈 Progress Tracking**: Personal learning statistics and achievement system
- **🔄 Spaced Repetition**: Scientifically-backed learning intervals for optimal retention
- **🌐 Cultural Context**: Detailed usage notes and cultural sensitivities for each phrase

### User Experience
- **🔐 Secure Authentication**: Full user management with Clerk
- **💾 Cloud Sync**: Progress saved to Supabase with real-time updates
- **📱 Mobile Responsive**: Optimized for all devices
- **🎨 Modern UI**: Clean, intuitive interface with TailwindCSS
- **⚡ Fast Performance**: Optimized loading with Vite

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Clerk account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/darija-arabic-app.git
cd darija-arabic-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Run the development server**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📖 User Guide

### Getting Started
1. **Sign Up**: Create an account using email/password
2. **Language Setup**: Choose your source and target dialects
3. **Start Learning**: Access the Translation Hub to begin

### Translation Hub
- View 3 random unmastered phrases at a time
- Click "Show me 3 other phrases" for new content
- Expand phrases to see all dialect translations
- Mark phrases as "Already Mastered" if you know them
- Toggle to view all mastered phrases

### Quiz System
1. Choose quiz length (2, 5, or 10 questions)
2. Select quiz type:
   - **Multiple Choice**: Select correct translation
   - **Word Ordering**: Arrange words in correct order
3. Get instant feedback and progress updates
4. View score and time at completion

### Progress Tracking
- **Mastered Phrases**: Total phrases you've learned
- **Quiz History**: All your quiz attempts and scores
- **Study Time**: Total time spent learning
- **Streak**: Consecutive days of practice
- **Achievements**: Unlock badges as you progress

## 🛠️ Technical Architecture

### Frontend Stack
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **Lucide Icons** - Icon library

### Backend Services
- **Clerk** - Authentication & user management
- **Supabase** - Database & real-time sync
- **PostgreSQL** - Data storage (via Supabase)

### Project Structure
```
src/
├── components/          # React components
│   ├── TranslationHub.tsx
│   ├── QuizSystem.tsx
│   ├── ProgressTracker.tsx
│   └── ...
├── services/           # Business logic
│   ├── progressService.ts
│   └── analytics.ts
├── hooks/             # Custom React hooks
├── contexts/          # React contexts
├── types/            # TypeScript definitions
├── utils/            # Utility functions
└── database/         # JSON phrase databases
```

## 🔧 Configuration & Maintenance

### Updating Phrases

#### Adding New Phrases
1. Navigate to the appropriate database file:
   - `database/beginner_phrases.json` (A1-A2 level)
   - `database/intermediate_phrases.json` (B1-B2 level)
   - `database/advanced_phrases.json` (C1-C2 level)

2. Add new phrase following this structure:
```json
{
  "id": "unique_id_here",
  "darija": "مغربية",
  "darija_latin": "maghribiya",
  "literal_english": "Moroccan",
  "english": "Moroccan",
  "translations": {
    "lebanese": {
      "phrase": "لبنانية",
      "latin": "libneniyye",
      "audio": null
    },
    "syrian": {
      "phrase": "سورية",
      "latin": "suriyye",
      "audio": null
    }
  },
  "category": "greetings",
  "difficulty": "beginner",
  "tags": ["nationality", "identity"],
  "usage": {
    "formality": "neutral",
    "frequency": "high",
    "context": ["introduction", "identity"]
  }
}
```

#### Modifying Categories
Edit the category field in phrase objects. Available categories:
- `greetings`, `daily_essentials`, `numbers`, `time_date`
- `family`, `food_dining`, `transportation`, `shopping`
- `emotions`, `health`, `workplace`, `social`
- `directions`, `weather`, `technology`, `cultural`
- `idioms`, `slang`

### Clerk Configuration

1. **Sign in to Clerk Dashboard**: https://dashboard.clerk.com

2. **User Metadata Setup**:
   - Go to Users → User Metadata
   - Add public metadata fields:
     - `sourceLanguage` (string)
     - `targetLanguage` (string)
     - `onboardingCompleted` (boolean)

3. **Authentication Methods**:
   - Enable Email/Password
   - Configure social logins (optional)
   - Set up MFA (recommended)

### Supabase Configuration

1. **Database Setup**:
```sql
-- Create user_progress table
CREATE TABLE user_progress (
  user_id TEXT PRIMARY KEY,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create phrase_progress table
CREATE TABLE phrase_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES user_progress(user_id),
  phrase_id TEXT NOT NULL,
  times_seen INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  is_mastered BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create quiz_attempts table
CREATE TABLE quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES user_progress(user_id),
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  difficulty TEXT,
  quiz_type TEXT,
  correct_phrases TEXT[],
  phrases_tested TEXT[],
  time_spent INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

2. **Row Level Security (RLS)**:
```sql
-- Enable RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE phrase_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own progress" ON user_progress
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own phrase progress" ON phrase_progress
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own quiz attempts" ON quiz_attempts
  FOR ALL USING (auth.uid()::text = user_id);
```

3. **API Configuration**:
   - Note your project URL and anon key
   - Add them to your `.env` file
   - Enable real-time subscriptions (optional)

## 🚢 Deployment

### Netlify Deployment (Recommended)

1. **Connect GitHub Repository**:
   - Sign in to Netlify
   - Click "New site from Git"
   - Choose your repository (works with private repos)

2. **Configure Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Set Environment Variables**:
   - Add all variables from `.env` file
   - Use Netlify's environment variables UI

4. **Deploy**:
   - Netlify auto-deploys on push to main branch
   - Manual deploy: `netlify deploy --prod`

### Vercel Deployment

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts to configure
4. Set environment variables in Vercel dashboard

## 📊 Database Content

### Current Statistics
- **Total Learning Items**: 552
  - Core Phrases: 152
  - Conversational Sentences: 400
- **Categories**: 18
- **Difficulty Levels**: 3 (Beginner, Intermediate, Advanced)
- **Dialects Covered**: 6 (Lebanese, Syrian, Emirati, Saudi, Egyptian, MSA)

### Content Organization
```
database/
├── beginner_phrases.json      # 45 phrases (A1-A2)
├── intermediate_phrases.json  # 63 phrases (B1-B2)
├── advanced_phrases.json      # 44 phrases (C1-C2)
└── sentences_daily_conversations.json # 400 sentences
```

## 🐛 Troubleshooting

### Common Issues

**Authentication Issues**
- Verify Clerk keys in `.env`
- Check Clerk dashboard for user status
- Clear browser cache and cookies

**Database Connection**
- Verify Supabase URL and keys
- Check RLS policies are correctly set
- Ensure tables exist in Supabase

**Progress Not Saving**
- Check browser console for errors
- Verify user is authenticated
- Check Supabase connection

**Quiz Not Loading**
- Ensure phrase database files exist
- Check for JavaScript errors
- Verify quiz configuration

## 📝 Development

### Running Tests
```bash
npm run test        # Run tests
npm run test:watch  # Watch mode
```

### Building for Production
```bash
npm run build      # Create production build
npm run preview    # Preview production build
```

### Code Quality
```bash
npm run lint       # Run ESLint
npm run type-check # Run TypeScript compiler
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- All contributors and testers
- The Arabic-speaking community for linguistic guidance
- Open source libraries that made this possible

## 📞 Support

For support, please:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the documentation

## 🗺️ Roadmap

### Short Term
- [ ] Audio pronunciation for all phrases
- [ ] Dark mode support
- [ ] Export progress as PDF/CSV
- [ ] More quiz types

### Long Term
- [ ] Mobile app (React Native)
- [ ] AI-powered conversation practice
- [ ] Community features
- [ ] Content creator tools

---

**Built with ❤️ for the Arabic learning community**