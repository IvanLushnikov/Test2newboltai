/*
  # Fix RLS policies for user_questions table

  ## Changes
  - Update SELECT policy to allow anonymous users to view their own questions by session_id
  - This enables the free questions counter to work for unauthenticated users
  
  ## Security
  - Authenticated users can only see their own questions (by user_id)
  - Anonymous users can only see questions from their session (by session_id)
*/

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view own questions" ON user_questions;

-- Create new SELECT policy that supports both authenticated and anonymous users
CREATE POLICY "Users can view own questions"
  ON user_questions
  FOR SELECT
  TO anon, authenticated
  USING (
    CASE
      WHEN auth.uid() IS NOT NULL THEN auth.uid() = user_id
      ELSE session_id IS NOT NULL
    END
  );
