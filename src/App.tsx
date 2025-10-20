import React, { useState, useEffect } from 'react';
import { MessageSquare, Download, Save, FileText, Calculator, Building, CheckCircle, AlertCircle, Send, Plus, User } from 'lucide-react';
import { PaywallModal } from './components/PaywallModal';
import { SubscriptionCard } from './components/SubscriptionCard';
import { PaymentSheet } from './components/PaymentSheet';
import { SubscriptionStatus, QuestionCounter } from './components/SubscriptionStatus';
import { SubscriptionManagement } from './components/SubscriptionManagement';
import { EmptySubscriptionState } from './components/EmptySubscriptionState';
import { Tooltip } from './components/Tooltip';
import { useSubscription, useQuestionCount, usePlans } from './hooks/useSubscription';
import { supabase } from './lib/supabase';


interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  data?: any;
}

interface ProcurementData {
  productName: string;
  ktruCode?: string;
  characteristics?: Record<string, string>;
  ooz?: string;
  nmck?: {
    amount: number;
    method: string;
    region: string;
  };
  documents?: {
    ooz: { status: 'ready' | 'draft'; content: string };
    nmck: { status: 'ready' | 'draft'; content: string };
    contract: { status: 'partial' | 'ready'; content: string };
    doc1: { status: 'ready'; content: string };
    doc2: { status: 'ready'; content: string };
  };
}

const mockKtruCodes = [
  { code: '84.24.11.000', name: 'Услуги органов охраны правопорядка', characteristics: { 'Тип услуги': ['Охрана объектов', 'Патрулирование', 'Консультации'], 'Режим работы': ['24/7', 'По графику', 'По вызову'] } },
  { code: '21.20.10.232', name: 'Анальгетики', characteristics: { 'Форма выпуска': ['Таблетки', 'Капсулы', 'Раствор'], 'Дозировка': ['500мг', '200мг', '100мг'] } },
  { code: '01.22.12.000', name: 'Бананы', characteristics: { 'Товарный класс': ['Экстра', 'Первый', 'Второй'], 'Упаковка': ['Коробки', 'Мешки', 'Без упаковки'] } }
];

function App() {
  const [currentView, setCurrentView] = useState<'planning' | 'chat' | 'results' | 'subscription' | 'account'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentStep, setCurrentStep] = useState<'input' | 'codes' | 'characteristics' | 'ooz' | 'nmck' | 'complete'>('input');
  const [procurementData, setProcurementData] = useState<ProcurementData>({
    productName: '',
    documents: {
      ooz: { status: 'draft', content: '' },
      nmck: { status: 'draft', content: '' },
      contract: { status: 'partial', content: '' },
      doc1: { status: 'ready', content: 'Техническое задание (типовое)' },
      doc2: { status: 'ready', content: 'Проект контракта (типовой)' }
    }
  });
  const [savedProcurements] = useState([
    { id: '1', name: 'Услуги охраны офиса', date: '2025-01-15', status: 'draft' },
    { id: '2', name: 'Канцелярские товары', date: '2025-01-14', status: 'ready' },
  ]);

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
    if (currentView === 'chat' && messages.length === 0) {
      setTimeout(() => {
        addMessage('ai', 'Привет, я Эксперт по закону! Это бета-версия ИИ Эксперта по 44-ФЗ и 223-ФЗ. Мы предоставляем изучающим систему закупок, ваш опыт с помощью наших ответов ИИ.');
        addMessage('system', 'Можете задавать ответы по ведению закупок на основании 44-ФЗ, 223-ФЗ закона о контрактной системе. Вопрос по подписке?');
      }, 300);
    }
  }, [currentView]);

  const addMessage = (type: 'user' | 'ai' | 'system', content: string, data?: any) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      data
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

  const startAIProcurement = () => {
    if (!isActive && count.free_remaining <= 0) {
      setCurrentView('subscription');
      return;
    }

    setCurrentView('chat');
    setMessages([]);
    setCurrentStep('input');
    setProcurementData({
      productName: '',
      documents: {
        ooz: { status: 'draft', content: '' },
        nmck: { status: 'draft', content: '' },
        contract: { status: 'partial', content: '' },
        doc1: { status: 'ready', content: 'Техническое задание (типовое)' },
        doc2: { status: 'ready', content: 'Проект контракта (типовой)' }
      }
    });

    setTimeout(() => {
      addMessage('ai', 'Добро пожаловать в ИИ-помощник по подготовке закупок! Введите наименование или описание товара/услуги, которую необходимо закупить.');
      addMessage('system', 'Например: "бумага для офисной техники", "услуги охраны", "компьютерная техника"');
    }, 500);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    if (!isActive && count.free_remaining <= 0) {
      setShowPaywall(true);
      return;
    }

    const isFreeQuestion = !isActive && count.free_remaining > 0;
    await trackQuestion(inputValue, isFreeQuestion);

    addMessage('user', inputValue);
    const userInput = inputValue.toLowerCase();
    setInputValue('');

    if (!isActive && count.free_remaining === 1) {
      setTimeout(() => setShowPaywall(true), 2000);
    }

    setTimeout(() => {
      if (currentStep === 'input') {
        setProcurementData(prev => ({ ...prev, productName: inputValue }));

        const matches = mockKtruCodes.filter(code =>
          userInput.includes('охран') ? code.name.includes('охран') :
          userInput.includes('анальг') || userInput.includes('таблет') || userInput.includes('лекарств') ? code.name.includes('нальгетики') :
          userInput.includes('банан') || userInput.includes('фрукт') ? code.name.includes('анан') :
          false
        );

        if (matches.length === 0) {
          addMessage('ai', 'По вашему запросу не найдено подходящих кодов КТРУ/ОКПД2. Попробуйте переформулировать запрос или уточнить категорию товара.');
          addMessage('system', 'Примеры корректных запросов: "канцелярские товары", "медицинские препараты", "строительные материалы"');
        } else if (matches.length === 1) {
          setProcurementData(prev => ({
            ...prev,
            ktruCode: matches[0].code,
            characteristics: { 'Основные характеристики': ['Стандартные'] }
          }));
          addMessage('ai', `Найден код КТРУ: ${matches[0].code} - ${matches[0].name}`);
          setCurrentStep('ooz');
          setTimeout(() => generateOOZ(matches[0]), 1000);
        } else {
          setCurrentStep('characteristics');
          addMessage('ai', `Найдено ${matches.length} подходящих кода. Уточните характеристики для точного определения:`);

          const allCharacteristics: Record<string, Set<string>> = {};
          matches.forEach(match => {
            Object.entries(match.characteristics).forEach(([key, values]) => {
              if (!allCharacteristics[key]) allCharacteristics[key] = new Set();
              values.forEach(value => allCharacteristics[key].add(value));
            });
          });

          Object.entries(allCharacteristics).forEach(([key, valueSet]) => {
            if (valueSet.size > 1) {
              addMessage('system', `${key}: ${Array.from(valueSet).join(', ')}`);
            }
          });

          addMessage('ai', 'Выберите подходящие характеристики, например: "охрана объектов, режим работы 24/7"');
        }
      } else if (currentStep === 'characteristics') {
        const selectedCode = mockKtruCodes[0];
        setProcurementData(prev => ({
          ...prev,
          ktruCode: selectedCode.code,
          characteristics: { 'Выбранные характеристики': ['Охрана объектов', '24/7'] }
        }));

        addMessage('ai', `Определен код КТРУ: ${selectedCode.code} - ${selectedCode.name}`);
        setCurrentStep('ooz');
        setTimeout(() => generateOOZ(selectedCode), 1000);
      }
    }, 1000);
  };

  const generateOOZ = (selectedCode: any) => {
    const oozContent = `Наименование: ${procurementData.productName}
Код КТРУ: ${selectedCode.code}
Описание: ${selectedCode.name}

Технические характеристики:
- Соответствие требованиям ГОСТ
- Сертификация согласно российским стандартам
- Гарантийные обязательства исполнителя`;

    setProcurementData(prev => ({
      ...prev,
      ooz: oozContent,
      documents: {
        ...prev.documents!,
        ooz: { status: 'ready', content: oozContent }
      }
    }));

    addMessage('ai', 'Описание объекта закупки (ООЗ) сформировано автоматически.');
    addMessage('system', oozContent);
    setCurrentStep('nmck');

    setTimeout(() => calculateNMCK(), 1500);
  };

  const calculateNMCK = () => {
    const nmckData = {
      amount: Math.floor(Math.random() * 500000) + 100000,
      method: 'Метод сопоставимых рыночных цен',
      region: 'Московская область'
    };

    setProcurementData(prev => ({
      ...prev,
      nmck: nmckData,
      documents: {
        ...prev.documents!,
        nmck: { status: 'ready', content: `НМЦК: ${nmckData.amount.toLocaleString()} руб.\nМетод расчета: ${nmckData.method}\nРегион: ${nmckData.region}` }
      }
    }));

    addMessage('ai', `Начальная максимальная цена контракта (НМЦК) рассчитана: ${nmckData.amount.toLocaleString()} руб.`);
    addMessage('system', `Расчет по региону: ${nmckData.region}\nМетод: ${nmckData.method}`);

    setCurrentStep('complete');
    setTimeout(() => {
      addMessage('ai', 'Пакет документов готов! Переходим к итоговому экрану.');
      setCurrentView('results');
    }, 2000);
  };

  const handleSave = () => {
    addMessage('system', 'Закупка сохранена в "Планирование закупки"');
    setTimeout(() => {
      setCurrentView('planning');
    }, 1000);
  };

  const handleDownloadAll = () => {
    alert('Загрузка пакета документов...');
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

      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: plan.id,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false
        })
        .select()
        .single();

      if (subError) throw subError;

      await supabase.from('payment_history').insert({
        user_id: userId,
        subscription_id: subData.id,
        amount_rub: plan.price_rub,
        status: 'succeeded',
        payment_method: 'card'
      });

      setShowPayment(false);
      setShowPaywall(false);
      refetchSubscription();
      alert('Подписка успешно оформлена!');
    } catch (err) {
      console.error('Failed to create subscription:', err);
      alert('Ошибка при оформлении подписки');
    }
  };

  const PlanningView = () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Эконом-Эксперт Online</h1>
                <div className="text-sm text-gray-500">Планирование закупки</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={startAIProcurement}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Сделать закупку с ИИ</span>
              </button>
              <button
                onClick={() => setCurrentView('account')}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Аккаунт"
              >
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Планирование закупок</h2>
          <p className="text-gray-600">Управление процессом планирования и подготовки закупок</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Активные закупки</p>
                <p className="text-3xl font-bold text-gray-900">12</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Общая НМЦК</p>
                <p className="text-3xl font-bold text-gray-900">2.4М ₽</p>
              </div>
              <Calculator className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Готово к публикации</p>
                <p className="text-3xl font-bold text-gray-900">8</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Список закупок</h3>
              <button className="text-blue-600 hover:text-blue-700 flex items-center space-x-1">
                <Plus className="w-4 h-4" />
                <span>Новая закупка</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Наименование</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата создания</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {savedProcurements.map(procurement => (
                  <tr key={procurement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{procurement.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{procurement.date}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        procurement.status === 'ready'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {procurement.status === 'ready' ? 'Готово' : 'Черновик'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-blue-600 hover:text-blue-700 mr-3">Редактировать</button>
                      <button className="text-gray-600 hover:text-gray-700">Скачать</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );

  const ChatView = () => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <button onClick={() => setCurrentView('planning')} className="text-gray-600 hover:text-gray-900">
              ← Вернуться
            </button>
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h1 className="text-lg font-semibold text-gray-900">ИИ Эксперт</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {isActive ? (
              <SubscriptionStatus subscription={subscription} onManage={() => setShowManagement(true)} />
            ) : (
              <QuestionCounter freeRemaining={count.free_remaining} />
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map(message => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-3xl rounded-lg px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.type === 'system'
                  ? 'bg-gray-100 text-gray-700 border'
                  : 'bg-white text-gray-900 border shadow-sm'
              }`}>
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.type !== 'user' && (
                  <div className="text-xs text-gray-500 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Введите сообщение..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      </div>
    </div>
  );

  const ResultsView = () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <button onClick={() => setCurrentView('chat')} className="text-gray-600 hover:text-gray-900">
              ← Вернуться к чату
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Результаты</h1>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-green-700 transition-colors">
              <Save className="w-4 h-4" />
              <span>Сохранить</span>
            </button>
            <button onClick={handleDownloadAll} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              <span>Скачать всё</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Пакет документов готов</h2>
          <p className="text-gray-600">Наименование: {procurementData.productName}</p>
          <p className="text-gray-600">Код КТРУ: {procurementData.ktruCode}</p>
          {procurementData.nmck && (
            <p className="text-gray-600">НМЦК: {procurementData.nmck.amount.toLocaleString()} руб.</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">ООЗ</h3>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Готово</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Автоматически сформировано</p>
              <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                Скачать ООЗ
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Calculator className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">НМЦК</h3>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Готово</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {procurementData.nmck?.amount.toLocaleString()} ₽
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {procurementData.nmck?.method}
              </p>
              <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                Скачать расчет
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-gray-900">Проект контракта</h3>
                </div>
                <div className="flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span className="text-xs text-orange-600 font-medium">Заполните</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Требуется доработка</p>
              <button className="w-full bg-orange-100 text-orange-700 py-2 px-4 rounded-lg hover:bg-orange-200 transition-colors">
                Перейти к заполнению
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  const SubscriptionView = () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button onClick={() => setCurrentView('planning')} className="text-gray-600 hover:text-gray-900">
                ← Назад
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Подписка</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {isActive ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Подписка активна</h2>
            <p className="text-gray-600 mb-6">Продление: {new Date(subscription!.current_period_end).toLocaleDateString('ru-RU')}</p>
            <button
              onClick={() => setShowManagement(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Управление подпиской
            </button>
          </div>
        ) : count.free_remaining > 0 ? (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Выберите подписку</h2>
              <p className="text-gray-600">Фиксированная цена, без ограничений</p>
            </div>

            <div className="flex justify-center">
              {plans.length > 0 ? (
                <div className="w-full max-w-md">
                  <SubscriptionCard
                    plan={plans[0]}
                    onSelect={() => {
                      setSelectedPlanId(plans[0].id);
                      setShowPayment(true);
                    }}
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Загрузка планов...</p>
                </div>
              )}
            </div>

            <div className="mt-8 text-center">
              <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
                <span>Без ограничений</span>
                <Tooltip content="Фиксированная цена в месяц. Можно отменить в любой момент." />
              </div>
            </div>
          </div>
        ) : (
          <EmptySubscriptionState
            onSubscribe={handleSubscribeClick}
            onLearnMore={() => {}}
          />
        )}
      </main>
    </div>
  );

  const AccountView = () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button onClick={() => setCurrentView('planning')} className="text-gray-600 hover:text-gray-900">
                ← Назад
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Аккаунт</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Информация о подписке</h2>

          {isActive ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Статус:</span>
                <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                  Активна
                </span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">План:</span>
                <span className="font-medium text-gray-900">{subscription?.plan?.name || 'Базовый'}</span>
              </div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-gray-600">Продление:</span>
                <span className="font-medium text-gray-900">
                  {new Date(subscription!.current_period_end).toLocaleDateString('ru-RU')}
                </span>
              </div>
              <button
                onClick={() => setShowManagement(true)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Управление подпиской
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-6">У вас нет активной подписки</p>
              <button
                onClick={() => setCurrentView('subscription')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Оформить подписку
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Использование</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Всего вопросов:</span>
              <span className="font-medium text-gray-900">{count.total}</span>
            </div>
            {!isActive && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Бесплатных осталось:</span>
                <span className="font-medium text-gray-900">{count.free_remaining}</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );

  return (
    <div className="font-sans">
      {currentView === 'planning' && <PlanningView />}
      {currentView === 'chat' && <ChatView />}
      {currentView === 'results' && <ResultsView />}
      {currentView === 'subscription' && <SubscriptionView />}
      {currentView === 'account' && <AccountView />}

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribe={() => {
          setShowPaywall(false);
          setCurrentView('subscription');
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
