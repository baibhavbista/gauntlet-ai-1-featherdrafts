-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_status ON threads(status);
CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_updated_at ON threads(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_tweet_segments_thread_id ON tweet_segments(thread_id);
CREATE INDEX IF NOT EXISTS idx_tweet_segments_index ON tweet_segments(thread_id, segment_index);
CREATE INDEX IF NOT EXISTS idx_tweet_segments_updated_at ON tweet_segments(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_suggestions_segment_id ON suggestions(segment_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_type ON suggestions(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_suggestions_applied ON suggestions(is_applied);