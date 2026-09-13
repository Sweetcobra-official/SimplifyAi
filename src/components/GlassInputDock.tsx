import React, { useState, useRef, useEffect } from 'react';
import { Plus, Play, Square, Globe, Code, FileText, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GlassInputDockProps {
  onSendMessage: (text: string) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  selectedModelName?: string;
}

export const GlassInputDock: React.FC<GlassInputDockProps> = ({
  onSendMessage,
  isStreaming,
  onStopStreaming,
  selectedModelName,
}) => {
  const [inputText, setInputText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [inputText]);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isStreaming) {
      onStopStreaming();
      return;
    }
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTemplateInsert = (prefix: string) => {
    setInputText((prev) => (prev ? `${prev} ${prefix}` : prefix));
    setIsMenuOpen(false);
    textareaRef.current?.focus();
  };

  const hasText = inputText.trim().length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-4 sm:pb-6 relative z-30">
      {/* The Liquid Glass Floating Dock */}
      <motion.form
        onSubmit={handleSubmit}
        animate={{
          boxShadow: hasText
            ? '0 16px 40px rgba(99, 102, 241, 0.25), 0 0 20px rgba(6, 182, 212, 0.15)'
            : '0 12px 36px rgba(0, 0, 0, 0.7)',
        }}
        transition={{ duration: 0.3 }}
        className="liquid-glass-card relative flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-full bg-[#182133]/90 hover:bg-[#1a253a]/95 border border-white/15 backdrop-blur-2xl transition-all duration-300"
      >
        {/* Left Plus Circle Button with Clean Anchored Popover */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <motion.button
            type="button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 border cursor-pointer ${
              isMenuOpen
                ? 'bg-indigo-600/90 border-indigo-400 text-white shadow-[0_0_16px_rgba(99,102,241,0.5)]'
                : 'bg-white/[0.08] hover:bg-white/[0.14] border-white/10 text-slate-300 hover:text-white'
            }`}
            title="Быстрые режимы"
          >
            <Plus
              className={`w-5 h-5 transition-transform duration-300 ${
                isMenuOpen ? 'rotate-45' : ''
              }`}
            />
          </motion.button>

          {/* Plus Menu Popup: anchored strictly above button with opaque background and spring physics */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="absolute left-0 bottom-full mb-3.5 w-64 sm:w-72 rounded-2xl bg-[#0c1220] border border-white/20 p-2.5 shadow-[0_24px_50px_rgba(0,0,0,0.95)] backdrop-blur-3xl space-y-1.5 z-50"
              >
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-white/10 pb-1.5">
                  <span>Быстрые режимы</span>
                  <span className="text-[10px] text-cyan-400 font-mono">{selectedModelName || 'ИИ'}</span>
                </div>

                <motion.button
                  type="button"
                  whileHover={{ x: 3 }}
                  onClick={() => handleTemplateInsert('Проанализируй и найди ключевые факты: ')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Анализ и факты</span>
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ x: 3 }}
                  onClick={() => handleTemplateInsert('Напиши код с подробными комментариями и тестами: ')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
                >
                  <Code className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Генерация кода</span>
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ x: 3 }}
                  onClick={() => handleTemplateInsert('Сделай краткую выжимку (TL;DR) текста: ')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Краткая выжимка</span>
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ x: 3 }}
                  onClick={() => handleTemplateInsert('Улучши формулировку и стиль следующего текста: ')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Редактор стиля</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Center Input Area ("Ваш ход...") */}
        <div className="flex-1 min-w-0 flex items-center py-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ваш ход..."
            className="w-full bg-transparent text-white placeholder:text-slate-400/80 text-[15px] sm:text-base resize-none focus:outline-none max-h-36 leading-relaxed scrollbar-none py-1"
          />
        </div>

        {/* Right Play / Send / Stop Button */}
        <div className="relative flex-shrink-0">
          {isStreaming && (
            <span className="absolute inset-0 rounded-full bg-rose-500/40 animate-radar pointer-events-none" />
          )}
          <motion.button
            type="button"
            whileHover={{ scale: isStreaming || hasText ? 1.08 : 1 }}
            whileTap={{ scale: isStreaming || hasText ? 0.92 : 1 }}
            onClick={() => handleSubmit()}
            disabled={!isStreaming && !hasText}
            className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
              isStreaming
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.6)]'
                : hasText
                ? 'bg-gradient-to-tr from-slate-100 to-white text-slate-950 shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                : 'bg-white/[0.08] text-slate-500 border border-white/10 !cursor-not-allowed'
            }`}
            title={isStreaming ? 'Остановить генерацию' : 'Отправить'}
          >
            {isStreaming ? (
              <Square className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5 fill-current" />
            )}
          </motion.button>
        </div>

        {/* Glass specular rim shine */}
        <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-b from-white/[0.12] via-transparent to-transparent" />
      </motion.form>
    </div>
  );
};
