-- Darija Arabic Learning Platform Database Schema
-- Run this in your Supabase SQL editor

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- User Profiles Table
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    preferred_dialect TEXT DEFAULT 'all' CHECK (preferred_dialect IN ('lebanese', 'syrian', 'emirati', 'saudi', 'all')),
    daily_goal INTEGER DEFAULT 10,
    streak_days INTEGER DEFAULT 0,
    total_study_time INTEGER DEFAULT 0, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz Attempts Table
CREATE TABLE quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    quiz_type TEXT NOT NULL CHECK (quiz_type IN ('multiple-choice', 'word-order', 'spaced')),
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    difficulty TEXT DEFAULT 'all' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'all')),
    target_dialect TEXT NOT NULL,
    time_spent INTEGER NOT NULL, -- in seconds
    questions JSONB, -- store the actual questions and answers
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Phrase Progress Table (for spaced repetition)
CREATE TABLE phrase_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    phrase_id TEXT NOT NULL, -- references phrase IDs from your JSON files
    status TEXT DEFAULT 'learning' CHECK (status IN ('learning', 'practicing', 'mastered')),
    correct_attempts INTEGER DEFAULT 0,
    total_attempts INTEGER DEFAULT 0,
    last_reviewed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_review TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ease_factor DECIMAL DEFAULT 2.5,
    interval_days INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, phrase_id)
);

-- Study Sessions Table (for analytics)
CREATE TABLE study_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_type TEXT NOT NULL CHECK (session_type IN ('quiz', 'review', 'browse')),
    duration_minutes INTEGER NOT NULL,
    phrases_studied INTEGER DEFAULT 0,
    accuracy_percentage DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies

-- User Profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Quiz Attempts
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own quiz attempts" ON quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quiz attempts" ON quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Phrase Progress
ALTER TABLE phrase_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own phrase progress" ON phrase_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own phrase progress" ON phrase_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own phrase progress" ON phrase_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Study Sessions
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own study sessions" ON study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study sessions" ON study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_created_at ON quiz_attempts(created_at);
CREATE INDEX idx_phrase_progress_user_id ON phrase_progress(user_id);
CREATE INDEX idx_phrase_progress_next_review ON phrase_progress(next_review);
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_created_at ON study_sessions(created_at);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_phrase_progress_updated_at
    BEFORE UPDATE ON phrase_progress
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();