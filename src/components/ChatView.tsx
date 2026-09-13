import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage, ModelInfo } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Copy, Check, RotateCw, User, Bot, Sparkles, Square, History, ChevronDown, ChevronRight, MessageSquare, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatViewProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  models: ModelInfo[];
  onRegenerate: (messageIndex: number) => void;
  onStopStreaming?: () => void;
  onOpenApiKeyModal?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  isStreaming,
  models,
  onRegenerate,
  onStopStreaming,
  onOpenApiKeyModal,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedContextIndex, setExpandedContextIndex] = useState<number | null>(null);

  // Auto-scroll to bottom on new messages or streaming chunks
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleCopy = async (id: string, text: string) => {
    try {
      // Strip <context> or <think> tags for clean copying if desired, or keep as is
      const cleanText = text.replace(/<context>[\s\S]*?<\/context>/gi, '').trim();
      await navigator.clipboard.writeText(cleanText || text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  const getModelColor = (modelId?: string) => {
    const found = models.find((m) => m.id === modelId);
    return found ? found.color : '#60a5fa';
  };

  // Helper to extract past context items up to this message index
  const getPriorContext = (currentIndex: number) => {
    const prior = messages.slice(0, currentIndex);
    const pairs: { userQ: string; assistantSummary?: string }[] = [];
    for (let i = 0; i < prior.length; i++) {
      if (prior[i].role === 'user') {
        const nextMsg = prior[i + 1];
        pairs.push({
          userQ: prior[i].content,
          assistantSummary: nextMsg && nextMsg.role === 'assistant' ? nextMsg.content.slice(0, 140) + '...' : undefined,
        });
      }
    }
    return pairs;
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 py-6 space-y-6">
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';
        const modelColor = getModelColor(msg.modelId);
        const priorContextList = !isUser && index > 1 ? getPriorContext(index) : [];
        const hasExplicitContextInText = msg.content.includes('<context>');
        const isErrorMessage = !isUser && (msg.content.includes('⚠️') || msg.content.toLowerCase().includes('ошибка'));

        return (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
          >
            {/* Sender identity & metadata header */}
            <div className="flex items-center gap-2 px-1 text-xs text-slate-400">
              {isUser ? (
                <>
                  <span>Вы</span>
                  <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 shadow-sm">
                    <User className="w-3 h-3" />
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-slate-950 font-bold text-[10px] shadow-sm transition-transform hover:scale-110"
                    style={{ backgroundColor: modelColor }}
                  >
                    <Bot className="w-3 h-3" />
                  </div>
                  <span className="font-medium text-slate-200">
                    {msg.modelName || 'Simplify AI'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(msg.timestamp).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </>
              )}
            </div>

            {/* Bubble Content */}
            <div
              className={`relative max-w-[94%] sm:max-w-[88%] rounded-2xl sm:rounded-3xl p-4 sm:p-5 backdrop-blur-xl transition-all ${
                isUser
                  ? 'bg-gradient-to-br from-indigo-600/90 to-indigo-800/90 text-white shadow-lg border border-indigo-400/30'
                  : isErrorMessage
                  ? 'bg-[#181827]/95 text-slate-100 border border-amber-500/30 shadow-xl shadow-amber-950/20'
                  : 'bg-[#141b2d]/90 text-slate-100 border border-white/10 shadow-xl'
              }`}
            >
              {isUser ? (
                <p className="whitespace-pre-wrap leading-relaxed text-[15px] font-normal tracking-wide">
                  {msg.content}
                </p>
              ) : (
                  <>
                  {/* Context Timeline Pill if available and not already inside the text */}
                  {!hasExplicitContextInText && priorContextList.length > 0 && (
                    <div className="mb-3.5">
                      <button
                        onClick={() =>
                          setExpandedContextIndex(
                            expandedContextIndex === index ? null : index
                          )
                        }
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/25 text-xs text-cyan-300 font-medium transition-all group"
                      >
                        <History className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-[-45deg] transition-transform" />
                        <span>До этого в диалоге: {priorContextList.length} {priorContextList.length === 1 ? 'запрос' : 'запроса'}</span>
                        {expandedContextIndex === index ? (
                          <ChevronDown className="w-3 h-3 text-cyan-400" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-cyan-400" />
                        )}
                      </button>

                      <AnimatePresence>
                        {expandedContextIndex === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="mt-2 p-3 rounded-xl bg-black/30 border border-cyan-500/20 text-xs space-y-2 overflow-hidden"
                          >
                            <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                              <span>Цепочка контекста диалога:</span>
                            </div>
                            <ul className="space-y-2">
                              {priorContextList.map((c, cIdx) => (
                                <li key={cIdx} className="flex items-start gap-2 text-slate-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] mt-1.5 flex-shrink-0" />
                                  <div>
                                    <span className="font-medium text-cyan-200">"{c.userQ}"</span>
                                    {c.assistantSummary && (
                                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 italic">
                                        → {c.assistantSummary}
                                      </p>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Generation Waiting State (before first token arrives) */}
                  {msg.isStreaming && !msg.content ? (
                    <div className="py-2 space-y-3">
                      {/* Shimmering generation header */}
                      <div className="flex items-center gap-2.5">
                        <div className="relative w-4 h-4 flex items-center justify-center">
                          <span className="absolute inset-0 rounded-full bg-cyan-400/40 animate-ping" />
                          <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
                        </div>
                        <span className="text-sm font-medium animate-shimmer-text">
                          Генерирую ответ...
                        </span>
                      </div>

                      {/* Ethereal liquid wave pulse dots */}
                      <div className="flex items-center gap-2 pt-1 pl-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-bounce"
                          style={{ animationDuration: '0.9s', animationDelay: '0ms' }}
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_12px_#818cf8] animate-bounce"
                          style={{ animationDuration: '0.9s', animationDelay: '180ms' }}
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_12px_#c084fc] animate-bounce"
                          style={{ animationDuration: '0.9s', animationDelay: '360ms' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <MarkdownRenderer content={msg.content} />
                      {/* Active streaming liquid cursor */}
                      {msg.isStreaming && (
                        <span className="inline-flex items-center align-middle ml-2 translate-y-[-1px] relative">
                          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-75 absolute inline-block" />
                          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-400 shadow-[0_0_12px_#38bdf8] inline-block" />
                        </span>
                      )}

                      {/* Prominent Quick Retry Button on Error/High Load */}
                      {isErrorMessage && !msg.isStreaming && (
                        <div className="mt-3.5 pt-3 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs text-amber-200/80">Проверьте настройки или повторите запрос</span>
                          <div className="flex items-center gap-2">
                            {onOpenApiKeyModal && (
                              <button
                                onClick={onOpenApiKeyModal}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-amber-300 font-medium text-xs border border-amber-400/30 transition-all cursor-pointer"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                                <span>Настроить ключ</span>
                              </button>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => onRegenerate(index)}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-amber-500/25 transition-all cursor-pointer"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                              <span>Повторить запрос</span>
                            </motion.button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Glass specular sheen on bubbles */}
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl pointer-events-none bg-gradient-to-b from-white/[0.07] via-transparent to-transparent" />
            </div>

            {/* Assistant message action controls or live stream status */}
            {!isUser && (
              <div className="flex items-center gap-2 px-1 text-xs text-slate-400 pt-0.5">
                {msg.isStreaming ? (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-[11px] text-cyan-300/90 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      Потоковая генерация
                    </span>
                    {onStopStreaming && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onStopStreaming}
                        className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors text-[11px] cursor-pointer"
                      >
                        <Square className="w-2.5 h-2.5 fill-current" />
                        <span>Остановить</span>
                      </motion.button>
                    )}
                  </div>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="flex items-center gap-1 hover:text-slate-200 transition-colors px-2 py-1 rounded-md hover:bg-white/5 cursor-pointer"
                      title="Копировать ответ"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 text-[11px] font-medium">Скопировано</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Копировать</span>
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onRegenerate(index)}
                      className="flex items-center gap-1 hover:text-slate-200 transition-colors px-2 py-1 rounded-md hover:bg-white/5 cursor-pointer"
                      title="Повторить генерацию"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Перегенерировать</span>
                    </motion.button>
                  </>
                )}
              </div>
            )}
          </motion.div>
        );
      })}

      <div ref={messagesEndRef} />
    </div>
  );
};
