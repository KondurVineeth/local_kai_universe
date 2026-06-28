import { X } from '@phosphor-icons/react';
import { useCallback, useState, type KeyboardEvent } from 'react';

import { Button, ConfirmDialog, Icon, Textarea } from '@shared/ds/primitives';
import { useAutoFocus } from '@shared/hooks/useAutoFocus';

import { useEscapeKey, useFocusTrap } from '../../hooks/useModalKeyboard';

interface SystemPromptEditorModalProps {
  readonly initial: string;
  readonly onCancel: () => void;
  readonly onSave: (value: string) => void;
}

// Wider modal editor for the system prompt, opened by the "Editor ⌘E" badge
// or by ⌘E inside the inline textarea. Saving commits to chatConfig.config.
//
// CONFIG-015: cancel paths confirm when the draft has unsaved changes, AND
//   overlay-edge clicks no longer dismiss the modal when dirty (clicks
//   inside the dialog body still work). Esc routes through the same
//   confirm path.
// CONFIG-027: Esc handler + focus trap (Tab/Shift+Tab cycle) — shared with
//   InstallPluginDialog via useModalKeyboard hooks.
export function SystemPromptEditorModal({
  initial,
  onCancel,
  onSave,
}: SystemPromptEditorModalProps) {
  const [draft, setDraft] = useState(initial);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const isDirty = draft !== initial;
  // Amend intent: focus with the caret after the existing prompt.
  const promptRef = useAutoFocus<HTMLTextAreaElement>('end');

  const tryCancel = useCallback(() => {
    if (isDirty) {
      setConfirmingDiscard(true);
      return;
    }
    onCancel();
  }, [isDirty, onCancel]);

  useEscapeKey(tryCancel);
  const { ref: dialogRef, onKeyDown: trapKeyDown } = useFocusTrap<HTMLDivElement>();

  const onDialogKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onSave(draft);
      return;
    }
    trapKeyDown(e);
  };

  const tokenEstimate = Math.ceil(draft.length / 4);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal
      aria-label="System Prompt Editor"
      onClick={tryCancel}
    >
      <div
        ref={dialogRef}
        className="flex w-[640px] max-w-[90vw] flex-col gap-3 rounded-md border border-border-default bg-bg-surface p-4"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onDialogKeyDown}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-fg-default">System Prompt</h2>
          <Button variant="ghost" size="sm" iconOnly aria-label="Close editor" onClick={tryCancel}>
            <Icon icon={X} size="sm" />
          </Button>
        </div>
        <Textarea
          ref={promptRef}
          rows={16}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="System prompt"
          placeholder='Example, "Only answer in rhymes"'
        />
        <EditorFooter
          tokenEstimate={tokenEstimate}
          onCancel={tryCancel}
          onSave={() => onSave(draft)}
        />
      </div>
      {confirmingDiscard && (
        <ConfirmDialog
          title="Discard changes?"
          message="Discard unsaved changes to the system prompt?"
          confirmLabel="Discard"
          destructive
          onCancel={() => setConfirmingDiscard(false)}
          onConfirm={() => {
            setConfirmingDiscard(false);
            onCancel();
          }}
        />
      )}
    </div>
  );
}

function EditorFooter({
  tokenEstimate,
  onCancel,
  onSave,
}: {
  readonly tokenEstimate: number;
  readonly onCancel: () => void;
  readonly onSave: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-caption text-fg-subtle">
        ~{tokenEstimate} tokens (characters/4) · ⌘ Enter to save · Esc to cancel
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={onSave}>
          Save
        </Button>
      </div>
    </div>
  );
}
