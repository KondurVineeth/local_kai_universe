import { CaretDown, MagnifyingGlass } from '@phosphor-icons/react';
import { useEffect, useRef } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icon,
  Input,
} from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { selectMyModelsDeviceFilter } from '../../store/selectors';
import { deviceFilterSet, searchQuerySet, type DeviceFilter } from '../../store/slice';

const DEVICE_LABELS: Record<DeviceFilter, string> = {
  all: 'All',
  local: 'Local',
  remote: 'Remote',
};

interface MyModelsHeaderProps {
  readonly query: string;
}

export function MyModelsHeader({ query }: MyModelsHeaderProps) {
  const dispatch = useAppDispatch();
  const device = useAppSelector(selectMyModelsDeviceFilter);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // ⌘F / Ctrl+F focuses the filter input — matches ZL Universe's behaviour.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border-default bg-bg-base px-4 py-3">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-medium text-fg-default">My Models</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-border-default bg-bg-raised px-2 py-1 text-xs text-fg-default hover:bg-bg-active"
              aria-label="Device filter"
            >
              {DEVICE_LABELS[device]}
              <Icon icon={CaretDown} size="xs" className="text-fg-subtle" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[140px]">
            {(Object.keys(DEVICE_LABELS) as DeviceFilter[]).map((key) => (
              <DropdownMenuItem key={key} onSelect={() => dispatch(deviceFilterSet(key))}>
                <span className={device === key ? 'text-fg-default' : 'text-fg-muted'}>
                  {DEVICE_LABELS[key]}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="w-72">
        <Input
          ref={inputRef}
          inputSize="sm"
          value={query}
          onChange={(e) => dispatch(searchQuerySet(e.target.value))}
          placeholder="Filter models... (⌘F)"
          leadingIcon={<Icon icon={MagnifyingGlass} size="xs" />}
          aria-label="Filter models"
        />
      </div>
    </header>
  );
}
