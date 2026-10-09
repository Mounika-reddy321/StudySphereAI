import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`prose-sm max-w-none text-slate-800 dark:text-slate-200 leading-relaxed space-y-3 ${className}`}>
      {renderMarkdown(content)}
    </div>
  );
};

function renderMarkdown(raw: string): React.ReactNode[] {
  if (!raw) return [];

  // Split content by code blocks ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      const textChunk = raw.slice(lastIndex, match.index);
      nodes.push(...renderTextBlocks(textChunk, `text-${lastIndex}`));
    }

    const language = match[1] || 'code';
    const code = match[2] || '';
    nodes.push(
      <CodeBlock key={`code-${match.index}`} language={language} code={code} />
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < raw.length) {
    nodes.push(...renderTextBlocks(raw.slice(lastIndex), `text-${lastIndex}`));
  }

  return nodes;
}

function renderTextBlocks(chunk: string, keyPrefix: string): React.ReactNode[] {
  const lines = chunk.split('\n');
  const nodes: React.ReactNode[] = [];
  let tableBuffer: string[] = [];
  let inTable = false;

  const flushTable = (k: string) => {
    if (tableBuffer.length > 0) {
      nodes.push(<TableBlock key={k} lines={tableBuffer} />);
      tableBuffer = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table detection: line contains '|'
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      inTable = true;
      tableBuffer.push(line);
      continue;
    } else if (inTable) {
      flushTable(`${keyPrefix}-tbl-${i}`);
    }

    if (!line.trim()) {
      continue;
    }

    // Headings
    if (line.startsWith('#### ')) {
      nodes.push(
        <h4 key={`${keyPrefix}-${i}`} className="text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1">
          {formatInline(line.slice(5))}
        </h4>
      );
    } else if (line.startsWith('### ')) {
      nodes.push(
        <h3 key={`${keyPrefix}-${i}`} className="text-base font-bold text-slate-900 dark:text-white mt-4 mb-1.5 border-b border-slate-200/60 dark:border-slate-800 pb-1">
          {formatInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith('## ')) {
      nodes.push(
        <h2 key={`${keyPrefix}-${i}`} className="text-lg font-bold text-slate-900 dark:text-white mt-5 mb-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
          {formatInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith('# ')) {
      nodes.push(
        <h1 key={`${keyPrefix}-${i}`} className="text-xl font-extrabold text-slate-950 dark:text-white mt-6 mb-3">
          {formatInline(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith('> ')) {
      // Blockquote
      nodes.push(
        <blockquote key={`${keyPrefix}-${i}`} className="border-l-4 border-sky-500 pl-3.5 py-1 my-2 bg-sky-50/60 dark:bg-sky-950/20 text-slate-700 dark:text-slate-300 rounded-r text-sm italic">
          {formatInline(line.slice(2))}
        </blockquote>
      );
    } else if (/^[-*]\s/.test(line)) {
      // Unordered list item
      nodes.push(
        <li key={`${keyPrefix}-${i}`} className="ml-5 list-disc text-sm text-slate-800 dark:text-slate-200 pl-1 my-0.5">
          {formatInline(line.replace(/^[-*]\s/, ''))}
        </li>
      );
    } else if (/^\d+\.\s/.test(line)) {
      // Numbered list item
      const numMatch = line.match(/^(\d+)\.\s(.*)$/);
      nodes.push(
        <li key={`${keyPrefix}-${i}`} className="ml-5 list-decimal text-sm text-slate-800 dark:text-slate-200 pl-1 my-0.5">
          {formatInline(numMatch ? numMatch[2] : line)}
        </li>
      );
    } else {
      // Standard paragraph
      nodes.push(
        <p key={`${keyPrefix}-${i}`} className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed my-1">
          {formatInline(line)}
        </p>
      );
    }
  }

  flushTable(`${keyPrefix}-tbl-end`);
  return nodes;
}

function formatInline(text: string): React.ReactNode {
  // Replace inline bold, code, math
  const parts: React.ReactNode[] = [];
  // Tokenize `code`, **bold**, *italic*, $math$
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\$[^$]+\$)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }

    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 mx-0.5 rounded text-xs font-mono bg-sky-50 dark:bg-slate-800 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-slate-700/80">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-slate-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic text-slate-800 dark:text-slate-200">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('$') && token.endsWith('$')) {
      parts.push(
        <span key={match.index} className="font-mono text-xs px-1 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 rounded border border-amber-200/60 dark:border-amber-800/60">
          {token.slice(1, -1)}
        </span>
      );
    }

    lastIdx = match.index + token.length;
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return <>{parts}</>;
}

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-700/50 bg-slate-950 text-slate-100 shadow-md">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs">
        <span className="font-mono font-medium text-slate-400 uppercase tracking-wider">
          {language || 'text'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-slate-200 bg-slate-950/90">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
};

const TableBlock: React.FC<{ lines: string[] }> = ({ lines }) => {
  if (lines.length < 2) return null;

  const parseRow = (line: string) =>
    line
      .split('|')
      .slice(1, -1)
      .map(cell => cell.trim());

  const headers = parseRow(lines[0]);
  // line 1 is usually |---|---|
  const rowLines = lines.slice(2);

  return (
    <div className="my-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs text-left">
        <thead className="bg-slate-100 dark:bg-slate-800/80 font-semibold text-slate-800 dark:text-slate-200">
          <tr>
            {headers.map((h, idx) => (
              <th key={idx} className="px-3.5 py-2.5">
                {formatInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
          {rowLines.map((row, rIdx) => {
            const cells = parseRow(row);
            return (
              <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                {cells.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3.5 py-2 text-slate-700 dark:text-slate-300">
                    {formatInline(cell)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
