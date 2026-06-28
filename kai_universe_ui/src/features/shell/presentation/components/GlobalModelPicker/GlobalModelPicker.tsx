import { Eject } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Icon, Tooltip } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { useLoadedModel } from '../../hooks/useLoadedModel';
import { useModelsList } from '../../hooks/useModelsList';
import {
  selectLastFailedModelId,
  selectModelLoadError,
  selectModelPickerFilter,
  selectModelPickerOpenSeq,
} from '../../store/selectors';
import { modelLoadErrorCleared, modelPickerFilterSet } from '../../store/slice';
import { ejectModelThunk, loadModelThunk } from '../../store/thunks';

import { ModelPickerMenu } from './ModelPickerMenu';
import { ModelPickerTrigger } from './ModelPickerTrigger';

import type { ModelCapabilityFilter } from '../../store/slice';
import type { Model } from '@shared/domain/model/entities/Model';

// LMS-SHELL-004 — Global Model Picker.
//
// Picker opens as a centered modal with a backdrop overlay covering the
// whole window. Previously a Radix DropdownMenu anchored to the trigger;
// that placement worked at 1400px+ but felt cramped on smaller windows and
// allowed the surrounding UI to remain accidentally interactable through
// the dropdown's gaps. A modal is the right pattern for a "pick the
// thing I'm working with" affordance.
export function GlobalModelPicker() {
  const dispatch = useAppDispatch();
  const { model: loadedModel, status } = useLoadedModel();
  const { models, isLoading } = useModelsList();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const capabilityFilter = useAppSelector(selectModelPickerFilter);
  const loadError = useAppSelector(selectModelLoadError);
  const lastFailedModelId = useAppSelector(selectLastFailedModelId);
  useExternalOpenRequests(setOpen);
  const filtered = useMemo(
    () => filterByCapability(filterModels(models, query), capabilityFilter),
    [models, query, capabilityFilter],
  );
  const hasModel = loadedModel !== null;

  const showLoadAnim = status === 'loading';
  const showUnloadAnim = status === 'unloading';
  const animClass = showLoadAnim
    ? 'loading-border'
    : showUnloadAnim
      ? 'loading-border-fast'
      : '';

  return (
    <>
      <div className={cn('rounded-md', animClass)}>
        <div
          className={cn(
            'flex items-stretch min-w-[280px] max-w-[420px] rounded-md border border-border-default bg-bg-raised',
            status === 'error' && 'border-danger',
            (showLoadAnim || showUnloadAnim) && 'border-transparent',
          )}
        >
          <ModelPickerTrigger
            loadedModel={loadedModel}
            status={status}
            open={open}
            onClick={() => setOpen(true)}
          />
          {hasModel && status === 'loaded' && <EjectAffordance />}
        </div>
      </div>
      {open && (
        <PickerModal onClose={() => setOpen(false)}>
          <ModelPickerMenu
            loadedModel={loadedModel}
            status={status}
            models={filtered}
            installedCount={models.length}
            isLoading={isLoading}
            query={query}
            onQueryChange={setQuery}
            capabilityFilter={capabilityFilter}
            onCapabilityFilterChange={(f) => dispatch(modelPickerFilterSet(f))}
            loadError={loadError}
            onRetryLoad={
              lastFailedModelId
                ? () => void dispatch(loadModelThunk(lastFailedModelId))
                : undefined
            }
            onDismissError={() => dispatch(modelLoadErrorCleared())}
            onSelectModel={(m) => {
              void dispatch(loadModelThunk(m.id));
              setOpen(false);
            }}
            onEject={() => {
              void dispatch(ejectModelThunk());
              setOpen(false);
            }}
            onClose={() => setOpen(false)}
          />
        </PickerModal>
      )}
    </>
  );
}

// Fullscreen backdrop + centered card. Portaled to <body> so it escapes the
// header's overflow clipping. Esc + backdrop click both close.
function PickerModal({
  children,
  onClose,
}: {
  readonly children: React.ReactNode;
  readonly onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal
      aria-label="Model picker"
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[min(720px,calc(100vw-32px))] max-h-[calc(100vh-64px)] overflow-hidden rounded-lg border border-border-default bg-bg-surface shadow-2xl animate-fade-up"
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

function useExternalOpenRequests(setOpen: (v: boolean) => void): void {
  const openSeq = useAppSelector(selectModelPickerOpenSeq);
  const lastOpenSeqRef = useRef(openSeq);
  useEffect(() => {
    if (openSeq !== lastOpenSeqRef.current) {
      lastOpenSeqRef.current = openSeq;
      setOpen(true);
    }
  }, [openSeq, setOpen]);
}

function EjectAffordance() {
  const dispatch = useAppDispatch();
  return (
    <>
      <span aria-hidden className="self-stretch w-px bg-border-default" />
      <Tooltip content="Eject model" side="bottom">
        <button
          type="button"
          onClick={() => void dispatch(ejectModelThunk())}
          aria-label="Eject model"
          className="flex items-center justify-center rounded-r-md py-1 px-2 text-fg-muted transition-colors hover:bg-bg-active hover:text-fg-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Icon icon={Eject} size="sm" />
        </button>
      </Tooltip>
    </>
  );
}

function filterModels(models: readonly Model[], q: string): readonly Model[] {
  const trimmed = q.trim().toLowerCase();
  if (!trimmed) return models;
  return models.filter((m) =>
    `${m.displayName} ${m.author} ${m.description}`.toLowerCase().includes(trimmed),
  );
}

function filterByCapability(
  models: readonly Model[],
  capability: ModelCapabilityFilter,
): readonly Model[] {
  if (capability === 'all') return models;
  return models.filter((m) => m.capabilities[capability] === true);
}
