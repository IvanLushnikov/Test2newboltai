import React from 'react';
import { Check, Star, ArrowRight, Sparkles } from 'lucide-react';
import type { SubscriptionPlan } from '../types/subscription';

interface SubscriptionCardProps {
  plan: SubscriptionPlan;
  onSelect: () => void;
  isSelected?: boolean;
}

export function SubscriptionCard({ plan, onSelect, isSelected = false }: SubscriptionCardProps) {
  return (
    <div
      className={`relative card-elevated overflow-hidden hover-lift transition-all duration-300 ${
        isSelected ? 'ring-4 ring-primary-200' : ''
      }`}
      data-plan={plan.id}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-blue-50/30 pointer-events-none" />

      {plan.question_limit === null && (
        <div className="absolute top-0 right-0">
          <div className="bg-gradient-to-br from-success-500 to-success-600 text-white px-4 py-2 rounded-bl-2xl rounded-tr-2xl shadow-soft flex items-center space-x-1">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-semibold">Оптимально</span>
          </div>
        </div>
      )}

      <div className="relative p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 bg-primary-100 rounded-xl">
            <Sparkles className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
        </div>

        <div className="mb-8">
          <div className="flex items-end mb-3">
            <span className="text-5xl font-bold text-gray-900 leading-none">{plan.price_rub}</span>
            <span className="text-3xl font-bold text-gray-900 leading-none">₽</span>
            <span className="text-gray-600 ml-2 mb-1 font-medium">/ месяц</span>
          </div>
          <div className="inline-flex items-center px-3 py-1.5 bg-primary-50 border-2 border-primary-200 rounded-xl">
            <Check className="w-4 h-4 text-primary-600 mr-2" />
            <span className="text-sm font-semibold text-primary-900">
              {plan.question_limit === null ? 'Безлимитные вопросы' : `До ${plan.question_limit} вопросов`}
            </span>
          </div>
        </div>

        <ul className="space-y-4 mb-8" data-benefit-seen>
          {plan.features.map((feature, index) => (
            <li
              key={index}
              className="flex items-start space-x-3 group"
            >
              <div className="p-1.5 bg-success-100 rounded-lg group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
                <Check className="w-4 h-4 text-success-600" />
              </div>
              <span className="text-gray-700 font-medium leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={onSelect}
          className="w-full btn-primary group tap-scale"
          data-cta-select="subscribe"
        >
          <span>Оформить подписку</span>
          <ArrowRight className="w-5 h-5 ml-2 inline-block group-hover:translate-x-1 transition-transform duration-200" />
        </button>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <Shield className="w-4 h-4 text-gray-400" />
            <span>Отменить можно в любой момент</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Shield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
