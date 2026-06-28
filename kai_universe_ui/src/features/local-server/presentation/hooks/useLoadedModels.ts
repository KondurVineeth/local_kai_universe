import { useContainer } from '@shared/container-context';
import { useEffect, useState } from 'react';

import type { LoadedModel } from '@shared/infrastructure/repositories/HttpLocalServerService';

export function useLoadedModels() {
  const container = useContainer();

  const [models, setModels] = useState<LoadedModel[]>([]);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const loaded =
          await container.localServer.localServerService.getLoadedModels();

        if (!cancelled) {
          setModels(loaded);
        }
      } catch (err) {
        console.error(err);
      }
    };

    void refresh();

    const interval = setInterval(refresh, 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [container]);

  return models;
}