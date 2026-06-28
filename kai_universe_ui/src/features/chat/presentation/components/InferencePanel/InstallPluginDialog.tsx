import { useState } from 'react';

import { Button, Input, Textarea } from '@shared/ds/primitives';

import { useEscapeKey, useFocusTrap } from '../../hooks/useModalKeyboard';

interface InstallPluginDialogProps {
  readonly onCancel: () => void;
  readonly onInstall: (input: { name: string; description: string }) => void;
  // CONFIG-020: caller supplies the existing-plugin name set so we can
  // reject duplicates inline (case-insensitive). Optional — if undefined
  // the dialog falls back to allowing anything (matches old behavior).
  readonly existingNames?: readonly string[];
}

// Mock install dialog. A real implementation would talk to a plugin
// registry — here we just append a record to the slice's available list and
// auto-enable it for the active session.
//
// CONFIG-020: rejects duplicate plugin names case-insensitively.
// CONFIG-027: Esc handler + focus trap shared with SystemPromptEditorModal.
export function InstallPluginDialog({ onCancel, onInstall, existingNames }: InstallPluginDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { ref: dialogRef, onKeyDown: trapKeyDown } = useFocusTrap<HTMLDivElement>();
  useEscapeKey(onCancel);

  const trimmed = name.trim();
  const lowerExisting = (existingNames ?? []).map((n) => n.trim().toLowerCase());
  const isDuplicate = trimmed.length > 0 && lowerExisting.includes(trimmed.toLowerCase());
  const canSubmit = trimmed.length > 0 && !isDuplicate;

  const submit = () => {
    if (!canSubmit) return;
    onInstall({ name: trimmed, description: description.trim() });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal
      aria-label="Install plugin"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        className="flex w-[380px] flex-col gap-3 rounded-md border border-border-default bg-bg-surface p-4"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={trapKeyDown}
      >
        <h2 className="text-sm font-medium text-fg-default">Install plugin</h2>
        <label className="flex flex-col gap-1 text-caption text-fg-muted">
          Name
          <Input
            inputSize="sm"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Awesome Plugin"
            aria-label="Plugin name"
            aria-invalid={isDuplicate ? true : undefined}
            className="w-full"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
          />
          {isDuplicate && (
            <span className="text-caption text-danger" role="alert">
              A plugin with this name is already installed.
            </span>
          )}
        </label>
        <label className="flex flex-col gap-1 text-caption text-fg-muted">
          Description
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this plugin do?"
            aria-label="Plugin description"
          />
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={submit} disabled={!canSubmit}>
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}
