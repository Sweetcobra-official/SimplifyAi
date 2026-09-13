import React from 'react';
import { PenTool, Zap, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string) => void;
}

interface PromptOption {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  prompt: string;
  badge?: string;
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({ onSelectPrompt }) => {
  const options: PromptOption[] = [
    {
      id: 'write-text',
      title: 'Написать текст',
      subtitle: 'Пост, письмо или описание — в нужном стиле',
      icon: <PenTool className="w-4 h-4 text-slate-300" />,
      prompt: 'Помоги написать убедительный и живой текст для публикации: ',
    },
    {
      id: 'understand',
      title: 'Разобраться',
      subtitle: 'Объяснить сложную тему простыми словами',
      icon: <Zap className="w-4 h-4 text-slate-300" />,
      prompt: 'Объясни простыми словами, на наглядных примерах и аналогиях: ',
    },
    {
      id: 'brainstorm',
      title: 'Придумать идеи',
      subtitle: 'Собрать варианты для проекта или контента',
      icon: (
        <svg className="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 12l10 10 10-10L12 2z" />
        </svg>
      ),
      prompt: 'Предложи 7 нестандартных, креативных идей для: ',
    },
  ];

  return (
    <div className="w-full space-y-3">
      {/* Section Header */}
      <h2 className="text-sm font-medium text-slate-300 tracking-tight px-1">
        Попробуйте начать с этого
      </h2>

      {/* 3 Action Cards (matching screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((opt, index) => (
          <motion.button
            key={opt.id}
            onClick={() => onSelectPrompt(opt.prompt)}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="group relative flex flex-col items-start p-4 rounded-3xl bg-[#161e31]/80 hover:bg-[#1c273f]/90 border border-white/10 hover:border-cyan-400/30 transition-colors duration-300 text-left shadow-lg hover:shadow-[0_12px_30px_rgba(6,182,212,0.15)] backdrop-blur-xl overflow-hidden cursor-pointer"
          >
            {/* Circular frosted icon badge */}
            <div className="w-9 h-9 rounded-2xl bg-white/[0.08] border border-white/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-cyan-500/20 group-hover:border-cyan-400/40 group-hover:text-cyan-300 transition-all duration-300">
              {opt.icon}
            </div>

            {/* Title */}
            <div className="text-[15px] font-semibold text-white tracking-tight mb-1 group-hover:text-cyan-200 transition-colors">
              {opt.title}
            </div>

            {/* Subtitle */}
            <p className="text-[13px] text-slate-400 leading-snug group-hover:text-slate-300 transition-colors">
              {opt.subtitle}
            </p>

            {/* Glass refraction reflection sheen */}
            <div className="absolute inset-0 rounded-3xl pointer-events-none bg-gradient-to-tr from-white/[0.05] via-transparent to-transparent" />
            <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent group-hover:translate-x-full duration-1000 transition-transform pointer-events-none" />
          </motion.button>
        ))}
      </div>

      {/* Bottom Assurances (matching screenshot) */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-3 text-xs text-slate-400 font-medium">
        <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-1.5 text-slate-300 cursor-default">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>Без регистрации</span>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-1.5 text-slate-300 cursor-default">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>Бесплатный доступ</span>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-1.5 text-slate-300 cursor-default">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>История сохраняется</span>
        </motion.div>
      </div>
    </div>
  );
};
