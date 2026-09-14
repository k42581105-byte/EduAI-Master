import React from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = React.useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  // Helper to process line-by-line markdown
  const renderMarkdownBlocks = (text: string) => {
    // Split by code blocks first
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let codeIndex = 0;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Text before code block
      if (match.index > lastIndex) {
        const textChunk = text.substring(lastIndex, match.index);
        blocks.push(renderTextChunk(textChunk, `text-${lastIndex}`));
      }

      const lang = match[1] || 'code';
      const codeText = match[2].trim();
      const currentCodeIndex = codeIndex++;

      blocks.push(
        <div
          key={`code-${match.index}`}
          className="my-3 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xs"
        >
          <div className="flex items-center justify-between bg-slate-900 px-3 py-1.5 text-xs text-slate-400 border-b border-slate-800">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <Terminal className="h-3.5 w-3.5 text-indigo-400" />
              {lang}
            </span>
            <button
              onClick={() => handleCopyCode(codeText, currentCodeIndex)}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              {copiedCodeIndex === currentCodeIndex ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              <span>{copiedCodeIndex === currentCodeIndex ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
            <code>{codeText}</code>
          </pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      blocks.push(renderTextChunk(text.substring(lastIndex), `text-${lastIndex}`));
    }

    return blocks;
  };

  const renderTextChunk = (text: string, keyPrefix: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Check Table
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        const cells = trimmed
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());

        if (tableHeaders.length === 0) {
          tableHeaders = cells;
        } else if (cells.every((c) => /^:?-+:?$/.test(c))) {
          // delimiter row
        } else {
          tableRows.push(cells);
        }

        if (idx === lines.length - 1 || !lines[idx + 1].trim().startsWith('|')) {
          // Flush table
          elements.push(
            <div key={`${keyPrefix}-table-${idx}`} className="my-3 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80">
                    {tableHeaders.map((h, i) => (
                      <th key={i} className="p-2 border border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-200">
                        {renderInlineFormatting(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                          {renderInlineFormatting(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          inTable = false;
          tableHeaders = [];
          tableRows = [];
        }
        return;
      }

      if (!trimmed) {
        elements.push(<div key={`${keyPrefix}-blank-${idx}`} className="h-2" />);
        return;
      }

      // Headings
      if (trimmed.startsWith('#### ')) {
        elements.push(
          <h4 key={`${keyPrefix}-h4-${idx}`} className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-3 mb-1">
            {renderInlineFormatting(trimmed.slice(5))}
          </h4>
        );
        return;
      }

      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={`${keyPrefix}-h3-${idx}`} className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-4 mb-2 flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-1">
            {renderInlineFormatting(trimmed.slice(4))}
          </h3>
        );
        return;
      }

      if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={`${keyPrefix}-h2-${idx}`} className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">
            {renderInlineFormatting(trimmed.slice(3))}
          </h2>
        );
        return;
      }

      // Horizontal rule
      if (trimmed === '---' || trimmed === '***') {
        elements.push(<hr key={`${keyPrefix}-hr-${idx}`} className="my-3 border-slate-200 dark:border-slate-800" />);
        return;
      }

      // Blockquotes / Callout boxes
      if (trimmed.startsWith('> ')) {
        elements.push(
          <div
            key={`${keyPrefix}-quote-${idx}`}
            className="my-2 p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border-l-4 border-indigo-500 text-xs sm:text-sm text-slate-700 dark:text-slate-300"
          >
            {renderInlineFormatting(trimmed.slice(2))}
          </div>
        );
        return;
      }

      // Unordered list
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        elements.push(
          <div key={`${keyPrefix}-ul-${idx}`} className="flex items-start gap-2 my-1 text-xs sm:text-sm text-slate-800 dark:text-slate-200 pl-2">
            <span className="text-indigo-500 font-bold mt-0.5">•</span>
            <div className="flex-1">{renderInlineFormatting(trimmed.slice(2))}</div>
          </div>
        );
        return;
      }

      // Numbered list
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        elements.push(
          <div key={`${keyPrefix}-ol-${idx}`} className="flex items-start gap-2 my-1 text-xs sm:text-sm text-slate-800 dark:text-slate-200 pl-1">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs min-w-[18px] text-right mt-0.5">
              {numMatch[1]}.
            </span>
            <div className="flex-1">{renderInlineFormatting(numMatch[2])}</div>
          </div>
        );
        return;
      }

      // Regular Paragraph
      elements.push(
        <p key={`${keyPrefix}-p-${idx}`} className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 my-1 leading-relaxed">
          {renderInlineFormatting(trimmed)}
        </p>
      );
    });

    return elements;
  };

  // Inline formatting helper for Bold, Italic, Code, and Math formulas
  const renderInlineFormatting = (text: string): React.ReactNode => {
    // Regex for inline Math ($...$ or $$...$$), Bold (**...**), Code (`...`), Italic (*...*)
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // 1. Math block ($$ ... $$ or $ ... $)
      const mathMatch = remaining.match(/(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/);
      const boldMatch = remaining.match(/(\*\*[^\*]+?\*\*)/);
      const codeMatch = remaining.match(/(`[^`]+?`)/);

      // Find earliest match index
      let earliestType: 'math' | 'bold' | 'code' | null = null;
      let minPos = remaining.length;

      if (mathMatch && mathMatch.index! < minPos) {
        minPos = mathMatch.index!;
        earliestType = 'math';
      }
      if (boldMatch && boldMatch.index! < minPos) {
        minPos = boldMatch.index!;
        earliestType = 'bold';
      }
      if (codeMatch && codeMatch.index! < minPos) {
        minPos = codeMatch.index!;
        earliestType = 'code';
      }

      if (!earliestType) {
        parts.push(remaining);
        break;
      }

      // Text before match
      if (minPos > 0) {
        parts.push(remaining.substring(0, minPos));
      }

      if (earliestType === 'math' && mathMatch) {
        const mathContent = mathMatch[0].replace(/^\$\$?|\$\$?$/g, '');
        parts.push(
          <span
            key={`math-${keyIdx++}`}
            className="inline-block px-2 py-0.5 my-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 font-mono text-xs text-indigo-700 dark:text-indigo-300 font-bold"
          >
            {mathContent}
          </span>
        );
        remaining = remaining.substring(minPos + mathMatch[0].length);
      } else if (earliestType === 'bold' && boldMatch) {
        const boldText = boldMatch[0].slice(2, -2);
        parts.push(
          <strong key={`bold-${keyIdx++}`} className="font-bold text-slate-900 dark:text-white">
            {boldText}
          </strong>
        );
        remaining = remaining.substring(minPos + boldMatch[0].length);
      } else if (earliestType === 'code' && codeMatch) {
        const codeText = codeMatch[0].slice(1, -1);
        parts.push(
          <code
            key={`code-${keyIdx++}`}
            className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 font-mono text-[12px] border border-slate-200 dark:border-slate-700"
          >
            {codeText}
          </code>
        );
        remaining = remaining.substring(minPos + codeMatch[0].length);
      }
    }

    return <>{parts}</>;
  };

  return <div className="space-y-1 font-sans">{renderMarkdownBlocks(content)}</div>;
};
