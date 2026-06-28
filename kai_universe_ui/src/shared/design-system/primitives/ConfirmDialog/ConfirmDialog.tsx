import { useEffect, useRef } from 'react';

import { Button } from '@shared/ds/primitives';

interface ConfirmDialogProps {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly destructive?: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

// Lightweight confirm modal. Used to gate destructive actions (delete chat,
// delete folder) so a single misclick can't wipe a long conversation. We
// reach for a real Dialog primitive when one lands; for now this is a
// purpose-built overlay matching the existing RenameDialog style.
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Document-level Escape handler — overlays attached to a non-focusable
  // <div> never receive keydown events without explicit focus, so the
  // previous version silently failed (BUG-CHAT-SPLIT-010).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel();
        return;
      }
      // Minimal focus trap — Tab cycles between Cancel and Confirm. We don't
      // wire any other focusable elements yet, so a two-element loop covers
      // the surface. If we add a "Don't ask again" checkbox later, extend.
      if (e.key === 'Tab') {
        const cancel = cancelRef.current;
        const confirm = confirmRef.current;
        if (!cancel || !confirm) return;
        const active = document.activeElement;
        if (e.shiftKey) {
          if (active === cancel) {
            e.preventDefault();
            confirm.focus();
          }
        } else if (active === confirm) {
          e.preventDefault();
          cancel.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  // For destructive variants the safer default is to put initial focus on
  // Cancel — pressing Enter (a common reflex after typing in the previous
  // surface) shouldn't instantly destroy data (BUG-CHAT-SPLIT-010).
  useEffect(() => {
    if (destructive) cancelRef.current?.focus();
    else confirmRef.current?.focus();
  }, [destructive]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal
      aria-label={title}
      onClick={onCancel}
    >
      <div
        className="w-[360px] rounded-md border border-border-default bg-bg-surface p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-sm font-medium text-fg-default">{title}</h2>
        <p className="mb-4 text-xs text-fg-muted">{message}</p>
        <div className="flex justify-end gap-2">
          <Button ref={cancelRef} variant="secondary" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            variant={destructive ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
