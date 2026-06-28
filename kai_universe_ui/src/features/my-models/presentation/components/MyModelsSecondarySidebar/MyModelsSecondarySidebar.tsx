import { Brain, ChartBar, Cube, Eye, FunnelSimple, Wrench } from '@phosphor-icons/react';

import { SecondarySidebar } from '@shared/ds/layouts';
import { Icon } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { selectMyModelsCategory } from '../../store/selectors';
import { categorySet, type MyModelsCategory } from '../../store/slice';

interface NavItem {
  readonly key: MyModelsCategory;
  readonly label: string;
  readonly icon: typeof Cube;
}

// Browse — primary entry points (every model the user owns).
const BROWSE: readonly NavItem[] = [{ key: 'all', label: 'View All', icon: ChartBar }];

// Filter by capability — mirrors Discover so a user's mental map of
// "amber = tools" carries between surfaces. Same five items in the same
// order as DiscoverSecondarySidebar.
const CAPABILITY: readonly NavItem[] = [
  { key: 'llms', label: 'LLMs', icon: Cube },
  { key: 'embeddings', label: 'Text Embedding', icon: FunnelSimple },
  { key: 'vision', label: 'Vision', icon: Eye },
  { key: 'reasoning', label: 'Reasoning', icon: Brain },
  { key: 'tools', label: 'Tool Use', icon: Wrench },
];

export function MyModelsSecondarySidebar() {
  const active = useAppSelector(selectMyModelsCategory);
  const dispatch = useAppDispatch();
  return (
    <SecondarySidebar title="My Models">
      <nav aria-label="Model categories" className="flex flex-col gap-3 px-2 py-2">
        <Group label="Browse">
          {BROWSE.map((item) => (
            <NavRow
              key={item.key}
              item={item}
              active={active === item.key}
              onSelect={() => dispatch(categorySet(item.key))}
            />
          ))}
        </Group>
        <Group label="Filter by capability">
          {CAPABILITY.map((item) => (
            <NavRow
              key={item.key}
              item={item}
              active={active === item.key}
              onSelect={() => dispatch(categorySet(item.key))}
            />
          ))}
        </Group>
      </nav>
    </SecondarySidebar>
  );
}

function Group({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
        {label}
      </div>
      {children}
    </div>
  );
}

function NavRow({
  item,
  active,
  onSelect,
}: {
  readonly item: NavItem;
  readonly active: boolean;
  readonly onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors',
        active
          ? 'bg-accent text-fg-default'
          : 'text-fg-muted hover:bg-bg-raised/60 hover:text-fg-default',
      )}
    >
      <Icon icon={item.icon} size="xs" />
      <span className="flex-1 truncate text-left">{item.label}</span>
    </button>
  );
}
