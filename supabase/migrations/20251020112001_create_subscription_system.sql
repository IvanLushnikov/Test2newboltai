/*
  # Subscription System for ИИ Эксперт

  ## Overview
  This migration creates a comprehensive B2C subscription system for AI Expert service.
  Users get 2 free questions, then must subscribe at 199₽/month for unlimited access.

  ## New Tables
  
  ### `subscription_plans`
  - `id` (uuid, primary key) - Unique plan identifier
  - `name` (text) - Plan name (e.g., "Базовый")
  - `price_rub` (integer) - Price in rubles (199)
  - `billing_period` (text) - Billing period ("month")
  - `question_limit` (integer, nullable) - Questions limit (null = unlimited)
  - `features` (jsonb) - Array of feature descriptions
  - `is_active` (boolean) - Whether plan is available for purchase
  - `created_at` (timestamptz) - Creation timestamp
  
  ### `user_subscriptions`
  - `id` (uuid, primary key) - Unique subscription identifier
  - `user_id` (uuid) - Reference to auth.users
  - `plan_id` (uuid) - Reference to subscription_plans
  - `status` (text) - Subscription status: 'active', 'cancelled', 'expired', 'trial'
  - `current_period_start` (timestamptz) - Start of current billing period
  - `current_period_end` (timestamptz) - End of current billing period
  - `cancel_at_period_end` (boolean) - Auto-renewal disabled
  - `cancelled_at` (timestamptz, nullable) - Cancellation timestamp
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `user_questions`
  - `id` (uuid, primary key) - Unique question identifier
  - `user_id` (uuid) - Reference to auth.users (nullable for anonymous)
  - `session_id` (text) - Session identifier for anonymous users
  - `question_text` (text) - The question asked
  - `answer_text` (text, nullable) - AI response
  - `is_free_question` (boolean) - Whether this counted against free limit
  - `created_at` (timestamptz) - Question timestamp

  ### `payment_history`
  - `id` (uuid, primary key) - Unique payment identifier
  - `user_id` (uuid) - Reference to auth.users
  - `subscription_id` (uuid) - Reference to user_subscriptions
  - `amount_rub` (integer) - Amount in rubles
  - `status` (text) - Payment status: 'succeeded', 'failed', 'pending', 'refunded'
  - `payment_method` (text, nullable) - Payment method used
  - `transaction_id` (text, nullable) - External transaction ID
  - `error_message` (text, nullable) - Error details if failed
  - `created_at` (timestamptz) - Payment timestamp

  ## Security
  - RLS enabled on all tables
  - Users can only access their own subscription data
  - Payment history is read-only for users
  - Question tracking respects privacy
  
  ## Important Notes
  1. Free users get 2 questions before paywall
  2. Anonymous users tracked by session_id
  3. Single plan: 199₽/month, unlimited questions
  4. Auto-renewal enabled by default
  5. Cancellation takes effect at period end
*/

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_rub integer NOT NULL,
  billing_period text NOT NULL DEFAULT 'month',
  question_limit integer,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Plans are publicly readable
CREATE POLICY "Plans are publicly readable"
  ON subscription_plans
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'cancelled', 'expired', 'trial'))
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create user_questions table
CREATE TABLE IF NOT EXISTS user_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  question_text text NOT NULL,
  answer_text text,
  is_free_question boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own questions"
  ON user_questions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own questions"
  ON user_questions
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    CASE 
      WHEN auth.uid() IS NOT NULL THEN auth.uid() = user_id
      ELSE session_id IS NOT NULL
    END
  );

-- Create payment_history table
CREATE TABLE IF NOT EXISTS payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  amount_rub integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  transaction_id text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_payment_status CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded'))
);

ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment history"
  ON payment_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert default subscription plan
INSERT INTO subscription_plans (name, price_rub, billing_period, question_limit, features)
VALUES (
  'Базовый',
  199,
  'month',
  NULL,
  '["Безлимитные ответы ИИ", "Приоритетные ответы ИИ", "Поддержка вопросов по 44-ФЗ/223-ФЗ", "История вопросов"]'::jsonb
)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_questions_user_id ON user_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_questions_session_id ON user_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);

-- Create updated_at trigger for user_subscriptions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_subscriptions_updated_at'
  ) THEN
    CREATE TRIGGER update_user_subscriptions_updated_at
      BEFORE UPDATE ON user_subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;