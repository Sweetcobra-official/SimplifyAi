import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KeyRound, Check, X, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey } from '../services/api';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setKey(getStoredApiKey());
      setIsSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    setStoredApiKey(key.trim());
    setIsSaved(true);
    if (onSaved) onSaved();
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setKey('');
    setStoredApiKey('');
    setIsSaved(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-md rounded-2xl bg-[#0e1626] border border-white/15 p-5 sm:p-6 shadow-2xl relative overflow-hidden"
          >
            {/* Background ambient glow */}
            <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Ключ API (IO Intelligence)</h3>
                  <p className="text-xs text-slate-400">Для работы на GitHub Pages</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                На GitHub Pages нет сервера Node.js, поэтому запросы отправляются напрямую в нейросети. 
                Вставьте ваш ключ <code className="text-indigo-300 bg-white/5 px-1 py-0.5 rounded">io-v2-...</code> — он безопасно сохранится в вашем браузере.
              </p>

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="io-v2-..."
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <a
                  href="https://intelligence.io.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline"
                >
                  <span>Получить ключ на io.net</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                {key && (
                  <button
                    onClick={handleClear}
                    className="text-rose-400 hover:text-rose-300 hover:underline"
                  >
                    Сбросить
                  </button>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
              <button
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/10 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={!key.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-medium text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                {isSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Сохранено!</span>
                  </>
                ) : (
                  <span>Сохранить ключ</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
