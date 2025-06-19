-- Create RLS policies for suggestions
CREATE POLICY "Users can view suggestions for their own segments" ON suggestions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tweet_segments ts
            JOIN threads t ON t.id = ts.thread_id
            WHERE ts.id = suggestions.segment_id 
            AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert suggestions for their own segments" ON suggestions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tweet_segments ts
            JOIN threads t ON t.id = ts.thread_id
            WHERE ts.id = suggestions.segment_id 
            AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update suggestions for their own segments" ON suggestions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM tweet_segments ts
            JOIN threads t ON t.id = ts.thread_id
            WHERE ts.id = suggestions.segment_id 
            AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete suggestions for their own segments" ON suggestions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM tweet_segments ts
            JOIN threads t ON t.id = ts.thread_id
            WHERE ts.id = suggestions.segment_id 
            AND t.user_id = auth.uid()
        )
    );

-- Create RLS policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" ON user_preferences
    FOR DELETE USING (auth.uid() = user_id);