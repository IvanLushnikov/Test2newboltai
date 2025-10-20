import React from 'react';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import type { UserSubscription } from '../types/subscription';

interface SubscriptionStatusProps {
  subscription: UserSubscription | null;
  onManage: () => void;
}

export function SubscriptionStatus({ subscription, onManage }: SubscriptionStatusProps) {
  if (!subscription || subscription.status !== 'active') {
    return null;
  }

  const endDate = new Date(subscription.current_period_end);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysUntilExpiry <= 7 && subscription.cancel_at_period_end;

  return (
    <div
      className="bg-white border rounded-lg px-4 py-2 flex items-center justify-between shadow-sm"
      data-subscription-status-view
    >
      <div className="flex items-center space-x-3">
        {isExpiringSoon ? (
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
        ) : (
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
        )}
        <div>
          <div className="text-sm font-medium text-gray-900">
            {isExpiringSoon ? `Истекает через ${daysUntilExpiry} дн.` : 'Подписка активна'}
          </div>
          <div className="text-xs text-gray-500">
            {subscription.cancel_at_period_end ? (
              <>Автопродление выключено</>
            ) : (
              <>до {endDate.toLocaleDateString('ru-RU')}</>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={onManage}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        data-manage-subscription
      >
        Управление
      </button>
    </div>
  );
}

interface QuestionCounterProps {
  freeRemaining: number;
}

export function QuestionCounter({ freeRemaining }: QuestionCounterProps) {
  if (freeRemaining <= 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center space-x-2">
      <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
      <span className="text-sm text-blue-800">
        Осталось бесплатных: <span className="font-bold">{freeRemaining}</span>
      </span>
    </div>
  );
}
