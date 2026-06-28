import { CaretDown, FloppyDisk, Trash } from '@phosphor-icons/react';
import { useState } from 'react';

import {
  Button,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Icon,
  Input,
  Tooltip,
} from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { applyPreset, deletePreset, saveAsPreset } from '../../store/configSlice';
import { selectCurrentPresetId, selectPresets } from '../../store/selectors';

import type { Preset } from '../../../domain/entities/Preset';

export function PresetManager() {
  const presets = useAppSelector(selectPresets);
  const currentId = useAppSelector(selectCurrentPresetId);
  const dispatch = useAppDispatch();
  const [saving, setSaving] = useState(false);
  const [draftName, setDraftName] = useState('');
  // Deferred-confirm state. `pendingApplyId` holds the preset id awaiting a
  // discard-unsaved-changes confirm; `pendingDeleteId` holds the custom
  // preset awaiting a delete confirm. Replaces two `window.confirm` calls
  // with the shared ConfirmDialog primitive.
  const [pendingApplyId, setPendingApplyId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const current = presets.find((p) => p.id === currentId);
  const label = current ? current.name : 'Custom';
  // CONFIG-010: dirty = the user has edits not captured in any saved preset.
  // `currentPresetId === ''` is the slice's signal for "Custom" — set by
  // setConfigField when the new value diverges from the active preset's
  // value. We block apply in that state behind a confirm.
  const isDirty = currentId === '';

  const onSave = () => {
    if (!draftName.trim()) return;
    dispatch(saveAsPreset(draftName));
    setDraftName('');
    setSaving(false);
  };

  const onApply = (id: string) => {
    if (isDirty) {
      setPendingApplyId(id);
      return;
    }
    dispatch(applyPreset(id));
  };

  const pendingDeletePreset = presets.find((p) => p.id === pendingDeleteId);

  return (
    <div className="flex shrink-0 flex-col gap-2 border-b border-border-default px-3 py-2">
      <div className="flex items-center gap-2">
        <PresetDropdown
          label={label}
          presets={presets}
          onApply={onApply}
          onDelete={setPendingDeleteId}
        />
        <Tooltip content="Save current as preset" side="bottom">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Save preset"
            onClick={() => setSaving((v) => !v)}
          >
            <Icon icon={FloppyDisk} size="sm" />
          </Button>
        </Tooltip>
      </div>
      {saving && (
        <SaveRow
          value={draftName}
          onChange={setDraftName}
          onSave={onSave}
          onCancel={() => setSaving(false)}
        />
      )}
      <PresetConfirmDialogs
        pendingApplyId={pendingApplyId}
        pendingDeletePreset={pendingDeletePreset}
        onClearApply={() => setPendingApplyId(null)}
        onClearDelete={() => setPendingDeleteId(null)}
        onConfirmApply={(id) => {
          dispatch(applyPreset(id));
          setPendingApplyId(null);
        }}
        onConfirmDelete={(id) => {
          dispatch(deletePreset(id));
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}

// The deferred-confirm dialogs for preset apply/delete — extracted to keep
// PresetManager under the line cap.
function PresetConfirmDialogs({
  pendingApplyId,
  pendingDeletePreset,
  onClearApply,
  onClearDelete,
  onConfirmApply,
  onConfirmDelete,
}: {
  readonly pendingApplyId: string | null;
  readonly pendingDeletePreset: Preset | undefined;
  readonly onClearApply: () => void;
  readonly onClearDelete: () => void;
  readonly onConfirmApply: (id: string) => void;
  readonly onConfirmDelete: (id: string) => void;
}) {
  return (
    <>
      {pendingApplyId && (
        <ConfirmDialog
          title="Discard unsaved changes?"
          message="You have unsaved changes. Applying this preset will discard them."
          confirmLabel="Apply preset"
          onCancel={onClearApply}
          onConfirm={() => onConfirmApply(pendingApplyId)}
        />
      )}
      {pendingDeletePreset && (
        <ConfirmDialog
          title="Delete preset?"
          message={`"${pendingDeletePreset.name}" will be permanently removed. This can't be undone.`}
          confirmLabel="Delete"
          destructive
          onCancel={onClearDelete}
          onConfirm={() => onConfirmDelete(pendingDeletePreset.id)}
        />
      )}
    </>
  );
}

function PresetDropdown({
  label,
  presets,
  onApply,
  onDelete,
}: {
  readonly label: string;
  readonly presets: readonly Preset[];
  readonly onApply: (id: string) => void;
  readonly onDelete: (id: string) => void;
}) {
  const builtIns = presets.filter((p) => p.builtIn);
  const customs = presets.filter((p) => !p.builtIn);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex flex-1 items-center justify-between rounded-md bg-bg-raised px-2 py-1.5 text-xs text-fg-default hover:bg-bg-raised/80"
          aria-label="Select preset"
        >
          <span className="truncate">{label}</span>
          <Icon icon={CaretDown} size="xs" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[200px]">
        <DropdownMenuLabel>Built-in</DropdownMenuLabel>
        {builtIns.map((p) => (
          // Built-in presets are uneditable/undeletable — no per-row delete
          // button, just a click-to-apply row. (CONFIG-009/011 intent)
          <DropdownMenuItem key={p.id} onSelect={() => onApply(p.id)}>
            {p.name}
          </DropdownMenuItem>
        ))}
        {customs.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Custom</DropdownMenuLabel>
            {customs.map((p) => (
              <CustomPresetRow key={p.id} preset={p} onApply={onApply} onDelete={onDelete} />
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CustomPresetRow({
  preset,
  onApply,
  onDelete,
}: {
  readonly preset: Preset;
  readonly onApply: (id: string) => void;
  readonly onDelete: (id: string) => void;
}) {
  return (
    <DropdownMenuItem
      onSelect={() => onApply(preset.id)}
      className="flex items-center justify-between gap-2"
    >
      <span className="flex-1 truncate">{preset.name}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          // Hand off to the parent's ConfirmDialog gate — the slice falls
          // back to Default but the user-built config snapshot is
          // irrecoverable, so deletion stays behind a confirm.
          onDelete(preset.id);
        }}
        className="text-fg-subtle hover:text-danger"
        aria-label={`Delete preset ${preset.name}`}
      >
        <Icon icon={Trash} size="xs" />
      </button>
    </DropdownMenuItem>
  );
}

function SaveRow({
  value,
  onChange,
  onSave,
  onCancel,
}: {
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly onSave: () => void;
  readonly onCancel: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Input
        inputSize="sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Preset name"
        aria-label="New preset name"
        className="flex-1"
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave();
          else if (e.key === 'Escape') onCancel();
        }}
      />
      <Button variant="primary" size="sm" onClick={onSave} disabled={!value.trim()}>
        Save
      </Button>
    </div>
  );
}
