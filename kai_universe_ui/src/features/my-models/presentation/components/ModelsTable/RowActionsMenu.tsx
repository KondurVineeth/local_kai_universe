import {
  ArrowSquareOut,
  CopySimple,
  PushPin,
  PushPinSlash,
  Trash,
} from '@phosphor-icons/react';
import { type ReactNode, useState } from 'react';

import {
  ejectModelThunk,
  loadModelThunk,
  selectLoadedModelId,
} from '@features/shell';
import {
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Icon,
} from '@shared/ds/primitives';
import { openExternalUrl } from '@shared/lib/openExternalUrl';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { selectMyModelsPinned } from '../../store/selectors';
import { modelUninstalled, pinToggled, rightRailClosed } from '../../store/slice';

import type { Model } from '@shared/domain/model/entities/Model';

interface RowActionsMenuProps {
  readonly model: Model;
  readonly pinned: boolean;
  readonly children: ReactNode;
}

// Matches ZL Universe reference: Pin · Load/Eject · Copy Default Identifier ·
// Copy Absolute Path · Show on Web · Delete. Reveal in Finder was previously
// listed but the IPC bridge for it doesn't exist yet — listing dead buttons
// violates UX rule 1, so it stays out until wired.
export function RowActionsMenu({ model, pinned, children }: RowActionsMenuProps) {
  const dispatch = useAppDispatch();
  const allPinned = useAppSelector(selectMyModelsPinned);
  const loadedModelId = useAppSelector(selectLoadedModelId);
  const isPinned = pinned || allPinned.includes(model.id);
  const isLoaded = loadedModelId === model.id;
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Eject before uninstall if the model is currently loaded — leaving the
  // shell's `loadedModelId` pointing at a soon-to-be-removed model would
  // leave the picker/header advertising a model that no longer exists.
  const onConfirmDelete = () => {
    if (isLoaded) void dispatch(ejectModelThunk());
    dispatch(modelUninstalled(model.id));
    dispatch(rightRailClosed());
    setConfirmingDelete(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <MenuBody
          isPinned={isPinned}
          isLoaded={isLoaded}
          model={model}
          onPin={() => dispatch(pinToggled(model.id))}
          onLoad={() => void dispatch(loadModelThunk(model.id))}
          onEject={() => void dispatch(ejectModelThunk())}
          onAskDelete={() => setConfirmingDelete(true)}
        />
      </DropdownMenu>
      {confirmingDelete && (
        <ConfirmDialog
          title="Delete model?"
          message={`"${model.displayName}" will be removed and its files deleted from disk, freeing the space it used. You can reinstall it from Discover later.${
            isLoaded ? ' The model is currently loaded — it will be ejected first.' : ''
          }`}
          confirmLabel="Delete"
          destructive
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={onConfirmDelete}
        />
      )}
    </>
  );
}

interface MenuBodyProps {
  readonly isPinned: boolean;
  readonly isLoaded: boolean;
  readonly model: Model;
  readonly onPin: () => void;
  readonly onLoad: () => void;
  readonly onEject: () => void;
  readonly onAskDelete: () => void;
}

function MenuBody({ isPinned, isLoaded, model, onPin, onLoad, onEject, onAskDelete }: MenuBodyProps) {
  const onCopyDefault = () => void navigator.clipboard?.writeText(`${model.author}/${model.id}`);
  // Platform-aware path display. Windows users on a future build shouldn't
  // see a hardcoded Unix path. Mock-quality — the real path comes from
  // settings once a models-directory picker ships.
  const onCopyPath = () => {
    const isWindows =
      typeof window !== 'undefined' && window.universe?.platform === 'win32';
    const base = isWindows
      ? `C:\\Users\\you\\.zluniverse\\models\\${model.author}\\${model.id}`
      : `/Users/you/.zluniverse/models/${model.author}/${model.id}`;
    void navigator.clipboard?.writeText(base);
  };
  const onShowOnWeb = () => {
    openExternalUrl(`https://huggingface.co/${model.author}/${model.id}`);
  };

  // Radix portals the menu content to body, but React still bubbles synthetic
  // events through the JSX tree — so a click on any menu item bubbles UP
  // through the trigger into the parent row's onClick, which opens the right
  // rail (BUG-MYMOD-ROW-002). The fix is one onClick on the content wrapper
  // that swallows the bubbled event before it can leave the menu subtree.
  return (
    <DropdownMenuContent align="end" className="min-w-[220px] p-1" onClick={(e) => e.stopPropagation()}>
      <DropdownMenuItem onSelect={onPin}>
        <Icon icon={isPinned ? PushPinSlash : PushPin} size="xs" />
        <span>{isPinned ? 'Unpin' : 'Pin to Top'}</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={isLoaded ? onEject : onLoad}>
        <Icon icon={ArrowSquareOut} size="xs" />
        <span>{isLoaded ? 'Eject' : 'Load'}</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={onCopyDefault}>
        <Icon icon={CopySimple} size="xs" />
        <span>Copy Default Identifier</span>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={onCopyPath}>
        <Icon icon={CopySimple} size="xs" />
        <span>Copy Absolute Path</span>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={onShowOnWeb}>
        <Icon icon={ArrowSquareOut} size="xs" />
        <span>Show on Web</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={onAskDelete} className="text-danger">
        <Icon icon={Trash} size="xs" />
        <span>Delete</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
