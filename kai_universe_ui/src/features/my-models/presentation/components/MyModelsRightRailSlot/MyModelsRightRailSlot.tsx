import { useEffect, useState } from 'react';

import { useContainer } from '@shared/container-context';
import { useAppSelector } from '@shared/store/hooks';

import { selectMyModelsSelectedModelId } from '../../store/selectors';
import { MyModelsRightRail } from '../MyModelsRightRail';

import type { Model } from '@shared/domain/model/entities/Model';

// Slot component the shell's RightPanelPlaceholder renders on the
// /my-models route. Keeps MyModelsRightRail's `model` prop requirement
// out of the cross-feature contract — the shell only needs to know there's
// a function it can render. Mirrors LocalServerRightRailSlot's pattern.
export function MyModelsRightRailSlot() {
  const container = useContainer();
  const selectedModelId = useAppSelector(selectMyModelsSelectedModelId);
  const [model, setModel] = useState<Model | null>(null);

  useEffect(() => {
    if (!selectedModelId) {
      setModel(null);
      return;
    }
    let cancelled = false;
    void container.modelRepository.findById(selectedModelId).then((m) => {
      if (!cancelled) setModel(m);
    });
    return () => {
      cancelled = true;
    };
  }, [container, selectedModelId]);

  if (!model) {
    return (
      <aside className="flex h-full min-w-0 items-center justify-center border-l border-border-default bg-bg-surface">
        <p className="text-xs text-fg-subtle">Select a model to inspect</p>
      </aside>
    );
  }

  return <MyModelsRightRail model={model} />;
}
