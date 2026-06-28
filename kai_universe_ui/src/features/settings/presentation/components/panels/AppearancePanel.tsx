import { ArrowCounterClockwise, Info, XCircle } from '@phosphor-icons/react';

import {
  autoLatchOntoGeneratingMessageChanged,
  chatFontSizeChanged,
  chatFontWeightChanged,
  chatMessagesStyleChanged,
  chatViewModeChanged,
  expandChatContainerToWindowWidthChanged,
  expandReasoningBlocksByDefaultChanged,
  navBarPositionChanged,
  onboardingHintRemoved,
  onboardingHintsReset,
  scrollMessageToTopOnSendChanged,
  showGenInfoChanged,
  showReasoningBlockVignetteChanged,
  showTabStripScrollbarChanged,

  selectAutoLatchOntoGeneratingMessage,
  selectChatFontSize,
  selectChatFontWeight,
  selectChatMessagesStyle,
  selectChatViewMode,
  selectExpandChatContainerToWindowWidth,
  selectExpandReasoningBlocksByDefault,
  selectNavBarPosition,
  selectOnboardingHintsSettings,
  selectScrollMessageToTopOnSend,
  selectShowGenInfo,
  selectShowReasoningBlockVignette,
  selectShowTabStripScrollbar} from '@features/settings';
import { Button, Icon, Select, Slider, Switch, Tooltip } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { PanelLayout, SettingGroup, SettingRow } from '../shared/SettingsPrimitives';

import type {
  ChatFontWeight,
  ChatMessagesStyle,
  ChatViewMode,
  NavBarPosition,
  ShowGenInfo,
} from '@features/settings';

export function AppearancePanel() {
  return (
    <PanelLayout title="Appearance">
      <NavBarGroup />
      <ChatStyleGroup />
      <ReasoningGroup />
      <OnboardingHintsGroup />
    </PanelLayout>
  );
}

function NavBarGroup() {
  const dispatch = useAppDispatch();
  const navBarPosition = useAppSelector(selectNavBarPosition);
  return (
    <SettingGroup sectionTitle="Navigation">
      <SettingRow label="Navigation Bar position">
        <div className="w-32">
          <Select
            options={[
              { value: 'left', label: 'Left' },
              { value: 'right', label: 'Right' },
            ]}
            value={navBarPosition}
            onChange={(e) => dispatch(navBarPositionChanged(e.target.value as NavBarPosition))}
          />
        </div>
      </SettingRow>
    </SettingGroup>
  );
}

function ChatStyleGroup() {
  return (
    <SettingGroup sectionTitle="Chat Style">
      <ChatViewModeRows />
      <ChatFontRows />
      <ChatBehaviorRows />
    </SettingGroup>
  );
}

function ChatViewModeRows() {
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector(selectChatViewMode);
  const showTabScrollbar = useAppSelector(selectShowTabStripScrollbar);
  return (
    <>
      <SettingRow label="View Mode">
        <div className="w-32">
          <Select
            options={[
              { value: 'markdown', label: 'Markdown' },
              { value: 'plain', label: 'Plain' },
            ]}
            value={viewMode}
            onChange={(e) => dispatch(chatViewModeChanged(e.target.value as ChatViewMode))}
          />
        </div>
      </SettingRow>
      <SettingRow label="Show tab strip scrollbar">
        <Switch
          checked={showTabScrollbar}
          onCheckedChange={(v) => dispatch(showTabStripScrollbarChanged(v))}
          aria-label="Show tab strip scrollbar"
        />
      </SettingRow>
    </>
  );
}

// Mirrors fontSizeToTextClass in the chat feature — keeps the slider label
// honest about which discrete text size a given slider position resolves to.
function fontSizeLabel(fontSize: number): string {
  if (fontSize < 25) return 'Small';
  if (fontSize < 63) return 'Default';
  if (fontSize < 88) return 'Large';
  return 'Extra large';
}

function ChatFontRows() {
  const dispatch = useAppDispatch();
  const fontSize = useAppSelector(selectChatFontSize);
  const fontWeight = useAppSelector(selectChatFontWeight);
  return (
    <>
      <SettingRow label="Font Size">
        <div className="flex items-center gap-2">
          <div className="w-32">
            <Slider
              min={0}
              max={100}
              step={1}
              value={fontSize}
              onValueChange={(v) => dispatch(chatFontSizeChanged(v))}
              aria-label="Chat font size"
            />
          </div>
          <span className="w-20 text-right text-xs tabular-nums text-fg-subtle">
            {fontSizeLabel(fontSize)}
          </span>
          <button
            type="button"
            onClick={() => dispatch(chatFontSizeChanged(50))}
            className="text-fg-subtle hover:text-fg-default"
            aria-label="Reset font size"
          >
            <Icon icon={ArrowCounterClockwise} size="sm" />
          </button>
        </div>
      </SettingRow>
      <SettingRow label="Font Weight">
        <div className="w-32">
          <Select
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'medium', label: 'Medium' },
              { value: 'bold', label: 'Bold' },
            ]}
            value={fontWeight}
            onChange={(e) => dispatch(chatFontWeightChanged(e.target.value as ChatFontWeight))}
          />
        </div>
      </SettingRow>
    </>
  );
}

function ChatBehaviorRows() {
  const dispatch = useAppDispatch();
  const showGenInfo = useAppSelector(selectShowGenInfo);
  const scrollToTop = useAppSelector(selectScrollMessageToTopOnSend);
  const autoLatch = useAppSelector(selectAutoLatchOntoGeneratingMessage);
  const messagesStyle = useAppSelector(selectChatMessagesStyle);
  const expandWidth = useAppSelector(selectExpandChatContainerToWindowWidth);
  return (
    <>
      <SettingRow label="Show Gen Info">
        <div className="flex items-center gap-1.5">
          <Tooltip content="Controls when generation statistics are shown below messages.">
            <button type="button" className="text-fg-subtle">
              <Icon icon={Info} size="sm" />
            </button>
          </Tooltip>
          <div className="w-44">
            <Select
              options={[
                { value: 'last-message-only', label: 'Last message only' },
                { value: 'all', label: 'All' },
                { value: 'none', label: 'None' },
              ]}
              value={showGenInfo}
              onChange={(e) => dispatch(showGenInfoChanged(e.target.value as ShowGenInfo))}
            />
          </div>
        </div>
      </SettingRow>
      <SettingRow label="Scroll message to top on send">
        <Switch
          checked={scrollToTop}
          onCheckedChange={(v) => dispatch(scrollMessageToTopOnSendChanged(v))}
          aria-label="Scroll message to top on send"
        />
      </SettingRow>
      <SettingRow label="↳ Auto-latch onto generating message" labelClass="text-fg-subtle">
        <Switch
          checked={autoLatch}
          onCheckedChange={(v) => dispatch(autoLatchOntoGeneratingMessageChanged(v))}
          aria-label="Auto-latch onto generating message"
        />
      </SettingRow>
      <SettingRow label="Chat messages style">
        <ChatStyleToggle value={messagesStyle} onChange={(v) => dispatch(chatMessagesStyleChanged(v))} />
      </SettingRow>
      <SettingRow label="Expand chat container to window width">
        <Switch
          checked={expandWidth}
          onCheckedChange={(v) => dispatch(expandChatContainerToWindowWidthChanged(v))}
          aria-label="Expand chat container to window width"
        />
      </SettingRow>
    </>
  );
}

function ChatStyleToggle({
  value,
  onChange,
}: {
  readonly value: ChatMessagesStyle;
  readonly onChange: (v: ChatMessagesStyle) => void;
}) {
  return (
    <div className="flex overflow-hidden rounded-md border border-border-default text-xs font-medium">
      {(['bubble', 'block'] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            'px-3 py-1 capitalize transition-colors',
            value === opt
              ? 'bg-accent text-fg-default'
              : 'bg-bg-raised text-fg-default hover:bg-bg-raised/80',
          )}
        >
          {opt.charAt(0).toUpperCase() + opt.slice(1)}
        </button>
      ))}
    </div>
  );
}

function ReasoningGroup() {
  const dispatch = useAppDispatch();
  const expandByDefault = useAppSelector(selectExpandReasoningBlocksByDefault);
  const showVignette = useAppSelector(selectShowReasoningBlockVignette);
  return (
    <SettingGroup sectionTitle="Reasoning">
      <SettingRow label="Expand reasoning blocks by default">
        <Switch
          checked={expandByDefault}
          onCheckedChange={(v) => dispatch(expandReasoningBlocksByDefaultChanged(v))}
          aria-label="Expand reasoning blocks by default"
        />
      </SettingRow>
      <SettingRow label="Show reasoning block vignette">
        <Switch
          checked={showVignette}
          onCheckedChange={(v) => dispatch(showReasoningBlockVignetteChanged(v))}
          aria-label="Show reasoning block vignette"
        />
      </SettingRow>
    </SettingGroup>
  );
}

function OnboardingHintsGroup() {
  const dispatch = useAppDispatch();
  const hints = useAppSelector(selectOnboardingHintsSettings);
  return (
    <SettingGroup sectionTitle="Onboarding Hints">
      <SettingRow label="Reset onboarding dialogs">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => dispatch(onboardingHintsReset())}
        >
          Reset all
        </Button>
      </SettingRow>
      {hints.map((hint) => (
        <div
          key={hint}
          className="flex items-center justify-between border-t border-border-default px-4 py-3 first:border-t-0"
        >
          <span className="text-sm text-fg-subtle">{hint}</span>
          <button
            type="button"
            onClick={() => dispatch(onboardingHintRemoved(hint))}
            className="text-fg-subtle hover:text-fg-default"
            aria-label={`Remove hint: ${hint}`}
          >
            <Icon icon={XCircle} size="sm" />
          </button>
        </div>
      ))}
    </SettingGroup>
  );
}
