import { CaretDown, CaretUp, Check, Copy, DotsThree, Trash } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Icon,
  Select,
  Switch,
  Tooltip,
} from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { transformLogStream } from '../../../application/use-cases/transformLogStream';
import {
  selectFileLoggingMode,
  selectLogIncomingTokens,
  selectLogs,
  selectLogsCollapsed,
  selectRedactContent,
  selectVerboseLogging,
} from '../../store/selectors';
import {
  fileLoggingModeSet,
  logIncomingTokensToggled,
  logsCleared,
  logsCollapsedToggled,
  redactContentToggled,
  verboseLoggingToggled,
} from '../../store/slice';

import type { FileLoggingMode, LogEntry } from '../../store/slice';

export function DeveloperLogsSection() {
  console.log("DeveloperLogsSection rendered");
  const dispatch = useAppDispatch();
  const rawLogs = useAppSelector(selectLogs);
  const collapsed = useAppSelector(selectLogsCollapsed);
  const verbose = useAppSelector(selectVerboseLogging);
  const redact = useAppSelector(selectRedactContent);
  const logTokens = useAppSelector(selectLogIncomingTokens);
  const fileMode = useAppSelector(selectFileLoggingMode);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const [copied, setCopied] = useState(false);

  // The Log Options toggles reshape the rendered stream — verbose injects
  // DEBUG trace lines, redact masks content, log-tokens appends counts,
  // file-mode prepends a status banner. See transformLogStream.
  const logs = useMemo(
    () => transformLogStream(rawLogs, { verbose, redact, logTokens, fileMode }),
    [rawLogs, verbose, redact, logTokens, fileMode],
  );

  useEffect(() => {
  if (!collapsed) {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }
}, [logs, collapsed]);

  function handleCopy() {
    const text = logs
      .map((l) => `${formatTimestamp(l.timestamp)} [${l.level}] ${l.message}`)
      .join('\n');
    try {
      void navigator.clipboard.writeText(text).then(
        () => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        },
        () => {
          // Clipboard write rejected (permissions) — no feedback, no crash.
        },
      );
    } catch {
      // Clipboard API unavailable — silent no-op is fine for the mock.
    }
  }
  const handleScroll = () => {
  const el = scrollContainerRef.current;

  if (!el) return;

  const distanceFromBottom =
    el.scrollHeight - el.scrollTop - el.clientHeight;

  shouldAutoScrollRef.current = distanceFromBottom < 20;
};
  return (
    <section className="flex flex-col">
      <LogsToolbar
        verbose={verbose}
        redact={redact}
        logTokens={logTokens}
        fileMode={fileMode}
        collapsed={collapsed}
        copied={copied}
        onCopy={handleCopy}
        onClear={() => dispatch(logsCleared())}
        onCollapseToggle={() => dispatch(logsCollapsedToggled())}
        onVerboseToggle={() => dispatch(verboseLoggingToggled())}
        onRedactToggle={() => dispatch(redactContentToggled())}
        onLogTokensToggle={() => dispatch(logIncomingTokensToggled())}
        onFileModeChange={(m) => dispatch(fileLoggingModeSet(m))}
      />

      {!collapsed && (
        <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="max-h-72 overflow-y-auto ..."
        >
          {logs.length === 0 ? (
            <p className="py-4 text-center text-fg-subtle">No logs yet. Start the server to see output.</p>
          ) : (
            logs.map((entry) => <LogLine key={entry.id} entry={entry} />)
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </section>
  );
}

interface LogsToolbarProps {
  readonly verbose: boolean;
  readonly redact: boolean;
  readonly logTokens: boolean;
  readonly fileMode: FileLoggingMode;
  readonly collapsed: boolean;
  readonly copied: boolean;
  readonly onCopy: () => void;
  readonly onClear: () => void;
  readonly onCollapseToggle: () => void;
  readonly onVerboseToggle: () => void;
  readonly onRedactToggle: () => void;
  readonly onLogTokensToggle: () => void;
  readonly onFileModeChange: (mode: FileLoggingMode) => void;
}

function LogsToolbar({
  verbose,
  redact,
  logTokens,
  fileMode,
  collapsed,
  copied,
  onCopy,
  onClear,
  onCollapseToggle,
  onVerboseToggle,
  onRedactToggle,
  onLogTokensToggle,
  onFileModeChange,
}: LogsToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <h2 className="text-xs font-semibold text-fg-default">Developer Logs</h2>
      <div className="flex items-center gap-1">
        <LogsOptionsMenu
          verbose={verbose}
          redact={redact}
          logTokens={logTokens}
          fileMode={fileMode}
          onVerboseToggle={onVerboseToggle}
          onRedactToggle={onRedactToggle}
          onLogTokensToggle={onLogTokensToggle}
          onFileModeChange={onFileModeChange}
        />
        <Tooltip content={copied ? 'Copied' : 'Copy logs'} side="top">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={copied ? 'Logs copied' : 'Copy logs'}
            onClick={onCopy}
          >
            <Icon icon={copied ? Check : Copy} size="xs" className={copied ? 'text-success' : undefined} />
          </Button>
        </Tooltip>
        <Tooltip content="Clear logs" side="top">
          <Button variant="ghost" size="sm" iconOnly aria-label="Clear logs" onClick={onClear}>
            <Icon icon={Trash} size="xs" />
          </Button>
        </Tooltip>
        <Tooltip content={collapsed ? 'Expand' : 'Collapse'} side="top">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={collapsed ? 'Expand logs' : 'Collapse logs'}
            onClick={onCollapseToggle}
          >
            <Icon icon={collapsed ? CaretDown : CaretUp} size="xs" />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}

function LogLine({ entry }: { readonly entry: LogEntry }) {
  if (!entry.message) {
    return <div className="h-3" />;
  }

  const tsClass =
    entry.level === 'DEBUG' ? 'text-cyan-400' : 'text-green-400';
  const levelClass =
    entry.level === 'DEBUG' ? 'text-cyan-400/70' : 'text-fg-subtle';

  const parts = renderMessageWithUrls(entry.message);

  return (
    <div className="flex gap-2 leading-5">
      <span className={cn('shrink-0', tsClass)}>{formatTimestamp(entry.timestamp)}</span>
      <span className={cn('shrink-0', levelClass)}>[{entry.level}]</span>
      <span className="text-fg-default">{parts}</span>
    </div>
  );
}

function renderMessageWithUrls(message: string): React.ReactNode {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = message.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <span key={i} className="text-blue-400">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return iso;
  }
}

interface LogsOptionsMenuProps {
  readonly verbose: boolean;
  readonly redact: boolean;
  readonly logTokens: boolean;
  readonly fileMode: FileLoggingMode;
  readonly onVerboseToggle: () => void;
  readonly onRedactToggle: () => void;
  readonly onLogTokensToggle: () => void;
  readonly onFileModeChange: (mode: FileLoggingMode) => void;
}

function LogsOptionsMenu({
  verbose,
  redact,
  logTokens,
  fileMode,
  onVerboseToggle,
  onRedactToggle,
  onLogTokensToggle,
  onFileModeChange,
}: LogsOptionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" iconOnly aria-label="Log options">
          <Icon icon={DotsThree} size="sm" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Log Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onVerboseToggle(); }}>
          <span className="flex-1">Verbose logging</span>
          <Switch checked={verbose} onCheckedChange={onVerboseToggle} aria-label="Verbose logging" />
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onRedactToggle(); }}>
          <span className="flex-1">Redact content</span>
          <Switch checked={redact} onCheckedChange={onRedactToggle} aria-label="Redact content" />
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onLogTokensToggle(); }}>
          <span className="flex-1">Log incoming tokens</span>
          <Switch checked={logTokens} onCheckedChange={onLogTokensToggle} aria-label="Log incoming tokens" />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>File Logging</DropdownMenuLabel>
        <div className="px-2 py-1.5">
          <Select
            options={[
              { value: 'off', label: 'Off' },
              { value: 'succinct', label: 'Succinct' },
              { value: 'full', label: 'Full' },
            ]}
            value={fileMode}
            onChange={(e) => onFileModeChange(e.target.value as FileLoggingMode)}
            aria-label="File logging mode"
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
