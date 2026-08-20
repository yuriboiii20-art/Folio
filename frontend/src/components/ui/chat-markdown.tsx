import React, { useMemo } from 'react';

/**
 * ChatMarkdown
 * ---------------------------------------------------------------------------
 * A tiny, dependency-free renderer for AI Studio replies.
 *
 * The assistant is asked to answer with light structure — headings, bullets,
 * numbered steps, bold key terms and inline code — and this turns that into
 * real typography instead of leaving raw `**asterisks**` on screen.
 *
 * Supported: # headings, - / * / • bullets, 1. numbered lists, **bold**,
 * `inline code`, ``` fenced code ``` and blank-line paragraphs.
 */

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'code'; text: string }
  | { type: 'hr' }
  | { type: 'p'; text: string };

const STRUCTURAL = /^\s*(#{1,6}\s|[-*•]\s|\d+[.)]\s|```|---\s*$)/;

const parseBlocks = (source: string): Block[] => {
  const lines = (source || '').replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (/^\s*```/.test(line)) {
      const buffer: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) {
        buffer.push(lines[i]);
        i++;
      }
      i++; // skip the closing fence
      blocks.push({ type: 'code', text: buffer.join('\n') });
      continue;
    }

    if (!line.trim()) {
      i++;
      continue;
    }

    if (/^\s*---+\s*$/.test(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    const heading = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2].trim() });
      i++;
      continue;
    }

    if (/^\s*[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*•]\s+/, '').trim());
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, '').trim());
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Paragraph: run until a blank line or the next structural line
    const buffer: string[] = [];
    while (i < lines.length && lines[i].trim() && !STRUCTURAL.test(lines[i])) {
      buffer.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: 'p', text: buffer.join(' ') });
  }

  return blocks;
};

/** Render **bold** and `code` spans inside a line of text. */
const renderInline = (text: string, keyPrefix: string): React.ReactNode[] =>
  text
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .filter(Boolean)
    .map((part, idx) => {
      const key = `${keyPrefix}-${idx}`;

      if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={key} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }

      if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={key}
            className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[0.85em] text-slate-800"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      return <React.Fragment key={key}>{part}</React.Fragment>;
    });

export interface ChatMarkdownProps {
  content: string;
  className?: string;
}

export const ChatMarkdown: React.FC<ChatMarkdownProps> = ({ content, className = '' }) => {
  const blocks = useMemo(() => parseBlocks(content), [content]);

  return (
    <div className={`text-sm leading-relaxed text-slate-800 space-y-2.5 min-w-0 break-words ${className}`}>
      {blocks.map((block, idx) => {
        const key = `block-${idx}`;

        switch (block.type) {
          case 'heading':
            return (
              <h4
                key={key}
                className={`font-black text-slate-900 tracking-tight pt-1 ${
                  block.level <= 2 ? 'text-[15px]' : 'text-sm'
                }`}
              >
                {renderInline(block.text, key)}
              </h4>
            );

          case 'ul':
            return (
              <ul key={key} className="space-y-1.5 pl-1">
                {block.items.map((item, itemIdx) => (
                  <li key={`${key}-${itemIdx}`} className="flex gap-2.5">
                    <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                    <span className="min-w-0">{renderInline(item, `${key}-${itemIdx}`)}</span>
                  </li>
                ))}
              </ul>
            );

          case 'ol':
            return (
              <ol key={key} className="space-y-1.5 pl-1">
                {block.items.map((item, itemIdx) => (
                  <li key={`${key}-${itemIdx}`} className="flex gap-2.5">
                    <span className="text-xs font-mono font-bold text-slate-400 shrink-0 mt-0.5 w-4 text-right">
                      {itemIdx + 1}.
                    </span>
                    <span className="min-w-0">{renderInline(item, `${key}-${itemIdx}`)}</span>
                  </li>
                ))}
              </ol>
            );

          case 'hr':
            return <hr key={key} className="border-slate-200" />;

          case 'code':
            return (
              <pre
                key={key}
                className="p-3 rounded-lg bg-slate-900 text-slate-100 overflow-x-auto font-mono text-xs leading-relaxed"
              >
                {block.text}
              </pre>
            );

          default:
            return (
              <p key={key} className="whitespace-pre-wrap">
                {renderInline(block.text, key)}
              </p>
            );
        }
      })}
    </div>
  );
};

export default ChatMarkdown;
