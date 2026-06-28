import { ArrowsClockwise, Eraser, GearSix } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Icon } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';

import { usePopoverKeyboard } from './usePopoverKeyboard';

export interface SlashCommand {
  readonly id: string;
  readonly name: string; // displayed without the leading `/`
  readonly description: string;
  readonly icon: typeof Eraser;
}

// Command registry. Keep additions here aligned with the handler switch
// in ChatInputDock — both reference the `id` string.
export const SLASH_COMMANDS: readonly SlashCommand[] = [
  {
    id: 'clear',
    name: 'clear',
    description: 'Wipe this chat\'s messages (keeps the thread, notes, attachments)',
    icon: Eraser,
  },
  {
    id: 'system',
    name: 'system',
    description: 'Open the System Prompt panel in the right rail',
    icon: GearSix,
  },
  {
    id: 'regen',
    name: 'regen',
    description: 'Regenerate the last assistant reply',
    icon: ArrowsClockwise,
  },
];

// Inline command picker. Triggered by the user starting a draft with `/`.
// Selecting one fires the parent's `onPick` handler which executes the
// command and clears the composer. Keyboard: ↑/↓ to cycle, Enter picks,
// Esc closes.
export function SlashCommandPopover({
  query,
  onPick,
  onClose,
  // Command ids that are currently unavailable, mapped to the reason shown
  // as helper text. `/regen` lands here on a thread with no assistant reply
  // so the command no longer silently no-ops.
  disabledReasons = {},
}: {
  readonly query: string;
  readonly onPick: (command: SlashCommand) => void;
  readonly onClose: () => void;
  readonly disabledReasons?: Readonly<Record<string, string>>;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return SLASH_COMMANDS;
    return SLASH_COMMANDS.filter((c) => c.name.startsWith(q));
  }, [query]);
  const [focusedIdx, setFocusedIdx] = useState(0);
  useEffect(() => {
    setFocusedIdx(0);
  }, [filtered.length]);

  // Wrap onPick so a disabled command can't be activated via keyboard Enter
  // or click — the row stays visible (with its reason) but is inert.
  const pickIfEnabled = (cmd: SlashCommand) => {
    if (disabledReasons[cmd.id]) return;
    onPick(cmd);
  };

  usePopoverKeyboard({
    containerRef,
    items: filtered,
    focusedIdx,
    setFocusedIdx,
    onPick: pickIfEnabled,
    onClose,
  });

  useEffect(() => {
    itemRefs.current[focusedIdx]?.scrollIntoView({ block: 'nearest' });
  }, [focusedIdx]);

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-0 right-0 mb-2 max-h-[280px] overflow-y-auto rounded-md border border-border-default bg-bg-raised shadow-lg"
      role="listbox"
      aria-label="Slash commands"
    >
      <div className="border-b border-border-default px-2 py-1.5 text-caption font-semibold uppercase tracking-wide text-fg-subtle">
        Commands
      </div>
      {filtered.length === 0 && (
        // BUG-CHAT-COMPOSE-020: empty filter result used to render nothing;
        // surface a "no command matches" row so `/xyz` doesn't look broken.
        <p className="px-2 py-2 text-caption text-fg-subtle">
          No command matches “/{query}”.
        </p>
      )}
      <ul className="flex flex-col gap-0.5 p-1">
        {filtered.map((c, idx) => (
          <SlashCommandRow
            key={c.id}
            command={c}
            focused={idx === focusedIdx}
            disabledReason={disabledReasons[c.id]}
            buttonRef={(el) => {
              itemRefs.current[idx] = el;
            }}
            onClick={() => pickIfEnabled(c)}
            onHover={() => setFocusedIdx(idx)}
          />
        ))}
      </ul>
    </div>
  );
}

function SlashCommandRow({
  command,
  focused,
  disabledReason,
  buttonRef,
  onClick,
  onHover,
}: {
  readonly command: SlashCommand;
  readonly focused: boolean;
  readonly disabledReason: string | undefined;
  readonly buttonRef: (el: HTMLButtonElement | null) => void;
  readonly onClick: () => void;
  readonly onHover: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        ref={buttonRef}
        onClick={onClick}
        onMouseEnter={onHover}
        disabled={!!disabledReason}
        className={cn(
          'flex w-full items-start gap-m rounded-md px-2 py-1.5 text-left text-xs',
          'text-fg-default hover:bg-bg-surface',
          focused && !disabledReason && 'bg-bg-surface',
          disabledReason && 'cursor-not-allowed opacity-50',
        )}
      >
        <Icon icon={command.icon} size="xs" className="text-fg-muted" />
        <div className="flex min-w-0 flex-col">
          <span className="font-mono text-xs text-fg-default">/{command.name}</span>
          <span className="text-caption text-fg-subtle">
            {disabledReason ?? command.description}
          </span>
        </div>
      </button>
    </li>
  );
}
