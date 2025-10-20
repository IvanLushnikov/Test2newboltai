import React, { useState, useEffect } from 'react';
import { HelpCircle, MessageCircle, ThumbsUp, ThumbsDown, Copy, Send } from 'lucide-react';
import { PaywallModal } from './components/PaywallModal';
import { PaymentSheet } from './components/PaymentSheet';
import { SubscriptionManagement } from './components/SubscriptionManagement';
import { useSubscription, useQuestionCount, usePlans } from './hooks/useSubscription';
import { supabase } from './lib/supabase';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isShortAnswer, setIsShortAnswer] = useState(false);

  const [userId] = useState<string | null>('demo-user-id');
  const [sessionId] = useState<string>(() => `session-${Date.now()}`);

  const { subscription, isActive, refetch: refetchSubscription } = useSubscription(userId);
  const { count, refetch: refetchQuestionCount } = useQuestionCount(userId, sessionId);
  const { plans } = usePlans();

  const [showPaywall, setShowPaywall] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  useEffect(() => {
    if (messages.length === 0) {
      setTimeout(() => {
        addMessage('ai', 'Это бета версия ИИ Эксперта по закону. Мы продолжаем улучшать систему - вы можете оценивать ответы с помощью лайков/дизлайков, чтобы помочь нам стать лучше.');
      }, 300);
    }
  }, []);

  const addMessage = (type: 'user' | 'ai', content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const trackQuestion = async (questionText: string, isFree: boolean) => {
    try {
      await supabase.from('user_questions').insert({
        user_id: userId,
        session_id: sessionId,
        question_text: questionText,
        is_free_question: isFree
      });
      refetchQuestionCount();
    } catch (err) {
      console.error('Failed to track question:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    if (!isActive && count.free_remaining <= 0) {
      setShowPaywall(true);
      return;
    }

    const userMessage = inputValue.trim();
    addMessage('user', userMessage);
    setInputValue('');

    await trackQuestion(userMessage, !isActive);

    setTimeout(() => {
      addMessage('ai', 'Похоже, ваш вопрос не связан с госзакупками или нормативные документы по нему отсутствуют в моей базе.');
    }, 1000);

    if (!isActive && count.free_remaining - 1 <= 0) {
      setTimeout(() => {
        setShowPaywall(true);
      }, 2000);
    }
  };

  const handleSubscribeClick = () => {
    if (plans.length > 0) {
      setSelectedPlanId(plans[0].id);
      setShowPayment(true);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      const plan = plans[0];
      if (!plan || !userId) return;

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: plan.id,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false
        });

      refetchSubscription();
      setShowPayment(false);
    } catch (err) {
      console.error('Failed to create subscription:', err);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">ИИ Эксперт по закону</h1>

          <div className="flex items-center gap-4">
            {/* Toggle Switch */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsShortAnswer(!isShortAnswer)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isShortAnswer ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isShortAnswer ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700 flex items-center gap-1">
                Краткий ответ
                <HelpCircle className="w-4 h-4 text-blue-600" />
              </span>
            </div>

            {/* History Button */}
            <button className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">История</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="max-w-2xl w-full bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-start gap-4">
                  <MessageCircle className="w-8 h-8 text-blue-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Привет, я Эксперт по закону</h3>
                    <p className="text-sm text-gray-700">
                      Это бета версия ИИ Эксперта по 44-ФЗ и 223-ФЗ. Мы продолжаем улучшать систему -
                      вы можете оценивать ответы с помощью лайков/дизлайков, чтобы помочь нам стать лучше.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl rounded-2xl px-4 py-3 ${
                      message.type === 'user'
                        ? 'bg-white border border-gray-200 rounded-tr-sm'
                        : 'bg-white border border-gray-200 rounded-tl-sm'
                    }`}
                  >
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{message.content}</p>
                    {message.type === 'ai' && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                          <ThumbsUp className="w-5 h-5 text-gray-500" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                          <ThumbsDown className="w-5 h-5 text-gray-500" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                          <Copy className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-6">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Как вам помочь?"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>

      {/* Modals */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribe={() => {
          setShowPaywall(false);
          handleSubscribeClick();
        }}
        freeQuestionsRemaining={count.free_remaining}
        plan={plans[0] || null}
      />

      {selectedPlan && (
        <PaymentSheet
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          plan={selectedPlan}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <SubscriptionManagement
        isOpen={showManagement}
        onClose={() => setShowManagement(false)}
        subscription={subscription}
        onUpdate={() => {
          refetchSubscription();
          setShowManagement(false);
        }}
      />
    </div>
  );
}

export default App;
