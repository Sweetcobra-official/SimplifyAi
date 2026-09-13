import { ModelInfo } from '../types';

const USER_API_KEY_STORAGE = 'simplify_ai_user_api_key';

export function getStoredApiKey(): string {
  try {
    const fromStorage = localStorage.getItem(USER_API_KEY_STORAGE);
    if (fromStorage && fromStorage.trim()) {
      return fromStorage.trim();
    }
  } catch {
    // Ignore localStorage errors
  }
  return ((import.meta as any).env?.VITE_IO_INTELLIGENCE_API_KEY || '').trim();
}

export function setStoredApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(USER_API_KEY_STORAGE, key.trim());
    } else {
      localStorage.removeItem(USER_API_KEY_STORAGE);
    }
  } catch {
    // Ignore localStorage errors
  }
}

export const FALLBACK_MODELS: ModelInfo[] = [
  {
    id: 'auto',
    name: 'Умный выбор',
    modelTag: 'Автоматически',
    provider: 'IO Intelligence Router',
    color: '#60a5fa',
    accentGlow: 'rgba(96, 165, 250, 0.4)',
    description: 'Автоматически выбирает лучшую нейросеть под задачу',
    contextWindow: '128K',
    latency: '85ms',
    isFree: true,
    badge: 'Рекомендуется',
    category: 'general',
  },
  {
    id: 'gpt-4o-mini',
    name: 'ChatGPT',
    modelTag: 'GPT-4o mini',
    provider: 'OpenAI / IO Intelligence',
    color: '#34d399',
    accentGlow: 'rgba(52, 211, 153, 0.4)',
    description: 'Сверхбыстрая универсальная модель для текстов и ответов',
    contextWindow: '128K',
    latency: '110ms',
    isFree: true,
    badge: 'Быстрый',
    category: 'general',
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude',
    modelTag: '3.5 Haiku',
    provider: 'Anthropic / IO Intelligence',
    color: '#fb923c',
    accentGlow: 'rgba(251, 146, 60, 0.4)',
    description: 'Лидер в точности формулировок и писательском мастерстве',
    contextWindow: '200K',
    latency: '135ms',
    isFree: true,
    badge: 'Элегантный',
    category: 'creative',
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek',
    modelTag: 'R1 Reasoning',
    provider: 'DeepSeek / IO Intelligence',
    color: '#a855f7',
    accentGlow: 'rgba(168, 85, 247, 0.4)',
    description: 'Пошаговое логическое мышление и анализ архитектуры кода',
    contextWindow: '128K',
    latency: '190ms',
    isFree: true,
    badge: 'Рассуждение',
    category: 'reasoning',
  },
  {
    id: 'llama-3-3-70b',
    name: 'Meta Llama',
    modelTag: '3.3 70B Instruct',
    provider: 'Meta / IO Intelligence',
    color: '#38bdf8',
    accentGlow: 'rgba(56, 189, 248, 0.4)',
    description: 'Мощная открытая модель для глубоких диалогов и аналитики',
    contextWindow: '128K',
    latency: '140ms',
    isFree: true,
    badge: 'Флагман',
    category: 'general',
  },
  {
    id: 'qwen-2-5-coder',
    name: 'Qwen Coder',
    modelTag: '2.5 Coder 32B',
    provider: 'Alibaba / IO Intelligence',
    color: '#f43f5e',
    accentGlow: 'rgba(244, 63, 94, 0.4)',
    description: 'Специалист по программированию, отладке и алгоритмам',
    contextWindow: '128K',
    latency: '125ms',
    isFree: true,
    badge: 'Разработка',
    category: 'code',
  },
  {
    id: 'gemini-3-8-flash',
    name: 'Google Gemini',
    modelTag: '3.8 Flash',
    provider: 'Google DeepMind / IO Intelligence',
    color: '#facc15',
    accentGlow: 'rgba(250, 204, 21, 0.4)',
    description: 'Мультимодальная архитектура со сверхнизкой задержкой',
    contextWindow: '1M',
    latency: '75ms',
    isFree: true,
    badge: 'Ультра-скорость',
    category: 'speed',
  },
];

export async function fetchModels(): Promise<ModelInfo[]> {
  try {
    const res = await fetch('/api/models');
    if (!res.ok) throw new Error('Failed to fetch models');
    const data = await res.json();
    return data.models || FALLBACK_MODELS;
  } catch {
    return FALLBACK_MODELS;
  }
}

export interface StreamChatParams {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  model: string;
  signal?: AbortSignal;
  onChunk: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

function mapToIOModel(modelId: string): string {
  switch (modelId) {
    case 'auto':
      return 'meta-llama/Llama-3.3-70B-Instruct';
    case 'deepseek-r1':
      return 'deepseek-ai/DeepSeek-R1';
    case 'llama-3-3-70b':
      return 'meta-llama/Llama-3.3-70B-Instruct';
    case 'qwen-2-5-coder':
      return 'Qwen/Qwen2.5-Coder-32B-Instruct';
    case 'gpt-4o-mini':
      return 'gpt-4o-mini';
    case 'claude-3-5-haiku':
      return 'claude-3-5-haiku';
    case 'gemini-3-8-flash':
      return 'gemini-2.0-flash';
    default:
      return modelId;
  }
}

export async function streamChatCompletion({
  messages,
  model,
  signal,
  onChunk,
  onComplete,
  onError,
}: StreamChatParams) {
  try {
    let response: Response;

    // Try server endpoint first (when running on Express/Node)
    try {
      response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages, model }),
        signal,
      });

      // If static host returns 404/405 for /api/chat, fallback to direct client call
      if (!response.ok && (response.status === 404 || response.status === 405)) {
        throw new Error('Static host detected, fallback to direct API');
      }
    } catch (serverErr: any) {
      if (signal?.aborted) return;

      const clientKey = getStoredApiKey();
      if (!clientKey) {
        throw new Error(
          'API-ключ не найден. Нажмите иконку ⚙️ вверху или кнопку «Настроить API-ключ», чтобы указать ключ IO Intelligence (io-v2-...).'
        );
      }

      // Direct call to IO Intelligence from client when on GitHub Pages
      const targetModel = mapToIOModel(model);
      const formattedMessages = [
        {
          role: 'system',
          content: 'You are SimplifyAi, a fast, intelligent, and accurate Russian-speaking AI assistant. Answer clearly and formatted in Markdown.',
        },
        ...messages,
      ];

      try {
        response = await fetch('https://api.intelligence.io.solutions/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${clientKey}`,
          },
          body: JSON.stringify({
            model: targetModel,
            messages: formattedMessages,
            stream: true,
            temperature: 0.7,
          }),
          signal,
        });
      } catch (fetchErr: any) {
        if (signal?.aborted) return;
        throw new Error(
          `Сетевая ошибка при обращении к API (${fetchErr?.message || 'Failed to fetch'}). Проверьте интернет-соединение или статус API.`
        );
      }
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Ошибка API (${response.status} ${response.statusText}): ${errText || 'Неверный запрос или ключ'}`);
    }

    if (!response.body) {
      throw new Error('Ответ не содержит потока данных');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        if (trimmed === 'data: [DONE]') {
          onComplete();
          return;
        }

        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const content =
              parsed.text ??
              parsed.choices?.[0]?.delta?.content ??
              parsed.choices?.[0]?.text;
            if (content) {
              onChunk(content);
            }
          } catch {
            // Raw text or non-json chunk
            const rawText = trimmed.slice(6);
            if (rawText && rawText !== '[DONE]') {
              onChunk(rawText);
            }
          }
        }
      }
    }

    onComplete();
  } catch (err: any) {
    if (signal?.aborted) {
      onComplete();
      return;
    }
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}
