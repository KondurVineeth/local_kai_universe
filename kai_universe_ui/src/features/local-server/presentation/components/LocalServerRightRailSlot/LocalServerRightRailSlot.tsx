import { useEffect, useState } from 'react';

import { useContainer } from '@shared/container-context';
import { useAppSelector } from '@shared/store/hooks';

import { selectSelectedModelId } from '../../store/selectors';
import { LocalServerRightRail } from '../LocalServerRightRail';

import type { Model } from '@shared/domain/model/entities/Model';

export function LocalServerRightRailSlot() {
  const container = useContainer();
  const selectedModelId = useAppSelector(selectSelectedModelId);
  console.log("Selected Model:", selectedModelId);
  const [model, setModel] = useState<Model | null>(null);

  useEffect(() => {
    if (!selectedModelId) { setModel(null); return; }
    let cancelled = false;
    void container.modelRepository.findById(selectedModelId).then((m) => {console.log("findById returned:", m);
      if (!cancelled) setModel(m);
    });
    return () => { cancelled = true; };
  }, [container, selectedModelId]);

  if (!model) {
    return (
      <aside className="flex h-full min-w-0 items-center justify-center border-l border-border-default bg-bg-surface">
        <p className="text-xs text-fg-subtle">No model selected</p>
      </aside>
    );
  }
  console.log("Rendering model:", model);
  return <LocalServerRightRail model={model} />;
}
