import { CaretRight } from '@phosphor-icons/react';
import { Fragment, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { useContainer } from '@shared/container-context';
import { Icon } from '@shared/ds/primitives';

export interface DocsBreadcrumbProps {
  readonly contentPath: string;
}

// Human-readable section labels for the URL slugs in `contentPath`. Anything
// not in the map falls through to the raw slug. Keep keys in sync with the
// docs manifest sections.
const SECTION_LABELS: Readonly<Record<string, string>> = {
  developer: 'Developer',
  'openai-compat': 'OpenAI Compatibility',
  'anthropic-compat': 'Anthropic Compatibility',
  rest: 'REST API',
  sdk: 'SDK',
  core: 'Core',
};

export function DocsBreadcrumb({ contentPath }: DocsBreadcrumbProps) {
  const navigate = useNavigate();
  const container = useContainer();
  const pages = useMemo(
    () => container.developerDocs.docsRepository.listAll(),
    [container],
  );
  // First doc per section slug — that's the section "landing" page we
  // route to when a breadcrumb section segment is clicked. Built once per
  // pages list. The "developer" root segment maps to the docs index
  // (which redirects to introduction).
  const sectionLandings = useMemo(() => {
    const map = new Map<string, string>();
    for (const page of pages) {
      if (!map.has(page.section)) map.set(page.section, page.slug);
    }
    return map;
  }, [pages]);

  const parts = ['developer', ...contentPath.split('/')];

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 items-center gap-1 overflow-hidden text-xs text-fg-subtle"
    >
      {parts.map((part, i) => {
        const isLast = i === parts.length - 1;
        const label = SECTION_LABELS[part] ?? part;
        const isRoot = i === 0;
        // Sections are everything between root and the final doc slug. They
        // route to the first doc in that section if we have one — otherwise
        // they fall through to a non-interactive span (defensive fallback).
        const isSection = !isRoot && !isLast;
        const sectionLanding = isSection ? sectionLandings.get(part) : undefined;
        const showAsLink =
          (isRoot && !isLast) || (isSection && sectionLanding !== undefined);
        const onClick = isRoot
          ? () => navigate('/developer-docs')
          : sectionLanding
            ? () => navigate(`/developer-docs/${sectionLanding}`)
            : undefined;

        return (
          <Fragment key={`${part}-${i}`}>
            {i > 0 && (
              <Icon
                icon={CaretRight}
                size="xs"
                weight="bold"
                className="shrink-0 text-fg-subtle"
              />
            )}
            {showAsLink && onClick ? (
              <button
                type="button"
                onClick={onClick}
                className="shrink-0 truncate rounded-sm text-fg-subtle transition-colors hover:text-fg-default"
              >
                {label}
              </button>
            ) : (
              <span
                className={`truncate ${isLast ? 'min-w-0 text-fg-default' : 'shrink-0'}`}
                title={label}
              >
                {label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
