import { useEffect, useRef } from 'react';

import { useContainer } from '@shared/container-context';
import { useAppDispatch } from '@shared/store/hooks';

import {
  logsReplaced,
  serverInfoUpdated,
} from '../store/slice';

export function useServerStatusPolling(): void {
  const dispatch = useAppDispatch();
  const container = useContainer();

  const lastLogKeyRef = useRef<string>('');

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const [status, logs] = await Promise.all([
          container.localServer.localServerService.getStatus(),
          container.localServer.localServerService.getLogs(),
        ]);

        if (cancelled) return;

        dispatch(
          serverInfoUpdated({
            status: status.status,
            started_at: status.started_at,
            request_count: status.request_count,
          }),
        );

        const mappedLogs = logs.map((log, index) => ({
          id: `${log.timestamp}-${index}`,
          timestamp: log.timestamp,
          level: log.level,
          message: log.message,
        }));

        const latestLog =
          mappedLogs.length > 0
            ? `${mappedLogs[mappedLogs.length - 1].timestamp}-${mappedLogs.length}`
            : '';

        if (latestLog !== lastLogKeyRef.current) {
          lastLogKeyRef.current = latestLog;
          dispatch(logsReplaced(mappedLogs));
        }
      } catch (error) {
        console.error(error);
      }
    };

    void refresh();

    const interval = setInterval(refresh, 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [dispatch, container]);
}