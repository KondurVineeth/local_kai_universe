import {
  allowMcpJsonServersChanged,
  allowPerRequestMcpsChanged,
  autoUnloadJitChanged,
  enableCorsChanged,
  jitModelLoadingChanged,
  maxIdleTtlMinutesChanged,
  onlyKeepLastJitModelChanged,
  requireAuthChanged,
  selectAllowMcpJsonServers,
  selectAllowPerRequestMcps,
  selectAutoUnloadJit,
  selectEnableCors,
  selectJitModelLoading,
  selectMaxIdleTtlMinutes,
  selectOnlyKeepLastJitModel,
  selectRequireAuth,
  selectServerPort,
  serverPortChanged,
} from '@features/settings';
import { Switch } from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { selectActiveApiTokenCount } from '../../store/selectors';
import { manageTokensOpenSet, serverSettingsOpenSet } from '../../store/slice';

function SettingsRow({
  label,
  children,
  hint,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
  readonly hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-fg-default">{label}</span>
        {children}
      </div>
      {hint && <p className="text-[10px] text-fg-subtle">{hint}</p>}
    </div>
  );
}

export function ServerSettingsPopover() {
  const dispatch = useAppDispatch();
  return (
    <div
      className="fixed inset-0 z-30"
      onClick={() => dispatch(serverSettingsOpenSet(false))}
    >
      <div
        className="absolute left-24 top-12 z-40 w-80 overflow-hidden rounded-lg border border-border-default bg-bg-raised shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border-default px-4 py-3">
          <h3 className="text-sm font-semibold text-fg-default">Server Settings</h3>
        </div>
        <PopoverBody />
      </div>
    </div>
  );
}

function PopoverBody() {
  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <PortAndAuthRows />
      <McpAndCorsRows />
      <div className="my-0.5 border-t border-border-default" />
      <JitRows />
    </div>
  );
}

function PortAndAuthRows() {
  const dispatch = useAppDispatch();
  const port = useAppSelector(selectServerPort);
  const requireAuth = useAppSelector(selectRequireAuth);
  const activeTokenCount = useAppSelector(selectActiveApiTokenCount);
  return (
    <>
      <SettingsRow label="Server Port">
        <input
          type="number"
          value={port}
          min={1}
          max={65535}
          onChange={(e) => dispatch(serverPortChanged(Number(e.target.value)))}
          className="w-24 rounded-sm border border-border-strong bg-bg-base px-2 py-1 text-right font-mono text-xs text-fg-default [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
          aria-label="Server port"
        />
      </SettingsRow>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-fg-default">Require Authentication</span>
          <Switch
            checked={requireAuth}
            onCheckedChange={(v) => dispatch(requireAuthChanged(v))}
            aria-label="Require authentication"
          />
        </div>
        {requireAuth && (
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-fg-subtle">Active API Keys: {activeTokenCount}</span>
            <button
              type="button"
              className="text-accent hover:underline"
              onClick={() => {
                dispatch(serverSettingsOpenSet(false));
                dispatch(manageTokensOpenSet(true));
              }}
            >
              Manage Tokens
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function McpAndCorsRows() {
  const dispatch = useAppDispatch();
  const requireAuth = useAppSelector(selectRequireAuth);
  const allowPerRequestMcps = useAppSelector(selectAllowPerRequestMcps);
  const allowMcpJsonServers = useAppSelector(selectAllowMcpJsonServers);
  const enableCors = useAppSelector(selectEnableCors);
  return (
    <>
      <SettingsRow label="Allow per-request MCPs">
        <Switch
          checked={allowPerRequestMcps}
          onCheckedChange={(v) => dispatch(allowPerRequestMcpsChanged(v))}
          aria-label="Allow per-request MCPs"
        />
      </SettingsRow>
      <SettingsRow
        label="Allow calling servers from mcp.json"
        hint={!requireAuth ? 'Enable authentication to unlock this option' : undefined}
      >
        <Switch
          checked={allowMcpJsonServers}
          disabled={!requireAuth}
          onCheckedChange={(v) => dispatch(allowMcpJsonServersChanged(v))}
          aria-label="Allow MCP JSON servers"
        />
      </SettingsRow>
      <SettingsRow label="Enable CORS">
        <Switch
          checked={enableCors}
          onCheckedChange={(v) => dispatch(enableCorsChanged(v))}
          aria-label="Enable CORS"
        />
      </SettingsRow>
    </>
  );
}

function JitRows() {
  const dispatch = useAppDispatch();
  const jitModelLoading = useAppSelector(selectJitModelLoading);
  const autoUnloadJit = useAppSelector(selectAutoUnloadJit);
  const maxIdleTtl = useAppSelector(selectMaxIdleTtlMinutes);
  const onlyKeepLast = useAppSelector(selectOnlyKeepLastJitModel);
  return (
    <>
      <SettingsRow label="Just-in-Time Model Loading">
        <Switch
          checked={jitModelLoading}
          onCheckedChange={(v) => dispatch(jitModelLoadingChanged(v))}
          aria-label="Just-in-time model loading"
        />
      </SettingsRow>
      <SettingsRow label="Auto unload unused JIT models">
        <Switch
          checked={autoUnloadJit}
          disabled={!jitModelLoading}
          onCheckedChange={(v) => dispatch(autoUnloadJitChanged(v))}
          aria-label="Auto unload JIT models"
        />
      </SettingsRow>
      <SettingsRow label="Max idle TTL">
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={maxIdleTtl}
            min={1}
            disabled={!jitModelLoading || !autoUnloadJit}
            onChange={(e) => dispatch(maxIdleTtlMinutesChanged(Number(e.target.value)))}
            className="w-16 rounded-sm border border-border-strong bg-bg-base px-2 py-1 text-right font-mono text-xs text-fg-default [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none disabled:opacity-50"
            aria-label="Max idle TTL minutes"
          />
          <span className="text-xs text-fg-subtle">minutes</span>
        </div>
      </SettingsRow>
      <SettingsRow label="Only Keep Last JIT Model">
        <Switch
          checked={onlyKeepLast}
          disabled={!jitModelLoading}
          onCheckedChange={(v) => dispatch(onlyKeepLastJitModelChanged(v))}
          aria-label="Only keep last JIT model"
        />
      </SettingsRow>
    </>
  );
}
