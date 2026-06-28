import { ArrowSquareOut, ArrowsClockwise, Broom, Pulse } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { selectServerPort } from '@features/settings';
import { SecondarySidebar } from '@shared/ds/layouts';
import { Button, Icon } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';
import { useContainer } from "@shared/container-context";

import {
  selectEndpointsTab,
  selectServerRequestCount,
  selectServerStartedAt,
  selectServerStatus,
} from '../../store/selectors';
import { endpointsTabSet, logsCleared } from '../../store/slice';
import { startServerThunk, stopServerThunk } from '../../store/thunks';

import type { EndpointsTab, ServerStatus } from '../../store/slice';

const TAB_LABELS: ReadonlyArray<{ key: EndpointsTab; label: string }> = [
  { key: 'zl-universe', label: 'ZL Universe API' },
  { key: 'openai', label: 'OpenAI-compatible' },
  { key: 'anthropic', label: 'Anthropic-compatible' },
];

export function LocalServerSecondarySidebar() {
  return (
    <SecondarySidebar title="Server">
      <div className="flex flex-col gap-4 px-3 py-3">
        <VitalsCard />
        <ApiCatalogNav />
        <QuickActions />
      </div>
    </SecondarySidebar>
  );
}

function VitalsCard() {
  const status = useAppSelector(selectServerStatus);
  const port = useAppSelector(selectServerPort);
  const startedAt = useAppSelector(selectServerStartedAt);
  const requestCount = useAppSelector(selectServerRequestCount);
  const uptime = useUptime(startedAt);

  return (
    <section className="flex flex-col gap-2 rounded-md border border-border-default bg-bg-surface p-3">
      <header className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-fg-subtle">
          Vitals
        </span>
        <StatusPill status={status} />
      </header>
      <VitalRow label="Port" value={status === 'running' ? port.toString() : '—'} />
      <VitalRow label="Uptime" value={uptime} />
      <VitalRow label="Requests" value={requestCount.toString()} />
    </section>
  );
}

function StatusPill({ status }: { readonly status: ServerStatus }) {
  const cls: Record<ServerStatus, string> = {
    stopped: 'bg-fg-subtle/20 text-fg-subtle',
    starting: 'bg-amber-500/20 text-amber-400',
    running: 'bg-green-500/20 text-green-400',
    stopping: 'bg-amber-500/20 text-amber-400',
    error: 'bg-danger/20 text-danger',
  };
  const label: Record<ServerStatus, string> = {
    stopped: 'Stopped',
    starting: 'Starting',
    running: 'Running',
    stopping: 'Stopping',
    error: 'Error',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
        cls[status],
      )}
    >
      <Pulse size={10} weight="bold" />
      {label[status]}
    </span>
  );
}

function VitalRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-fg-subtle">{label}</span>
      <span className="font-mono text-fg-default">{value}</span>
    </div>
  );
}

// Live uptime counter — ticks every second while the server is running so
// the sidebar feels alive. Returns `—` when there's no startedAt anchor.
function useUptime(startedAt: string | null): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  if (!startedAt) return '—';
  const seconds = Math.floor((now - new Date(startedAt).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remSec = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remSec}s`;
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  return `${hours}h ${remMin}m`;
}

function ApiCatalogNav() {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector(selectEndpointsTab);
  return (
    <section className="flex flex-col gap-1">
      <header className="px-1 text-[10px] uppercase tracking-wider text-fg-subtle">
        API Catalog
      </header>
      <nav className="flex flex-col gap-0.5">
        {TAB_LABELS.map((t) => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => dispatch(endpointsTabSet(t.key))}
              aria-pressed={active}
              className={cn(
                'rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                active
                  ? 'bg-accent/20 text-fg-default'
                  : 'text-fg-muted hover:bg-bg-raised/60 hover:text-fg-default',
              )}
            >
              {t.label}
            </button>
          );
        })}
      </nav>
    </section>
  );
}

function QuickActions() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const container = useContainer();
  const status = useAppSelector(selectServerStatus);
  const transient = status === 'starting' || status === 'stopping';
  const isRunning = status === 'running';

  const onRestart = () => {
    dispatch(stopServerThunk());
    // Chain the start ~500ms after stop completes; matches the stop timer.
    setTimeout(() => dispatch(startServerThunk()), 500);
  };

  return (
    <section className="flex flex-col gap-1">
      <header className="px-1 text-[10px] uppercase tracking-wider text-fg-subtle">
        Quick Actions
      </header>
      <Button
        variant="ghost"
        size="sm"
        leadingIcon={<Icon icon={ArrowsClockwise} size="xs" />}
        onClick={onRestart}
        disabled={transient || !isRunning}
        className="justify-start"
      >
        Restart server
      </Button>
      <Button
        variant="ghost"
        size="sm"
        leadingIcon={<Icon icon={Broom} size="xs" />}
        onClick={async () => {
  await container.localServer.localServerService.clearLogs();
  dispatch(logsCleared());
}}
        className="justify-start"
      >
        Clear logs
      </Button>
      <Button
        variant="ghost"
        size="sm"
        leadingIcon={<Icon icon={ArrowSquareOut} size="xs" />}
        onClick={() => navigate('/developer-docs')}
        className="justify-start"
      >
        View API docs
      </Button>
    </section>
  );
}
