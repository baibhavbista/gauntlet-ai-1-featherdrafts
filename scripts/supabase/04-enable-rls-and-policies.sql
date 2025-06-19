-- Enable Row Level Security on all tables
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tweet_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for threads
CREATE POLICY "Users can view their own threads" ON threads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own threads" ON threads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threads" ON threads
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own threads" ON threads
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for tweet_segments
CREATE POLICY "Users can view segments of their own threads" ON tweet_segments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM threads 
            WHERE threads.id = tweet_segments.thread_id 
            AND threads.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert segments to their own threads" ON tweet_segments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM threads 
            WHERE threads.id = tweet_segments.thread_id 
            AND threads.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update segments of their own threads" ON tweet_segments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM threads 
            WHERE threads.id = tweet_segments.thread_id 
            AND threads.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete segments of their own threads" ON tweet_segments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM threads 
            WHERE threads.id = tweet_segments.thread_id 
            AND threads.user_id = auth.uid()
        )
    );