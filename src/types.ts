export interface ModelInfo {
  id: string;
  name: string;
  modelTag: string;
  provider: string;
  color: string;
  accentGlow: string;
  description: string;
  contextWindow: string;
  latency: string;
  isFree: boolean;
  badge: string;
  category: 'general' | 'creative' | 'reasoning' | 'code' | 'speed';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  modelId?: string;
  modelName?: string;
  thinkingContent?: string;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  modelId: string;
  messages: ChatMessage[];
  isPinned?: boolean;
}

export type ThemeMode = 'oled' | 'midnight' | 'cyber';
