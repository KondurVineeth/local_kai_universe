import { WarningCircle } from '@phosphor-icons/react';
import { useEffect } from 'react';

import { EmptyState, Spinner } from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { useCatalog } from '../../hooks/useCatalog';
import {
  applyMyModelsFilters,
  selectInstalledModelIds,
  selectMyModelsCategory,
  selectMyModelsDeviceFilter,
  selectMyModelsPinned,
  selectMyModelsSearchQuery,
  selectMyModelsSelectedModelId,
} from '../../store/selectors';
import { selectModel } from '../../store/slice';
import { DiskUsageFooter } from '../DiskUsageFooter';
import { ModelsTable } from '../ModelsTable';
import { MyModelsHeader } from '../MyModelsHeader';

import type { ModelId } from '@shared/domain/model/value-objects/ModelId';

export function MyModelsPage() {
  const dispatch = useAppDispatch();
  const { catalog, isLoading, error } = useCatalog();

  const installedIds = useAppSelector(selectInstalledModelIds);
  const installedAt = useAppSelector((s) => s.myModels.installedAtByModel ?? {});
  const category = useAppSelector(selectMyModelsCategory);
  const device = useAppSelector(selectMyModelsDeviceFilter);
  const query = useAppSelector(selectMyModelsSearchQuery);
  const pinned = useAppSelector(selectMyModelsPinned);
  const selectedId = useAppSelector(selectMyModelsSelectedModelId);

  const filtered = applyMyModelsFilters({
    catalog,
    installedIds,
    installedAt,
    category,
    device,
    query,
    pinned,
  });
  const installedCatalogModels = catalog.filter((m) => installedIds.includes(m.id));
  const selectedModel = catalog.find((m) => m.id === selectedId) ?? null;

  // Auto-select the first installed model on mount when nothing is selected,
  // OR when the previously-selected model is no longer installed (e.g.
  // uninstalled in another window). The right rail (rendered by the shell
  // via MyModelsRightRailSlot) needs `selectedModelId` to populate.
  useEffect(() => {
    if (isLoading) return;
    if (selectedModel) return;
    const first = installedCatalogModels[0];
    if (!first) return;
    dispatch(selectModel(first.id));
  }, [dispatch, isLoading, selectedModel, installedCatalogModels]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-bg-base">
        <EmptyState
          icon={WarningCircle}
          title="Couldn't load your models"
          description={error}
        />
      </div>
    );
  }

  // Right rail is rendered by the shell's RightPanelPlaceholder via
  // MyModelsRightRailSlot. The page only owns the main column — no internal
  // grid, no duplicate right rail. The previous version allocated 360px
  // here AND the shell allocated 320px, producing the off-by-one-column
  // bug where the rail rendered way too far right with empty space beside it.
  return (
    <div className="flex h-full min-h-0 flex-col bg-bg-base">
      <MyModelsHeader query={query} />
      <ModelsTable
        models={filtered}
        totalCount={installedIds.length}
        query={query}
        device={device}
        selectedId={selectedId}
        pinned={pinned}
        onSelect={(id: ModelId) => dispatch(selectModel(id))}
      />
      <DiskUsageFooter models={installedCatalogModels} />
    </div>
  );
}
