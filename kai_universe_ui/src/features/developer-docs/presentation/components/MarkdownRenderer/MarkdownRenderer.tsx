import { Check, ClipboardText, Info, Lightbulb, Warning, WarningCircle } from '@phosphor-icons/react';
import {
  isValidElement,
  useCallback,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

import { Icon } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { openExternalUrl } from '@shared/lib/openExternalUrl';

import type { IconType } from '@shared/ds/primitives';

type CalloutKind = 'INFO' | 'NOTE' | 'TIP' | 'WARNING' | 'IMPORTANT';

interface CalloutMeta {
  readonly label: string;
  readonly icon: IconType;
  readonly tone: string;
}

const CALLOUT_META: Readonly<Record<CalloutKind, CalloutMeta>> = {
  INFO: { label: 'Info', icon: Info, tone: 'border-l-accent bg-accent-subtle' },
  NOTE: { label: 'Note', icon: Info, tone: 'border-l-accent bg-accent-subtle' },
  TIP: { label: 'Tip', icon: Lightbulb, tone: 'border-l-success bg-success-subtle' },
  WARNING: { label: 'Warning', icon: Warning, tone: 'border-l-warning bg-warning-subtle' },
  IMPORTANT: {
    label: 'Important',
    icon: WarningCircle,
    tone: 'border-l-warning bg-warning-subtle',
  },
};

const CALLOUT_TOKEN = /^\[!(INFO|NOTE|TIP|WARNING|IMPORTANT)\]\s*/i;

function extractCallout(children: ReactNode): {
  readonly kind: CalloutKind | null;
  readonly stripped: ReactNode;
} {
  const arr = Array.isArray(children) ? children : [children];
  for (let i = 0; i < arr.length; i += 1) {
    const node = arr[i];
    if (typeof node === 'string') {
      const trimmed = node.trimStart();
      const match = trimmed.match(CALLOUT_TOKEN);
      if (match) {
        const kind = match[1]?.toUpperCase() as CalloutKind;
        const rest = trimmed.slice(match[0].length);
        const next = [...arr];
        next[i] = rest;
        return { kind, stripped: next };
      }
      return { kind: null, stripped: children };
    }
    if (isValidElement(node)) {
      const inner = (node.props as { readonly children?: ReactNode }).children;
      const recur = extractCallout(inner);
      if (recur.kind) {
        const next = [...arr];
        next[i] = { ...node, props: { ...(node.props as object), children: recur.stripped } };
        return { kind: recur.kind, stripped: next };
      }
    }
  }
  return { kind: null, stripped: children };
}

function Blockquote({ children }: ComponentPropsWithoutRef<'blockquote'>) {
  const { kind, stripped } = extractCallout(children);
  if (kind) {
    const meta = CALLOUT_META[kind];
    return (
      <aside
        className={cn(
          'my-4 flex gap-3 rounded-md border border-border-default border-l-2 px-4 py-3',
          meta.tone,
        )}
      >
        <span className="mt-0.5 shrink-0">
          <Icon icon={meta.icon} size="sm" weight="fill" />
        </span>
        <div className="min-w-0 flex-1 space-y-2 text-sm leading-relaxed text-fg-default">
          <div className="text-xs font-semibold uppercase tracking-wide text-fg-default">
            {meta.label}
          </div>
          <div className="[&_p]:m-0 [&_p+p]:mt-2">{stripped}</div>
        </div>
      </aside>
    );
  }
  return (
    <blockquote className="my-4 border-l-2 border-border-strong bg-bg-surface px-4 py-3 text-sm italic text-fg-muted">
      {children}
    </blockquote>
  );
}

function Anchor({ children, href }: ComponentPropsWithoutRef<'a'>) {
  const navigate = useNavigate();
  const isExternal = !!href && /^https?:\/\//.test(href);
  // Internal href patterns we treat as in-app navigation. Matches
  // `/developer-docs/...` absolute paths and slug-only relative paths.
  const isInternalRoute = !!href && (href.startsWith('/developer-docs/') || (!isExternal && !href.startsWith('#') && !href.startsWith('mailto:')));
  return (
    <a
      href={href}
      onClick={(e) => {
        if (!href) return;
        if (isExternal) {
          e.preventDefault();
          openExternalUrl(href);
          return;
        }
        if (isInternalRoute) {
          e.preventDefault();
          const target = href.startsWith('/developer-docs/') ? href : `/developer-docs/${href}`;
          navigate(target);
        }
      }}
      className="text-fg-accent underline decoration-fg-accent/40 underline-offset-2 hover:decoration-fg-accent"
    >
      {children}
    </a>
  );
}

function Code({
  inline,
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<'code'> & { readonly inline?: boolean }) {
  if (inline) {
    return (
      <code
        className="rounded-xs bg-bg-raised px-1 py-px font-mono text-[0.85em] text-fg-default"
        {...rest}
      >
        {children}
      </code>
    );
  }
  return (
    <code className={cn('font-mono text-sm', className)} {...rest}>
      {children}
    </code>
  );
}

// Code block with a per-snippet copy button. The button reads the
// rendered <pre>'s textContent on click — robust against the nested
// <code>/highlight-span structure rehype-highlight produces.
function Pre({ children }: ComponentPropsWithoutRef<'pre'>) {
  const preRef = useRef<HTMLPreElement | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const text = preRef.current?.textContent ?? '';
    if (!text) return;
    try {
      void navigator.clipboard.writeText(text).then(
        () => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        },
        () => {
          // Clipboard write rejected — no feedback, no crash.
        },
      );
    } catch {
      // Clipboard API unavailable — silent no-op is fine for the mock.
    }
  }, []);

  return (
    <div className="group relative my-4">
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Code copied' : 'Copy code'}
        className={cn(
          'absolute right-2 top-2 inline-flex items-center gap-1 rounded-sm border border-border-default bg-bg-raised px-2 py-1 text-[10px] transition-opacity',
          copied
            ? 'text-success opacity-100'
            : 'text-fg-subtle opacity-0 hover:text-fg-default group-hover:opacity-100 focus-visible:opacity-100',
        )}
      >
        <Icon icon={copied ? Check : ClipboardText} size="xs" />
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre
        ref={preRef}
        className="overflow-x-auto rounded-md border border-border-default bg-bg-base p-4 text-sm leading-relaxed"
      >
        {children}
      </pre>
    </div>
  );
}

function H1({ children }: ComponentPropsWithoutRef<'h1'>) {
  return <h1 className="mt-2 mb-4 text-2xl font-bold text-fg-default">{children}</h1>;
}
function H2({ children }: ComponentPropsWithoutRef<'h2'>) {
  return <h2 className="mt-8 mb-3 text-xl font-semibold text-fg-default">{children}</h2>;
}
function H3({ children }: ComponentPropsWithoutRef<'h3'>) {
  return <h3 className="mt-6 mb-2 text-base font-semibold text-fg-default">{children}</h3>;
}
function H4({ children }: ComponentPropsWithoutRef<'h4'>) {
  return (
    <h4 className="mt-4 mb-2 text-sm font-semibold uppercase tracking-wide text-fg-muted">
      {children}
    </h4>
  );
}
function P({ children }: ComponentPropsWithoutRef<'p'>) {
  return <p className="my-3 text-sm leading-relaxed text-fg-muted">{children}</p>;
}
function Ul({ children }: ComponentPropsWithoutRef<'ul'>) {
  return <ul className="my-3 ml-5 list-disc space-y-1 text-sm text-fg-muted">{children}</ul>;
}
function Ol({ children }: ComponentPropsWithoutRef<'ol'>) {
  return <ol className="my-3 ml-5 list-decimal space-y-1 text-sm text-fg-muted">{children}</ol>;
}
function Li({ children }: ComponentPropsWithoutRef<'li'>) {
  return <li className="leading-relaxed [&_p]:my-1">{children}</li>;
}
function Hr() {
  return <hr className="my-6 border-border-default" />;
}
function Table({ children }: ComponentPropsWithoutRef<'table'>) {
  return (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  );
}
function Th({ children }: ComponentPropsWithoutRef<'th'>) {
  return (
    <th className="border border-border-default bg-bg-surface px-3 py-2 text-left font-semibold text-fg-default">
      {children}
    </th>
  );
}
function Td({ children }: ComponentPropsWithoutRef<'td'>) {
  return (
    <td className="border border-border-default px-3 py-2 align-top text-fg-muted">
      {children}
    </td>
  );
}
function Strong({ children }: ComponentPropsWithoutRef<'strong'>) {
  return <strong className="font-semibold text-fg-default">{children}</strong>;
}

export interface MarkdownRendererProps {
  readonly body: string;
}

export function MarkdownRenderer({ body }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        h1: H1,
        h2: H2,
        h3: H3,
        h4: H4,
        p: P,
        ul: Ul,
        ol: Ol,
        li: Li,
        a: Anchor,
        code: Code,
        pre: Pre,
        hr: Hr,
        table: Table,
        th: Th,
        td: Td,
        strong: Strong,
        blockquote: Blockquote,
      }}
    >
      {body}
    </ReactMarkdown>
  );
}
