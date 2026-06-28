import { CaretDown } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';

import { useContainer } from '@shared/container-context';
import { SecondarySidebar } from '@shared/ds/layouts';
import { Icon } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import {
  COLLAPSIBLE_SECTIONS,
  DOC_SECTION_LABELS,
} from '../../../domain/value-objects/DocSection';
import { selectExpandedSections } from '../../store/selectors';
import { sectionToggled } from '../../store/slice';
import { MethodBadge } from '../MethodBadge';

import type { DocPage } from '../../../domain/entities/DocPage';
import type { DocSection } from '../../../domain/value-objects/DocSection';

function groupBySection(pages: readonly DocPage[]): ReadonlyMap<DocSection, readonly DocPage[]> {
  const map = new Map<DocSection, DocPage[]>();
  for (const p of pages) {
    const list = map.get(p.section) ?? [];
    list.push(p);
    map.set(p.section, list);
  }
  return map;
}

function DocRow({ page }: { readonly page: DocPage }) {
  return (
    <NavLink
      to={`/developer-docs/${page.slug}`}
      className={({ isActive }) =>
        cn(
          'flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1 text-xs transition-colors',
          isActive
            ? 'bg-bg-raised text-fg-default'
            : 'text-fg-muted hover:bg-bg-raised hover:text-fg-default',
        )
      }
    >
      <span className="truncate">{page.title}</span>
      {page.method && <MethodBadge method={page.method} />}
    </NavLink>
  );
}

export function DeveloperDocsSecondarySidebar() {
  const dispatch = useAppDispatch();
  const expanded = useAppSelector(selectExpandedSections);
  const container = useContainer();
  const pages = useMemo(() => container.developerDocs.docsRepository.listAll(), [container]);
  const grouped = useMemo(() => groupBySection(pages), [pages]);

  const topPages = grouped.get('top') ?? [];

  return (
    <SecondarySidebar title="Developer">
      <nav className="flex flex-col gap-1 px-2 py-3">
        {topPages.map((p) => (
          <DocRow key={p.slug} page={p} />
        ))}

        {COLLAPSIBLE_SECTIONS.map((section) => {
          const sectionPages = grouped.get(section) ?? [];
          if (sectionPages.length === 0) return null;
          const isOpen = expanded[section] ?? true;
          return (
            <div key={section} className="mt-2">
              <button
                type="button"
                onClick={() => dispatch(sectionToggled(section))}
                className="flex w-full items-center justify-between rounded-sm px-2 py-1 text-xs font-medium text-fg-subtle hover:text-fg-default"
                aria-expanded={isOpen}
              >
                <span className="uppercase tracking-wide">{DOC_SECTION_LABELS[section]}</span>
                <Icon
                  icon={CaretDown}
                  size="xs"
                  weight="bold"
                  className={cn('transition-transform', isOpen ? '' : '-rotate-90')}
                />
              </button>
              {isOpen && (
                <div className="ml-1 mt-1 flex flex-col gap-px border-l border-border-default pl-2">
                  {sectionPages.map((p) => (
                    <DocRow key={p.slug} page={p} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </SecondarySidebar>
  );
}
