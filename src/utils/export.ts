import { jsPDF } from 'jspdf';
import { ChatSession } from '../types';

/**
 * Exports a chat session to a cleanly formatted text file (.txt)
 */
export function exportChatToTxt(chat: ChatSession): void {
  const dateStr = new Date(chat.createdAt).toLocaleString('ru-RU');
  let content = `======================================================\n`;
  content += `Simplify AI — Экспорт диалога: ${chat.title}\n`;
  content += `Модель: ${chat.modelId}\n`;
  content += `Дата создания: ${dateStr}\n`;
  content += `Всего сообщений: ${chat.messages.length}\n`;
  content += `======================================================\n\n`;

  for (const msg of chat.messages) {
    const time = new Date(msg.timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const sender = msg.role === 'user' ? 'Пользователь' : `ИИ (${msg.modelName || chat.modelId})`;
    content += `[${time}] ${sender}:\n`;
    if (msg.thinkingContent) {
      content += `[Ход рассуждений]:\n${msg.thinkingContent}\n\n`;
    }
    content += `${msg.content}\n\n------------------------------------------------------\n\n`;
  }

  downloadFile(content, `${sanitizeFilename(chat.title)}.txt`, 'text/plain;charset=utf-8');
}

/**
 * Exports a chat session to a formatted Markdown file (.md)
 */
export function exportChatToMarkdown(chat: ChatSession): void {
  const dateStr = new Date(chat.createdAt).toLocaleString('ru-RU');
  let md = `# Simplify AI: ${chat.title}\n\n`;
  md += `> **Модель:** \`${chat.modelId}\`  \n`;
  md += `> **Дата создания:** ${dateStr}  \n`;
  md += `> **Сообщений:** ${chat.messages.length}\n\n---\n\n`;

  for (const msg of chat.messages) {
    const time = new Date(msg.timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
    if (msg.role === 'user') {
      md += `### 👤 Пользователь (${time})\n\n${msg.content}\n\n`;
    } else {
      md += `### 🤖 ${msg.modelName || 'Simplify AI'} (${time})\n\n`;
      if (msg.thinkingContent) {
        md += `<details><summary>Ход рассуждений (Reasoning)</summary>\n\n${msg.thinkingContent}\n\n</details>\n\n`;
      }
      md += `${msg.content}\n\n`;
    }
    md += `---\n\n`;
  }

  downloadFile(md, `${sanitizeFilename(chat.title)}.md`, 'text/markdown;charset=utf-8');
}

/**
 * Exports a chat session to a PDF document using jsPDF
 */
export function exportChatToPdf(chat: ChatSession): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  // Header Title
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text('Simplify AI', margin, cursorY);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Агрегатор нейросетей через IO Intelligence', margin + 35, cursorY);
  cursorY += 8;

  // Chat metadata box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, cursorY, contentWidth, 18, 3, 3, 'FD');

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  const safeTitle = chat.title.length > 50 ? chat.title.slice(0, 50) + '...' : chat.title;
  doc.text(`Тема: ${safeTitle}`, margin + 4, cursorY + 6);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const dateStr = new Date(chat.createdAt).toLocaleString('ru-RU');
  doc.text(`Модель: ${chat.modelId}  |  Дата: ${dateStr}  |  Сообщений: ${chat.messages.length}`, margin + 4, cursorY + 12);

  cursorY += 24;

  // Iterate messages
  for (const msg of chat.messages) {
    const isUser = msg.role === 'user';
    const roleLabel = isUser ? 'Вы (Пользователь)' : (msg.modelName || 'Simplify AI');
    const time = new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    // Check page overflow
    if (cursorY > pageHeight - 35) {
      doc.addPage();
      cursorY = margin;
    }

    // Role banner
    doc.setFontSize(10);
    if (isUser) {
      doc.setTextColor(37, 99, 235);
    } else {
      doc.setTextColor(16, 185, 129);
    }
    doc.text(`• ${roleLabel} [${time}]`, margin, cursorY);
    cursorY += 5;

    // Body content lines
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const splitLines = doc.splitTextToSize(msg.content, contentWidth - 4);

    for (const line of splitLines) {
      if (cursorY > pageHeight - 20) {
        doc.addPage();
        cursorY = margin;
      }
      doc.text(line, margin + 2, cursorY);
      cursorY += 4.5;
    }

    cursorY += 6;
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Simplify AI  •  Страница ${i} из ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  doc.save(`${sanitizeFilename(chat.title)}.pdf`);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '-').trim().slice(0, 40) || 'simplify-chat';
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
