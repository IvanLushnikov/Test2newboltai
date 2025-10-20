import React from 'react';
import { X, Zap, Clock, Shield } from 'lucide-react';
import type { SubscriptionPlan } from '../types/subscription';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  freeQuestionsRemaining: number;
  plan: SubscriptionPlan | null;
}

export function PaywallModal({ isOpen, onClose, onSubscribe, freeQuestionsRemaining, plan }: PaywallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-sm max-w-md w-full" data-ab-variant="paywall-v1">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Продолжить с ИИ Экспертом</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Ещё больше точных ответов и примеров документов
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="text-sm text-blue-800">
                Осталось бесплатных: <span className="font-bold">{freeQuestionsRemaining}</span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start space-x-3">
                <Zap className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Безлимитные ответы ИИ</span>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Приоритетные ответы ИИ</span>
              </div>
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Поддержка вопросов по 44-ФЗ/223-ФЗ</span>
              </div>
            </div>

            {plan && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-gray-900">{plan.price_rub}₽</span>
                  <span className="text-sm text-gray-500">в мес</span>
                </div>
                <div className="text-xs text-gray-500">без ограничений</div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={onSubscribe}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              data-cta-click="subscribe-primary"
            >
              Оформить за {plan?.price_rub || 199}₽/мес
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              data-cta-click="learn-more"
            >
              Подробнее о подписке
            </button>
          </div>

          <div className="mt-4 text-center">
            <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
              Вопрос по подписке?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
