import { getBootLogs } from '../../application/use-cases/getBootLogs';

import {
  logAppended,
  logsCleared,
  requestCountIncremented,
  serverStarted,
  serverStarting,
  serverStopped,
  serverStopping,
  serverInfoUpdated,
  type LocalServerState,
  type LogEntry,
} from './slice';
import type { AnyAction, ThunkAction } from '@reduxjs/toolkit';
import type { Container } from '@shared/container';

type LocalServerThunk<T = void> = ThunkAction<
  T,
  { localServer: LocalServerState },
  Container,
  AnyAction
>;

// Tracking handles so a navigate-away mid-startup doesn't leave dangling
// timers; cancellation in `stopServerThunk` clears them.
const bootLogTimers = new Set<ReturnType<typeof setTimeout>>();
let startupCompleteTimer: ReturnType<typeof setTimeout> | null = null;

function nextLogId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function append(dispatch: (a: AnyAction) => void, entry: Omit<LogEntry, 'id'>): void {
  dispatch(
    logAppended({
      ...entry,
      id: nextLogId(entry.level.toLowerCase()),
    }),
  );
}

// Start the simulated server. Walks through `starting → running` with the
// boot logs emitted progressively (every ~120ms) so the user sees the
// server come alive instead of all log lines materialising in one paint.
// Total startup: ~1.5s for ~12 boot lines. If the user toggles stop mid-
// startup, `stopServerThunk` clears every queued timer.
export function startServerThunk(): LocalServerThunk<Promise<void>> {
  return async (dispatch, _getState, container) => {
    dispatch(serverStarting());

    try {
      await container.localServer.localServerService.startServer();

      const serverInfo =
        await container.localServer.localServerService.getStatus();

      dispatch(
        serverInfoUpdated({
          status: serverInfo.status,
          started_at: serverInfo.started_at,
          request_count: serverInfo.request_count,
        }),
      );

      dispatch(
        logAppended({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: 'Server started.',
        }),
      );
    } catch (error) {
      dispatch(
        logAppended({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          message: 'Failed to start server.',
        }),
      );

      console.error(error);
    }
  };
}

export function stopServerThunk(): LocalServerThunk<Promise<void>> {
  return async (dispatch, _getState, container) => {
    dispatch(serverStopping());

    try {
      await container.localServer.localServerService.stopServer();
      const serverInfo =
        await container.localServer.localServerService.getStatus();

      dispatch(
        serverInfoUpdated({
          status: serverInfo.status,
          started_at: serverInfo.started_at,
          request_count: serverInfo.request_count,
        }),
      );

      dispatch(
        logAppended({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: 'Server stopped.',
        }),
      );
    } catch (error) {
      dispatch(
        logAppended({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          message: 'Failed to stop server.',
        }),
      );

      console.error(error);
    }
  };
}

// Simulator for incoming API requests. Emits the request line + a response
// line + bumps the per-run request counter so the sidebar vitals card can
// show "Requests served: N". Callers pass the synthetic latency they want
// to mimic (real chat-completion calls take longer than a /v1/models list).
export interface SimulatedRequest {
  readonly method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH';
  readonly path: string;
  readonly status: number;
  readonly latencyMs: number;
  // Optional trailing context shown on the response line (e.g. token
  // counts for chat completions, model count for /v1/models).
  readonly responseNote?: string;
}

export function simulateRequestThunk(req: SimulatedRequest): LocalServerThunk<void> {
  return (dispatch, getState) => {
    if (getState().localServer.serverStatus !== 'running') return;
    const ts = new Date().toISOString();
    append(dispatch, {
      timestamp: ts,
      level: 'INFO',
      message: `[ZL UNIVERSE SERVER] → ${req.method} ${req.path}`,
    });
    setTimeout(() => {
      // Re-check status — the user may have stopped the server during the
      // simulated latency window.
      if (getState().localServer.serverStatus !== 'running') return;
      const noteSuffix = req.responseNote ? ` (${req.responseNote})` : '';
      append(dispatch, {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: `[ZL UNIVERSE SERVER] ← ${req.method} ${req.path} ${req.status} ${req.latencyMs}ms${noteSuffix}`,
      });
      dispatch(requestCountIncremented());
    }, req.latencyMs);
  };
}


