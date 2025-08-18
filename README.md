# 🌍 Darija Arabic Learning Platform

A comprehensive web application designed to help Moroccan Darija speakers learn other Arabic dialects including Lebanese, Syrian, Emirati, Saudi, and Modern Standard Arabic (MSA).

![React](https://img.shields.io/badge/React-18.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-2.0-green)
![Clerk](https://img.shields.io/badge/Clerk-Auth-purple)
![Status](https://img.shields.io/badge/Status-Production_Ready-brightgreen)

## 🌟 Live Demo

**[Try the app now at darija-tr.netlify.app](https://darija-tr.netlify.app)**

## 🎯 Features

### Core Learning Features
- **📚 Translation Hub**: Browse 552+ phrases with instant search across 6 Arabic dialects
- **🎯 Interactive Quiz System**: Multiple choice and word ordering questions with smart distractors
- **📈 Progress Tracking**: Personal learning statistics and achievement system
- **🌐 Cultural Context**: Detailed usage notes and cultural sensitivities for each phrase
- **✨ Smart Learning**: Only shows unmastered phrases, with ability to mark known phrases

### User Experience
- **🔐 Secure Authentication**: Email/password and GitHub OAuth authentication
- **💾 Cloud Sync**: All progress saved to Supabase with real-time updates
- **📱 Mobile Responsive**: Fully optimized for all devices
- **🎨 Modern UI**: Clean, intuitive interface with TailwindCSS
- **⚡ Fast Performance**: Optimized loading with Vite
- **🔗 Clean URLs**: Simple navigation (`/hub`, `/quiz`, `/progress`, `/culture`)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Clerk account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/saleml/darija-arabic-learning.git
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
1. **Sign Up**: Create an account using email/password or GitHub
2. **Language Setup**: Choose your source dialect (what you speak) and target dialect (what you want to learn)
3. **Start Learning**: Navigate to `/hub` to begin your journey

### Translation Hub (`/hub`)
- View 3 random unmastered phrases at a time
- Click "Show me 3 other phrases" for new content
- Expand any phrase to see translations in all dialects
- Mark phrases as "Already Mastered" if you know them
- Toggle "Show Mastered" to review learned phrases
- Progress automatically syncs to the cloud

### Quiz System (`/quiz`)
1. Configure your quiz:
   - Length: 2, 5, or 10 questions
   - Type: Multiple Choice or Word Ordering
   - Source dialect: What language the question is in
   - Target dialect: What language to translate to
   - Difficulty: Beginner, Intermediate, Advanced, or All
2. Answer questions with instant feedback
3. View your score and time at completion
4. All quiz attempts are saved to your history

### Progress Tracking (`/progress`)
- **Overall Stats**: Total mastery percentage and phrases learned
- **Quiz History**: All attempts with scores and timestamps
- **Learning Metrics**: Average quiz score and total study time
- **Visual Progress**: Charts showing your improvement over time

### Cultural Context (`/culture`)
- Navigate cultural cards with arrow buttons
- Filter by category: social, cultural, family, food, marketplace, idioms
- Learn about regional differences
- Understand cultural sensitivities
- Get practical tips for real-world usage

## 🛠️ Technical Architecture

### Frontend Stack
- **React 18** - UI framework with hooks and modern patterns
- **TypeScript** - Full type safety across the application
- **Vite** - Lightning-fast HMR and build times
- **TailwindCSS** - Utility-first styling
- **React Router v6** - Client-side routing
- **Lucide Icons** - Beautiful, consistent icons

### Backend Services
- **Clerk** - Authentication & user management
  - Email/password authentication
  - GitHub OAuth (working)
  - Google OAuth (requires custom credentials)
- **Supabase** - Database & real-time sync
  - PostgreSQL database
  - Row-level security
  - Real-time subscriptions

### Database Schema

```sql
-- Main tables in use
phrases (552 rows) - All phrases and translations
phrase_progress - User progress per phrase
quiz_attempts - Quiz history and scores

-- Fields updated for compatibility
phrase_progress:
  - correct_count (was times_correct)
  - incorrect_count (was times_seen)
  - is_mastered boolean
  - last_reviewed timestamp
```

## 🔧 Recent Updates & Fixes

### Latest Changes (Production Ready)
- ✅ Fixed quiz source language selection bug
- ✅ Fixed quiz generation when Darija is target language
- ✅ Simplified routing from `/dashboard/*` to direct paths
- ✅ Fixed Translation Hub to only replace mastered card
- ✅ Synced all 552 phrases to database
- ✅ Fixed schema mismatches between code and database
- ✅ Resolved React Error #31 (object rendering)
- ✅ Fixed double-counting in progress tracking
- ✅ GitHub OAuth fully functional
- ✅ Clean URL structure implemented

### Authentication Status
- ✅ **Email/Password**: Fully working
- ✅ **GitHub OAuth**: Fully working
- ✅ **Password Reset**: Email recovery working
- ⚠️ **Google OAuth**: Disabled (requires Google Cloud setup)

## 🚢 Deployment

### Deploy to Netlify (Recommended)

1. **Push to GitHub**:
```bash
git push origin main
```

2. **Connect to Netlify**:
   - Sign in to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Select your repository
   - Build settings will auto-configure

3. **Environment Variables**:
Add these in Netlify Dashboard → Site Settings → Environment Variables:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

4. **Deploy**:
   - Automatic deploys on push to main
   - Build command: `npm run build`
   - Publish directory: `dist`

## 📊 Content Statistics

### Current Database
- **Total Phrases**: 552
  - Beginner: 45 phrases
  - Intermediate: 63 phrases
  - Advanced: 44 phrases
  - Daily Conversations: 400 sentences
- **Dialects**: 6 (Darija, Lebanese, Syrian, Emirati, Saudi, MSA)
- **Categories**: 18 learning categories
- **Cultural Cards**: 6 topics with regional insights

## 🐛 Known Issues & Solutions

| Issue | Status | Solution |
|-------|--------|----------|
| Google OAuth not working | ⚠️ Known | Requires Google Cloud Console setup |
| user_progress table 404 | ⚠️ Minor | Run cleanup script in Supabase |
| CAPTCHA errors | ✅ Fixed | Bot protection disabled in Clerk |

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
```

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for learning or teaching Arabic dialects.

## 🙏 Acknowledgments

- Arabic linguistic community for phrase validation
- Open source contributors
- Beta testers and early users
- Claude AI for development assistance

## 👨‍💻 Author

Created with ❤️ by Salem Lahlou

## 🗺️ Roadmap

### Completed ✅
- [x] Core learning features
- [x] User authentication
- [x] Progress tracking
- [x] Quiz system
- [x] Cultural context cards
- [x] Cloud sync
- [x] Mobile responsive design

### Coming Soon
- [ ] Audio pronunciations
- [ ] Dark mode
- [ ] More quiz types
- [ ] Achievement badges
- [ ] Export progress data
- [ ] Community features

---

**Ready to start your Arabic learning journey?** [Visit darija-tr.netlify.app](https://darija-tr.netlify.app)