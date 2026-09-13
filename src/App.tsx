import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ModelInfo, ChatSession, ChatMessage, ThemeMode } from './types';
import { fetchModels, streamChatCompletion, FALLBACK_MODELS } from './services/api';
import { LiquidGlassFilter } from './components/LiquidGlassFilter';
import { TopHeader } from './components/TopHeader';
import { ModelSelector } from './components/ModelSelector';
import { QuickPrompts } from './components/QuickPrompts';
import { GlassInputDock } from './components/GlassInputDock';
import { ChatView } from './components/ChatView';
import { ChatHistoryDrawer } from './components/ChatHistoryDrawer';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Sparkles, MessageSquare } from 'lucide-react';

const STORAGE_KEY = 'simplify_ai_chats_v2';
const ACTIVE_CHAT_KEY = 'simplify_ai_active_chat_v2';
const THEME_KEY = 'simplify_ai_theme';

export default function App() {
  const [models, setModels] = useState<ModelInfo[]>(FALLBACK_MODELS);
  const [selectedModelId, setSelectedModelId] = useState<string>('auto');
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('oled');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load models from server
  useEffect(() => {
    fetchModels().then((data) => {
      if (data && data.length > 0) {
        setModels(data);
      }
    });
  }, []);

  // Load chats & theme from local storage
  useEffect(() => {
    try {
      const savedChats = localStorage.getItem(STORAGE_KEY);
      if (savedChats) {
        const parsed: ChatSession[] = JSON.parse(savedChats);
        setChats(parsed);
      }

      const savedTheme = localStorage.getItem(THEME_KEY) as ThemeMode;
      if (savedTheme) {
        setTheme(savedTheme);
      }
    } catch {
      // Local storage fallback
    }
  }, []);

  // Sync chats to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    } catch {
      // Ignore quota errors
    }
  }, [chats]);

  // Current active chat object
  const currentChat = chats.find((c) => c.id === activeChatId) || null;
  const selectedModel = models.find((m) => m.id === selectedModelId) || models[0];

  // Start a new chat session
  const handleNewChat = () => {
    if (isStreaming) {
      handleStopStreaming();
    }
    setActiveChatId(null);
  };

  // Switch to an existing chat
  const handleSelectChat = (chatId: string) => {
    if (isStreaming) {
      handleStopStreaming();
    }
    setActiveChatId(chatId);
  };

  // Delete a chat
  const handleDeleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
  };

  // Rename a chat
  const handleRenameChat = (chatId: string, newTitle: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  // Clear all chats
  const handleClearAllChats = () => {
    setChats([]);
    setActiveChatId(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Toggle Theme mode
  const handleToggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'oled' ? 'midnight' : theme === 'midnight' ? 'cyber' : 'oled';
    setTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
  };

  // Send a user message and stream response (with optional override history for clean regeneration)
  const handleSendMessage = async (userPrompt: string, overrideHistory?: ChatMessage[]) => {
    if (!userPrompt.trim() || isStreaming) return;

    let chatId = activeChatId;
    let targetChat: ChatSession;

    // If starting fresh, create a new session
    if (!chatId) {
      const newTitle = userPrompt.length > 40 ? userPrompt.slice(0, 40) + '...' : userPrompt;
      const newSession: ChatSession = {
        id: 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        title: newTitle,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        modelId: selectedModelId,
        messages: [],
      };
      targetChat = newSession;
      chatId = newSession.id;
      setActiveChatId(chatId);
      setChats((prev) => [newSession, ...prev]);
    } else {
      const existing = chats.find((c) => c.id === chatId);
      if (!existing) return;
      targetChat = existing;
    }

    const baseHistory = overrideHistory !== undefined ? overrideHistory : targetChat.messages;

    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: userPrompt,
      timestamp: Date.now(),
    };

    const assistantMsgId = 'msg_ai_' + Date.now();
    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelId: selectedModelId,
      modelName: selectedModel.name,
      isStreaming: true,
    };

    // Append to state immediately
    const updatedMessages = [...baseHistory, userMessage, assistantMessage];
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: updatedMessages,
              updatedAt: Date.now(),
            }
          : c
      )
    );

    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    // Prepare message history for API
    const apiMessages = baseHistory
      .concat(userMessage)
      .map((m) => ({ role: m.role, content: m.content }));

    let accumulatedResponse = '';

    await streamChatCompletion({
      messages: apiMessages,
      model: selectedModelId,
      signal: abortControllerRef.current.signal,
      onChunk: (chunk: string) => {
        accumulatedResponse += chunk;
        setChats((prev) =>
          prev.map((c) => {
            if (c.id !== chatId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: accumulatedResponse, isStreaming: true }
                  : m
              ),
            };
          })
        );
      },
      onComplete: () => {
        setIsStreaming(false);
        setChats((prev) =>
          prev.map((c) => {
            if (c.id !== chatId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, isStreaming: false } : m
              ),
            };
          })
        );
      },
      onError: (err: Error) => {
        setIsStreaming(false);
        console.error('Streaming error:', err);
        const errorDetails = err?.message || 'Неизвестная ошибка сети';
        setChats((prev) =>
          prev.map((c) => {
            if (c.id !== chatId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content:
                        accumulatedResponse ||
                        `⚠️ Ошибка: ${errorDetails}`,
                      isStreaming: false,
                    }
                  : m
              ),
            };
          })
        );
      },
    });
  };

  // Stop streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setChats((prev) =>
      prev.map((c) => ({
        ...c,
        messages: c.messages.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)),
      }))
    );
  };

  // Regenerate assistant response
  const handleRegenerate = (assistantIndex: number) => {
    if (!currentChat || isStreaming) return;
    const userMsg = currentChat.messages[assistantIndex - 1];
    if (userMsg && userMsg.role === 'user') {
      // Truncate messages strictly before the user message
      const trimmedHistory = currentChat.messages.slice(0, assistantIndex - 1);
      handleSendMessage(userMsg.content, trimmedHistory);
    }
  };

  // Theme background styles
  const getThemeBgClass = () => {
    switch (theme) {
      case 'oled':
        return 'bg-[#050811]';
      case 'midnight':
        return 'bg-[#080e1c]';
      case 'cyber':
        return 'bg-[#070d18]';
      default:
        return 'bg-[#050811]';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col relative selection:bg-indigo-500/30 selection:text-white ${getThemeBgClass()}`}>
      {/* SVG Liquid Glass Refraction Filters */}
      <LiquidGlassFilter />

      {/* Atmospheric Ambient Ethereal Blobs for Refraction through Liquid Glass */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[12%] left-[18%] w-[420px] h-[420px] rounded-full bg-indigo-600/10 blur-[120px] animate-blob-1" />
        <div className="absolute top-[35%] right-[15%] w-[480px] h-[480px] rounded-full bg-purple-600/10 blur-[140px] animate-blob-2" />
        <div className="absolute bottom-[10%] left-[25%] w-[520px] h-[520px] rounded-full bg-cyan-600/[0.08] blur-[150px] animate-blob-3" />
      </div>

      {/* Top Header Navigation */}
      <TopHeader
        onNewChat={handleNewChat}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        currentChat={currentChat}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-between relative z-10 w-full">
        {currentChat && currentChat.messages.length > 0 ? (
          /* Active Chat View */
          <div className="flex-1 overflow-y-auto pb-4">
            <ChatView
              messages={currentChat.messages}
              isStreaming={isStreaming}
              models={models}
              onRegenerate={handleRegenerate}
              onStopStreaming={handleStopStreaming}
              onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
            />
          </div>
        ) : (
          /* Initial Screen (Matches the user screenshot perfectly) */
          <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto px-4 py-8 sm:py-12 w-full">
            {/* Center Hero Icon (matching screenshot: purple-blue rounded icon with 4-point sparkle) */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="relative mb-6 cursor-default"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-[#9080fc] to-[#b39dfc] p-0.5 shadow-[0_0_50px_rgba(168,85,247,0.45)] flex items-center justify-center">
                <div className="w-full h-full rounded-[22px] bg-gradient-to-tr from-[#866cfb] to-[#bca6ff] flex items-center justify-center">
                  <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white drop-shadow-md" />
                </div>
              </div>
            </motion.div>

            {/* Hero Heading (matching screenshot: "Чем помочь сегодня?") */}
            <motion.h1
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight text-center mb-3 drop-shadow-sm"
            >
              Чем помочь сегодня?
            </motion.h1>

            {/* Subtitle (matching screenshot) */}
            <motion.p
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-sm sm:text-base text-slate-300/90 text-center max-w-lg mb-8 leading-relaxed font-normal"
            >
              Все лучшие нейросети в одном месте. Бесплатно — выберите модель или просто задайте вопрос.
            </motion.p>

            {/* Model Selector (matching screenshot) */}
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full mb-8"
            >
              <ModelSelector
                models={models}
                selectedModelId={selectedModelId}
                onSelectModel={setSelectedModelId}
              />
            </motion.div>

            {/* Starter Action Cards (matching screenshot: "Попробуйте начать с этого") */}
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="w-full"
            >
              <QuickPrompts onSelectPrompt={handleSendMessage} />
            </motion.div>
          </div>
        )}

        {/* Floating Liquid Glass Bottom Input Dock (matching screenshot) */}
        <div className="w-full sticky bottom-0 z-30 pt-2 backdrop-blur-[2px]">
          <GlassInputDock
            onSendMessage={handleSendMessage}
            isStreaming={isStreaming}
            onStopStreaming={handleStopStreaming}
            selectedModelName={selectedModel.name}
          />
        </div>
      </main>

      {/* Chat History & Search Drawer */}
      <ChatHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onClearAllChats={handleClearAllChats}
      />

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />
    </div>
  );
}
