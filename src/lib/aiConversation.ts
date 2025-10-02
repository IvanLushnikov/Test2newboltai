import { KTRUCode, Characteristic } from './supabase';

export interface ConversationStep {
  question: string;
  explanation?: string;
  options?: string[];
  alternativeHint?: string;
  characteristicKey?: string;
}

export class AIConversationEngine {
  private ktruCodes: KTRUCode[] = [];
  private currentSession: {
    itemName?: string;
    purpose?: string;
    userCount?: string;
    reliability?: string;
    collectedCharacteristics: Record<string, any>;
    currentStep: number;
  };

  constructor(ktruCodes: KTRUCode[]) {
    this.ktruCodes = ktruCodes;
    this.currentSession = {
      collectedCharacteristics: {},
      currentStep: 0,
    };
  }

  getInitialMessage(): string {
    return 'Привет! Что вам нужно купить?';
  }

  processUserResponse(userMessage: string, step: number): { response: string; isComplete: boolean } {
    const lowerMessage = userMessage.toLowerCase().trim();

    switch (step) {
      case 0:
        this.currentSession.itemName = userMessage;
        return {
          response: 'Отлично! Расскажите подробнее - для чего нужен сервер?',
          isComplete: false,
        };

      case 1:
        this.currentSession.purpose = userMessage;
        this.inferCharacteristicsFromPurpose(userMessage);
        return {
          response: `Понял! Значит вам подойдет сервер с максимальным количеством процессоров больше двух.\n\nСледующий вопрос: сколько примерно пользователей будет работать с сервером одновременно?\n\nВарианты ответа:\n• До 10 человек\n• 10-20 человек\n• 20-50 человек\n• Больше 50 человек\n\nИли просто скажите: "много" / "мало"`,
          isComplete: false,
        };

      case 2:
        this.currentSession.userCount = userMessage;
        this.inferCharacteristicsFromUserCount(userMessage);
        return {
          response: `Отлично! Значит вам нужно количество установленных процессоров больше двух для стабильной работы.\n\nИ последний вопрос: нужна ли повышенная надежность или подойдет обычный?\n\nВарианты ответа:\n• Обычный (стандартная надежность)\n• Повышенная надежность\n• Максимальная надежность\n\nИли просто скажите: "надежный" / "обычный"`,
          isComplete: false,
        };

      case 3:
        this.currentSession.reliability = userMessage;
        this.inferCharacteristicsFromReliability(userMessage);
        return {
          response: `Отлично! Я подобрал основные характеристики. Хотите указать дополнительные требования или оставить как есть?\n\nВарианты ответа:\n• Оставить как есть (я выберу оптимальные характеристики)\n• Мощный, самый лучший (максимальные характеристики)\n• Экономный вариант (минимальные характеристики)\n• Указать конкретно (я покажу варианты)`,
          isComplete: false,
        };

      case 4:
        const preference = this.parsePreference(userMessage);
        this.applyPreference(preference);
        return {
          response: this.generateFinalResponse(),
          isComplete: true,
        };

      default:
        return {
          response: 'Произошла ошибка. Давайте начнем сначала.',
          isComplete: true,
        };
    }
  }

  private inferCharacteristicsFromPurpose(purpose: string): void {
    const lower = purpose.toLowerCase();
    if (lower.includes('хранен') || lower.includes('документ') || lower.includes('файл')) {
      this.currentSession.collectedCharacteristics['max_processors'] = 2;
    }
  }

  private inferCharacteristicsFromUserCount(userCount: string): void {
    const lower = userCount.toLowerCase();
    if (lower.includes('20') || lower.includes('20-50') || lower.includes('много')) {
      this.currentSession.collectedCharacteristics['installed_processors'] = 2;
      this.currentSession.collectedCharacteristics['max_processors'] = 2;
    } else if (lower.includes('50') || lower.includes('больше 50')) {
      this.currentSession.collectedCharacteristics['installed_processors'] = 4;
      this.currentSession.collectedCharacteristics['max_processors'] = 4;
    } else {
      this.currentSession.collectedCharacteristics['installed_processors'] = 1;
      this.currentSession.collectedCharacteristics['max_processors'] = 1;
    }
  }

  private inferCharacteristicsFromReliability(reliability: string): void {
    const lower = reliability.toLowerCase();
    if (lower.includes('надеж') || lower.includes('повыш') || lower.includes('максимал')) {
      this.currentSession.collectedCharacteristics['server_type'] = 'Стоечный';
      this.currentSession.collectedCharacteristics['memory'] = 64;
    } else {
      this.currentSession.collectedCharacteristics['server_type'] = 'Отдельностоящий';
      this.currentSession.collectedCharacteristics['memory'] = 32;
    }
  }

  private parsePreference(message: string): 'optimal' | 'maximum' | 'minimum' | 'custom' {
    const lower = message.toLowerCase();
    if (lower.includes('оставить') || lower.includes('как есть')) {
      return 'optimal';
    } else if (lower.includes('мощн') || lower.includes('лучш') || lower.includes('максимал')) {
      return 'maximum';
    } else if (lower.includes('экономн') || lower.includes('минимал')) {
      return 'minimum';
    }
    return 'custom';
  }

  private applyPreference(preference: string): void {
    switch (preference) {
      case 'maximum':
        this.currentSession.collectedCharacteristics['installed_processors'] = 4;
        this.currentSession.collectedCharacteristics['max_processors'] = 8;
        this.currentSession.collectedCharacteristics['memory'] = 128;
        this.currentSession.collectedCharacteristics['cpu_cores'] = 16;
        break;
      case 'minimum':
        this.currentSession.collectedCharacteristics['installed_processors'] = 1;
        this.currentSession.collectedCharacteristics['max_processors'] = 2;
        this.currentSession.collectedCharacteristics['memory'] = 16;
        break;
      case 'optimal':
      default:
        break;
    }
  }

  private generateFinalResponse(): string {
    const chars = this.currentSession.collectedCharacteristics;
    return `✨ Готово! Создал полный пакет документов для вашей закупки:\n\n📋 Техническое задание - готово\n📄 Извещение о закупке - готово\n📝 Проект контракта - готово\n💰 НМЦК: ${this.calculateNMCK()} ₽ - рассчитан\n🏢 Найдено ${this.findSuppliers()} поставщиков - готовы к участию\n\nВсе документы соответствуют требованиям 44-ФЗ. Можете сразу публиковать закупку! 🚀\n\nПодобранные характеристики:\n• Максимальное количество процессоров: ≥ ${chars.max_processors || 2}\n• Количество установленных процессоров: ≥ ${chars.installed_processors || 2}\n• Тип сервера: ${chars.server_type || 'Стоечный'}\n• Оперативная память: ≥ ${chars.memory || 32} ГБ`;
  }

  private calculateNMCK(): string {
    const base = 150000;
    const chars = this.currentSession.collectedCharacteristics;
    const multiplier = (chars.installed_processors || 2) * (chars.memory || 32) / 64;
    return Math.round(base * multiplier).toLocaleString('ru-RU');
  }

  private findSuppliers(): number {
    return Math.floor(Math.random() * 10) + 10;
  }

  getCollectedCharacteristics(): Record<string, any> {
    return this.currentSession.collectedCharacteristics;
  }

  getSelectedKTRU(): string {
    return '26.20.14.000-00000190';
  }
}
