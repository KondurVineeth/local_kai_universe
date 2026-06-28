import {
  ArrowCounterClockwise,
  CheckCircle,
  Copy,
  DotsThree,
  FolderOpen,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { selectIsStreamingForSelected } from '@features/chat';
import { onboardingReset } from '@features/onboarding';
import {
  SUPPORTED_LANGUAGES,
  alwaysOpenFullModelLoaderChanged,
  alwaysShowFullModelFileNameChanged,
  languageChanged,
  modelsDirectoryChanged,
  modelsDirectoryReset,
  openDownloadsPaneOnDownloadChanged,
  presetConfirmationChanged,
  selectAlwaysOpenFullModelLoader,
  selectAlwaysShowFullModelFileName,
  selectLanguage,
  selectModelsDirectory,
  selectOpenDownloadsPaneOnDownload,
  selectPresetConfirmation,
  selectUpdateChannel,
  selectUpdateState,
  selectUseHuggingFaceProxy,
  updateChannelChanged,
  updateCheckResolved,
  updateCheckStarted,
  useHuggingFaceProxyChanged,
} from '@features/settings';
import { ejectModelThunk, selectLoadedModelId, selectModelLoadStatus } from '@features/shell';
import {
  Button,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icon,
  Select,
  Spinner,
  Switch,
} from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { PanelLayout, SavedHint, SettingGroup, SettingRow, useTransientFlag } from '../shared/SettingsPrimitives';

import type { SupportedLanguage, UpdateChannel } from '@features/settings';

// External destinations the mock "opens in browser". Honest no-op surrogate
// for shell.openExternal — the renderer simply navigates a new tab/window.
const RELEASE_NOTES_URL = 'https://lmstudio.ai/blog';
const FEEDBACK_URL = 'https://lmstudio.ai/feedback';

function openExternal(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function GeneralPanel() {
  return (
    <PanelLayout title="General">
      <AppUpdateGroup />
      <UserInterfaceGroup />
      <GeneralSettingsGroup />
      <ModelsDirectoryGroup />
      <ReplayOnboardingGroup />
      <AppInfoGroup />
    </PanelLayout>
  );
}

function AppUpdateGroup() {
  const dispatch = useAppDispatch();
  const channel = useAppSelector(selectUpdateChannel);
  const updateState = useAppSelector(selectUpdateState);
  const checking = updateState === 'checking';

  const checkForUpdates = () => {
    dispatch(updateCheckStarted());
    // Mock async probe — beta channel "finds" an update, stable is current.
    window.setTimeout(() => {
      dispatch(updateCheckResolved(channel === 'beta'));
    }, 1200);
  };

  return (
    <SettingGroup sectionTitle="App Updates">
      <SettingRow label="Installed">
        <span className="text-xs text-fg-subtle">ZL Universe&nbsp;&nbsp;0.4.12 (Build 1)</span>
      </SettingRow>
      <SettingRow label="Updates channel">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={checkForUpdates}
            disabled={checking}
            leadingIcon={checking ? <Spinner size="sm" /> : undefined}
          >
            {checking ? 'Checking…' : 'Check for updates'}
          </Button>
          <div className="w-28">
            <Select
              options={[
                { value: 'stable', label: 'Stable' },
                { value: 'beta', label: 'Beta' },
              ]}
              value={channel}
              onChange={(e) => dispatch(updateChannelChanged(e.target.value as UpdateChannel))}
            />
          </div>
        </div>
      </SettingRow>
      <UpdateBanner state={updateState} />
    </SettingGroup>
  );
}

function UpdateBanner({ state }: { readonly state: ReturnType<typeof selectUpdateState> }) {
  if (state === 'idle' || state === 'checking') return null;

  if (state === 'up-to-date') {
    return (
      <div className="mx-4 mb-3 mt-1 flex items-center gap-2 rounded-lg border border-border-default bg-bg-surface p-3">
        <Icon icon={CheckCircle} size="sm" weight="fill" />
        <span className="text-sm text-fg-default">ZL Universe is up to date.</span>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-3 mt-1 rounded-lg border border-accent/30 bg-bg-surface p-4">
      <p className="mb-2 text-sm font-semibold text-fg-default">Update available</p>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-accent/20">
          <span className="text-xs font-bold text-accent">LM</span>
        </div>
        <span className="text-sm text-fg-default">ZL Universe 0.4.13 (build 1)</span>
      </div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => openExternal(RELEASE_NOTES_URL)}
          className="text-xs text-accent hover:underline"
        >
          Release Notes
        </button>
        <Button variant="primary" size="sm" onClick={() => openExternal(RELEASE_NOTES_URL)}>
          Download update
        </Button>
      </div>
    </div>
  );
}

function UserInterfaceGroup() {
  const dispatch = useAppDispatch();
  const language = useAppSelector(selectLanguage);
  return (
    <SettingGroup sectionTitle="Language">
      <SettingRow
        label="App Language"
        sub="Choose app language (still in development)"
      >
        <div className="w-36">
          <Select
            options={[...SUPPORTED_LANGUAGES]}
            value={language}
            onChange={(e) =>
              dispatch(languageChanged(e.target.value as SupportedLanguage))
            }
          />
        </div>
      </SettingRow>
    </SettingGroup>
  );
}

function GeneralSettingsGroup() {
  const dispatch = useAppDispatch();
  const openDownloads = useAppSelector(selectOpenDownloadsPaneOnDownload);
  const alwaysFullLoader = useAppSelector(selectAlwaysOpenFullModelLoader);
  const alwaysFullName = useAppSelector(selectAlwaysShowFullModelFileName);
  const hfProxy = useAppSelector(selectUseHuggingFaceProxy);
  const presetConf = useAppSelector(selectPresetConfirmation);
  return (
    <SettingGroup sectionTitle="Behavior">
      <SettingRow label="Open downloads pane when starting a new model download">
        <Switch
          checked={openDownloads}
          onCheckedChange={(v) => dispatch(openDownloadsPaneOnDownloadChanged(v))}
          aria-label="Open downloads pane on download"
        />
      </SettingRow>
      <SettingRow
        label="Always open full model loader panel"
        sub="Skip the quick picker and open the full model loader instead."
      >
        <Switch
          checked={alwaysFullLoader}
          onCheckedChange={(v) => dispatch(alwaysOpenFullModelLoaderChanged(v))}
          aria-label="Always open full model loader"
        />
      </SettingRow>
      <SettingRow label="My Models: always show full model file name">
        <Switch
          checked={alwaysFullName}
          onCheckedChange={(v) => dispatch(alwaysShowFullModelFileNameChanged(v))}
          aria-label="Always show full model file name"
        />
      </SettingRow>
      <SettingRow
        label="Use ZL Universe's Hugging Face Proxy"
        sub="Route Hugging Face downloads through ZL Universe's proxy for improved reliability and compatibility."
      >
        <Switch
          checked={hfProxy}
          // eslint-disable-next-line react-hooks/rules-of-hooks -- action creator, not a hook (eslint mis-detects `use…` prefix)
          onCheckedChange={(v) => dispatch(useHuggingFaceProxyChanged(v))}
          aria-label="Use Hugging Face proxy"
        />
      </SettingRow>
      <SettingRow
        label="Preset confirmation"
        sub="Display a confirmation dialog before saving new fields to the preset."
      >
        <Switch
          checked={presetConf}
          onCheckedChange={(v) => dispatch(presetConfirmationChanged(v))}
          aria-label="Preset confirmation"
        />
      </SettingRow>
    </SettingGroup>
  );
}

// A picker dialog isn't available in the mock, so "Change…" prompts for the
// path inline — honest about what it can do, and the result actually sticks.
function ModelsDirectoryGroup() {
  const dispatch = useAppDispatch();
  const modelsPath = useAppSelector(selectModelsDirectory);
  const { flag: saved, fire: fireSaved } = useTransientFlag();

  const changePath = () => {
    const next = window.prompt('Models directory path', modelsPath);
    if (next && next.trim() && next.trim() !== modelsPath) {
      dispatch(modelsDirectoryChanged(next.trim()));
      fireSaved();
    }
  };
  const resetPath = () => {
    dispatch(modelsDirectoryReset());
    fireSaved();
  };

  return (
    <SettingGroup sectionTitle="Models Directory">
      <div className="px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <p className="text-xs text-fg-subtle">Model downloads and indexing location</p>
          <SavedHint show={saved} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <code className="truncate font-mono text-xs text-fg-default">{modelsPath}</code>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border-default text-fg-subtle hover:text-fg-default"
                aria-label="Models directory options"
              >
                <Icon icon={DotsThree} size="sm" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={changePath}>Change...</DropdownMenuItem>
              <DropdownMenuItem onSelect={resetPath}>Reset to Default Path</DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => window.alert(`Revealing in Finder:\n${modelsPath}`)}
              >
                Reveal in Finder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </SettingGroup>
  );
}

function ReplayOnboardingGroup() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const loadedId = useAppSelector(selectLoadedModelId);
  const loadStatus = useAppSelector(selectModelLoadStatus);
  const isStreaming = useAppSelector(selectIsStreamingForSelected);
  const [confirming, setConfirming] = useState(false);

  const transient = loadStatus === 'loading' || loadStatus === 'unloading';
  const disabled = isStreaming || transient;
  const reason = isStreaming
    ? 'Finish or stop the current response first.'
    : loadStatus === 'loading'
      ? 'Wait for the current model to finish loading.'
      : loadStatus === 'unloading'
        ? 'Wait for the current model to finish ejecting.'
        : null;

  const doReplay = () => {
    setConfirming(false);
    if (loadedId !== null) void dispatch(ejectModelThunk());
    dispatch(onboardingReset());
    navigate('/onboarding/welcome');
  };

  return (
    <SettingGroup sectionTitle="Onboarding">
      <SettingRow label="Replay first-run wizard" sub={reason ?? 'Ejects current model, re-detects hardware, redoes setup. Mode preserved.'}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirming(true)}
          disabled={disabled}
          leadingIcon={<Icon icon={ArrowCounterClockwise} size="sm" weight="bold" />}
        >
          Replay
        </Button>
      </SettingRow>
      {confirming && (
        <ConfirmDialog
          title="Replay onboarding?"
          message="This will reset hardware detection, recommendations, and starter-model selection. Your installed models stay installed. Your selected mode is preserved."
          confirmLabel="Replay"
          destructive
          onCancel={() => setConfirming(false)}
          onConfirm={doReplay}
        />
      )}
    </SettingGroup>
  );
}

function AppInfoGroup() {
  const appHome = '~/Library/Application Support/ZL Universe';
  const { flag: copied, fire: fireCopied } = useTransientFlag();

  const copyHome = () => {
    void navigator.clipboard?.writeText(appHome);
    fireCopied();
  };

  return (
    <SettingGroup sectionTitle="App">
      <SettingRow label="Open app logs">
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={<Icon icon={FolderOpen} size="sm" />}
          onClick={() => window.alert(`Opening logs folder:\n${appHome}/logs`)}
        >
          Open
        </Button>
      </SettingRow>
      <SettingRow label="App home directory">
        <div className="flex items-center gap-2">
          <SavedHint show={copied} label="Copied" />
          <code className="max-w-48 truncate font-mono text-xs text-fg-subtle">{appHome}</code>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={copyHome}
            aria-label="Copy path"
          >
            <Icon icon={Copy} size="sm" />
          </Button>
        </div>
      </SettingRow>
      <SettingRow label="Report bug or send feedback">
        <Button variant="secondary" size="sm" onClick={() => openExternal(FEEDBACK_URL)}>
          Open in browser ↗
        </Button>
      </SettingRow>
    </SettingGroup>
  );
}
