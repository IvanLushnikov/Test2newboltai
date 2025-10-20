export interface SubscriptionPlan {
  id: string;
  name: string;
  price_rub: number;
  billing_period: string;
  question_limit: number | null;
  features: string[];
  is_active: boolean;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
}

export interface UserQuestion {
  id: string;
  user_id: string | null;
  session_id: string | null;
  question_text: string;
  answer_text: string | null;
  is_free_question: boolean;
  created_at: string;
}

export interface PaymentHistory {
  id: string;
  user_id: string;
  subscription_id: string | null;
  amount_rub: number;
  status: 'succeeded' | 'failed' | 'pending' | 'refunded';
  payment_method: string | null;
  transaction_id: string | null;
  error_message: string | null;
  created_at: string;
}

export interface QuestionCount {
  total: number;
  free_used: number;
  free_remaining: number;
}
