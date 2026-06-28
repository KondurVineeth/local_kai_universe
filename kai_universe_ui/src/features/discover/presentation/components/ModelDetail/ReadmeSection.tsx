import { BookOpen, CaretDown } from '@phosphor-icons/react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Icon } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { openExternalUrl } from '@shared/lib/openExternalUrl';

export function ReadmeSection({ markdown }: { readonly markdown: string }) {
  const [open, setOpen] = useState(true);
  if (!markdown.trim()) return null;
  return (
    <section className="flex flex-col gap-2 rounded-md border border-border-default bg-bg-surface p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center justify-between gap-2 text-left"
      >
        <span className="inline-flex items-center gap-2">
          <Icon icon={BookOpen} size="sm" className="text-fg-muted" />
          <span className="text-xs font-medium text-fg-default">README</span>
        </span>
        <Icon
          icon={CaretDown}
          size="xs"
          className={cn(
            'text-fg-subtle transition-transform',
            open ? 'rotate-0' : '-rotate-90',
          )}
        />
      </button>
      {open && (
        <div className="prose-chat pt-2 text-xs leading-relaxed text-fg-default">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h2 className="mt-2 text-sm font-medium text-fg-default">{children}</h2>,
              h2: ({ children }) => <h3 className="mt-2 text-xs font-medium text-fg-default">{children}</h3>,
              p: ({ children }) => <p className="my-2 first:mt-0 text-fg-muted">{children}</p>,
              code: ({ children, className }) => {
                const isBlock = className?.startsWith('language-');
                if (isBlock) return <code className={className}>{children}</code>;
                return (
                  <code className="rounded-sm bg-bg-raised px-1 py-0.5 font-mono text-[11px]">
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre className="my-2 overflow-x-auto rounded-md bg-bg-raised p-3 text-[11px]">
                  {children}
                </pre>
              ),
              ul: ({ children }) => <ul className="my-2 list-disc pl-5 text-fg-muted">{children}</ul>,
              li: ({ children }) => <li className="my-0.5">{children}</li>,
              // External links in fixture READMEs would otherwise navigate
              // the Electron renderer away from the SPA. Route them through
              // the preload bridge to the OS default browser instead.
              a: ({ children, href }) => (
                <a
                  href={href ?? '#'}
                  onClick={(e) => {
                    if (!href) return;
                    e.preventDefault();
                    openExternalUrl(href);
                  }}
                  className="text-fg-accent underline underline-offset-2 hover:text-fg-accent/80"
                >
                  {children}
                </a>
              ),
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      )}
    </section>
  );
}
