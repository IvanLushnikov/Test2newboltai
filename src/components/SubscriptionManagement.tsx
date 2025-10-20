import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, AlertCircle, CheckCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserSubscription, PaymentHistory } from '../types/subscription';

interface SubscriptionManagementProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: UserSubscription | null;
  onUpdate: () => void;
}

export function SubscriptionManagement({ isOpen, onClose, subscription, onUpdate }: SubscriptionManagementProps) {
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && subscription) {
      fetchPaymentHistory();
    }
  }, [isOpen, subscription]);

  const fetchPaymentHistory = async () => {
    if (!subscription) return;

    try {
      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('subscription_id', subscription.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      console.error('Failed to fetch payment history:', err);
    }
  };

  const handleCancelAutoRenew = async () => {
    if (!subscription) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          cancel_at_period_end: true,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) throw error;
      onUpdate();
    } catch (err) {
      console.error('Failed to cancel auto-renewal:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableAutoRenew = async () => {
    if (!subscription) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          cancel_at_period_end: false,
          cancelled_at: null
        })
        .eq('id', subscription.id);

      if (error) throw error;
      onUpdate();
    } catch (err) {
      console.error('Failed to enable auto-renewal:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !subscription) return null;

  const plan = subscription.plan;
  const endDate = new Date(subscription.current_period_end);

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Управление подпиской</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Текущий план</h3>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                subscription.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {subscription.status === 'active' ? 'Активна' : 'Неактивна'}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">План:</span>
                <span className="font-medium text-gray-900">{plan?.name || 'Базовый'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Цена:</span>
                <span className="font-medium text-gray-900">{plan?.price_rub || 199}₽/мес</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Следующее списание:</span>
                <span className="font-medium text-gray-900">{endDate.toLocaleDateString('ru-RU')}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-start space-x-3 mb-4">
              <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Автопродление</h3>
                <p className="text-sm text-gray-600">
                  {subscription.cancel_at_period_end
                    ? 'Автопродление выключено. Подписка истечет ' + endDate.toLocaleDateString('ru-RU')
                    : 'Подписка будет автоматически продлеваться каждый месяц'}
                </p>
              </div>
            </div>
            {subscription.cancel_at_period_end ? (
              <button
                onClick={handleEnableAutoRenew}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                data-plan-change
              >
                {loading ? 'Обработка...' : 'Включить автопродление'}
              </button>
            ) : (
              <button
                onClick={handleCancelAutoRenew}
                disabled={loading}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                data-cancel
              >
                {loading ? 'Обработка...' : 'Отменить автопродление'}
              </button>
            )}
          </div>

          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">История списаний</h3>
              </div>
            </div>

            {payments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">Нет списаний</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center space-x-3">
                      {payment.status === 'succeeded' ? (
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.amount_rub}₽
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(payment.created_at).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${
                      payment.status === 'succeeded'
                        ? 'text-green-600'
                        : payment.status === 'failed'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}>
                      {payment.status === 'succeeded' ? 'Успешно' :
                       payment.status === 'failed' ? 'Ошибка' :
                       payment.status === 'pending' ? 'Обработка' : 'Возврат'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
