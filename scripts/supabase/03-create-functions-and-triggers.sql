-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user preferences with default values
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE LOG 'Error creating user preferences for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

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