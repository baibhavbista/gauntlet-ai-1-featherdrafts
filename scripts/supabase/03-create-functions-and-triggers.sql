-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_threads_updated_at 
    BEFORE UPDATE ON threads 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tweet_segments_updated_at 
    BEFORE UPDATE ON tweet_segments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to update thread statistics
CREATE OR REPLACE FUNCTION update_thread_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update thread statistics when segments change
    UPDATE threads 
    SET 
        total_tweets = (
            SELECT COUNT(*) 
            FROM tweet_segments 
            WHERE thread_id = COALESCE(NEW.thread_id, OLD.thread_id)
        ),
        total_characters = (
            SELECT COALESCE(SUM(char_count), 0) 
            FROM tweet_segments 
            WHERE thread_id = COALESCE(NEW.thread_id, OLD.thread_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.thread_id, OLD.thread_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create trigger to automatically update thread stats
CREATE TRIGGER update_thread_stats_on_segment_change
    AFTER INSERT OR UPDATE OR DELETE ON tweet_segments
    FOR EACH ROW
    EXECUTE FUNCTION update_thread_stats();
