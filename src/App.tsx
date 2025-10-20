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
  const [sessionId] = useState<string>(() => {
    const id = `session-${Date.now()}`;
    console.log('🆔 Новая сессия:', id);
    return id;
  });

  const { subscription, isActive, refetch: refetchSubscription } = useSubscription(userId);
  const { count, refetch: refetchQuestionCount } = useQuestionCount(userId, sessionId);
  const { plans } = usePlans();

  useEffect(() => {
    console.log('📊 Текущий статус:', {
      userId,
      sessionId,
      isActive,
      count,
      plans: plans.length
    });
  }, [count, isActive]);

  const [showPaywall, setShowPaywall] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];


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

    console.log('🔍 Проверка лимита:', { isActive, free_remaining: count.free_remaining, free_used: count.free_used });

    // Проверяем ДО отправки сообщения
    if (!isActive && count.free_remaining <= 0) {
      console.log('❌ Лимит исчерпан, показываем paywall');
      setShowPaywall(true);
      return;
    }

    const userMessage = inputValue.trim();
    const currentQuestionNumber = count.free_used + 1;
    const willRemainingBeZero = count.free_remaining - 1 <= 0;

    console.log(`📝 Отправка вопроса #${currentQuestionNumber}`, {
      willRemainingBeZero,
      currentRemaining: count.free_remaining
    });

    addMessage('user', userMessage);
    setInputValue('');

    // Трекаем вопрос
    await trackQuestion(userMessage, !isActive);

    // Показываем ответ AI
    setTimeout(() => {
      addMessage('ai', 'Похоже, ваш вопрос не связан с госзакупками или нормативные документы по нему отсутствуют в моей базе.');
    }, 1000);

    // Если это был последний бесплатный вопрос - показываем paywall
    if (!isActive && willRemainingBeZero) {
      console.log('⚠️ Последний бесплатный вопрос исчерпан, показываем paywall через 2 сек');
      setTimeout(() => {
        console.log('💳 Открываем PaywallModal');
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
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F8F9', display: 'flex', flexDirection: 'column' }}>
      {/* Header - точная копия */}
      <header style={{
        backgroundColor: '#fff',
        padding: '12px 24px 16px',
        borderBottom: '1px solid #DCDFE4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h1 style={{
          fontFamily: 'Roboto, sans-serif',
          fontSize: '24px',
          fontWeight: 700,
          lineHeight: '32px',
          color: '#091e42',
          margin: 0
        }}>ИИ Эксперт по закону</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Free Questions Counter - только если нет активной подписки */}
          {!isActive && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: count.free_remaining > 0 ? '#e9f2ff' : '#ffe5e5',
              borderRadius: '6px',
              border: `2px solid ${count.free_remaining > 0 ? '#0c66e4' : '#dc3545'}`
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: count.free_remaining > 0 ? '#0c66e4' : '#dc3545',
                animation: count.free_remaining === 0 ? 'pulse 2s infinite' : 'none'
              }} />
              <span style={{
                fontSize: '14px',
                color: '#091e42',
                fontWeight: 600
              }}>
                {count.free_remaining > 0
                  ? `Осталось ${count.free_remaining} из 2 бесплатных вопросов`
                  : '❌ Лимит исчерпан - нужна подписка'}
              </span>
            </div>
          )}

          {/* Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsShortAnswer(!isShortAnswer)}
              style={{
                position: 'relative',
                display: 'inline-flex',
                height: '20px',
                width: '36px',
                alignItems: 'center',
                borderRadius: '10px',
                backgroundColor: isShortAnswer ? '#0c66e4' : '#8590A2',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span style={{
                display: 'inline-block',
                height: '14px',
                width: '14px',
                transform: isShortAnswer ? 'translateX(19px)' : 'translateX(3px)',
                borderRadius: '50%',
                backgroundColor: '#fff',
                transition: 'transform 0.2s'
              }} />
            </button>
            <span style={{
              fontSize: '14px',
              color: '#091e42',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 400
            }}>
              Краткий ответ
              <HelpCircle style={{ width: '16px', height: '16px', color: '#1d7afc' }} />
            </span>
          </div>

          {/* History Button */}
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              border: '1px solid #0c66e4',
              color: '#0c66e4',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e9f2ff'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <MessageCircle style={{ width: '20px', height: '20px' }} />
            <span>История</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Chat Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  padding: '8px 12px',
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: '20px',
                  color: '#091e42'
                }}>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.content}</p>
                  {message.type === 'ai' && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '8px'
                    }}>
                      <button
                        style={{
                          padding: '4px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          borderRadius: '4px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F2F4'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <ThumbsUp style={{ width: '20px', height: '20px', color: '#44546f' }} />
                      </button>
                      <button
                        style={{
                          padding: '4px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          borderRadius: '4px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F2F4'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <ThumbsDown style={{ width: '20px', height: '20px', color: '#44546f' }} />
                      </button>
                      <button
                        style={{
                          padding: '4px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          borderRadius: '4px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F2F4'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Copy style={{ width: '16px', height: '16px', color: '#44546f' }} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div style={{
          borderTop: '1px solid #DCDFE4',
          backgroundColor: '#fff',
          padding: '16px 12px'
        }}>
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Как вам помочь?"
              style={{
                flex: 1,
                padding: '8px',
                height: '36px',
                border: '1px solid #8590A2',
                borderRadius: '4px',
                fontSize: '16px',
                fontFamily: 'Roboto, sans-serif',
                color: '#091e42',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0c66e4'}
              onBlur={(e) => e.target.style.borderColor = '#8590A2'}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              style={{
                backgroundColor: inputValue.trim() ? '#0c66e4' : '#F7F8F9',
                color: inputValue.trim() ? '#fff' : '#758195',
                padding: '8px',
                height: '36px',
                width: '36px',
                borderRadius: '4px',
                border: 'none',
                cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                if (inputValue.trim()) e.currentTarget.style.backgroundColor = '#0055cc';
              }}
              onMouseLeave={(e) => {
                if (inputValue.trim()) e.currentTarget.style.backgroundColor = '#0c66e4';
              }}
            >
              <Send style={{ width: '20px', height: '20px' }} />
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
