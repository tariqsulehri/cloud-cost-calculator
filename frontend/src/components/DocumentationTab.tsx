import { BookOpenText } from 'lucide-react';
import { useMemo, useState } from 'react';
import documentationText from '../../../documentation/app-review-and-roadmap.md?raw';
import { cn } from '../lib/utils';

interface DocSection {
  id: string;
  title: string;
  lines: string[];
}

export function DocumentationTab() {
  const sections = useMemo(() => parseSections(documentationText), []);
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? '');
  const activeSection = sections.find((section) => section.id === activeSectionId) ?? sections[0];

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
      <div className="border-b border-lineSoft bg-slate-50/70 px-5 py-4">
        <div className="dashboard-kicker text-violet">
          <BookOpenText className="h-3.5 w-3.5" aria-hidden="true" />
          Documentation
        </div>
        <h2 className="mt-2.5 text-base font-bold text-navy">Guidelines and operations</h2>
        <p className="mt-0.5 max-w-3xl text-xs leading-5 text-muted">
          Read the app guide by section. Use this for badge meanings, pricing limits, workflow, and cloud operations guidance.
        </p>
      </div>

      <div className="grid min-h-[620px] gap-0 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="border-b border-lineSoft bg-slate-50/70 p-3 lg:border-b-0 lg:border-r">
          <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wide text-muted">Sections</div>
          <div className="max-h-[560px] space-y-1 overflow-y-auto pr-1 scrollbar-thin">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSectionId(section.id)}
                className={cn(
                  'w-full rounded-lg px-3 py-2 text-left text-xs font-semibold leading-4 transition',
                  section.id === activeSection?.id ? 'bg-brand-accent text-white shadow-sm' : 'text-graphite hover:bg-white hover:text-azure'
                )}
              >
                {section.title}
              </button>
            ))}
          </div>
        </aside>

        <article className="min-w-0 p-5">
          {activeSection ? (
            <>
              <h3 className="text-xl font-extrabold text-navy">{activeSection.title}</h3>
              <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700">
                <MarkdownBlocks lines={activeSection.lines} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">No documentation content found.</p>
          )}
        </article>
      </div>
    </section>
  );
}

function MarkdownBlocks({ lines }: { lines: string[] }) {
  const blocks = groupBlocks(lines);

  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <h4 key={index} className="pt-2 text-sm font-extrabold uppercase tracking-wide text-navy">
              {formatInline(block.lines[0].replace(/^###\s+/, ''))}
            </h4>
          );
        }

        if (block.type === 'table') {
          return <MarkdownTable key={index} lines={block.lines} />;
        }

        if (block.type === 'list') {
          return (
            <ul key={index} className="space-y-1.5 rounded-lg border border-line bg-slate-50 px-4 py-3 text-xs leading-5">
              {block.lines.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-azure" />
                  <span>{formatInline(line.replace(/^-\s+/, ''))}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ordered') {
          return (
            <ol key={index} className="space-y-1.5 rounded-lg border border-line bg-slate-50 px-4 py-3 text-xs leading-5">
              {block.lines.map((line) => (
                <li key={line}>{formatInline(line.replace(/^\d+\.\s+/, ''))}</li>
              ))}
            </ol>
          );
        }

        if (block.type === 'code') {
          return (
            <pre key={index} className="overflow-x-auto rounded-lg border border-line bg-slate-950 px-3 py-2 text-xs text-slate-100">
              <code>{block.lines.join('\n')}</code>
            </pre>
          );
        }

        return (
          <p key={index} className="text-xs leading-5 text-slate-700">
            {formatInline(block.lines.join(' '))}
          </p>
        );
      })}
    </>
  );
}

function MarkdownTable({ lines }: { lines: string[] }) {
  const rows = lines
    .filter((line) => !/^\|\s*-+/.test(line))
    .map((line) =>
      line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim())
    );
  const [header, ...body] = rows;

  if (!header) {
    return null;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="min-w-full divide-y divide-line text-xs">
        <thead className="bg-navy text-left text-[11px] font-bold uppercase text-slate-200">
          <tr>
            {header.map((cell) => (
              <th key={cell} className="px-3 py-2.5">
                {formatInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {body.map((row, rowIndex) => (
            <tr key={`${row.join('-')}-${rowIndex}`} className={rowIndex % 2 === 1 ? 'bg-slate-50/70' : undefined}>
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`} className="px-3 py-2.5 align-top text-slate-700">
                  {formatInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function parseSections(markdown: string): DocSection[] {
  const lines = markdown.split(/\r?\n/);
  const sections: DocSection[] = [];
  let current: DocSection | null = null;

  lines.forEach((line) => {
    if (line.startsWith('## ')) {
      current = {
        id: slugify(line.replace(/^##\s+/, '')),
        title: line.replace(/^##\s+/, ''),
        lines: []
      };
      sections.push(current);
      return;
    }

    if (current) {
      current.lines.push(line);
    }
  });

  return sections;
}

type Block = {
  type: 'paragraph' | 'heading' | 'table' | 'list' | 'ordered' | 'code';
  lines: string[];
};

function groupBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let current: Block | null = null;
  let inCode = false;

  function pushCurrent() {
    if (current && current.lines.length > 0) {
      blocks.push(current);
    }
    current = null;
  }

  lines.forEach((line) => {
    if (line.trim().startsWith('```')) {
      if (inCode) {
        pushCurrent();
        inCode = false;
      } else {
        pushCurrent();
        current = { type: 'code', lines: [] };
        inCode = true;
      }
      return;
    }

    if (inCode) {
      current?.lines.push(line);
      return;
    }

    if (!line.trim()) {
      pushCurrent();
      return;
    }

    const type = blockTypeFor(line);
    if (!current || current.type !== type) {
      pushCurrent();
      current = { type, lines: [] };
    }
    current.lines.push(line);
  });

  pushCurrent();
  return blocks;
}

function blockTypeFor(line: string): Block['type'] {
  if (line.startsWith('### ')) {
    return 'heading';
  }
  if (line.startsWith('|')) {
    return 'table';
  }
  if (/^-\s+/.test(line)) {
    return 'list';
  }
  if (/^\d+\.\s+/.test(line)) {
    return 'ordered';
  }
  return 'paragraph';
}

function formatInline(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="rounded bg-slate-100 px-1 py-0.5 text-[0.95em] font-semibold text-navy">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-navy">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
