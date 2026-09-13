import React, { useState, useMemo } from 'react';
import { ChatSession } from '../types';
import {
  Search,
  MessageSquare,
  Trash2,
  Download,
  Plus,
  X,
  Clock,
  Edit2,
  Check,
  Sparkles,
} from 'lucide-react';
import { exportChatToPdf, exportChatToTxt, exportChatToMarkdown } from '../utils/export';

interface ChatHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chats: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onClearAllChats: () => void;
}

export const ChatHistoryDrawer: React.FC<ChatHistoryDrawerProps> = ({
  isOpen,
  onClose,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onClearAllChats,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');

  // Filter chats by search query across title AND message contents
  const filteredChats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return chats;

    return chats.filter((chat) => {
      if (chat.title.toLowerCase().includes(q)) return true;
      if (chat.modelId.toLowerCase().includes(q)) return true;
      return chat.messages.some((m) => m.content.toLowerCase().includes(q));
    });
  }, [chats, searchQuery]);

  // Group by date
  const groupedChats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;

    const today: ChatSession[] = [];
    const yesterday: ChatSession[] = [];
    const older: ChatSession[] = [];

    for (const chat of filteredChats) {
      if (chat.updatedAt >= todayStart) {
        today.push(chat);
      } else if (chat.updatedAt >= yesterdayStart) {
        yesterday.push(chat);
      } else {
        older.push(chat);
      }
    }

    return { today, yesterday, older };
  }, [filteredChats]);

  const handleStartRename = (e: React.MouseEvent, chat: ChatSession) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditTitleValue(chat.title);
  };

  const handleSaveRename = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (editTitleValue.trim()) {
      onRenameChat(chatId, editTitleValue.trim());
    }
    setEditingChatId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative w-full max-w-sm h-full bg-[#0b0f19] border-r border-white/10 shadow-2xl flex flex-col z-10">
        {/* Top Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">История запросов</h3>
              <p className="text-[11px] text-slate-400">Сохранено локально ({chats.length})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action button & Search Bar */}
        <div className="p-3.5 space-y-2.5 border-b border-white/10">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium text-sm shadow-md transition-all active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>Новый чат</span>
          </button>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по диалогам и текстам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {chats.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-medium">Нет сохраненных чатов</p>
              <p className="text-xs text-slate-500 mt-1">
                Начните диалог с любой моделью, и он автоматически сохранится в памяти
              </p>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-slate-400">Ничего не найдено по запросу "{searchQuery}"</p>
            </div>
          ) : (
            <>
              {groupedChats.today.length > 0 && (
                <ChatGroup
                  title="Сегодня"
                  items={groupedChats.today}
                  activeChatId={activeChatId}
                  editingChatId={editingChatId}
                  editTitleValue={editTitleValue}
                  onSelectChat={(id) => {
                    onSelectChat(id);
                    onClose();
                  }}
                  onDeleteChat={onDeleteChat}
                  onStartRename={handleStartRename}
                  onSaveRename={handleSaveRename}
                  onEditTitleChange={setEditTitleValue}
                />
              )}

              {groupedChats.yesterday.length > 0 && (
                <ChatGroup
                  title="Вчера"
                  items={groupedChats.yesterday}
                  activeChatId={activeChatId}
                  editingChatId={editingChatId}
                  editTitleValue={editTitleValue}
                  onSelectChat={(id) => {
                    onSelectChat(id);
                    onClose();
                  }}
                  onDeleteChat={onDeleteChat}
                  onStartRename={handleStartRename}
                  onSaveRename={handleSaveRename}
                  onEditTitleChange={setEditTitleValue}
                />
              )}

              {groupedChats.older.length > 0 && (
                <ChatGroup
                  title="Ранее"
                  items={groupedChats.older}
                  activeChatId={activeChatId}
                  editingChatId={editingChatId}
                  editTitleValue={editTitleValue}
                  onSelectChat={(id) => {
                    onSelectChat(id);
                    onClose();
                  }}
                  onDeleteChat={onDeleteChat}
                  onStartRename={handleStartRename}
                  onSaveRename={handleSaveRename}
                  onEditTitleChange={setEditTitleValue}
                />
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        {chats.length > 0 && (
          <div className="p-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Локальное хранилище</span>
            <button
              onClick={() => {
                if (confirm('Вы действительно хотите очистить всю историю чатов?')) {
                  onClearAllChats();
                }
              }}
              className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Очистить всё</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface ChatGroupProps {
  title: string;
  items: ChatSession[];
  activeChatId: string | null;
  editingChatId: string | null;
  editTitleValue: string;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onStartRename: (e: React.MouseEvent, chat: ChatSession) => void;
  onSaveRename: (e: React.MouseEvent, id: string) => void;
  onEditTitleChange: (val: string) => void;
}

const ChatGroup: React.FC<ChatGroupProps> = ({
  title,
  items,
  activeChatId,
  editingChatId,
  editTitleValue,
  onSelectChat,
  onDeleteChat,
  onStartRename,
  onSaveRename,
  onEditTitleChange,
}) => {
  return (
    <div className="space-y-1">
      <div className="px-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
        {title}
      </div>
      {items.map((chat) => {
        const isActive = chat.id === activeChatId;
        const isEditing = chat.id === editingChatId;

        return (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
              isActive
                ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                : 'hover:bg-white/[0.05] text-slate-300 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
              <MessageSquare
                className={`w-4 h-4 flex-shrink-0 ${
                  isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'
                }`}
              />

              {isEditing ? (
                <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editTitleValue}
                    onChange={(e) => onEditTitleChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onSaveRename(e as any, chat.id);
                    }}
                    autoFocus
                    className="w-full bg-black/50 px-2 py-0.5 rounded text-xs text-white border border-indigo-500 focus:outline-none"
                  />
                  <button
                    onClick={(e) => onSaveRename(e, chat.id)}
                    className="p-1 hover:text-emerald-400 text-slate-400"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">{chat.title}</div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span>{chat.modelId}</span>
                    <span>•</span>
                    <span>{chat.messages.length} сообщ.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions on hover */}
            {!isEditing && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => onStartRename(e, chat)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
                  title="Переименовать"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    exportChatToPdf(chat);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-white/10"
                  title="Экспорт в PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-white/10"
                  title="Удалить"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
