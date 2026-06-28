import { Question } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';

import { Icon, Textarea } from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { setConfigField } from '../../store/configSlice';
import {
  selectInferenceConfig,
  selectPanelScrollRequest,
} from '../../store/selectors';

import { PanelSection } from './PanelSection';
import { SystemPromptEditorModal } from './SystemPromptEditorModal';

const PLACEHOLDER = 'Example, "Only answer in rhymes"';

// Soft cap surfaces a warning to the user when their prompt is approaching
// what most chat models can usefully attend to — not a hard limit, just a
// signal. (CONFIG-013)
const SOFT_PROMPT_CAP = 8000;

// CONFIG-013: rename the user-visible label so it stops promising "tokens"
// when it's just a length/4 heuristic. Non-Latin scripts don't tokenize at
// 1 token per ~4 chars; the new label is honest about the methodology.
function estimateUnits(text: string): number {
  return Math.ceil(text.length / 4);
}

// Scrolls the panel into view when the `/system` slash command bumps the
// per-panel scroll-request counter. Returns the ref to attach to the root.
function useScrollIntoViewOnRequest(): React.MutableRefObject<HTMLDivElement | null> {
  const scrollRequest = useAppSelector(selectPanelScrollRequest('systemPrompt'));
  const rootRef = useRef<HTMLDivElement | null>(null);
  const lastReqRef = useRef(scrollRequest);
  useEffect(() => {
    if (scrollRequest === lastReqRef.current) return;
    lastReqRef.current = scrollRequest;
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [scrollRequest]);
  return rootRef;
}

export function SystemPromptPanel() {
  const config = useAppSelector(selectInferenceConfig);
  const dispatch = useAppDispatch();
  const [editorOpen, setEditorOpen] = useState(false);
  // CONFIG-016: keep a local draft for the inline textarea and only commit
  // to the slice on blur. Per-keystroke dispatches were marking the active
  // preset "Custom" on the very first letter (because setConfigField blanks
  // currentPresetId on a divergent value), which forced the user back into
  // a save loop just to open the dropdown.
  const [draft, setDraft] = useState(config.systemPrompt);
  useEffect(() => {
    // Resync if the slice changes from elsewhere (preset apply, modal save).
    setDraft(config.systemPrompt);
  }, [config.systemPrompt]);

  const summary =
    config.systemPrompt.trim().length > 0
      ? `${config.systemPrompt.trim().slice(0, 40)}…`
      : 'No system prompt set';

  const commitDraft = () => {
    if (draft !== config.systemPrompt) {
      dispatch(setConfigField({ key: 'systemPrompt', value: draft }));
    }
  };

  const save = (next: string) => {
    dispatch(setConfigField({ key: 'systemPrompt', value: next }));
    setDraft(next);
    setEditorOpen(false);
  };

  const units = estimateUnits(draft);
  const overSoftCap = draft.length > SOFT_PROMPT_CAP;
  // `/system` slash command bumps a counter; scroll the panel into view.
  const rootRef = useScrollIntoViewOnRequest();

  return (
    <div ref={rootRef}>
    <PanelSection panelKey="systemPrompt" title="System Prompt" summary={summary}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-micro font-medium text-fg-default">System Prompt</span>
          <button
            type="button"
            onClick={() => setEditorOpen(true)}
            className="rounded-md border border-border-default bg-bg-raised px-2 py-0.5 text-caption text-fg-muted hover:text-fg-default"
            aria-label="Open editor"
          >
            Editor ⌘E
          </button>
        </div>
        <Textarea
          rows={5}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            // CONFIG-014: when the modal is open, swallow Cmd/Ctrl+E so it
            // doesn't re-open / type "e" into the textarea behind a stale
            // modal. The modal owns the shortcut while it's mounted.
            if ((e.metaKey || e.ctrlKey) && (e.key === 'e' || e.key === 'E')) {
              e.preventDefault();
              if (!editorOpen) setEditorOpen(true);
            }
          }}
          placeholder={PLACEHOLDER}
          aria-label="System prompt"
        />
        <div className="flex items-center justify-between gap-1 text-caption text-fg-subtle">
          {overSoftCap ? (
            <span className="text-warning">
              Long prompt — over {SOFT_PROMPT_CAP.toLocaleString()} characters may push other context out.
            </span>
          ) : (
            <span />
          )}
          <span className="inline-flex items-center gap-1">
            <span>~{units} tokens (characters/4)</span>
            <Icon icon={Question} size="xs" />
          </span>
        </div>
      </div>
      {editorOpen && (
        <SystemPromptEditorModal
          initial={config.systemPrompt}
          onCancel={() => setEditorOpen(false)}
          onSave={save}
        />
      )}
    </PanelSection>
    </div>
  );
}
