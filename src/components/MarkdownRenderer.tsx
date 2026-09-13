import React, { useState } from 'react';
import { Check, Copy, Brain, ChevronDown, ChevronRight, History, Sparkles, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Extract <context> blocks if present
  const contextRegex = /<context>([\s\S]*?)<\/context>/i;
  const contextMatch = content.match(contextRegex);
  const contextText = contextMatch ? contextMatch[1].trim() : null;
  let remainingContent = contextMatch ? content.replace(contextRegex, '').trim() : content;

  // Extract <think> blocks if present (used by DeepSeek R1)
  const thinkRegex = /<think>([\s\S]*?)<\/think>/i;
  const thinkMatch = remainingContent.match(thinkRegex);
  const thinkingText = thinkMatch ? thinkMatch[1].trim() : null;
  const mainContent = thinkMatch ? remainingContent.replace(thinkRegex, '').trim() : remainingContent;

  return (
    <div className="space-y-3.5 leading-relaxed text-[15px] font-normal tracking-wide text-slate-100">
      {/* Context of previous messages */}
      {contextText && <PriorContextBlock rawContext={contextText} />}
      {thinkingText && <ThinkingBlock thoughts={thinkingText} />}
      <ParsedMarkdown text={mainContent} />
    </div>
  );
};

export const PriorContextBlock: React.FC<{ rawContext: string }> = ({ rawContext }) => {
  const [isOpen, setIsOpen] = useState(true);

  // Parse lines starting with '-' or '*' or clean text
  const lines = rawContext
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.toLowerCase().includes('**до этого:**') && !l.toLowerCase().includes('до этого:'));

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mb-4 rounded-2xl border border-cyan-500/25 bg-gradient-to-r from-cyan-950/30 via-slate-900/40 to-indigo-950/30 backdrop-blur-xl overflow-hidden shadow-[0_4px_20px_rgba(6,182,212,0.08)]"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-cyan-900/20 hover:bg-cyan-900/30 text-cyan-200 font-medium transition-colors text-xs sm:text-sm"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
            <History className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-cyan-200">Контекст диалога</span>
          <span className="px-2 py-0.5 rounded-full bg-cyan-400/15 border border-cyan-400/25 text-[11px] font-medium text-cyan-300">
            До этого:
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-cyan-300/80">
          <span>{isOpen ? 'Свернуть' : 'Развернуть'}</span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="p-3 sm:p-3.5 border-t border-cyan-500/15 space-y-2 bg-black/20"
          >
            <div className="text-xs text-cyan-100/90 space-y-1.5">
              {lines.length > 0 ? (
                lines.map((line, idx) => {
                  const clean = line.replace(/^[-*•]\s*/, '');
                  return (
                    <div key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] mt-1.5 flex-shrink-0" />
                      <span>{renderInlineFormatting(clean)}</span>
                    </div>
                  );
                })
              ) : (
                <div className="leading-relaxed">
                  {renderInlineFormatting(rawContext)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ThinkingBlock: React.FC<{ thoughts: string }> = ({ thoughts }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-4 rounded-xl border border-purple-500/25 bg-purple-950/20 backdrop-blur-md overflow-hidden text-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-purple-900/30 hover:bg-purple-900/40 text-purple-300 font-medium transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
          <span>Ход логических рассуждений (DeepSeek R1)</span>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4 text-purple-300" /> : <ChevronRight className="w-4 h-4 text-purple-300" />}
      </button>

      {isOpen && (
        <div className="p-3.5 text-xs text-purple-200/80 whitespace-pre-wrap leading-relaxed border-t border-purple-500/20 font-mono max-h-64 overflow-y-auto">
          {thoughts}
        </div>
      )}
    </div>
  );
};

const ParsedMarkdown: React.FC<{ text: string }> = ({ text }) => {
  // Split into blocks: code blocks or regular text
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      parts.push(renderTextBlocks(beforeText, `txt-${lastIndex}`));
    }
    const lang = match[1] || 'text';
    const code = match[2];
    parts.push(<CodeBlock key={`code-${match.index}`} language={lang} code={code} />);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(renderTextBlocks(text.slice(lastIndex), `txt-${lastIndex}`));
  }

  return <>{parts}</>;
};

function renderTextBlocks(raw: string, keyPrefix: string): React.ReactNode {
  const paragraphs = raw.split(/\n\s*\n/);

  return (
    <React.Fragment key={keyPrefix}>
      {paragraphs.map((para, i) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        // Headings
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={`${keyPrefix}-h3-${i}`} className="text-lg font-semibold text-white mt-4 mb-2 tracking-tight">
              {renderInlineFormatting(trimmed.slice(4))}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={`${keyPrefix}-h2-${i}`} className="text-xl font-bold text-white mt-5 mb-2.5 tracking-tight border-b border-white/10 pb-1">
              {renderInlineFormatting(trimmed.slice(3))}
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={`${keyPrefix}-h1-${i}`} className="text-2xl font-bold text-white mt-6 mb-3 tracking-tight">
              {renderInlineFormatting(trimmed.slice(2))}
            </h1>
          );
        }

        // Blockquote
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={`${keyPrefix}-bq-${i}`}
              className="border-l-2 border-indigo-400/70 bg-indigo-500/10 pl-3.5 py-1.5 rounded-r-lg my-2 text-slate-300 italic"
            >
              {renderInlineFormatting(trimmed.slice(2))}
            </blockquote>
          );
        }

        // Unordered list
        if (trimmed.split('\n').every((line) => line.trim().startsWith('- ') || line.trim().startsWith('* '))) {
          const items = trimmed.split('\n').map((line) => line.trim().replace(/^[-*]\s+/, ''));
          return (
            <ul key={`${keyPrefix}-ul-${i}`} className="list-disc list-inside space-y-1 my-2 text-slate-200">
              {items.map((it, idx) => (
                <li key={idx} className="leading-relaxed">
                  {renderInlineFormatting(it)}
                </li>
              ))}
            </ul>
          );
        }

        // Ordered list
        if (trimmed.split('\n').every((line) => /^\d+\.\s+/.test(line.trim()))) {
          const items = trimmed.split('\n').map((line) => line.trim().replace(/^\d+\.\s+/, ''));
          return (
            <ol key={`${keyPrefix}-ol-${i}`} className="list-decimal list-inside space-y-1 my-2 text-slate-200">
              {items.map((it, idx) => (
                <li key={idx} className="leading-relaxed">
                  {renderInlineFormatting(it)}
                </li>
              ))}
            </ol>
          );
        }

        // Standard paragraph
        return (
          <p key={`${keyPrefix}-p-${i}`} className="my-2 leading-relaxed text-slate-200">
            {renderInlineFormatting(trimmed)}
          </p>
        );
      })}
    </React.Fragment>
  );
}

function renderInlineFormatting(text: string): React.ReactNode[] {
  // Regex to match inline code, bold, italic, and bold-italic
  const tokenRegex = /(`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={`code-${match.index}`}
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-white/10 text-cyan-300 font-mono text-[13px] border border-white/10"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('***') && token.endsWith('***')) {
      parts.push(
        <strong key={`bi-${match.index}`} className="font-bold italic text-white">
          {token.slice(3, -3)}
        </strong>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`b-${match.index}`} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={`i-${match.index}`} className="italic text-slate-300">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIdx = match.index + token.length;
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return parts;
}

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="relative my-3 rounded-xl border border-white/10 bg-[#0d121f] overflow-hidden shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/10 bg-white/[0.04] text-xs text-slate-400">
        <span className="font-mono font-medium tracking-wider uppercase text-cyan-400/90">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          title="Копировать код"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Скопировано</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Копировать</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto font-mono text-[13.5px] leading-relaxed text-slate-200">
        <pre>{code}</pre>
      </div>
    </div>
  );
};
