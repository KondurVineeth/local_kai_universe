// import { useEffect, useState } from 'react';

// import { useContainer } from '@shared/container-context';

// import type { Download } from '@shared/domain/download/entities/Download';


// export interface DownloadsListState {
//   readonly downloads: readonly Download[];
//   readonly activeCount: number;
//   readonly isLoading: boolean;
//   readonly error: string | null;
// }

// // Polls the download repository every 800ms while subscribers are mounted.
// // In real ZL Universe the indicator updates as the engine emits progress; for
// // the mock we just refresh the list — the FixtureDownloadRepository's `observe`
// // stream mutates the cached download records the list returns.
// export function useDownloadsList(pollIntervalMs = 800): DownloadsListState {
//   const container = useContainer();
//   const [state, setState] = useState<DownloadsListState>({
//     downloads: [],
//     activeCount: 0,
//     isLoading: true,
//     error: null,
//   });

//   useEffect(() => {
//     let cancelled = false;
//     let timer: ReturnType<typeof setTimeout> | null = null;

//     const fetchOnce = async () => {
//       try {
//         const downloads = await container.downloadRepository.list();
//         if (cancelled) return;
//         const activeCount = downloads.filter(
//           (d) => d.status === 'queued' || d.status === 'downloading',
//         ).length;
//         setState({ downloads, activeCount, isLoading: false, error: null });
//       } catch (err: unknown) {
//         if (cancelled) return;
//         const message = err instanceof Error ? err.message : 'Failed to load downloads';
//         setState((prev) => ({ ...prev, isLoading: false, error: message }));
//       } finally {
//         if (!cancelled) timer = setTimeout(fetchOnce, pollIntervalMs);
//       }
//     };

//     void fetchOnce();
//     return () => {
//       cancelled = true;
//       if (timer !== null) clearTimeout(timer);
//     };
//   }, [container, pollIntervalMs]);

//   return state;
// }

import { useEffect, useState } from 'react';

import { useContainer } from '@shared/container-context';

import type { Download } from '@shared/domain/download/entities/Download';

export interface DownloadsListState {
  readonly downloads: readonly Download[];
  readonly activeCount: number;
  readonly isLoading: boolean;
  readonly error: string | null;
}

export function useDownloadsList(
  pollIntervalMs = 800,
): DownloadsListState {
  const container = useContainer();

  const [state, setState] = useState<DownloadsListState>({
    downloads: [],
    activeCount: 0,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const fetchOnce = async () => {
      try {
        const downloads = await container.downloadRepository.list();

        if (cancelled) return;

        const activeCount = downloads.filter(
          (download) =>
            download.status === 'queued' ||
            download.status === 'downloading',
        ).length;

        setState({
          downloads,
          activeCount,
          isLoading: false,
          error: null,
        });

        // Continue polling ONLY while downloads are active.
        if (!cancelled && activeCount > 0) {
          timer = setTimeout(fetchOnce, pollIntervalMs);
        }
      } catch (err: unknown) {
        if (cancelled) return;

        const message =
          err instanceof Error
            ? err.message
            : 'Failed to load downloads';

        setState((previous) => ({
          ...previous,
          isLoading: false,
          error: message,
        }));

        // Retry after an error.
        if (!cancelled) {
          timer = setTimeout(fetchOnce, pollIntervalMs);
        }
      }
    };

    void fetchOnce();

    return () => {
      cancelled = true;

      if (timer !== null) {
        clearTimeout(timer);
      }
    };
  }, [container, pollIntervalMs]);

  return state;
}