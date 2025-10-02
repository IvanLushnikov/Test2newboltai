import { useEffect, useState } from 'react';
import { FileText, FileCheck, Ligature as FileSignature, DollarSign, Building2, CheckCircle, Download, ArrowLeft } from 'lucide-react';
import { supabase, GeneratedDocument, ProcurementSession } from '../lib/supabase';

interface ProcurementResultsProps {
  sessionId: string;
  onBack: () => void;
}

export default function ProcurementResults({ sessionId, onBack }: ProcurementResultsProps) {
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [session, setSession] = useState<ProcurementSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [sessionId]);

  const loadResults = async () => {
    try {
      const { data: sessionData } = await supabase
        .from('procurement_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      const { data: documentsData } = await supabase
        .from('generated_documents')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      setSession(sessionData);
      setDocuments(documentsData || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading results:', error);
      setIsLoading(false);
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'technical_task':
        return FileText;
      case 'notice':
        return FileCheck;
      case 'contract':
        return FileSignature;
      case 'nmck':
        return DollarSign;
      case 'suppliers':
        return Building2;
      default:
        return FileText;
    }
  };

  const getDocumentTitle = (type: string) => {
    switch (type) {
      case 'technical_task':
        return 'Техническое задание';
      case 'notice':
        return 'Извещение о закупке';
      case 'contract':
        return 'Проект контракта';
      case 'nmck':
        return 'НМЦК';
      case 'suppliers':
        return 'Поставщики';
      default:
        return 'Документ';
    }
  };

  const getDocumentStatus = (doc: GeneratedDocument) => {
    if (doc.document_type === 'nmck') {
      return `${doc.content.value} ₽ - ${doc.content.status}`;
    }
    if (doc.document_type === 'suppliers') {
      return `Найдено ${doc.content.count} поставщиков - ${doc.content.status}`;
    }
    return doc.content.status;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка результатов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 via-white to-green-50 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Вернуться к планированию</span>
        </button>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-green-500 to-blue-600 px-8 py-6">
            <div className="flex items-center gap-4 mb-2">
              <CheckCircle className="w-10 h-10 text-white" />
              <h1 className="text-3xl font-bold text-white">Готово!</h1>
            </div>
            <p className="text-green-50 text-lg">
              Создал полный пакет документов для вашей закупки
            </p>
          </div>

          <div className="px-8 py-6 bg-gradient-to-b from-white to-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {documents.map((doc, index) => {
                const Icon = getDocumentIcon(doc.document_type);
                return (
                  <div
                    key={doc.id}
                    className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-green-100 flex-shrink-0">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {getDocumentTitle(doc.document_type)}
                      </h3>
                      <p className="text-sm text-green-600 font-medium">
                        {getDocumentStatus(doc)}
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                  </div>
                );
              })}
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Подобранные характеристики
              </h3>
              <div className="space-y-2">
                {session?.characteristics && Object.keys(session.characteristics).length > 0 ? (
                  <>
                    {session.characteristics.max_processors && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Максимальное количество процессоров:</span>
                        <span className="font-medium text-gray-900">≥ {session.characteristics.max_processors}</span>
                      </div>
                    )}
                    {session.characteristics.installed_processors && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Количество установленных процессоров:</span>
                        <span className="font-medium text-gray-900">≥ {session.characteristics.installed_processors}</span>
                      </div>
                    )}
                    {session.characteristics.server_type && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Тип сервера:</span>
                        <span className="font-medium text-gray-900">{session.characteristics.server_type}</span>
                      </div>
                    )}
                    {session.characteristics.memory && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Оперативная память:</span>
                        <span className="font-medium text-gray-900">≥ {session.characteristics.memory} ГБ</span>
                      </div>
                    )}
                    {session.characteristics.cpu_cores && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Количество ядер процессора:</span>
                        <span className="font-medium text-gray-900">{session.characteristics.cpu_cores}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-600">Характеристики не указаны</p>
                )}
              </div>
            </div>

            {session?.selected_ktru_code && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Код ОКПД 2/КТРУ</p>
                    <p className="font-mono text-sm font-semibold text-gray-900">{session.selected_ktru_code}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                <Download className="w-4 h-4" />
                <span>Скачать документацию</span>
              </button>
              <button className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                Опубликовать закупку
              </button>
            </div>
            <p className="text-center text-sm text-gray-600 mt-4">
              Все документы соответствуют требованиям 44-ФЗ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
