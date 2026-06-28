import { Question } from '@phosphor-icons/react';

import {
  autoDeleteLruRuntimePacksChanged,
  developerModeEnabledChanged,
  enableLocalLlmServiceChanged,
  enableModelLoadConfigInPresetsChanged,
  maxIdleTtlMinutesChanged,
  onlyKeepLastJitModelChanged,
  runtimeAutoUpdateChanged,
  runtimeDownloadChannelChanged,
  separateReasoningContentChanged,
  showDebugInfoBlocksChanged,
  showResourceConsumptionWidgetChanged,

  selectAutoDeleteLruRuntimePacks,
  selectDeveloperModeEnabled,
  selectEnableLocalLlmService,
  selectEnableModelLoadConfigInPresets,
  selectMaxIdleTtlMinutes,
  selectOnlyKeepLastJitModel,
  selectRuntimeAutoUpdate,
  selectRuntimeDownloadChannel,
  selectSeparateReasoningContent,
  selectShowDebugInfoBlocks,
  selectShowResourceConsumptionWidget} from '@features/settings';
import { Icon, Input, Select, Switch, Tooltip } from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { OffOnToggle, PanelLayout, SettingGroup, SettingRow } from '../shared/SettingsPrimitives';

import type { RuntimeDownloadChannel } from '@features/settings';

export function DeveloperPanel() {
  // Experimental settings are advanced controls — gated behind Developer
  // mode so they only appear once the user has explicitly opted in.
  const devMode = useAppSelector(selectDeveloperModeEnabled);
  return (
    <PanelLayout title="Developer">
      <DeveloperModeGroup />
      <JitGroup />
      <LocalLlmServiceGroup />
      <RuntimeSettingsGroup />
      {devMode ? (
        <ExperimentalGroup />
      ) : (
        <p className="px-1 text-xs text-fg-subtle">
          Enable Developer mode above to access experimental settings.
        </p>
      )}
    </PanelLayout>
  );
}

function DeveloperModeGroup() {
  const dispatch = useAppDispatch();
  const enabled = useAppSelector(selectDeveloperModeEnabled);
  return (
    <SettingGroup sectionTitle="Mode">
      <SettingRow label="Developer mode" sub="Shows advanced controls and settings.">
        <OffOnToggle
          checked={enabled}
          onCheckedChange={(v) => dispatch(developerModeEnabledChanged(v))}
        />
      </SettingRow>
    </SettingGroup>
  );
}

function JitGroup() {
  const dispatch = useAppDispatch();
  const onlyKeepLast = useAppSelector(selectOnlyKeepLastJitModel);
  const maxIdleTtl = useAppSelector(selectMaxIdleTtlMinutes);
  return (
    <SettingGroup sectionTitle="On-Demand Loading and Model TTL">
      <SettingRow
        label="JIT models auto-evict"
        sub="Ensure at most 1 model is loaded via JIT at any given time (unloads previous model)"
      >
        <Switch
          checked={onlyKeepLast}
          onCheckedChange={(v) => dispatch(onlyKeepLastJitModelChanged(v))}
          aria-label="JIT models auto-evict"
        />
      </SettingRow>
      <SettingRow
        label="Max idle TTL"
        sub="JIT-loaded models will be automatically unloaded after being idle for the specified duration."
      >
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            value={maxIdleTtl}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10);
              if (Number.isFinite(n)) dispatch(maxIdleTtlMinutesChanged(n));
            }}
            className="w-16"
            aria-label="Max idle TTL minutes"
          />
          <span className="text-sm text-fg-subtle">minutes</span>
        </div>
      </SettingRow>
    </SettingGroup>
  );
}

function LocalLlmServiceGroup() {
  const dispatch = useAppDispatch();
  const enabled = useAppSelector(selectEnableLocalLlmService);
  return (
    <SettingGroup sectionTitle="Local LLM Service (headless)">
      <SettingRow
        label="Enable Local LLM Service"
        sub="Use ZL Universe's LLM server without having to keep the ZL Universe application open"
      >
        <div className="flex items-center gap-2">
          <Tooltip content="Runs ZL Universe as a background service accessible at localhost.">
            <button type="button" className="text-fg-subtle">
              <Icon icon={Question} size="sm" />
            </button>
          </Tooltip>
          <Switch
            checked={enabled}
            onCheckedChange={(v) => dispatch(enableLocalLlmServiceChanged(v))}
            aria-label="Enable Local LLM Service"
          />
        </div>
      </SettingRow>
    </SettingGroup>
  );
}

function RuntimeSettingsGroup() {
  const dispatch = useAppDispatch();
  const channel = useAppSelector(selectRuntimeDownloadChannel);
  const autoUpdate = useAppSelector(selectRuntimeAutoUpdate);
  const autoDeleteLru = useAppSelector(selectAutoDeleteLruRuntimePacks);
  return (
    <SettingGroup sectionTitle="Runtime Settings">
      <SettingRow
        label="ZL Universe Extension Packs Download Channel"
        sub="Update channel for engine and other runtime updates"
      >
        <div className="w-28">
          <Select
            options={[
              { value: 'stable', label: 'Stable' },
              { value: 'beta', label: 'Beta' },
            ]}
            value={channel}
            onChange={(e) =>
              dispatch(runtimeDownloadChannelChanged(e.target.value as RuntimeDownloadChannel))
            }
          />
        </div>
      </SettingRow>
      <SettingRow label="Auto-update selected Runtime Extension Packs">
        <Switch
          checked={autoUpdate}
          onCheckedChange={(v) => dispatch(runtimeAutoUpdateChanged(v))}
          aria-label="Auto-update runtime extension packs"
        />
      </SettingRow>
      <SettingRow label="Auto-delete least recently used Runtime Extension Packs">
        <Switch
          checked={autoDeleteLru}
          onCheckedChange={(v) => dispatch(autoDeleteLruRuntimePacksChanged(v))}
          aria-label="Auto-delete LRU runtime extension packs"
        />
      </SettingRow>
    </SettingGroup>
  );
}

function ExperimentalGroup() {
  const dispatch = useAppDispatch();
  const showDebug = useAppSelector(selectShowDebugInfoBlocks);
  const showWidget = useAppSelector(selectShowResourceConsumptionWidget);
  const enablePresets = useAppSelector(selectEnableModelLoadConfigInPresets);
  const separateReasoning = useAppSelector(selectSeparateReasoningContent);
  return (
    <SettingGroup sectionTitle="Experimental Settings">
      <SettingRow label="Show debug info blocks in chat">
        <Switch
          checked={showDebug}
          onCheckedChange={(v) => dispatch(showDebugInfoBlocksChanged(v))}
          aria-label="Show debug info blocks"
        />
      </SettingRow>
      <SettingRow
        label="Show Resource Consumption Widget"
        sub="Display CPU/RAM usage in the app sidebar footer"
      >
        <Switch
          checked={showWidget}
          onCheckedChange={(v) => dispatch(showResourceConsumptionWidgetChanged(v))}
          aria-label="Show resource consumption widget"
        />
      </SettingRow>
      <SettingRow label="Enable model load configuration support in presets">
        <div className="flex items-center gap-2">
          <Tooltip content="Allows presets to include model load configuration parameters.">
            <button type="button" className="text-fg-subtle">
              <Icon icon={Question} size="sm" />
            </button>
          </Tooltip>
          <Switch
            checked={enablePresets}
            onCheckedChange={(v) => dispatch(enableModelLoadConfigInPresetsChanged(v))}
            aria-label="Enable model load config in presets"
          />
        </div>
      </SettingRow>
      <SettingRow
        label="When applicable, separate `reasoning_content` and `content` in API responses"
        sub="This setting will only work for 'reasoning' models such as DeepSeek R1..."
      >
        <Switch
          checked={separateReasoning}
          onCheckedChange={(v) => dispatch(separateReasoningContentChanged(v))}
          aria-label="Separate reasoning content"
        />
      </SettingRow>
    </SettingGroup>
  );
}
