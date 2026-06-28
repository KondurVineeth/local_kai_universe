import { useEffect, useRef, useState } from 'react';

import { Button, Input } from '@shared/ds/primitives';
import { useAutoFocus } from '@shared/hooks/useAutoFocus';

interface RenameDialogProps {
  readonly initialTitle: string;
  readonly onCancel: () => void;
  readonly onSubmit: (title: string) => void;
}

// Minimal centered dialog for renaming the active chat. We don't have a Dialog
// primitive yet, so this is a raw fixed-overlay modal — single-purpose,
// inexpensive to maintain, and replaceable when @radix-ui/react-dialog lands.
export function RenameDialog({ initialTitle, onCancel, onSubmit }: RenameDialogProps) {
  const [draft, setDraft] = useState(initialTitle);
  // In-flight ref guards against double-submit when the user hammers Enter or
  // double-clicks Save. Without it the parent's onSubmit could fire twice and
  // trigger two renameThread dispatches before the dialog unmounts.
  const submittingRef = useRef(false);
  // Rename = replace intent: focus + select-all so a fresh title overwrites.
  const titleRef = useAutoFocus<HTMLInputElement>('select');

  // Document-level Escape handler — the previous version put it on the
  // overlay div, but `<div>`s don't take keyboard focus by default, so the
  // listener never fired (BUG-CHAT-SPLIT-009 / -010). Mounting on `document`
  // is the cheapest fix without introducing a focus-trap library.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const trimmed = draft.trim();
  const canSubmit = trimmed.length > 0 && trimmed !== initialTitle.trim();

  const handleSubmit = () => {
    if (!canSubmit || submittingRef.current) return;
    submittingRef.current = true;
    onSubmit(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal
      aria-label="Rename chat"
      onClick={onCancel}
    >
      <div
        className="w-[320px] rounded-md border border-border-default bg-bg-surface p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-sm font-medium text-fg-default">Rename chat</h2>
        <Input
          ref={titleRef}
          inputSize="md"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            } else if (e.key === 'Escape') {
              onCancel();
            }
          }}
          aria-label="Chat title"
          className="w-full"
        />
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
