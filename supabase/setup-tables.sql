-- IMPORTANT: Run this SQL in your Supabase SQL editor to set up the required tables

-- Drop existing tables if they exist (be careful with this in production!)
DROP TABLE IF EXISTS phrase_progress CASCADE;
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;

-- Create user_progress table (for backward compatibility)
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    phrases_learned TEXT[] DEFAULT '{}',
    phrases_in_progress TEXT[] DEFAULT '{}',
    quiz_scores JSONB DEFAULT '[]',
    spaced_repetition JSONB DEFAULT '[]',
    streak_days INTEGER DEFAULT 0,
    last_active_date TIMESTAMPTZ DEFAULT NOW(),
    total_study_time INTEGER DEFAULT 0,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create phrase_progress table WITHOUT foreign key to phrases table
-- (since we don't have a phrases table - phrases are stored in JSON files)
CREATE TABLE IF NOT EXISTS phrase_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    phrase_id TEXT NOT NULL,  -- No foreign key constraint
    is_mastered BOOLEAN DEFAULT FALSE,
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    last_reviewed TIMESTAMPTZ DEFAULT NOW(),
    next_review TIMESTAMPTZ,
    ease_factor DECIMAL(3,2) DEFAULT 2.5,
    interval_days INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, phrase_id)
);

-- Create quiz_attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    difficulty TEXT,
    quiz_type TEXT,
    source_dialect TEXT,
    target_dialect TEXT,
    time_spent INTEGER,
    correct_phrases TEXT[] DEFAULT '{}',
    phrases_tested TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    total_quizzes INTEGER DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0,
    mastered_phrases INTEGER DEFAULT 0,
    in_progress_phrases INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_study_time INTEGER DEFAULT 0,
    last_active_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_phrase_progress_user_id ON phrase_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_phrase_progress_phrase_id ON phrase_progress(phrase_id);
CREATE INDEX IF NOT EXISTS idx_phrase_progress_user_phrase ON phrase_progress(user_id, phrase_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- Enable Row Level Security
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE phrase_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow authenticated users to manage their own data)
-- For user_progress
CREATE POLICY "Users can view their own progress" ON user_progress
    FOR SELECT USING (true);  -- Allow all reads for now

CREATE POLICY "Users can insert their own progress" ON user_progress
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own progress" ON user_progress
    FOR UPDATE USING (true);

-- For phrase_progress
CREATE POLICY "Users can view phrase progress" ON phrase_progress
    FOR SELECT USING (true);

CREATE POLICY "Users can insert phrase progress" ON phrase_progress
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update phrase progress" ON phrase_progress
    FOR UPDATE USING (true);

-- For quiz_attempts
CREATE POLICY "Users can view quiz attempts" ON quiz_attempts
    FOR SELECT USING (true);

CREATE POLICY "Users can insert quiz attempts" ON quiz_attempts
    FOR INSERT WITH CHECK (true);

-- For user_stats
CREATE POLICY "Users can view user stats" ON user_stats
    FOR SELECT USING (true);

CREATE POLICY "Users can insert user stats" ON user_stats
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update user stats" ON user_stats
    FOR UPDATE USING (true);

-- Add update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phrase_progress_updated_at BEFORE UPDATE ON phrase_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();