import React, { useState, useRef, useEffect } from 'react';
import { Plus, History, Download, Sun, Moon, Sparkles, FileText, FileDown, KeyRound } from 'lucide-react';
import { ChatSession, ThemeMode } from '../types';
import { exportChatToPdf, exportChatToTxt, exportChatToMarkdown } from '../utils/export';

interface TopHeaderProps {
  onNewChat: () => void;
  onOpenHistory: () => void;
  onOpenApiKeyModal?: () => void;
  currentChat: ChatSession | null;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onNewChat,
  onOpenHistory,
  onOpenApiKeyModal,
  currentChat,
  theme,
  onToggleTheme,
}) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close export dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasMessages = currentChat && currentChat.messages.length > 0;

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-6 py-3.5 flex items-center justify-between backdrop-blur-xl border-b border-white/[0.06] bg-[#070b14]/75">
      {/* Brand Logo & Name (matching screenshot) */}
      <div className="flex items-center gap-3">
        <div className="relative group cursor-pointer flex items-center gap-2.5" onClick={onNewChat}>
          {/* Logo Badge 'S' */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 border border-white/20 shadow-[0_0_16px_rgba(255,255,255,0.08)] flex items-center justify-center font-bold text-white text-base tracking-wider">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg sm:text-xl text-white tracking-tight flex items-center gap-1.5">
              Simplify
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls (matching screenshot: + Новый чат button & profile avatar + export + history) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Export Menu (Only visible when chat has messages) */}
        {hasMessages && (
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-xs font-medium text-slate-200 transition-colors shadow-sm"
              title="Экспорт переписки"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Экспорт</span>
            </button>

            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#0f172a] border border-white/15 shadow-2xl p-1.5 space-y-1 z-50 backdrop-blur-2xl">
                <button
                  onClick={() => {
                    exportChatToPdf(currentChat);
                    setIsExportOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-colors text-left"
                >
                  <FileDown className="w-4 h-4 text-rose-400" />
                  <span>Экспорт в PDF (.pdf)</span>
                </button>
                <button
                  onClick={() => {
                    exportChatToTxt(currentChat);
                    setIsExportOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-colors text-left"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Текстовый файл (.txt)</span>
                </button>
                <button
                  onClick={() => {
                    exportChatToMarkdown(currentChat);
                    setIsExportOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-colors text-left"
                >
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Markdown (.md)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* History Button */}
        <button
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-medium text-slate-300 transition-colors"
          title="История диалогов"
        >
          <History className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">История</span>
        </button>

        {/* API Key Modal Button */}
        {onOpenApiKeyModal && (
          <button
            onClick={onOpenApiKeyModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-medium text-amber-300 hover:text-amber-200 transition-colors shadow-sm"
            title="Настройка API-ключа"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">API-ключ</span>
          </button>
        )}

        {/* New Chat Button (matching screenshot: + Новый чат pill) */}
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1c263c]/90 hover:bg-[#25324e] border border-white/15 text-xs font-medium text-white shadow-lg transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Новый чат</span>
        </button>

        {/* Avatar / Profile circle (matching screenshot purple glowing circle) */}
        <button
          onClick={onToggleTheme}
          title="Глубокая контрастная тема / Режим экрана"
          aria-label="Глубокая контрастная тема"
          className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500/80 to-purple-400/80 p-[1.5px] shadow-[0_0_16px_rgba(168,85,247,0.35)] flex items-center justify-center hover:scale-105 transition-transform"
        >
          <div className="w-full h-full rounded-full bg-[#9f86ff] flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-white/70" />
          </div>
        </button>
      </div>
    </header>
  );
};
