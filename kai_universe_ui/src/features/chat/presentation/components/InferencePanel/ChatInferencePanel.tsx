import { Cpu, GearSix } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

import { selectOnboardingMode } from '@features/onboarding';
import { Button, Icon } from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { setInferenceTab } from '../../store/configSlice';
import { selectInferenceTab, selectModelGate } from '../../store/selectors';
import { openModelPickerThunk } from '../../store/thunks';

import { IntegrationsTab } from './IntegrationsTab';
import { PanelTabs } from './PanelTabs';
import { SettingsTab } from './SettingsTab';

// Right Inference Panel container. Top-level toggle between Integrations
// (plugins list) and Settings (preset manager + inference config sections).
//
// CONFIG-022: tab choice lives in the chatConfig slice (persisted) instead
// of useState. A user who customised plugins, navigated away, and came back
// to Settings would lose their tab choice on every Chat re-mount before.
//
// UX-CHAT-003: when no model is loaded, the panel previously rendered every
// inference knob fully active even though they configured a non-existent
// model. Now we keep the tab bar alive (so the user understands the panel's
// purpose hasn't changed) and replace the body with a single empty state
// pointing back to the picker. Clarity rule #1 — never let a control look
// active when it can't actually do anything.
export function ChatInferencePanel() {
  const tab = useAppSelector(selectInferenceTab);
  const { ready } = useAppSelector(selectModelGate);
  const mode = useAppSelector(selectOnboardingMode);
  const dispatch = useAppDispatch();
  const isUserMode = mode === 'user';
  return (
    <aside
      className="flex h-full min-w-0 flex-col border-l border-border-default bg-bg-surface"
      aria-label="Chat right panel"
    >
      {!isUserMode && (
        <PanelTabs tab={tab} onChange={(next) => dispatch(setInferenceTab(next))} />
      )}
      {isUserMode ? (
        <UserModeEmptyState />
      ) : ready ? (
        tab === 'integrations' ? <IntegrationsTab /> : <SettingsTab />
      ) : (
        <InferencePanelEmptyState onLoadModel={() => dispatch(openModelPickerThunk())} />
      )}
    </aside>
  );
}

function UserModeEmptyState() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3xl px-xl py-6 text-center">
      <Icon icon={GearSix} size="xl" className="text-fg-subtle" />
      <div className="flex flex-col items-center gap-m">
        <p className="text-xs font-medium text-fg-default">User mode</p>
        <p className="text-caption text-fg-muted">
          Sampling, system prompt, integrations, and presets are hidden in this
          mode. Switch to Developer mode in Settings to enable them.
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
        Open Settings
      </Button>
    </div>
  );
}

function InferencePanelEmptyState({ onLoadModel }: { readonly onLoadModel: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3xl px-xl py-6 text-center">
      <Icon icon={Cpu} size="xl" className="text-fg-subtle" />
      <div className="flex flex-col items-center gap-m">
        <p className="text-xs font-medium text-fg-default">
          Load a model to configure inference
        </p>
        <p className="text-caption text-fg-muted">
          Sampling, system prompt, integrations, and per-chat notes show up
          once a model is ready.
        </p>
      </div>
      <Button variant="primary" size="sm" onClick={onLoadModel}>
        Load a model
      </Button>
    </div>
  );
}
