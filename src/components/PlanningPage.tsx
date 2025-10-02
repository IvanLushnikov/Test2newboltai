import { useState } from 'react';
import { Sparkles, FileText, Calendar, TrendingUp } from 'lucide-react';
import AIChat from './AIChat';
import ProcurementResults from './ProcurementResults';

type ViewMode = 'planning' | 'chat' | 'results';

export default function PlanningPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('planning');
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);

  const handleStartAIChat = () => {
    setViewMode('chat');
  };

  const handleChatComplete = (sessionId: string) => {
    setCompletedSessionId(sessionId);
    setViewMode('results');
  };

  const handleBackToPlanning = () => {
    setViewMode('planning');
    setCompletedSessionId(null);
  };

  if (viewMode === 'chat') {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-xl font-semibold text-gray-900">Планирование закупок</h1>
          </div>
        </header>
        <div className="flex-1 max-w-5xl w-full mx-auto p-6">
          <AIChat onComplete={handleChatComplete} />
        </div>
      </div>
    );
  }

  if (viewMode === 'results' && completedSessionId) {
    return <ProcurementResults sessionId={completedSessionId} onBack={handleBackToPlanning} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Планирование закупок</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors">
                Как это работает?
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Создайте закупку с помощью ИИ
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl">
            Просто опишите что вам нужно купить, а искусственный интеллект подберёт характеристики,
            найдёт код КТРУ и сформирует все необходимые документы
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={handleStartAIChat}
            className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-left"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white bg-opacity-20">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Сделать закупку с ИИ</h3>
              </div>
              <p className="text-blue-100 mb-6 leading-relaxed">
                Создайте закупку за 5 минут в режиме диалога. ИИ задаст несколько вопросов и подготовит полный пакет документов.
              </p>
              <div className="flex items-center gap-2 text-white font-medium">
                <span>Начать диалог</span>
                <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </button>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100">
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Создать заявку на закупку</h3>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Традиционный способ создания закупки с заполнением всех полей вручную.
            </p>
            <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium transition-colors">
              <span>Создать вручную</span>
              <span className="text-xl">→</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Преимущества ИИ-помощника</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-6 p-8">
            <div className="flex gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 flex-shrink-0">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Автоматический подбор</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  ИИ сам находит нужные коды КТРУ и подбирает характеристики на основе ваших ответов
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 flex-shrink-0">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Экономия времени</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Создание закупки занимает 5 минут вместо нескольких часов изучения справочников
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Соответствие 44-ФЗ</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Все документы формируются с учетом требований законодательства
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 flex-shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Что получите в результате?</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Техническое задание с полным описанием характеристик</li>
                <li>• Извещение о закупке, готовое к публикации</li>
                <li>• Проект контракта в соответствии с 44-ФЗ</li>
                <li>• Расчет начальной максимальной цены контракта (НМЦК)</li>
                <li>• Список потенциальных поставщиков</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
