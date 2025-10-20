import React from 'react';
import { Check } from 'lucide-react';
import type { SubscriptionPlan } from '../types/subscription';

interface SubscriptionCardProps {
  plan: SubscriptionPlan;
  onSelect: () => void;
  isSelected?: boolean;
}

export function SubscriptionCard({ plan, onSelect, isSelected = false }: SubscriptionCardProps) {
  return (
    <div
      className={`bg-white rounded-lg border-2 shadow-sm transition-all ${
        isSelected ? 'border-blue-600' : 'border-gray-200 hover:border-blue-300'
      }`}
      data-plan={plan.id}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
            {plan.question_limit === null && (
              <div className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                Оптимально
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-baseline">
            <span className="text-4xl font-bold text-gray-900">{plan.price_rub}₽</span>
            <span className="text-gray-500 ml-2">в мес</span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {plan.question_limit === null ? 'без ограничений' : `до ${plan.question_limit} вопросов`}
          </div>
        </div>

        <ul className="space-y-3 mb-6" data-benefit-seen>
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={onSelect}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          data-cta-select="subscribe"
        >
          Оформить подписку
        </button>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Фиксированная цена, без ограничений
          </p>
        </div>
      </div>
    </div>
  );
}
