import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { supabase, ConversationMessage } from '../lib/supabase';
import { AIConversationEngine } from '../lib/aiConversation';

interface AIChatProps {
  onComplete: (sessionId: string) => void;
}

export default function AIChat({ onComplete }: AIChatProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [aiEngine, setAiEngine] = useState<AIConversationEngine | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    try {
      const { data: ktruData } = await supabase
        .from('ktru_codes')
        .select('*')
        .maybeSingle();

      if (!ktruData) {
        console.error('No KTRU data found');
        return;
      }

      const engine = new AIConversationEngine([ktruData]);
      setAiEngine(engine);

      const { data: session, error } = await supabase
        .from('procurement_sessions')
        .insert({
          status: 'active',
          conversation_state: [],
          characteristics: {},
        })
        .select()
        .single();

      if (error) throw error;

      setSessionId(session.id);

      const initialMessage: ConversationMessage = {
        role: 'assistant',
        content: engine.getInitialMessage(),
        timestamp: new Date().toISOString(),
      };

      setMessages([initialMessage]);

      await supabase
        .from('procurement_sessions')
        .update({
          conversation_state: [initialMessage],
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id);
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !aiEngine || !sessionId) return;

    const userMessage: ConversationMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const { response, isComplete } = aiEngine.processUserResponse(
        userMessage.content,
        currentStep
      );

      setTimeout(async () => {
        const assistantMessage: ConversationMessage = {
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString(),
        };

        const updatedMessages = [...newMessages, assistantMessage];
        setMessages(updatedMessages);
        setIsLoading(false);

        await supabase
          .from('procurement_sessions')
          .update({
            conversation_state: updatedMessages,
            updated_at: new Date().toISOString(),
            ...(currentStep === 0 && { item_name: userMessage.content }),
          })
          .eq('id', sessionId);

        if (isComplete) {
          await supabase
            .from('procurement_sessions')
            .update({
              status: 'completed',
              selected_ktru_code: aiEngine.getSelectedKTRU(),
              characteristics: aiEngine.getCollectedCharacteristics(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', sessionId);

          await generateDocuments(sessionId);

          setTimeout(() => {
            onComplete(sessionId);
          }, 1000);
        } else {
          setCurrentStep(currentStep + 1);
        }
      }, 1000);
    } catch (error) {
      console.error('Error processing message:', error);
      setIsLoading(false);
    }
  };

  const generateDocuments = async (sessionId: string) => {
    const documents = [
      {
        session_id: sessionId,
        document_type: 'technical_task',
        content: { title: 'Техническое задание', status: 'готово' },
      },
      {
        session_id: sessionId,
        document_type: 'notice',
        content: { title: 'Извещение о закупке', status: 'готово' },
      },
      {
        session_id: sessionId,
        document_type: 'contract',
        content: { title: 'Проект контракта', status: 'готово' },
      },
      {
        session_id: sessionId,
        document_type: 'nmck',
        content: { title: 'НМЦК', value: '180 000', status: 'рассчитан' },
      },
      {
        session_id: sessionId,
        document_type: 'suppliers',
        content: { title: 'Поставщики', count: 15, status: 'готовы к участию' },
      },
    ];

    await supabase.from('generated_documents').insert(documents);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
          <Sparkles className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">ИИ-помощник для создания закупки</h2>
          <p className="text-sm text-gray-600">Ответьте на несколько вопросов для подбора характеристик</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900 border border-gray-200'
              }`}
            >
              <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-3 bg-gray-100 border border-gray-200">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">Анализирую...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введите ваш ответ..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
          >
            <Send className="w-4 h-4" />
            <span>Отправить</span>
          </button>
        </div>
      </div>
    </div>
  );
}
