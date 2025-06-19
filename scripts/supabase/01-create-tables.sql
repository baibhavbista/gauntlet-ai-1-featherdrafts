-- Create threads table
CREATE TABLE IF NOT EXISTS threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    total_characters INTEGER DEFAULT 0 CHECK (total_characters >= 0),
    total_tweets INTEGER DEFAULT 0 CHECK (total_tweets >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Create tweet_segments table
CREATE TABLE IF NOT EXISTS tweet_segments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    content TEXT NOT NULL DEFAULT '',
    char_count INTEGER DEFAULT 0 CHECK (char_count >= 0),
    segment_index INTEGER NOT NULL CHECK (segment_index >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate indexes per thread
    UNIQUE(thread_id, segment_index)
);

-- Create suggestions table
CREATE TABLE IF NOT EXISTS suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    segment_id UUID NOT NULL REFERENCES tweet_segments(id) ON DELETE CASCADE,
    suggestion_type VARCHAR(20) NOT NULL CHECK (suggestion_type IN ('spelling', 'grammar')),
    original_text TEXT NOT NULL,
    suggested_text TEXT NOT NULL,
    reason TEXT,
    start_position INTEGER NOT NULL CHECK (start_position >= 0),
    end_position INTEGER NOT NULL,
    is_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint to ensure valid positions
    CHECK (end_position > start_position)
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    auto_save_enabled BOOLEAN DEFAULT TRUE,
    spell_check_enabled BOOLEAN DEFAULT TRUE,
    grammar_check_enabled BOOLEAN DEFAULT TRUE,
    auto_fix_enabled BOOLEAN DEFAULT FALSE,
    preferred_tone VARCHAR(50) DEFAULT 'neutral' CHECK (preferred_tone IN ('casual', 'professional', 'neutral', 'friendly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);