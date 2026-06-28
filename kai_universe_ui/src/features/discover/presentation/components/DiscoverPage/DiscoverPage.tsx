import { WarningCircle } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { EmptyState, Spinner } from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { useModels } from '../../hooks/useModels';
import {
  applyDiscoverFilters,
  selectDiscoverCategory,
  selectDiscoverFormatFilter,
  selectDiscoverSearchQuery,
  selectDiscoverSelectedModelId,
  selectDiscoverSort,
} from '../../store/selectors';
import { searchQuerySet, selectModel } from '../../store/slice';
import { ModelDetail } from '../ModelDetail';
import { ModelListing } from '../ModelListing';

import type { ModelId } from '@shared/domain/model/value-objects/ModelId';

// Two-pane canvas. List left (420px fixed), detail right (1fr). Selection
// is URL-driven (/discover/:modelId), so deep-links work and back/forward
// move between models.
export function DiscoverPage() {
  const { models, isLoading, error } = useModels();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const params = useParams<{ modelId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Cross-feature search jump: another surface (e.g. My Models' empty state)
  // links to `/discover?q=<term>`. Seed the discover search from it once,
  // then strip the param so a later in-app search edit isn't overwritten.
  const queryParam = searchParams.get('q');
  useEffect(() => {
    if (queryParam === null) return;
    dispatch(searchQuerySet(queryParam));
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    setSearchParams(next, { replace: true });
  }, [queryParam, dispatch, searchParams, setSearchParams]);

  const category = useAppSelector(selectDiscoverCategory);
  const query = useAppSelector(selectDiscoverSearchQuery);
  const format = useAppSelector(selectDiscoverFormatFilter);
  const sort = useAppSelector(selectDiscoverSort);
  const selectedId = useAppSelector(selectDiscoverSelectedModelId);

  const filtered = applyDiscoverFilters(models, category, query, format, sort);

  // Sync URL → slice. Auto-select the first filtered item when nothing is
  // selected so the right pane is always populated. If the URL points at a
  // model id that doesn't exist in the catalog (deep link 404), redirect to
  // `/discover` so the auto-select branch can re-populate from the filtered
  // list — leaving the stale id in the URL would surface a misleading
  // "Pick a model" empty state.
  useEffect(() => {
    if (isLoading) return;
    if (params.modelId) {
      const exists = models.some((m) => m.id === params.modelId);
      if (!exists) {
        navigate('/discover', { replace: true });
        return;
      }
      if (selectedId !== params.modelId) {
        dispatch(selectModel(params.modelId as ModelId));
      }
      return;
    }
    if (filtered.length === 0) return;
    const first = filtered[0];
    if (!first) return;
    if (selectedId !== first.id) dispatch(selectModel(first.id));
    navigate(`/discover/${first.id}`, { replace: true });
  }, [dispatch, navigate, params.modelId, selectedId, filtered, models, isLoading]);

  const selectedModel = models.find((m) => m.id === selectedId) ?? null;

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
          title="Couldn't load the model catalogue"
          description={error}
        />
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[420px_1fr] bg-bg-base">
      <ModelListing
        models={filtered}
        totalCount={models.length}
        selectedId={selectedId}
        onSelect={(id) => navigate(`/discover/${id}`)}
      />
      <ModelDetail model={selectedModel} allModels={models} />
    </div>
  );
}
