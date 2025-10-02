/*
  # AI Procurement Assistant - Initial Schema

  1. New Tables
    - `procurement_sessions`
      - `id` (uuid, primary key) - Unique session identifier
      - `user_id` (uuid) - User identifier (nullable for demo)
      - `item_name` (text) - What user wants to buy
      - `conversation_state` (jsonb) - Current conversation state and history
      - `selected_ktru_code` (text) - Final selected KTRU code
      - `characteristics` (jsonb) - Collected characteristics
      - `status` (text) - Session status (active, completed, cancelled)
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `ktru_codes`
      - `id` (uuid, primary key) - Unique identifier
      - `code` (text, unique) - KTRU code
      - `name` (text) - Item name
      - `required_characteristics` (jsonb) - Required characteristics with constraints
      - `optional_characteristics` (jsonb) - Optional characteristics
      - `created_at` (timestamptz) - Creation timestamp

    - `generated_documents`
      - `id` (uuid, primary key) - Document identifier
      - `session_id` (uuid, foreign key) - Related session
      - `document_type` (text) - Type of document (technical_task, notice, contract, nmck)
      - `content` (jsonb) - Document content
      - `created_at` (timestamptz) - Generation timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated and public access (demo mode)

  3. Indexes
    - Add indexes for efficient querying
*/

-- Create procurement_sessions table
CREATE TABLE IF NOT EXISTS procurement_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  item_name text,
  conversation_state jsonb DEFAULT '[]'::jsonb,
  selected_ktru_code text,
  characteristics jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ktru_codes table
CREATE TABLE IF NOT EXISTS ktru_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  required_characteristics jsonb DEFAULT '[]'::jsonb,
  optional_characteristics jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create generated_documents table
CREATE TABLE IF NOT EXISTS generated_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES procurement_sessions(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  content jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_procurement_sessions_status ON procurement_sessions(status);
CREATE INDEX IF NOT EXISTS idx_procurement_sessions_created_at ON procurement_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ktru_codes_code ON ktru_codes(code);
CREATE INDEX IF NOT EXISTS idx_generated_documents_session_id ON generated_documents(session_id);

-- Enable Row Level Security
ALTER TABLE procurement_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ktru_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

-- Policies for procurement_sessions (allow public access for demo)
CREATE POLICY "Allow public to read own sessions"
  ON procurement_sessions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public to insert sessions"
  ON procurement_sessions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to update own sessions"
  ON procurement_sessions FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Policies for ktru_codes (public read access)
CREATE POLICY "Allow public to read KTRU codes"
  ON ktru_codes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public to insert KTRU codes"
  ON ktru_codes FOR INSERT
  TO public
  WITH CHECK (true);

-- Policies for generated_documents (public access)
CREATE POLICY "Allow public to read documents"
  ON generated_documents FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public to insert documents"
  ON generated_documents FOR INSERT
  TO public
  WITH CHECK (true);

-- Insert sample KTRU data for servers
INSERT INTO ktru_codes (code, name, required_characteristics, optional_characteristics) VALUES
(
  '26.20.14.000-00000190',
  'Сервер',
  '[
    {
      "name": "Максимальное количество процессоров",
      "type": "number",
      "constraint": ">=",
      "values": [1, 2, 4, 8]
    },
    {
      "name": "Количество установленных процессоров",
      "type": "number",
      "constraint": ">=",
      "values": [1, 2, 4, 8]
    }
  ]'::jsonb,
  '[
    {
      "name": "Максимальный общий поддерживаемый объем оперативной памяти сервера",
      "type": "number",
      "values": [4, 8, 12, 16, 32, 64, 128, 192, 256, 384, 512, 768, 1024, 1536, 3048, 4096, 6144, 8192]
    },
    {
      "name": "Тип сервера",
      "type": "select",
      "values": ["Лезвие", "Отдельностоящий", "Стоечный"]
    },
    {
      "name": "Наличие выделенных интерфейсов для объединения серверных шасси в кластер",
      "type": "boolean",
      "values": ["Да", "Нет"]
    },
    {
      "name": "Количество ядер каждого установленного процессора",
      "type": "number",
      "values": [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 38, 40, 48]
    },
    {
      "name": "Аппаратная поддержка виртуализации",
      "type": "boolean",
      "values": ["Да", "Нет", "Опционально"]
    }
  ]'::jsonb
)
ON CONFLICT (code) DO NOTHING;
