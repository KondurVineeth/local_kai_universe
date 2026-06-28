import {
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  Check,
  ClipboardText,
} from '@phosphor-icons/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { APP_URLS } from '@shared/config/appUrls';
import { useContainer } from '@shared/container-context';
import { Button, Icon, ScrollArea } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { openExternalUrl } from '@shared/lib/openExternalUrl';
import { useAppDispatch } from '@shared/store/hooks';

import { lastVisitedSlugSet } from '../../store/slice';
import { DocsBreadcrumb } from '../DocsBreadcrumb';
import { MarkdownRenderer } from '../MarkdownRenderer';

import type { DocPage } from '../../../domain/entities/DocPage';

interface Neighbors {
  readonly current: DocPage | null;
  readonly prev: DocPage | null;
  readonly next: DocPage | null;
}

function findNeighbors(pages: readonly DocPage[], slug: string): Neighbors {
  const idx = pages.findIndex((p) => p.slug === slug);
  if (idx === -1) return { current: null, prev: null, next: null };
  return {
    current: pages[idx] ?? null,
    prev: idx > 0 ? pages[idx - 1] ?? null : null,
    next: idx < pages.length - 1 ? pages[idx + 1] ?? null : null,
  };
}

function ArrowButton({
  target,
  direction,
  onNavigate,
}: {
  readonly target: DocPage | null;
  readonly direction: 'prev' | 'next';
  readonly onNavigate: (slug: string) => void;
}) {
  const Glyph = direction === 'prev' ? ArrowLeft : ArrowRight;
  const label = direction === 'prev' ? 'Previous page' : 'Next page';
  return (
    <button
      type="button"
      onClick={() => target && onNavigate(target.slug)}
      disabled={!target}
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-sm transition-colors',
        target
          ? 'text-fg-muted hover:bg-bg-raised hover:text-fg-default'
          : 'cursor-not-allowed text-fg-subtle opacity-50',
      )}
      aria-label={label}
    >
      <Icon icon={Glyph} size="sm" />
    </button>
  );
}

function NeighborCard({
  page,
  direction,
}: {
  readonly page: DocPage;
  readonly direction: 'prev' | 'next';
}) {
  const isPrev = direction === 'prev';
  return (
    <Link
      to={`/developer-docs/${page.slug}`}
      className={cn(
        'group flex flex-col gap-1 rounded-md border border-border-default px-4 py-3 transition-colors hover:border-border-strong hover:bg-bg-raised',
        isPrev ? '' : 'items-end text-right',
      )}
    >
      <span className="flex items-center gap-1 text-xs text-fg-subtle">
        {isPrev ? (
          <>
            <Icon icon={ArrowLeft} size="xs" /> Previous
          </>
        ) : (
          <>
            Next <Icon icon={ArrowRight} size="xs" />
          </>
        )}
      </span>
      <span className="text-sm font-medium text-fg-default">{page.title}</span>
    </Link>
  );
}

function DocHeader({
  current,
  onCopy,
  copied,
}: {
  readonly current: DocPage;
  readonly onCopy: () => void;
  readonly copied: boolean;
}) {
  return (
    <header className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-border-default px-4">
      <div className="min-w-0 flex-1">
        <DocsBreadcrumb contentPath={current.contentPath} />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopy}
          leadingIcon={<Icon icon={copied ? Check : ClipboardText} size="xs" />}
        >
          {copied ? 'Copied' : 'Copy as Markdown'}
        </Button>
        {/* Opens the canonical docs site root from the central URL
            registry. The previous deep-link `${docs}/developer/${path}`
            guessed at a remote path structure that doesn't exist. */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openExternalUrl(APP_URLS.docs)}
          leadingIcon={<Icon icon={ArrowSquareOut} size="xs" />}
        >
          Show on Web
        </Button>
      </div>
    </header>
  );
}

export function DocPagePage() {
  const { slug = '' } = useParams<{ readonly slug: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const container = useContainer();
  const pages = useMemo(() => container.developerDocs.docsRepository.listAll(), [container]);
  const [copied, setCopied] = useState(false);

  const { current, prev, next } = useMemo(
    () => findNeighbors(pages, slug),
    [pages, slug],
  );

  useEffect(() => {
    if (current) dispatch(lastVisitedSlugSet(current.slug));
  }, [current, dispatch]);

  const handleCopy = useCallback(async () => {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API blocked — silent no-op is fine for a clickable mock.
    }
  }, [current]);

  if (!current) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm text-fg-default">Document not found.</p>
        <p className="max-w-md text-xs text-fg-muted">
          The page <code className="font-mono text-fg-subtle">{slug}</code> isn&apos;t in the docs
          manifest. It may have been renamed or removed.
        </p>
        <Button variant="primary" size="sm" onClick={() => navigate('/developer-docs')}>
          Back to Introduction
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-w-0 flex-col">
      <DocHeader current={current} onCopy={() => void handleCopy()} copied={copied} />
      <ScrollArea className="flex-1">
        <article className="mx-auto max-w-3xl px-8 py-6">
          <div className="mb-6 flex items-center gap-2">
            <ArrowButton target={prev} direction="prev" onNavigate={(s) => navigate(`/developer-docs/${s}`)} />
            <ArrowButton target={next} direction="next" onNavigate={(s) => navigate(`/developer-docs/${s}`)} />
            <h1 className="ml-2 text-2xl font-bold text-fg-default">{current.title}</h1>
          </div>
          <MarkdownRenderer body={current.body} />
          {(prev || next) && (
            <footer className="mt-12 grid grid-cols-2 gap-3 border-t border-border-default pt-6">
              {prev ? <NeighborCard page={prev} direction="prev" /> : <div />}
              {next ? <NeighborCard page={next} direction="next" /> : <div />}
            </footer>
          )}
        </article>
      </ScrollArea>
    </div>
  );
}
