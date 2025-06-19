-- Create helpful view for thread summaries
CREATE OR REPLACE VIEW thread_summary AS
SELECT 
    t.id,
    t.user_id,
    t.title,
    t.description,
    t.status,
    t.total_characters,
    t.total_tweets,
    t.created_at,
    t.updated_at,
    t.published_at,
    COUNT(s.id) as total_suggestions,
    COUNT(CASE WHEN s.is_applied = false THEN 1 END) as pending_suggestions
FROM threads t
LEFT JOIN tweet_segments ts ON t.id = ts.thread_id
LEFT JOIN suggestions s ON ts.id = s.segment_id
GROUP BY t.id, t.user_id, t.title, t.description, t.status, 
         t.total_characters, t.total_tweets, t.created_at, t.updated_at, t.published_at;

-- Create function to initialize user preferences
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create trigger to automatically create user preferences
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();