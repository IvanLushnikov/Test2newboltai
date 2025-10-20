import React from 'react';
import { Lock } from 'lucide-react';

interface EmptySubscriptionStateProps {
  onSubscribe: () => void;
  onLearnMore: () => void;
}

export function EmptySubscriptionState({ onSubscribe, onLearnMore }: EmptySubscriptionStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6" data-limit-empty>
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Lock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Подписка не активна
        </h3>
        <p className="text-gray-600 mb-6">
          Оформите подписку, чтобы продолжить использовать ИИ Эксперт
        </p>
        <div className="space-y-3">
          <button
            onClick={onSubscribe}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            data-oneoff-click="subscribe-primary"
          >
            Оформить за 199₽/мес
          </button>
          <button
            onClick={onLearnMore}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Подробнее о подписке
          </button>
        </div>
      </div>
    </div>
  );
}
