import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ProcurementSession {
  id: string;
  user_id?: string;
  item_name?: string;
  conversation_state: ConversationMessage[];
  selected_ktru_code?: string;
  characteristics: Record<string, any>;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
}

export interface KTRUCode {
  id: string;
  code: string;
  name: string;
  required_characteristics: Characteristic[];
  optional_characteristics: Characteristic[];
  created_at: string;
}

export interface Characteristic {
  name: string;
  type: 'number' | 'select' | 'boolean';
  constraint?: string;
  values: any[];
}

export interface GeneratedDocument {
  id: string;
  session_id: string;
  document_type: 'technical_task' | 'notice' | 'contract' | 'nmck' | 'suppliers';
  content: any;
  created_at: string;
}
