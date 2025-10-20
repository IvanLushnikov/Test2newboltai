import React from 'react';
import { X, Zap, Clock, Shield, Sparkles, ArrowRight } from 'lucide-react';
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
    <div className="modal-overlay p-4">
      <div
        className="modal-content max-w-lg w-full max-h-[90vh] overflow-y-auto"
        data-ab-variant="paywall-v1"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-primary-50 via-blue-50 to-transparent rounded-t-3xl" />

          <div className="relative p-8">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 tap-scale"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center mb-6">
              <div className="p-3 bg-primary-100 rounded-2xl">
                <Sparkles className="w-8 h-8 text-primary-600" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 text-center mb-3 text-balance">
              Продолжить с ИИ Экспертом
            </h2>

            <p className="text-gray-600 text-center mb-8 text-balance leading-relaxed">
              Получите неограниченный доступ к точным ответам и документам
            </p>

            <div className="bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-200 rounded-2xl p-5 mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-200/20 rounded-full -mr-16 -mt-16" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-primary-900">Бесплатные вопросы</span>
                  <span className="badge badge-primary">
                    Осталось: {freeQuestionsRemaining}
                  </span>
                </div>
                <div className="w-full bg-primary-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                    style={{ width: `${(freeQuestionsRemaining / 2) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {[
                { icon: Zap, text: 'Безлимитные ответы ИИ', color: 'text-primary-600 bg-primary-50' },
                { icon: Clock, text: 'Приоритетные ответы ИИ', color: 'text-primary-600 bg-primary-50' },
                { icon: Shield, text: 'Поддержка 44-ФЗ/223-ФЗ', color: 'text-primary-600 bg-primary-50' }
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
                >
                  <div className={`p-2.5 ${item.color} rounded-xl group-hover:scale-110 transition-transform duration-200`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-gray-700 font-medium flex-1">{item.text}</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
              ))}
            </div>

            {plan && (
              <div className="card-elevated p-6 mb-6">
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900">{plan.price_rub}</span>
                      <span className="text-2xl font-bold text-gray-900">₽</span>
                      <span className="text-gray-500 ml-2 font-medium">/ месяц</span>
                    </div>
                  </div>
                  <div className="badge badge-success">Оптимально</div>
                </div>
                <p className="text-sm text-gray-600">Без ограничений по количеству вопросов</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={onSubscribe}
                className="w-full btn-primary group tap-scale"
                data-cta-click="subscribe-primary"
              >
                <span>Оформить за {plan?.price_rub || 199}₽/мес</span>
                <ArrowRight className="w-5 h-5 ml-2 inline-block group-hover:translate-x-1 transition-transform duration-200" />
              </button>
              <button
                onClick={onClose}
                className="w-full btn-secondary tap-scale"
                data-cta-click="learn-more"
              >
                Подробнее о подписке
              </button>
            </div>

            <div className="mt-6 text-center">
              <a href="#" className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center hover-lift">
                Вопрос по подписке?
                <ArrowRight className="w-4 h-4 ml-1" />
              </a>
            </div>

            <p className="mt-6 text-center text-xs text-gray-500">
              Отменить можно в любой момент
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
