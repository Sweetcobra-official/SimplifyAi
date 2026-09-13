import React, { useState } from 'react';
import { ModelInfo } from '../types';
import { Check, Zap, Sparkles, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ModelSelectorProps {
  models: ModelInfo[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModelId,
  onSelectModel,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Top 3 featured models as shown in the screenshot
  const featuredModels = models.slice(0, 3);

  return (
    <div className="w-full space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-medium text-slate-300 tracking-tight">
          Выберите нейросеть
        </h2>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors px-2 py-0.5 rounded-full hover:bg-white/5 cursor-pointer"
          >
            <span>Каталог ({models.length})</span>
            <SlidersHorizontal className="w-3 h-3" />
          </motion.button>
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/20 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Все доступны</span>
          </div>
        </div>
      </div>

      {/* Featured Cards Row (matching the screenshot exactly) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {featuredModels.map((model) => {
          const isSelected = model.id === selectedModelId;
          return (
            <motion.button
              key={model.id}
              onClick={() => onSelectModel(model.id)}
              whileHover={{ y: -3, scale: 1.015 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`group relative flex items-center gap-3 p-3 rounded-2xl text-left transition-all duration-300 backdrop-blur-xl cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/90 border-2 border-indigo-400/90 shadow-[0_0_24px_rgba(99,102,241,0.3)]'
                  : 'bg-[#182032]/70 hover:bg-[#1f2a42]/85 border border-white/10 hover:border-white/20'
              }`}
            >
              {/* Colored Glow Circle */}
              <div
                className="relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                style={{
                  backgroundColor: model.color,
                  boxShadow: `0 0 16px ${model.accentGlow}`,
                }}
              >
                {isSelected && <Check className="w-4 h-4 text-slate-950 stroke-[3]" />}
              </div>

              {/* Text info */}
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold text-white tracking-tight truncate flex items-center gap-1.5">
                  <span>{model.name}</span>
                </div>
                <div className="text-[12px] text-slate-400 truncate">
                  {model.modelTag}
                </div>
              </div>

              {/* Subtle glass reflection highlight */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none bg-gradient-to-b from-white/[0.08] via-transparent to-transparent" />
            </motion.button>
          );
        })}
      </div>

      {/* Quick Access to other popular models if not featured */}
      <div className="flex items-center justify-between pt-0.5 px-1">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {models.slice(3).map((model) => {
            const isSelected = model.id === selectedModelId;
            return (
              <motion.button
                key={model.id}
                onClick={() => onSelectModel(model.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-white/20 text-white border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 border-white/5 hover:border-white/15'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: model.color }}
                />
                <span>{model.name}</span>
                <span className="text-[10px] text-slate-500">({model.modelTag})</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Full Models Modal / Drawer */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-3xl bg-[#0e1424] border border-white/15 shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <span>Бесплатные модели IO Intelligence</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Все доступные нейросети работают бесплатно без регистрации
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Model List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {models.map((model) => {
                  const isSelected = model.id === selectedModelId;
                  return (
                    <motion.button
                      key={model.id}
                      onClick={() => {
                        onSelectModel(model.id);
                        setIsModalOpen(false);
                      }}
                      whileHover={{ x: 4, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full flex items-start gap-3.5 p-4 rounded-2xl text-left transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-950/50 border-indigo-500/80 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                          : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
                        style={{
                          backgroundColor: model.color,
                          boxShadow: `0 0 16px ${model.accentGlow}`,
                        }}
                      >
                        {isSelected ? (
                          <Check className="w-5 h-5 text-slate-950 stroke-[3]" />
                        ) : (
                          <Zap className="w-5 h-5 text-slate-950 fill-slate-950" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-[15px]">
                              {model.name}
                            </span>
                            <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                              {model.modelTag}
                            </span>
                          </div>
                          <span className="text-[11px] font-medium text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded-full border border-cyan-500/30">
                            {model.latency}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                          {model.description}
                        </p>

                        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-mono">
                          <span>Провайдер: {model.provider}</span>
                          <span>•</span>
                          <span>Контекст: {model.contextWindow}</span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-slate-400">
                <span>Провайдер: IO Intelligence Free API Ecosystem</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors cursor-pointer shadow-lg"
                >
                  Готово
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
