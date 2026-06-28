import { Broadcast, Plus, Spinner } from '@phosphor-icons/react';

import { selectServerPort, serverEnabledChanged } from '@features/settings';
import { modelPickerOpenRequested } from '@features/shell';
import { Button, Icon, Switch, Tooltip } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import {
  selectServerStatus,
  selectSyntheticTrafficEnabled,
} from '../../store/selectors';
import {
  mcpJsonOpenSet,
  serverSettingsOpenSet,
  syntheticTrafficToggled,
} from '../../store/slice';
import { startServerThunk, stopServerThunk } from '../../store/thunks';

import type { ServerStatus } from '../../store/slice';

const STATUS_LABEL: Readonly<Record<ServerStatus, string>> = {
  stopped: 'Stopped',
  starting: 'Starting…',
  running: 'Running',
  stopping: 'Stopping…',
  error: 'Errored',
};

const STATUS_DOT_CLASS: Readonly<Record<ServerStatus, string>> = {
  stopped: 'bg-fg-subtle',
  starting: 'bg-amber-400 animate-pulse',
  running: 'bg-green-400',
  stopping: 'bg-amber-400 animate-pulse',
  error: 'bg-danger',
};

export function LocalServerTopBar() {
  const dispatch = useAppDispatch();
  const port = useAppSelector(selectServerPort);
  const status = useAppSelector(selectServerStatus);
  const syntheticOn = useAppSelector(selectSyntheticTrafficEnabled);
  // `serverEnabled` in settings is the user's persisted intent (so the
  // server can auto-start on next launch). The live state machine is owned
  // by the local-server slice (`status`). Keep both in sync from this
  // single user-facing toggle.
  const isRunning = status === 'running' || status === 'starting';
  const transient = status === 'starting' || status === 'stopping';

  function handleToggle(enabled: boolean) {
    dispatch(serverEnabledChanged(enabled));
    if (enabled) dispatch(startServerThunk(port));
    else dispatch(stopServerThunk());
  }

  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-border-default bg-bg-base px-4 py-2">
      <StatusCluster
        status={status}
        isRunning={isRunning}
        transient={transient}
        onToggle={handleToggle}
      />

      <div className="h-4 w-px bg-border-default" />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => dispatch(serverSettingsOpenSet(true))}
      >
        Server Settings
      </Button>
      <Button variant="ghost" size="sm" onClick={() => dispatch(mcpJsonOpenSet(true))}>
        mcp.json
      </Button>

      <Tooltip
        content={
          syntheticOn
            ? 'Simulating traffic — emits a random API request every few seconds'
            : 'Simulate traffic (for demos when no one is hitting the API)'
        }
        side="bottom"
      >
        <button
          type="button"
          onClick={() => dispatch(syntheticTrafficToggled())}
          aria-pressed={syntheticOn}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors',
            syntheticOn
              ? 'bg-accent/20 text-fg-accent'
              : 'text-fg-muted hover:bg-bg-raised/60 hover:text-fg-default',
          )}
        >
          <Icon icon={Broadcast} size="xs" />
          <span>Simulate traffic</span>
          {/* Non-interactive indicator — the wrapping <button> owns the
              click. A nested interactive Switch inside a button is invalid
              HTML and would double-fire; pointer-events-none + tabIndex -1
              keep it purely visual while staying in sync with state. */}
          <span className="pointer-events-none">
            <Switch
              checked={syntheticOn}
              onCheckedChange={() => undefined}
              tabIndex={-1}
              aria-hidden
              aria-label="Synthetic traffic"
            />
          </span>
        </button>
      </Tooltip>

      <div className="flex-1 text-right text-xs text-fg-subtle">
        {status === 'running' ? `http://localhost:${port}` : STATUS_LABEL[status]}
      </div>

      <Button
        variant="secondary"
        size="sm"
        leadingIcon={<Icon icon={Plus} size="xs" />}
        onClick={() => dispatch(modelPickerOpenRequested())}
      >
        Load Model
      </Button>
    </div>
  );
}

function StatusCluster({
  status,
  isRunning,
  transient,
  onToggle,
}: {
  readonly status: ServerStatus;
  readonly isRunning: boolean;
  readonly transient: boolean;
  readonly onToggle: (enabled: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn('h-2 w-2 rounded-full', STATUS_DOT_CLASS[status])} />
      <span className="text-xs text-fg-muted">Status:</span>
      <Switch
        checked={isRunning}
        onCheckedChange={onToggle}
        disabled={transient}
        aria-label="Toggle server"
      />
      <span className="inline-flex items-center gap-1 text-xs text-fg-default">
        {transient && <Icon icon={Spinner} size="xs" className="animate-spin" />}
        {STATUS_LABEL[status]}
      </span>
    </div>
  );
}

