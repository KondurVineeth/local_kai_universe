import {
  ArrowClockwise,
  ArrowRight,
  Copy,
  GitBranch,
  Pencil,
  Trash,
} from '@phosphor-icons/react';

import { selectOnboardingMode } from '@features/onboarding';
import { Button, Icon, Tooltip } from '@shared/ds/primitives';
import { useAppSelector } from '@shared/store/hooks';

interface MessageActionsProps {
  readonly onCopy: () => void;
  readonly copied: boolean;
  readonly onRegenerate?: () => void;
  readonly onContinue?: () => void;
  readonly onBranch?: () => void;
  readonly onEdit?: () => void;
  readonly onDelete?: () => void;
}

// Toolbar order matches ZL Universe: regenerate → continue → branch → copy →
// edit → delete. "Continue" asks the model to keep going from where it
// stopped; "branch" forks a new thread starting at this message.
export function MessageActions({
  onCopy,
  copied,
  onRegenerate,
  onContinue,
  onBranch,
  onEdit,
  onDelete,
}: MessageActionsProps) {
  // User mode hides the advanced actions (regenerate / continue / branch /
  // edit) per ZL Universe's docs — User mode "shows only the chat interface,
  // and auto-configure everything." Copy + Delete remain available because
  // they're table-stakes operations on a chat row.
  const isDeveloper = useAppSelector(selectOnboardingMode) === 'developer';
  return (
    <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100">
      {isDeveloper && onRegenerate && (
        <Tooltip content="Regenerate" side="bottom">
          <Button variant="ghost" size="sm" iconOnly aria-label="Regenerate" onClick={onRegenerate}>
            <Icon icon={ArrowClockwise} size="sm" />
          </Button>
        </Tooltip>
      )}
      {isDeveloper && onContinue && (
        <Tooltip content="Continue" side="bottom">
          <Button variant="ghost" size="sm" iconOnly aria-label="Continue generation" onClick={onContinue}>
            <Icon icon={ArrowRight} size="sm" />
          </Button>
        </Tooltip>
      )}
      {isDeveloper && onBranch && (
        <Tooltip content="Branch" side="bottom">
          <Button variant="ghost" size="sm" iconOnly aria-label="Branch from here" onClick={onBranch}>
            <Icon icon={GitBranch} size="sm" />
          </Button>
        </Tooltip>
      )}
      <Tooltip content={copied ? 'Copied!' : 'Copy'} side="bottom">
        <Button variant="ghost" size="sm" iconOnly aria-label="Copy message" onClick={onCopy}>
          <Icon icon={Copy} size="sm" />
        </Button>
      </Tooltip>
      {isDeveloper && onEdit && (
        <Tooltip content="Edit" side="bottom">
          <Button variant="ghost" size="sm" iconOnly aria-label="Edit message" onClick={onEdit}>
            <Icon icon={Pencil} size="sm" />
          </Button>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip content="Delete" side="bottom">
          <Button variant="ghost" size="sm" iconOnly aria-label="Delete message" onClick={onDelete}>
            <Icon icon={Trash} size="sm" />
          </Button>
        </Tooltip>
      )}
    </div>
  );
}
