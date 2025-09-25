import React, { useState } from 'react';
import { MessageSquare, Download, Save, FileText, Calculator, Building, CheckCircle, AlertCircle, Send, Plus } from 'lucide-react';

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
  const [currentView, setCurrentView] = useState<'planning' | 'chat' | 'results'>('planning');
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

  const startAIProcurement = () => {
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

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    addMessage('user', inputValue);
    const userInput = inputValue.toLowerCase();
    setInputValue('');

    // Simulate AI processing
    setTimeout(() => {
      if (currentStep === 'input') {
        setProcurementData(prev => ({ ...prev, productName: inputValue }));
        
        // Find matching codes
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
          
          // Show characteristics questions
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
        // Process characteristics selection
        const selectedCode = mockKtruCodes[0]; // Simulate selection
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

  const PlanningView = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
            <button 
              onClick={startAIProcurement}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Сделать закупку с ИИ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Планирование закупок</h2>
          <p className="text-gray-600">Управление процессом планирования и подготовки закупок</p>
        </div>

        {/* Stats */}
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

        {/* Procurement List */}
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => setCurrentView('planning')} className="text-gray-600 hover:text-gray-900">
              ← Вернуться к планированию
            </button>
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h1 className="text-lg font-semibold text-gray-900">ИИ-помощник закупки</h1>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Шаг: {currentStep === 'input' ? 'Ввод товара' : 
                   currentStep === 'codes' ? 'Поиск кодов' : 
                   currentStep === 'characteristics' ? 'Уточнение характеристик' :
                   currentStep === 'ooz' ? 'Формирование ООЗ' :
                   currentStep === 'nmck' ? 'Расчет НМЦК' : 'Готово'}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
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

      {/* Input */}
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
              className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => setCurrentView('chat')} className="text-gray-600 hover:text-gray-900">
              ← Вернуться к чату
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Результаты подготовки закупки</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700">
              <Save className="w-4 h-4" />
              <span>Сохранить в планирование</span>
            </button>
            <button onClick={handleDownloadAll} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700">
              <Download className="w-4 h-4" />
              <span>Скачать всё</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Пакет документов готов</h2>
          <p className="text-gray-600">Наименование: {procurementData.productName}</p>
          <p className="text-gray-600">Код КТРУ: {procurementData.ktruCode}</p>
          {procurementData.nmck && (
            <p className="text-gray-600">НМЦК: {procurementData.nmck.amount.toLocaleString()} руб.</p>
          )}
        </div>

        {/* Document Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* ООЗ */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Описание объекта закупки (ООЗ)</h3>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Готово</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Автоматически сформировано на основе кода КТРУ и характеристик</p>
              <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                Скачать ООЗ
              </button>
            </div>
          </div>

          {/* НМЦК */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Calculator className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Расчет НМЦК</h3>
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
                {procurementData.nmck?.method} | {procurementData.nmck?.region}
              </p>
              <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                Скачать расчет
              </button>
            </div>
          </div>

          {/* Contract Draft */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-gray-900">Проект контракта</h3>
                </div>
                <div className="flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span className="text-xs text-orange-600 font-medium">Заполните поля</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Частично заполнен. Требуется доработка в отдельном модуле</p>
              <button className="w-full bg-orange-100 text-orange-700 py-2 px-4 rounded-lg hover:bg-orange-200 transition-colors">
                Перейти к заполнению
              </button>
            </div>
          </div>

          {/* Default Document 1 */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Техническое задание</h3>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Готово</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Типовое техническое задание</p>
              <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                Скачать документ
              </button>
            </div>
          </div>

          {/* Default Document 2 */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Проект контракта (типовой)</h3>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Готово</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Базовый шаблон контракта</p>
              <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                Скачать документ
              </button>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-blue-50 rounded-lg border border-blue-200">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Готово к сохранению</h3>
              </div>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex justify-between">
                  <span>Готовых документов:</span>
                  <span className="font-medium">4 из 5</span>
                </div>
                <div className="flex justify-between">
                  <span>Требует доработки:</span>
                  <span className="font-medium">1</span>
                </div>
              </div>
            </div>
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
    </div>
  );
}

export default App;