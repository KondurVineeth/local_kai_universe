import { Copy, Pencil, X } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

import { Button, Icon, Input, Switch } from '@shared/ds/primitives';
import { useAutoFocus } from '@shared/hooks/useAutoFocus';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import {
  selectLocalDevice,
  selectThisDeviceDialogOpen,
} from '../../store/selectors';
import {
  allowModelLoadingToggled,
  localDeviceRenamed,
  thisDeviceDialogClosed,
} from '../../store/slice';

// This Device settings. Earlier version wrapped each of the three
// sections in its own bordered card — that bordered the card, which
// was already bordered by the dialog. Now the dialog itself frames
// everything; sections are separated by whitespace (gap-2xl between,
// gap-s within), Gestalt proximity carries the grouping. Borders
// reserved for the actual interactive controls (input, identifier
// row).
export function ThisDeviceDialog() {
  const open = useAppSelector(selectThisDeviceDialogOpen);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch(thisDeviceDialogClosed());
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, dispatch]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal
      aria-label="This Device"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={() => dispatch(thisDeviceDialogClosed())}
    >
      <div
        className="w-[min(480px,calc(100vw-32px))] overflow-hidden rounded-lg border border-border-default bg-bg-surface shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border-default px-2xl py-m">
          <h2 className="text-xs font-semibold text-fg-default">This Device</h2>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Close"
            onClick={() => dispatch(thisDeviceDialogClosed())}
          >
            <Icon icon={X} size="sm" />
          </Button>
        </header>
        <DialogBody />
        <footer className="flex justify-end border-t border-border-default px-2xl py-m">
          <Button
            variant="primary"
            size="sm"
            onClick={() => dispatch(thisDeviceDialogClosed())}
          >
            Close
          </Button>
        </footer>
      </div>
    </div>
  );
}

function DialogBody() {
  const device = useAppSelector(selectLocalDevice);
  const dispatch = useAppDispatch();
  return (
    <div className="flex flex-col gap-2xl px-2xl py-2xl">
      <Section
        label="Device name"
        helper="Shown to other devices in Remote"
      >
        <NameField name={device.name} onSubmit={(v) => dispatch(localDeviceRenamed(v))} />
      </Section>
      <Section
        label="Device identifier"
        helper="Randomly generated identifier for this device on the network"
      >
        <IdentifierField identifier={device.identifier} />
      </Section>
      <Section
        label="Allow loading models on this machine"
        helper="When off, peers can&rsquo;t discover or load this machine&rsquo;s models."
        trailing={
          <Switch
            checked={device.allowModelLoading}
            onCheckedChange={(v) => dispatch(allowModelLoadingToggled(v))}
            aria-label="Allow loading models on this machine"
          />
        }
      />
    </div>
  );
}

// Generic section row. Two-tier hierarchy: label (text-xs / fg-default)
// + helper (text-caption / fg-subtle). Optional trailing slot for an
// inline control (Switch); otherwise children render underneath the
// helper for compose-style fields (text input, identifier readout).
function Section({
  label,
  helper,
  trailing,
  children,
}: {
  readonly label: string;
  readonly helper: string;
  readonly trailing?: React.ReactNode;
  readonly children?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-m">
      <div className="flex items-start justify-between gap-l">
        <div className="flex flex-col gap-xs">
          <span className="text-xs font-semibold text-fg-default">{label}</span>
          <span className="text-caption text-fg-subtle">{helper}</span>
        </div>
        {trailing}
      </div>
      {children}
    </section>
  );
}

function NameField({
  name,
  onSubmit,
}: {
  readonly name: string;
  readonly onSubmit: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const nameRef = useAutoFocus<HTMLInputElement>('select');
  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) onSubmit(trimmed);
    setEditing(false);
  };
  if (editing) {
    return (
      <Input
        ref={nameRef}
        inputSize="sm"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          else if (e.key === 'Escape') {
            setDraft(name);
            setEditing(false);
          }
        }}
        aria-label="Device name"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        setDraft(name);
        setEditing(true);
      }}
      className="flex items-center justify-between gap-m rounded-md border border-border-default bg-bg-raised px-l py-s text-left text-xs text-fg-default transition-colors hover:border-fg-subtle"
    >
      <span className="truncate">{name}</span>
      <Icon icon={Pencil} size="xs" className="shrink-0 text-fg-subtle" />
    </button>
  );
}

function IdentifierField({ identifier }: { readonly identifier: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    void navigator.clipboard?.writeText(identifier);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="flex items-center justify-between gap-m rounded-md border border-border-default bg-bg-raised px-l py-s">
      <code className="truncate font-mono text-micro text-fg-default">{identifier}</code>
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        aria-label={copied ? 'Copied' : 'Copy identifier'}
        onClick={onCopy}
      >
        <Icon icon={Copy} size="xs" />
      </Button>
    </div>
  );
}
