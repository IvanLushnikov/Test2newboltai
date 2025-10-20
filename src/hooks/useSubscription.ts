import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { UserSubscription, SubscriptionPlan, QuestionCount } from '../types/subscription';

export function useSubscription(userId: string | null) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchSubscription();
  }, [userId]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      setSubscription(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  };

  const isActive = subscription?.status === 'active' &&
    new Date(subscription.current_period_end) > new Date();

  return { subscription, loading, error, isActive, refetch: fetchSubscription };
}

export function useQuestionCount(userId: string | null, sessionId: string | null) {
  const [count, setCount] = useState<QuestionCount>({ total: 0, free_used: 0, free_remaining: 2 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestionCount();
  }, [userId, sessionId]);

  const fetchQuestionCount = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('user_questions')
        .select('is_free_question', { count: 'exact' });

      if (userId) {
        query = query.eq('user_id', userId);
      } else if (sessionId) {
        query = query.eq('session_id', sessionId);
      } else {
        setLoading(false);
        return;
      }

      const { count: total, error } = await query;

      if (error) throw error;

      const { count: freeUsed, error: freeError } = await query.eq('is_free_question', true);

      if (freeError) throw freeError;

      setCount({
        total: total || 0,
        free_used: freeUsed || 0,
        free_remaining: Math.max(0, 2 - (freeUsed || 0))
      });
    } catch (err) {
      console.error('Failed to fetch question count:', err);
    } finally {
      setLoading(false);
    }
  };

  return { count, loading, refetch: fetchQuestionCount };
}

export function usePlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_rub', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    } finally {
      setLoading(false);
    }
  };

  return { plans, loading };
}
